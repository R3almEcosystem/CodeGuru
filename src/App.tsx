// src/App.tsx
import { Loader2 } from 'lucide-react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useMessages } from './hooks/useMessages';
import { useAuth } from './hooks/useAuth';
import Sidebar from './components/ui/Sidebar';
import ChatPanel from './components/ui/ChatPanel';
import Header from './components/ui/Header';
import AuthPage from './pages/AuthPage';

function ChatApp() {
  const {
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
    deleteConversation,
    deleteProject,
    updateConversationTitle,
    updateProjectTitle,
  } = useMessages();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        projects={projects}
        conversations={conversations}
        currentProject={currentProject}
        currentConv={currentConv}
        onSwitchProject={switchProject}
        onSwitchConversation={switchConversation}
        onCreateProject={createProject}
        onCreateConversation={createConversation}
        onDeleteProject={deleteProject}
        onDeleteConversation={deleteConversation}
        onRenameProject={updateProjectTitle}
        onRenameConversation={updateConversationTitle}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header
          title={currentConv?.title || 'New Chat'}
          subtitle={currentProject?.title}
        />
        <ChatPanel
          convId={currentConv?.id ?? null}
          onSendMessage={addMessage}
          onCreateConversation={() => createConversation(currentProject?.id)}
        />
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <ChatApp /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/auth"
        element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}