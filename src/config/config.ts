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
    /** App JWT signing secret (our API tokens — not the Supabase JWT) */
    jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
    /** Access token lifetime in days (default: 7) */
    tokenExpiryDays: optionalEnvInt('AUTH_TOKEN_EXPIRY_DAYS', 7),
    /** JWT issuer claim */
    jwtIssuer: optionalEnv('JWT_ISSUER', 'sportheroes-api'),
  },

  supabase: {
    url: process.env.SUPABASE_URL ?? '',
    /** Service role key — server only */
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    /** Anon/publishable key — documented for FE; optional on server */
    anonKey: process.env.SUPABASE_ANON_KEY ?? '',
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
    requireEnv('SUPABASE_URL');
    requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  }

  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    Logger.warn(
      'Supabase Storage credentials are incomplete. Image uploads will fail until SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are set.',
    );
  }

  Logger.debug('Config loaded', {
    env: config.env,
    port: config.port,
    logLevel: config.logLevel,
    swaggerEnabled: config.swagger.enabled,
    authTokenExpiryDays: config.auth.tokenExpiryDays,
    supabaseConfigured: Boolean(config.supabase.url && config.supabase.serviceRoleKey),
  });
}
