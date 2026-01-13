import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/environment';
import authRoutes from './routes/auth.routes';
import techPortalRoutes from './routes/tech-portal.routes';
import adminPortalRoutes from './routes/admin-portal.routes';
import customerPortalRoutes from './routes/customer-portal.routes';
import vendorPortalRoutes from './routes/vendor-portal.routes';
import roleRoutes from './routes/role.routes';
import assignRoleRoutes from './routes/assign-role.routes';
import permissionRoutes from './routes/permission.routes';

import onboardingRoutes from './routes/onboarding.routes';
import adminOnboardingRoutes from './routes/admin-onboarding.routes';
import jiraRoutes from './routes/jira.routes';
// import paymentRoutes from './routes/payment.routes';

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files (e.g. /uploads/employee-onboarding/xxx.png)
// This MUST be BEFORE API routes and 404 handler to serve files directly
// This prevents React Router from intercepting /uploads/* paths
const uploadsDir = path.resolve(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`✅ Created uploads directory: ${uploadsDir}`);
}

// Serve static files from /uploads path
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    // Set appropriate content-type headers for images and PDFs
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (filePath.match(/\.(jpg|jpeg)$/i)) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.match(/\.png$/i)) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.match(/\.gif$/i)) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (filePath.match(/\.webp$/i)) {
      res.setHeader('Content-Type', 'image/webp');
    }
    // Allow CORS for static files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  },
}));

console.log(`✅ Static file serving enabled for: ${uploadsDir}`);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use(`${config.apiPrefix}/auth`, authRoutes);
app.use(`${config.apiPrefix}/tech`, techPortalRoutes);
app.use(`${config.apiPrefix}/admin`, adminPortalRoutes);
app.use(`${config.apiPrefix}/admin`, adminOnboardingRoutes);
app.use(`${config.apiPrefix}/customer`, customerPortalRoutes);
app.use(`${config.apiPrefix}/vendor`, vendorPortalRoutes);
app.use(`${config.apiPrefix}/roles`, roleRoutes);
app.use(`${config.apiPrefix}/assign-role`, assignRoleRoutes);
app.use(`${config.apiPrefix}/permissions`, permissionRoutes);

// Public onboarding routes (no auth required)
app.use(`${config.apiPrefix}/onboarding`, onboardingRoutes);
// Jira integration routes
app.use(`${config.apiPrefix}/jira`, jiraRoutes);
// Payment routes
// app.use(`${config.apiPrefix}/payments`, paymentRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

export default app;
