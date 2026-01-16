/**
 * Jira Automation Controller
 * Handles webhooks and automation triggers
 */
import { Request, Response } from 'express';
export declare class JiraAutomationController {
    /**
     * Handle Jira webhook
     * POST /api/v1/jira/webhook
     */
    static handleWebhook(req: Request, res: Response): Promise<void>;
    /**
     * Manually trigger automation for an issue
     * POST /api/v1/jira/automation/trigger/:issueKey
     */
    static triggerAutomation(req: Request, res: Response): Promise<void>;
    /**
     * Get automation rules
     * GET /api/v1/jira/automation/rules
     */
    static getRules(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=jira-automation.controller.d.ts.map