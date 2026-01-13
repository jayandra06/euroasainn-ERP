export interface JiraIssue {
    key: string;
    summary: string;
    description?: string;
    status: string;
    assignee?: string;
    reporter?: string;
    created: string;
    updated: string;
    priority?: string;
    issueType: string;
}
export interface CreateJiraIssueDto {
    projectKey: string;
    summary: string;
    description?: string;
    issueType: string;
    assignee?: string;
    priority?: string;
    labels?: string[];
}
export declare class JiraService {
    private client;
    private domain;
    private email;
    private apiToken;
    constructor();
    /**
     * Get issue by key
     */
    getIssue(issueKey: string): Promise<JiraIssue>;
    /**
     * Create a new issue
     */
    createIssue(data: CreateJiraIssueDto): Promise<JiraIssue>;
    /**
     * Update issue
     */
    updateIssue(issueKey: string, updates: Partial<CreateJiraIssueDto>): Promise<JiraIssue>;
    /**
     * Transition issue status
     */
    transitionIssue(issueKey: string, transitionId: string): Promise<void>;
    /**
     * Search issues using JQL (Jira Query Language)
     */
    searchIssues(jql: string, maxResults?: number): Promise<JiraIssue[]>;
    /**
     * Add comment to issue
     */
    addComment(issueKey: string, comment: string): Promise<void>;
    /**
     * Get projects
     */
    getProjects(): Promise<any[]>;
    /**
     * Get available transitions for an issue
     */
    getTransitions(issueKey: string): Promise<any[]>;
    /**
     * Get full issue details (for automation)
     */
    getFullIssue(issueKey: string): Promise<any>;
    /**
     * Helper method to extract text from Jira's document format
     */
    private extractDescription;
}
//# sourceMappingURL=jira.service.d.ts.map