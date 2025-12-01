// src/components/HierarchicalSidebar.tsx
import { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronRight,
  Folder,
  MessageSquare,
  AlertTriangle,
  X,
} from 'lucide-react';
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
  onDeleteProject: (projectId: string) => void;        // ← NEW
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
  onDeleteProject,                                   // ← NEW
  onUpdateTitle,
}: HierarchicalSidebarProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingConvId, setDeletingConvId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null); // ← NEW

  const getConversationsByProject = (projectId: string) => {
    return conversations.filter((conv) => conv.project_id === projectId);
  };

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjects((prev) => {
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

  const handleDeleteConv = (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    setDeletingConvId(convId);
  };

  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setDeletingProjectId(projectId);
  };

  const confirmDeleteProject = () => {
    if (deletingProjectId) {
      onDeleteProject(deletingProjectId);
      setDeletingProjectId(null);
      // Collapse if it was expanded
      setExpandedProjects((prev) => {
        const newSet = new Set(prev);
        newSet.delete(deletingProjectId);
        return newSet;
      });
    }
  };

  const confirmDeleteConv = () => {
    if (deletingConvId) {
      onDeleteConv(deletingConvId);
      setDeletingConvId(null);
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onCreateNewProject}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {/* Projects List */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-1">
          {projects.map((project) => {
            const isExpanded = expandedProjects.has(project.id);
            const convs = getConversationsByProject(project.id);
            const isActive = currentProjectId === project.id;

            return (
              <li key={project.id}>
                <div
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => toggleProjectExpand(project.id)}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  <button
                    onClick={() => onSelectProject(project.id)}
                    className="flex-1 flex items-center gap-2 text-left"
                  >
                    <Folder size={18} className={isActive ? 'text-blue-600' : 'text-gray-600'} />
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
                        className="px-2 py-1 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-medium truncate">{project.title}</span>
                    )}
                  </button>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditStart(project.id, project.title, true)}
                      className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                      title="Rename project"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteProject(e, project.id)}
                      className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                      title="Delete project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Conversations */}
                {isExpanded && (
                  <ul className="mt-1">
                    {convs.map((conv) => (
                      <li key={conv.id}>
                        <div
                          className={`group flex items-center justify-between px-3 py-2 pl-10 rounded-lg transition-colors ${
                            currentConvId === conv.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                          }`}
                        >
                          <button
                            onClick={() => onSelectConv(conv.id)}
                            className="flex-1 flex items-center gap-2 text-left"
                          >
                            <MessageSquare size={16} className="text-gray-500" />
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
                                className="px-2 py-1 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                            ) : (
                              <span className="text-sm truncate flex-1 truncate">{conv.title}</span>
                            )}
                          </button>

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
                              onClick={(e) => handleDeleteConv(e, conv.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                              aria-label="Delete conversation"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                    <li className="pl-10">
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

      {/* Modals */}
      <DeleteConversationModal
        isOpen={!!deletingConvId}
        onClose={() => setDeletingConvId(null)}
        onConfirm={confirmDeleteConv}
        conversationName={
          conversations.find((c) => c.id === deletingConvId)?.title || 'this conversation'
        }
      />

      {/* Project Delete Confirmation Modal */}
      {deletingProjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
                  <p className="text-sm text-gray-600">Are you sure?</p>
                </div>
              </div>
              <button
                onClick={() => setDeletingProjectId(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-700">
                This will permanently delete the project{' '}
                <strong>
                  {projects.find((p) => p.id === deletingProjectId)?.title}
                </strong>{' '}
                and <strong>all its conversations</strong>. This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setDeletingProjectId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}