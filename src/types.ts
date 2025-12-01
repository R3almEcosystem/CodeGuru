export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string;
  url?: string;
}

export interface Message {
  id?: string;
  conversation_id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: FileAttachment[];
}

export interface Settings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  project_id?: string;
}

export interface Project {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}