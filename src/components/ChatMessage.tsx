// src/components/ChatMessage.tsx
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Download, FileText, Image, FileCode, File } from 'lucide-react';
import { StreamingMessage } from '@/types';

// Inline cn utility — replaces "@/lib/utils" entirely
const cn = (...inputs: (string | undefined | null | false)[]) => {
  return inputs.filter(Boolean).join(' ');
};

interface ChatMessageProps {
  message: StreamingMessage;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const isUser = message.role === 'user';
  const hasContent = message.content.trim().length > 0;
  const hasAttachments = message.attachments && message.attachments.length > 0;

  const copyToClipboard = async (text: string, codeId?: string) => {
    await navigator.clipboard.writeText(text);
    if (codeId) setCopiedCode(codeId);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5" />;
    if (type.includes('json') || type.includes('javascript') || type.includes('typescript') || type.includes('python'))
      return <FileCode className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  return (
    <div
      className={cn(
        "flex gap-4 px-6 py-5 transition-all",
        isUser ? "bg-muted/30" : "bg-background",
        message.streaming && "animate-pulse"
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
            isUser
              ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
              : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
          )}
        >
          {isUser ? 'U' : 'G'}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Role Header */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">
            {isUser ? 'You' : 'Grok'}
          </span>
          {message.streaming && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              typing...
            </span>
          )}
        </div>

        {/* File Attachments */}
        {hasAttachments && (
          <div className="flex flex-wrap gap-3">
            {message.attachments!.map((file, i) => (
              <a
                key={i}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-all"
              >
                <div className="p-2 rounded bg-muted/50 text-muted-foreground group-hover:text-foreground transition-colors">
                  {getFileIcon(file.type)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        )}

        {/* Message Content with Markdown */}
        {hasContent && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  const codeId = `${message.timestamp}-${match?.[1] || 'text'}`;

                  return !inline && match ? (
                    <div className="relative group my-4">
                      <button
                        onClick={() => copyToClipboard(codeString, codeId)}
                        className={cn(
                          "absolute right-3 top-3 p-2 rounded-lg transition-all z-10",
                          "bg-background/80 backdrop-blur-sm border",
                          "hover:bg-accent hover:border-accent-foreground",
                          copiedCode === codeId && "bg-emerald-500/20 border-emerald-500"
                        )}
                      >
                        {copiedCode === codeId ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <SyntaxHighlighter
                        {...props}
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                        }}
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code
                      className={cn(
                        "px-1.5 py-0.5 rounded-md text-sm font-mono",
                        "bg-muted text-muted-foreground",
                        className
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="ml-4">{children}</li>,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-muted-foreground/50 pl-4 italic my-4">
                    {children}
                  </blockquote>
                ),
                h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-3">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-bold mt-4 mb-2">{children}</h3>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Streaming cursor */}
        {message.streaming && (
          <span className="inline-block w-2 h-5 bg-foreground align-middle animate-pulse ml-1" />
        )}
      </div>
    </div>
  );
};

export default ChatMessage;