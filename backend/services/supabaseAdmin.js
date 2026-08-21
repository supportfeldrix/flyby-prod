import { createClient } from '@supabase/supabase-js';
import config from '../config/index.js';

let supabase = null;

export function getSupabase() {
  if (!supabase) {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      console.warn('[Supabase] Not configured — database operations will be limited');
      return null;
    }
    supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabase;
}
