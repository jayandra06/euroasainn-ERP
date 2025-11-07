# Running Services Guide

## 🚀 Services Started

### Backend API Server
- **Status**: Running in background
- **Port**: `3000`
- **URL**: `http://localhost:3000`
- **Health Check**: `http://localhost:3000/health`
- **API Base**: `http://localhost:3000/api/v1`

### Tech Portal (Frontend)
- **Status**: Running in background
- **Port**: `4200`
- **URL**: `http://localhost:4200`
- **Auto-reload**: Enabled (Vite)

## 📋 Access URLs

### Backend Endpoints
- Health Check: `http://localhost:3000/health`
- Login: `POST http://localhost:3000/api/v1/auth/login`
- Get Current User: `GET http://localhost:3000/api/v1/auth/me`
- Tech Portal API: `http://localhost:3000/api/v1/tech/*`

### Frontend App
- Tech Portal: `http://localhost:4200`

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

## 📊 Check Service Status

### Check if Backend is Running
```bash
curl http://localhost:3000/health
```

### Check if Frontend is Running
```bash
curl http://localhost:4200
```

### Check Running Processes
```bash
ps aux | grep -E "(tsx|vite|nx)" | grep -v grep
```

### Check Port Usage
```bash
lsof -i :3000  # Backend
lsof -i :4200  # Frontend
```

## 🔧 Manual Start Commands

### Start Backend API
```bash
cd apps/api
npm run dev
```

### Start Tech Portal
```bash
cd /path/to/euroasiann-platform
nx serve tech-portal
```

Or from project root:
```bash
nx serve tech-portal
```

## 🛑 Stop Services

### Stop All Background Processes
```bash
# Find processes
ps aux | grep -E "(tsx|vite|nx)" | grep -v grep

# Kill specific process
kill <PID>

# Or kill by port
lsof -ti:3000 | xargs kill  # Backend
lsof -ti:4200 | xargs kill  # Frontend
```

## 📝 Logs

### Backend Logs
Backend logs will appear in the terminal where you started `npm run dev`

### Frontend Logs
Frontend logs will appear in the terminal where you started `nx serve tech-portal`

## ⚠️ Troubleshooting

### Port Already in Use
If port 3000 or 4200 is already in use:
```bash
# Change port in .env (for backend)
PORT=3001

# Or change in vite.config.ts (for frontend)
server: { port: 4201 }
```

### Services Not Starting
1. Check MongoDB connection in `.env`
2. Check Redis connection in `.env`
3. Verify dependencies installed: `npm install`
4. Check if database is seeded: `npm run seed` in `apps/api`

### Cannot Access Frontend
1. Check if frontend is running: `curl http://localhost:4200`
2. Check browser console for errors
3. Verify API URL in frontend config points to `http://localhost:3000`

## 🎯 Next Steps

1. **Open Frontend**: Navigate to `http://localhost:4200`
2. **Test Login**: Use credentials from seed script
3. **Check API**: Test endpoints via Postman/curl
4. **Develop**: Both services auto-reload on file changes

## 📚 Default Credentials

After running `npm run seed`:
- **Tech Admin**: `tech.admin@euroasiann.com` / `TechAdmin123!`
- **Admin Superuser**: `admin.superuser@euroasiann.com` / `Admin123!`

⚠️ **Change passwords after first login!**







