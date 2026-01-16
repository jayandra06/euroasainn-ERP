import { JiraService } from '../services/jira.service';
import { logger } from '../config/logger';
let jiraService = null;
// Initialize service lazily to handle missing credentials gracefully
function getJiraService() {
    if (!jiraService) {
        try {
            jiraService = new JiraService();
        }
        catch (error) {
            logger.error('Failed to initialize Jira service:', error);
            throw new Error('Jira service is not configured. Please check your environment variables.');
        }
    }
    return jiraService;
}
export class JiraController {
    /**
     * Get Jira issue by key
     * GET /api/v1/jira/issues/:issueKey
     */
    static async getIssue(req, res) {
        try {
            const { issueKey } = req.params;
            const service = getJiraService();
            const issue = await service.getIssue(issueKey);
            res.json({
                success: true,
                data: issue,
            });
        }
        catch (error) {
            logger.error('Error in getIssue:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch Jira issue',
            });
        }
    }
    /**
     * Create new Jira issue
     * POST /api/v1/jira/issues
     */
    static async createIssue(req, res) {
        try {
            const data = req.body;
            // Validation
            if (!data.projectKey || !data.summary || !data.issueType) {
                return res.status(400).json({
                    success: false,
                    error: 'projectKey, summary, and issueType are required',
                });
            }
            const service = getJiraService();
            const issue = await service.createIssue(data);
            res.status(201).json({
                success: true,
                data: issue,
            });
        }
        catch (error) {
            logger.error('Error in createIssue:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to create Jira issue',
            });
        }
    }
    /**
     * Update Jira issue
     * PUT /api/v1/jira/issues/:issueKey
     */
    static async updateIssue(req, res) {
        try {
            const { issueKey } = req.params;
            const updates = req.body;
            const service = getJiraService();
            const issue = await service.updateIssue(issueKey, updates);
            res.json({
                success: true,
                data: issue,
            });
        }
        catch (error) {
            logger.error('Error in updateIssue:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to update Jira issue',
            });
        }
    }
    /**
     * Search Jira issues
     * GET /api/v1/jira/issues/search?jql=...
     */
    static async searchIssues(req, res) {
        try {
            const { jql, maxResults } = req.query;
            if (!jql) {
                return res.status(400).json({
                    success: false,
                    error: 'JQL query is required',
                });
            }
            const service = getJiraService();
            const issues = await service.searchIssues(jql, maxResults ? parseInt(maxResults, 10) : 50);
            res.json({
                success: true,
                data: issues,
            });
        }
        catch (error) {
            logger.error('Error in searchIssues:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to search Jira issues',
            });
        }
    }
    /**
     * Add comment to issue
     * POST /api/v1/jira/issues/:issueKey/comments
     */
    static async addComment(req, res) {
        try {
            const { issueKey } = req.params;
            const { comment } = req.body;
            if (!comment) {
                return res.status(400).json({
                    success: false,
                    error: 'Comment is required',
                });
            }
            const service = getJiraService();
            await service.addComment(issueKey, comment);
            res.json({
                success: true,
                message: 'Comment added successfully',
            });
        }
        catch (error) {
            logger.error('Error in addComment:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to add comment',
            });
        }
    }
    /**
     * Get Jira projects
     * GET /api/v1/jira/projects
     */
    static async getProjects(req, res) {
        try {
            const service = getJiraService();
            const projects = await service.getProjects();
            res.json({
                success: true,
                data: projects,
            });
        }
        catch (error) {
            logger.error('Error in getProjects:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch projects',
            });
        }
    }
    /**
     * Get available transitions for an issue
     * GET /api/v1/jira/issues/:issueKey/transitions
     */
    static async getTransitions(req, res) {
        try {
            const { issueKey } = req.params;
            const service = getJiraService();
            const transitions = await service.getTransitions(issueKey);
            res.json({
                success: true,
                data: transitions,
            });
        }
        catch (error) {
            logger.error('Error in getTransitions:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch transitions',
            });
        }
    }
    /**
     * Transition issue status
     * POST /api/v1/jira/issues/:issueKey/transitions
     */
    static async transitionIssue(req, res) {
        try {
            const { issueKey } = req.params;
            const { transitionId } = req.body;
            if (!transitionId) {
                return res.status(400).json({
                    success: false,
                    error: 'transitionId is required',
                });
            }
            const service = getJiraService();
            await service.transitionIssue(issueKey, transitionId);
            res.json({
                success: true,
                message: 'Issue transitioned successfully',
            });
        }
        catch (error) {
            logger.error('Error in transitionIssue:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to transition issue',
            });
        }
    }
}
//# sourceMappingURL=jira.controller.js.map