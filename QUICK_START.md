# Quick Start Guide - Euroasiann ERP Platform

## 🚀 Setup & Run (5 Minutes)

### Step 1: Install Dependencies
```bash
cd "/media/jay/DATA/EuroasiannGroupProd/Latest ERP Prod/euroasiann-platform"
npm install
```

### Step 2: Seed Database
```bash
cd apps/api
npm run seed
```

This creates:
- ✅ Admin organization
- ✅ Tech admin user: `tech.admin@euroasiann.com` / `TechAdmin123!`
- ✅ Admin superuser: `admin.superuser@euroasiann.com` / `Admin123!`
- ✅ Sample customer organization with license
- ✅ Sample vendor organization with license
- ✅ CASBIN policies

### Step 3: Start API Server
```bash
npm run dev
```

API will be running at: `http://localhost:3000`

### Step 4: Test API

#### Health Check
```bash
curl http://localhost:3000/health
```

#### Login (Tech Admin)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tech.admin@euroasiann.com",
    "password": "TechAdmin123!",
    "portalType": "tech"
  }'
```

#### Get Current User (Use access token from login)
```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📋 API Endpoints Reference

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Tech Portal
- `GET /api/v1/tech/users` - Get tech users
- `POST /api/v1/tech/users` - Create tech user
- `GET /api/v1/tech/admin-users` - Get admin users
- `POST /api/v1/tech/admin-users` - Create admin user
- `GET /api/v1/tech/licenses` - Get all licenses
- `POST /api/v1/tech/licenses` - Create license

### Admin Portal
- `GET /api/v1/admin/customer-orgs` - Get customer orgs
- `POST /api/v1/admin/customer-orgs` - Create customer org
- `GET /api/v1/admin/vendor-orgs` - Get vendor orgs
- `POST /api/v1/admin/vendor-orgs` - Create vendor org
- `GET /api/v1/admin/licenses` - Get licenses
- `POST /api/v1/admin/licenses` - Issue license

### Customer Portal
- `GET /api/v1/customer/rfq` - Get RFQs
- `POST /api/v1/customer/rfq` - Create RFQ
- `GET /api/v1/customer/rfq/:id` - Get RFQ by ID
- `PUT /api/v1/customer/rfq/:id` - Update RFQ
- `DELETE /api/v1/customer/rfq/:id` - Delete RFQ
- `GET /api/v1/customer/vessels` - Get vessels
- `POST /api/v1/customer/vessels` - Create vessel
- `GET /api/v1/customer/employees` - Get employees
- `POST /api/v1/customer/employees` - Create employee
- `GET /api/v1/customer/business-units` - Get business units
- `POST /api/v1/customer/business-units` - Create business unit

### Vendor Portal
- `GET /api/v1/vendor/catalogue` - Get catalogue (items)
- `GET /api/v1/vendor/inventory` - Get inventory
- `PATCH /api/v1/vendor/inventory/:id/stock` - Update stock
- `GET /api/v1/vendor/quotation` - Get quotations
- `POST /api/v1/vendor/quotation` - Create quotation
- `GET /api/v1/vendor/items` - Get items
- `POST /api/v1/vendor/items` - Create item

## 🔐 Default Credentials

After running `npm run seed`:

| Role | Email | Password | Portal |
|------|-------|----------|--------|
| Tech Admin (CTO) | tech.admin@euroasiann.com | TechAdmin123! | Tech |
| Admin Superuser | admin.superuser@euroasiann.com | Admin123! | Admin |

**⚠️ IMPORTANT: Change these passwords after first login!**

## 📦 Frontend Apps

### Start Tech Portal
```bash
cd ../tech-portal
nx serve tech-portal
# or
npm run dev
```

Port: `http://localhost:4200`

### Start Admin Portal
```bash
nx serve admin-portal
```

Port: `http://localhost:4300` (or next available)

### Start Customer Portal
```bash
nx serve customer-portal
```

### Start Vendor Portal
```bash
nx serve vendor-portal
```

## 🧪 Testing the API

### Using curl

#### 1. Login as Tech Admin
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tech.admin@euroasiann.com",
    "password": "TechAdmin123!",
    "portalType": "tech"
  }' | jq -r '.data.accessToken')

echo "Access Token: $TOKEN"
```

#### 2. Get Tech Users
```bash
curl http://localhost:3000/api/v1/tech/users \
  -H "Authorization: Bearer $TOKEN"
```

#### 3. Get Licenses
```bash
curl http://localhost:3000/api/v1/tech/licenses \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman/Insomnia

1. Import collection (create manually):
   - Base URL: `http://localhost:3000/api/v1`
   - Auth: Bearer Token (use login endpoint first)
2. Login endpoint:
   - POST `/auth/login`
   - Body: `{"email": "...", "password": "...", "portalType": "tech"}`
3. Use returned `accessToken` in Authorization header

## 🐛 Troubleshooting

### MongoDB Connection Error
- Verify `MONGODB_URI` in `.env`
- Check MongoDB Atlas network access (IP whitelist)
- Ensure cluster is running

### Redis Connection Error
- Verify Redis credentials in `.env`
- Check Redis instance is accessible
- For Render.com Redis, ensure network access

### CASBIN Policies Not Working
- Ensure seed script ran successfully
- Check MongoDB for `casbin_rule` collection
- Verify `packages/casbin-config/src/model.conf` exists

### Port Already in Use
- Change `PORT` in `.env` or `apps/api/src/config/environment.ts`
- Kill process using port: `lsof -ti:3000 | xargs kill`

### TypeScript Compilation Errors
- Run: `npm install` to ensure dependencies are installed
- Check Node.js version: `node --version` (should be v18+)
- Clear cache: `rm -rf node_modules package-lock.json && npm install`

## 📚 Next Steps

### 1. Build Frontend UI
- Create React components for each portal
- Implement authentication flows
- Build dashboards and management interfaces
- Use `@euroasiann/api-client` for API calls

### 2. Add Features
- Email notifications
- File uploads
- Reports and analytics
- Advanced search and filtering
- Export functionality

### 3. Production Setup
- Add input validation (express-validator)
- Add rate limiting
- Set up logging (Winston)
- Add API documentation (Swagger)
- Set up CI/CD pipeline
- Add unit and integration tests

## 🎯 Development Workflow

1. **Backend Development**
   ```bash
   cd apps/api
   npm run dev  # Auto-reload on changes
   ```

2. **Frontend Development**
   ```bash
   nx serve tech-portal  # Auto-reload on changes
   ```

3. **Database Changes**
   - Update models in `apps/api/src/models/`
   - Restart API server
   - Update seed script if needed

4. **API Testing**
   - Use Postman/Insomnia
   - Or curl commands
   - Test with different user roles

## 📝 Environment Variables

Required in `.env`:
```env
MONGODB_URI=mongodb+srv://...
REDIS_URL=rediss://...
JWT_SECRET=your-secret-key
PORT=3000
```

## ✅ Checklist

- [x] Dependencies installed
- [ ] Database seeded (`npm run seed`)
- [ ] API server running (`npm run dev`)
- [ ] Health check passing
- [ ] Login successful
- [ ] Can access protected routes
- [ ] Frontend apps can connect to API

## 🆘 Need Help?

- Check `GETTING_STARTED.md` for detailed setup
- Check `FINAL_STATUS.md` for implementation status
- Review API error messages in console
- Check MongoDB Atlas logs
- Check Redis connection status







