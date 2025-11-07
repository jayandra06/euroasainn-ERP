# Business Logic GUI Editor - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Start the Services

```bash
# Terminal 1: Start Backend API
cd apps/api
npm run dev

# Terminal 2: Start Tech Portal
cd apps/tech-portal
npm run dev
```

### Step 2: Access the Editor

1. Open browser: `http://localhost:4200`
2. Log in to Tech Portal
3. Click on **"Business Rules"** card on the dashboard
   - OR go directly to: `http://localhost:4200/business-rules`

### Step 3: Create Your First Rule

1. Click **"+ Create New Rule"** button
2. Fill in the form at the top:
   - **Name**: "My First Rule"
   - **Description**: "Testing the editor"
   - **Type**: "Decision"
   - **Status**: "Draft"
3. Click **"+ Condition"** button (toolbar)
4. Click **"+ Action"** button (toolbar)
5. **Connect the nodes**:
   - Drag from "Start" node (right side) → to "Condition" node (left side)
   - Drag from "Condition" node (right side) → to "Action" node (left side)
6. **Configure the Condition node**:
   - Click on the Condition node to select it
   - In the right panel, edit **Conditions** field:
     ```json
     {
       "all": [
         {
           "fact": "amount",
           "operator": "lessThan",
           "value": 1000
         }
       ]
     }
     ```
7. **Configure the Action node**:
   - Click on the Action node
   - In the right panel, edit **Actions** field:
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
8. Click **"Save Rule"** button at the top

### Step 4: Test Your Rule

**Via API:**
```bash
curl -X POST http://localhost:3000/api/v1/business-rules/{YOUR_RULE_ID}/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "facts": {
      "amount": 500
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
        "message": "Auto-approved"
      }
    ]
  }
}
```

---

## 📖 Complete Guide

For detailed instructions, examples, and advanced usage, see:
- **`GUI_EDITOR_USAGE_GUIDE.md`** - Complete usage guide with examples
- **`BUSINESS_LOGIC_EDITOR_SETUP.md`** - Technical documentation

---

## 🎯 Common Use Cases

### Auto-Approve Low Amount RFQs

**Configuration:**

**Condition Node:**
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

**Action Node:**
```json
[
  {
    "type": "approve",
    "params": {
      "message": "Auto-approved: Amount below threshold"
    }
  }
]
```

### Require Manager Approval for High Amounts

**Workflow:**
- Start → Condition (Amount > 50000) → [True: Assign to Manager] → End
                                    → [False: Auto Approve] → End

**Condition Node:**
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

**Action Node (True Path):**
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

**Action Node (False Path):**
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

---

## 💡 Tips

1. **Always start with Draft status** - Test before activating
2. **Use descriptive names** - Makes rules easy to find
3. **Validate JSON** - Check syntax in conditions/actions
4. **Test thoroughly** - Try different fact combinations
5. **Save frequently** - Avoid losing work

---

## ❓ Need Help?

1. Check the **`GUI_EDITOR_USAGE_GUIDE.md`** for detailed examples
2. Look at the API documentation in **`BUSINESS_LOGIC_EDITOR_SETUP.md`**
3. Check browser console for errors
4. Verify both services are running

---

**Happy Rule Building! 🎉**







