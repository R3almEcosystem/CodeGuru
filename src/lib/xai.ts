// src/lib/xai.ts
import { supabase } from './supabase';

export async function callXAI(messages: any[], model: string = 'grok-beta') {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('https://gsljjtirhyzmbzzucufu.supabase.co/functions/v1/proxy-xai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`, // ← THIS WAS MISSING
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`xAI API error: ${response.status} ${text}`);
  }

  return response;
}