import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../hooks/useSettings';
import { callXAI } from '../../lib/xai';
import type { Message, FileAttachment } from '../../types';

interface ChatPanelProps {
  convId: string | null;
  onSendMessage: (message: Message, attachments?: FileAttachment[]) => Promise<void>;
}

export default function ChatPanel({ convId, onSendMessage }: ChatPanelProps) {
  const { apiKey, baseUrl, model } = useSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (convId) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [convId]);

  const loadMessages = async () => {
    if (!convId) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    setMessages((data || []).map((m: any) => ({
      ...m,
      timestamp: new Date(m.created_at).getTime(),
    })));
  };

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !convId || isLoading || !apiKey) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
      attachments: files.length > 0 ? files.map(f => ({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        type: f.type,
      })) : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setFiles([]);
    setIsLoading(true);

    // Save user message
    await onSendMessage(userMessage);

    // Stream assistant response
    const assistantMsg: Message = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const response = await callXAI(
        messages
          .filter(m => !m.content.includes(''))
          .concat(userMessage)
          .map(m => ({ role: m.role, content: m.content })),
        settings.model || 'grok-beta'
      );

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              content += delta;
              setMessages(prev =>
                prev.map(m =>
                  m.timestamp === assistantMsg.timestamp ? { ...m, content } : m
                )
              );
            }
          } catch (e) {
            // Parse error, skip
          }
        }
      }

      // Save assistant message
      await supabase.from('messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content,
      });
    } catch (err) {
      console.error('Failed to stream response:', err);
      setMessages(prev => prev.filter(m => m.timestamp !== assistantMsg.timestamp));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-lg ring-4 ring-white/10">
                G
              </div>
              <h2 className="text-3xl font-bold mb-3">How can I help you today?</h2>
              <p className="text-muted text-base">Ask anything. Attach files. Build something amazing.</p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                    G
                  </div>
                )}
                <div
                  className={`max-w-2xl rounded-lg px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-user text-white'
                      : 'bg-card border border-border text-foreground'
                  }`}
                >
                  <div className="prose prose-invert max-w-none text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                      {msg.attachments?.map((att: FileAttachment) => (
                        <div key={att.id} className="text-xs text-muted">
                          📎 {att.name} ({(att.size / 1024).toFixed(1)}KB)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-user flex-shrink-0" />
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex-shrink-0 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                </div>
                <div className="bg-card border border-border rounded-lg px-4 py-3 flex gap-2">
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-backdrop px-6 py-4">
        <div className="max-w-3xl mx-auto">
          {files.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {files.map((f, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 bg-white/10 border border-border rounded-lg px-3 py-1.5 text-xs"
                >
                  <Paperclip className="w-3 h-3" />
                  <span className="truncate max-w-xs">{f.name}</span>
                  <button
                    onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                    className="ml-1 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={e =>
                setFiles(prev => [...prev, ...Array.from(e.target.files || [])])
              }
              className="hidden"
            />
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Message CodeGuru..."
              disabled={isLoading || !convId}
              className="flex-1 bg-white/5 border border-border rounded-lg px-4 py-2.5 text-sm placeholder-muted/60 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim() || !convId}
              className="p-2.5 bg-gradient-user hover:opacity-90 disabled:opacity-50 rounded-lg transition-all flex-shrink-0"
              title="Send message"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
