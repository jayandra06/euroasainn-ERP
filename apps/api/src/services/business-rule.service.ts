import { BusinessRule, IBusinessRule, RuleType, RuleStatus } from '../models/business-rule.model';
import mongoose from 'mongoose';
import { Engine } from 'json-rules-engine';

export class BusinessRuleService {
  /**
   * Create a new business rule
   */
  async createRule(data: {
    name: string;
    description?: string;
    type: RuleType;
    status?: RuleStatus;
    organizationId?: string;
    portalType?: string;
    config: IBusinessRule['config'];
    tags?: string[];
    category?: string;
    author?: string;
  }): Promise<IBusinessRule> {
    const rule = new BusinessRule({
      ...data,
      status: data.status || 'draft',
      version: 1,
      executionCount: 0,
    });

    return await rule.save();
  }

  /**
   * Get all business rules with filters
   */
  async getRules(filters: {
    organizationId?: string;
    portalType?: string;
    type?: RuleType;
    status?: RuleStatus;
    category?: string;
    tags?: string[];
  } = {}): Promise<IBusinessRule[]> {
    const query: any = {};

    if (filters.organizationId) {
      query.organizationId = new mongoose.Types.ObjectId(filters.organizationId);
    }

    if (filters.portalType) {
      query.portalType = filters.portalType;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    return await BusinessRule.find(query).sort({ createdAt: -1 }).exec();
  }

  /**
   * Get a business rule by ID
   */
  async getRuleById(ruleId: string): Promise<IBusinessRule | null> {
    return await BusinessRule.findById(ruleId).exec();
  }

  /**
   * Update a business rule
   */
  async updateRule(
    ruleId: string,
    updates: Partial<{
      name: string;
      description: string;
      status: RuleStatus;
      config: IBusinessRule['config'];
      tags: string[];
      category: string;
    }>
  ): Promise<IBusinessRule | null> {
    if (updates.config) {
      // Increment version when config changes
      const rule = await BusinessRule.findById(ruleId);
      if (rule) {
        updates = { ...updates, version: (rule.version || 1) + 1 };
      }
    }

    return await BusinessRule.findByIdAndUpdate(
      ruleId,
      { $set: updates },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Delete a business rule
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    const result = await BusinessRule.findByIdAndDelete(ruleId).exec();
    return !!result;
  }

  /**
   * Execute a business rule
   */
  async executeRule(ruleId: string, facts: Record<string, any>): Promise<{
    success: boolean;
    results: any[];
    errors?: string[];
  }> {
    const rule = await this.getRuleById(ruleId);

    if (!rule) {
      throw new Error('Business rule not found');
    }

    if (rule.status !== 'active') {
      throw new Error(`Cannot execute rule with status: ${rule.status}`);
    }

    try {
      // Create rules engine
      const engine = new Engine();

      // Add rules from config
      for (const ruleDef of rule.config.rules) {
        engine.addRule({
          name: ruleDef.name,
          conditions: ruleDef.conditions,
          event: {
            type: 'rule-executed',
            params: {
              ruleId: ruleDef.id,
              actions: ruleDef.actions,
            },
          },
          priority: ruleDef.priority || 10,
        });
      }

      // Run engine with facts
      const results = await engine.run(facts);

      // Execute actions from matched rules
      const executedActions: any[] = [];
      const errors: string[] = [];

      for (const event of results.events) {
        try {
          const actions = event.params.actions;
          for (const action of actions) {
            const actionResult = await this.executeAction(action, facts);
            executedActions.push(actionResult);
          }
        } catch (error: any) {
          errors.push(`Error executing action: ${error.message}`);
        }
      }

      // Update execution stats
      await BusinessRule.findByIdAndUpdate(ruleId, {
        $inc: { executionCount: 1 },
        $set: { lastExecutedAt: new Date() },
      }).exec();

      return {
        success: errors.length === 0,
        results: executedActions,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      throw new Error(`Failed to execute rule: ${error.message}`);
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    action: { type: string; params: Record<string, any> },
    facts: Record<string, any>
  ): Promise<any> {
    // Replace variables in params with values from facts
    const resolvedParams = this.resolveParams(action.params, facts);

    switch (action.type) {
      case 'notify':
        // Simulate notification
        console.log(`Notification: ${resolvedParams.message}`);
        return { type: 'notify', success: true };

      case 'approve':
        return { type: 'approve', success: true, ...resolvedParams };

      case 'reject':
        return { type: 'reject', success: true, ...resolvedParams };

      case 'assign':
        return { type: 'assign', success: true, ...resolvedParams };

      case 'update':
        return { type: 'update', success: true, ...resolvedParams };

      case 'call_api':
        // In a real implementation, this would call an external API
        return { type: 'call_api', success: true, ...resolvedParams };

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Resolve parameters by replacing variables with values from facts
   */
  private resolveParams(params: Record<string, any>, facts: Record<string, any>): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        // Variable reference: ${factKey}
        const factKey = value.slice(2, -1);
        resolved[key] = facts[factKey];
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = this.resolveParams(value, facts);
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Validate rule configuration
   */
  async validateRuleConfig(config: IBusinessRule['config']): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!config.version) {
      errors.push('Config version is required');
    }

    if (!config.rules || !Array.isArray(config.rules)) {
      errors.push('Config must contain a rules array');
      return { valid: false, errors };
    }

    for (const rule of config.rules) {
      if (!rule.id) {
        errors.push('Each rule must have an id');
      }

      if (!rule.name) {
        errors.push('Each rule must have a name');
      }

      if (!rule.conditions) {
        errors.push('Each rule must have conditions');
      }

      if (!rule.actions || !Array.isArray(rule.actions)) {
        errors.push('Each rule must have an actions array');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const businessRuleService = new BusinessRuleService();







