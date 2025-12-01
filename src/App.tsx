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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a new message
  const handleSend = async (content: string, attachments?: any[]) => {
    if (!content.trim() || !currentConv || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: content.trim(),
      conversation_id: currentConv.id,
      created_at: new Date().toISOString(),
      timestamp: Date.now(),
      attachments: attachments || [],
    };

    await addMessage(userMessage);
  };

  // Global loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* 1. Permanent Left Navigation — Fixed 64px */}
      <div className="w-16 flex-shrink-0 bg-sidebar border-r border-border">
        <NavigationMenu />
      </div>

      {/* 2. Projects & Conversations Sidebar — Fixed 320px */}
      <div className="w-80 flex-shrink-0 border-r border-border bg-muted/30 overflow-y-auto">
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

      {/* 3. Main Chat Area — Takes all remaining space */}
      <div className="flex-1 flex flex-col">

        {/* Header — Matches Grok.new exactly */}
        <header className="border-b border-border bg-card px-8 py-5 flex-shrink-0">
          <h1 className="text-2xl font-bold text-foreground">
            {currentConv?.title || 'New Chat'}
          </h1>
          {currentProject && (
            <p className="text-sm text-muted-foreground mt-1">
              Project: {currentProject.title}
            </p>
          )}
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto bg-background">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center px-8">
              <div className="text-center max-w-2xl">
                {/* Grok Logo Circle — Exact match */}
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-2xl">
                  <span className="text-6xl font-bold text-white">G</span>
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-3">
                  Welcome to Grok
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Start a conversation. Attach files, folders, or just ask anything.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
              {messages.map((msg) => (
                <ChatMessage key={msg.id || msg.timestamp} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input Footer — Pinned to bottom */}
        <footer className="border-t border-border bg-card">
          <div className="max-w-5xl mx-auto p-6">
            <ChatInput
              onSend={handleSend}
              disabled={!currentConv || isLoading}
              placeholder="Message Grok..."
            />
          </div>
        </footer>
      </div>
    </div>
  );
}