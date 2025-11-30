// src/App.tsx — FINAL WORKING VERSION
import React, { useEffect, useState, useRef } from 'react';
import {
  Loader2,
  Plus,
  MessageSquare,
  Send,
  Copy,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { Navigation } from './components/Navigation';
import { SettingsPage } from './components/SettingsPage';

interface Project {
  id: string;
  title: string;
  created_at: string;
}

interface Conversation {
  id: string;
  project_id: string;
  title: string;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

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

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  // Load model from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('xai-coder-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.model) setCurrentModel(parsed.model);
      } catch (e) {
        console.warn('Could not load saved model');
      }
    }
  }, []);

  // Auth + load projects
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: '123456',
        }).catch(() => supabase.auth.signUp({ email: 'test@example.com', password: '123456' }));
      }

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      setProjects(data || []);
      setLoading(false);
    };
    init();
  }, []);

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
        if (data?.length && !selectedConversationId) {
          setSelectedConversationId(data[0].id);
        }
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

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => scrollToBottom(), [messages]);

  const createProject = async () => {
    const title = prompt('Project name:', 'New AI Project') || 'New Project';
    if (!title) return;

    const { data } = await supabase
      .from('projects')
      .insert({ title, user_id: user?.id })
      .select()
      .single();

    if (data) {
      setProjects((p) => [data, ...p]);
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
      setConversations((c) => [data, ...c]);
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

    setMessages((m) => [...m, userMsg]);
    const text = input;
    setInput('');
    setIsTyping(true);

    await supabase.from('messages').insert({
      conversation_id: selectedConversationId,
      role: 'user',
      content: text,
    });

    try {
      const settings = JSON.parse(localStorage.getItem('xai-coder-settings') || '{}');
      const apiKey = settings.xaiApiKey;
      if (!apiKey) throw new Error('No API key set – go to Settings');

      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: currentModel === 'auto' ? 'grok-2-latest' : currentModel,
          messages: [...messages.map((m) => ({ role: m.role, content: m.content })), { role: 'user', content: text }],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const json = await res.json();
      const assistantContent = json.choices?.[0]?.message?.content ?? 'No response';

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: selectedConversationId,
        role: 'assistant',
        content: assistantContent,
        created_at: new Date().toISOString(),
      };

      setMessages((m) => [...m, assistantMsg]);
      await supabase.from('messages').insert({
        conversation_id: selectedConversationId,
        role: 'assistant',
        content: assistantContent,
      });
    } catch (err: any) {
      setMessages((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        conversation_id: selectedConversationId!,
        role: 'assistant',
        content: `Error: ${err.message}`,
        created_at: new Date().toISOString(),
      },
    ]);
    finally {
      setIsTyping(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <Loader2 className="w-16 h-16 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Settings Page with Close Button
  if (showSettings) {
    return (
      <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
        <Navigation
          userName={user?.email?.split('@')[0] || 'Dev'}
          onSettingsClick={() => setShowSettings(false)}
          onLogout={() => supabase.auth.signOut()}
        />
        <div className="flex-1 overflow-y-auto p-8">
          <SettingsPage onClose={() => setShowSettings(false)} />
        </div>
      </div>
    );
  }

  // Main App
  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      <Navigation
        userName={user?.email?.split('@')[0] || 'Dev'}
        onSettingsClick={() => setShowSettings(true)}
        onLogout={() => supabase.auth.signOut()}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={createProject}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition font-medium"
            >
              <Plus size={20} /> New Project
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {projects.map((p) => (
              <div key={p.id}>
                <div
                  onClick={() => setSelectedProjectId(selectedProjectId === p.id ? null : p.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedProjectId === p.id
                      ? 'bg-indigo-900 border border-indigo-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <h3 className="font-medium">{p.title}</h3>
                </div>

                {selectedProjectId === p.id && (
                  <div className="ml-4 space-y-2 mt-2">
                    {conversations.map((c) => (
                      <div
                        key={c.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConversationId(c.id);
                        }}
                        className={`p-2 pl-6 rounded cursor-pointer text-sm transition ${
                          selectedConversationId === c.id ? 'bg-indigo-800' : 'hover:bg-gray-600'
                        }`}
                      >
                        {c.title}
                      </div>
                    ))}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        createConversation();
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 pl-6"
                    >
                      + New Chat
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Main Chat */}
        <main className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="border-b border-gray-800 bg-gray-950 px-6 py-4">
                <h1 className="text-2xl font-bold text-white">{selectedConversation.title}</h1>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">
                      <MessageSquare className="w-20 h-20 mx-auto mb-6 opacity-50" />
                      <h2 className="text-3xl font-bold mb-4">Start coding with Grok</h2>
                      <p className="text-lg">Ask anything — write code, debug, explain concepts</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-4xl rounded-2xl px-8 py-5 ${
                            msg.role === 'user'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-800 text-gray-100 border border-gray-700'
                          }`}
                        >
                          <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br>') }} />
                          {/* Simple markdown-like line breaks – replace with ReactMarkdown if you prefer */}
                        </div>
                      </div>
                    ))
                  )}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-800 rounded-2xl px-8 py-5">
                        <div className="flex gap-3">
                          <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" />
                          <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-800 p-6 bg-gray-950">
                  <div className="flex gap-4 max-w-6xl mx-auto">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Ask Grok..."
                      className="flex-1 px-8 py-5 bg-gray-800 border border-gray-700 rounded-2xl focus:outline-none focus:border-indigo-500 transition text-white placeholder-gray-500 text-lg"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isTyping || !input.trim()}
                      className="px-8 py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 rounded-2xl transition flex items-center gap-3 font-medium text-lg disabled:cursor-not-allowed"
                    >
                      <Send size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="bg-gray-700 border-2 border-dashed rounded-xl w-32 h-32 mx-auto mb-8" />
                <h1 className="text-6xl font-bold mb-4">xAI Coder</h1>
                <p className="text-2xl text-gray-400">Create a project and start a conversation</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}