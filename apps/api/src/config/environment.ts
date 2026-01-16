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

dotenv.config({
  path: envPath || path.resolve(__dirname, '../../../.env'),
});

// ⭐ FIXED CORS ORIGIN HANDLER
const allowedOrigins = [
  'http://localhost:4100',
  'http://localhost:4200',
  'http://localhost:4300',
  'http://localhost:4400',
  process.env.FRONTEND_URL, // optional for production
].filter(Boolean); // remove undefined

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb+srv://jay:jay123@cluster0.hwu6k94.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',

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
    origin: function (origin, callback) {
      // Allow no-origin requests (Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ CORS Blocked:", origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },

  jira: {
    domain: process.env.JIRA_DOMAIN || '',
    email: process.env.JIRA_EMAIL || '',
    apiToken: process.env.JIRA_API_TOKEN || '',
  },
};
