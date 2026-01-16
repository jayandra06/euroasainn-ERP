# Customer Portal - Business Logic Overview

## 🎯 **Purpose**

The Customer Portal is designed for **shipping companies, vessel operators, and fleet managers** to:
- Manage their fleet (vessels)
- Create and manage RFQs (Request for Quotations)
- Invite and manage vendors
- Manage employees and crew
- Organize operations through Business Units
- Track procurement and payments

---

## 🏗️ **Portal Structure**

### **Main Navigation Sections:**

1. **Dashboard** - Overview and quick access
2. **Analytics** - Reports and insights
3. **Fleet Overview** - Fleet-wide view
4. **Financial & Procurement**
   - RFQs
   - Vendor Management
   - Claim Raised
5. **Fleet Performance & Maintenance** (Coming Soon)
6. **Vessel Finder & Route Optimization** (Coming Soon)
7. **Compliance & Certification** (Coming Soon)
8. **Crew Management** - Employee management
9. **Risk & Incident Management** (Coming Soon)
10. **Sustainability & ESG Reporting** (Coming Soon)
11. **Port Management**
12. **Vessel Management**
13. **Payroll Management**
14. **Employee Management**
15. **Onboarding Review**
16. **Role Management**
17. **Branch** - Business Units
18. **Licenses**
19. **Payment**

---

## 🔑 **Core Business Workflows**

### **1. RFQ (Request for Quotation) Management**

#### **Purpose:**
Customers create RFQs to request quotations from vendors for equipment, spare parts, or services needed for their vessels.

#### **Workflow:**

```
Customer navigates to RFQs page
    ↓
Views existing RFQs with filters:
    - Status: All, Sent, Ordered, Quoted, Delivered
    - Search by: Vessel, Port, Brand, Category, Title
    ↓
Creates new RFQ:
    - Click "Create Enquiry"
    - Select vessel (from vessel list)
    - Enter details:
      * Title, description
      * Brand, model, category
      * Supply port
      * Due date
      * Items list (with quantities, specifications)
    - Select vendor(s) to send RFQ to
    - Submit
    ↓
RFQ created with status: 'draft' or 'sent'
    ↓
RFQ sent to selected vendors
    ↓
Vendors receive RFQ and can submit quotations
    ↓
Customer views quotations in RFQ Details page
    ↓
Customer can:
    - Compare quotations
    - Accept a quotation
    - Request modifications
    - Reject quotations
```

#### **RFQ Status Lifecycle:**
- `draft` → `sent` → `quoted` → `ordered` → `delivered`

#### **Key Features:**
- **Bulk Upload**: Upload RFQs via Excel template
- **Vessel Linking**: Each RFQ can be linked to a specific vessel
- **Multi-Vendor**: Send same RFQ to multiple vendors
- **Status Tracking**: Track RFQ through entire procurement cycle
- **Quotation Comparison**: View and compare all quotations for an RFQ

---

### **2. Vessel Management**

#### **Purpose:**
Manage the customer's fleet of vessels with license-enforced limits.

#### **Workflow:**

```
Customer navigates to Vessel Management
    ↓
Views vessel list with license status:
    - "Vessels: X / Y (Z remaining)"
    - Shows: Name, IMO Number, Type, Ex-Vessel Name
    ↓
Adds new vessel:
    - Click "Add Vessel"
    - Fill form:
      * Name (required)
      * IMO Number (optional, unique)
      * Ex-Vessel Name (optional)
      * Type (required)
    - Submit
    ↓
Backend checks:
    1. License is active
    2. Vessel limit not exceeded
    3. If OK → Create vessel
    4. Increment license usage
    ↓
Vessel created and available for:
    - RFQ creation
    - Business Unit assignment
    - Fleet overview
```

#### **License Enforcement:**
- Before creating vessel: Check `currentUsage.vessels < usageLimits.vessels`
- If limit exceeded: Show error, disable "Add Vessel" button
- On creation: Increment `currentUsage.vessels`
- On deletion: Decrement `currentUsage.vessels`

#### **Key Features:**
- **License Display**: Shows current usage vs limits
- **Bulk Upload**: Upload multiple vessels via Excel
- **Search & Filter**: Find vessels quickly
- **Edit/Delete**: Update vessel information
- **Vessel Linking**: Link vessels to RFQs and Business Units

---

### **3. Business Unit (Branch) Management**

#### **Purpose:**
Organize operations into business units/branches for better management and tracking.

#### **Workflow:**

```
Customer navigates to Branch page
    ↓
Views list of Business Units
    ↓
Creates new Business Unit:
    - Click "Add Branch"
    - Fill form:
      * Name (required)
      * Address
      * Phone Number
      * Representative (select from employees)
    - Submit
    ↓
Business Unit created
    ↓
Customer can:
    - View BU profile
    - Assign employees to BU
    - Assign vessels to BU
    - Track RFQs per BU
    - View budget (planned)
    - View transaction history
```

#### **Business Unit Profile Page:**

Each BU profile shows:
1. **BU Overall Information**
   - Name, address, phone
   - Representative details
   - Creation date

2. **Assigned Employees**
   - List of employees assigned to this BU
   - Assign/Unassign functionality

3. **Assigned Vessels**
   - List of vessels assigned to this BU
   - Assign/Unassign functionality

4. **RFQs from this BU**
   - All RFQs linked to this BU
   - Status tracking
   - View RFQ details

5. **Budget Allocated** (Planned)
   - Total allocated
   - Total spent
   - Remaining

6. **Transaction History**
   - Payment records
   - Order history

---

### **4. Employee Management & Onboarding**

#### **Purpose:**
Manage employees/crew members with a complete onboarding workflow.

#### **Employee Invitation Workflow:**

```
Customer Admin navigates to Employee Management
    ↓
Invites employee:
    - Enter employee email
    - Send invitation
    ↓
Employee receives email with invitation link
    ↓
Employee clicks link → Opens onboarding form
    ↓
Employee fills comprehensive form:
    Personal Details:
      - Full name, email, phone
      - Country, state, city, zip code
      - Address lines
      - Profile photo
    
    Bank Details:
      - Account number
      - IFSC/SWIFT code
      - Bank name
    
    Identity Documents:
      - Document type (Passport, PAN, SSN, etc.)
      - Upload document files
    
    Payment Identity:
      - Payment identity type
      - Payment identity document
    
    Nominee Details:
      - Nominee name, relation
      - Nominee phone
    ↓
Employee submits form
    ↓
Status: 'submitted' (awaiting approval)
    ↓
Customer Admin reviews in "Onboarding Review" page
    ↓
Admin can:
    - View all submitted onboarding forms
    - Filter by status: All, Submitted, Approved, Rejected
    - View employee details and documents
    - Approve or Reject
    ↓
If Approved:
    - Employee account automatically created
    - User account created with temporary password
    - Welcome email sent with credentials
    - Employee can now access Customer Portal
    ↓
If Rejected:
    - Rejection reason recorded
    - Employee notified
```

#### **Employee Management Features:**
- **List View**: View all employees
- **Search & Filter**: Find employees quickly
- **Payroll Details**: Manage salary information
- **Business Unit Assignment**: Assign employees to BUs
- **Role Assignment**: Assign roles and permissions

---

### **5. Vendor Management**

#### **Purpose:**
Invite and manage vendors that customers want to work with.

#### **Vendor Invitation Workflow:**

```
Customer navigates to Vendor Management
    ↓
Views list of vendors:
    - Vendors invited by this customer
    - Admin-invited vendors (visible to all)
    - Filter by status: All, Approved, Pending, Rejected
    ↓
Invites new vendor:
    - Click "Invite Vendor"
    - Fill form:
      * Vendor company name
      * Admin email (vendor admin's email)
      * Admin first name
      * Admin last name
    - Submit
    ↓
Backend creates:
    - Vendor organization
    - Vendor admin user account
    - Invitation token
    ↓
Invitation email sent to vendor admin
    ↓
Vendor receives email with onboarding link
    ↓
Vendor completes onboarding
    ↓
Vendor status tracked:
    - 'pending': Onboarding in progress
    - 'approved': Onboarding approved by admin
    - 'rejected': Onboarding rejected
```

#### **Vendor Visibility:**
- **Customer-Invited Vendors**: Only visible to the customer who invited them
- **Admin-Invited Vendors**: Visible to all customers
- **RFQ Targeting**: Customers can send RFQs to their invited vendors

#### **Key Features:**
- **Invitation Tracking**: See which vendors are pending/approved
- **Vendor Search**: Search by name, email, company
- **Status Filtering**: Filter by onboarding status
- **Auto-Refresh**: Vendor list auto-refreshes every 10 seconds

---

### **6. Payment & License Management**

#### **Payment Workflow:**

```
Customer navigates to Payment page
    ↓
Views payment status:
    - Active subscription period
    - Payment history
    - Upcoming renewals
    ↓
If no active payment:
    - Select plan (Monthly/Yearly)
    - Click "Subscribe"
    - Razorpay checkout opens
    - Complete payment
    ↓
Payment verified on server
    ↓
License automatically created
    ↓
Customer gains full portal access
```

#### **License Management:**

```
Customer navigates to Licenses page
    ↓
Views license information:
    - License status (active/expired/suspended)
    - Expiry date
    - Usage limits:
      * Users: X / Y
      * Vessels: X / Y
      * Items: X / Y (if applicable)
    - Current usage
    - Remaining capacity
```

#### **License Enforcement:**
- **Every Request**: Checks if license is active
- **Resource Creation**: Checks usage limits before creating resources
- **Access Control**: Blocks access if license expired or suspended

---

### **7. Role Management**

#### **Purpose:**
Manage roles and permissions for employees within the customer organization.

#### **Features:**
- **Roles & Permissions**: Define custom roles
- **Assign Roles**: Assign roles to employees
- **Permission Control**: Control what each role can do

---

### **8. Analytics & Reporting**

#### **Available Reports:**

1. **Order & Delivery Reports**
   - Order tracking
   - Delivery status
   - Delivery timelines

2. **Billing & Payments Reports**
   - Payment history
   - Invoice tracking
   - Payment status

3. **Service Usage Reports**
   - Feature usage statistics
   - Resource utilization

4. **Support & Feedback Reports**
   - Support tickets
   - Feedback analysis

5. **Customer Experience Dashboard**
   - Overall metrics
   - User satisfaction

---

## 🔐 **Access Control & Security**

### **Authentication:**
- JWT-based authentication
- Access token (short-lived)
- Refresh token (long-lived)
- Auto token refresh

### **Authorization:**
- Portal-specific access (customer portal only)
- Role-based permissions
- License validation
- Payment subscription validation

### **Data Isolation:**
- All data scoped to customer's organization
- Cannot access other customers' data
- Business units scoped to organization

---

## 📊 **Key Data Models**

### **RFQ:**
```typescript
{
  _id: ObjectId,
  organizationId: ObjectId,  // Customer organization
  rfqNumber: string,          // Auto-generated
  title: string,
  description?: string,
  status: 'draft' | 'sent' | 'quoted' | 'ordered' | 'delivered',
  vesselId?: ObjectId,        // Linked vessel
  recipientVendorIds: ObjectId[],  // Vendors to send RFQ to
  brand?: string,
  model?: string,
  category?: string,
  supplyPort?: string,
  items: Array<{...}>,        // RFQ items
  createdAt: Date,
  updatedAt: Date
}
```

### **Vessel:**
```typescript
{
  _id: ObjectId,
  organizationId: ObjectId,   // Customer organization
  name: string,
  imoNumber?: string,         // Unique
  exVesselName?: string,
  type: string,
  flag?: string,
  metadata?: object,
  createdAt: Date,
  updatedAt: Date
}
```

### **BusinessUnit:**
```typescript
{
  _id: ObjectId,
  organizationId: ObjectId,    // Customer organization
  name: string,
  metadata: {
    address?: string,
    phoneNumber?: string,
    representativeId?: ObjectId  // Employee ID
  },
  createdAt: Date,
  updatedAt: Date
}
```

### **Employee:**
```typescript
{
  _id: ObjectId,
  organizationId: ObjectId,   // Customer organization
  firstName: string,
  lastName: string,
  email: string,
  phone?: string,
  position?: string,
  department?: string,
  role?: string,
  businessUnitId?: ObjectId,   // Assigned BU
  payrollDetails: {
    base: number,
    hra: number,
    ta: number,
    // ... other payroll fields
    grossSalary: number,
    netSalary: number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### **EmployeeOnboarding:**
```typescript
{
  _id: ObjectId,
  employeeId?: ObjectId,      // If employee exists
  organizationId: ObjectId,
  invitationToken: string,
  fullName: string,
  email: string,
  phone: string,
  // Address fields
  // Bank details
  // Identity documents
  // Nominee details
  status: 'submitted' | 'approved' | 'rejected',
  submittedAt?: Date,
  approvedAt?: Date,
  rejectedAt?: Date,
  approvedBy?: ObjectId,
  rejectedBy?: ObjectId,
  rejectionReason?: string,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 **Business Rules**

### **1. License Enforcement:**
- **Vessel Creation**: Check `currentUsage.vessels < usageLimits.vessels`
- **Employee Creation**: Check `currentUsage.users < usageLimits.users`
- **Limit = 0**: Means unlimited
- **Exceeded**: Block creation, show error

### **2. Payment Enforcement:**
- **All Routes**: Check for active payment subscription
- **Active Payment**: `status = 'success'` AND `subscriptionPeriod.endDate > now`
- **No Payment**: Redirect to payment page

### **3. RFQ Rules:**
- **Vendor Selection**: Must select at least one vendor
- **Vessel Linking**: Optional but recommended
- **Status Progression**: `draft` → `sent` → `quoted` → `ordered` → `delivered`

### **4. Employee Onboarding:**
- **One Invitation**: One invitation per email
- **Approval Required**: Cannot access portal until approved
- **Auto Account Creation**: User account created on approval
- **Temporary Password**: Employee receives temporary password via email

### **5. Vendor Invitation:**
- **Customer-Specific**: Customer-invited vendors only visible to that customer
- **Admin-Invited**: Visible to all customers
- **Onboarding Required**: Vendor must complete onboarding before receiving RFQs

### **6. Business Unit:**
- **Organization-Scoped**: BUs belong to customer organization
- **Employee Assignment**: Employees can be assigned to multiple BUs
- **Vessel Assignment**: Vessels can be assigned to BUs
- **RFQ Tracking**: RFQs can be tracked per BU

---

## 📱 **User Interface Features**

### **Dashboard:**
- Quick access cards to main features
- Welcome message
- Navigation shortcuts

### **Search & Filter:**
- Global search across entities
- Status filters
- Date range filters
- Advanced filtering options

### **Data Tables:**
- Sortable columns
- Pagination
- Bulk actions
- Export functionality

### **Modals & Forms:**
- Add/Edit modals
- Form validation
- Error handling
- Success notifications

### **Real-time Updates:**
- Auto-refresh for vendor status
- Cross-tab synchronization
- Live status updates

---

## 🚀 **API Endpoints Used**

### **RFQ Management:**
- `GET /api/v1/customer/rfq` - List RFQs
- `POST /api/v1/customer/rfq` - Create RFQ
- `GET /api/v1/customer/rfq/:id` - Get RFQ details
- `PUT /api/v1/customer/rfq/:id` - Update RFQ
- `DELETE /api/v1/customer/rfq/:id` - Delete RFQ

### **Vessel Management:**
- `GET /api/v1/customer/vessels` - List vessels
- `POST /api/v1/customer/vessels` - Create vessel
- `GET /api/v1/customer/vessels/:id` - Get vessel
- `PUT /api/v1/customer/vessels/:id` - Update vessel
- `DELETE /api/v1/customer/vessels/:id` - Delete vessel

### **Business Units:**
- `GET /api/v1/customer/business-units` - List BUs
- `POST /api/v1/customer/business-units` - Create BU
- `GET /api/v1/customer/business-units/:id` - Get BU
- `PUT /api/v1/customer/business-units/:id` - Update BU
- `DELETE /api/v1/customer/business-units/:id` - Delete BU

### **Employee Management:**
- `GET /api/v1/customer/employees` - List employees
- `POST /api/v1/customer/employees` - Create employee
- `POST /api/v1/customer/employees/invite` - Invite employee
- `GET /api/v1/customer/employees/onboarding-review` - Review onboarding
- `POST /api/v1/customer/employees/onboardings/:id/approve` - Approve onboarding
- `POST /api/v1/customer/employees/onboardings/:id/reject` - Reject onboarding

### **Vendor Management:**
- `GET /api/v1/customer/vendors/users` - List vendors
- `POST /api/v1/customer/vendors/invite` - Invite vendor

### **Payment & License:**
- `GET /api/v1/payments/user` - Get payments
- `POST /api/v1/payments` - Create payment
- `GET /api/v1/customer/licenses` - Get licenses

---

## 🎯 **Summary**

The Customer Portal is a comprehensive **maritime procurement and fleet management system** that enables shipping companies to:

✅ **Manage Fleet**: Track and manage vessels with license enforcement  
✅ **Procure Equipment**: Create RFQs, receive quotations, manage procurement  
✅ **Manage Vendors**: Invite and work with preferred vendors  
✅ **Organize Operations**: Structure operations through Business Units  
✅ **Manage Crew**: Complete employee onboarding and management  
✅ **Track Finances**: Monitor payments, licenses, and budgets  
✅ **Generate Reports**: Analytics and insights for decision-making  

The system ensures **data security**, **license compliance**, and **efficient procurement workflows** for maritime operations.

---

**Last Updated**: Based on current codebase analysis

