// src/components/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Key, 
  Globe, 
  Palette, 
  LogOut, 
  User, 
  Trash2, 
  Check,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Settings {
  xaiApiKey: string;
  baseUrl: string;
  model: string;
  theme: 'dark' | 'light' | 'system';
}

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    xaiApiKey: '',
    baseUrl: 'https://api.x.ai/v1',
    model: 'auto',
    theme: 'dark',
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('xai-coder-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('xai-coder-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(settings.xaiApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all local data? This will remove all settings and cached projects.')) {
      localStorage.clear();
      alert('All data cleared! Refreshing...');
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-gray-700 pb-6">
        <h1 className="text-3xl font-bold text-gray-100">Settings</h1>
        <p className="text-gray-400 mt-2">Configure your xAI Coder experience</p>
      </div>

      {/* API Configuration */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Key className="w-6 h-6 text-indigo-400" />
          <h2 className="text-xl font-semibold text-gray-100">xAI API Configuration</h2>
        </div>

        <div className="space-y-5">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={settings.xaiApiKey}
                onChange={(e) => setSettings({ ...settings, xaiApiKey: e.target.value })}
                placeholder="xai-..."
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 transition text-gray-100 placeholder-gray-500"
              />
              <div className="absolute right-3 top-3 flex gap-2">
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition"
                >
                  {showApiKey ? <EyeOff size={18} className="text-gray-400" /> : <Eye size={18} className="text-gray-400" />}
                </button>
                {settings.xaiApiKey && (
                  <button
                    onClick={handleCopyKey}
                    className="p-2 hover:bg-gray-700 rounded-lg transition"
                  >
                    {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-gray-400" />}
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Get your key from{' '}
              <a href="https://console.x.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                console.x.ai
              </a>
            </p>
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Globe className="inline w-4 h-4 mr-1" />
              API Base URL
            </label>
            <input
              type="text"
              value={settings.baseUrl}
              onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 transition text-gray-100"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Default Model
            </label>
            <select
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 transition text-gray-100"
            >
              <option value="auto">Auto (Best Available)</option>
              <optgroup label="Grok 4 (Latest Frontier)">
                <option value="grok-4-1-fast-reasoning">Grok 4.1 Fast (Reasoning) - 2M Context</option>
                <option value="grok-4-1-fast-non-reasoning">Grok 4.1 Fast (Non-Reasoning) - 2M Context</option>
                <option value="grok-4-fast-reasoning">Grok 4 Fast (Reasoning) - 2M Context</option>
                <option value="grok-4-fast-non-reasoning">Grok 4 Fast (Non-Reasoning) - 2M Context</option>
                <option value="grok-4-0709">Grok 4 (July 2025 Release) - 256K Context</option>
              </optgroup>
              <optgroup label="Specialized Models">
                <option value="grok-code-fast-1">Grok Code Fast 1 - Code-Focused (256K Context)</option>
                <option value="grok-2-vision-1212">Grok 2 Vision (Dec 2024) - Image Processing (32K Context)</option>
                <option value="grok-2-image-1212">Grok 2 Image (Dec 2024) - Image Generation</option>
              </optgroup>
              <optgroup label="Grok 3">
                <option value="grok-3">Grok 3 (Latest) - 131K Context</option>
                <option value="grok-3-mini">Grok 3 Mini - Efficient (131K Context)</option>
              </optgroup>
              <optgroup label="Legacy">
                <option value="grok-beta">Grok Beta (Deprecated - Use Grok 4)</option>
              </optgroup>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              "Auto" selects the best available model. Knowledge cutoff: November 2024 for Grok 3/2. Use aliases like "grok-4-latest" for auto-updates.
            </p>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Palette className="w-6 h-6 text-indigo-400" />
          <h2 className="text-xl font-semibold text-gray-100">Appearance</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Theme
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['dark', 'light', 'system'] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => setSettings({ ...settings, theme })}
                className={`px-6 py-3 rounded-lg border-2 transition font-medium capitalize ${
                  settings.theme === theme
                    ? 'border-indigo-500 bg-indigo-900 text-indigo-300'
                    : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                }`}
              >
                {theme === 'system' ? 'System' : theme}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Account & Data */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <User className="w-6 h-6 text-indigo-400" />
          <h2 className="text-xl font-semibold text-gray-100">Account & Data</h2>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-900 hover:bg-red-800 rounded-lg transition font-medium text-white"
          >
            <LogOut size={20} />
            Log Out
          </button>

          <button
            onClick={handleClearData}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 hover:bg-gray-700 border border-red-800 rounded-lg transition font-medium text-red-400"
          >
            <Trash2 size={20} />
            Clear All Local Data
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6">
        <button
          onClick={handleSave}
          className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition font-medium text-white"
        >
          {saved ? (
            <>
              <Check size={20} />
              Settings Saved!
            </>
          ) : (
            <>
              <Save size={20} />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}