/**
 * Sync test results to Jira
 * Run after test execution to create summary issues
 */

import { JiraTestReporterService } from '../src/services/jira-test-reporter.service.js';
import fs from 'fs';
import path from 'path';

async function syncResults() {
  try {
    const reporter = new JiraTestReporterService();
    
    // Read test results if available
    const resultsPath = path.join(process.cwd(), 'test-results.json');
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      await reporter.createTestRunSummary(results);
    }
    
    console.log('✅ Test results synced to Jira');
  } catch (error) {
    console.error('❌ Error syncing results:', error);
    process.exit(1);
  }
}

syncResults();
