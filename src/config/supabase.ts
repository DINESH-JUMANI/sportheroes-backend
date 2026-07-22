import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';
import { Logger } from '../utils/logger';

let adminClient: SupabaseClient | null = null;

/** Service-role client — never expose this key to the FE. */
export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error('Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  }

  adminClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  Logger.debug('Supabase admin client initialized');
  return adminClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(config.supabase.url && config.supabase.serviceRoleKey);
}
