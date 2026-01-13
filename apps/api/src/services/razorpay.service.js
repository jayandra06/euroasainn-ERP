import Razorpay from 'razorpay';
import { logger } from '../config/logger';
export class RazorpayService {
    constructor() {
        const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag';
        const keySecret = process.env.RAZORPAY_KEY_SECRET || 'b3ef028f26d7f99f485710cfc55bdbc70347edf23dcd17c63fe2ab9bba46c245';
        if (!keyId || !keySecret) {
            logger.warn('⚠️ Razorpay credentials not found. Payment gateway will not work.');
            throw new Error('Razorpay credentials are required');
        }
        this.razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
        logger.info('✅ Razorpay service initialized');
    }
    async createOrder(data) {
        try {
            const options = {
                amount: data.amount * 100, // Razorpay expects amount in paise (smallest currency unit)
                currency: data.currency || 'INR',
                receipt: data.receipt || `receipt_${Date.now()}`,
                notes: data.notes || {},
            };
            const order = await this.razorpay.orders.create(options);
            logger.info(`✅ Razorpay order created: ${order.id}`);
            return order;
        }
        catch (error) {
            logger.error('❌ Razorpay order creation failed:', error);
            throw new Error(`Failed to create Razorpay order: ${error.message}`);
        }
    }
    async verifyPaymentSignature(orderId, paymentId, signature) {
        try {
            const crypto = await import('crypto');
            const keySecret = process.env.RAZORPAY_KEY_SECRET;
            if (!keySecret) {
                throw new Error('Razorpay key secret not found');
            }
            const generatedSignature = crypto
                .createHmac('sha256', keySecret)
                .update(`${orderId}|${paymentId}`)
                .digest('hex');
            const isValid = generatedSignature === signature;
            if (isValid) {
                logger.info(`✅ Payment signature verified for order: ${orderId}`);
            }
            else {
                logger.warn(`⚠️ Invalid payment signature for order: ${orderId}`);
            }
            return isValid;
        }
        catch (error) {
            logger.error('❌ Payment signature verification failed:', error);
            return false;
        }
    }
    async getPaymentDetails(paymentId) {
        try {
            const payment = await this.razorpay.payments.fetch(paymentId);
            return payment;
        }
        catch (error) {
            logger.error('❌ Failed to fetch payment details:', error);
            throw new Error(`Failed to fetch payment details: ${error.message}`);
        }
    }
    async getOrderDetails(orderId) {
        try {
            const order = await this.razorpay.orders.fetch(orderId);
            return order;
        }
        catch (error) {
            logger.error('❌ Failed to fetch order details:', error);
            throw new Error(`Failed to fetch order details: ${error.message}`);
        }
    }
    async refundPayment(paymentId, amount) {
        try {
            const refundData = {
                payment_id: paymentId,
            };
            if (amount) {
                refundData.amount = amount * 100; // Convert to paise
            }
            const refund = await this.razorpay.payments.refund(paymentId, refundData);
            logger.info(`✅ Refund processed: ${refund.id} for payment: ${paymentId}`);
            return refund;
        }
        catch (error) {
            logger.error('❌ Refund failed:', error);
            throw new Error(`Failed to process refund: ${error.message}`);
        }
    }
}
// Create singleton instance
let razorpayServiceInstance = null;
export function getRazorpayService() {
    if (!razorpayServiceInstance) {
        try {
            razorpayServiceInstance = new RazorpayService();
        }
        catch {
            logger.warn('⚠️ Razorpay service not initialized. Payment features will be limited.');
            // Return a mock service that throws errors
            return {
                createOrder: async () => { throw new Error('Razorpay not configured'); },
                verifyPaymentSignature: async () => false,
                getPaymentDetails: async () => { throw new Error('Razorpay not configured'); },
                getOrderDetails: async () => { throw new Error('Razorpay not configured'); },
                refundPayment: async () => { throw new Error('Razorpay not configured'); },
            };
        }
    }
    return razorpayServiceInstance;
}
export const razorpayService = getRazorpayService();
//# sourceMappingURL=razorpay.service.js.map