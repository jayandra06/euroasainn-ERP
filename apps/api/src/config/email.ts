import nodemailer from 'nodemailer';
import { logger } from './logger';

const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtppro.zoho.in',
  port: parseInt(process.env.EMAIL_PORT || '465', 10),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'technical@euroasianngroup.com',
    pass: process.env.EMAIL_PASS || '',
  },
};

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

