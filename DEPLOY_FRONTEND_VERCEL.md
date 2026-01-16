# Deploy Frontend to Vercel - Step by Step

## ✅ Your Backend is Ready!
- **API URL:** `http://147.93.102.82:3000`
- **Status:** ✅ Deployed and Running

## 🚀 Deploy All 4 Portals to Vercel

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up**
3. Choose **Continue with GitHub**
4. Authorize Vercel to access your repositories

### Step 2: Deploy Vendor Portal

1. Click **Add New Project**
2. Select your repository
3. Configure:
   - **Project Name:** `euroasiann-vendor-portal`
   - **Root Directory:** Click **Edit** → Set to `apps/vendor-portal`
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Click **Deploy**

### Step 3: Add Environment Variable (Vendor Portal)

1. After deployment, go to **Settings** → **Environment Variables**
2. Click **Add New**
3. Add:
   - **Key:** `VITE_API_URL`
   - **Value:** `http://147.93.102.82:3000`
   - **Environment:** Select all (Production, Preview, Development)
4. Click **Save**
5. Go to **Deployments** tab
6. Click **⋯** (three dots) on latest deployment
7. Click **Redeploy**

### Step 4: Deploy Customer Portal

1. Click **Add New Project** again
2. Select the same repository
3. Configure:
   - **Project Name:** `euroasiann-customer-portal`
   - **Root Directory:** `apps/customer-portal`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **Deploy**
5. Add environment variable: `VITE_API_URL` = `http://147.93.102.82:3000`
6. Redeploy

### Step 5: Deploy Admin Portal

1. Click **Add New Project**
2. Configure:
   - **Project Name:** `euroasiann-admin-portal`
   - **Root Directory:** `apps/admin-portal`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Click **Deploy**
4. Add environment variable: `VITE_API_URL` = `http://147.93.102.82:3000`
5. Redeploy

### Step 6: Deploy Tech Portal

1. Click **Add New Project**
2. Configure:
   - **Project Name:** `euroasiann-tech-portal`
   - **Root Directory:** `apps/tech-portal`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Click **Deploy**
4. Add environment variable: `VITE_API_URL` = `http://147.93.102.82:3000`
5. Redeploy

## ✅ That's It!

Your frontends are now deployed and will be accessible at:
- Vendor Portal: `https://euroasiann-vendor-portal.vercel.app`
- Customer Portal: `https://euroasiann-customer-portal.vercel.app`
- Admin Portal: `https://euroasiann-admin-portal.vercel.app`
- Tech Portal: `https://euroasiann-tech-portal.vercel.app`

## 🧪 Test Your Deployment

1. Visit any portal URL
2. Try logging in
3. Check browser console (F12) for errors
4. Verify API calls are going to `http://147.93.102.82:3000`

## 🔧 Quick Reference

### Environment Variable for ALL Portals:
```
Key:   VITE_API_URL
Value: http://147.93.102.82:3000
```

### Root Directories:
- Vendor Portal: `apps/vendor-portal`
- Customer Portal: `apps/customer-portal`
- Admin Portal: `apps/admin-portal`
- Tech Portal: `apps/tech-portal`

## 🆘 Troubleshooting

### Build Fails?
- Check Vercel deployment logs
- Verify root directory is correct
- Ensure `package.json` exists in portal directory

### Can't Connect to API?
- Verify `VITE_API_URL` is set correctly
- Check backend is running: `curl http://147.93.102.82:3000`
- Check CORS settings on backend

### Environment Variable Not Working?
- Make sure you selected all environments (Production, Preview, Development)
- Redeploy after adding environment variable
- Check variable name is exactly `VITE_API_URL`
