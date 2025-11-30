// src/components/ChatMessage.tsx
import { useState } from 'react';
import { Bot, User, Paperclip, Download, FileText, AlertCircle } from 'lucide-react';
import { Message, FileAttachment } from '../types';

interface ChatMessageProps {
  message: Message;
}

function AttachmentPreview({ attachment }: { attachment: FileAttachment }) {
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadFile = () => {
    if (attachment.url) {
      const a = document.createElement('a');
      a.href = attachment.url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (attachment.content) {
      try {
        const byteCharacters = atob(attachment.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: attachment.type });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading file:', error);
        alert('Failed to download file');
      }
    } else {
      alert('No file data available for download.');
    }
  };

  const loadPreviewText = async () => {
    if (previewText !== null) return; // Already loaded

    try {
      let textContent = '';
      if (attachment.url) {
        const response = await fetch(attachment.url);
        if (!response.ok) throw new Error('Failed to fetch file');
        textContent = await response.text();
      } else if (attachment.content) {
        textContent = atob(attachment.content);
      }

      setPreviewText(textContent.substring(0, 300) + (textContent.length > 300 ? '...' : ''));
    } catch (err) {
      setPreviewError(true);
    }
  };

  const isImage = attachment.type.startsWith('image/');
  const isText = attachment.type.startsWith('text/') || attachment.name.endsWith('.txt') || attachment.name.endsWith('.md');

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
            {attachment.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {formatFileSize(attachment.size)}
          </span>
          <button
            onClick={downloadFile}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Download file"
          >
            <Download size={16} className="text-gray-600" />
          </button>
        </div>
      </div>

      {isImage && (
        <img
          src={attachment.url || `data:${attachment.type};base64,${attachment.content}`}
          alt={attachment.name}
          className="max-w-full h-auto rounded-lg border border-gray-200"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      
      {isText && (
        <div className="mt-2 p-2 bg-black/20 rounded text-xs font-mono overflow-auto max-h-32">
          {previewText === null ? (
            <div className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer" onClick={loadPreviewText}>
              <span>Click to preview content</span>
              <FileText size={12} />
            </div>
          ) : previewError ? (
            <div className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle size={12} />
              Failed to load preview
            </div>
          ) : (
            <pre className="whitespace-pre-wrap">
              {previewText}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <Bot size={18} className="text-white" />
        </div>
      )}

      <div
        className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2">
            {message.attachments.map((attachment) => (
              <AttachmentPreview key={attachment.id} attachment={attachment} />
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
          <User size={18} className="text-white" />
        </div>
      )}
    </div>
  );
}