// src/App.tsx
import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { ChatInterface } from './components/ChatInterface';
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

  // ChatInterface will handle message loading/sending for the active conversation.

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-foreground" />
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

        {/* Chat Interface (single consolidated chat component) */}
        <div className="flex-1 flex flex-col">
          <ChatInterface convId={currentConv?.id ?? null} />
        </div>
      </div>
    </div>
  );
}