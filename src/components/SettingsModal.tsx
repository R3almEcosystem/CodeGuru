// src/components/SettingsModal.tsx
import { useState } from 'react';
import { X, Key, Globe, Bot, Trash2, Check, AlertCircle } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { supabase } from '../lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { apiKey, baseUrl, model, logoUrl, setSettings, resetSettings } = useSettings();
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localBaseUrl, setLocalBaseUrl] = useState(baseUrl);
  const [localModel, setLocalModel] = useState(model);
  const [localLogoUrl, setLocalLogoUrl] = useState(logoUrl);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      setSettings({
        apiKey: localApiKey.trim(),
        baseUrl: localBaseUrl.trim().replace(/\/+$/, ''), // remove trailing slashes
        model: localModel,
        logoUrl: localLogoUrl.trim(),
      });

      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        onClose();
      }, 1200);
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('⚠️ This will delete ALL your projects, conversations, and settings permanently.\n\nAre you sure?')) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Delete all user data from Supabase
        await supabase.from('messages').delete().eq('user_id', user.id);
        await supabase.from('conversations').delete().eq('user_id', user.id);
        await supabase.from('projects').delete().eq('user_id', user.id);
      }

      // Clear local state
      resetSettings();
      localStorage.clear();
      sessionStorage.clear();

      alert('All data cleared successfully. Reloading...');
      window.location.href = '/';
    } catch (err) {
      console.error('Failed to clear data:', err);
      alert('Failed to clear some data. Check console.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Bot className="w-8 h-8 text-blue-600" />
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* API Key */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Key size={18} />
              xAI API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                placeholder="sk-ant-..."
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Get your key at{' '}
              <a
                href="https://console.x.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                console.x.ai
              </a>
            </p>
          </div>

          {/* Base URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Globe size={18} />
              API Base URL
            </label>
            <input
              type="url"
              value={localBaseUrl}
              onChange={(e) => setLocalBaseUrl(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="https://api.x.ai/v1"
            />
            <p className="text-xs text-gray-500 mt-1">Default: https://api.x.ai/v1</p>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Default Model
            </label>
            <select
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="grok-4">Grok 4 (Latest)</option>
              <option value="grok-4-fast-reasoning">Grok 4 Fast (Reasoning)</option>
              <option value="grok-4-fast-non-reasoning">Grok 4 Fast</option>
              <option value="grok-code-fast-1">Grok Code Fast</option>
              <option value="grok-3">Grok 3</option>
              <option value="auto">Auto (Best Available)</option>
            </select>
          </div>

          {/* Logo URL (Optional Branding) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Custom Logo URL (Optional)
            </label>
            <input
              type="url"
              value={localLogoUrl}
              onChange={(e) => setLocalLogoUrl(e.target.value)}
              placeholder="https://yoursite.com/logo.png"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">Replaces the "G" logo in header</p>
          </div>

          {/* Danger Zone */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
              <AlertCircle size={20} />
              Danger Zone
            </h3>
            <button
              onClick={handleClearAllData}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              Delete All Data (Projects, Chats, Settings)
            </button>
          </div>

          {/* Save Status */}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg">
              <Check size={20} />
              Settings saved successfully!
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
              <AlertCircle size={20} />
              Failed to save settings.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Check size={18} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}