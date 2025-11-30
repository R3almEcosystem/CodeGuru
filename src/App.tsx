// src/App.tsx — FINAL: SCROLLBARS 100% VISIBLE (even on macOS)
import React, { useEffect, useState, useRef } from 'react';
import { 
  Loader2, 
  Plus, 
  Folder, 
  MessageSquare, 
  Code2, 
  Send, 
  Copy, 
  Check, 
  AlertCircle,
  ChevronDown,
  Bot
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { Navigation } from './components/Navigation';
import { SettingsPage } from './components/SettingsPage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Project { id: string; title: string; created_at: string; user_id?: string | null; }
interface Message { id: string; role: 'user' | 'assistant'; content: string; created_at: string; }
type ActiveTab = 'chat' | 'code';

const modelOptions = [
  { value: 'auto', label: 'Auto (Best)', icon: '🤖' },
  { value: 'grok-4-1-fast-reasoning', label: 'Grok 4.1 Fast (Reasoning)', icon: '🧠' },
  { value: 'grok-code-fast-1', label: 'Grok Code Fast', icon: '💻' },
  { value: 'grok-beta', label: 'Grok Beta', icon: 'β' },
];

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentModel, setCurrentModel] = useState('auto');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedModel = modelOptions.find(m => m.value === currentModel) || modelOptions[0];

  useEffect(() => {
    const saved = localStorage.getItem('xai-coder-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.model) setCurrentModel(parsed.model);
    }
  }, []);

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

      const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      setProjects(data || []);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      supabase
        .from('messages')
        .select('*')
        .eq('project_id', selectedProjectId)
        .order('created_at', { ascending: true })
        .then(({ data }) => setMessages(data || []));
    }
  }, [selectedProjectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createProject = async () => {
    const title = prompt('Project name:', 'New AI Project') || 'New Project';
    if (!title) return;
    const { data } = await supabase.from('projects').insert({ title }).select().single();
    if (data) {
      setProjects(p => [data, ...p]);
      setSelectedProjectId(data.id);
      setActiveTab('chat');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedProjectId || isTyping) return;

    const userMessage = { id: crypto.randomUUID(), role: 'user' as const, content: input, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    const tempInput = input;
    setInput('');
    setIsTyping(true);

    await supabase.from('messages').insert({ project_id: selectedProjectId, role: 'user', content: tempInput });

    try {
      const apiKey = JSON.parse(localStorage.getItem('xai-coder-settings') || '{}').xaiApiKey || '';
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: currentModel,
          messages: messages.map(m => ({ role: m.role, content: m.content })).concat({ role: 'user', content: tempInput }),
          stream: false,
        }),
      });

      const data = await response.json();
      const assistantContent = data.choices?.[0]?.message?.content || 'No response.';
      const assistantMessage = { id: crypto.randomUUID(), role: 'assistant' as const, content: assistantContent, created_at: new Date().toISOString() };

      setMessages(prev => [...prev, assistantMessage]);
      await supabase.from('messages').insert({ project_id: selectedProjectId, role: 'assistant', content: assistantContent });
    } catch (error) {
      console.error('API Error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50"><Loader2 className="w-16 h-16 animate-spin text-indigo-600" /></div>;
  if (showSettings) return <div className="h-screen flex flex-col bg-gray-900 text-gray-100"><Navigation userName={user?.email?.split('@')[0] || 'Dev'} onSettingsClick={() => setShowSettings(false)} onLogout={() => supabase.auth.signOut()} /><div className="flex-1 overflow-y-auto p-8"><SettingsPage /></div></div>;

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      <Navigation userName={user?.email?.split('@')[0] || 'Dev'} onSettingsClick={() => setShowSettings(true)} onLogout={() => supabase.auth.signOut()} />

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <button onClick={createProject} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition font-medium">
              <Plus size={20} /> New Project
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ scrollbarWidth: 'auto', scrollbarColor: '#6b7280 #1f2937' }}>
            <style jsx global>{`
              div::-webkit-scrollbar { width: 12px; }
              div::-webkit-scrollbar-track { background: #1f2937; border-radius: 6px; }
              div::-webkit-scrollbar-thumb { background: #6b7280; border-radius: 6px; border: 3px solid #1f2937; }
              div::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
            `}</style>
            {projects.length === 0 ? (
              <div className="text-center text-gray-500 pt-20">
                <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No projects yet</p>
              </div>
            ) : (
              projects.map(p => (
                <div key={p.id} onClick={() => setSelectedProjectId(p.id)} className={`p-4 rounded-lg cursor-pointer transition-all ${selectedProjectId === p.id ? 'bg-indigo-900 border-2 border-indigo-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                  <h3 className="font-medium">{p.title}</h3>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col">
          {selectedProject ? (
            <>
              <div className="border-b border-gray-800 bg-gray-950 px-6 py-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">{selectedProject.title}</h1>
                <button onClick={() => setShowModelDropdown(!showModelDropdown)} className="flex items-center gap-3 px-5 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition text-sm font-medium">
                  <Bot size={18} className="text-indigo-400" />
                  <span className="text-gray-300">{selectedModel.label}</span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <div className="flex border-b border-gray-800 bg-gray-950">
                <button onClick={() => setActiveTab('chat')} className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${activeTab === 'chat' ? 'border-indigo-500 text-indigo-400 bg-gray-800' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                  <MessageSquare size={18} /> Chat
                </button>
                <button onClick={() => setActiveTab('code')} className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${activeTab === 'code' ? 'border-indigo-500 text-indigo-400 bg-gray-800' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                  <Code2 size={18} /> Code
                </button>
              </div>

              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col bg-gray-900">
                  {/* CHAT MESSAGES — SCROLLBAR IS NOW 100% VISIBLE */}
                  <div 
                    className="flex-1 overflow-y-auto p-6 space-y-6"
                    style={{ 
                      scrollbarWidth: 'auto',
                      scrollbarColor: '#6b7280 #1f2937',
                      overflowY: 'scroll' // FORCES SCROLLBAR
                    }}
                  >
                    {/* Global scrollbar styles */}
                    <style jsx global>{`
                      div {
                        scrollbar-width: auto;
                        scrollbar-color: #6b7280 #1f2937;
                      }
                      div::-webkit-scrollbar {
                        width: 16px;
                      }
                      div::-webkit-scrollbar-track {
                        background: #1f2937;
                        border-radius: 8px;
                      }
                      div::-webkit-scrollbar-thumb {
                        background: #6b7280;
                        border-radius: 8px;
                        border: 4px solid #1f2937;
                      }
                      div::-webkit-scrollbar-thumb:hover {
                        background: #9ca3af;
                      }
                    `}</style>

                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 mt-20">
                        <MessageSquare className="w-20 h-20 mx-auto mb-6 opacity-50" />
                        <h2 className="text-3xl font-bold mb-4">Start coding with Grok</h2>
                        <p className="text-lg">Ask anything — write code, debug, explain concepts</p>
                        <p className="text-sm mt-4">Using: <strong className="text-indigo-400">{selectedModel.label}</strong></p>
                      </div>
                    ) : (
                      messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-4xl rounded-2xl px-8 py-5 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-100 border border-gray-700'}`}>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({ inline, className, children }) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const codeString = String(children).replace(/\n$/, '');
                                  return !inline ? (
                                    <div className="relative mt-6 bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
                                      <div className="flex items-center justify-between px-5 py-3 bg-gray-800 border-b border-gray-700">
                                        <span className="text-sm text-gray-400 font-medium">{match?.[1]?.toUpperCase() || 'CODE'}</span>
                                        <button onClick={() => navigator.clipboard.writeText(codeString)} className="p-2 hover:bg-gray-700 rounded transition">
                                          <Copy size={16} className="text-gray-400" />
                                        </button>
                                      </div>
                                      <div className="overflow-auto" style={{ maxHeight: '500px' }}>
                                        <SyntaxHighlighter style={vscDarkPlus} language={match?.[1] || 'text'} PreTag="div" customStyle={{ margin: 0, padding: '20px', background: 'transparent', fontSize: '15px' }}>
                                          {codeString}
                                        </SyntaxHighlighter>
                                      </div>
                                    </div>
                                  ) : (
                                    <code className="px-2 py-1 bg-gray-700 rounded text-sm">{children}</code>
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
                            <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce"></div>
                            <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder={`Ask ${selectedModel.label}...`}
                        className="flex-1 px-8 py-5 bg-gray-800 border border-gray-700 rounded-2xl focus:outline-none focus:border-indigo-500 transition text-white placeholder-gray-500 text-lg"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={isTyping || !input.trim()}
                        className="px-8 py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 rounded-2xl transition flex items-center gap-3 font-medium text-lg"
                      >
                        <Send size={24} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="bg-gray-700 border-2 border-dashed rounded-xl w-32 h-32 mx-auto mb-8" />
                <h1 className="text-6xl font-bold mb-4">xAI Coder</h1>
                <p className="text-2xl text-gray-400">Create or select a project to begin</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}