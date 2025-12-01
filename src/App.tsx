// src/App.tsx
import { useEffect, useState } from 'react';
import { Loader2, Settings, LogOut, User, Plus } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useSettings } from './hooks/useSettings';
import { useMessages } from './hooks/useMessages';
import { SettingsModal } from './components/SettingsModal';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
  } = useMessages();

  // Handle initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

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

  const handleSend = async (content: string, attachments?: any[]) => {
    if (!currentConv) return;

    const userMessage = {
      role: 'user' as const,
      content,
      timestamp: Date.now(),
      attachments,
    };

    await addMessage(userMessage);

    // TODO: Add streaming response here (next feature!)
    // For now, just simulate a reply
    setTimeout(() => {
      addMessage({
        role: 'assistant' as const,
        content: `You said: "${content}"\n\nI'm Grok — ready to help you code!`,
        timestamp: Date.now(),
      });
    }, 800);
  };

  return (
    <>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-lg" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">G</span>
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-gray-900">CodeGuru</h1>
                  <p className="text-xs text-gray-500">AI-Powered Coding Assistant</p>
                </div>
              </div>

              {/* Project Selector */}
              {currentProject && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Project:</span>
                  <button
                    on  onClick={() => {/* TODO: open project selector */}}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {currentProject.title}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings size={22} className="text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <LogOut size={22} className="text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <button
                onClick={() => createProject()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Plus size={16} />
                New Project
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {projects.length === 0 ? (
                <p className="text-center text-gray-500 text-sm mt-8">No projects yet</p>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      currentProject?.id === project.id
                        ? 'bg-blue-50 border border-blue-300'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => switchProject(project.id)}
                  >
                    <h3 className="font-medium text-gray-900">{project.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {conversations.filter(c => c.project_id === project.id).length} conversations
                    </p>
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* Chat Area */}
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
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <ChatInput
              onSend={handleSend}
              disabled={!apiKey || !currentConv}
              currentModel={model}
              onOpenModelSelector={() => {/* TODO */}}
            />
          </div>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}

export default App;