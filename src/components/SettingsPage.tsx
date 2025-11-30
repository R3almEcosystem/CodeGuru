// src/components/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { X, Upload, Copy, Check, Loader2 } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { supabase } from '../lib/supabase';

interface SettingsPageProps {
  onClose: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
  const { settings, updateSettings } = useSettings();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (settings?.logoUrl) setLogoPreview(settings.logoUrl);
  }, [settings?.logoUrl]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      alert('Please select a valid image under 5MB');
      return;
    }
    setLogoFile(file);
    setUploadSuccess(false);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadLogo = async () => {
    if (!logoFile) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', logoFile);

    try {
      const res = await fetch(
        'https://vrcxtkstyeutxwhllnws.supabase.co/functions/v1/upload-logo',
        {
          method: 'POST',
          body: formData,
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');

      await updateSettings({ logoUrl: json.publicUrl });
      setLogoPreview(json.publicUrl);
      setUploadSuccess(true);
      alert('Logo uploaded successfully!');
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const saveApiKey = async () => {
    if (apiKey.trim()) {
      await updateSettings({ apiKey: apiKey.trim() });
      setApiKey('');
      alert('API key saved');
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(settings?.apiKey || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative h-full flex flex-col">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg z-10">
        <X size={24} />
      </button>

      <div className="max-w-4xl mx-auto p-8 flex-1 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 mb-10">Manage your xAI Coder workspace</p>

        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border p-6">
            <h2 className="text-xl font-semibold mb-6">Branding</h2>
            <div className="flex items-start gap-8">
              <img src={logoPreview || '/vite.svg'} alt="Logo" className="w-32 h-32 rounded-xl object-contain border-2 border-dashed border-gray-300 p-2" />
              <div className="flex-1">
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded-lg file:bg-indigo-600 file:text-white" />
                <p className="text-sm text-gray-500 mt-2">Max 5MB • PNG, JPG, SVG</p>
                {logoFile && (
                  <div className="mt-4 flex items-center gap-3">
                    <button onClick={uploadLogo} disabled={isUploading} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                      {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload Logo</>}
                    </button>
                    {uploadSuccess && <span className="text-green-600 flex items-center gap-2"><Check className="w-5 h-5" /> Uploaded!</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border p-6">
            <h2 className="text-xl font-semibold mb-6">xAI API Key</h2>
            {settings?.apiKey ? (
              <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-sm">
                <code>{settings.apiKey.slice(0, 12)}••••••••{settings.apiKey.slice(-8)}</code>
                <button onClick={copyKey}>{copied ? <Check className="text-green-600" /> : <Copy size={18} />}</button>
              </div>
            ) : <p className="text-gray-500 italic mb-4">No API key configured</p>}

            <div className="flex gap-3 mt-4">
              <input type="password" placeholder="sk-ant-..." value={apiKey} onChange={e => setApiKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveApiKey()} className="flex-1 px-4 py-3 border rounded-lg" />
              <button onClick={saveApiKey} disabled={!apiKey.trim()} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Save Key</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

SettingsPage.displayName = 'SettingsPage';