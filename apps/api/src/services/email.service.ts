import transporter from '../config/email';
import { logger } from '../config/logger';

interface SendInvitationEmailParams {
  to: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  organizationType: 'customer' | 'vendor';
  invitationLink: string;
  portalLink: string;
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
      const subject = `Welcome to Euroasiann ERP - ${organizationName} Onboarding`;
      
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
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .credentials { background: #fff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0066cc; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Euroasiann ERP</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              
              <p>You have been invited to join <strong>${organizationName}</strong> as a ${organizationType === 'customer' ? 'Customer' : 'Vendor'} Organization Administrator on the Euroasiann ERP Platform.</p>
              
              <p>To complete your onboarding, please click the button below:</p>
              
              <div style="text-align: center;">
                <a href="${invitationLink}" class="button">Start Onboarding</a>
              </div>
              
              <p><em>Note: You will receive your login credentials after completing the onboarding process.</em></p>
              
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
        
        You have been invited to join ${organizationName} as a ${organizationType === 'customer' ? 'Customer' : 'Vendor'} Organization Administrator on the Euroasiann ERP Platform.
        
        To complete your onboarding, please visit: ${invitationLink}
        
        Note: You will receive your login credentials after completing the onboarding process.
        
        Best regards,
        Euroasiann ERP Team
      `;

      // For Zoho SMTP, the "from" address must exactly match the authenticated EMAIL_USER
      // Using just the email address without display name to avoid 553 errors
      const fromEmail = process.env.EMAIL_USER || 'technical@euroasianngroup.com';
      
      const mailOptions = {
        from: fromEmail, // Zoho requires exact match with authenticated user
        to, // This is the email address from the form (e.g., lalithyachavala@gmail.com)
        subject,
        text,
        html,
        // Add reply-to if you want a different reply address
        replyTo: `"Euroasiann ERP" <${fromEmail}>`,
      };

      // Log the exact email address we're sending to
      logger.info(`📧 Email service: Preparing to send invitation email`);
      logger.info(`   FROM: ${mailOptions.from}`);
      logger.info(`   TO: ${to} (this is the email from the form)`);
      logger.info(`   SUBJECT: ${subject}`);

      const info = await transporter.sendMail(mailOptions);
      logger.info(`✅ Email service: Invitation email successfully sent to ${to}`);
      logger.info(`   Message ID: ${info.messageId}`);
      logger.info(`   Response: ${info.response || 'N/A'}`);
      return info;
    } catch (error: any) {
      logger.error(`❌ Failed to send invitation email to ${to}:`, error);
      
      // Provide more helpful error messages for common issues
      if (error.code === 'EAUTH' || error.responseCode === 535) {
        logger.error(`   ⚠️  EMAIL AUTHENTICATION FAILED`);
        logger.error(`   This usually means:`);
        logger.error(`   1. The EMAIL_PASS in .env is incorrect`);
        logger.error(`   2. The email account requires an app-specific password (if 2FA is enabled)`);
        logger.error(`   3. The email account credentials have changed`);
        logger.error(`   Current email config: ${process.env.EMAIL_USER || 'NOT SET'}`);
        logger.error(`   Please verify EMAIL_USER and EMAIL_PASS in your .env file`);
      } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
        logger.error(`   ⚠️  EMAIL CONNECTION FAILED`);
        logger.error(`   This usually means:`);
        logger.error(`   1. The EMAIL_HOST or EMAIL_PORT in .env is incorrect`);
        logger.error(`   2. The SMTP server is unreachable`);
        logger.error(`   Current config: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
      } else if (error.responseCode === 553 || error.code === 'EENVELOPE') {
        logger.error(`   ⚠️  EMAIL RELAY/Mailbox ERROR (553)`);
        logger.error(`   This usually means:`);
        logger.error(`   1. The "from" address doesn't match the authenticated EMAIL_USER`);
        logger.error(`   2. Zoho SMTP requires the from address to exactly match EMAIL_USER`);
        logger.error(`   3. The email domain might not be authorized for sending`);
        logger.error(`   Current FROM: ${process.env.EMAIL_USER || 'NOT SET'}`);
        logger.error(`   Make sure EMAIL_USER in .env matches the authenticated email account`);
        logger.error(`   For Zoho, the from address must be exactly: ${process.env.EMAIL_USER || 'technical@euroasianngroup.com'}`);
      }
      
      throw new Error(`Failed to send email: ${error.message}`);
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
              
              <p>Click the button below to log in:</p>
              
              <div style="text-align: center;">
                <a href="${portalLink}" class="button">Login</a>
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
        
        Login: ${portalLink}
        
        Note: After logging in, you will be redirected to the payment page. Once payment is completed, you will have full access to the portal and dashboard.
        `}
        
        Best regards,
        Euroasiann ERP Team
      `;

      // For Zoho SMTP, the "from" address must exactly match the authenticated EMAIL_USER
      const fromEmail = process.env.EMAIL_USER || 'technical@euroasianngroup.com';
      
      const mailOptions = {
        from: fromEmail, // Zoho requires exact match with authenticated user
        to,
        subject,
        text,
        html,
        replyTo: `"Euroasiann ERP" <${fromEmail}>`,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`✅ Welcome email with credentials sent to ${to}: ${info.messageId}`);
      logger.info(`   Portal link: ${portalLink}`);
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

  async sendEmployeeInvitationEmail({
    to,
    firstName,
    lastName,
    organizationName,
    onboardingLink,
  }: {
    to: string;
    firstName: string;
    lastName: string;
    organizationName: string;
    onboardingLink: string;
  }) {
    try {
      const subject = `Welcome to Euroasiann ERP - Employee Onboarding`;
      
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
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .note { background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Euroasiann ERP</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              
              <p>You have been invited to join <strong>${organizationName}</strong> as an employee on the Euroasiann ERP Platform.</p>
              
              <p>To complete your onboarding and set up your account, please click the button below:</p>
              
              <div style="text-align: center;">
                <a href="${onboardingLink}" class="button">Complete Onboarding</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #0066cc;"><a href="${onboardingLink}" style="color: #0066cc; text-decoration: none;">${onboardingLink}</a></p>
              
              <div class="note">
                <p style="margin: 0;"><strong>Note:</strong> You will receive your login credentials after completing the onboarding process.</p>
              </div>
              
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
        
        You have been invited to join ${organizationName} as an employee on the Euroasiann ERP Platform.
        
        To complete your onboarding and set up your account, please visit:
        ${onboardingLink}
        
        Note: You will receive your login credentials after completing the onboarding process.
        
        If you have any questions, please contact our support team.
        
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
      logger.info(`✅ Employee invitation email sent to ${to}: ${info.messageId}`);
      logger.info(`   Onboarding link: ${onboardingLink}`);
      return info;
    } catch (error: any) {
      logger.error(`Failed to send employee invitation email to ${to}:`, error);
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


