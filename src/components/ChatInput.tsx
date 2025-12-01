// src/components/ChatInput.tsx
import { Send, Cpu, Paperclip, X, Loader2 } from 'lucide-react';
import { useState, KeyboardEvent, DragEvent } from 'react';
import { FileAttachment } from '../types';
import { uploadFile as supabaseUploadFile } from '../lib/supabase';
import { FolderUploadModal } from './FolderUploadModal';

interface ChatInputProps {
  onSend: (message: string, attachments?: FileAttachment[]) => void;
  disabled: boolean;
  currentModel: string;
  onOpenModelSelector: () => void;
}

export function ChatInput({
  onSend,
  disabled,
  currentModel,
  onOpenModelSelector,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const getModelDisplayName = (model: string) => {
    if (model === 'auto') return 'Auto';
    if (model.startsWith('grok-4')) return 'Grok 4';
    if (model.startsWith('grok-3')) return 'Grok 3';
    if (model.startsWith('grok-2')) return 'Grok 2';
    if (model === 'grok-code-fast-1') return 'Code';
    return model;
  };

  const processFiles = async (files: File[]) => {
    setIsUploading(true);
    const newAttachments: FileAttachment[] = [];

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Max 10MB.`);
        continue;
      }

      if (file.name.startsWith('.') || file.name.startsWith('~')) continue;

      try {
        const { data, error } = await supabaseUploadFile(file);
        if (error) throw error;

        const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/chat-attachments/${data.path}`;
        newAttachments.push({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          content: '', // Not storing base64 anymore
          url: publicUrl,
        });
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    setIsUploading(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    e.target.value = '';
  };

  const handleDirectorySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    e.target.value = '';
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!input.trim() && attachments.length === 0) return;
    onSend(input, attachments);
    setInput('');
    setAttachments([]);
  };

  const handleFolderConfirm = (newAttachments: FileAttachment[]) => {
    setAttachments(prev => [...prev, ...newAttachments]);
    setIsFolderModalOpen(false);
  };

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="border-t border-gray-200 p-4 bg-white">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map(att => (
              <div key={att.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm">
                <Paperclip size={14} className="text-gray-500" />
                <span className="truncate max-w-[150px]">{att.name}</span>
                <button type="button" onClick={() => removeAttachment(att.id)} className="text-gray-400 hover:text-red-500">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div 
          className={`flex items-end gap-3 p-3 border border-gray-300 rounded-lg transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : ''
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <button
            type="button"
            onClick={onOpenModelSelector}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Cpu size={16} />
            {getModelDisplayName(currentModel)}
          </button>

          <div className="flex gap-2">
            <label className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer">
              <Paperclip size={16} />
              <span>File</span>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                disabled={disabled || isUploading}
                className="hidden"
              />
            </label>

            <label className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer">
              <Paperclip size={16} />
              <span>Folder</span>
              <input
                type="file"
                webkitdirectory=""
                directory=""
                multiple
                onChange={handleDirectorySelect}
                disabled={disabled || isUploading}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex gap-3 flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Shift + Enter for new line)"
              disabled={disabled || isUploading}
              rows={1}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              style={{ minHeight: '52px', maxHeight: '200px' }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = '52px';
                t.style.height = `${t.scrollHeight}px`;
              }}
            />

            <button
              type="submit"
              disabled={disabled || isUploading || (!input.trim() && attachments.length === 0)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
            >
              {isUploading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </form>

      <FolderUploadModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onConfirm={handleFolderConfirm}
      />
    </>
  );
}