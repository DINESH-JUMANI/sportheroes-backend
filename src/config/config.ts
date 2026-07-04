import dotenv from 'dotenv';
import { Logger } from '../utils/logger';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function optionalEnvInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid integer`);
  }
  return parsed;
}

/**
 * Central application configuration.
 * All runtime constants are read from environment variables here.
 */
export const config = {
  env: optionalEnv('NODE_ENV', 'development'),
  port: optionalEnvInt('PORT', 3000),
  /** error | warn | info | http | debug */
  logLevel: optionalEnv('LOG_LEVEL', 'debug'),

  database: {
    url: process.env.DATABASE_URL ?? '',
  },

  auth: {
    /** App JWT signing secret */
    jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
    /** Access token lifetime in days (default: 7) */
    tokenExpiryDays: optionalEnvInt('AUTH_TOKEN_EXPIRY_DAYS', 7),
    /** JWT issuer claim */
    jwtIssuer: optionalEnv('JWT_ISSUER', 'sportheroes-api'),
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
    /**
     * Private key may contain escaped newlines when stored in .env.
     * Normalize them so firebase-admin can parse the PEM.
     */
    privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
  },

  swagger: {
    enabled: optionalEnv('SWAGGER_ENABLED', 'true') === 'true',
  },
} as const;

/** Validates critical config at startup (fails fast in production). */
export function assertConfig(): void {
  if (!config.database.url) {
    Logger.warn('DATABASE_URL is not set');
  }

  if (config.env === 'production') {
    requireEnv('JWT_SECRET');
    requireEnv('DATABASE_URL');
    requireEnv('FIREBASE_PROJECT_ID');
    requireEnv('FIREBASE_CLIENT_EMAIL');
    requireEnv('FIREBASE_PRIVATE_KEY');
  }

  if (!config.firebase.projectId || !config.firebase.clientEmail || !config.firebase.privateKey) {
    Logger.warn(
      'Firebase credentials are incomplete. Phone auth verification will fail until they are set.',
    );
  }

  Logger.debug('Config loaded', {
    env: config.env,
    port: config.port,
    logLevel: config.logLevel,
    swaggerEnabled: config.swagger.enabled,
    authTokenExpiryDays: config.auth.tokenExpiryDays,
  });
}
