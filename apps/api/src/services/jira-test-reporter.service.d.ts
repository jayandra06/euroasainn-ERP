/**
 * Jira Test Reporter Service
 * Automatically creates Jira issues for test failures
 */
export interface TestFailure {
    testName: string;
    filePath: string;
    errorMessage: string;
    stackTrace?: string;
    duration?: number;
    suiteName?: string;
}
export interface TestRunSummary {
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    failures: TestFailure[];
}
export declare class JiraTestReporterService {
    private jiraService;
    private projectKey;
    private defaultAssignee?;
    private defaultLabels;
    constructor();
    /**
     * Create Jira issue for a test failure
     */
    createIssueForTestFailure(failure: TestFailure): Promise<string | null>;
    /**
     * Create summary issue for test run
     */
    createTestRunSummary(summary: TestRunSummary): Promise<string | null>;
    /**
     * Build description for test failure
     */
    private buildFailureDescription;
    /**
     * Find existing issue for a test
     */
    private findExistingIssue;
    /**
     * Determine priority based on failure
     */
    private determinePriority;
    /**
     * Get label from file path
     */
    private getFileLabel;
    /**
     * Assign issue to developer based on file path
     */
    assignIssueToDeveloper(issueKey: string, filePath: string): Promise<void>;
    /**
     * Get assignee map from environment variables
     * Format: JIRA_ASSIGNEE_MAP={"auth":"user1@example.com","payment":"user2@example.com"}
     */
    private getAssigneeMap;
}
//# sourceMappingURL=jira-test-reporter.service.d.ts.map