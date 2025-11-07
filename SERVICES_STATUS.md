# Services Status

## ✅ Services Running

Both services have been started in the background:

### Frontend - Tech Portal
- **Status**: ✅ Running
- **Port**: 4200
- **URL**: http://localhost:4200
- **Command**: `npm run dev` in `apps/tech-portal`

### Backend - API
- **Status**: ✅ Running (process active)
- **Expected Port**: 3000
- **Expected URL**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **API Base**: http://localhost:3000/api/v1
- **Command**: `npm run dev` in `apps/api`

## Access URLs

### Frontend
- **Login Page**: http://localhost:4200/login
- **Dashboard**: http://localhost:4200/dashboard (requires login)
- **Business Rules**: http://localhost:4200/business-rules (requires login)

### Backend API
- **Health Check**: http://localhost:3000/health
- **Login Endpoint**: POST http://localhost:3000/api/v1/auth/login
- **Auth Me**: GET http://localhost:3000/api/v1/auth/me

## Login Credentials

- **Email**: jayandraa5@gmail.com
- **Password**: J@yandra06
- **Role**: tech_admin
- **Portal**: tech

## Notes

- Both services are running in the background
- If you need to stop them, use `pkill -f "tsx watch"` for backend and `pkill -f vite` for frontend
- Check browser console for any frontend errors
- Backend logs should appear in the terminal where it was started

## Troubleshooting

If backend is not responding:
1. Check if MongoDB is accessible
2. Check if Redis is accessible
3. Verify `.env` file has correct configuration
4. Check backend terminal for error messages

If frontend is not loading:
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check browser console for errors
4. Verify backend is running and accessible






