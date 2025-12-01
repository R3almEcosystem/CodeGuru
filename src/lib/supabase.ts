// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase credentials. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/** Get current authenticated user ID */
export async function getUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

/** Fallback persistent anonymous ID (used when not logged in) */
export function getAnonymousUserId(): string {
  const key = 'codeguru_anon_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = 'anon_' + crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}