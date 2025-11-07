# Getting Started with Euroasiann ERP Platform

## Prerequisites

- Node.js v18 or higher
- MongoDB Atlas account (or local MongoDB)
- Redis instance (or use provided Redis URL)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

The `.env` file is already configured with:
- MongoDB URI
- Redis connection details
- JWT secret (change in production!)

Update the JWT_SECRET in `.env` for production:

```env
JWT_SECRET=your-super-secret-production-key-change-this
```

### 3. Seed CASBIN Policies

Before running the API, you need to seed CASBIN policies. Uncomment the seeding code in `apps/api/src/main.ts`:

```typescript
// Uncomment these lines in main.ts:
const { seedDefaultPolicies } = await import('../../../../packages/casbin-config/src/seed-policies');
await seedDefaultPolicies(enforcer);
```

Or create a separate migration script.

### 4. Run the Backend API

```bash
cd apps/api
npm run dev
```

The API will be available at:
- **API**: `http://localhost:3000/api/v1`
- **Health Check**: `http://localhost:3000/health`

### 5. Run Frontend Apps

#### Tech Portal
```bash
nx serve tech-portal
# or
cd apps/tech-portal
npm run dev
```

#### Admin Portal
```bash
nx serve admin-portal
```

#### Customer Portal
```bash
nx serve customer-portal
```

#### Vendor Portal
```bash
nx serve vendor-portal
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/login` - Login
  ```json
  {
    "email": "user@example.com",
    "password": "password",
    "portalType": "tech" // or "admin", "customer", "vendor"
  }
  ```

- `POST /api/v1/auth/refresh` - Refresh access token
  ```json
  {
    "refreshToken": "refresh-token-string"
  }
  ```

- `POST /api/v1/auth/logout` - Logout (requires auth token)
- `GET /api/v1/auth/me` - Get current user (requires auth token)

### Tech Portal Endpoints

- `GET /api/v1/tech/users` - Get all tech users
- `POST /api/v1/tech/users` - Create tech user (tech_admin only)
- `GET /api/v1/tech/admin-users` - Get all admin users
- `POST /api/v1/tech/admin-users` - Create admin user
- `GET /api/v1/tech/licenses` - Get all licenses
- `POST /api/v1/tech/licenses` - Create license (tech_admin only)

### Admin Portal Endpoints

- `GET /api/v1/admin/customer-orgs` - Get customer organizations
- `POST /api/v1/admin/customer-orgs` - Create customer organization
- `GET /api/v1/admin/vendor-orgs` - Get vendor organizations
- `POST /api/v1/admin/vendor-orgs` - Create vendor organization
- `GET /api/v1/admin/licenses` - Get all licenses
- `POST /api/v1/admin/licenses` - Issue license

### Customer Portal Endpoints

- `GET /api/v1/customer/rfq` - Get RFQs
- `POST /api/v1/customer/rfq` - Create RFQ
- `GET /api/v1/customer/vessels` - Get vessels
- `POST /api/v1/customer/vessels` - Create vessel
- `GET /api/v1/customer/employees` - Get employees
- `POST /api/v1/customer/employees` - Create employee
- `GET /api/v1/customer/business-units` - Get business units
- `POST /api/v1/customer/business-units` - Create business unit

### Vendor Portal Endpoints

- `GET /api/v1/vendor/catalogue` - Get catalogue
- `POST /api/v1/vendor/catalogue` - Create catalogue item
- `GET /api/v1/vendor/inventory` - Get inventory
- `POST /api/v1/vendor/inventory` - Update inventory
- `GET /api/v1/vendor/quotation` - Get quotations
- `POST /api/v1/vendor/quotation` - Create quotation
- `GET /api/v1/vendor/items` - Get items
- `POST /api/v1/vendor/items` - Create item

## Using the API Client

The API client package is available for frontend apps:

```typescript
import { authApi, apiClient } from '@euroasiann/api-client';

// Login
const response = await authApi.login({
  email: 'user@example.com',
  password: 'password',
  portalType: 'tech'
});

// Access token is automatically stored
// Make authenticated requests
const users = await apiClient.get('/tech/users');
```

## Creating First Admin Organization

To get started, you'll need to:

1. Create an admin organization manually in MongoDB or via a seed script
2. Create a tech admin user (manually or via script)
3. Use the tech admin to create other users and organizations

## Role Hierarchy

### Tech Portal
- **tech_admin** (CTO) - Full access, can create any user
- **tech_manager** - Can create admin users, manage licenses
- **tech_developer** - Limited tech access
- **tech_support** - View-only access

### Admin Portal
- **admin_superuser** - Full admin access
- **admin_user** - Limited admin access

### Customer/Vendor Portals
- Custom roles per organization
- Managed via CASBIN policies

## License Management

Licenses are required for customer and vendor portals:
- Licenses validate on each request
- Usage limits tracked (users, vessels, items)
- Expiry dates automatically checked
- Status: active, expired, suspended, revoked

## Development

### Project Structure

```
euroasiann-platform/
├── apps/
│   ├── api/              # Backend API
│   └── [portal]-portal/   # Frontend apps
├── packages/
│   ├── shared/           # Shared types
│   ├── api-client/       # API client SDK
│   └── casbin-config/    # CASBIN config
```

### Build Commands

```bash
# Build API
cd apps/api
npm run build

# Build all apps
nx run-many --target=build --all

# Run tests
nx test [project-name]
```

## Troubleshooting

### MongoDB Connection Issues
- Verify MONGODB_URI in `.env`
- Check network connectivity to MongoDB Atlas

### Redis Connection Issues
- Verify Redis credentials in `.env`
- Check if Redis instance is accessible

### CASBIN Policies Not Working
- Ensure policies are seeded
- Check MongoDB for `casbin_rule` collection
- Verify CASBIN model configuration

### Token Issues
- Check JWT_SECRET is set
- Verify token expiry times
- Check Redis for blacklisted tokens

## Next Steps

1. Implement full CRUD for all portal routes
2. Build frontend UI for each portal
3. Add input validation and error handling
4. Implement business logic for RFQ, quotation, etc.
5. Add testing (unit, integration)
6. Set up CI/CD pipeline







