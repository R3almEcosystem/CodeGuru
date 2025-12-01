// src/lib/xai.ts
import { supabase, supabaseUrl } from './supabase';

export type XAIChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type XAIChatCompletion = {
  model?: string;
  messages: XAIChatMessage[];
  temperature?: number;
  stream?: boolean;
};

/**
 * Securely calls xAI API via Supabase Edge Function proxy
 * Uses authenticated user's access token — API key NEVER leaves server
 */
export async function callXAI(
  payload: XAIChatCompletion,
  signal?: AbortSignal
): Promise<Response> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error('You must be signed in to use Grok AI features');
  }

  const proxyUrl = `${supabaseUrl}/functions/v1/proxy-xai`;

  return fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      model: payload.model || 'grok-4',
      messages: payload.messages,
      temperature: payload.temperature ?? 0.7,
      stream: payload.stream ?? true,
    }),
    signal,
  });
}