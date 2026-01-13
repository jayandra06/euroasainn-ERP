/**
 * Jira API client for vendor portal
 */
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
export interface JiraProject {
    id: string;
    key: string;
    name: string;
    projectTypeKey: string;
    simplified: boolean;
    style: string;
    isPrivate: boolean;
}
export interface JiraTransition {
    id: string;
    name: string;
    to: {
        id: string;
        name: string;
        statusCategory: {
            id: number;
            key: string;
            colorName: string;
        };
    };
}
export declare const jiraApi: {
    /**
     * Get issue by key
     */
    getIssue(issueKey: string): Promise<JiraIssue>;
    /**
     * Create new issue
     */
    createIssue(data: CreateJiraIssueDto): Promise<JiraIssue>;
    /**
     * Update issue
     */
    updateIssue(issueKey: string, updates: Partial<CreateJiraIssueDto>): Promise<JiraIssue>;
    /**
     * Search issues using JQL
     */
    searchIssues(jql: string, maxResults?: number): Promise<JiraIssue[]>;
    /**
     * Get projects
     */
    getProjects(): Promise<JiraProject[]>;
    /**
     * Add comment to issue
     */
    addComment(issueKey: string, comment: string): Promise<void>;
    /**
     * Get available transitions for an issue
     */
    getTransitions(issueKey: string): Promise<JiraTransition[]>;
    /**
     * Transition issue status
     */
    transitionIssue(issueKey: string, transitionId: string): Promise<void>;
};
//# sourceMappingURL=jira.d.ts.map