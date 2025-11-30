// src/App.tsx — SECURE VERSION (copy-paste exactly)
import React, { useEffect, useState, useRef } from 'react';
import { Loader2, Plus, MessageSquare, Send, Copy } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Navigation } from './components/Navigation';
import { SettingsPage } from './components/SettingsPage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Project { id: string; title: string; created_at: string }
interface Conversation { id: string; project_id: string; title: string; created_at: string }
interface Message { id: string; conversation_id: string; role: 'user' | 'assistant'; content: string; created_at: string }

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentModel, setCurrentModel] = useState('auto');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  // Load saved model preference from localStorage (only the model name, never the key)
  useEffect(() => {
    const saved = localStorage.getItem('xai-coder-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.model) setCurrentModel(parsed.model);
      } catch (e) {
        console.warn('Failed to parse saved settings');
      }
    }
  }, []);

  // Initialize Supabase session (uses anon key from .env – safe)
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
      } else {
        // If no session, redirect to proper sign-in (you can customize this flow later)
        // For now, we just stay unauthenticated – RLS will block writes if needed
        console.warn('No active session – some features may be limited');
      }

      // Load projects for the logged-in user (or public if no user)
      const query = user ? supabase.from('projects').select('*').eq('user_id', user.id) : supabase.from('projects').select('*');
      const { data } = await query.order('created_at', { ascending: false);
      setProjects(data || []);
      setLoading(false);
    }
    init();
  }, [user]);

  // Load conversations when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setConversations([]);
      setSelectedConversationId(null);
      return;
    }
    supabase
      .from('conversations')
      .select('*')
      .eq('project_id', selectedProjectId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setConversations(data || []);
        if (data?.length && !selectedConversationId) setSelectedConversationId(data[0].id);
      });
  }, [selectedProjectId]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }
    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', selectedConversationId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data || []));
  }, [selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createProject = async () => {
    const title = prompt('Project name:', 'New AI Project') || 'New Project';
    if (!title) return;

    const payload: any = { title };
    if (user) payload.user_id = user.id;

    const { data } = await supabase.from('projects').insert(payload).select().single();
    if (data) {
      setProjects(p => [data, ...p]);
      setSelectedProjectId(data.id);
    }
  };

  const createConversation = async () => {
    if (!selectedProjectId) return;
    const { data } = await supabase
      .from('conversations')
      .insert({ project_id: selectedProjectId, title: 'New Chat' })
      .select()
      .single();
    if (data) {
      setConversations(c => [data, ...c]);
      setSelectedConversationId(data.id);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedConversationId || isTyping) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: selectedConversationId,
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    };
    setMessages(m => [...m, userMsg]);
    const text = input;
    setInput('');
    setIsTyping(true);

    // Save user message to Supabase
    await supabase.from('messages').insert({
      conversation_id: selectedConversationId,
      role: 'user',
      content: text,
    });

    try {
      // Use environment variable – never stored in localStorage or source
      const apiKey = import.meta.env.VITE_XAI_API_KEY;
      if (!apiKey) throw new Error('xAI API key not configured. Go to Settings → API Keys.');

      const baseUrl = import.meta.env.VITE_XAI_BASE_URL || 'https://api.x.ai/v1';

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: currentModel === 'auto' ? 'grok-2-latest' : currentModel,
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: text },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`API error ${res.status}: ${err}`);
      }

      const { choices } = await res.json();
      const reply = choices?.[0]?.message?.content?.trim() || 'No response from Grok';

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: selectedConversationId,
        role: 'assistant',
        content: reply,
        created_at: new Date().toISOString(),
      };

      setMessages(m => [...m, assistantMsg]);
      await supabase.from('messages').insert({
        conversation_id: selectedConversationId,
        role: 'assistant',
        content: reply,
      });
    } catch (err: any) {
      const errorMsg = err.message || 'Unknown error';
      setMessages(m => [
        ...m,
        {
          id: crypto.randomUUID(),
          conversation_id: selectedConversationId!,
          role: 'assistant',
          content: `Error: ${errorMsg}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex-center bg-gradient-to-br from-indigo-900 to-purple-900">
        <Loader2 className="w-16 h-16 animate-spin text-white" />
      </div>
    );
  }

  if (showSettings) {
    return (
      <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
        <Navigation
          userName={user?.email?.split('@')[0] || 'Guest'}
          onSettingsClick={() => setShowSettings(false)}
          onLogout={() => supabase.auth.signOut()}
        />
        <div className="flex-1 overflow-y-auto p-8">
          <SettingsPage onClose={() => setShowSettings(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      <Navigation
        userName={user?.email?.split('@')[0] || 'Guest'}
        onSettingsClick={() => setShowSettings(true)}
        onLogout={() => supabase.auth.signOut()}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar – unchanged UI */}
        <aside className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={createProject}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition"
            >
              <Plus size={20} /> New Project
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {projects.map(p => (
              <div key={p.id}>
                <div
                  onClick={() => setSelectedProjectId(selectedProjectId === p.id ? null : p.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${selectedProjectId === p.id
                      ? 'bg-indigo-900 border border-indigo-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                >
                  <h3 className="font-medium">{p.title}</h3>
                </div>
                {selectedProjectId === p.id && (
                  <div className="ml-4 mt-2 space-y-2">
                    {conversations.map(c => (
                      <div
                        key={c.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConversationId(c.id);
                        }}
                        className={`px-4 py-2 rounded cursor-pointer text-sm ${selectedConversationId === c.id ? 'bg-indigo-800' : 'hover:bg-gray-600'}`}
                      >
                        {c.title}
                      </div>
                    ))}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        createConversation();
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 pl-4"
                    >
                      + New Chat
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="border-b border-gray-800 bg-gray-950 px-6 py-4">
                <h1 className="text-2xl font-bold">{selectedConversation.title}</h1>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Messages and markdown rendering unchanged – safe */}
                  {/* ... (same as your original code) */}
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-4xl rounded-2xl px-8 py-5 ${msg.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-800 text-gray-100 border border-gray-700'
                        }`}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ inline, className, children }) {
                              const match = /language-(\w+)/.exec(className || '');
                              const code = String(children).replace(/\n$/, '');
                              if (inline) return <code className="px-2 py-1 bg-gray-700 rounded text-sm">{children}</code>;
                              return (
                                <div className="my-4 bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
                                  <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
                                    <span className="text-xs text-gray-400">{match?.[1]?.toUpperCase() || 'CODE'}</span>
                                    <button onClick={() => navigator.clipboard.writeText(code)} className="p-1 hover:bg-gray-700 rounded">
                                      <Copy size={14} className="text-gray-400" />
                                    </button>
                                  </div>
                                  <SyntaxHighlighter style={vscDarkPlus} language={match?.[1] || 'text'} PreTag="div" customStyle={{ margin: 0, padding: '16px', background: 'transparent' }}>
                                    {code}
                                  </SyntaxHighlighter>
                                </div>
                              );
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-800 rounded-2xl px-8 py-5">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-gray-800 p-6 bg-gray-950">
                  <div className="flex gap-4 max-w-6xl mx-auto">
                    <input
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Ask Grok..."
                      className="flex-1 px-6 py-4 bg-gray-800 border border-gray-700 rounded-2xl focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500 text-lg"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isTyping || !input.trim()}
                      className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 rounded-2xl flex items-center gap-2 font-medium text-lg disabled:cursor-not-allowed"
                    >
                      <Send size={22} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <div className="w-32 h-32 mx-auto mb-8 bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl" />
                <h1 className="text-5xl font-bold mb-4">xAI Coder</h1>
                <p className="text-xl text-gray-400">Create a project to start chatting with Grok</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}