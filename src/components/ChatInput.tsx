// src/components/ChatInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Folder, Send, Cpu } from 'lucide-react';
import { uploadFile } from '../lib/supabase';
import type { FileAttachment } from '../types';

interface ChatInputProps {
  onSend: (content: string, attachments?: FileAttachment[]) => Promise<void>;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSend(message.trim(), attachments.length > 0 ? attachments : undefined);
      setMessage('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const uploaded: FileAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await uploadFile(file);
        if (result.data) {
          uploaded.push({
            name: file.name,
            url: result.data.publicUrl,
            type: file.type || 'application/octet-stream',
            size: file.size,
          });
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }

    if (uploaded.length > 0) {
      setAttachments(prev => [...prev, ...uploaded]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 bg-white"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mx-4 mb-3 flex flex-wrap gap-2">
          {attachments.map((att, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm"
            >
              <Paperclip className="w-4 h-4" />
              <span className="max-w-xs truncate">{att.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="ml-1 hover:text-blue-900"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mx-4 mb-4 p-4 border-2 border-dashed rounded-xl transition-all border-gray-300 bg-gray-50 hover:border-gray-400">
        <div className="flex items-end gap-3">
          {/* Model Selector (Grok 4) */}
          <button
            type="button"
            disabled
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm"
          >
            <Cpu className="w-4 h-4" />
            Grok 4
          </button>

          {/* File & Folder Buttons */}
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <div className="px-4 py-2.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-sm">
                <Paperclip className="w-4 h-4" />
                File
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </label>

            <label className="cursor-pointer">
              <div className="px-4 py-2.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-sm">
                <Folder className="w-4 h-4" />
                Folder
              </div>
              <input
                ref={folderInputRef}
                type="file"
                // @ts-ignore - webkitdirectory is widely supported
                webkitdirectory=""
                directory=""
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </label>
          </div>

          {/* Message Input + Send */}
          <div className="flex-1 flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask Grok anything... (supports files & folders via drag/drop too)"
              rows={1}
              disabled={disabled || isSending}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none disabled:bg-gray-100 transition-all"
              style={{ minHeight: '56px', maxHeight: '200px' }}
            />

            <button
              type="submit"
              disabled={!message.trim() || isSending || disabled}
              className="mb-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 font-medium transition-all shadow-md disabled:shadow-none"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}