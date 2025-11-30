// src/App.tsx — FINAL VERSION (Safe to push, no API keys)
import React, { useEffect, useState, useRef } from 'react';
import { 
  Loader2, 
  Plus, 
  MessageSquare, 
  Send, 
  Copy,
  ChevronDown
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { Navigation } from './components/Navigation';
import { SettingsPage } from './components/SettingsPage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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

type ActiveTab = 'chat' | 'code';

const modelOptions = [
  { value: 'auto', label: 'Auto (Best)', icon: 'AI' },
  { value: 'grok-4-1-fast-reasoning', label: 'Grok 4.1 Fast (Reasoning)', icon: 'Brain' },
  { value: 'grok-code-fast-1', label: 'Grok Code Fast', icon: 'Code' },
  { value: 'grok-beta', label: 'Grok Beta', icon: 'Beta' },
];

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [conversations, setConversations[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentModel, setCurrentModel] = useState('auto');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  // Load saved model from localStorage
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

  // Auto-login & load projects
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Development auto-login (remove in production or secure properly)
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
        if (data && data.length > 0 && !selectedConversationId) {
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

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createProject = async () => {
    const title = prompt('Project name:', 'New AI Project') || 'New Project';
    if (!title) return;

    const { data } = await supabase
      .from('projects')
      .insert({ title, user_id: user?.id })
      .select()
      .single();

    if (data) {
      setProjects(p => [data, ...p]);
      setSelectedProjectId(data.id);
      setConversations([]);
      setSelectedConversationId(null);
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

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: selectedConversationId,
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    const tempInput = input;
    setInput('');
    setIsTyping(true);

    // Save user message to DB
    await supabase.from('messages').insert({
      conversation_id: selectedConversationId,
      role: 'user',
      content: tempInput,
    });

    try {
      const savedSettings = JSON.parse(localStorage.getItem('xai-coder-settings') || '{}');
      const apiKey = savedSettings.xaiApiKey;

      if (!apiKey) throw new Error('No API key found. Go to Settings to add your xAI API key.');

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: currentModel === 'auto' ? 'grok-2-latest' : currentModel,
          messages: messages.map(m => ({ role: m.role, content: m.content })).concat({
            role: 'user',
            content: tempInput,
          }),
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const assistantContent = data.choices?.[0]?.message?.content || 'No response from Grok.';

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: selectedConversationId,
        role: 'assistant',
        content: assistantContent,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      await supabase.from('messages').insert({
        conversation_id: selectedConversationId,
        role: 'assistant',
        content: assistantContent,
      });
    } catch (error: any) {
      console.error('Send error:', error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        conversation_id: selectedConversationId,
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to reach Grok'}`,
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <Loader2 className="w-16 h-16 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Settings Page
  if (showSettings) {
    return (
      <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
        <Navigation
          userName={user?.email?.split('@')[0] || 'Dev'}
          onSettingsClick={() => setShowSettings(false)}
          onLogout={() => supabase.auth.signOut()}
        />
        <div className="flex-1 overflow-y-auto p-8">
          <SettingsPage />
        </div>
      </div>
    );
  }

  // Main App Layout
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
            {projects.map(p => (
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
                    {conversations.map(c => (
                      <div
                        key={c.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConversationId(c.id);
                        }}
                        className={`p-2 pl-6 rounded cursor-pointer text-sm transition ${
                          selectedConversationId === c.id
                            ? 'bg-indigo-800'
                            : 'hover:bg-gray-600'
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

        {/* Main Chat Area */}
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
                    messages.map(msg => (
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
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({ inline, className, children }) {
                                const match = /language-(\w+)/.exec(className || '');
                                const codeString = String(children).replace(/\n$/, '');
                                if (inline) {
                                  return <code className="px-2 py-1 bg-gray-700 rounded text-sm">{children}</code>;
                                }
                                return (
                                  <div className="relative mt-6 bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
                                    <div className="flex items-center justify-between px-5 py-3 bg-gray-800 border-b border-gray-700">
                                      <span className="text-sm text-gray-400 font-medium">
                                        {match?.[1]?.toUpperCase() || 'CODE'}
                                      </span>
                                      <button
                                        onClick={() => navigator.clipboard.writeText(codeString)}
                                        className="p-2 hover:bg-gray-700 rounded transition"
                                      >
                                        <Copy size={16} className="text-gray-400" />
                                      </button>
                                    </div>
                                    <div className="overflow-auto max-h-96">
                                      <SyntaxHighlighter
                                        style={vscDarkPlus}
                                        language={match?.[1] || 'text'}
                                        PreTag="div"
                                        customStyle={{ margin: 0, padding: '20px', background: 'transparent', fontSize: '15px' }}
                                      >
                                        {codeString}
                                      </SyntaxHighlighter>
                                    </div>
                                  </div>
                                );
                              },
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
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

                {/* Input Area */}
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