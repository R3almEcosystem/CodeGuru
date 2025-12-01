// src/components/ChatMessage.tsx
import { useState } from 'react';
import { Bot, User, Paperclip, Download, FileText, AlertCircle, Copy, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { StreamingMessage, FileAttachment } from '../types';

interface ChatMessageProps {
  message: StreamingMessage;
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
    try {
      if (attachment.content) {
        const text = atob(attachment.content);
        setPreviewText(text.slice(0, 500) + (text.length > 500 ? '...' : ''));
      } else if (attachment.url) {
        const response = await fetch(attachment.url);
        const text = await response.text();
        setPreviewText(text.slice(0, 500) + (text.length > 500 ? '...' : ''));
      }
    } catch (err) {
      setPreviewError(true);
    }
  };

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Paperclip size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{attachment.name}</span>
        </div>
        <button
          onClick={downloadFile}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
        >
          <Download size={12} />
          {formatFileSize(attachment.size)}
        </button>
      </div>
      {attachment.type.startsWith('text/') && (
        <div className="bg-white p-2 border border-gray-300 rounded text-xs font-mono overflow-auto max-h-32">
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <div className="relative my-2">
                  <button
                    onClick={() => copyToClipboard(String(children))}
                    className="absolute top-2 right-2 p-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-600"
                    aria-label="Copy code"
                  >
                    <Copy size={14} />
                  </button>
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2 mt-2">
            {message.attachments.map((attachment) => (
              <AttachmentPreview key={attachment.id} attachment={attachment} />
            ))}
          </div>
        )}

        {message.streaming && (
          <div className="flex items-center gap-1 mt-2 text-gray-500">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-xs">Generating...</span>
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