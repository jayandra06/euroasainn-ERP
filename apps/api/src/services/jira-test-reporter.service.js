/**
 * Jira Test Reporter Service
 * Automatically creates Jira issues for test failures
 */
import { JiraService } from './jira.service';
import { logger } from '../config/logger';
export class JiraTestReporterService {
    constructor() {
        this.jiraService = new JiraService();
        this.projectKey = process.env.JIRA_PROJECT_KEY || 'TEST';
        this.defaultAssignee = process.env.JIRA_DEFAULT_ASSIGNEE;
        this.defaultLabels = (process.env.JIRA_TEST_LABELS || 'test-failure,automated').split(',');
    }
    /**
     * Create Jira issue for a test failure
     */
    async createIssueForTestFailure(failure) {
        try {
            const summary = `Test Failure: ${failure.testName}`;
            const description = this.buildFailureDescription(failure);
            // Check if issue already exists for this test
            const existingIssue = await this.findExistingIssue(failure.testName);
            if (existingIssue) {
                logger.info(`Issue already exists for test: ${failure.testName} - ${existingIssue}`);
                // Add comment to existing issue
                await this.jiraService.addComment(existingIssue, `Test failed again:\n\n${description}\n\nFailed at: ${new Date().toISOString()}`);
                return existingIssue;
            }
            // Create new issue
            const issue = await this.jiraService.createIssue({
                projectKey: this.projectKey,
                summary,
                description,
                issueType: 'Bug',
                priority: this.determinePriority(failure),
                assignee: this.defaultAssignee,
                labels: [...this.defaultLabels, 'test-failure', this.getFileLabel(failure.filePath)],
            });
            logger.info(`Created Jira issue ${issue.key} for test failure: ${failure.testName}`);
            return issue.key;
        }
        catch (error) {
            logger.error('Failed to create Jira issue for test failure:', error);
            return null;
        }
    }
    /**
     * Create summary issue for test run
     */
    async createTestRunSummary(summary) {
        try {
            if (summary.failed === 0) {
                logger.info('All tests passed, no summary issue needed');
                return null;
            }
            const summaryText = `Test Run Summary
      
**Total Tests:** ${summary.totalTests}
**Passed:** ${summary.passed}
**Failed:** ${summary.failed}
**Skipped:** ${summary.skipped}
**Duration:** ${summary.duration}ms

## Failed Tests

${summary.failures.map((f, i) => `${i + 1}. ${f.testName} - ${f.errorMessage}`).join('\n')}
`;
            const issue = await this.jiraService.createIssue({
                projectKey: this.projectKey,
                summary: `Test Run Failed: ${summary.failed} of ${summary.totalTests} tests failed`,
                description: summaryText,
                issueType: 'Task',
                priority: summary.failed > 10 ? 'High' : 'Medium',
                assignee: this.defaultAssignee,
                labels: [...this.defaultLabels, 'test-run-summary'],
            });
            logger.info(`Created test run summary issue: ${issue.key}`);
            return issue.key;
        }
        catch (error) {
            logger.error('Failed to create test run summary:', error);
            return null;
        }
    }
    /**
     * Build description for test failure
     */
    buildFailureDescription(failure) {
        let description = `**Test Name:** ${failure.testName}\n`;
        description += `**File:** ${failure.filePath}\n`;
        if (failure.suiteName) {
            description += `**Suite:** ${failure.suiteName}\n`;
        }
        if (failure.duration) {
            description += `**Duration:** ${failure.duration}ms\n`;
        }
        description += `\n**Error Message:**\n\`\`\`\n${failure.errorMessage}\n\`\`\`\n`;
        if (failure.stackTrace) {
            description += `\n**Stack Trace:**\n\`\`\`\n${failure.stackTrace}\n\`\`\`\n`;
        }
        description += `\n**Failed At:** ${new Date().toISOString()}\n`;
        description += `\n**CI/CD Run:** ${process.env.CI ? 'Yes' : 'No'}\n`;
        if (process.env.GITHUB_RUN_ID) {
            description += `**GitHub Run ID:** ${process.env.GITHUB_RUN_ID}\n`;
        }
        if (process.env.GIT_COMMIT) {
            description += `**Commit:** ${process.env.GIT_COMMIT}\n`;
        }
        return description;
    }
    /**
     * Find existing issue for a test
     */
    async findExistingIssue(testName) {
        try {
            const jql = `project = ${this.projectKey} AND summary ~ "${testName}" AND status != Closed ORDER BY created DESC`;
            const issues = await this.jiraService.searchIssues(jql, 1);
            return issues.length > 0 ? issues[0].key : null;
        }
        catch (error) {
            logger.warn('Failed to search for existing issue:', error);
            return null;
        }
    }
    /**
     * Determine priority based on failure
     */
    determinePriority(failure) {
        // High priority for critical paths
        const criticalPaths = ['auth', 'payment', 'security'];
        if (criticalPaths.some(path => failure.filePath.toLowerCase().includes(path))) {
            return 'High';
        }
        // Medium for other failures
        return 'Medium';
    }
    /**
     * Get label from file path
     */
    getFileLabel(filePath) {
        const parts = filePath.split('/');
        const serviceName = parts.find(p => p === 'services' || p === 'controllers');
        if (serviceName) {
            const index = parts.indexOf(serviceName);
            if (index < parts.length - 1) {
                return parts[index + 1].replace('.test.ts', '').replace('.spec.ts', '');
            }
        }
        return 'unknown';
    }
    /**
     * Assign issue to developer based on file path
     */
    async assignIssueToDeveloper(issueKey, filePath) {
        try {
            // Get assignee mapping from environment or config
            const assigneeMap = this.getAssigneeMap();
            const assignee = assigneeMap[this.getFileLabel(filePath)] || this.defaultAssignee;
            if (assignee) {
                await this.jiraService.updateIssue(issueKey, { assignee });
                logger.info(`Assigned issue ${issueKey} to ${assignee}`);
            }
        }
        catch (error) {
            logger.error('Failed to assign issue:', error);
        }
    }
    /**
     * Get assignee map from environment variables
     * Format: JIRA_ASSIGNEE_MAP={"auth":"user1@example.com","payment":"user2@example.com"}
     */
    getAssigneeMap() {
        try {
            const mapStr = process.env.JIRA_ASSIGNEE_MAP;
            if (mapStr) {
                return JSON.parse(mapStr);
            }
        }
        catch (error) {
            logger.warn('Failed to parse assignee map:', error);
        }
        return {};
    }
}
//# sourceMappingURL=jira-test-reporter.service.js.map