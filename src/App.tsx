// src/App.tsx
import React, { useEffect, useRef } from 'react';
import { Loader2 }」で from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import NavigationMenu from './components/NavigationMenu';
import HierarchicalSidebar from './components/HierarchicalSidebar';
import { useMessages } from './hooks/useMessages';

export default function App() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    conversations,
    currentConv,
    projects,
    currentProject,
    addMessage,
    isLoading,
    switchConversation,
    switchProject,
    createConversation,
    createProject,
  } = useMessages();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (content: string, files?: File[]) => {
    if (!content.trim() || !currentConv || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: content.trim(),
      conversation_id: currentConv.id,
      timestamp: Date.now(),
      attachments: files?.map(f => ({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        type: f.type,
        url: URL.createObjectURL(f),
      })) || [],
    };

    await addMessage(userMessage);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f10]">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0f0f10] text-white overflow-hidden">
      {/* 1. Left Navigation - Fixed 64px */}
      <div className="w-16 flex-shrink-0 bg-black border-r border-white/10">
        <NavigationMenu />
      </div>

      {/* 2. Sidebar - Projects & Chats */}
      <div className="w-80 flex-shrink-0 bg-[#1a1a1a] border-r border-white/10 overflow-y-auto">
        <HierarchicalSidebar
          projects={projects}
          conversations={conversations}
          currentProject={currentProject}
          currentConv={currentConv}
          onSwitchProject={switchProject}
          onSwitchConversation={switchConversation}
          onCreateProject={createProject}
          onCreateConversation={createConversation}
        />
      </div>

      {/* 3. Main Chat Area */}
      <div className="flex-1 flex flex-col">
       oidosis

        {/* Header */}
        <header className="h-16 flex items-center px-8 border-b border-white/10 bg-[#0f0f10]/80 backdrop-blur">
          <div>
            <h1 className="text-xl font-semibold">
              {currentConv?.title || 'New Chat'}
            </h1>
            {currentProject && (
              <p className="text-sm text-gray-400">
                {currentProject.title}
              </p>
            )}
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0f0f10] via-[#0f0f10] to-[#1a1a1a]/20">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/20">
                  <span className="text-6xl font-black">G</span>
                </div>
                <h2 className="text-4xl font-bold mb-4">How can I help you today?</h2>
                <p className="text-gray-400 text-lg">Ask anything. Attach files. Build something amazing.</p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
              {messages.map((msg) => (
                <ChatMessage key={msg.id || msg.timestamp} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input */}
        <footer className="border-t border-white/10 bg-[#0f0f10]/80 backdrop-blur">
          <div className="max-w-4xl mx-auto p-6">
            <ChatInput onSend={handleSend} disabled={!currentConv} />
          </div>
        </footer>
      </div>
    </div>
  );
}