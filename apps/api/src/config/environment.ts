import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

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

if (envPath) {
  dotenv.config({ path: envPath });
} else {
  // Fallback: try default locations without checking existence
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/euroasiann',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
};
