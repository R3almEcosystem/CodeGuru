// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  throw new Error('Supabase configuration is missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

if (import.meta.env.DEV) {
  console.log('Supabase client initialized:', supabaseUrl);
}