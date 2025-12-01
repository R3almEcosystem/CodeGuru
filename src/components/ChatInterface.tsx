// src/components/ChatInterface.tsx
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message, FileAttachment } from '../types';
import { supabase, insertMessage, uploadFile } from '../lib/supabase';
import { useSettings } from '../hooks/useSettings';

interface ChatInterfaceProps {
  convId: string | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ convId }) => {
  const { apiKey, model } = useSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (convId) loadMessages();
  }, [convId]);

  const loadMessages = async () => {
    if (!convId) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('timestamp', { ascending: true });

    if (error) console.error('Load messages error:', error);
    else setMessages(data || []);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !convId || !settings.apiKey) return;

    setIsLoading(true);
    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    const attachments: FileAttachment[] = [];
    for (const file of selectedFiles) {
      const result = await uploadFile(file);
      if (result.data) {
        attachments.push({
          id: crypto.randomUUID(),
          name: result.data.name,
          size: result.data.size,
          type: result.data.type,
          url: result.data.publicUrl,
        });
      }
    }
    if (attachments.length > 0) userMessage.attachments = attachments;

    setMessages(prev => [...prev, userMessage]);
    await insertMessage(convId, userMessage);
    setInput('');
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const assistantMsg: Message = { role: 'assistant', content: '', timestamp: Date.now() };
    setMessages(prev => [...prev, assistantMsg]);

    await streamResponse([...messages, userMessage], assistantMsg, convId);
    setIsLoading(false);
  };

  const streamResponse = async (history: Message[], assistantMsg: Message, convId: string) => {
    try {
      const res = await fetch(`${settings.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model || 'grok-beta',
          messages: [
            { role: 'system', content: 'You are Grok, a helpful AI built by xAI.' },
            ...history.map(m => ({ role: m.role, content: m.content }))
          ],
          stream: true,
          temperature: 0.7,
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices[0]?.delta?.content || '';
              if (content) {
                assistantMsg.content += content;
                setMessages(prev => {
                  const copy = [...prev];
                  copy[copy.length - 1] = { ...assistantMsg };
                  return copy;
                });
              }
            } catch {}
          }
        }
      }

      if (assistantMsg.content) {
        await insertMessage(convId, assistantMsg);
      }
    } catch (err) {
      console.error('Stream error:', err);
      assistantMsg.content = 'Sorry, I encountered an error. Please try again.';
      setMessages(prev => [...prev]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const CodeBlock = ({ language, value }: { language?: string; value: string }) => {
    return (
      <div className="relative my-4 -mx-4">
        <button
          onClick={() => navigator.clipboard.writeText(value)}
          className="absolute top-3 right-3 z-10 bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-1 rounded"
        >
          Copy
        </button>
        <SyntaxHighlighter language={language || 'text'} style={vscDarkPlus} customStyle={{ margin: 0, borderRadius: 8 }}>
          {value}
        </SyntaxHighlighter>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto px-4 py-8 max-w-5xl mx-auto w-full">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-muted mt-20">
            <h2 className="text-2xl font-light mb-2">How can I help you today?</h2>
            <p className="text-sm">Start a conversation with Grok</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex my-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl px-6 py-4 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-gradient-user text-white'
                  : 'bg-card border border-border text-foreground'
              }`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: ({ node, inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
                    ) : (
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {msg.content}
              </ReactMarkdown>

              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.attachments.map(att => (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm underline"
                    >
                      📎 {att.name} ({(att.size / 1024).toFixed(1)} KB)
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start my-6">
            <div className="bg-card border border-border px-6 py-4 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border bg-card px-4 py-6">
        <div className="max-w-5xl mx-auto">
          {selectedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedFiles.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-white/10 text-foreground px-3 py-1 rounded-full text-sm">
                  📎 {f.name}
                  <button onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))} className="ml-1">×</button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 hover:bg-white/10 rounded-lg transition"
            >
              <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => e.target.files && setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)])}
              className="hidden"
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Message Grok..."
              className="flex-1 px-5 py-3 border border-border rounded-lg bg-white/5 text-foreground placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-3 bg-gradient-user text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};