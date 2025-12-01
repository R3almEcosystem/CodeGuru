// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Message } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// === Validation ===
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Please create .env file with:');
  console.error('VITE_SUPABASE_URL=your-url');
  console.error('VITE_SUPABASE_ANON_KEY=your-key');
  throw new Error('Supabase configuration is missing');
}

// === Client ===
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// === Get Current User ID — throws if not authenticated ===
export const getUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user?.id) {
    console.warn('No authenticated user found:', error);
    throw new Error('User not authenticated. Please sign in.');
  }

  return data.user.id;
};

// === Optional: Get user safely (returns null if not logged in) ===
export const getUserSafe = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
};

// === File Upload Utility ===
export const uploadFile = async (file: File) => {
  const userId = await getUserId();
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('chat-attachments')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload failed:', error);
    return { data: null, error };
  }

  const { data: urlData } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(filePath);

  return {
    data: {
      path: filePath,
      publicUrl: urlData.publicUrl,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
    },
    error: null,
  };
};

// === Insert Message into DB ===
export const insertMessage = async (convId: string, message: Message) => {
  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: convId,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      attachments: message.attachments,
    });

  if (error) {
    console.error('Insert message failed:', error);
    throw error;
  }
};

// === Default Export (for backward compatibility) ===
export default supabase;

// === Debug (dev only) ===
if (import.meta.env.DEV) {
  console.log('Supabase client initialized:', supabaseUrl);
}