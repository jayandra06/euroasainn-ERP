export type RuleStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type RuleType = 'workflow' | 'decision' | 'validation' | 'automation';

export interface BusinessRuleNode {
  id: string;
  type: string;
  data: {
    label: string;
    ruleId?: string;
    conditions?: Record<string, any>;
    actions?: Array<{
      type: string;
      params: Record<string, any>;
    }>;
    [key: string]: any;
  };
  position: { x: number; y: number };
}

export interface BusinessRuleEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
}

export interface BusinessRuleConfig {
  version: string;
  rules: Array<{
    id: string;
    name: string;
    conditions: Record<string, any>;
    actions: Array<{
      type: string;
      params: Record<string, any>;
    }>;
    priority?: number;
  }>;
  workflow?: {
    nodes: BusinessRuleNode[];
    edges: BusinessRuleEdge[];
  };
}

export interface BusinessRule {
  _id?: string;
  name: string;
  description?: string;
  type: RuleType;
  status: RuleStatus;
  organizationId?: string;
  portalType?: string;
  config: BusinessRuleConfig;
  tags?: string[];
  category?: string;
  author?: string;
  version?: number;
  executionCount?: number;
  lastExecutedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ActionType = 
  | 'notify'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'update'
  | 'call_api'
  | 'send_email'
  | 'create_task'
  | 'update_status';

export interface ActionConfig {
  type: ActionType;
  params: Record<string, any>;
}

export interface ConditionConfig {
  fact: string;
  operator: string;
  value: any;
}







