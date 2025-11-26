import nodemailer from 'nodemailer';
import { logger } from './logger';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Load environment variables from root .env file
// Note: environment.ts already loads .env, but we try here as well for scripts that use email directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple locations for .env file
const possiblePaths = [
  path.resolve(__dirname, '../../../.env'), // Root of workspace
  path.resolve(__dirname, '../../../../.env'), // Alternative root path
  path.resolve(__dirname, '../../.env'), // apps/.env
  path.resolve(process.cwd(), '.env'), // Current working directory
];

let envPath: string | undefined;
for (const possiblePath of possiblePaths) {
  if (existsSync(possiblePath)) {
    envPath = possiblePath;
    break;
  }
}

if (!envPath) {
  // Fallback to default
  envPath = path.resolve(__dirname, '../../../.env');
}

const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
  // Only warn if file doesn't exist (ENOENT), not if it's already loaded
  if (envResult.error.message.includes('ENOENT')) {
    logger.warn(`Failed to load .env from ${envPath}: ${envResult.error.message}`);
  }
} else {
  logger.info(`✅ Loaded .env from: ${envPath}`);
  logger.info(`   EMAIL_PASS is ${process.env.EMAIL_PASS ? 'SET' : 'NOT SET'}`);
}

const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtppro.zoho.in',
  port: parseInt(process.env.EMAIL_PORT || '465', 10),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'technical@euroasianngroup.com',
    pass: process.env.EMAIL_PASS || '',
  },
};

// Log email config (without password for security)
logger.info('Email config:', {
  service: 'euroasiann-api',
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  user: emailConfig.auth.user,
  pass: emailConfig.auth.pass ? '***SET***' : 'NOT SET',
});

// Create reusable transporter
export const transporter = nodemailer.createTransport(emailConfig);

// Verify connection configuration
transporter.verify((error, _success) => {
  if (error) {
    logger.error('Email transporter verification failed:', error);
  } else {
    logger.info('Email transporter is ready to send emails');
  }
});

export default transporter;


