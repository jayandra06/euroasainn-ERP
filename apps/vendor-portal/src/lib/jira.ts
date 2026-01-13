/**
 * Jira API client for vendor portal
 */

import { authenticatedFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

export const jiraApi = {
  /**
   * Get issue by key
   */
  async getIssue(issueKey: string): Promise<JiraIssue> {
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
  async createIssue(data: CreateJiraIssueDto): Promise<JiraIssue> {
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
  async updateIssue(issueKey: string, updates: Partial<CreateJiraIssueDto>): Promise<JiraIssue> {
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
  async searchIssues(jql: string, maxResults: number = 50): Promise<JiraIssue[]> {
    const response = await authenticatedFetch(
      `${API_URL}/api/v1/jira/issues/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`
    );
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
  async getProjects(): Promise<JiraProject[]> {
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
  async addComment(issueKey: string, comment: string): Promise<void> {
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
  async getTransitions(issueKey: string): Promise<JiraTransition[]> {
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
  async transitionIssue(issueKey: string, transitionId: string): Promise<void> {
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
