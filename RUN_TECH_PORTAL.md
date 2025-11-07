# How to Run Tech Portal

## ✅ **Simple Method (Works Now!)**

### From Tech Portal Directory:
```bash
cd "/media/jay/DATA/EuroasiannGroupProd/Latest ERP Prod/euroasiann-platform/apps/tech-portal"
npm run dev
```

### From Project Root:
```bash
cd "/media/jay/DATA/EuroasiannGroupProd/Latest ERP Prod/euroasiann-platform"
cd apps/tech-portal
npm run dev
```

Or directly:
```bash
cd "/media/jay/DATA/EuroasiannGroupProd/Latest ERP Prod/euroasiann-platform/apps/tech-portal"
npx vite
```

## 🚀 **Tech Portal Will Start At:**
- **URL**: `http://localhost:4200`
- **Auto-reload**: Enabled
- **Hot Module Replacement**: Enabled

## 📝 **What Was Fixed**

1. **Vite Config**: Simplified to work without Nx plugins (for now)
2. **Vite Version**: Downgraded from v7 to v6.4.1 (compatible with Node.js 18)
3. **Module Format**: Fixed ES module issues

## ⚠️ **Note About Nx**

The simplified config bypasses Nx plugins to avoid ESM/CommonJS conflicts. The tech portal runs directly with Vite.

## 🔄 **If You Need Nx Integration Later**

Once Node.js is upgraded to v20+, you can:
1. Upgrade Vite back to v7
2. Re-enable Nx plugins in `vite.config.ts`

## ✅ **Test It Now**

```bash
cd apps/tech-portal
npm run dev
```

Then open: **http://localhost:4200**







