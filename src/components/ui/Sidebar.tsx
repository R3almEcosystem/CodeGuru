import { useState } from 'react';
import { Plus, Folder, MessageSquare, ChevronDown, ChevronRight, Edit2 } from 'lucide-react';
import type { Project, Conversation } from '../../types';

interface SidebarProps {
  projects: Project[];
  conversations: Conversation[];
  currentProject: Project | null;
  currentConv: Conversation | null;
  onSwitchProject: (id: string) => void;
  onSwitchConversation: (id: string) => void;
  onCreateProject: (title?: string) => Promise<Project | null>;
  onCreateConversation: (projectId?: string) => Promise<Conversation | null>;
  onDeleteProject: (id: string) => Promise<void>;
  onDeleteConversation: (id: string) => Promise<void>;
  onRenameProject: (id: string, title: string) => Promise<void>;
  onRenameConversation: (id: string, title: string) => Promise<void>;
}

export default function Sidebar({
  projects,
  conversations,
  currentProject,
  currentConv,
  onSwitchProject,
  onSwitchConversation,
  onCreateProject,
  onCreateConversation,
}: SidebarProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(currentProject ? [currentProject.id] : [])
  );
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [hoveredConvId, setHoveredConvId] = useState<string | null>(null);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const startEdit = (convId: string, currentTitle: string) => {
    setEditingConvId(convId);
    setEditTitle(currentTitle);
  };
  const saveEdit = () => {
    // Just close edit mode
    setEditingConvId(null);
  };

  const handleCreateProject = async () => {
    const newTitle = prompt('Project name:', 'New Project');
    if (newTitle?.trim()) {
      const project = await onCreateProject(newTitle.trim());
      if (project) {
        setExpandedProjects(prev => new Set(prev).add(project.id));
        await onSwitchProject(project.id);
      }
    }
  };

  return (
    <aside className="w-64 flex flex-col bg-sidebar border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-xs text-muted">Workspace</h2>
        <button
          onClick={handleCreateProject}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          title="New project"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Projects & Conversations */}
      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="p-8 text-center">
            <Folder className="w-12 h-12 mx-auto text-muted/30 mb-3" />
            <p className="text-xs text-muted/60">No projects yet</p>
          </div>
        ) : (
          <div className="space-y-1 p-3">
            {projects.map(project => {
              const isExpanded = expandedProjects.has(project.id);
              const isActive = currentProject?.id === project.id;
              const projectConvs = conversations.filter(c => c.project_id === project.id);

              return (
                <div key={project.id}>
                  {/* Project Row */}
                  <div
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                      isActive ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                    onClick={() => onSwitchProject(project.id)}
                  >
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleProject(project.id);
                      }}
                      className="p-0.5 opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <Folder className="w-4 h-4 text-muted flex-shrink-0" />
                    <span className="flex-1 truncate text-sm font-medium">{project.title}</span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onCreateConversation(project.id);
                      }}
                      className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded flex-shrink-0"
                      title="New conversation"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Conversations */}
                  {isExpanded && projectConvs.length > 0 && (
                    <div className="ml-6 space-y-1 border-l border-border/50 pl-3 mt-1">
                      {projectConvs.map(conv => (
                        <div
                          key={conv.id}
                          className={`group relative flex items-center gap-2 px-2 py-2 rounded-lg transition-all ${
                            currentConv?.id === conv.id
                              ? 'bg-white/10'
                              : 'hover:bg-white/5'
                          }`}
                          onMouseEnter={() => setHoveredConvId(conv.id)}
                          onMouseLeave={() => setHoveredConvId(null)}
                        >
                          {editingConvId === conv.id ? (
                              <input
                                autoFocus
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                onBlur={() => saveEdit()}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') setEditingConvId(null);
                                }}
                              onClick={e => e.stopPropagation()}
                              className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            <>
                              <MessageSquare className="w-3 h-3 text-muted flex-shrink-0" />
                              <button
                                onClick={() => onSwitchConversation(conv.id)}
                                className="flex-1 text-left text-xs truncate hover:underline"
                              >
                                {conv.title}
                              </button>
                              {hoveredConvId === conv.id && (
                                <div className="flex items-center gap-1 opacity-100 flex-shrink-0">
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      startEdit(conv.id, conv.title);
                                    }}
                                    className="p-1 hover:bg-white/20 rounded transition-colors"
                                    title="Rename"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted/50 text-center">CodeGuru © 2025</p>
      </div>
    </aside>
  );
}
