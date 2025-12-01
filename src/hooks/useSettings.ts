// src/hooks/useSettings.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SettingsState {
  apiKey: string
  baseUrl: string
  model: string
  logoUrl: string
  setSettings: (updates: Partial<SettingsState>) => void
  reset: () => void
}

const DEFAULTS = {
  apiKey: import.meta.env.VITE_XAI_API_KEY || '',
  baseUrl: import.meta.env.VITE_XAI_BASE_URL || 'https://api.x.ai/v1',
  model: 'grok-4',
  logoUrl: '',
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setSettings: (updates) => set(updates),
      reset: () => set(DEFAULTS),
    }),
    {
      name: 'codeguru-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
)