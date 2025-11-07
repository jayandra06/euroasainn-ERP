# How to Start Backend and Tech Portal

## 🚀 Quick Start (Recommended)

### Option 1: Using Start Script
```bash
cd "/media/jay/DATA/EuroasiannGroupProd/Latest ERP Prod/euroasiann-platform"
./START_SERVICES.sh
```

### Option 2: Manual Start (Two Terminals)

#### Terminal 1 - Backend API
```bash
cd "/media/jay/DATA/EuroasiannGroupProd/Latest ERP Prod/euroasiann-platform/apps/api"
npm run dev
```

#### Terminal 2 - Tech Portal Frontend
```bash
cd "/media/jay/DATA/EuroasiannGroupProd/Latest ERP Prod/euroasiann-platform"
nx serve tech-portal
```

## 📋 Step-by-Step Instructions

### Step 1: Seed Database (First Time Only)
```bash
cd apps/api
npm run seed
```

This creates:
- Admin organization
- Tech admin user
- Admin superuser
- Sample customer/vendor organizations with licenses

### Step 2: Start Backend API

Open a new terminal:
```bash
cd "/media/jay/DATA/EuroasiannGroupProd/Latest ERP Prod/euroasiann-platform/apps/api"
npm run dev
```

You should see:
```
🚀 Server running on port 3000
📝 API available at http://localhost:3000/api/v1
🏥 Health check: http://localhost:3000/health
✅ MongoDB connected successfully
✅ Redis connected successfully
✅ CASBIN enforcer initialized
```

### Step 3: Start Tech Portal Frontend

Open another terminal:
```bash
cd "/media/jay/DATA/EuroasiannGroupProd/Latest ERP Prod/euroasiann-platform"
nx serve tech-portal
```

You should see:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:4200/
➜  Network: use --host to expose
```

## 🌐 Access URLs

### Backend API
- **Base URL**: `http://localhost:3000`
- **Health Check**: `http://localhost:3000/health`
- **API Base**: `http://localhost:3000/api/v1`
- **Login**: `POST http://localhost:3000/api/v1/auth/login`

### Frontend (Tech Portal)
- **URL**: `http://localhost:4200`
- **Auto-reload**: Enabled (Vite)

## 🧪 Test Backend

### Health Check
```bash
curl http://localhost:3000/health
```

### Login Test
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tech.admin@euroasiann.com",
    "password": "TechAdmin123!",
    "portalType": "tech"
  }'
```

## 🔍 Verify Services Are Running

### Check Backend
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"...","uptime":...}
```

### Check Frontend
Open browser: `http://localhost:4200`

### Check Processes
```bash
ps aux | grep -E "(tsx|vite)" | grep -v grep
```

## 🛑 Stop Services

### Stop Backend
Press `Ctrl+C` in the backend terminal

### Stop Frontend
Press `Ctrl+C` in the frontend terminal

### Stop All Background Processes
```bash
# Find processes
ps aux | grep -E "(tsx|vite|nx)" | grep -v grep

# Kill by PID
kill <PID>

# Or kill by port
lsof -ti:3000 | xargs kill  # Backend
lsof -ti:4200 | xargs kill  # Frontend
```

## ⚠️ Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000  # Backend
lsof -i :4200  # Frontend

# Kill the process
kill <PID>
```

### Backend Won't Start
1. Check MongoDB connection in `.env`
2. Check Redis connection in `.env`
3. Verify dependencies: `npm install`
4. Check if database seeded: Run `npm run seed`

### Frontend Won't Start
1. Check if Nx is installed: `nx --version`
2. Install dependencies: `npm install`
3. Check if backend is running (frontend needs API)

### Database Not Seeded
```bash
cd apps/api
npm run seed
```

### MongoDB Connection Error
- Verify `MONGODB_URI` in `.env`
- Check MongoDB Atlas network access
- Ensure cluster is running

### Redis Connection Error
- Verify Redis credentials in `.env`
- Check Redis instance is accessible

## 📝 Logs

### Backend Logs
- Logs appear in the terminal where you ran `npm run dev`
- Look for connection status (MongoDB, Redis, CASBIN)
- API requests will be logged

### Frontend Logs
- Logs appear in the terminal where you ran `nx serve tech-portal`
- Vite logs compilation status
- Browser console shows runtime errors

## 🎯 Next Steps

1. **Open Tech Portal**: Navigate to `http://localhost:4200`
2. **Login**: Use `tech.admin@euroasiann.com` / `TechAdmin123!`
3. **Test Features**: Explore the portal functionality
4. **Develop**: Both services auto-reload on file changes

## 🔐 Default Credentials

After running `npm run seed`:
- **Tech Admin**: `tech.admin@euroasiann.com` / `TechAdmin123!`
- **Admin Superuser**: `admin.superuser@euroasiann.com` / `Admin123!`

⚠️ **Change passwords after first login!**







