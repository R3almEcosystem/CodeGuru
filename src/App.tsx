// src/App.tsx
import { useEffect, useRef } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import NavigationMenu from './components/NavigationMenu';
import HierarchicalSidebar from './components/HierarchicalSidebar';
import { useMessages } from './hooks/useMessages';
import { useSettings } from './hooks/useSettings';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function App() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string) => {
    if (!content.trim() || !currentConv) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      conversation_id: currentConv.id,
      created_at: new Date().toISOString(),
      timestamp: Date.now(),
      attachments: [],
    };

    await addMessage(userMessage);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-background text-foreground">
        {/* Permanent Left Sidebar */}
        <NavigationMenu />

        {/* Secondary Sidebar - Projects & Conversations */}
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

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b px-6 py-4 bg-card">
            <h1 className="text-2xl font-bold">
              {currentConv?.title || 'New Chat'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {currentProject?.title ? `Project: ${currentProject.title}` : 'No project selected'}
            </p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                    <span className="text-5xl font-bold text-white">G</span>
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Welcome to Grok</h2>
                  <p className="text-muted-foreground">
                    Start a conversation by typing below. Grok is ready to help with code, ideas, or anything else.
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                {messages.map((message) => (
                  <ChatMessage key={message.timestamp || message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t bg-card">
            <div className="max-w-4xl mx-auto p-6">
              <ChatInput onSend={handleSend} disabled={isLoading || !currentConv} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}