# Business Logic GUI Editor - Setup Complete ✅

## Overview

A visual, GUI-based business logic editor has been integrated into your ERP platform. This allows you to create, edit, and manage business rules through a drag-and-drop interface using React Flow.

## 🎨 Features

### Visual Workflow Editor
- **Drag-and-drop** interface for creating business rules
- **Node-based** visual representation of workflows
- **Connect nodes** to create rule flows
- **Real-time editing** with immediate preview

### Business Rule Types
- **Workflow**: Multi-step business processes
- **Decision**: Conditional logic and branching
- **Validation**: Data validation rules
- **Automation**: Automated actions and triggers

### Node Types
- **Start Node**: Entry point
- **Condition Node**: Decision points with conditions
- **Action Node**: Actions to execute
- **Decision Node**: Multiple path branching
- **End Node**: Completion point

## 📁 File Structure

### Backend (`apps/api`)

```
src/
├── models/
│   └── business-rule.model.ts       # MongoDB model for business rules
├── services/
│   └── business-rule.service.ts     # Rule execution engine & CRUD operations
├── controllers/
│   └── business-rule.controller.ts # API controllers
└── routes/
    └── business-rule.routes.ts     # API routes
```

### Frontend (`apps/tech-portal`)

```
src/
├── types/
│   └── business-rule.ts             # TypeScript types
├── components/
│   └── BusinessRuleEditor/
│       ├── BusinessRuleEditor.tsx   # Main editor component
│       └── BusinessRuleEditor.css   # Styles
└── pages/
    ├── BusinessRules/
    │   ├── BusinessRulesPage.tsx    # Rules list page
    │   └── BusinessRulesPage.css
    └── BusinessRuleEditor/
        ├── BusinessRuleEditorPage.tsx # Editor page
        └── BusinessRuleEditorPage.css
```

## 🚀 Usage

### Access the Editor

1. Navigate to: `http://localhost:4200/business-rules`
2. Click "Create New Rule" to start editing
3. Or edit an existing rule by clicking "Edit"

### Creating a Rule

1. **Fill in rule metadata**:
   - Name
   - Description
   - Type (workflow, decision, validation, automation)
   - Status (draft, active, inactive, archived)

2. **Add nodes**:
   - Click "+ Condition" to add a condition node
   - Click "+ Action" to add an action node
   - Click "+ Decision" to add a decision node

3. **Connect nodes**:
   - Drag from one node's output to another node's input
   - Create the flow of your business logic

4. **Configure nodes**:
   - Click on a node to select it
   - Edit properties in the right panel:
     - **Label**: Node name
     - **Conditions**: JSON configuration for condition nodes
     - **Actions**: JSON configuration for action nodes

5. **Save**:
   - Click "Save Rule" to persist your configuration

### Example Rule Configuration

```json
{
  "version": "1.0.0",
  "rules": [
    {
      "id": "rule-1",
      "name": "Approve if amount < 10000",
      "conditions": {
        "all": [
          {
            "fact": "amount",
            "operator": "lessThan",
            "value": 10000
          }
        ]
      },
      "actions": [
        {
          "type": "approve",
          "params": {
            "message": "Auto-approved"
          }
        }
      ],
      "priority": 10
    }
  ],
  "workflow": {
    "nodes": [
      {
        "id": "1",
        "type": "start",
        "position": { "x": 250, "y": 100 },
        "data": { "label": "Start" }
      },
      {
        "id": "rule-1",
        "type": "condition",
        "position": { "x": 250, "y": 200 },
        "data": {
          "label": "Check Amount",
          "conditions": { "all": [...] }
        }
      }
    ],
    "edges": [
      {
        "id": "e1-rule-1",
        "source": "1",
        "target": "rule-1"
      }
    ]
  }
}
```

## 🔌 API Endpoints

### Create Rule
```http
POST /api/v1/business-rules
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Rule Name",
  "type": "workflow",
  "status": "draft",
  "config": { ... }
}
```

### Get All Rules
```http
GET /api/v1/business-rules?status=active&type=workflow
Authorization: Bearer <token>
```

### Get Rule by ID
```http
GET /api/v1/business-rules/:id
Authorization: Bearer <token>
```

### Update Rule
```http
PUT /api/v1/business-rules/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Updated Name",
  "config": { ... }
}
```

### Delete Rule
```http
DELETE /api/v1/business-rules/:id
Authorization: Bearer <token>
```

### Execute Rule
```http
POST /api/v1/business-rules/:id/execute
Content-Type: application/json
Authorization: Bearer <token>

{
  "facts": {
    "amount": 5000,
    "user": "john@example.com"
  }
}
```

### Validate Rule Config
```http
POST /api/v1/business-rules/validate
Content-Type: application/json
Authorization: Bearer <token>

{
  "config": { ... }
}
```

## 🛠️ Rule Engine

The backend uses `json-rules-engine` to execute rules:

### Conditions Format
```json
{
  "all": [
    {
      "fact": "amount",
      "operator": "greaterThan",
      "value": 1000
    }
  ]
}
```

Supported operators:
- `equal`, `notEqual`
- `lessThan`, `lessThanInclusive`
- `greaterThan`, `greaterThanInclusive`
- `in`, `notIn`
- `contains`, `doesNotContain`

### Actions Format
```json
{
  "type": "approve",
  "params": {
    "message": "Approved automatically",
    "assignee": "${userId}"
  }
}
```

Supported action types:
- `notify` - Send notification
- `approve` - Approve request
- `reject` - Reject request
- `assign` - Assign to user
- `update` - Update status
- `call_api` - Call external API
- `send_email` - Send email
- `create_task` - Create task
- `update_status` - Update status

## 📝 Database Schema

```typescript
{
  _id: ObjectId,
  name: string,
  description?: string,
  type: 'workflow' | 'decision' | 'validation' | 'automation',
  status: 'draft' | 'active' | 'inactive' | 'archived',
  organizationId?: ObjectId,
  portalType?: 'tech' | 'admin' | 'customer' | 'vendor',
  config: {
    version: string,
    rules: Array<Rule>,
    workflow?: {
      nodes: Array<Node>,
      edges: Array<Edge>
    }
  },
  tags?: string[],
  category?: string,
  version?: number,
  executionCount?: number,
  lastExecutedAt?: Date
}
```

## 🎯 Next Steps

1. **Test the editor**: Create a simple rule to test the functionality
2. **Customize nodes**: Add more node types as needed
3. **Extend actions**: Add custom action types for your business needs
4. **Integrate**: Connect rules to your existing workflows (RFQ, Quotation, etc.)

## 🔗 Dependencies

### Backend
- `json-rules-engine` - Rule execution engine

### Frontend
- `reactflow` - Visual workflow editor
- `zustand` - State management (optional)
- `yaml`, `js-yaml` - YAML parsing (optional)

## 💡 Tips

1. **Start Simple**: Begin with simple rules and gradually build complexity
2. **Test Rules**: Use the execute endpoint to test rules before making them active
3. **Version Control**: The system automatically versions rules when config changes
4. **Organization Scope**: Rules can be scoped to specific organizations
5. **Status Management**: Keep rules as "draft" until fully tested

---

**Your GUI-based business logic editor is ready to use! 🎉**







