# Blank Screen Debugging Guide

## Quick Fix Steps

### 1. Check Browser Console
Open DevTools (F12) and check:
- **Console Tab**: Look for red error messages
- **Network Tab**: Check for failed requests (red entries)
- **Elements Tab**: Check if `<div id="root">` has content

### 2. Verify Backend is Running
The frontend needs the backend API:
```bash
cd euroasiann-platform/apps/api
npm run dev
```
Backend should be running on `http://localhost:3000`

### 3. Clear Browser Cache
- Press `Ctrl+Shift+R` (Linux/Windows) or `Cmd+Shift+R` (Mac) to hard refresh
- Or clear browser cache manually

### 4. Check Vite Dev Server
Make sure Vite is running and showing:
```
VITE v6.4.1  ready in XXX ms
➜  Local:   http://localhost:XXXX/
```

### 5. Test Basic Rendering
To test if React is working, temporarily rename `main.tsx` to `main-backup.tsx` and use `main-debug.tsx`:

```bash
cd euroasiann-platform/apps/tech-portal/src
mv main.tsx main-backup.tsx
mv main-debug.tsx main.tsx
```

Then refresh the browser. If you see "React is rendering correctly!", React is working and the issue is in the app code.

### 6. Common Errors

#### "Cannot find module '@euroasiann/api-client'"
**Solution**: Run `npm install` from project root:
```bash
cd euroasiann-platform
npm install
```

#### "Failed to fetch /api/v1/auth/me"
**Solution**: Backend is not running. Start it:
```bash
cd euroasiann-platform/apps/api
npm run dev
```

#### CORS Error
**Solution**: Check backend `app.ts` has CORS enabled for your frontend URL.

#### White Blank Screen (No Errors)
**Possible causes**:
1. React app crashed silently - Check ErrorBoundary
2. AuthContext stuck in loading state - Check Network tab
3. Router not matching routes - Check URL in browser

### 7. Check These Files

1. **Browser Console**: Open F12 and check for errors
2. **Network Tab**: Check if API calls are failing
3. **Elements Tab**: Check if `<div id="root">` exists and has content
4. **Vite Terminal**: Check for compilation errors

### 8. Manual Debug Steps

1. **Stop Vite**: Press `Ctrl+C` in the terminal
2. **Clear node_modules cache** (if needed):
   ```bash
   cd euroasiann-platform/apps/tech-portal
   rm -rf node_modules package-lock.json
   cd ../..
   npm install
   ```
3. **Restart Vite**:
   ```bash
   cd euroasiann-platform/apps/tech-portal
   npm run dev
   ```
4. **Hard refresh browser**: `Ctrl+Shift+R`

### 9. Check ErrorBoundary
The ErrorBoundary should catch React errors and display them. If you see an error message instead of blank screen, that's the issue.

### 10. Verify Dependencies
Make sure these are in `apps/tech-portal/package.json`:
- `react` and `react-dom`
- `@euroasiann/api-client`
- `@tanstack/react-query`
- `react-router-dom`
- `axios`

## Still Not Working?

1. Share the **browser console errors** (F12 → Console tab)
2. Share the **Vite terminal output**
3. Share the **Network tab** showing API calls
4. Check if **backend is accessible** at `http://localhost:3000/health`







