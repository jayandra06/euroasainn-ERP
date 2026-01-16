import axios, { AxiosInstance } from 'axios';
import { logger } from '../config/logger';

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

export class JiraService {
  private client: AxiosInstance;
  private domain: string;
  private email: string;
  private apiToken: string;

  constructor() {
    this.domain = process.env.JIRA_DOMAIN || '';
    this.email = process.env.JIRA_EMAIL || '';
    this.apiToken = process.env.JIRA_API_TOKEN || '';

    if (!this.domain || !this.email || !this.apiToken) {
      logger.warn('⚠️ Jira credentials not found. Jira integration will not work.');
      // Don't throw error, allow service to be created but methods will fail gracefully
    }

    // Create axios instance with basic auth
    this.client = axios.create({
      baseURL: `https://${this.domain}/rest/api/3`,
      auth: {
        username: this.email,
        password: this.apiToken,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    logger.info('✅ Jira service initialized');
  }

  /**
   * Get issue by key
   */
  async getIssue(issueKey: string): Promise<JiraIssue> {
    try {
      const response = await this.client.get(`/issue/${issueKey}`);
      const issue = response.data;
      
      return {
        key: issue.key,
        summary: issue.fields.summary,
        description: this.extractDescription(issue.fields.description),
        status: issue.fields.status.name,
        assignee: issue.fields.assignee?.displayName,
        reporter: issue.fields.reporter?.displayName,
        created: issue.fields.created,
        updated: issue.fields.updated,
        priority: issue.fields.priority?.name,
        issueType: issue.fields.issuetype.name,
      };
    } catch (error: any) {
      logger.error('Error fetching Jira issue:', error);
      throw new Error(`Failed to fetch Jira issue: ${error.response?.data?.errorMessages?.join(', ') || error.message}`);
    }
  }

  /**
   * Create a new issue
   */
  async createIssue(data: CreateJiraIssueDto): Promise<JiraIssue> {
    try {
      const issueData: any = {
        fields: {
          project: {
            key: data.projectKey,
          },
          summary: data.summary,
          issuetype: {
            name: data.issueType, // e.g., "Bug", "Task", "Story"
          },
        },
      };

      // Add description if provided
      if (data.description) {
        issueData.fields.description = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: data.description,
                },
              ],
            },
          ],
        };
      }

      // Add assignee if provided (use accountId for Jira Cloud)
      if (data.assignee) {
        issueData.fields.assignee = {
          accountId: data.assignee,
        };
      }

      // Add priority if provided
      if (data.priority) {
        issueData.fields.priority = {
          name: data.priority, // e.g., "High", "Medium", "Low"
        };
      }

      // Add labels if provided
      if (data.labels && data.labels.length > 0) {
        issueData.fields.labels = data.labels;
      }

      const response = await this.client.post('/issue', issueData);
      const issueKey = response.data.key;

      // Fetch the created issue to return full details
      return await this.getIssue(issueKey);
    } catch (error: any) {
      logger.error('Error creating Jira issue:', error);
      throw new Error(`Failed to create Jira issue: ${error.response?.data?.errorMessages?.join(', ') || error.message}`);
    }
  }

  /**
   * Update issue
   */
  async updateIssue(issueKey: string, updates: Partial<CreateJiraIssueDto>): Promise<JiraIssue> {
    try {
      const updateData: any = {
        fields: {},
      };

      if (updates.summary) updateData.fields.summary = updates.summary;
      if (updates.description) {
        updateData.fields.description = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: updates.description }],
            },
          ],
        };
      }
      if (updates.priority) {
        updateData.fields.priority = { name: updates.priority };
      }
      if (updates.assignee) {
        updateData.fields.assignee = { accountId: updates.assignee };
      }
      if (updates.labels) {
        updateData.fields.labels = updates.labels;
      }

      await this.client.put(`/issue/${issueKey}`, updateData);
      return await this.getIssue(issueKey);
    } catch (error: any) {
      logger.error('Error updating Jira issue:', error);
      throw new Error(`Failed to update Jira issue: ${error.response?.data?.errorMessages?.join(', ') || error.message}`);
    }
  }

  /**
   * Transition issue status
   */
  async transitionIssue(issueKey: string, transitionId: string): Promise<void> {
    try {
      await this.client.post(`/issue/${issueKey}/transitions`, {
        transition: {
          id: transitionId,
        },
      });
    } catch (error: any) {
      logger.error('Error transitioning Jira issue:', error);
      throw new Error(`Failed to transition issue: ${error.response?.data?.errorMessages?.join(', ') || error.message}`);
    }
  }

  /**
   * Search issues using JQL (Jira Query Language)
   */
  async searchIssues(jql: string, maxResults: number = 50): Promise<JiraIssue[]> {
    try {
      const response = await this.client.get('/search', {
        params: {
          jql,
          maxResults,
        },
      });

      return response.data.issues.map((issue: any) => ({
        key: issue.key,
        summary: issue.fields.summary,
        description: this.extractDescription(issue.fields.description),
        status: issue.fields.status.name,
        assignee: issue.fields.assignee?.displayName,
        reporter: issue.fields.reporter?.displayName,
        created: issue.fields.created,
        updated: issue.fields.updated,
        priority: issue.fields.priority?.name,
        issueType: issue.fields.issuetype.name,
      }));
    } catch (error: any) {
      logger.error('Error searching Jira issues:', error);
      throw new Error(`Failed to search Jira issues: ${error.response?.data?.errorMessages?.join(', ') || error.message}`);
    }
  }

  /**
   * Add comment to issue
   */
  async addComment(issueKey: string, comment: string): Promise<void> {
    try {
      await this.client.post(`/issue/${issueKey}/comment`, {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: comment }],
            },
          ],
        },
      });
    } catch (error: any) {
      logger.error('Error adding comment to Jira issue:', error);
      throw new Error(`Failed to add comment: ${error.response?.data?.errorMessages?.join(', ') || error.message}`);
    }
  }

  /**
   * Get projects
   */
  async getProjects(): Promise<any[]> {
    try {
      const response = await this.client.get('/project');
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching Jira projects:', error);
      throw new Error(`Failed to fetch projects: ${error.response?.data?.errorMessages?.join(', ') || error.message}`);
    }
  }

  /**
   * Get available transitions for an issue
   */
  async getTransitions(issueKey: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/issue/${issueKey}/transitions`);
      return response.data.transitions;
    } catch (error: any) {
      logger.error('Error fetching Jira transitions:', error);
      throw new Error(`Failed to fetch transitions: ${error.response?.data?.errorMessages?.join(', ') || error.message}`);
    }
  }

  /**
   * Get full issue details (for automation)
   */
  async getFullIssue(issueKey: string): Promise<any> {
    try {
      const response = await this.client.get(`/issue/${issueKey}`, {
        params: {
          expand: 'names,renderedFields',
        },
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching full Jira issue:', error);
      throw new Error(`Failed to fetch full issue: ${error.response?.data?.errorMessages?.join(', ') || error.message}`);
    }
  }

  /**
   * Helper method to extract text from Jira's document format
   */
  private extractDescription(description: any): string {
    if (!description) return '';
    if (typeof description === 'string') return description;
    if (description.content && Array.isArray(description.content)) {
      return description.content
        .map((block: any) => {
          if (block.content && Array.isArray(block.content)) {
            return block.content
              .map((item: any) => item.text || '')
              .join('');
          }
          return block.text || '';
        })
        .join('\n');
    }
    return '';
  }
}
