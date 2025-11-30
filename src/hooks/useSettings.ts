// src/hooks/useSettings.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings } from '../types';

interface SettingsState extends Settings {
  isLoading: boolean;
  setSettings: (newSettings: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      baseUrl: 'https://api.x.ai/v1',
      model: 'grok-4',
      logoUrl: '',
      isLoading: true,
      setSettings: (newSettings) =>
        set((state) => ({ ...state, ...newSettings, isLoading: false })),
    }),
    {
      name: 'xai-coder-settings',
      partialize: (state) => ({ apiKey: state.apiKey, baseUrl: state.baseUrl, model: state.model, logoUrl: state.logoUrl }),
    }
  )
);

export function useSettings() {
  const store = useSettingsStore();
  // Simulate initial load
  if (store.isLoading) {
    setTimeout(() => store.setSettings({}), 0); // Immediate resolve for demo
  }
  return store;
}