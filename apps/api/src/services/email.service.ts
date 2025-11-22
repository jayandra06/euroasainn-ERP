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
  /** Utility: loads and compiles a Handlebars template */
  private renderTemplate(templateName: string, data: any) {
    const templatePath = path.join(
      __dirname,
      "..",
      "templates",
      `${templateName}.hbs`
    );

    const source = fs.readFileSync(templatePath, "utf8");
    const template = handlebars.compile(source);

    return template(data);
  }

  /** Sends invitation email with template */
  async sendInvitationEmail(params: SendInvitationEmailParams) {
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

  /** Sends welcome email using template */
  async sendWelcomeEmail(data: { to: string; firstName: string; lastName: string }) {
    try {
      const { to, firstName, lastName } = data;

      const html = this.renderTemplate("welcome", {
        firstName,
        lastName,
      });

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
      logger.error("❌ Failed to send welcome email:", error);
      throw new Error(error.message);
    }
  }
}

export const emailService = new EmailService();
