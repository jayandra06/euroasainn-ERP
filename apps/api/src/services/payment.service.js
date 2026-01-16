import { Payment, PaymentStatus, PaymentType } from '../models/payment.model';
import { Organization } from '../models/organization.model';
import { User } from '../models/user.model';
import { OrganizationType, PortalType } from '../../../../packages/shared/src/types/index';
import { licenseService } from './license.service';
import { emailService } from './email.service';
import { razorpayService } from './razorpay.service';
import { logger } from '../config/logger';
import mongoose from 'mongoose';
export class PaymentService {
    async createPayment(data) {
        // Get organization and user to determine types
        const organization = await Organization.findById(data.organizationId);
        if (!organization) {
            throw new Error('Organization not found');
        }
        const user = await User.findById(data.userId);
        if (!user) {
            throw new Error('User not found');
        }
        // Calculate subscription period (default: 1 year)
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        const payment = new Payment({
            organizationId: new mongoose.Types.ObjectId(data.organizationId),
            organizationType: organization.type,
            portalType: user.portalType,
            userId: new mongoose.Types.ObjectId(data.userId),
            amount: data.amount,
            currency: data.currency || 'INR', // Default to INR for Razorpay
            paymentType: data.paymentType || PaymentType.SUBSCRIPTION,
            status: PaymentStatus.PENDING,
            paymentMethod: data.paymentMethod || 'razorpay',
            description: data.description || `Subscription payment for ${organization.name}`,
            subscriptionPeriod: {
                startDate,
                endDate,
            },
            metadata: data.metadata,
        });
        await payment.save();
        logger.info(`💳 Payment created: ${payment._id} for organization ${organization.name}`);
        // Create Razorpay order
        if (razorpayService) {
            try {
                const razorpayOrder = await razorpayService.createOrder({
                    amount: data.amount,
                    currency: data.currency || 'INR',
                    receipt: `payment_${payment._id}`,
                    notes: {
                        paymentId: payment._id.toString(),
                        organizationId: data.organizationId,
                        userId: data.userId,
                    },
                });
                // Update payment with Razorpay order ID
                payment.transactionId = razorpayOrder.id;
                payment.gatewayResponse = razorpayOrder;
                payment.paymentGateway = 'razorpay';
                await payment.save();
                logger.info(`✅ Razorpay order created: ${razorpayOrder.id} for payment ${payment._id}`);
                return {
                    payment,
                    razorpayOrder: {
                        id: razorpayOrder.id,
                        amount: razorpayOrder.amount,
                        currency: razorpayOrder.currency,
                        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag',
                    },
                };
            }
            catch (error) {
                logger.error(`❌ Failed to create Razorpay order for payment ${payment._id}:`, error);
                // Return payment without Razorpay order if gateway fails
                return { payment };
            }
        }
        else {
            logger.warn('⚠️ Razorpay service not available, returning payment without order');
            return { payment };
        }
    }
    async updatePaymentStatus(paymentId, status, transactionId, gatewayResponse) {
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            throw new Error('Payment not found');
        }
        const oldStatus = payment.status;
        payment.status = status;
        if (transactionId) {
            payment.transactionId = transactionId;
        }
        if (gatewayResponse) {
            payment.gatewayResponse = gatewayResponse;
        }
        await payment.save();
        logger.info(`💳 Payment ${paymentId} status updated: ${oldStatus} -> ${status}`);
        // If payment is successful, create license and send email
        if (status === PaymentStatus.SUCCESS && oldStatus !== PaymentStatus.SUCCESS) {
            await this.handleSuccessfulPayment(payment);
        }
        // Send email notifications
        await this.sendPaymentStatusEmail(payment, status);
        return payment;
    }
    async handleSuccessfulPayment(payment) {
        try {
            // Check if license already exists for this payment
            if (payment.licenseId) {
                logger.info(`License already exists for payment ${payment._id}`);
                return;
            }
            // Get organization to determine license limits
            const organization = await Organization.findById(payment.organizationId);
            if (!organization) {
                throw new Error('Organization not found');
            }
            // Create license
            const expiresAt = payment.subscriptionPeriod?.endDate || new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            const license = await licenseService.createLicense({
                organizationId: payment.organizationId.toString(),
                organizationType: payment.organizationType,
                expiresAt,
                usageLimits: {
                    users: 10,
                    vessels: payment.organizationType === OrganizationType.CUSTOMER ? 10 : 0,
                    items: 1000,
                    employees: 50,
                    businessUnits: 5,
                },
            });
            // Link license to payment
            payment.licenseId = license._id;
            await payment.save();
            logger.info(`✅ License created for successful payment ${payment._id}: ${license.licenseKey}`);
        }
        catch (error) {
            logger.error(`Failed to handle successful payment ${payment._id}:`, error);
            throw error;
        }
    }
    async sendPaymentStatusEmail(payment, status) {
        try {
            const user = await User.findById(payment.userId);
            if (!user) {
                logger.warn(`User not found for payment ${payment._id}`);
                return;
            }
            const organization = await Organization.findById(payment.organizationId);
            if (!organization) {
                logger.warn(`Organization not found for payment ${payment._id}`);
                return;
            }
            const portalLink = payment.portalType === PortalType.CUSTOMER
                ? (process.env.CUSTOMER_PORTAL_URL || 'http://localhost:4300')
                : (process.env.VENDOR_PORTAL_URL || 'http://localhost:4400');
            if (status === PaymentStatus.SUCCESS) {
                await emailService.sendPaymentSuccessEmail({
                    to: user.email,
                    firstName: user.firstName || 'User',
                    lastName: user.lastName || '',
                    organizationName: organization.name,
                    amount: payment.amount,
                    currency: payment.currency,
                    portalLink: `${portalLink}/login`,
                });
            }
            else if (status === PaymentStatus.FAILED) {
                await emailService.sendPaymentFailedEmail({
                    to: user.email,
                    firstName: user.firstName || 'User',
                    lastName: user.lastName || '',
                    organizationName: organization.name,
                    amount: payment.amount,
                    currency: payment.currency,
                });
            }
            else if (status === PaymentStatus.PROCESSING) {
                await emailService.sendPaymentProcessingEmail({
                    to: user.email,
                    firstName: user.firstName || 'User',
                    lastName: user.lastName || '',
                    organizationName: organization.name,
                    amount: payment.amount,
                    currency: payment.currency,
                });
            }
        }
        catch (error) {
            logger.error(`Failed to send payment status email for payment ${payment._id}:`, error);
            // Don't throw - email failure shouldn't break payment processing
        }
    }
    async getPaymentsByOrganization(organizationId) {
        return await Payment.find({ organizationId })
            .populate('userId', 'email firstName lastName')
            .populate('licenseId', 'licenseKey status expiresAt')
            .sort({ createdAt: -1 });
    }
    async getPaymentsByUser(userId) {
        return await Payment.find({ userId })
            .populate('organizationId', 'name')
            .populate('licenseId', 'licenseKey status expiresAt')
            .sort({ createdAt: -1 });
    }
    async getPaymentById(paymentId) {
        return await Payment.findById(paymentId)
            .populate('organizationId')
            .populate('userId')
            .populate('licenseId');
    }
    async checkOrganizationPaymentStatus(organizationId) {
        // Check if organization has at least one successful payment
        const successfulPayment = await Payment.findOne({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            status: PaymentStatus.SUCCESS,
            $or: [
                { 'subscriptionPeriod.endDate': { $gt: new Date() } }, // Subscription hasn't expired
                { 'subscriptionPeriod.endDate': { $exists: false } }, // No expiration date (lifetime)
            ],
        }).sort({ 'subscriptionPeriod.endDate': -1 }); // Get the latest active payment
        if (successfulPayment) {
            return { hasActivePayment: true, payment: successfulPayment };
        }
        return { hasActivePayment: false };
    }
}
export const paymentService = new PaymentService();
//# sourceMappingURL=payment.service.js.map