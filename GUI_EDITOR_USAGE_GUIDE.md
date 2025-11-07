# Business Logic GUI Editor - Complete Usage Guide

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Accessing the Editor](#accessing-the-editor)
3. [Creating Your First Rule](#creating-your-first-rule)
4. [Understanding Node Types](#understanding-node-types)
5. [Building Workflows](#building-workflows)
6. [Configuring Conditions](#configuring-conditions)
7. [Setting Up Actions](#setting-up-actions)
8. [Executing Rules](#executing-rules)
9. [Managing Rules](#managing-rules)
10. [Real-World Examples](#real-world-examples)

---

## 🚀 Getting Started

### Prerequisites

1. **Backend API** should be running on `http://localhost:3000`
2. **Frontend Tech Portal** should be running on `http://localhost:4200`
3. **You should be logged in** to the Tech Portal

### Start the Services

```bash
# Terminal 1: Start Backend API
cd apps/api
npm run dev

# Terminal 2: Start Tech Portal
cd apps/tech-portal
npm run dev
```

---

## 🔑 Accessing the Editor

### Step 1: Log In

1. Open your browser and go to `http://localhost:4200`
2. Log in with your credentials (Tech Portal access required)

### Step 2: Navigate to Business Rules

**Option A: Direct URL**
- Go to: `http://localhost:4200/business-rules`

**Option B: From Dashboard**
- After login, you should see the dashboard
- Add a link in your dashboard or manually navigate to `/business-rules`

### Step 3: You'll See the Rules List Page

The Business Rules page shows:
- All existing business rules
- Filter by status (Draft, Active, Inactive, Archived)
- "Create New Rule" button

---

## ✨ Creating Your First Rule

### Step-by-Step Process

#### Step 1: Click "Create New Rule"

Click the **"+ Create New Rule"** button on the Business Rules page.

#### Step 2: Fill in Rule Metadata

At the top of the editor, fill in:

1. **Rule Name**: 
   - Example: "Auto-approve Low Value RFQs"
   - This is the display name

2. **Description**:
   - Example: "Automatically approve RFQs with amount less than $10,000"
   - Optional but recommended

3. **Type**:
   - **Workflow**: Multi-step processes
   - **Decision**: Conditional logic
   - **Validation**: Data validation
   - **Automation**: Automated actions
   - Choose: **Decision** (for our example)

4. **Status**:
   - **Draft**: Still being edited
   - **Active**: Ready to use
   - **Inactive**: Temporarily disabled
   - **Archived**: No longer used
   - Choose: **Draft** (start here)

#### Step 3: Add Nodes to Your Workflow

Click the toolbar buttons to add nodes:

- **+ Condition**: Adds a condition node (decision logic)
- **+ Action**: Adds an action node (what to do)
- **+ Decision**: Adds a decision branch node

**For our example:**
1. Click **"+ Condition"** to add a condition node

#### Step 4: Connect Nodes

1. **Hover** over a node - you'll see connection handles appear
2. **Click and drag** from a node's output handle (right side)
3. **Drag to** another node's input handle (left side)
4. **Release** to create a connection

**Visual Flow:**
```
Start → Condition → Action → End
```

#### Step 5: Configure Nodes

1. **Click on a node** to select it
2. The **right panel** will show "Node Properties"
3. Edit the properties:

   **For Condition Nodes:**
   - **Label**: "Check RFQ Amount"
   - **Conditions**: JSON configuration (see below)

   **For Action Nodes:**
   - **Label**: "Auto Approve"
   - **Actions**: JSON configuration (see below)

#### Step 6: Configure Conditions

Click on a condition node, then in the properties panel, edit the **Conditions** field:

**Example JSON:**
```json
{
  "all": [
    {
      "fact": "amount",
      "operator": "lessThan",
      "value": 10000
    }
  ]
}
```

**Supported Operators:**
- `equal`, `notEqual`
- `lessThan`, `lessThanInclusive`
- `greaterThan`, `greaterThanInclusive`
- `in`, `notIn`
- `contains`, `doesNotContain`

**Complex Conditions:**
```json
{
  "all": [
    {
      "fact": "amount",
      "operator": "lessThan",
      "value": 10000
    },
    {
      "fact": "status",
      "operator": "equal",
      "value": "pending"
    }
  ]
}
```

This means: "amount < 10000 AND status == 'pending'"

**OR Conditions:**
```json
{
  "any": [
    {
      "fact": "userRole",
      "operator": "equal",
      "value": "manager"
    },
    {
      "fact": "userRole",
      "operator": "equal",
      "value": "admin"
    }
  ]
}
```

This means: "userRole == 'manager' OR userRole == 'admin'"

#### Step 7: Configure Actions

Click on an action node, then edit the **Actions** field:

**Example JSON:**
```json
[
  {
    "type": "approve",
    "params": {
      "message": "Auto-approved: Amount is below threshold"
    }
  }
]
```

**Multiple Actions:**
```json
[
  {
    "type": "approve",
    "params": {
      "message": "Approved automatically"
    }
  },
  {
    "type": "notify",
    "params": {
      "message": "RFQ approved automatically",
      "recipient": "${userEmail}"
    }
  },
  {
    "type": "update",
    "params": {
      "field": "status",
      "value": "approved"
    }
  }
]
```

**Available Action Types:**
- `approve` - Approve request
- `reject` - Reject request
- `notify` - Send notification
- `assign` - Assign to user
- `update` - Update field
- `send_email` - Send email
- `create_task` - Create task
- `call_api` - Call external API

#### Step 8: Save Your Rule

1. Click the **"Save Rule"** button at the top
2. The rule will be saved to the database
3. You'll see a success message
4. The URL will update to show the rule ID

---

## 🎯 Understanding Node Types

### 1. Start Node (Auto-created)
- **Purpose**: Entry point of your workflow
- **Position**: Usually at the top-left
- **Cannot be deleted**: This is your workflow start

### 2. Condition Node
- **Purpose**: Check conditions/decisions
- **Configuration**: 
  - Label: Descriptive name
  - Conditions: JSON condition rules
- **Use Case**: "If amount < 10000", "If user role is manager"

### 3. Action Node
- **Purpose**: Execute actions
- **Configuration**:
  - Label: Action description
  - Actions: Array of actions to execute
- **Use Case**: Approve, reject, notify, update status

### 4. Decision Node
- **Purpose**: Multiple path branching
- **Configuration**: Similar to condition node
- **Use Case**: Complex branching logic

### 5. End Node (Optional)
- **Purpose**: Mark workflow completion
- **Use Case**: Clear workflow end point

---

## 🔗 Building Workflows

### Simple Linear Workflow

```
Start → Check Condition → Execute Action → End
```

**Steps:**
1. Add one Condition node
2. Add one Action node
3. Connect: Start → Condition → Action

### Conditional Branching

```
Start → Condition → [True: Action A] → End
                     [False: Action B] → End
```

**Steps:**
1. Add one Condition node
2. Add two Action nodes (one for true, one for false)
3. Connect: Start → Condition
4. Connect: Condition → Action A (true path)
5. Connect: Condition → Action B (false path)
6. Connect both Action nodes → End

### Multi-Step Workflow

```
Start → Condition 1 → Action 1 → Condition 2 → Action 2 → End
```

**Steps:**
1. Chain multiple conditions and actions
2. Each condition checks something different
3. Each action performs a specific task

---

## 📝 Real-World Examples

### Example 1: Auto-Approval Rule

**Scenario**: Automatically approve RFQs under $10,000

**Workflow:**
```
Start → Check Amount < $10,000 → Auto Approve → End
```

**Configuration:**

Condition Node:
```json
{
  "all": [
    {
      "fact": "amount",
      "operator": "lessThan",
      "value": 10000
    }
  ]
}
```

Action Node:
```json
[
  {
    "type": "approve",
    "params": {
      "message": "Auto-approved: Amount below threshold"
    }
  },
  {
    "type": "notify",
    "params": {
      "message": "Your RFQ has been auto-approved",
      "recipient": "${userEmail}"
    }
  }
]
```

### Example 2: Manager Approval Required

**Scenario**: RFQs over $50,000 need manager approval

**Workflow:**
```
Start → Check Amount > $50,000 → Assign to Manager → End
        ↓ (false)
        Auto Approve → End
```

**Configuration:**

Condition Node:
```json
{
  "all": [
    {
      "fact": "amount",
      "operator": "greaterThan",
      "value": 50000
    }
  ]
}
```

Action Node (True Path):
```json
[
  {
    "type": "assign",
    "params": {
      "assignee": "manager@example.com",
      "message": "Manager approval required"
    }
  }
]
```

Action Node (False Path):
```json
[
  {
    "type": "approve",
    "params": {
      "message": "Auto-approved"
    }
  }
]
```

### Example 3: Multi-Condition Validation

**Scenario**: Approve if amount < 10k AND user role is manager AND status is pending

**Workflow:**
```
Start → Complex Condition Check → Approve → End
```

**Configuration:**

Condition Node:
```json
{
  "all": [
    {
      "fact": "amount",
      "operator": "lessThan",
      "value": 10000
    },
    {
      "fact": "userRole",
      "operator": "equal",
      "value": "manager"
    },
    {
      "fact": "status",
      "operator": "equal",
      "value": "pending"
    }
  ]
}
```

### Example 4: Email Notification Rule

**Scenario**: Send email notification when RFQ is created

**Workflow:**
```
Start → Create RFQ → Send Email → End
```

**Configuration:**

Action Node:
```json
[
  {
    "type": "send_email",
    "params": {
      "to": "${userEmail}",
      "subject": "RFQ Created Successfully",
      "body": "Your RFQ #${rfqId} has been created and is pending review."
    }
  }
]
```

---

## 🧪 Testing & Executing Rules

### Method 1: Through the UI (Future Enhancement)

Currently, rules can be executed via API. We can add a test button in the UI.

### Method 2: Via API (Current Method)

**Using curl:**

```bash
curl -X POST http://localhost:3000/api/v1/business-rules/{ruleId}/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "facts": {
      "amount": 5000,
      "userRole": "manager",
      "status": "pending",
      "userEmail": "user@example.com"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "results": [
      {
        "type": "approve",
        "success": true,
        "message": "Auto-approved: Amount below threshold"
      }
    ]
  }
}
```

### Method 3: Test in Development

1. **Create a test endpoint** in your backend
2. **Call the rule execution** from your services
3. **Use the facts** from your current request context

---

## 🗂️ Managing Rules

### Viewing Rules

1. Go to `/business-rules` page
2. See all rules in a card grid
3. Each card shows:
   - Rule name
   - Status badge (color-coded)
   - Type
   - Category
   - Execution count

### Filtering Rules

Use the **"Filter by Status"** dropdown:
- All - Show all rules
- Draft - Show draft rules
- Active - Show active rules
- Inactive - Show inactive rules
- Archived - Show archived rules

### Editing Rules

1. Click **"Edit"** button on a rule card
2. The editor opens with the rule loaded
3. Make your changes
4. Click **"Save Rule"**
5. Changes are saved and version is incremented

### Deleting Rules

1. Click **"Delete"** button on a rule card
2. Confirm deletion in the popup
3. Rule is permanently deleted

### Activating Rules

1. Edit the rule
2. Change **Status** from "Draft" to "Active"
3. Save the rule
4. The rule is now active and can be executed

---

## 💡 Best Practices

### 1. Start with Draft Status
- Always create rules as "Draft" first
- Test thoroughly before setting to "Active"

### 2. Use Descriptive Names
- Rule Name: "Auto-approve RFQ < $10k"
- Node Labels: "Check Amount", "Approve RFQ"

### 3. Validate JSON
- Use a JSON validator for conditions and actions
- Check for syntax errors before saving

### 4. Test Rules
- Test with different fact combinations
- Verify expected outcomes

### 5. Document Rules
- Use descriptions to explain rule purpose
- Add comments in JSON configurations

### 6. Version Control
- Rules are automatically versioned
- Check version history for changes

### 7. Organization Scoping
- Assign rules to specific organizations if needed
- Use portal types to scope access

---

## 🔧 Troubleshooting

### Issue: Can't see the Business Rules page

**Solution:**
1. Make sure you're logged in
2. Check if routes are added in `app.tsx`
3. Verify the URL: `http://localhost:4200/business-rules`

### Issue: Save button doesn't work

**Solution:**
1. Check browser console for errors
2. Verify API is running on port 3000
3. Check authentication token is valid
4. Look for validation errors in the response

### Issue: Nodes don't connect

**Solution:**
1. Make sure you're dragging from the connection handles
2. Handles appear when you hover over nodes
3. Try refreshing the page

### Issue: JSON errors in conditions/actions

**Solution:**
1. Validate JSON syntax using a JSON validator
2. Check for missing commas, brackets
3. Ensure all strings are properly quoted
4. Use the example formats from this guide

### Issue: Rules don't execute

**Solution:**
1. Check rule status is "Active"
2. Verify facts match expected format
3. Check rule conditions are correct
4. Review execution logs in backend

### Issue: Can't see saved rules

**Solution:**
1. Refresh the page
2. Check API response in Network tab
3. Verify MongoDB connection
4. Check authentication token

---

## 📚 Additional Resources

### API Endpoints Reference

- **Create**: `POST /api/v1/business-rules`
- **List**: `GET /api/v1/business-rules`
- **Get**: `GET /api/v1/business-rules/:id`
- **Update**: `PUT /api/v1/business-rules/:id`
- **Delete**: `DELETE /api/v1/business-rules/:id`
- **Execute**: `POST /api/v1/business-rules/:id/execute`
- **Validate**: `POST /api/v1/business-rules/validate`

### Rule Configuration Schema

See `BUSINESS_LOGIC_EDITOR_SETUP.md` for complete schema documentation.

### React Flow Documentation

- Official docs: https://reactflow.dev/
- Examples: https://reactflow.dev/examples/

---

## 🎓 Next Steps

1. **Create your first rule** using the examples above
2. **Test execution** via API
3. **Build complex workflows** for your business needs
4. **Integrate with existing services** (RFQ, Quotation, etc.)
5. **Customize action types** for your specific requirements

---

**Happy Rule Building! 🎉**

If you need help, refer to the examples above or check the API documentation.







