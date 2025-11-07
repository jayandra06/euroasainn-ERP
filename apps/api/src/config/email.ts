import nodemailer from 'nodemailer';
import { logger } from './logger';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../../.env');
const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
  logger.warn(`Failed to load .env from ${envPath}: ${envResult.error.message}`);
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
transporter.verify((error, success) => {
  if (error) {
    logger.error('Email transporter verification failed:', error);
  } else {
    logger.info('Email transporter is ready to send emails');
  }
});

export default transporter;


