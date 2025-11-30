// src/lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseAdmin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
});