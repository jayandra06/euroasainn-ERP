/**
 * Jira Automation Service
 * Handles automated task assignment and workflow automation
 */
import { JiraService } from './jira.service';
export interface AutomationRule {
    name: string;
    condition: (issue: any) => boolean;
    action: (issue: any, jiraService: JiraService) => Promise<void>;
    priority: number;
}
export declare class JiraAutomationService {
    private jiraService;
    private rules;
    constructor();
    /**
     * Initialize default automation rules
     */
    private initializeDefaultRules;
    /**
     * Add a new automation rule
     */
    addRule(rule: AutomationRule): void;
    /**
     * Process an issue through automation rules
     */
    processIssue(issueKey: string): Promise<void>;
    /**
     * Get full issue details from Jira
     */
    private getFullIssue;
    /**
     * Extract component from issue
     */
    private extractComponent;
    /**
     * Get assignee for component
     */
    private getAssigneeForComponent;
    /**
     * Process webhook event from Jira
     */
    processWebhookEvent(event: any): Promise<void>;
}
//# sourceMappingURL=jira-automation.service.d.ts.map