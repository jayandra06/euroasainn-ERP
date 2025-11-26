# Euroasiann ERP Platform - Complete Workflow Explanation

## 🔄 System Workflow Overview

This document explains the complete workflow of the Euroasiann ERP platform, from user authentication to vessel management and RFQ creation.

---

## 📋 Table of Contents

1. [Authentication & Access Flow](#1-authentication--access-flow)
2. [Vessel Management Workflow](#2-vessel-management-workflow)
3. [RFQ Creation Workflow](#3-rfq-creation-workflow)
4. [License & Payment Validation](#4-license--payment-validation)
5. [Data Flow Diagram](#5-data-flow-diagram)

---

## 1. Authentication & Access Flow

### Step-by-Step Process:

```
User Login Request
    ↓
POST /api/v1/auth/login
    ↓
AuthService.login()
    ├─ Validate email/password
    ├─ Check user.isActive
    ├─ Generate JWT tokens (access + refresh)
    ├─ Store refresh token in database
    └─ Return tokens to frontend
    ↓
Frontend stores tokens in localStorage
    ↓
All subsequent requests include: Authorization: Bearer <token>
```

### Middleware Chain for Protected Routes:

```
Request arrives
    ↓
1. authMiddleware
   ├─ Extract JWT token from header
   ├─ Verify token signature
   ├─ Check token expiration
   ├─ Check if token is blacklisted (Redis)
   └─ Attach user info to req.user
    ↓
2. requirePortal(PortalType.CUSTOMER)
   ├─ Verify user.portalType matches required portal
   └─ Reject if portal mismatch
    ↓
3. validateLicense
   ├─ Check if user has active license
   ├─ Verify license not expired
   └─ Skip for tech/admin portals
    ↓
4. paymentStatusMiddleware (for customer/vendor routes)
   ├─ Check if organization has active payment
   ├─ Verify payment subscription not expired
   └─ Block access if payment required
    ↓
5. Route Handler
   └─ Process the actual request
```

---

## 2. Vessel Management Workflow

### Complete Flow: Adding a New Vessel

```
User clicks "Add Vessel" button
    ↓
Frontend: VesselManagementPage
    ├─ Check license status (fetch from /api/v1/customer/licenses)
    ├─ Display: "Vessels: X / Y (Z remaining)"
    └─ Enable/disable button based on remaining capacity
    ↓
User fills form and submits
    ↓
POST /api/v1/customer/vessels
    ↓
Middleware Chain (as above)
    ↓
VesselService.createVessel()
    ├─ Step 1: License Validation
    │   └─ licenseService.checkUsageLimit(orgId, 'vessels')
    │       ├─ Find active license for organization
    │       ├─ Check: currentUsage.vessels < usageLimits.vessels
    │       └─ Return true/false
    │
    ├─ Step 2: Create Vessel (if limit not exceeded)
    │   └─ new Vessel({ name, type, imoNumber, exVesselName, organizationId })
    │
    ├─ Step 3: Save to Database
    │   └─ vessel.save()
    │
    └─ Step 4: Update License Usage
        └─ licenseService.incrementUsage(orgId, 'vessels')
            ├─ Find license
            ├─ Increment: currentUsage.vessels += 1
            └─ Save license
    ↓
Response: { success: true, data: vessel }
    ↓
Frontend:
    ├─ Invalidate queries (refresh vessel list)
    ├─ Invalidate license query (update usage display)
    ├─ Show success toast
    └─ Close modal
```

### Vessel Data Model:

```typescript
{
  _id: ObjectId,
  organizationId: ObjectId (ref: Organization),
  name: string (required),
  type: string (required),
  imoNumber: string (optional, unique),
  exVesselName: string (optional),
  flag: string (optional),
  metadata: object (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### License Check Logic:

```typescript
// In LicenseService.checkUsageLimit()
1. Find active license: status='active' AND expiresAt > now
2. Get limit: license.usageLimits.vessels
3. Get current: license.currentUsage.vessels
4. If limit === 0: return true (unlimited)
5. If current < limit: return true (can create)
6. Else: return false (limit exceeded)
```

---

## 3. RFQ Creation Workflow

### Complete Flow: Creating an RFQ with Vessel

```
User navigates to RFQs page
    ↓
Frontend: RFQsPage
    ├─ Fetch vessels: GET /api/v1/customer/vessels
    │   └─ Display in dropdown/selector
    │
    └─ Fetch existing RFQs: GET /api/v1/customer/rfq
        └─ Display in table with vessel info
    ↓
User clicks "Create Enquiry"
    ↓
User fills RFQ form:
    ├─ Select vessel (from vessel list)
    ├─ Enter brand
    ├─ Enter model
    ├─ Enter category/categories
    ├─ Enter supply port
    ├─ Enter description
    └─ Set status (default: 'draft')
    ↓
POST /api/v1/customer/rfq
    ↓
Middleware Chain (as above)
    ↓
RFQService.createRFQ()
    ├─ Step 1: License Check (for employees limit)
    │   └─ licenseService.checkUsageLimit(orgId, 'employees')
    │
    ├─ Step 2: Generate RFQ Number
    │   └─ Format: "RFQ-{timestamp}-{uuid}"
    │
    ├─ Step 3: Create RFQ
    │   └─ new RFQ({
    │       rfqNumber: generated,
    │       organizationId: orgId,
    │       vesselId: selectedVesselId,
    │       title: string,
    │       brand: string,
    │       model: string,
    │       category: string,
    │       categories: string[],
    │       supplyPort: string,
    │       status: 'draft',
    │       ...
    │     })
    │
    └─ Step 4: Save to Database
        └─ rfq.save()
    ↓
Response: { success: true, data: rfq }
    ↓
Frontend:
    ├─ Invalidate RFQ queries
    ├─ Show success toast
    └─ Redirect to RFQs list
```

### RFQ Data Model:

```typescript
{
  _id: ObjectId,
  organizationId: ObjectId (ref: Organization),
  rfqNumber: string (unique, auto-generated),
  title: string (required),
  description: string (optional),
  status: string (default: 'draft'),
  dueDate: Date (optional),
  vesselId: ObjectId (ref: Vessel, optional),
  brand: string (optional),
  model: string (optional),
  category: string (optional),
  categories: string[] (optional),
  supplyPort: string (optional),
  metadata: object (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### RFQ Display with Vessel Info:

```typescript
// When fetching RFQs
RFQService.getRFQs()
    └─ RFQ.find().populate('vesselId', 'name imoNumber type')
        └─ Returns RFQs with full vessel object:
            {
              _id: "...",
              vesselId: {
                _id: "...",
                name: "Vessel Name",
                imoNumber: "1234567",
                type: "Container Ship"
              },
              brand: "...",
              ...
            }
```

---

## 4. License & Payment Validation

### License Validation Flow:

```
Every Customer/Vendor Portal Request
    ↓
validateLicense Middleware
    ├─ Skip if portalType === 'tech' || 'admin'
    │
    └─ For customer/vendor:
        ├─ Find license: status='active' AND expiresAt > now
        ├─ If not found: throw "No valid license found"
        ├─ If expired: update status to 'expired' and throw error
        └─ If valid: continue to next middleware
```

### Payment Validation Flow:

```
Customer/Vendor Portal Routes (except /payment, /licenses)
    ↓
paymentStatusMiddleware
    ├─ Get user's organizationId
    ├─ Check payment status:
    │   └─ Find payment: status='success' AND subscriptionPeriod.endDate > now
    │
    ├─ If no active payment:
    │   └─ Return 403: "Payment required"
    │
    └─ If active payment exists:
        └─ Continue to route handler
```

### License Usage Tracking:

```
When Vessel Created:
    currentUsage.vessels += 1

When Vessel Deleted:
    currentUsage.vessels = max(0, currentUsage.vessels - 1)

When User Created:
    currentUsage.users += 1

When User Deleted:
    currentUsage.users = max(0, currentUsage.users - 1)
```

---

## 5. Data Flow Diagram

### Complete Request Flow:

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  VesselManagementPage                                │  │
│  │  - Fetch licenses (GET /licenses)                    │  │
│  │  - Fetch vessels (GET /vessels)                      │  │
│  │  - Create vessel (POST /vessels)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  RFQsPage                                            │  │
│  │  - Fetch vessels (GET /vessels)                      │  │
│  │  - Fetch RFQs (GET /rfq)                            │  │
│  │  - Create RFQ (POST /rfq)                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ HTTP Request
                        │ Authorization: Bearer <token>
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                    API SERVER (Express)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Middleware Chain                                    │  │
│  │  1. authMiddleware → Verify JWT                      │  │
│  │  2. requirePortal → Check portal type                │  │
│  │  3. validateLicense → Check license active           │  │
│  │  4. paymentStatusMiddleware → Check payment          │  │
│  └──────────────────────────────────────────────────────┘  │
│                        │                                    │
│                        ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Route Handler                                       │  │
│  │  POST /api/v1/customer/vessels                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                        │                                    │
│                        ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  VesselService.createVessel()                        │  │
│  │  1. Check license limit                             │  │
│  │  2. Create vessel document                          │  │
│  │  3. Save to MongoDB                                 │  │
│  │  4. Increment license usage                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (MongoDB)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Vessels     │  │  Licenses    │  │  RFQs        │     │
│  │  Collection  │  │  Collection  │  │  Collection  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Relationships:                                              │
│  - Vessel.organizationId → Organization._id                 │
│  - RFQ.organizationId → Organization._id                     │
│  - RFQ.vesselId → Vessel._id                                 │
│  - License.organizationId → Organization._id                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Key Components & Their Roles

### Backend Services:

1. **AuthService**
   - User authentication
   - JWT token generation/validation
   - Password hashing/verification

2. **LicenseService**
   - License validation
   - Usage limit checking
   - Usage counter management (increment/decrement)

3. **VesselService**
   - Vessel CRUD operations
   - License limit enforcement
   - Organization-scoped queries

4. **RFQService**
   - RFQ CRUD operations
   - Auto-generate RFQ numbers
   - Vessel population for display

5. **PaymentService**
   - Payment status checking
   - Payment creation/updates
   - Subscription period management

### Frontend Components:

1. **VesselManagementPage**
   - Display vessel list
   - License status display
   - Vessel creation form
   - Search/filter functionality

2. **RFQsPage**
   - Display RFQ list with vessel info
   - Status filtering
   - Search functionality
   - Create RFQ navigation

3. **AuthContext**
   - User authentication state
   - Token management
   - Auto token refresh

---

## 7. Error Handling Flow

### Common Error Scenarios:

1. **License Limit Exceeded**
   ```
   User tries to add vessel
   → License check fails
   → Error: "Vessel limit exceeded"
   → Frontend shows error toast
   → Button disabled
   ```

2. **No Active Payment**
   ```
   User tries to access route
   → paymentStatusMiddleware checks
   → No active payment found
   → 403: "Payment required"
   → Frontend redirects to payment page
   ```

3. **License Expired**
   ```
   User tries to access route
   → validateLicense checks
   → License expired
   → 403: "License has expired"
   → Frontend shows error message
   ```

4. **Invalid Token**
   ```
   Request with invalid/expired token
   → authMiddleware fails
   → 401: "Unauthorized"
   → Frontend redirects to login
   ```

---

## 8. Summary

### Complete User Journey:

1. **Login** → Get JWT tokens
2. **Access Portal** → License & Payment validation
3. **View License Status** → See usage limits
4. **Add Vessel** → License check → Create → Update usage
5. **Create RFQ** → Select vessel → Add details → Save
6. **View RFQs** → See list with vessel information

### Key Features:

✅ **Automatic License Validation** - Every request checks license status  
✅ **Usage Tracking** - Real-time tracking of resource usage  
✅ **Payment Enforcement** - Blocks access without active payment  
✅ **Vessel-RFQ Linking** - Vessels automatically available in RFQs  
✅ **Data Population** - RFQs show full vessel details  
✅ **Error Handling** - Clear error messages for all scenarios  

---

## 9. API Endpoints Reference

### Customer Portal Endpoints:

```
Authentication:
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

Vessels:
GET    /api/v1/customer/vessels
POST   /api/v1/customer/vessels
GET    /api/v1/customer/vessels/:id
PUT    /api/v1/customer/vessels/:id
DELETE /api/v1/customer/vessels/:id

RFQs:
GET    /api/v1/customer/rfq
POST   /api/v1/customer/rfq
GET    /api/v1/customer/rfq/:id
PUT    /api/v1/customer/rfq/:id
DELETE /api/v1/customer/rfq/:id

License:
GET    /api/v1/customer/licenses

Payment:
GET    /api/v1/payments/status/check
POST   /api/v1/payments
GET    /api/v1/payments/user
```

---

This workflow ensures data integrity, proper access control, and seamless integration between vessels and RFQs throughout the system.

