// src/components/HierarchicalSidebar.tsx
import { useState } from 'react';
import { Plus, Folder, MessageSquare, ChevronRight, ChevronDown, Settings, Trash2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project, Conversation } from '@/types';

interface HierarchicalSidebarProps {
  projects: Project[];
  conversations: Conversation[];
  currentProject: Project | null;
  currentConv: Conversation | null;
  onSwitchProject: (id: string) => void;
  onSwitchConversation: (id: string) => void;
  onCreateProject: (title?: string) => Promise<Project | null>;
  onCreateConversation: (projectId?: string) => Promise<Conversation | null>;
}

const HierarchicalSidebar = ({
  projects,
  conversations,
  currentProject,
  currentConv,
  onSwitchProject,
  onSwitchConversation,
  onCreateProject,
  onCreateConversation,
}: HierarchicalSidebarProps) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editingConv, setEditingConv] = useState<string | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState('');

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const handleCreateProject = async () => {
    const title = newProjectTitle.trim() || 'New Project';
    const project = await onCreateProject(title);
    if (project) {
      setNewProjectTitle('');
      setExpandedProjects(prev => new Set(prev).add(project.id));
    }
  };

  const projectConvs = conversations.filter(c => c.project_id === currentProject?.id);

  return (
    <div className="w-80 bg-muted/50 border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Workspace</h2>
          <button
            onClick={() => setNewProjectTitle('New Project')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* New Project Input */}
      {newProjectTitle !== undefined && newProjectTitle !== '' && (
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-muted-foreground" />
            <input
              autoFocus
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject();
                if (e.key === 'Escape') setNewProjectTitle('');
              }}
              onBlur={() => setNewProjectTitle('')}
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Project name..."
            />
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Folder className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No projects yet</p>
            <p className="text-xs mt-1">Create one to get started</p>
          </div>
        ) : (
          <div className="py-2">
            {projects.map((project) => {
              const isExpanded = expandedProjects.has(project.id);
              const isActive = currentProject?.id === project.id;
              const convs = conversations.filter(c => c.project_id === project.id);

              return (
                <div key={project.id} className="mb-1">
                  {/* Project Row */}
                  <div
                    className={cn(
                      "group flex items-center gap-2 px-3 py-2 rounded-lg mx-2 cursor-pointer transition-all",
                      isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                    )}
                  >
                    <button
                      onClick={() => toggleProject(project.id)}
                      className="p-1 -ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <Folder className="w-5 h-5 text-muted-foreground" />
                    <span
                      onClick={() => onSwitchProject(project.id)}
                      className="flex-1 text-sm font-medium truncate"
                    >
                      {project.title}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateConversation(project.id);
                        }}
                        className="p-1 hover:bg-background rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Conversations */}
                  {isExpanded && (
                    <div className="ml-8 border-l-2 border-muted pl-4">
                      {convs.length === 0 ? (
                        <div className="py-4 text-xs text-muted-foreground italic">
                          No conversations
                        </div>
                      ) : (
                        convs.map((conv) => (
                          <div
                            key={conv.id}
                            onClick={() => onSwitchConversation(conv.id)}
                            className={cn(
                              "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm",
                              currentConv?.id === conv.id
                                ? "bg-accent text-accent-foreground"
                                : "hover:bg-muted"
                            )}
                          >
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            <span className="flex-1 truncate">{conv.title}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settings Footer */}
      <div className="p-4 border-t border-border">
        <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-muted transition-colors">
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default HierarchicalSidebar;