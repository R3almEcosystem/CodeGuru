// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Loader2, MessageSquare, LogIn } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Navigation } from './components/Navigation';
import { SettingsPage } from './components/SettingsPage';
import { HierarchicalSidebar } from './components/HierarchicalSidebar';
import { useSettings } from './hooks/useSettings';
import { Project, Conversation } from './types';

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, isLoading: settingsLoading } = useSettings();

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState('Developer');
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // App state
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState('Untitled Project');
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Listen to auth changes
  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setUserName(session?.user?.email?.split('@')[0] || 'Developer');
      setIsAuthLoading(false);
    });

    // Listen for changes (login, logout, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setUserName(session?.user?.email?.split('@')[0] || 'Developer');
      setIsAuthLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Load data only when authenticated
  useEffect(() => {
    if (!user || isAuthLoading) return;

    const loadData = async () => {
      try {
        const [projRes, convRes] = await Promise.all([
          supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false }),
          supabase
            .from('conversations')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
        ]);

        setProjects(projRes.data || []);
        setConversations(convRes.data || []);

        if (!currentProjectId && projRes.data?.length) {
          const first = projRes.data[0];
          setCurrentProjectId(first.id);
          setCurrentProjectName(first.title);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setGlobalLoading(false);
      }
    };

    loadData();
  }, [user, isAuthLoading, currentProjectId]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/login');
    }
  }, [user, isAuthLoading, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Loading states
  if (isAuthLoading || settingsLoading || globalLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-indigo-600 mx-auto mb-6" />
          <p className="text-xl font-medium text-gray-700">Loading xAI Coder...</p>
        </div>
      </div>
    );
  }

  // Not logged in (shouldn't happen due to redirect, but safe)
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LogIn className="w-16 h-16 mx-auto mb-6 text-indigo-600" />
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Navigation
        logo={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden md:block">xAI Coder</span>
          </div>
        }
        items={[
          { label: 'Home', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: 'Chat', href: currentConvId ? `/chat/${currentConvId}` : '/chat' },
          { label: 'Docs', href: '/docs' },
          { label: 'API', href: '/api' },
        ]}
        onSettingsClick={() => setShowSettings(true)}
        onLogout={handleLogout}
        userName={userName}
      />

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <HierarchicalSidebar
            currentProjectId={currentProjectId}
            currentConvId={currentConvId}
            projects={projects}
            conversations={conversations}
            onSelectProject={(id) => {
              const project = projects.find(p => p.id === id);
              if (project) {
                setCurrentProjectId(id);
                setCurrentProjectName(project.title);
                setCurrentConvId(null);
              }
            }}
            onSelectConv={(id) => {
              setCurrentConvId(id);
              navigate(`/chat/${id}`);
            }}
            onCreateNewProject={async () => {
              const title = prompt('Project name:', 'New Project') || 'New Project';
              const { data } = await supabase
                .from('projects')
                .insert({ title, user_id: user.id })
                .select()
                .single();

              if (data) {
                setProjects(p => [data, ...p]);
                setCurrentProjectId(data.id);
                setCurrentProjectName(data.title);
              }
            }}
            onCreateNewConv={async () => {
              if (!currentProjectId) return;
              const { data } = await supabase
                .from('conversations')
                .insert({ title: 'New Chat', project_id: currentProjectId, user_id: user.id })
                .select()
                .single();

              if (data) {
                setConversations(c => [data, ...c]);
                setCurrentConvId(data.id);
                navigate(`/chat/${data.id}`);
              }
            }}
            onDeleteConv={async (id) => {
              await supabase.from('conversations').delete().eq('id', id);
              setConversations(c => c.filter(x => x.id !== id));
              if (currentConvId === id) {
                setCurrentConvId(null);
                navigate('/');
              }
            }}
            onUpdateTitle={async (id, title, isProject) => {
              const table = isProject ? 'projects' : 'conversations';
              await supabase.from(table).update({ title }).eq('id', id);
              if (isProject) {
                setProjects(p => p.map(x => x.id === id ? { ...x, title } : x));
                if (currentProjectId === id) setCurrentProjectName(title);
              } else {
                setConversations(c => c.map(x => x.id === id ? { ...x, title } : x));
              }
            }}
          />
        </aside>

        <main className="flex-1 bg-white overflow-hidden">
          {showSettings ? (
            <div className="h-full flex flex-col">
              <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition text-sm font-medium"
                >
                  Back to App
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                <SettingsPage />
              </div>
            </div>
          ) : location.pathname.startsWith('/chat/') ? (
            <div className="h-full flex flex-col">
              <div className="h-16 border-b border-gray-200 flex items-center px-6 bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-900">Chat with Grok</h2>
              </div>
              <div className="flex-1 flex items-center justify-center text-center text-gray-400">
                <div>
                  <MessageSquare className="w-24 h-24 mx-auto mb-6 opacity-50" />
                  <p className="text-2xl font-medium">Chat interface ready</p>
                  <p className="text-sm mt-3">Conversation ID: {currentConvId || 'None selected'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-gray-400">
              <div>
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 mx-auto mb-8" />
                <h2 className="text-3xl font-semibold mb-2">Welcome to xAI Coder</h2>
                <p className="text-xl">Select a project or start a new conversation</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;