/**
 * Vitest Jira Reporter
 * Automatically creates Jira issues for test failures
 */
import type { Reporter, TaskResultPack } from 'vitest';
export declare class JiraReporter implements Reporter {
    private reporterService;
    private failures;
    private testResults;
    constructor();
    onFinished(files?: never[]): void;
    onTaskUpdate(packs: TaskResultPack[]): void;
    private extractErrorMessage;
    private extractStackTrace;
}
//# sourceMappingURL=jira-reporter.d.ts.map