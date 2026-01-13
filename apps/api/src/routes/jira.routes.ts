import { Router } from 'express';
import { JiraController } from '../controllers/jira.controller';
import { JiraAutomationController } from '../controllers/jira-automation.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Webhook route (no auth required, but should verify signature)
router.post('/webhook', JiraAutomationController.handleWebhook);

// All other Jira routes require authentication
router.use(authMiddleware);

// Get projects
router.get('/projects', JiraController.getProjects);

// Issue routes
router.get('/issues/:issueKey', JiraController.getIssue);
router.post('/issues', JiraController.createIssue);
router.put('/issues/:issueKey', JiraController.updateIssue);
router.get('/issues/search', JiraController.searchIssues);
router.post('/issues/:issueKey/comments', JiraController.addComment);
router.get('/issues/:issueKey/transitions', JiraController.getTransitions);
router.post('/issues/:issueKey/transitions', JiraController.transitionIssue);

// Automation routes
router.post('/automation/trigger/:issueKey', JiraAutomationController.triggerAutomation);
router.get('/automation/rules', JiraAutomationController.getRules);

export default router;
