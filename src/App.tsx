// src/App.tsx — FULLY WORKING WITH SIDEBAR
import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Folder, MessageSquare } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Navigation } from './components/Navigation';

interface Project {
  id: string;
  title: string;
  created_at: string;
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Auto-login + load projects
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        await supabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: '123456',
        }).catch(async () => {
          await supabase.auth.signUp({
            email: 'test@example.com',
            password: '123456',
          });
        });
      }

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Load projects
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      setProjects(data || []);
      setLoading(false);
    };

    init();
  }, []);

  const createProject = async () => {
    const title = prompt('Project name:', 'My Awesome Project') || 'Untitled Project';
    if (!title) return;

    const { data, error } = await supabase
      .from('projects')
      .insert({ title })
      .select()
      .single();

    if (data) {
      setProjects(p => [data, ...p]);
      setSelectedProjectId(data.id);
    }
  };

  const handleLogout = () => supabase.auth.signOut();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <Loader2 className="w-16 h-16 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation */}
      <Navigation
        userName={user?.email?.split('@')[0] || 'Dev'}
        onLogout={handleLogout}
        onSettingsClick={() => alert('Settings coming soon!')}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={createProject}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              <Plus size={20} />
              New Project
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {projects.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No projects yet</p>
                <p className="text-sm mt-2">Click "New Project" to start</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {projects.map(project => (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedProjectId === project.id
                        ? 'bg-indigo-50 border-2 border-indigo-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Folder size={20} className="text-indigo-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{project.title}</h3>
                        <p className="text-xs text-gray-500">
                          {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 flex items-center justify-center bg-gray-50">
          {selectedProjectId ? (
            <div className="text-center">
              <MessageSquare className="w-24 h-24 mx-auto mb-6 text-indigo-600 opacity-50" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {projects.find(p => p.id === selectedProjectId)?.title}
              </h2>
              <p className="text-xl text-gray-600">Chat coming soon...</p>
            </div>
          ) : (
            <div className="text-center max-w-md">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 mx-auto mb-8" />
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to xAI Coder
              </h1>
              <p className="text-xl text-gray-600">
                Select a project or create a new one to start coding with Grok
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}