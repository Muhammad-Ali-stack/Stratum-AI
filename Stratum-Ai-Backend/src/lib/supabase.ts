import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config, isSupabaseConfigured } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';

function createSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    return null as unknown as SupabaseClient;
  }
  return createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function createSupabaseAnon(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    return null as unknown as SupabaseClient;
  }
  return createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const supabaseAdmin = createSupabaseAdmin();
export const supabaseAnon = createSupabaseAnon();

export function requireSupabase(): void {
  if (!isSupabaseConfigured()) {
    throw new AppError(
      503,
      'Database not configured. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your environment.',
    );
  }
}
