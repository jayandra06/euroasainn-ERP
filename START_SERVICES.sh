#!/bin/bash

# Euroasiann ERP Platform - Start Services Script

echo "🚀 Starting Euroasiann ERP Platform Services..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found. Using defaults.${NC}"
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠️  Port $1 is already in use${NC}"
        return 1
    fi
    return 0
}

# Check ports
echo "🔍 Checking ports..."
check_port 3000
check_port 4200
echo ""

# Start Backend API
echo -e "${BLUE}📡 Starting Backend API Server...${NC}"
cd apps/api

# Check if database is seeded
if [ ! -f ".seed_done" ]; then
    echo -e "${YELLOW}🌱 Database not seeded. Running seed script...${NC}"
    npm run seed
    touch .seed_done
    echo ""
fi

# Start backend in background
echo -e "${GREEN}✅ Starting backend on http://localhost:3000${NC}"
npm run dev &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ../..

# Wait for backend to start
sleep 5

# Test backend
echo "🧪 Testing backend health..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running!${NC}"
else
    echo -e "${YELLOW}⏳ Backend is starting...${NC}"
fi
echo ""

# Start Frontend (Tech Portal)
echo -e "${BLUE}🌐 Starting Tech Portal Frontend...${NC}"
echo -e "${GREEN}✅ Starting frontend on http://localhost:4200${NC}"
nx serve tech-portal &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
echo ""

# Wait for frontend to start
sleep 5

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Services Started Successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📊 Service Status:"
echo "  🔹 Backend API:    http://localhost:3000"
echo "  🔹 Health Check:   http://localhost:3000/health"
echo "  🔹 Tech Portal:    http://localhost:4200"
echo ""
echo "📝 To stop services, press Ctrl+C or run:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📚 Default Credentials:"
echo "   Tech Admin: tech.admin@euroasiann.com / TechAdmin123!"
echo ""
echo -e "${BLUE}🎉 Happy coding!${NC}"







