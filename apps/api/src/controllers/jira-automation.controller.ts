/**
 * Jira Automation Controller
 * Handles webhooks and automation triggers
 */

import { Request, Response } from 'express';
import { JiraAutomationService } from '../services/jira-automation.service';
import { logger } from '../config/logger';

const automationService = new JiraAutomationService();

export class JiraAutomationController {
  /**
   * Handle Jira webhook
   * POST /api/v1/jira/webhook
   */
  static async handleWebhook(req: Request, res: Response) {
    try {
      const event = req.body;

      // Verify webhook (optional - add signature verification)
      const webhookSecret = process.env.JIRA_WEBHOOK_SECRET;
      if (webhookSecret) {
        const signature = req.headers['x-jira-webhook-signature'];
        // Add signature verification logic here if needed
      }

      // Process webhook asynchronously
      automationService.processWebhookEvent(event).catch((error) => {
        logger.error('Error processing webhook asynchronously:', error);
      });

      // Respond immediately
      res.status(200).json({
        success: true,
        message: 'Webhook received',
      });
    } catch (error: any) {
      logger.error('Error handling webhook:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process webhook',
      });
    }
  }

  /**
   * Manually trigger automation for an issue
   * POST /api/v1/jira/automation/trigger/:issueKey
   */
  static async triggerAutomation(req: Request, res: Response) {
    try {
      const { issueKey } = req.params;
      
      await automationService.processIssue(issueKey);
      
      res.json({
        success: true,
        message: `Automation triggered for issue ${issueKey}`,
      });
    } catch (error: any) {
      logger.error('Error triggering automation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to trigger automation',
      });
    }
  }

  /**
   * Get automation rules
   * GET /api/v1/jira/automation/rules
   */
  static async getRules(req: Request, res: Response) {
    try {
      // Return list of active rules (simplified)
      res.json({
        success: true,
        data: [
          'Assign Test Failures',
          'Assign by Component',
          'Set Priority by Label',
          'Auto Transition',
        ],
      });
    } catch (error: any) {
      logger.error('Error getting rules:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get rules',
      });
    }
  }
}
