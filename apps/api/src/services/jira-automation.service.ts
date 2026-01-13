/**
 * Jira Automation Service
 * Handles automated task assignment and workflow automation
 */

import { JiraService } from './jira.service';
import { logger } from '../config/logger';

export interface AutomationRule {
  name: string;
  condition: (issue: any) => boolean;
  action: (issue: any, jiraService: JiraService) => Promise<void>;
  priority: number; // Lower number = higher priority
}

export class JiraAutomationService {
  private jiraService: JiraService;
  private rules: AutomationRule[] = [];

  constructor() {
    this.jiraService = new JiraService();
    this.initializeDefaultRules();
  }

  /**
   * Initialize default automation rules
   */
  private initializeDefaultRules() {
    // Rule 1: Assign test failures to QA team
    this.addRule({
      name: 'Assign Test Failures',
      priority: 1,
      condition: (issue) => {
        return issue.fields.labels?.some((label: string) => label === 'test-failure') || false;
      },
      action: async (issue) => {
        const qaAssignee = process.env.JIRA_QA_ASSIGNEE;
        if (qaAssignee) {
          await this.jiraService.updateIssue(issue.key, { assignee: qaAssignee });
          logger.info(`Assigned test failure ${issue.key} to QA team`);
        }
      },
    });

    // Rule 2: Assign bugs based on component
    this.addRule({
      name: 'Assign by Component',
      priority: 2,
      condition: (issue) => {
        return issue.fields.issuetype?.name === 'Bug';
      },
      action: async (issue) => {
        const component = this.extractComponent(issue);
        const assignee = this.getAssigneeForComponent(component);
        if (assignee) {
          await this.jiraService.updateIssue(issue.key, { assignee });
          logger.info(`Assigned bug ${issue.key} to ${assignee} based on component: ${component}`);
        }
      },
    });

    // Rule 3: Set priority based on labels
    this.addRule({
      name: 'Set Priority by Label',
      priority: 3,
      condition: (issue) => {
        return issue.fields.labels?.some((label: string) => 
          ['critical', 'high-priority', 'urgent'].includes(label)
        ) || false;
      },
      action: async (issue) => {
        const hasCritical = issue.fields.labels?.includes('critical');
        const priority = hasCritical ? 'Highest' : 'High';
        await this.jiraService.updateIssue(issue.key, { priority });
        logger.info(`Set priority ${priority} for issue ${issue.key}`);
      },
    });

    // Rule 4: Auto-transition based on status
    this.addRule({
      name: 'Auto Transition',
      priority: 4,
      condition: (issue) => {
        return issue.fields.status?.name === 'To Do' && 
               issue.fields.labels?.includes('auto-assign') || false;
      },
      action: async (issue) => {
        // Get available transitions
        const transitions = await this.jiraService.getTransitions(issue.key);
        const inProgressTransition = transitions.find((t: any) => 
          t.to.name === 'In Progress'
        );
        if (inProgressTransition) {
          await this.jiraService.transitionIssue(issue.key, inProgressTransition.id);
          logger.info(`Auto-transitioned issue ${issue.key} to In Progress`);
        }
      },
    });
  }

  /**
   * Add a new automation rule
   */
  addRule(rule: AutomationRule) {
    this.rules.push(rule);
    // Sort by priority
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Process an issue through automation rules
   */
  async processIssue(issueKey: string): Promise<void> {
    try {
      const issue = await this.jiraService.getIssue(issueKey);
      const fullIssue = await this.getFullIssue(issueKey);

      for (const rule of this.rules) {
        try {
          if (rule.condition(fullIssue)) {
            await rule.action(fullIssue, this.jiraService);
            logger.info(`Applied rule "${rule.name}" to issue ${issueKey}`);
          }
        } catch (error: any) {
          logger.error(`Error applying rule "${rule.name}" to issue ${issueKey}:`, error);
        }
      }
    } catch (error: any) {
      logger.error(`Error processing issue ${issueKey}:`, error);
    }
  }

  /**
   * Get full issue details from Jira
   */
  private async getFullIssue(issueKey: string): Promise<any> {
    return await this.jiraService.getFullIssue(issueKey);
  }

  /**
   * Extract component from issue
   */
  private extractComponent(issue: any): string {
    // Try to extract from summary, description, or labels
    const summary = issue.summary || '';
    const description = issue.description || '';
    const labels = issue.labels || [];

    // Check labels first
    const componentLabels = labels.filter((l: string) => 
      ['auth', 'payment', 'api', 'frontend', 'backend'].includes(l)
    );
    if (componentLabels.length > 0) {
      return componentLabels[0];
    }

    // Extract from summary/description
    const text = `${summary} ${description}`.toLowerCase();
    if (text.includes('auth')) return 'auth';
    if (text.includes('payment')) return 'payment';
    if (text.includes('api')) return 'api';
    if (text.includes('frontend')) return 'frontend';
    if (text.includes('backend')) return 'backend';

    return 'general';
  }

  /**
   * Get assignee for component
   */
  private getAssigneeForComponent(component: string): string | undefined {
    const assigneeMap: Record<string, string> = {
      auth: process.env.JIRA_AUTH_ASSIGNEE,
      payment: process.env.JIRA_PAYMENT_ASSIGNEE,
      api: process.env.JIRA_API_ASSIGNEE,
      frontend: process.env.JIRA_FRONTEND_ASSIGNEE,
      backend: process.env.JIRA_BACKEND_ASSIGNEE,
    };

    return assigneeMap[component] || process.env.JIRA_DEFAULT_ASSIGNEE;
  }

  /**
   * Process webhook event from Jira
   */
  async processWebhookEvent(event: any): Promise<void> {
    try {
      const eventType = event.webhookEvent;
      const issue = event.issue;

      if (!issue) {
        logger.warn('Webhook event missing issue data');
        return;
      }

      // Process different event types
      switch (eventType) {
        case 'jira:issue_created':
          await this.processIssue(issue.key);
          break;
        case 'jira:issue_updated':
          // Check if assignee was cleared or status changed
          if (event.changelog?.items?.some((item: any) => 
            item.field === 'assignee' || item.field === 'status'
          )) {
            await this.processIssue(issue.key);
          }
          break;
        default:
          logger.debug(`Unhandled webhook event type: ${eventType}`);
      }
    } catch (error: any) {
      logger.error('Error processing webhook event:', error);
    }
  }
}
