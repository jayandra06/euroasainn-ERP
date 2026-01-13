import { Request, Response } from 'express';
export declare class JiraController {
    /**
     * Get Jira issue by key
     * GET /api/v1/jira/issues/:issueKey
     */
    static getIssue(req: Request, res: Response): Promise<void>;
    /**
     * Create new Jira issue
     * POST /api/v1/jira/issues
     */
    static createIssue(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Update Jira issue
     * PUT /api/v1/jira/issues/:issueKey
     */
    static updateIssue(req: Request, res: Response): Promise<void>;
    /**
     * Search Jira issues
     * GET /api/v1/jira/issues/search?jql=...
     */
    static searchIssues(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Add comment to issue
     * POST /api/v1/jira/issues/:issueKey/comments
     */
    static addComment(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get Jira projects
     * GET /api/v1/jira/projects
     */
    static getProjects(req: Request, res: Response): Promise<void>;
    /**
     * Get available transitions for an issue
     * GET /api/v1/jira/issues/:issueKey/transitions
     */
    static getTransitions(req: Request, res: Response): Promise<void>;
    /**
     * Transition issue status
     * POST /api/v1/jira/issues/:issueKey/transitions
     */
    static transitionIssue(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=jira.controller.d.ts.map