/**
 * Jira API client for vendor portal
 */
import { authenticatedFetch } from './api';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const jiraApi = {
    /**
     * Get issue by key
     */
    async getIssue(issueKey) {
        const response = await authenticatedFetch(`${API_URL}/api/v1/jira/issues/${issueKey}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch Jira issue');
        }
        const data = await response.json();
        return data.data;
    },
    /**
     * Create new issue
     */
    async createIssue(data) {
        const response = await authenticatedFetch(`${API_URL}/api/v1/jira/issues`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create Jira issue');
        }
        const result = await response.json();
        return result.data;
    },
    /**
     * Update issue
     */
    async updateIssue(issueKey, updates) {
        const response = await authenticatedFetch(`${API_URL}/api/v1/jira/issues/${issueKey}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update Jira issue');
        }
        const result = await response.json();
        return result.data;
    },
    /**
     * Search issues using JQL
     */
    async searchIssues(jql, maxResults = 50) {
        const response = await authenticatedFetch(`${API_URL}/api/v1/jira/issues/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to search Jira issues');
        }
        const data = await response.json();
        return data.data;
    },
    /**
     * Get projects
     */
    async getProjects() {
        const response = await authenticatedFetch(`${API_URL}/api/v1/jira/projects`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch projects');
        }
        const data = await response.json();
        return data.data;
    },
    /**
     * Add comment to issue
     */
    async addComment(issueKey, comment) {
        const response = await authenticatedFetch(`${API_URL}/api/v1/jira/issues/${issueKey}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ comment }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add comment');
        }
    },
    /**
     * Get available transitions for an issue
     */
    async getTransitions(issueKey) {
        const response = await authenticatedFetch(`${API_URL}/api/v1/jira/issues/${issueKey}/transitions`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch transitions');
        }
        const data = await response.json();
        return data.data;
    },
    /**
     * Transition issue status
     */
    async transitionIssue(issueKey, transitionId) {
        const response = await authenticatedFetch(`${API_URL}/api/v1/jira/issues/${issueKey}/transitions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ transitionId }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to transition issue');
        }
    },
};
//# sourceMappingURL=jira.js.map