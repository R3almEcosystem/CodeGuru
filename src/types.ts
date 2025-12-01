// src/types.ts
export type Role = 'user' | 'assistant';

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string; // base64 string (without data: prefix)
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