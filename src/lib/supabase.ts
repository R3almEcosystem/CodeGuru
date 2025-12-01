// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Get current user ID */
export async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Anonymous fallback ID */
export function getAnonymousUserId(): string {
  const key = 'codeguru_anon_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'anon_' + crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

/** Upload file to Supabase Storage */
export async function uploadFile(
  file: File,
  bucket = 'attachments',
  folder = 'chat'
): Promise<{ publicUrl: string; path: string; error?: any }> {
  const userId = (await getUserId()) || getAnonymousUserId();
  const filePath = `${folder}/${userId}/${Date.now()}-${file.name.replace(/\s/g, '_')}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { upsert: false });

  if (error) return { publicUrl: '', path: '', error };

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return { publicUrl: publicUrl || '', path: filePath, error: undefined };
}