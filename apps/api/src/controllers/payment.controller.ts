import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { PaymentStatus } from '../models/payment.model';
import { logger } from '../config/logger';
import { AuthRequest } from '../middleware/auth.middleware';

export class PaymentController {
  async createPayment(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { organizationId, amount, currency, paymentType, description, paymentMethod, metadata } = req.body;

      if (!organizationId || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID and amount are required',
        });
      }

      const result = await paymentService.createPayment({
        organizationId,
        userId,
        amount,
        currency,
        paymentType,
        description,
        paymentMethod,
        metadata,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Payment created successfully',
      });
    } catch (error: any) {
      logger.error('Create payment error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create payment',
      });
    }
  }

  async updatePaymentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, transactionId, gatewayResponse } = req.body;

      if (!status || !Object.values(PaymentStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Valid payment status is required',
        });
      }

      const payment = await paymentService.updatePaymentStatus(
        id,
        status as PaymentStatus,
        transactionId,
        gatewayResponse
      );

      res.status(200).json({
        success: true,
        data: payment,
        message: `Payment status updated to ${status}`,
      });
    } catch (error: any) {
      logger.error('Update payment status error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update payment status',
      });
    }
  }

  async getPaymentsByOrganization(req: AuthRequest, res: Response) {
    try {
      const { organizationId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const payments = await paymentService.getPaymentsByOrganization(organizationId);

      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error: any) {
      logger.error('Get payments by organization error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get payments',
      });
    }
  }

  async getPaymentsByUser(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const payments = await paymentService.getPaymentsByUser(userId);

      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error: any) {
      logger.error('Get payments by user error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get payments',
      });
    }
  }

  async getPaymentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const payment = await paymentService.getPaymentById(id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found',
        });
      }

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error: any) {
      logger.error('Get payment by ID error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get payment',
      });
    }
  }

  async checkPaymentStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { User } = await import('../models/user.model');
      const { Organization } = await import('../models/organization.model');
      const { OrganizationType } = await import('../../../../packages/shared/src/types/index.ts');
      
      const user = await User.findById(userId);
      if (!user || !user.organizationId) {
        return res.status(400).json({
          success: false,
          error: 'User organization not found',
        });
      }

      // Check if this is an external vendor (invited by customer)
      const organization = await Organization.findById(user.organizationId);
      if (organization) {
        const orgType = String(organization.type).toLowerCase();
        const isVendorOrg = orgType === 'vendor' || orgType === OrganizationType.VENDOR.toLowerCase();
        
        if (isVendorOrg) {
          // Check if external vendor (invited by customer)
          const hasInvitedByOrgId = !!(organization.invitedByOrganizationId && organization.invitedByOrganizationId.toString());
          const invitedBy = organization.invitedBy ? String(organization.invitedBy).toLowerCase() : null;
          const isAdminInvited = organization.isAdminInvited === true;
          
          const isExternalVendor = 
            invitedBy === 'customer' ||
            hasInvitedByOrgId ||
            (!isAdminInvited && invitedBy !== 'admin' && invitedBy !== 'tech');
          
          if (isExternalVendor) {
            logger.info(`✅ External vendor - returning hasActivePayment=true for organization: ${organization.name}`);
            return res.status(200).json({
              success: true,
              data: {
                hasActivePayment: true, // External vendors don't need payment
                organizationId: user.organizationId.toString(),
              },
            });
          }
        }
      }

      // For internal vendors and customers, check actual payment status
      const paymentStatus = await paymentService.checkOrganizationPaymentStatus(
        user.organizationId.toString()
      );

      res.status(200).json({
        success: true,
        data: {
          hasActivePayment: paymentStatus.hasActivePayment,
          organizationId: user.organizationId.toString(),
        },
      });
    } catch (error: any) {
      logger.error('Check payment status error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to check payment status',
      });
    }
  }

  // Webhook endpoint for payment gateway callbacks
  async handlePaymentWebhook(req: Request, res: Response) {
    try {
      // Razorpay webhook signature verification
      const razorpaySignature = req.headers['x-razorpay-signature'] as string;
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

      if (razorpaySignature && webhookSecret) {
        const crypto = await import('crypto');
        const generatedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(JSON.stringify(req.body))
          .digest('hex');

        if (generatedSignature !== razorpaySignature) {
          logger.warn('⚠️ Invalid Razorpay webhook signature');
          return res.status(400).json({
            success: false,
            error: 'Invalid webhook signature',
          });
        }
      }

      const event = req.body.event;
      const payload = req.body.payload;

      logger.info(`📥 Razorpay webhook received: ${event}`);

      // Handle payment.captured event
      if (event === 'payment.captured') {
        const paymentEntity = payload.payment.entity;
        const orderId = paymentEntity.order_id;
        const paymentId = paymentEntity.id;

        // Find payment by Razorpay order ID
        const payment = await import('../models/payment.model').then(m => 
          m.Payment.findOne({ transactionId: orderId })
        );

        if (payment) {
          // Verify payment signature
          const { razorpayService } = await import('../services/razorpay.service');
          if (razorpayService) {
            const isValid = await razorpayService.verifyPaymentSignature(
              orderId,
              paymentId,
              paymentEntity.signature || ''
            );

            if (isValid) {
              await paymentService.updatePaymentStatus(
                payment._id.toString(),
                PaymentStatus.SUCCESS,
                paymentId,
                paymentEntity
              );
              logger.info(`✅ Payment ${payment._id} marked as successful via webhook`);
            } else {
              logger.warn(`⚠️ Payment signature verification failed for payment ${payment._id}`);
              await paymentService.updatePaymentStatus(
                payment._id.toString(),
                PaymentStatus.FAILED,
                paymentId,
                paymentEntity
              );
            }
          } else {
            // If Razorpay service not available, mark as success (trust webhook)
            await paymentService.updatePaymentStatus(
              payment._id.toString(),
              PaymentStatus.SUCCESS,
              paymentId,
              paymentEntity
            );
            logger.info(`✅ Payment ${payment._id} marked as successful via webhook (no signature verification)`);
          }
        } else {
          logger.warn(`⚠️ Payment not found for Razorpay order: ${orderId}`);
        }
      } else if (event === 'payment.failed') {
        const paymentEntity = payload.payment.entity;
        const orderId = paymentEntity.order_id;

        const payment = await import('../models/payment.model').then(m => 
          m.Payment.findOne({ transactionId: orderId })
        );

        if (payment) {
          await paymentService.updatePaymentStatus(
            payment._id.toString(),
            PaymentStatus.FAILED,
            paymentEntity.id,
            paymentEntity
          );
          logger.info(`❌ Payment ${payment._id} marked as failed via webhook`);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
      });
    } catch (error: any) {
      logger.error('Payment webhook error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to process webhook',
      });
    }
  }

  // Verify payment after Razorpay checkout
  async verifyPayment(req: AuthRequest, res: Response) {
    try {
      const { paymentId, orderId, signature } = req.body;

      if (!paymentId || !orderId || !signature) {
        return res.status(400).json({
          success: false,
          error: 'Payment ID, Order ID, and signature are required',
        });
      }

      // Find payment by order ID
      const { Payment } = await import('../models/payment.model');
      const payment = await Payment.findOne({ transactionId: orderId });

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found',
        });
      }

      // Verify signature
      const { razorpayService } = await import('../services/razorpay.service');
      if (!razorpayService) {
        return res.status(500).json({
          success: false,
          error: 'Razorpay service not available',
        });
      }
      const isValid = await razorpayService.verifyPaymentSignature(orderId, paymentId, signature);

      if (isValid) {
        // Get payment details from Razorpay
        const paymentDetails = await razorpayService.getPaymentDetails(paymentId);
        
        await paymentService.updatePaymentStatus(
          payment._id.toString(),
          PaymentStatus.SUCCESS,
          paymentId,
          paymentDetails
        );

        res.status(200).json({
          success: true,
          data: payment,
          message: 'Payment verified successfully',
        });
      } else {
        await paymentService.updatePaymentStatus(
          payment._id.toString(),
          PaymentStatus.FAILED,
          paymentId,
          { error: 'Invalid signature' }
        );

        res.status(400).json({
          success: false,
          error: 'Invalid payment signature',
        });
      }
    } catch (error: any) {
      logger.error('Verify payment error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to verify payment',
      });
    }
  }
}

export const paymentController = new PaymentController();

