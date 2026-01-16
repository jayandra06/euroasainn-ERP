# 🚀 Deploy Frontend to Vercel NOW

## ✅ Your Setup
- **Backend API:** `http://147.93.102.82:3000` ✅ Running
- **Frontend:** Need to deploy to Vercel

---

## 📋 Quick Steps (5 minutes per portal)

### For EACH Portal (Vendor, Customer, Admin, Tech):

1. **Go to [vercel.com](https://vercel.com)** → Add New Project

2. **Select your repository**

3. **Configure:**
   ```
   Project Name: euroasiann-[portal-name]-portal
   Root Directory: apps/[portal-name]-portal
   Framework: Vite
   Build Command: npm run build
   Output Directory: dist
   ```

4. **Click Deploy**

5. **Add Environment Variable:**
   - Go to Settings → Environment Variables
   - Add: `VITE_API_URL` = `http://147.93.102.82:3000`
   - Select: Production, Preview, Development
   - Save

6. **Redeploy:**
   - Go to Deployments tab
   - Click ⋯ on latest deployment
   - Click Redeploy

---

## 🎯 Portal Configuration

| Portal | Root Directory | Project Name |
|--------|---------------|--------------|
| Vendor | `apps/vendor-portal` | `euroasiann-vendor-portal` |
| Customer | `apps/customer-portal` | `euroasiann-customer-portal` |
| Admin | `apps/admin-portal` | `euroasiann-admin-portal` |
| Tech | `apps/tech-portal` | `euroasiann-tech-portal` |

---

## ⚙️ Environment Variable (Same for ALL)

```
Key:   VITE_API_URL
Value: http://147.93.102.82:3000
```

**Important:** Select all environments (Production, Preview, Development)

---

## ✅ After Deployment

Your portals will be live at:
- `https://euroasiann-vendor-portal.vercel.app`
- `https://euroasiann-customer-portal.vercel.app`
- `https://euroasiann-admin-portal.vercel.app`
- `https://euroasiann-tech-portal.vercel.app`

---

## 🧪 Test

1. Visit any portal URL
2. Try to login
3. Check browser console (F12) - should see API calls to `http://147.93.102.82:3000`

---

## 🆘 Quick Fixes

**Build fails?**
- Check root directory is correct
- Verify `package.json` exists

**Can't connect to API?**
- Verify `VITE_API_URL` is set
- Check backend: `curl http://147.93.102.82:3000`

**Environment variable not working?**
- Make sure you selected ALL environments
- Redeploy after adding variable

---

## 🎉 Done!

Once all 4 portals are deployed, your entire application is live!
