// src/components/ChatInput.tsx
import { Send, Cpu, Paperclip, X, Loader2, Folder, Upload } from 'lucide-react';
import { useState, KeyboardEvent, DragEvent, useRef } from 'react';
import { FileAttachment } from '../types';
import { uploadFile as supabaseUploadFile } from '../lib/supabase';

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
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const getModelDisplayName = (model: string) => {
    if (model === 'auto') return 'Auto';
    if (model.startsWith('grok-4')) return 'Grok 4';
    if (model.startsWith('grok-3')) return 'Grok 3';
    if (model.startsWith('grok-2')) return 'Grok 2';
    if (model === 'grok-code-fast-1') return 'Code';
    return model;
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    const newAttachments: FileAttachment[] = [];

    for (const file of files) {
      // Skip hidden/system files
      if (file.name.startsWith('.') || file.name.startsWith('~')) continue;
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 10MB limit and was skipped.`);
        continue;
      }

      try {
        const { data, error } = await supabaseUploadFile(file);
        if (error) throw error;

        const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/chat-attachments/${data.path}`;

        newAttachments.push({
          id: crypto.randomUUID(),
          name: file.webkitRelativePath || file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          content: '',
          url: publicUrl,
        });
      } catch (err) {
        console.error('Upload failed for:', file.name, err);
      }
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    setIsUploading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    e.target.value = '';
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    e.target.value = '';
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      processFiles(files);
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

    onSend(input.trim(), attachments.length > 0 ? attachments : undefined);
    setInput('');
    setAttachments([]);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="border-t border-gray-200 bg-white"
    >
      {/* Attachment Pills */}
      {attachments.length > 0 && (
        <div className="px-4 pt-3 pb-2 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
            >
              {att.name.includes('/') ? <Folder size={14} /> : <Paperclip size={14} />}
              <span className="truncate max-w-[180px]">{att.name.split('/').pop()}</span>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div
        className={`mx-4 mb-4 p-4 border-2 border-dashed rounded-xl transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex items-end gap-3">
          {/* Model Selector */}
          <button
            type="button"
            onClick={onOpenModelSelector}
            disabled={disabled}
            className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Cpu size={16} />
            {getModelDisplayName(currentModel)}
          </button>

          {/* Upload Buttons */}
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <div className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
                <Paperclip size={16} />
                File
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                disabled={disabled || isUploading}
                className="hidden"
              />
            </label>

            <label className="cursor-pointer">
              <div className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
                <Folder size={16} />
                Folder
              </div>
              <input
                ref={folderInputRef}
                type="file"
                webkitdirectory=""
                directory=""
                multiple
                onChange={handleFolderSelect}
                disabled={disabled || isUploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Text Input + Send */}
          <div className="flex-1 flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Grok anything... (supports files & folders via drag/drop too)"
              disabled={disabled || isUploading}
              rows={1}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none disabled:bg-gray-100 transition-all"
              style={{ minHeight: '56px', maxHeight: '200px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = '56px';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />

            <button
              type="submit"
              disabled={disabled || isUploading || (!input.trim() && attachments.length === 0)}
              className="mb-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 font-medium transition-colors"
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

        {/* Drag & Drop Hint */}
        {dragActive && (
          <div className="mt-4 text-center text-blue-600 font-medium">
            <Upload size={32} className="mx-auto mb-2" />
            Drop files or folders here to attach
          </div>
        )}
      </div>
    </form>
  );
}