// src/App.tsx
import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
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
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* 1. Left Navigation - Fixed 64px */}
      <div className="w-16 flex-shrink-0 bg-card border-r border-border">
        <NavigationMenu />
      </div>

      {/* 2. Sidebar - Projects & Chats */}
      <div className="w-80 flex-shrink-0 bg-background border-r border-border overflow-y-auto">
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

        {/* Header */}
        <header className="h-16 flex items-center px-8 border-b border-border bg-backdrop">
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
        <main className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center px-6">
                <div className="welcome-logo mb-8">
                  <span>G</span>
                </div>
                <h2 className="text-4xl font-bold mb-4">How can I help you today?</h2>
                <p className="text-muted text-lg">Ask anything. Attach files. Build something amazing.</p>
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
              {messages.map((msg) => (
                <ChatMessage key={msg.id || msg.timestamp} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input */}
        <footer className="border-t border-border bg-backdrop">
          <div className="max-w-5xl mx-auto p-6">
            <ChatInput onSend={handleSend} disabled={!currentConv} />
          </div>
        </footer>
      </div>
    </div>
  );
}