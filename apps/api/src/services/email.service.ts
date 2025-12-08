import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import transporter from "../config/email";
import { logger } from "../config/logger";

interface SendInvitationEmailParams {
  to: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  organizationType: "customer" | "vendor";
  invitationLink: string;
  temporaryPassword?: string;
}

export class EmailService {
  async sendInvitationEmail({
    to,
    firstName,
    lastName,
    organizationName,
    organizationType,
    invitationLink,
    portalLink: _portalLink,
    temporaryPassword: _temporaryPassword,
  }: SendInvitationEmailParams) {
    try {
      const {
        to,
        firstName,
        lastName,
        organizationName,
        organizationType,
        invitationLink,
        temporaryPassword,
      } = params;

      // For template: readable text
      const organizationTypeText =
        organizationType === "customer" ? "Customer" : "Vendor";

      // Generate HTML using Handlebars template
      const html = this.renderTemplate("invitation", {
        to,
        firstName,
        lastName,
        organizationName,
        organizationTypeText,
        invitationLink,
        temporaryPassword,
      });

      const subject = `Welcome to Euroasiann ERP - ${organizationName} Onboarding`;

      const mailOptions = {
        from: `"Euroasiann ERP" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      };

      logger.info(`📧 Sending invitation email to: ${to}`);

      const info = await transporter.sendMail(mailOptions);

      logger.info(`✅ Invitation email sent successfully. Message ID: ${info.messageId}`);
      return info;
    } catch (error: any) {
      logger.error("❌ Error sending invitation email:", error);
      throw new Error(error.message);
    }
  }

  async sendWelcomeEmail({
    to,
    firstName,
    lastName,
    portalLink,
    temporaryPassword,
    organizationType,
    isExternalVendor = false,
  }: {
    to: string;
    firstName: string;
    lastName: string;
    portalLink: string;
    temporaryPassword: string;
    organizationType?: 'customer' | 'vendor';
    isExternalVendor?: boolean;
  }) {
    try {
      const subject = 'Welcome to Euroasiann ERP - Your Login Credentials';
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .credentials { background: #fff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0066cc; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Euroasiann ERP</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              
              <p>Your onboarding has been completed successfully! Your ${organizationType === 'customer' ? 'Customer' : 'Vendor'} organization is now set up on the Euroasiann ERP Platform.</p>
              
              <div class="credentials">
                <p><strong>Your login credentials:</strong></p>
                <p><strong>Email:</strong> ${to}</p>
                <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
                <p style="color: #d32f2f; font-size: 12px;"><em>Please change your password after first login for security.</em></p>
              </div>
              
              ${isExternalVendor ? `
              <p>Click the button below to log in to your portal:</p>
              
              <div style="text-align: center;">
                <a href="${portalLink}" class="button">Login to Portal</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #0066cc;"><a href="${portalLink}" style="color: #0066cc; text-decoration: none;">${portalLink}</a></p>
              ` : `
              <p><strong>Important:</strong> To access the portal and all features, you need to complete your subscription payment first.</p>
              
              <p>Click the button below to log in and complete payment:</p>
              
              <div style="text-align: center;">
                <a href="${portalLink}" class="button">Login & Complete Payment</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #0066cc;"><a href="${portalLink}" style="color: #0066cc; text-decoration: none;">${portalLink}</a></p>
              
              <p style="background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <strong>Note:</strong> After logging in, you will be redirected to the payment page. Once payment is completed, you will have full access to the portal and dashboard.
              </p>
              `}
              
              <p>If you have any questions, please contact our support team.</p>
              
              <p>Best regards,<br>Euroasiann ERP Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        Welcome to Euroasiann ERP
        
        Dear ${firstName} ${lastName},
        
        Your onboarding has been completed successfully! Your ${organizationType === 'customer' ? 'Customer' : 'Vendor'} organization is now set up on the Euroasiann ERP Platform.
        
        Your login credentials:
        Email: ${to}
        Temporary Password: ${temporaryPassword}
        
        Please change your password after first login for security.
        
        ${isExternalVendor ? `
        Login to portal: ${portalLink}
        ` : `
        IMPORTANT: To access the portal and all features, you need to complete your subscription payment first.
        
        Login and complete payment: ${portalLink}
        
        Note: After logging in, you will be redirected to the payment page. Once payment is completed, you will have full access to the portal and dashboard.
        `}
        
        Best regards,
        Euroasiann ERP Team
      `;

      const mailOptions = {
        from: `"Euroasiann ERP" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Welcome to Euroasiann ERP",
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${to} (${info.messageId})`);

      return info;
    } catch (error: any) {
      logger.error(`Failed to send welcome email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendUserInvitationEmail({
    to,
    firstName,
    lastName,
    portalType,
    portalLink,
    temporaryPassword,
  }: {
    to: string;
    firstName: string;
    lastName: string;
    portalType: string;
    portalLink: string;
    temporaryPassword: string;
  }) {
    try {
      const portalName = portalType === 'admin' ? 'Admin Portal' : portalType === 'tech' ? 'Tech Portal' : 'Portal';
      const subject = `Welcome to Euroasiann ERP - ${portalName} Access`;
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .credentials { background: #fff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0066cc; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Euroasiann ERP</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              
              <p>You have been invited to access the <strong>${portalName}</strong> of the Euroasiann ERP Platform.</p>
              
              <div class="credentials">
                <p><strong>Your login credentials:</strong></p>
                <p><strong>Email:</strong> ${to}</p>
                <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
                <p style="color: #d32f2f; font-size: 12px;"><em>Please change your password after first login for security.</em></p>
              </div>
              
              <p>Click the button below to log in:</p>
              
              <div style="text-align: center;">
                <a href="${portalLink}" class="button">Login to ${portalName}</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #0066cc;"><a href="${portalLink}" style="color: #0066cc; text-decoration: none;">${portalLink}</a></p>
              
              <p>If you have any questions, please contact our support team.</p>
              
              <p>Best regards,<br>Euroasiann ERP Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        Welcome to Euroasiann ERP
        
        Dear ${firstName} ${lastName},
        
        You have been invited to access the ${portalName} of the Euroasiann ERP Platform.
        
        Your login credentials:
        Email: ${to}
        Temporary Password: ${temporaryPassword}
        
        Please change your password after first login for security.
        
        Login to ${portalName}: ${portalLink}
        
        If you have any questions, please contact our support team.
        
        Best regards,
        Euroasiann ERP Team
      `;

      // For Zoho SMTP, the "from" address must exactly match the authenticated EMAIL_USER
      const fromEmail = process.env.EMAIL_USER || 'technical@euroasianngroup.com';
      
      const mailOptions = {
        from: fromEmail,
        to,
        subject,
        text,
        html,
        replyTo: `"Euroasiann ERP" <${fromEmail}>`,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`✅ User invitation email sent to ${to} for ${portalName}: ${info.messageId}`);
      logger.info(`   Portal link: ${portalLink}`);
      return info;
    } catch (error: any) {
      logger.error(`Failed to send user invitation email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendPaymentSuccessEmail({
    to,
    firstName,
    lastName,
    organizationName,
    amount,
    currency,
    portalLink,
  }: {
    to: string;
    firstName: string;
    lastName: string;
    organizationName: string;
    amount: number;
    currency: string;
    portalLink: string;
  }) {
    try {
      const subject = 'Payment Successful - Start Using Your Portal';
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .payment-info { background: #fff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Payment Successful!</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              
              <p>Your payment has been processed successfully!</p>
              
              <div class="payment-info">
                <p><strong>Organization:</strong> ${organizationName}</p>
                <p><strong>Amount:</strong> ${currency} ${amount.toFixed(2)}</p>
                <p><strong>Status:</strong> Payment Successful</p>
              </div>
              
              <p><strong>Your subscription is now active!</strong> You now have full access to your portal, dashboard, and all features.</p>
              
              <p style="background: #d1fae5; padding: 12px; border-radius: 6px; border-left: 4px solid #10b981; margin: 20px 0;">
                <strong>🎉 Payment Successful!</strong> You can now continue to use the portal with full access to all features including dashboard, reports, and management tools.
              </p>
              
              <div style="text-align: center;">
                <a href="${portalLink}" class="button">Continue to Portal</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #10b981;"><a href="${portalLink}" style="color: #10b981; text-decoration: none;">${portalLink}</a></p>
              
              <p>If you have any questions, please contact our support team.</p>
              
              <p>Best regards,<br>Euroasiann ERP Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        Payment Successful
        
        Dear ${firstName} ${lastName},
        
        Your payment has been processed successfully!
        
        Organization: ${organizationName}
        Amount: ${currency} ${amount.toFixed(2)}
        Status: Payment Successful
        
        Your subscription is now active! You now have full access to your portal, dashboard, and all features.
        
        Payment Successful! You can now continue to use the portal with full access to all features including dashboard, reports, and management tools.
        
        Continue to portal: ${portalLink}
        
        Best regards,
        Euroasiann ERP Team
      `;

      const fromEmail = process.env.EMAIL_USER || 'technical@euroasianngroup.com';
      
      const mailOptions = {
        from: fromEmail,
        to,
        subject,
        text,
        html,
        replyTo: `"Euroasiann ERP" <${fromEmail}>`,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`✅ Payment success email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error: any) {
      logger.error(`Failed to send payment success email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendPaymentFailedEmail({
    to,
    firstName,
    lastName,
    organizationName,
    amount,
    currency,
  }: {
    to: string;
    firstName: string;
    lastName: string;
    organizationName: string;
    amount: number;
    currency: string;
  }) {
    try {
      const subject = 'Payment Failed - Action Required';
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .payment-info { background: #fff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ef4444; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Payment Failed</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              
              <p>Unfortunately, your payment could not be processed.</p>
              
              <div class="payment-info">
                <p><strong>Organization:</strong> ${organizationName}</p>
                <p><strong>Amount:</strong> ${currency} ${amount.toFixed(2)}</p>
                <p><strong>Status:</strong> Payment Failed</p>
              </div>
              
              <p>Please try again or contact your bank if the issue persists. You will need to complete payment to access your portal.</p>
              
              <p>If you have any questions, please contact our support team.</p>
              
              <p>Best regards,<br>Euroasiann ERP Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        Payment Failed
        
        Dear ${firstName} ${lastName},
        
        Unfortunately, your payment could not be processed.
        
        Organization: ${organizationName}
        Amount: ${currency} ${amount.toFixed(2)}
        Status: Payment Failed
        
        Please try again or contact your bank if the issue persists.
        
        Best regards,
        Euroasiann ERP Team
      `;

      const fromEmail = process.env.EMAIL_USER || 'technical@euroasianngroup.com';
      
      const mailOptions = {
        from: fromEmail,
        to,
        subject,
        text,
        html,
        replyTo: `"Euroasiann ERP" <${fromEmail}>`,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`✅ Payment failed email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error: any) {
      logger.error(`Failed to send payment failed email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendPaymentProcessingEmail({
    to,
    firstName,
    lastName,
    organizationName,
    amount,
    currency,
  }: {
    to: string;
    firstName: string;
    lastName: string;
    organizationName: string;
    amount: number;
    currency: string;
  }) {
    try {
      const subject = 'Payment Processing';
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .payment-info { background: #fff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏳ Payment Processing</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              
              <p>Your payment is currently being processed.</p>
              
              <div class="payment-info">
                <p><strong>Organization:</strong> ${organizationName}</p>
                <p><strong>Amount:</strong> ${currency} ${amount.toFixed(2)}</p>
                <p><strong>Status:</strong> Processing</p>
              </div>
              
              <p>We will notify you once the payment is confirmed. This usually takes a few minutes.</p>
              
              <p>If you have any questions, please contact our support team.</p>
              
              <p>Best regards,<br>Euroasiann ERP Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        Payment Processing
        
        Dear ${firstName} ${lastName},
        
        Your payment is currently being processed.
        
        Organization: ${organizationName}
        Amount: ${currency} ${amount.toFixed(2)}
        Status: Processing
        
        We will notify you once the payment is confirmed.
        
        Best regards,
        Euroasiann ERP Team
      `;

      const fromEmail = process.env.EMAIL_USER || 'technical@euroasianngroup.com';
      
      const mailOptions = {
        from: fromEmail,
        to,
        subject,
        text,
        html,
        replyTo: `"Euroasiann ERP" <${fromEmail}>`,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`✅ Payment processing email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error: any) {
      logger.error(`Failed to send payment processing email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}

export const emailService = new EmailService();
