// src/App.tsx
import { useEffect, useState, useRef } from 'react';
import { Loader2, Settings, LogOut, User, Plus, MessageSquare } from 'lucide-react';
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
  const [user, setUser] = useState<any>(null);

  const { apiKey, baseUrl, model, logoUrl } = useSettings();

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
    deleteProject,
    updateConversationTitle,
    updateProjectTitle,
  } = useMessages();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
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

  // Require sign-in
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-5xl font-bold">G</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome to CodeGuru</h1>
            <p className="text-gray-600 mt-2">Sign in to continue</p>
          </div>
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>
          <p className="text-center text-sm text-gray-500 mt-6">
            By signing in, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    );
  }

  const handleSend = async (content: string, attachments?: any[]) => {
    if (!currentConv || !content.trim()) return;

    const userMessage = {
      id: `temp-${Date.now()}`,
      role: 'user' as const,
      content,
      timestamp: Date.now(),
      attachments: attachments || [],
    };

    await addMessage(userMessage);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleModelSelect = (newModel: string) => {
    // This will be handled by useSettings persistence
    console.log('Model selected:', newModel);
  };

  return (
    <>
      {/* Main Layout */}
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
          onDeleteProject={deleteProject}
          onUpdateTitle={(id, title, isProject) => {
            if (isProject) {
              updateProjectTitle(id, title);
            } else {
              updateConversationTitle(id, title);
            }
          }}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {currentProject?.title || 'CodeGuru'}
              </h1>
              {currentConv && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MessageSquare className="w-4 h-4" />
                  <span>{currentConv.title || 'New Conversation'}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsModelSelectorOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition"
              >
                {model || 'Grok 4'}
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-2xl">
                  <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                    <span className="text-white text-5xl font-bold">G</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    How can I help you code today?
                  </h2>
                  <p className="text-xl text-gray-600">
                    Start a conversation by typing below or uploading files.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8 max-w-5xl mx-auto">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id || msg.timestamp} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 bg-white">
            <ChatInput
              onSend={handleSend}
              disabled={!currentConv}
              currentModel={model}
              onOpenModelSelector={() => setIsModelSelectorOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
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