/**
 * Vitest Jira Reporter
 * Automatically creates Jira issues for test failures
 */

import type { Reporter, TaskResultPack } from 'vitest';
import { JiraTestReporterService, TestFailure, TestRunSummary } from '../services/jira-test-reporter.service';
import { logger } from '../config/logger';

export class JiraReporter implements Reporter {
  private reporterService: JiraTestReporterService;
  private failures: TestFailure[] = [];
  private testResults: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  } = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
  };

  constructor() {
    this.reporterService = new JiraTestReporterService();
  }

  onFinished(files = []) {
    const summary: TestRunSummary = {
      totalTests: this.testResults.total,
      passed: this.testResults.passed,
      failed: this.testResults.failed,
      skipped: this.testResults.skipped,
      duration: this.testResults.duration,
      failures: this.failures,
    };

    // Only create issues if there are failures
    if (this.failures.length > 0) {
      logger.info(`Test run completed with ${this.failures.length} failures. Creating Jira issues...`);

      // Create issues for each failure
      Promise.all(
        this.failures.map(async (failure) => {
          const issueKey = await this.reporterService.createIssueForTestFailure(failure);
          if (issueKey) {
            // Assign to developer based on file path
            await this.reporterService.assignIssueToDeveloper(issueKey, failure.filePath);
          }
        })
      ).then(() => {
        // Create summary issue
        this.reporterService.createTestRunSummary(summary);
      }).catch((error) => {
        logger.error('Error creating Jira issues:', error);
      });
    }
  }

  onTaskUpdate(packs: TaskResultPack[]) {
    for (const [id, result] of packs) {
      if (result?.state === 'pass') {
        this.testResults.passed++;
        this.testResults.total++;
      } else if (result?.state === 'fail') {
        this.testResults.failed++;
        this.testResults.total++;

        // Extract failure information
        const task = result.task;
        if (task && task.result?.state === 'fail') {
          const failure: TestFailure = {
            testName: task.name || 'Unknown Test',
            filePath: task.file?.name || 'Unknown File',
            errorMessage: this.extractErrorMessage(task.result),
            stackTrace: this.extractStackTrace(task.result),
            duration: task.result.duration,
            suiteName: task.suite?.name,
          };
          this.failures.push(failure);
        }
      } else if (result?.state === 'skip') {
        this.testResults.skipped++;
        this.testResults.total++;
      }

      if (result?.duration) {
        this.testResults.duration += result.duration;
      }
    }
  }

  private extractErrorMessage(result: any): string {
    if (result.errors && result.errors.length > 0) {
      return result.errors[0].message || 'Unknown error';
    }
    return 'Test failed';
  }

  private extractStackTrace(result: any): string | undefined {
    if (result.errors && result.errors.length > 0) {
      return result.errors[0].stack;
    }
    return undefined;
  }
}
