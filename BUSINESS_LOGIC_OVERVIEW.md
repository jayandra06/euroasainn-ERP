# Euroasiann ERP Platform - Business Logic Overview

## 🎯 **Business Domain**

This is a **Maritime/Shipping ERP Platform** that facilitates procurement and supply chain management for:
- **Customers**: Shipping companies, vessel operators, fleet managers
- **Vendors**: Suppliers of maritime equipment, spare parts, and services
- **Admins**: Platform administrators managing organizations and licenses
- **Tech Team**: System administrators managing the platform infrastructure

---

## 🏗️ **System Architecture**

### **Four-Portal System**

```
Tech Portal (Highest Level)
    ↓
Admin Portal
    ↓
Customer Portal ←→ Vendor Portal (Peer Level)
```

### **Portal Hierarchy & Access Control**

1. **Tech Portal** (`tech`)
   - Manages admin users
   - System configuration
   - License management
   - Business rules editor
   - Roles: `tech_admin`, `tech_manager`, `tech_developer`, `tech_support`

2. **Admin Portal** (`admin`)
   - Manages customer/vendor organizations
   - Issues licenses
   - Approves customer/vendor onboarding
   - Roles: `admin_system_admin`, `admin_superuser`, `admin_user`

3. **Customer Portal** (`customer`)
   - RFQ (Request for Quotation) management
   - Vessel management
   - Employee management
   - Business unit management
   - Roles: `customer_admin`, `customer_manager`

4. **Vendor Portal** (`vendor`)
   - Catalogue/Inventory management
   - Quotation management
   - Item management
   - Roles: `vendor_admin`, `vendor_manager`

---

## 🔄 **Core Business Workflows**

### **1. Organization Onboarding Flow**

#### **Customer Onboarding:**
```
Admin/Tech creates Customer Organization
    ↓
Invitation token generated
    ↓
Customer receives invitation link
    ↓
Customer fills onboarding form (company details, banking, vessels, etc.)
    ↓
Status: 'completed' (submitted, awaiting approval)
    ↓
Admin reviews and approves
    ↓
Organization.isActive = true
    ↓
Customer can now access portal (after payment)
```

#### **Vendor Onboarding:**
```
Admin/Tech/Customer creates Vendor Organization
    ↓
Vendor receives invitation
    ↓
Vendor completes onboarding form
    ↓
Admin approves
    ↓
Vendor can access portal (after payment)
```

### **2. Payment & License Flow**

```
Organization created and approved
    ↓
Organization must make payment (Razorpay integration)
    ↓
Payment successful → License automatically created
    ↓
License includes:
    - Usage limits (users, vessels, items)
    - Expiry date
    - Status (active/expired/suspended)
    ↓
Organization can use portal features
    ↓
Every action checks:
    1. License is active
    2. Payment subscription is active
    3. Usage limits not exceeded
```

**License Usage Tracking:**
- **Vessels**: Incremented when vessel created, decremented when deleted
- **Users/Employees**: Incremented when user created, decremented when deleted
- **Items** (Vendor): Incremented when item created, decremented when deleted

### **3. Employee Onboarding Flow**

```
Customer Admin invites employee via email
    ↓
Invitation token generated
    ↓
Employee receives email with invitation link
    ↓
Employee clicks link → Opens onboarding form
    ↓
Employee fills:
    - Personal details (name, email, phone, address)
    - Bank details (account, IFSC/SWIFT, bank name)
    - Identity documents (passport, PAN, SSN, etc.)
    - Nominee details
    ↓
Employee submits form
    ↓
Status: 'submitted' (awaiting approval)
    ↓
Customer Admin reviews in "Employee Onboarding Review" page
    ↓
Admin approves → Employee account created automatically
    ↓
Employee receives welcome email with login credentials
    ↓
Employee can now access Customer Portal
```

### **4. RFQ (Request for Quotation) Workflow**

#### **Customer Creates RFQ:**
```
Customer navigates to RFQs page
    ↓
Selects vessel (from their vessel list)
    ↓
Fills RFQ details:
    - Title, description
    - Brand, model, category
    - Supply port
    - Due date
    - Items list (with quantities, specifications)
    ↓
Selects vendor(s) to send RFQ to
    ↓
RFQ created with status: 'draft' or 'sent'
    ↓
RFQ sent to selected vendors
```

#### **Vendor Receives & Responds:**
```
Vendor sees RFQ in their portal
    ↓
Vendor reviews RFQ details
    ↓
Vendor creates quotation:
    - Selects items from their catalogue
    - Sets prices
    - Adds terms & conditions
    - Sets validity period
    ↓
Quotation submitted
    ↓
Status: 'submitted' or 'pending'
```

#### **Customer Reviews Quotations:**
```
Customer views all quotations for their RFQ
    ↓
Customer compares prices and terms
    ↓
Customer can:
    - Accept a quotation
    - Request modifications
    - Reject quotations
    ↓
If accepted → Order/Purchase process begins
```

### **5. Vessel Management**

```
Customer creates vessel record:
    - Name, type, IMO number
    - Flag, ex-vessel name
    - Metadata
    ↓
Vessel linked to customer organization
    ↓
Vessel can be assigned to Business Units
    ↓
Vessel can be linked to RFQs
    ↓
License limit checked before creation
```

### **6. Business Unit Management**

```
Customer creates Business Unit (BU):
    - Name, address, contact details
    - Representative (employee)
    ↓
Employees can be assigned to BU
    ↓
Vessels can be assigned to BU
    ↓
RFQs can be tracked per BU
    ↓
Budget tracking per BU (planned feature)
```

### **7. Catalogue & Inventory Management (Vendor)**

```
Vendor uploads catalogue (CSV file):
    - IMPA numbers
    - Part numbers
    - Descriptions
    - Categories
    - Dimensions
    - Prices
    ↓
Items created in system
    ↓
Vendor can also manually add/edit items
    ↓
Items available for quotation creation
    ↓
Inventory tracking (stock levels)
```

---

## 📊 **Key Data Models & Relationships**

### **Core Entities:**

1. **Organization**
   - Types: `admin`, `customer`, `vendor`
   - Has: `isActive`, `licenseKey`, `invitedBy`
   - Relationships: One-to-many with Users, Licenses, Payments

2. **User**
   - Belongs to: Organization
   - Has: `portalType`, `role`, `isActive`
   - Used for: Authentication, authorization

3. **License**
   - Belongs to: Organization
   - Has: `usageLimits`, `currentUsage`, `expiresAt`, `status`
   - Tracks: Users, vessels, items usage

4. **Payment**
   - Belongs to: Organization, User
   - Has: `subscriptionPeriod`, `status`, `transactionId`
   - Creates: License automatically on success

5. **Vessel**
   - Belongs to: Customer Organization
   - Can be: Assigned to Business Unit
   - Linked to: RFQs

6. **RFQ**
   - Created by: Customer Organization
   - Linked to: Vessel, Recipient Vendors
   - Has: `rfqNumber`, `status`, `items`

7. **Quotation**
   - Created by: Vendor Organization
   - Linked to: RFQ
   - Has: `quotationNumber`, `items`, `totalAmount`, `status`

8. **Employee**
   - Belongs to: Customer Organization
   - Can be: Assigned to Business Unit
   - Has: Payroll details, metadata

9. **EmployeeOnboarding**
   - Belongs to: Employee, Organization
   - Has: Personal details, documents, bank info
   - Status: `submitted` → `approved` → User created

10. **Item** (Vendor Catalogue)
    - Belongs to: Vendor Organization
    - Has: `name`, `description`, `unitPrice`, `sku`, `metadata`
    - Used in: Quotations

11. **BusinessUnit**
    - Belongs to: Customer Organization
    - Has: Employees, Vessels (assigned)
    - Tracks: RFQs, Budget (planned)

---

## 🔐 **Security & Access Control**

### **Authentication Flow:**
```
User Login
    ↓
JWT Access Token + Refresh Token generated
    ↓
Access Token: Short-lived (15 min)
Refresh Token: Long-lived (7 days), stored in DB
    ↓
All requests include: `Authorization: Bearer <token>`
    ↓
Token verified → User info attached to request
```

### **Authorization (CASBIN RBAC):**
```
Request arrives
    ↓
1. Check user.portalType matches route portal
    ↓
2. Check user.role has permission for action
    ↓
3. Check license is active (customer/vendor only)
    ↓
4. Check payment subscription is active (customer/vendor only)
    ↓
5. Check usage limits not exceeded
    ↓
Route handler executes
```

### **Middleware Chain:**
```
authMiddleware
    ↓
requirePortal(portalType)
    ↓
validateLicense (skip for tech/admin)
    ↓
paymentStatusMiddleware (skip for tech/admin)
    ↓
Route Handler
```

---

## 💰 **Payment Integration**

### **Razorpay Integration:**
```
User clicks "Subscribe"
    ↓
Backend creates Payment record
    ↓
Razorpay order created
    ↓
Checkout modal opens
    ↓
User completes payment
    ↓
Payment verified on server
    ↓
License automatically created
    ↓
Email notification sent
    ↓
User gains portal access
```

### **Payment Status Check:**
- Every customer/vendor route checks for active payment
- Payment must have: `status = 'success'` AND `subscriptionPeriod.endDate > now`
- If no active payment → 403 Forbidden

---

## 📈 **License Management**

### **License Structure:**
```typescript
{
  organizationId: ObjectId,
  status: 'active' | 'expired' | 'suspended' | 'revoked',
  expiresAt: Date,
  usageLimits: {
    users: number,      // 0 = unlimited
    vessels: number,    // 0 = unlimited
    items: number       // 0 = unlimited
  },
  currentUsage: {
    users: number,
    vessels: number,
    items: number
  }
}
```

### **Usage Tracking:**
- **Increment**: When resource created (vessel, user, item)
- **Decrement**: When resource deleted
- **Check**: Before creating resource → `currentUsage < usageLimits`

---

## 🔄 **Status Lifecycles**

### **RFQ Status:**
- `draft` → `sent` → `closed` / `cancelled`

### **Quotation Status:**
- `draft` → `submitted` → `accepted` / `rejected` / `expired`

### **Employee Onboarding Status:**
- `submitted` → `approved` / `rejected`

### **Customer Onboarding Status:**
- `pending` → `completed` → `approved` / `rejected`

### **Payment Status:**
- `pending` → `processing` → `success` / `failed`

### **License Status:**
- `active` → `expired` / `suspended` / `revoked`

---

## 🎯 **Key Business Rules**

1. **License Enforcement:**
   - Customer/Vendor must have active license to use portal
   - Usage limits enforced before resource creation
   - License expiry blocks access

2. **Payment Enforcement:**
   - Customer/Vendor must have active payment subscription
   - Payment required before license activation
   - Subscription expiry blocks access

3. **Organization Activation:**
   - Organization must be approved by admin
   - Organization must have active payment
   - Organization must have active license

4. **Employee Access:**
   - Employee must complete onboarding
   - Onboarding must be approved
   - User account created automatically on approval

5. **RFQ-Vendor Relationship:**
   - Customer can send RFQ to multiple vendors
   - Vendor can only see RFQs sent to them
   - Vendor can submit one quotation per RFQ

6. **Vendor Visibility:**
   - Vendors can be:
     - Admin-invited (visible to all customers)
     - Customer-invited (visible only to that customer)
   - Visibility controlled by `visibleToCustomerIds` array

---

## 📝 **API Endpoint Patterns**

### **Customer Portal:**
- `/api/v1/customer/vessels` - Vessel management
- `/api/v1/customer/rfq` - RFQ management
- `/api/v1/customer/employees` - Employee management
- `/api/v1/customer/business-units` - Business unit management
- `/api/v1/customer/employees/onboarding-review` - Review employee onboarding

### **Vendor Portal:**
- `/api/v1/vendor/catalogue` - Catalogue management
- `/api/v1/vendor/items` - Item management
- `/api/v1/vendor/quotation` - Quotation management
- `/api/v1/vendor/inventory` - Inventory management

### **Admin Portal:**
- `/api/v1/admin/customer-orgs` - Customer organization management
- `/api/v1/admin/vendor-orgs` - Vendor organization management
- `/api/v1/admin/licenses` - License management
- `/api/v1/admin/customer-onboardings` - Approve customer onboarding

### **Tech Portal:**
- `/api/v1/tech/users` - User management
- `/api/v1/tech/admin-users` - Admin user management
- `/api/v1/tech/licenses` - License management

---

## 🚀 **Future Features (Planned)**

1. **Fleet Performance & Maintenance** - Track vessel performance and maintenance schedules
2. **Compliance & Certification** - Manage regulatory compliance
3. **Risk Management** - Incident management and risk assessment
4. **Sustainability & ESG Reporting** - Environmental, social, governance reporting
5. **Budget Management** - Track budgets per Business Unit
6. **Transaction History** - Complete payment and order history

---

## 📚 **Summary**

This ERP platform is designed for **maritime procurement and supply chain management**, connecting:
- **Customers** (shipping companies) who need equipment/parts
- **Vendors** (suppliers) who provide equipment/parts
- **Admins** who manage the platform
- **Tech Team** who maintain the system

The system ensures:
- ✅ Proper access control (RBAC)
- ✅ License and payment enforcement
- ✅ Complete audit trails
- ✅ Secure data isolation per organization
- ✅ Automated workflows (onboarding, payments, licenses)
- ✅ Scalable architecture (multi-tenant)

---

**Last Updated**: Based on current codebase analysis

