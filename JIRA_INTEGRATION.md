# Jira Integration - Complete Testing Automation

This document describes the complete Jira integration for automated test failure tracking and task assignment.

## 🎯 Features

### 1. **Automatic Test Failure Reporting**
- All test failures automatically create Jira issues
- Detailed error messages and stack traces included
- Test run summaries created for CI/CD runs
- Duplicate detection prevents multiple issues for same test

### 2. **Automated Task Assignment**
- Test failures automatically assigned to QA team
- Bugs assigned based on component (auth, payment, API, etc.)
- Priority automatically set based on labels
- Custom assignment rules configurable

### 3. **Webhook Integration**
- Jira webhooks trigger automation
- Auto-assignment on issue creation
- Status transitions handled automatically
- Custom workflow automation

### 4. **CI/CD Integration**
- GitHub Actions workflow for test execution
- Automatic Jira issue creation on test failures
- Test coverage reporting
- Commit and run ID tracking

## 📋 Setup Instructions

### 1. Environment Variables

Add to your `.env` file:

```env
# Jira Basic Configuration
JIRA_DOMAIN=yourcompany.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token

# Jira Project Configuration
JIRA_PROJECT_KEY=TEST
JIRA_DEFAULT_ASSIGNEE=user@example.com

# Test Failure Assignment
JIRA_QA_ASSIGNEE=qa-team@example.com

# Component-based Assignment
JIRA_AUTH_ASSIGNEE=auth-dev@example.com
JIRA_PAYMENT_ASSIGNEE=payment-dev@example.com
JIRA_API_ASSIGNEE=api-dev@example.com
JIRA_FRONTEND_ASSIGNEE=frontend-dev@example.com
JIRA_BACKEND_ASSIGNEE=backend-dev@example.com

# Automation Configuration
JIRA_ENABLED=true
JIRA_WEBHOOK_SECRET=your-webhook-secret

# Assignee Mapping (JSON format)
JIRA_ASSIGNEE_MAP={"auth":"auth-dev@example.com","payment":"payment-dev@example.com"}

# Test Labels
JIRA_TEST_LABELS=test-failure,automated,ci-cd
```

### 2. Enable Jira Reporter

The Jira reporter is automatically enabled when `JIRA_ENABLED=true`. To disable:

```env
JIRA_ENABLED=false
```

### 3. GitHub Secrets

Add these secrets to your GitHub repository:

- `JIRA_PROJECT_KEY`
- `JIRA_DOMAIN`
- `JIRA_EMAIL`
- `JIRA_API_TOKEN`
- `JIRA_DEFAULT_ASSIGNEE`
- `JIRA_QA_ASSIGNEE`

### 4. Configure Jira Webhook

#### For Jira Cloud:

1. Go to **Jira Settings** (gear icon) → **System** → **Webhooks**
2. Click **Create a webhook**
3. Fill in the form:
   - **Name**: `Euroasiann ERP Automation`
   - **Status**: `Enabled`
   - **URL**: `https://your-api-domain.com/api/v1/jira/webhook`
   - **Description**: `Automated task assignment and workflow automation`
4. **Events Section** (scroll down to find this):
   - Under **Issue**, check:
     - ✅ `Issue Created`
     - ✅ `Issue Updated`
     - ✅ `Issue Deleted`
   - Optionally check other events you need:
     - `Issue Commented`
     - `Issue Assigned`
     - `Issue Resolved`
5. **Advanced Settings** (optional):
   - **Exclude body**: Leave unchecked (we need the body)
   - **Secret**: Enter your webhook secret (set this as `JIRA_WEBHOOK_SECRET` in your `.env`)
6. Click **Create**

#### For Jira Server/Data Center:

1. Go to **Administration** → **System** → **Webhooks**
2. Click **Create a webhook**
3. Fill in:
   - **Name**: `Euroasiann ERP Automation`
   - **Status**: `Enabled`
   - **URL**: `https://your-api-domain.com/api/v1/jira/webhook`
4. **Events** (this section appears in the form):
   - Select **Issue** events:
     - ✅ `jira:issue_created`
     - ✅ `jira:issue_updated`
     - ✅ `jira:issue_deleted`
5. Click **Create**

**Note**: The Events section is usually located below the URL field in the webhook creation form. If you don't see it, make sure you have admin permissions.

## 🔧 Usage

### Running Tests with Jira Integration

```bash
# Enable Jira integration
export JIRA_ENABLED=true

# Run tests (failures automatically create Jira issues)
npm run test

# Run with coverage
npm run test:coverage
```

### Manual Automation Trigger

```bash
# Trigger automation for a specific issue
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/v1/jira/automation/trigger/PROJ-123
```

### View Automation Rules

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/jira/automation/rules
```

## 📊 Automation Rules

### Default Rules

1. **Assign Test Failures**
   - Condition: Issue has `test-failure` label
   - Action: Assign to QA team

2. **Assign by Component**
   - Condition: Issue type is Bug
   - Action: Assign based on component (auth, payment, etc.)

3. **Set Priority by Label**
   - Condition: Issue has `critical`, `high-priority`, or `urgent` label
   - Action: Set priority to Highest or High

4. **Auto Transition**
   - Condition: Issue is "To Do" with `auto-assign` label
   - Action: Transition to "In Progress"

### Custom Rules

Add custom rules in `jira-automation.service.ts`:

```typescript
automationService.addRule({
  name: 'My Custom Rule',
  priority: 5,
  condition: (issue) => {
    // Your condition logic
    return issue.fields.summary.includes('urgent');
  },
  action: async (issue, jiraService) => {
    // Your action logic
    await jiraService.updateIssue(issue.key, { priority: 'Highest' });
  },
});
```

## 🔍 API Endpoints

### Webhook
- `POST /api/v1/jira/webhook` - Receive Jira webhooks (no auth)

### Automation
- `POST /api/v1/jira/automation/trigger/:issueKey` - Trigger automation for issue
- `GET /api/v1/jira/automation/rules` - Get list of automation rules

## 📝 Test Failure Format

When a test fails, a Jira issue is created with:

- **Summary**: `Test Failure: [Test Name]`
- **Type**: Bug
- **Priority**: Based on file path (High for critical paths)
- **Description**:
  - Test name
  - File path
  - Error message
  - Stack trace
  - Duration
  - CI/CD information
- **Labels**: `test-failure`, `automated`, component name

## 🚀 CI/CD Integration

The GitHub Actions workflow:

1. Runs tests on push/PR
2. Creates Jira issues for failures
3. Assigns issues to appropriate teams
4. Generates test coverage reports
5. Syncs results to Jira

## 🎨 Customization

### Change Issue Type

Edit `jira-test-reporter.service.ts`:

```typescript
issueType: 'Task', // Change from 'Bug' to 'Task'
```

### Change Priority Logic

Edit `determinePriority()` method in `jira-test-reporter.service.ts`

### Add Custom Labels

Edit `defaultLabels` in `JiraTestReporterService` constructor

## 🔐 Security

- Webhook signature verification (optional)
- API token authentication for all endpoints
- Environment variable protection
- Rate limiting recommended for production

## 📈 Monitoring

Check logs for:
- `Created Jira issue [KEY] for test failure`
- `Assigned issue [KEY] to [ASSIGNEE]`
- `Applied rule "[RULE]" to issue [KEY]`

## 🐛 Troubleshooting

### Issues not being created

1. Check `JIRA_ENABLED=true`
2. Verify Jira credentials
3. Check project key exists
4. Review logs for errors

### Assignments not working

1. Verify assignee email/account ID exists in Jira
2. Check assignee has permissions
3. Review automation rules

### Webhooks not triggering

1. Verify webhook URL is accessible
2. Check webhook secret matches
3. Review Jira webhook logs

## 📚 Related Files

- `apps/api/src/services/jira-test-reporter.service.ts` - Test reporter
- `apps/api/src/reporters/jira-reporter.ts` - Vitest reporter
- `apps/api/src/services/jira-automation.service.ts` - Automation service
- `apps/api/src/controllers/jira-automation.controller.ts` - Automation controller
- `.github/workflows/jira-test-integration.yml` - CI/CD workflow
