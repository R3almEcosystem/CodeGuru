// src/types.ts
export type Role = 'user' | 'assistant';

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string; // base64 string (without data: prefix)
  url?: string; // Optional public URL from Supabase
}

export interface Message {
  id?: string;
  role: Role;
  content: string;
  timestamp: number;
  attachments?: FileAttachment[];
}

export interface Settings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

// Used by localDb
export type MessageWithId = Message & { id: string };

// New: For streaming
export interface StreamingMessage extends Message {
  streaming?: boolean;
  isComplete?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  project_id?: string;
  user_id?: string; // Added for Supabase filtering
}

export interface Project {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_id?: string; // Added for Supabase
}