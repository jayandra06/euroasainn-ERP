# Login Instructions for Business Rules Editor

## How to Login

### Step 1: Make Sure Services Are Running

```bash
# Terminal 1: Start Backend API
cd apps/api
npm run dev

# Terminal 2: Start Tech Portal
cd apps/tech-portal
npm run dev
```

### Step 2: Access the Login Page

1. Open your browser and go to: `http://localhost:4200`
2. You will be redirected to the login page if not authenticated
3. Or go directly to: `http://localhost:4200/login`

### Step 3: Login Credentials

You need to have a user account in the database. If you don't have one yet, you need to create one first.

#### Option A: Use Existing User (if seeded)

If you have seeded users, try:
- **Email**: `tech.admin@euroasiann.com`
- **Password**: `TechAdmin123!` (or whatever was set in seed script)

#### Option B: Create a User via API

If you don't have a user, create one first:

```bash
# Create a tech portal admin user
curl -X POST http://localhost:3000/api/v1/tech/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TECH_ADMIN_TOKEN" \
  -d '{
    "email": "your-email@example.com",
    "password": "YourPassword123!",
    "firstName": "Your",
    "lastName": "Name",
    "portalType": "tech",
    "role": "tech_admin",
    "organizationId": "YOUR_ORG_ID",
    "isActive": true
  }'
```

#### Option C: Run Seed Script

If you have a seed script, run it to create default users:

```bash
cd apps/api
npm run seed
```

### Step 4: Login Process

1. On the login page, enter:
   - **Email**: Your email address
   - **Password**: Your password
   - **Portal Type**: Should be automatically set to "tech"

2. Click **"Login"** button

3. If successful, you'll be redirected to the dashboard

4. From the dashboard, click on **"Business Rules"** card
   - Or go directly to: `http://localhost:4200/business-rules`

### Step 5: Access Business Rules Editor

After login, you can now access:
- Business Rules List: `http://localhost:4200/business-rules`
- Create New Rule: `http://localhost:4200/business-rules/new`
- Edit Rule: `http://localhost:4200/business-rules/{id}/edit`

## Troubleshooting

### Issue: "Login failed" Error

**Possible Causes:**
1. User doesn't exist in database
2. Wrong email/password
3. User account is inactive
4. Backend API is not running

**Solutions:**
1. Check if user exists in database:
   ```bash
   # Connect to MongoDB and check users collection
   ```
2. Verify password is correct
3. Check user `isActive` field is `true`
4. Make sure backend is running on port 3000

### Issue: Redirect Loop

**Possible Causes:**
1. Token not being stored correctly
2. Token expired
3. API authentication failing

**Solutions:**
1. Check browser console for errors
2. Check localStorage:
   - Open browser DevTools (F12)
   - Go to Application > Local Storage
   - Check for `accessToken` and `refreshToken`
3. Clear localStorage and try again:
   ```javascript
   localStorage.clear();
   ```

### Issue: "Failed to get user info"

**Possible Causes:**
1. API endpoint `/auth/me` is failing
2. Token is invalid
3. CORS issues

**Solutions:**
1. Check backend API is running
2. Verify API endpoint is accessible: `http://localhost:3000/api/v1/auth/me`
3. Check browser Network tab for API errors
4. Verify CORS settings in backend

### Issue: Can't Create User

If you can't create a user through API, you can:

1. **Use MongoDB directly:**
   ```javascript
   // Connect to MongoDB
   // Create user manually with hashed password
   ```

2. **Use Seed Script:**
   ```bash
   cd apps/api
   npm run seed
   ```

3. **Create via Admin Portal:**
   - If you have admin portal access, create user there

## Quick Test

To quickly test if login works:

1. **Check API is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Test login endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "your-email@example.com",
       "password": "YourPassword123!",
       "portalType": "tech"
     }'
   ```

3. **If successful, you'll get:**
   ```json
   {
     "success": true,
     "data": {
       "accessToken": "...",
       "refreshToken": "...",
       "user": {...}
     }
   }
   ```

## Default Test Credentials (If Seeded)

If you have seed scripts, default credentials might be:
- Email: `tech.admin@euroasiann.com`
- Password: `TechAdmin123!`
- Portal Type: `tech`

## Still Having Issues?

1. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

2. **Check Backend Logs:**
   - Look at terminal where `npm run dev` is running
   - Check for errors or warnings

3. **Verify Database Connection:**
   - Make sure MongoDB is running
   - Check `.env` file has correct `MONGODB_URI`

4. **Verify Environment Variables:**
   - Check `JWT_SECRET` is set
   - Check API URLs match

---

**After successful login, you'll be able to access the Business Rules Editor! 🎉**







