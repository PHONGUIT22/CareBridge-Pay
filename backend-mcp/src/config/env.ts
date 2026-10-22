import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve potential .env paths across the monorepo hierarchy
const rootEnvPath = path.resolve(__dirname, '../../../.env');
const backendEnvPath = path.resolve(__dirname, '../../.env');
const cwdEnvPath = path.resolve(process.cwd(), '.env');

// 1. Load from monorepo root (.env)
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

// 2. Load or override from backend-mcp/.env
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath, override: true });
}

// 3. Fallback to current working execution directory
if (fs.existsSync(cwdEnvPath)) {
  dotenv.config({ path: cwdEnvPath, override: true });
}

const paypalEnv = (process.env.PAYPAL_ENVIRONMENT || 'sandbox').trim().toLowerCase();
const isLivePayPal = paypalEnv === 'live' || paypalEnv === 'production';

export const envConfig = {
  // AWS Configuration
  AWS_REGION: process.env.AWS_REGION || 'ap-southeast-2',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN || '',
  BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID || 'au.anthropic.claude-haiku-4-5-20251001-v1:0',

  // Network & Ports
  MCP_PORT: Number(process.env.MCP_PORT || process.env.PORT) || 3001,
  NEXT_PUBLIC_MCP_URL: process.env.NEXT_PUBLIC_MCP_URL || 'http://localhost:3001',

  // PayPal Developer Platform Configurations (AI Hackathon 2026)
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || '',
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || '',
  PAYPAL_ENVIRONMENT: isLivePayPal ? 'live' : 'sandbox',
  PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID || '',
  PAYPAL_BASE_URL: isLivePayPal
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com',

  // Check if live or sandbox credentials are ready
  hasPayPalCredentials: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
};
