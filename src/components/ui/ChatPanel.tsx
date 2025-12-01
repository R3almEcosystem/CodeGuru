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
  onCreateConversation?: () => Promise<void>;
}

export default function ChatPanel({ convId, onSendMessage, onCreateConversation }: ChatPanelProps) {
  const { apiKey, model } = useSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (convId) {
      loadMessages();
    } else {
      setMessages([]);
      setInput('');
      setFiles([]);
    }
  }, [convId]);

  const loadMessages = async () => {
    if (!convId) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      } else {
        setMessages(
          (data || []).map((m: any) => ({
            ...m,
            timestamp: new Date(m.created_at).getTime(),
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setMessages([]);
    }
  };

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSendMessage = async () => {
    console.log('handleSendMessage called', { input: input.trim(), convId, isLoading });
    
    if (!input.trim() || !convId || isLoading) {
      console.warn('Send blocked:', { 
        emptyInput: !input.trim(), 
        noConvId: !convId, 
        isLoading 
      });
      return;
    }

    console.log('Sending message...');
    const userContent = input.trim();
    const userFiles = [...files];
    
    // Clear input immediately for better UX
    setInput('');
    setFiles([]);
    setIsLoading(true);

    try {
      // Prepare user message with attachments
      const userMessage: Message = {
        role: 'user',
        content: userContent,
        timestamp: Date.now(),
        attachments: userFiles.length > 0
          ? userFiles.map(f => ({
              id: crypto.randomUUID(),
              name: f.name,
              size: f.size,
              type: f.type,
            }))
          : undefined,
      };

      console.log('User message prepared:', userMessage);

      // Add to local state
      setMessages(prev => [...prev, userMessage]);

      // Save user message to DB
      console.log('Calling onSendMessage...');
      await onSendMessage(userMessage);
      console.log('Message saved to DB');

      // Stream assistant response
      console.log('Starting assistant response stream...');
      await streamAssistantResponse(userMessage);
      console.log('Assistant response complete');
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert('Failed to send message: ' + errorMsg);
      setInput(userContent); // Restore input on error
      setFiles(userFiles);
    } finally {
      setIsLoading(false);
    }
  };

  const streamAssistantResponse = async (userMessage: Message) => {
    if (!convId || !model) {
      console.error('Missing convId or model:', { convId, model });
      return;
    }

    console.log('streamAssistantResponse starting with model:', model);

    // Add placeholder for streaming message
    const assistantMsg: Message = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, assistantMsg]);
    setStreamingContent('');

    try {
      // Prepare messages for API call
      const apiMessages = messages
        .concat(userMessage)
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      console.log('Calling xAI with messages:', apiMessages);

      // Call xAI API with streaming (via Supabase edge function)
      const response = await callXAI(apiMessages, model);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${errorText}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      // Stream the response
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullContent += delta;
              setStreamingContent(fullContent);
            }
          } catch (e) {
            console.debug('Parse error for line:', line);
            // Ignore parse errors
          }
        }
      }

      console.log('Stream complete, full content:', fullContent);

      // Save final message to DB
      if (fullContent) {
        await supabase.from('messages').insert({
          conversation_id: convId,
          role: 'assistant',
          content: fullContent,
        });

        // Update messages state with final content
        setMessages(prev =>
          prev.map(m =>
            m.timestamp === assistantMsg.timestamp
              ? { ...m, content: fullContent }
              : m
          )
        );
      }
    } catch (err) {
      console.error('Streaming error:', err);
      // Remove the failed message
      setMessages(prev => prev.filter(m => m.timestamp !== assistantMsg.timestamp));
    } finally {
      setStreamingContent('');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {!convId ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-lg ring-4 ring-white/10">
                G
              </div>
              <h2 className="text-3xl font-bold mb-3">Start Chatting</h2>
              <p className="text-muted text-base mb-6">Select a conversation from the sidebar or create a new one</p>
              <button
                onClick={onCreateConversation}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                + New Conversation
              </button>
            </div>
          </div>
        ) : messages.length === 0 && streamingContent === '' ? (
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

            {/* Streaming message */}
            {streamingContent && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                  G
                </div>
                <div className="max-w-2xl rounded-lg px-4 py-3 bg-card border border-border text-foreground">
                  <div className="prose prose-invert max-w-none text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamingContent}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {isLoading && !streamingContent && (
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
      <div className="border-t border-border bg-backdrop px-3 py-3 sm:px-6 sm:py-4 min-h-fit">
        <div className="max-w-3xl mx-auto">
          {files.length > 0 && (
            <div className="mb-2 sm:mb-3 flex flex-wrap gap-2">
              {files.map((f, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 bg-white/10 border border-border rounded-lg px-2 sm:px-3 py-1.5 text-xs"
                >
                  <Paperclip className="w-3 h-3" />
                  <span className="truncate max-w-xs">{f.name}</span>
                  <button
                    onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                    className="ml-1 hover:text-red-400 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || !convId}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title="Attach file"
            >
              <Paperclip className="w-4 sm:w-5 h-4 sm:h-5" />
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
              className="flex-1 bg-white/5 border border-border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm placeholder-muted/60 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim() || !convId}
              className="p-2 sm:p-2.5 bg-gradient-user hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all flex-shrink-0"
              title="Send message"
            >
              <Send className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
