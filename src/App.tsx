// src/App.tsx
import { useEffect, useState, useRef } from 'react';
import { Loader2, Settings, LogOut, User, Plus } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useSettings } from './hooks/useSettings';
import { useMessages } from './hooks/useMessages';
import { SettingsModal } from './components/SettingsModal';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { HierarchicalSidebar } from './components/HierarchicalSidebar';
import { ModelSelectorModal } from './components/ModelSelectorModal';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { apiKey, baseUrl, model, logoUrl } = useSettings();

  // useMessages will handle all project/conversation logic
  const {
    messages,
    currentConv,
    currentProject,
    projects,
    conversations,
    addMessage,
    isLoading: isMessagesLoading,
    createProject,
    createConversation,
    switchProject,
    switchConversation,
    deleteConversation,
    updateConversationTitle,
  } = useMessages();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show loading screen
  if (isLoading || isMessagesLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center animate-pulse">
            <span className="text-white text-4xl font-bold">G</span>
          </div>
          <p className="text-gray-700 text-lg font-medium">Loading CodeGuru...</p>
          <p className="text-gray-500 text-sm mt-2">Your AI coding workspace</p>
        </div>
      </div>
    );
  }

  const handleSend = async (content: string, attachments?: FileAttachment[]) => {
    if (!currentConv) return;

    const userMessage = {
      role: 'user' as const,
      content,
      timestamp: Date.now(),
      attachments,
    };

    await addMessage(userMessage);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleModelSelect = (newModel: string) => {
    // Update settings hook
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <HierarchicalSidebar
          currentProjectId={currentProject?.id || null}
          currentConvId={currentConv?.id || null}
          projects={projects}
          conversations={conversations}
          onSelectProject={switchProject}
          onSelectConv={switchConversation}
          onCreateNewProject={createProject}
          onCreateNewConv={createConversation}
          onDeleteConv={deleteConversation}
          onUpdateTitle={(id, title, isProject) => {
            if (isProject) {
              // Update project title
            } else {
              updateConversationTitle(id, title);
            }
          }}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Conversation List */}
          {currentProject && (
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">
                {currentConv?.title || 'New Conversation'}
              </h2>
              <button
                onClick={() => createConversation()}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Plus size={14} />
                New Chat
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">G</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">How can I help you code today?</h2>
                  <p className="text-gray-600">Start a conversation by typing below or uploading files.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id || msg.timestamp} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <ChatInput
            onSend={handleSend}
            disabled={!apiKey || !currentConv}
            currentModel={model}
            onOpenModelSelector={() => setIsModelSelectorOpen(true)}
          />
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ModelSelectorModal
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
        currentModel={model}
        onSelectModel={handleModelSelect}
      />
    </>
  );
}

export default App;