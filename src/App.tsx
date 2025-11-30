// src/App.tsx — FULL GROK CHAT + CODE TABS (FINAL)
import React, { useEffect, useState, useRef } from 'react';
import { Loader2, Plus, Folder, MessageSquare, Code2, Send, Paperclip, Copy, Check } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Navigation } from './components/Navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Project {
  id: string;
  title: string;
  created_at: string;
  user_id?: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

type ActiveTab = 'chat' | 'code';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Auto-login + load projects
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { error } = await supabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: '123456',
        });
        if (error?.message.includes('Invalid')) {
          await supabase.auth.signUp({ email: 'test@example.com', password: '123456' });
        }
      }
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      setProjects(data || []);
      setLoading(false);
    };
    init();
  }, []);

  // Load messages when project changes
  useEffect(() => {
    if (selectedProjectId) {
      supabase
        .from('messages')
        .select('*')
        .eq('project_id', selectedProjectId)
        .order('created_at', { ascending: true })
        .then(({ data }) => setMessages(data || []));
    } else {
      setMessages([]);
    }
  }, [selectedProjectId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createProject = async () => {
    const title = prompt('Project name:', 'New AI Project') || 'New Project';
    const payload: any = { title };
    if (user?.id) payload.user_id = user.id;

    const { data } = await supabase
      .from('projects')
      .insert(payload)
      .select()
      .single();

    if (data) {
      setProjects(p => [data, ...p]);
      setSelectedProjectId(data.id);
      setActiveTab('chat');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedProjectId || isTyping) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Save user message
    await supabase.from('messages').insert({
      project_id: selectedProjectId,
      role: 'user',
      content: input,
    });

    // Call xAI API
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer xai-9JN1qOTaXnBhnKCflQBa6xj26dO5vDpN79AJmLuQY1on7Fv2lHkpZ1l5RmVcOxO8EDKEZh28yKEEMTE4',
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [{ role: 'user', content: input }],
        stream: false,
      }),
    });

    const data = await response.json();
    const assistantMessage = {
      id: crypto.randomUUID(),
      role: 'assistant' as const,
      content: data.choices?.[0]?.message?.content || 'No response',
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    await supabase.from('messages').insert({
      project_id: selectedProjectId,
      role: 'assistant',
      content: assistantMessage.content,
    });

    setIsTyping(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <Loader2 className="w-16 h-16 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      <Navigation
        userName={user?.email?.split('@')[0] || 'Dev'}
        onLogout={() => supabase.auth.signOut()}
        onSettingsClick={() => alert('Settings')}
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
          <div className="flex-1 overflow-y-auto">
            {projects.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No projects yet</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {projects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedProjectId === p.id
                        ? 'bg-indigo-900 border border-indigo-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <h3 className="font-medium">{p.title}</h3>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 flex flex-col">
          {selectedProject ? (
            <>
              {/* Tab Bar */}
              <div className="flex border-b border-gray-800 bg-gray-950">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                    activeTab === 'chat'
                      ? 'border-indigo-500 text-indigo-400 bg-gray-800'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <MessageSquare size={18} /> Chat
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                    activeTab === 'code'
                      ? 'border-indigo-500 text-indigo-400 bg-gray-800'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Code2 size={18} /> Code
                </button>
              </div>

              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col bg-gray-900">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 mt-20">
                        <MessageSquare className="w-20 h-20 mx-auto mb-6 opacity-50" />
                        <h2 className="text-2xl font-bold mb-2">Start coding with Grok</h2>
                        <p>Ask anything — write code, debug, explain concepts</p>
                      </div>
                    ) : (
                      messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-3xl rounded-2xl px-6 py-4 ${
                              msg.role === 'user'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-800 text-gray-100 border border-gray-700'
                            }`}
                          >
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({ node, inline, className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const codeString = String(children).replace(/\n$/, '');
                                  return !inline ? (
                                    <div className="relative mt-4">
                                      <button
                                        onClick={() => copyToClipboard(codeString, msg.id)}
                                        className="absolute top-3 right-3 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                                      >
                                        {copiedId === msg.id ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                                      </button>
                                      <SyntaxHighlighter
                                        style={vscDarkPlus}
                                        language={match?.[1] || 'text'}
                                        PreTag="div"
                                        className="rounded-lg !mt-0"
                                      >
                                        {codeString}
                                      </SyntaxHighlighter>
                                    </div>
                                  ) : (
                                    <code className="px-2 py-1 bg-gray-700 rounded text-sm" {...props}>
                                      {children}
                                    </code>
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
                        <div className="bg-gray-800 rounded-2xl px-6 py-4">
                          <div className="flex gap-2">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="border-t border-gray-800 p-6 bg-gray-950">
                    <div className="flex gap-3 max-w-5xl mx-auto">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder="Ask Grok to write code, debug, explain..."
                        className="flex-1 px-6 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-indigo-500 transition text-white placeholder-gray-500"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={isTyping || !input.trim()}
                        className="px-6 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 rounded-xl transition flex items-center gap-2 font-medium"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Code Tab */}
              {activeTab === 'code' && (
                <div className="flex-1 p-8 bg-gray-900">
                  <div className="bg-gray-800 rounded-xl h-full border border-gray-700 overflow-hidden">
                    <div className="bg-gray-950 px-6 py-4 border-b border-gray-700 flex items-center gap-3">
                      <Code2 size={20} className="text-indigo-400" />
                      <span className="font-medium">main.py</span>
                    </div>
                    <pre className="p-6 text-sm overflow-auto h-full">
                      <code className="text-gray-300">
{`# This file is synced with your chat
# Ask Grok to generate code → it appears here

print("Hello from xAI Coder!")
`}
                      </code>
                    </pre>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="bg-gray-700 border-2 border-dashed rounded-xl w-32 h-32 mx-auto mb-8" />
                <h1 className="text-5xl font-bold mb-4">xAI Coder</h1>
                <p className="text-xl text-gray-400">Create or select a project to begin</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}