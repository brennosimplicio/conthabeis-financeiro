import { createClient } from '@supabase/supabase-js';

let supabase = null;

export function getDb() {
  if (supabase) return supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL and Key must be provided in environment variables.');
  }

  supabase = createClient(supabaseUrl || '', supabaseKey || '');
  return supabase;
}
