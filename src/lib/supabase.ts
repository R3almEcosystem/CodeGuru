// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Please create .env.local with:');
  console.error('VITE_SUPABASE_URL=your-supabase-url');
  console.error('VITE_SUPABASE_ANON_KEY=your-anon-key');
  throw new Error('Supabase configuration is missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Get current authenticated user ID (or null) */
export async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Fallback anonymous ID for unauthenticated users */
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
  bucket = 'chat-attachments',
  folder = 'chat'
): Promise<{ publicUrl: string; path: string; error?: any }> {
  const userId = (await getUserId()) || getAnonymousUserId();
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`;
  const filePath = `${folder}/${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload failed:', error);
    return { publicUrl: '', path: '', error };
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return {
    publicUrl: urlData.publicUrl,
    path: filePath,
    error: undefined,
  };
}

// Debug (dev only)
if (import.meta.env.DEV) {
  console.log('Supabase client initialized:', supabaseUrl);
}