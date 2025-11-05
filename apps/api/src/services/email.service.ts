import transporter from '../config/email';
import { logger } from '../config/logger';

interface SendInvitationEmailParams {
  to: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  organizationType: 'customer' | 'vendor';
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
    temporaryPassword,
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
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #0066cc;">${invitationLink}</p>
              
              ${temporaryPassword ? `
                <div class="credentials">
                  <p><strong>Your temporary login credentials:</strong></p>
                  <p><strong>Email:</strong> ${to}</p>
                  <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
                  <p style="color: #d32f2f; font-size: 12px;"><em>Please change your password after first login.</em></p>
                </div>
              ` : ''}
              
              <p>This invitation link will expire in 7 days.</p>
              
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
        
        ${temporaryPassword ? `Your temporary login credentials:\nEmail: ${to}\nTemporary Password: ${temporaryPassword}\nPlease change your password after first login.` : ''}
        
        This invitation link will expire in 7 days.
        
        Best regards,
        Euroasiann ERP Team
      `;

      const mailOptions = {
        from: `"Euroasiann ERP" <${process.env.EMAIL_USER || 'technical@euroasianngroup.com'}>`,
        to,
        subject,
        text,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Invitation email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error: any) {
      logger.error(`Failed to send invitation email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendWelcomeEmail({
    to,
    firstName,
    lastName,
  }: {
    to: string;
    firstName: string;
    lastName: string;
  }) {
    try {
      const subject = 'Welcome to Euroasiann ERP';
      
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Euroasiann ERP</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              <p>Your onboarding has been completed successfully!</p>
              <p>You can now access your portal and start using the Euroasiann ERP platform.</p>
              <p>Best regards,<br>Euroasiann ERP Team</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Euroasiann ERP" <${process.env.EMAIL_USER || 'technical@euroasianngroup.com'}>`,
        to,
        subject,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error: any) {
      logger.error(`Failed to send welcome email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}

export const emailService = new EmailService();

