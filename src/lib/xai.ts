// src/lib/xai.ts
const XAI_API_KEY = import.meta.env.VITE_XAI_API_KEY
const XAI_BASE_URL = import.meta.env.VITE_XAI_BASE_URL || 'https://api.x.ai/v1'

if (!XAI_API_KEY) {
  console.warn('VITE_XAI_API_KEY is missing – AI features will be disabled')
}

export type XAIChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type XAIChatCompletion = {
  model?: string
  messages: XAIChatMessage[]
  temperature?: number
  stream?: boolean
}

export async function callXAI(
  payload: XAIChatCompletion,
  signal?: AbortSignal
): Promise<Response> {
  if (!XAI_API_KEY) {
    throw new Error('xAI API key not configured')
  }

  return fetch(`${XAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: payload.model || 'grok-4',
      messages: payload.messages,
      temperature: payload.temperature ?? 0.7,
      stream: payload.stream ?? false,
    }),
    signal,
  })
}