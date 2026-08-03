import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface SupabaseHealthResult {
  connected: boolean;
  configured: boolean;
  url: string;
  tablesStatus?: {
    ig_settings?: boolean;
    ig_dm_rules?: boolean;
    ig_leads?: boolean;
    ig_messages?: boolean;
  };
  error?: string;
}

export async function checkSupabaseConnection(): Promise<SupabaseHealthResult> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      connected: false,
      configured: false,
      url: supabaseUrl || 'Not configured in env',
      error: 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.',
    };
  }

  try {
    // Attempt a lightweight ping query on the database
    const tables = ['ig_settings', 'ig_dm_rules', 'ig_leads', 'ig_messages'];
    const tablesStatus: Record<string, boolean> = {};

    for (const table of tables) {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      tablesStatus[table] = !error;
    }

    const connected = Object.values(tablesStatus).some((status) => status);

    return {
      connected: true,
      configured: true,
      url: supabaseUrl,
      tablesStatus,
      error: connected ? undefined : 'Connected to Supabase, but required tables (ig_settings, etc.) may not exist yet.',
    };
  } catch (err: any) {
    return {
      connected: false,
      configured: true,
      url: supabaseUrl,
      error: err?.message || 'Failed to connect to Supabase database',
    };
  }
}
