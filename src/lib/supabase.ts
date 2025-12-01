// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase credentials. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Get current authenticated user ID
 */
export async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Get or create an anonymous persistent user ID (for offline/local use)
 */
export function getAnonymousUserId(): string {
  const key = 'codeguru_anon_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'anon_' + crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

/**
 * Upload a file to Supabase Storage and return public URL
 * Used for attachments in messages (e.g., images, code files)
 */
export async function uploadFile(
  file: File,
  bucket: string = 'attachments', // Default bucket for chat files
  options: { userId?: string; folder?: string } = {}
): Promise<{ publicUrl: string; filePath: string; error?: Error }> {
  try {
    const userId = options.userId || (await getUserId()) || getAnonymousUserId();
    const folder = options.folder || 'chat';
    const filePath = `${folder}/${userId}/${Date.now()}-${file.name}`;

    // Upload to Storage bucket
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { publicUrl: publicUrl ?? '', filePath, error: undefined };
  } catch (err) {
    console.error('Supabase upload error:', err);
    return { publicUrl: '', filePath: '', error: err as Error };
  }
}