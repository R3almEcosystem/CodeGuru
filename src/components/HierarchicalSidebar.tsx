// src/components/HierarchicalSidebar.tsx
import { useState } from 'react';
import { Plus, Trash2, Edit3, ChevronDown, ChevronRight, Folder, MessageSquare } from 'lucide-react';
import { Conversation, Project } from '../types';
import { DeleteConversationModal } from './DeleteConversationModal';

interface HierarchicalSidebarProps {
  currentProjectId: string | null;
  currentConvId: string | null;
  projects: Project[];
  conversations: Conversation[];
  onSelectProject: (projectId: string) => void;
  onSelectConv: (convId: string) => void;
  onCreateNewProject: () => void;
  onCreateNewConv: (projectId?: string) => void;
  onDeleteConv: (convId: string) => void;
  onUpdateTitle: (itemId: string, newTitle: string, isProject: boolean) => void;
}

export function HierarchicalSidebar({
  currentProjectId,
  currentConvId,
  projects,
  conversations,
  onSelectProject,
  onSelectConv,
  onCreateNewProject,
  onCreateNewConv,
  onDeleteConv,
  onUpdateTitle,
}: HierarchicalSidebarProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingConvId, setDeletingConvId] = useState<string | null>(null);

  const getConversationsByProject = (projectId: string) => {
    return conversations.filter(conv => conv.project_id === projectId);
  };

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleEditStart = (itemId: string, title: string, isProject: boolean) => {
    setEditingItemId(itemId);
    setEditTitle(title);
  };

  const handleEditSave = (itemId: string, isProject: boolean) => {
    if (editTitle.trim()) {
      onUpdateTitle(itemId, editTitle.trim(), isProject);
    }
    setEditingItemId(null);
  };

  const handleDelete = (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    setDeletingConvId(convId);
  };

  const confirmDelete = () => {
    if (deletingConvId) {
      onDeleteConv(deletingConvId);
      setDeletingConvId(null);
    }
  };

  const handleProjectClick = (projectId: string) => {
    onSelectProject(projectId);
  };

  const handleConvClick = (convId: string) => {
    onSelectConv(convId);
  };

  if (projects.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-center">
        <div className="text-gray-500">
          <p className="text-sm font-medium mb-2">No projects yet</p>
          <button
            onClick={onCreateNewProject}
            className="text-blue-600 hover:text-blue-700 text-sm underline flex items-center gap-1 mx-auto"
          >
            <Plus size={14} />
            Create a new project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onCreateNewProject}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 space-y-2">
        <ul className="space-y-1">
          {projects.map((project) => {
            const isExpanded = expandedProjects.has(project.id);
            const projectConvs = getConversationsByProject(project.id);
            const isActive = currentProjectId === project.id;

            return (
              <li key={project.id}>
                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleProjectClick(project.id)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Folder size={16} className={isActive ? 'text-blue-600' : 'text-gray-500'} />
                    {editingItemId === project.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave(project.id, true);
                          if (e.key === 'Escape') setEditingItemId(null);
                        }}
                        onBlur={() => handleEditSave(project.id, true)}
                        className="flex-1 px-2 py-1 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-medium truncate flex-1">{project.title}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {projectConvs.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleProjectExpand(project.id);
                        }}
                        className="p-1 rounded hover:bg-gray-200"
                      >
                        {isExpanded ? (
                          <ChevronDown size={14} className="text-gray-500" />
                        ) : (
                          <ChevronRight size={14} className="text-gray-500" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditStart(project.id, project.title, true);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                      aria-label="Edit project title"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                </div>

                {isExpanded && projectConvs.length > 0 && (
                  <ul className="ml-6 space-y-1 mt-1">
                    {projectConvs.map((conv) => (
                      <li key={conv.id}>
                        <div
                          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                            currentConvId === conv.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => handleConvClick(conv.id)}
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare size={14} className="text-gray-500" />
                            {editingItemId === conv.id ? (
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleEditSave(conv.id, false);
                                  if (e.key === 'Escape') setEditingItemId(null);
                                }}
                                onBlur={() => handleEditSave(conv.id, false)}
                                className="flex-1 px-2 py-1 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                            ) : (
                              <span className="text-sm truncate flex-1">{conv.title}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStart(conv.id, conv.title, false);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                              aria-label="Edit conversation title"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, conv.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                              aria-label="Delete conversation"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                    <li className="pl-6">
                      <button
                        onClick={() => onCreateNewConv(project.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Plus size={14} />
                        New Chat
                      </button>
                    </li>
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <DeleteConversationModal
        isOpen={!!deletingConvId}
        onClose={() => setDeletingConvId(null)}
        onConfirm={confirmDelete}
        conversationName={conversations.find(c => c.id === deletingConvId)?.title || 'this conversation'}
      />
    </div>
  );
}