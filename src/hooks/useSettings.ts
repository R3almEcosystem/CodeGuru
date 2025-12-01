// src/hooks/useSettings.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Settings } from '../types';

interface SettingsState extends Settings {
  isLoading: boolean;
  setSettings: (updates: Partial<Settings>) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  baseUrl: 'https://api.x.ai/v1',
  model: 'grok-4',
  logoUrl: '',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      isLoading: false, // We resolve instantly — persist handles loading
      setSettings: (updates) =>
        set((state) => ({
          ...state,
          ...updates,
          // Only override known fields
          ...(updates.apiKey !== undefined && { apiKey: updates.apiKey }),
          ...(updates.baseUrl !== undefined && { baseUrl: updates.baseUrl }),
          ...(updates.model !== undefined && { model: updates.model }),
          ...(updates.logoUrl !== undefined && { logoUrl: updates.logoUrl }),
        })),
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'xai-coder-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        apiKey: state.apiKey,
        baseUrl: state.baseUrl,
        model: state.model,
        logoUrl: state.logoUrl,
      }),
      // Optional: migrate old data if schema changes
      version: 1,
    }
  )
);

// Simple hook — no fake loading delays
export const useSettings = () => {
  return useSettingsStore();
};