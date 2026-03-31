import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  import.meta.env.EXPO_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const dbUrlOnly = import.meta.env.SUPABASE_DB_URL || import.meta.env.VITE_SUPABASE_DB_URL;

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseConfig && dbUrlOnly) {
  console.warn(
    'Supabase web client is not configured. SUPABASE_DB_URL is server-side only. Set one of: (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY) or (SUPABASE_URL + SUPABASE_ANON_KEY).'
  );
}

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  : null;

export { hasSupabaseConfig };