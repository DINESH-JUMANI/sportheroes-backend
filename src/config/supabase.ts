import { StorageClient } from '@supabase/storage-js';
import { config } from './config';
import { Logger } from '../utils/logger';

let storageClient: StorageClient | null = null;

/**
 * Service-role Storage client — no Realtime/WebSocket (safe on Node 20 / Vercel).
 * Never expose the service role key to the FE.
 */
export function getSupabaseStorage(): StorageClient {
  if (storageClient) return storageClient;

  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error('Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  }

  const baseUrl = config.supabase.url.replace(/\/$/, '');
  const key = config.supabase.serviceRoleKey;

  storageClient = new StorageClient(`${baseUrl}/storage/v1`, {
    apikey: key,
    Authorization: `Bearer ${key}`,
  });

  Logger.debug('Supabase storage client initialized');
  return storageClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(config.supabase.url && config.supabase.serviceRoleKey);
}
