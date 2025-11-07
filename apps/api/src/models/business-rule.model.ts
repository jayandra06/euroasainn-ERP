import mongoose, { Schema, Document } from 'mongoose';

export type RuleStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type RuleType = 'workflow' | 'decision' | 'validation' | 'automation';

export interface IBusinessRule extends Document {
  _id: string;
  name: string;
  description?: string;
  type: RuleType;
  status: RuleStatus;
  organizationId?: mongoose.Types.ObjectId;
  portalType?: 'tech' | 'admin' | 'customer' | 'vendor';
  
  // Rule configuration (stored as JSON)
  config: {
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
      nodes: Array<{
        id: string;
        type: string;
        data: Record<string, any>;
        position: { x: number; y: number };
      }>;
      edges: Array<{
        id: string;
        source: string;
        target: string;
        label?: string;
      }>;
    };
  };
  
  // Metadata
  tags?: string[];
  category?: string;
  author?: string;
  version?: number;
  
  // Execution stats
  executionCount?: number;
  lastExecutedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const businessRuleSchema = new Schema<IBusinessRule>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['workflow', 'decision', 'validation', 'automation'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'archived'],
      default: 'draft',
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    portalType: {
      type: String,
      enum: ['tech', 'admin', 'customer', 'vendor'],
      index: true,
    },
    config: {
      type: Schema.Types.Mixed,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      index: true,
    },
    author: {
      type: String,
    },
    version: {
      type: Number,
      default: 1,
    },
    executionCount: {
      type: Number,
      default: 0,
    },
    lastExecutedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
businessRuleSchema.index({ status: 1, type: 1 });
businessRuleSchema.index({ organizationId: 1, status: 1 });
businessRuleSchema.index({ portalType: 1, status: 1 });
businessRuleSchema.index({ tags: 1 });

export const BusinessRule = mongoose.model<IBusinessRule>('BusinessRule', businessRuleSchema);







