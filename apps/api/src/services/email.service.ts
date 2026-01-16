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
  invitedByCustomerName?: string; // Name of customer who invited this vendor
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
    invitedByCustomerName,
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
              
              ${invitedByCustomerName ? `
              <p>You have been invited by <strong>${invitedByCustomerName}</strong> to join <strong>${organizationName}</strong> as a ${organizationType === 'customer' ? 'Customer' : 'Vendor'} Organization Administrator on the Euroasiann ERP Platform.</p>
              ` : `
              <p>You have been invited to join <strong>${organizationName}</strong> as a ${organizationType === 'customer' ? 'Customer' : 'Vendor'} Organization Administrator on the Euroasiann ERP Platform.</p>
              `}
              
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
        
        ${invitedByCustomerName ? `You have been invited by ${invitedByCustomerName} to join ${organizationName} as a ${organizationType === 'customer' ? 'Customer' : 'Vendor'} Organization Administrator on the Euroasiann ERP Platform.` : `You have been invited to join ${organizationName} as a ${organizationType === 'customer' ? 'Customer' : 'Vendor'} Organization Administrator on the Euroasiann ERP Platform.`}
        
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

  async sendExistingVendorInvitationEmail({
    to,
    firstName,
    lastName,
    customerOrganizationName,
    acceptLink,
    declineLink,
  }: {
    to: string;
    firstName: string;
    lastName: string;
    customerOrganizationName: string;
    acceptLink: string;
    declineLink: string;
  }) {
    try {
      const subject = `Vendor Invitation from ${customerOrganizationName}`;
      
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
            .button { display: inline-block; padding: 12px 30px; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .button-accept { background: #10b981; }
            .button-decline { background: #ef4444; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .info-box { background: #fff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0066cc; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Vendor Invitation</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              
              <p>You have been invited to work with <strong>${customerOrganizationName}</strong> as a vendor on the Euroasiann ERP Platform.</p>
              
              <div class="info-box">
                <p><strong>Customer Organization:</strong> ${customerOrganizationName}</p>
                <p><strong>Your Email:</strong> ${to}</p>
              </div>
              
              <p>Please click one of the buttons below to accept or decline this invitation:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${acceptLink}" class="button button-accept">Accept Invitation</a>
                <a href="${declineLink}" class="button button-decline">Decline Invitation</a>
              </div>
              
              <p style="font-size: 12px; color: #666;">
                <em>Note: If you accept, you will be able to work with ${customerOrganizationName} on the platform. If you decline, this invitation will be cancelled.</em>
              </p>
              
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
        Vendor Invitation
        
        Dear ${firstName} ${lastName},
        
        You have been invited to work with ${customerOrganizationName} as a vendor on the Euroasiann ERP Platform.
        
        Customer Organization: ${customerOrganizationName}
        Your Email: ${to}
        
        Please use one of the links below to accept or decline this invitation:
        
        Accept: ${acceptLink}
        Decline: ${declineLink}
        
        Note: If you accept, you will be able to work with ${customerOrganizationName} on the platform. If you decline, this invitation will be cancelled.
        
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
      logger.info(`✅ Existing vendor invitation email sent to ${to}: ${info.messageId}`);
      logger.info(`   Accept link: ${acceptLink}`);
      logger.info(`   Decline link: ${declineLink}`);
      return info;
    } catch (error: any) {
      logger.error(`Failed to send existing vendor invitation email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send RFQ notification email to vendors
   */
  async sendRFQNotificationEmail({
    to,
    firstName,
    lastName,
    customerOrganizationName,
    rfqNumber,
    rfqTitle,
    rfqLink,
  }: {
    to: string;
    firstName: string;
    lastName: string;
    customerOrganizationName: string;
    rfqNumber: string;
    rfqTitle: string;
    rfqLink: string;
  }) {
    try {
      const subject = `New RFQ Received from ${customerOrganizationName} - ${rfqNumber}`;
      
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
            .info-box { background: #fff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0066cc; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New RFQ Received</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              
              <p>You have received a new Request for Quotation (RFQ) from <strong>${customerOrganizationName}</strong>.</p>
              
              <div class="info-box">
                <p><strong>RFQ Number:</strong> ${rfqNumber}</p>
                <p><strong>RFQ Title:</strong> ${rfqTitle}</p>
                <p><strong>Customer:</strong> ${customerOrganizationName}</p>
              </div>
              
              <p>Please log in to the Euroasiann ERP Platform and submit your quotation in the RFQ page.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${rfqLink}" class="button">Login & Submit Quotation</a>
              </div>
              
              <p style="font-size: 12px; color: #666;">
                <em>Note: Please ensure you submit your quotation before the due date mentioned in the RFQ.</em>
              </p>
              
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
        New RFQ Received
        
        Dear ${firstName} ${lastName},
        
        You have received a new Request for Quotation (RFQ) from ${customerOrganizationName}.
        
        RFQ Number: ${rfqNumber}
        RFQ Title: ${rfqTitle}
        Customer: ${customerOrganizationName}
        
        Please log in to the Euroasiann ERP Platform and submit your quotation in the RFQ page.
        
        Login & Submit Quotation: ${rfqLink}
        
        Note: Please ensure you submit your quotation before the due date mentioned in the RFQ.
        
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
      logger.info(`✅ RFQ notification email sent to ${to}: ${info.messageId}`);
      logger.info(`   RFQ Number: ${rfqNumber}, Link: ${rfqLink}`);
      return info;
    } catch (error: any) {
      logger.error(`Failed to send RFQ notification email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendQuotationNotificationEmail({
    to,
    firstName,
    lastName,
    vendorOrganizationName,
    quotationNumber,
    rfqNumber,
    quotationLink,
    quotationDetails,
  }: {
    to: string;
    firstName: string;
    lastName: string;
    vendorOrganizationName: string;
    quotationNumber: string;
    rfqNumber: string;
    quotationLink: string;
    quotationDetails: {
      items: any[];
      terms: any;
      totalAmount: number;
      currency: string;
    };
  }) {
    try {
      const subject = `New Quotation Received from ${vendorOrganizationName} - ${quotationNumber}`;
      
      // Generate HTML table for quotation items
      const itemsTable = quotationDetails.items.length > 0
        ? `
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f0f0f0;">
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Description</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Required Qty</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Quoted Price</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Offered Qty</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Offered Quality</th>
              </tr>
            </thead>
            <tbody>
              ${quotationDetails.items.map((item: any) => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 10px;">${item.description || '-'}</td>
                  <td style="border: 1px solid #ddd; padding: 10px;">${item.requiredQty || '-'}</td>
                  <td style="border: 1px solid #ddd; padding: 10px;">${quotationDetails.currency} ${item.quotedPrice?.toFixed(2) || '0.00'}</td>
                  <td style="border: 1px solid #ddd; padding: 10px;">${item.offeredQty || '-'}</td>
                  <td style="border: 1px solid #ddd; padding: 10px;">${item.offeredQuality || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #f0f0f0; font-weight: bold;">
                <td colspan="4" style="border: 1px solid #ddd; padding: 10px; text-align: right;">Total Amount:</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${quotationDetails.currency} ${quotationDetails.totalAmount?.toFixed(2) || '0.00'}</td>
              </tr>
            </tfoot>
          </table>
        `
        : '<p>No items in quotation.</p>';

      // Generate terms section
      const termsSection = quotationDetails.terms
        ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #0066cc;">Terms & Conditions</h3>
            <div style="background: #fff; padding: 15px; border-radius: 6px; margin: 10px 0;">
              ${quotationDetails.terms.creditType ? `<p><strong>Credit Type:</strong> ${quotationDetails.terms.creditType}</p>` : ''}
              ${quotationDetails.terms.paymentTerm ? `<p><strong>Payment Term:</strong> ${quotationDetails.terms.paymentTerm}</p>` : ''}
              ${quotationDetails.terms.insuranceTerm ? `<p><strong>Insurance Term:</strong> ${quotationDetails.terms.insuranceTerm}</p>` : ''}
              ${quotationDetails.terms.taxTerm ? `<p><strong>Tax Term:</strong> ${quotationDetails.terms.taxTerm}</p>` : ''}
              ${quotationDetails.terms.transportTerm ? `<p><strong>Transport Term:</strong> ${quotationDetails.terms.transportTerm}</p>` : ''}
              ${quotationDetails.terms.deliveryTerm ? `<p><strong>Delivery Term:</strong> ${quotationDetails.terms.deliveryTerm}</p>` : ''}
              ${quotationDetails.terms.packingTerm ? `<p><strong>Packing Term:</strong> ${quotationDetails.terms.packingTerm}</p>` : ''}
            </div>
          </div>
        `
        : '';

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .info-box { background: #fff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0066cc; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Quotation Received</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              
              <p>You have received a new quotation from <strong>${vendorOrganizationName}</strong> for RFQ <strong>${rfqNumber}</strong>.</p>
              
              <div class="info-box">
                <p><strong>Quotation Number:</strong> ${quotationNumber}</p>
                <p><strong>RFQ Number:</strong> ${rfqNumber}</p>
                <p><strong>Vendor:</strong> ${vendorOrganizationName}</p>
                <p><strong>Total Amount:</strong> ${quotationDetails.currency} ${quotationDetails.totalAmount?.toFixed(2) || '0.00'}</p>
              </div>
              
              <h3 style="color: #0066cc; margin-top: 30px;">Quotation Items</h3>
              ${itemsTable}
              
              ${termsSection}
              
              <p>Please log in to the Euroasiann ERP Platform to view the full quotation details and take action.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${quotationLink}" class="button">View Quotation Details</a>
              </div>
              
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
        New Quotation Received
        
        Dear ${firstName} ${lastName},
        
        You have received a new quotation from ${vendorOrganizationName} for RFQ ${rfqNumber}.
        
        Quotation Number: ${quotationNumber}
        RFQ Number: ${rfqNumber}
        Vendor: ${vendorOrganizationName}
        Total Amount: ${quotationDetails.currency} ${quotationDetails.totalAmount?.toFixed(2) || '0.00'}
        
        View Quotation: ${quotationLink}
        
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
      logger.info(`✅ Quotation notification email sent to ${to}: ${info.messageId}`);
      logger.info(`   Quotation Number: ${quotationNumber}, RFQ: ${rfqNumber}`);
      return info;
    } catch (error: any) {
      logger.error(`Failed to send quotation notification email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send email to vendor when their quotation is finalized
   * Instructs vendor to log in and submit banking details
   */
  async sendQuotationFinalizedEmail({
    to,
    firstName,
    lastName,
    vendorOrganizationName: _vendorOrganizationName,
    quotationNumber,
    rfqNumber,
    customerOrganizationName,
    quotationLink,
    totalAmount,
    currency,
  }: {
    to: string;
    firstName: string;
    lastName: string;
    vendorOrganizationName: string;
    quotationNumber: string;
    rfqNumber: string;
    customerOrganizationName: string;
    quotationLink: string;
    totalAmount: number;
    currency: string;
  }) {
    try {
      const subject = `🎉 Your Quotation Has Been Finalized - ${quotationNumber}`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 6px; }
            .info-box { background: #fff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0066cc; }
            .button { display: inline-block; padding: 14px 35px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 25px 0; font-weight: bold; }
            .button:hover { background: #059669; }
            .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
            .details-table th, .details-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            .details-table th { background: #f3f4f6; font-weight: 600; color: #374151; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .highlight { color: #10b981; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🎉 Quotation Finalized!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Your offer has been accepted</p>
            </div>
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              
              <div class="success-box">
                <h2 style="margin: 0 0 10px 0; color: #065f46; font-size: 20px;">Congratulations!</h2>
                <p style="margin: 0; color: #047857; font-size: 16px;">
                  Your quotation <strong>${quotationNumber}</strong> has been finalized by <strong>${customerOrganizationName}</strong>.
                </p>
              </div>

              <p>We are pleased to inform you that your quotation has been selected and finalized. Please proceed with the next steps to complete the order process.</p>

              <div class="info-box">
                <h3 style="margin: 0 0 15px 0; color: #0066cc;">Order Details</h3>
                <table class="details-table">
                  <tr>
                    <th>Quotation Number</th>
                    <td><strong>${quotationNumber}</strong></td>
                  </tr>
                  <tr>
                    <th>RFQ Number</th>
                    <td>${rfqNumber}</td>
                  </tr>
                  <tr>
                    <th>Customer</th>
                    <td>${customerOrganizationName}</td>
                  </tr>
                  <tr>
                    <th>Total Amount</th>
                    <td class="highlight">${currency} ${totalAmount?.toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td><span style="background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 12px; font-weight: 600;">Finalized</span></td>
                  </tr>
                </table>
              </div>

              <div class="info-box" style="background: #fef3c7; border-left-color: #f59e0b;">
                <h3 style="margin: 0 0 15px 0; color: #92400e;">⚠️ Action Required: Submit Banking Details</h3>
                <p style="margin: 0 0 15px 0; color: #78350f;">
                  To proceed with the order, please log in to your vendor portal and submit your banking details for payment processing.
                </p>
                <p style="margin: 0; color: #78350f; font-weight: 600;">
                  This is required to complete the order and receive payment.
                </p>
              </div>

              <p style="margin-top: 30px;">Please log in to the Euroasiann ERP Platform to:</p>
              <ul style="line-height: 2;">
                <li>View the complete order details</li>
                <li>Submit your banking information</li>
                <li>Track the order status</li>
                <li>Access all related documents</li>
              </ul>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${quotationLink}" class="button">Log In & Submit Banking Details</a>
              </div>

              <p style="margin-top: 30px;">If you have any questions or need assistance, please contact our support team.</p>
              
              <p>Best regards,<br><strong>Euroasiann ERP Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>© ${new Date().getFullYear()} Euroasiann ERP. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        Quotation Finalized - Congratulations!
        
        Dear ${firstName} ${lastName},
        
        Your quotation ${quotationNumber} has been finalized by ${customerOrganizationName}.
        
        Order Details:
        - Quotation Number: ${quotationNumber}
        - RFQ Number: ${rfqNumber}
        - Customer: ${customerOrganizationName}
        - Total Amount: ${currency} ${totalAmount?.toFixed(2) || '0.00'}
        - Status: Finalized
        
        ACTION REQUIRED: Submit Banking Details
        
        To proceed with the order, please log in to your vendor portal and submit your banking details for payment processing.
        
        Log in here: ${quotationLink}
        
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
      logger.info(`✅ Quotation finalized email sent to ${to}: ${info.messageId}`);
      logger.info(`   Quotation Number: ${quotationNumber}, RFQ: ${rfqNumber}`);
      return info;
    } catch (error: any) {
      logger.error(`Failed to send quotation finalized email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send banking details email to customer (PDF format)
   */
  async sendBankingDetailsEmail({
    to,
    firstName,
    lastName,
    vendorOrganizationName,
    quotationNumber,
    rfqNumber,
    bankingDetails,
    rfqLink,
  }: {
    to: string;
    firstName: string;
    lastName: string;
    vendorOrganizationName: string;
    quotationNumber: string;
    rfqNumber: string;
    bankingDetails: any;
    rfqLink: string;
  }) {
    try {
      const subject = `Banking Details Received - Quotation ${quotationNumber}`;

      // Format banking details as HTML table
      const bankingDetailsTable = `
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white;">
          <tr style="background: #f3f4f6;">
            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Field</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Details</th>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Bank Name</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${bankingDetails.bankName || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Account Holder Name</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${bankingDetails.accountHolderName || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Account Number</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${bankingDetails.accountNumber || 'N/A'}</td>
          </tr>
          ${bankingDetails.accountType ? `
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Account Type</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${bankingDetails.accountType}</td>
          </tr>
          ` : ''}
          ${bankingDetails.bankSwiftCode ? `
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>SWIFT Code</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${bankingDetails.bankSwiftCode}</td>
          </tr>
          ` : ''}
          ${bankingDetails.bankIBAN ? `
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>IBAN</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${bankingDetails.bankIBAN}</td>
          </tr>
          ` : ''}
          ${bankingDetails.routingNumber ? `
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Routing Number</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${bankingDetails.routingNumber}</td>
          </tr>
          ` : ''}
          ${bankingDetails.bankAddress ? `
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Bank Address</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${bankingDetails.bankAddress}</td>
          </tr>
          ` : ''}
          ${bankingDetails.bankCity ? `
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Bank City</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${bankingDetails.bankCity}</td>
          </tr>
          ` : ''}
          ${bankingDetails.bankCountry ? `
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Bank Country</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${bankingDetails.bankCountry}</td>
          </tr>
          ` : ''}
          ${bankingDetails.branchName ? `
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Branch Name</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${bankingDetails.branchName}</td>
          </tr>
          ` : ''}
          ${bankingDetails.branchCode ? `
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Branch Code</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${bankingDetails.branchCode}</td>
          </tr>
          ` : ''}
          ${bankingDetails.currency ? `
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Currency</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${bankingDetails.currency}</td>
          </tr>
          ` : ''}
        </table>
      `;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0066cc 0%, #004499 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: #fff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0066cc; }
            .button { display: inline-block; padding: 14px 35px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px; margin: 25px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Banking Details Received</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              
              <p>We have received banking details from <strong>${vendorOrganizationName}</strong> for the following quotation:</p>

              <div class="info-box">
                <h3 style="margin: 0 0 15px 0; color: #0066cc;">Quotation Information</h3>
                <p style="margin: 5px 0;"><strong>Quotation Number:</strong> ${quotationNumber}</p>
                <p style="margin: 5px 0;"><strong>RFQ Number:</strong> ${rfqNumber}</p>
                <p style="margin: 5px 0;"><strong>Vendor:</strong> ${vendorOrganizationName}</p>
              </div>

              <h3 style="color: #0066cc; margin-top: 30px;">Banking Details</h3>
              ${bankingDetailsTable}

              ${bankingDetails.notes ? `
              <div class="info-box" style="background: #fef3c7; border-left-color: #f59e0b;">
                <h3 style="margin: 0 0 10px 0; color: #92400e;">Notes</h3>
                <p style="margin: 0; color: #78350f;">${bankingDetails.notes}</p>
              </div>
              ` : ''}

              <p style="margin-top: 30px;">Please log in to the Euroasiann ERP Platform to view the complete banking details and proceed with payment.</p>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${rfqLink}" class="button">View RFQ Details</a>
              </div>

              <p>Best regards,<br><strong>Euroasiann ERP Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        Banking Details Received
        
        Dear ${firstName} ${lastName},
        
        We have received banking details from ${vendorOrganizationName} for quotation ${quotationNumber}.
        
        RFQ Number: ${rfqNumber}
        Vendor: ${vendorOrganizationName}
        
        Banking Details:
        - Bank Name: ${bankingDetails.bankName || 'N/A'}
        - Account Holder: ${bankingDetails.accountHolderName || 'N/A'}
        - Account Number: ${bankingDetails.accountNumber || 'N/A'}
        ${bankingDetails.accountType ? `- Account Type: ${bankingDetails.accountType}` : ''}
        ${bankingDetails.bankSwiftCode ? `- SWIFT Code: ${bankingDetails.bankSwiftCode}` : ''}
        ${bankingDetails.bankIBAN ? `- IBAN: ${bankingDetails.bankIBAN}` : ''}
        ${bankingDetails.routingNumber ? `- Routing Number: ${bankingDetails.routingNumber}` : ''}
        
        View RFQ: ${rfqLink}
        
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
      logger.info(`✅ Banking details email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error: any) {
      logger.error(`Failed to send banking details email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send payment proof email to vendor
   */
  async sendPaymentProofEmail({
    to,
    firstName,
    lastName,
    customerOrganizationName,
    quotationNumber,
    rfqNumber,
    paymentProof,
    rfqLink,
  }: {
    to: string;
    firstName: string;
    lastName: string;
    customerOrganizationName: string;
    quotationNumber: string;
    rfqNumber: string;
    paymentProof: any;
    rfqLink: string;
  }) {
    try {
      const subject = `💰 Payment Received - Quotation ${quotationNumber}`;

      // Format payment details as HTML table
      const paymentDetailsTable = `
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white;">
          <tr style="background: #f3f4f6;">
            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Field</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Details</th>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Payment Amount</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; font-size: 18px; font-weight: bold; color: #10b981;">
              ${paymentProof.currency || 'USD'} ${paymentProof.paymentAmount?.toFixed(2) || '0.00'}
            </td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Payment Date</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${new Date(paymentProof.paymentDate).toLocaleDateString()}</td>
          </tr>
          ${paymentProof.paymentMethod ? `
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Payment Method</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${paymentProof.paymentMethod}</td>
          </tr>
          ` : ''}
          ${paymentProof.transactionReference ? `
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Transaction Reference</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${paymentProof.transactionReference}</td>
          </tr>
          ` : ''}
          ${paymentProof.notes ? `
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Notes</strong></td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${paymentProof.notes}</td>
          </tr>
          ` : ''}
        </table>
      `;

      // Format proof documents
      const proofDocumentsSection = paymentProof.proofDocuments && paymentProof.proofDocuments.length > 0 ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #0066cc; margin-bottom: 15px;">Payment Proof Documents</h3>
          <ul style="list-style: none; padding: 0;">
            ${paymentProof.proofDocuments.map((doc: any, _index: number) => `
              <li style="padding: 10px; background: #f9f9f9; margin: 5px 0; border-radius: 4px;">
                📎 ${doc.fileName}
                ${doc.fileUrl ? `<a href="${doc.fileUrl}" style="color: #0066cc; margin-left: 10px;">View</a>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      ` : '';

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 6px; }
            .info-box { background: #fff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0066cc; }
            .button { display: inline-block; padding: 14px 35px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 25px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">💰 Payment Received!</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              
              <div class="success-box">
                <h2 style="margin: 0 0 10px 0; color: #065f46; font-size: 20px;">Payment Confirmed</h2>
                <p style="margin: 0; color: #047857; font-size: 16px;">
                  We have received payment from <strong>${customerOrganizationName}</strong> for quotation <strong>${quotationNumber}</strong>.
                </p>
              </div>

              <div class="info-box">
                <h3 style="margin: 0 0 15px 0; color: #0066cc;">Quotation Information</h3>
                <p style="margin: 5px 0;"><strong>Quotation Number:</strong> ${quotationNumber}</p>
                <p style="margin: 5px 0;"><strong>RFQ Number:</strong> ${rfqNumber}</p>
                <p style="margin: 5px 0;"><strong>Customer:</strong> ${customerOrganizationName}</p>
              </div>

              <h3 style="color: #0066cc; margin-top: 30px;">Payment Details</h3>
              ${paymentDetailsTable}

              ${proofDocumentsSection}

              <p style="margin-top: 30px;">Please log in to the Euroasiann ERP Platform to view the payment proof documents and update the order status.</p>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${rfqLink}" class="button">View RFQ Details</a>
              </div>

              <p>Best regards,<br><strong>Euroasiann ERP Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        Payment Received
        
        Dear ${firstName} ${lastName},
        
        We have received payment from ${customerOrganizationName} for quotation ${quotationNumber}.
        
        RFQ Number: ${rfqNumber}
        Customer: ${customerOrganizationName}
        
        Payment Details:
        - Payment Amount: ${paymentProof.currency || 'USD'} ${paymentProof.paymentAmount?.toFixed(2) || '0.00'}
        - Payment Date: ${new Date(paymentProof.paymentDate).toLocaleDateString()}
        ${paymentProof.paymentMethod ? `- Payment Method: ${paymentProof.paymentMethod}` : ''}
        ${paymentProof.transactionReference ? `- Transaction Reference: ${paymentProof.transactionReference}` : ''}
        
        View RFQ: ${rfqLink}
        
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
      logger.info(`✅ Payment proof email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error: any) {
      logger.error(`Failed to send payment proof email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send payment approval email to customer with shipping options
   */
  async sendPaymentApprovalEmail({
    to,
    firstName,
    lastName,
    vendorOrganizationName,
    quotationNumber,
    rfqNumber,
    rfqLink,
  }: {
    to: string;
    firstName: string;
    lastName: string;
    vendorOrganizationName: string;
    quotationNumber: string;
    rfqNumber: string;
    rfqLink: string;
  }) {
    try {
      const subject = `✅ Payment Approved - Order Being Packed - Quotation ${quotationNumber}`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 6px; }
            .info-box { background: #fff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0066cc; }
            .shipping-box { background: #fff; padding: 25px; border-radius: 6px; margin: 25px 0; border: 2px solid #0066cc; }
            .shipping-option { display: block; padding: 15px 20px; margin: 10px 0; background: #f0f9ff; border: 2px solid #bae6fd; border-radius: 6px; text-decoration: none; color: #0066cc; font-weight: bold; text-align: center; }
            .shipping-option:hover { background: #e0f2fe; border-color: #7dd3fc; }
            .button { display: inline-block; padding: 14px 35px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 25px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">✅ Payment Approved!</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              
              <div class="success-box">
                <h2 style="margin: 0 0 10px 0; color: #065f46; font-size: 20px;">✅ Payment Approved & Order Being Packed</h2>
                <p style="margin: 0; color: #047857; font-size: 16px;">
                  <strong>${vendorOrganizationName}</strong> has approved your payment and has started packing your order for quotation <strong>${quotationNumber}</strong>.
                </p>
              </div>

              <div class="info-box">
                <h3 style="margin: 0 0 15px 0; color: #0066cc;">Order Information</h3>
                <p style="margin: 5px 0;"><strong>Quotation Number:</strong> ${quotationNumber}</p>
                <p style="margin: 5px 0;"><strong>RFQ Number:</strong> ${rfqNumber}</p>
                <p style="margin: 5px 0;"><strong>Vendor:</strong> ${vendorOrganizationName}</p>
              </div>

              <div class="shipping-box">
                <h3 style="margin: 0 0 15px 0; color: #0066cc; font-size: 18px;">🚚 Update Shipping Details</h3>
                <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">
                  <strong>Please log in to the Euroasiann ERP Platform to update your shipping details.</strong>
                </p>
                <p style="margin: 0 0 20px 0; color: #666;">
                  You can choose between:
                </p>
                <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #333;">
                  <li><strong>📦 Self Shipping:</strong> You will arrange your own shipping/logistics and provide AWB tracking number</li>
                  <li><strong>🚢 Vendor Managed Shipping:</strong> Vendor will handle shipping and logistics</li>
                </ul>
              </div>

              <p style="margin-top: 30px; font-size: 16px; font-weight: bold; color: #0066cc;">
                Please log in to update your shipping details and complete the order process.
              </p>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${rfqLink}" class="button">Log In & Update Shipping Details</a>
              </div>

              <p>Best regards,<br><strong>Euroasiann ERP Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        Payment Approved - Order Being Packed
        
        Dear ${firstName} ${lastName},
        
        ${vendorOrganizationName} has approved your payment and has started packing your order for quotation ${quotationNumber}.
        
        RFQ Number: ${rfqNumber}
        Vendor: ${vendorOrganizationName}
        
        Please select your shipping option:
        
        1. Self Shipping - You will arrange your own shipping/logistics
        2. Vendor Managed Shipping - Vendor will handle shipping and logistics
        
        View RFQ: ${rfqLink}
        
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
      logger.info(`✅ Payment approval email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error: any) {
      logger.error(`Failed to send payment approval email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send shipping decision email to vendor
   */
  async sendShippingDecisionEmail({
    to,
    firstName,
    lastName,
    customerOrganizationName,
    quotationNumber,
    rfqNumber,
    shippingOption,
    shippingDetails,
    rfqLink,
  }: {
    to: string;
    firstName: string;
    lastName: string;
    customerOrganizationName: string;
    quotationNumber: string;
    rfqNumber: string;
    shippingOption: 'self' | 'vendor-managed';
    shippingDetails?: {
      awbTrackingNumber: string;
      shippingContactName: string;
      shippingContactEmail: string;
      shippingContactPhone: string;
    };
    rfqLink: string;
  }) {
    try {
      const subject = `🚚 Shipping Decision - Quotation ${quotationNumber}`;

      const shippingDetailsSection = shippingOption === 'self' && shippingDetails ? `
        <div style="background: #fff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0066cc;">
          <h3 style="margin: 0 0 15px 0; color: #0066cc;">Self-Managed Shipping Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>AWB Tracking Number:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${shippingDetails.awbTrackingNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Contact Name:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${shippingDetails.shippingContactName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Contact Email:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${shippingDetails.shippingContactEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px;"><strong>Contact Phone:</strong></td>
              <td style="padding: 8px;">${shippingDetails.shippingContactPhone}</td>
            </tr>
          </table>
        </div>
      ` : `
        <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 10px 0; color: #065f46;">✅ Vendor Managed Shipping</h3>
          <p style="margin: 0; color: #047857; font-size: 16px; font-weight: bold;">
            Please log in to the vendor portal and submit the AWB tracking number and shipping contact details.
          </p>
          <p style="margin: 10px 0 0 0; color: #047857;">
            Once you submit the shipping details, the customer will be notified via email.
          </p>
        </div>
      `;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0066cc 0%, #004499 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: #fff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0066cc; }
            .button { display: inline-block; padding: 14px 35px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px; margin: 25px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🚚 Shipping Decision Received</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              
              <div class="info-box">
                <h3 style="margin: 0 0 15px 0; color: #0066cc;">Order Information</h3>
                <p style="margin: 5px 0;"><strong>Quotation Number:</strong> ${quotationNumber}</p>
                <p style="margin: 5px 0;"><strong>RFQ Number:</strong> ${rfqNumber}</p>
                <p style="margin: 5px 0;"><strong>Customer:</strong> ${customerOrganizationName}</p>
              </div>

              <h3 style="color: #0066cc; margin-top: 30px;">Customer Shipping Decision</h3>
              ${shippingDetailsSection}

              <p style="margin-top: 30px;">Please log in to the Euroasiann ERP Platform to view the complete shipping details and proceed with the order.</p>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${rfqLink}" class="button">View RFQ Details</a>
              </div>

              <p>Best regards,<br><strong>Euroasiann ERP Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        Shipping Decision Received
        
        Dear ${firstName} ${lastName},
        
        Customer ${customerOrganizationName} has selected their shipping option for quotation ${quotationNumber}.
        
        RFQ Number: ${rfqNumber}
        Customer: ${customerOrganizationName}
        
        Shipping Option: ${shippingOption === 'self' ? 'Self-Managed Shipping' : 'Vendor Managed Shipping'}
        
        ${shippingOption === 'self' && shippingDetails ? `
        Self-Managed Shipping Details:
        - AWB Tracking Number: ${shippingDetails.awbTrackingNumber}
        - Contact Name: ${shippingDetails.shippingContactName}
        - Contact Email: ${shippingDetails.shippingContactEmail}
        - Contact Phone: ${shippingDetails.shippingContactPhone}
        ` : `
        Vendor Managed Shipping:
        We will take care of the rest, chillax!
        Please proceed with arranging shipping and logistics.
        `}
        
        View RFQ: ${rfqLink}
        
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
      logger.info(`✅ Shipping decision email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error: any) {
      logger.error(`Failed to send shipping decision email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send vendor shipping details email to customer
   */
  async sendVendorShippingDetailsEmail({
    to,
    firstName,
    lastName,
    vendorOrganizationName,
    quotationNumber,
    rfqNumber,
    shippingDetails,
    rfqLink,
  }: {
    to: string;
    firstName: string;
    lastName: string;
    vendorOrganizationName: string;
    quotationNumber: string;
    rfqNumber: string;
    shippingDetails: {
      awbTrackingNumber: string;
      shippingContactName: string;
      shippingContactEmail: string;
      shippingContactPhone: string;
    };
    rfqLink: string;
  }) {
    try {
      const subject = `📦 Shipping Details Received - Quotation ${quotationNumber}`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: #fff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
            .shipping-box { background: #e0f2fe; border-left: 4px solid #0284c7; padding: 20px; margin: 20px 0; border-radius: 6px; }
            .button { display: inline-block; padding: 14px 35px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 25px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
            td:first-child { font-weight: bold; width: 40%; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">📦 Shipping Details Received</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              
              <div class="info-box">
                <h3 style="margin: 0 0 15px 0; color: #10b981;">Order Information</h3>
                <p style="margin: 5px 0;"><strong>Quotation Number:</strong> ${quotationNumber}</p>
                <p style="margin: 5px 0;"><strong>RFQ Number:</strong> ${rfqNumber}</p>
                <p style="margin: 5px 0;"><strong>Vendor:</strong> ${vendorOrganizationName}</p>
              </div>

              <div class="shipping-box">
                <h3 style="margin: 0 0 15px 0; color: #0284c7;">Shipping Details</h3>
                <p style="margin: 0 0 15px 0; color: #0369a1;">
                  ${vendorOrganizationName} has submitted the shipping details for your order:
                </p>
                <table>
                  <tr>
                    <td>AWB Tracking Number:</td>
                    <td>${shippingDetails.awbTrackingNumber}</td>
                  </tr>
                  <tr>
                    <td>Contact Name:</td>
                    <td>${shippingDetails.shippingContactName}</td>
                  </tr>
                  <tr>
                    <td>Contact Email:</td>
                    <td>${shippingDetails.shippingContactEmail}</td>
                  </tr>
                  <tr>
                    <td>Contact Phone:</td>
                    <td>${shippingDetails.shippingContactPhone}</td>
                  </tr>
                </table>
              </div>

              <p style="margin-top: 30px;">You can view the complete shipping details in the Euroasiann ERP Platform.</p>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${rfqLink}" class="button">View RFQ Details</a>
              </div>

              <p>Best regards,<br><strong>Euroasiann ERP Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        Shipping Details Received - Quotation ${quotationNumber}
        
        Dear ${firstName} ${lastName},
        
        ${vendorOrganizationName} has submitted the shipping details for your order.
        
        Quotation Number: ${quotationNumber}
        RFQ Number: ${rfqNumber}
        Vendor: ${vendorOrganizationName}
        
        Shipping Details:
        - AWB Tracking Number: ${shippingDetails.awbTrackingNumber}
        - Contact Name: ${shippingDetails.shippingContactName}
        - Contact Email: ${shippingDetails.shippingContactEmail}
        - Contact Phone: ${shippingDetails.shippingContactPhone}
        
        View RFQ: ${rfqLink}
        
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
      logger.info(`✅ Vendor shipping details email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error: any) {
      logger.error(`Failed to send vendor shipping details email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}

export const emailService = new EmailService();



