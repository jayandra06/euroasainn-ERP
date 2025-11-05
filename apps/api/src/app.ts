import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/environment';
import authRoutes from './routes/auth.routes';
import techPortalRoutes from './routes/tech-portal.routes';
import adminPortalRoutes from './routes/admin-portal.routes';
import customerPortalRoutes from './routes/customer-portal.routes';
import vendorPortalRoutes from './routes/vendor-portal.routes';
import businessRuleRoutes from './routes/business-rule.routes';
import onboardingRoutes from './routes/onboarding.routes';
import adminOnboardingRoutes from './routes/admin-onboarding.routes';

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
app.use(`${config.apiPrefix}/business-rules`, businessRuleRoutes);
// Public onboarding routes (no auth required)
app.use(`${config.apiPrefix}/onboarding`, onboardingRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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
