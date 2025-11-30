// src/components/ProjectsList.tsx
import { Plus, Folder, Trash2, Edit2, Settings } from 'lucide-react'
import { useState } from 'react'

interface Project {
  id: string
  title: string
  created_at: string
}

interface ProjectsListProps {
  projects: Project[]
  currentProjectId: string | null
  onSelectProject: (id: string) => void
  onCreateNew: () => void
  onDeleteProject: (project: { id: string; title: string }) => void
  onUpdateTitle: (id: string, title: string) => void
  onOpenConfig: (project: Project) => void
  showNewButton?: boolean
}

export function ProjectsList({
  projects,
  currentProjectId,
  onSelectProject,
  onCreateNew,
  onDeleteProject,
  onUpdateTitle,
  onOpenConfig,
  showNewButton = true,
}: ProjectsListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const startEdit = (project: Project) => {
    setEditingId(project.id)
    setEditValue(project.title)
  }

  const saveEdit = (id: string) => {
    if (editValue.trim()) {
      onUpdateTitle(id, editValue.trim())
    }
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  return (
    <div className="pb-4">
      {showNewButton && (
        <div className="px-3 mb-3">
          <button
            onClick={onCreateNew}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>
      )}

      <div className="space-y-1 px-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`group flex items-center justify-between rounded-lg transition-all ${
              currentProjectId === project.id
                ? 'bg-blue-50 text-blue-700'
                : 'hover:bg-gray-50'
            }`}
          >
            <button
              onClick={() => onSelectProject(project.id)}
              className="flex-1 flex items-center gap-3 px-3 py-2 text-left"
            >
              <Folder size={18} className="flex-shrink-0" />
              {editingId === project.id ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(project.id)
                    if (e.key === 'Escape') cancelEdit()
                  }}
                  onBlur={() => saveEdit(project.id)}
                  className="px-2 py-1 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <span className="text-sm font-medium truncate">{project.title}</span>
              )}
            </button>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => startEdit(project)}
                className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                title="Rename"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => onOpenConfig(project)}
                className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                title="Settings"
              >
                <Settings size={14} />
              </button>
              <button
                onClick={() => onDeleteProject({ id: project.id, title: project.title })}
                className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                title="Delete project"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}