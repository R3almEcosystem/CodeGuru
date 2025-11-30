// src/components/ConversationsList.tsx
import { Plus, MessageSquare, MoreVertical, Edit2, Trash2 } from 'lucide-react'
import { Conversation } from '../types'
import { useState } from 'react'

interface Props {
  currentConvId: string | null
  conversations: Conversation[]
  onSelectConv: (id: string) => void
  onCreateNew: () => void
  onDeleteConv: (id: string) => void
  onUpdateTitle: (id: string, title: string) => void
  currentProjectName?: string; // Optional folder name for dynamic text
}

export function ConversationsList({
  currentConvId,
  conversations,
  onSelectConv,
  onCreateNew,
  onDeleteConv,
  onUpdateTitle,
  currentProjectName,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const startEdit = (conv: Conversation) => {
    setEditingId(conv.id)
    setEditTitle(conv.title)
  }

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onUpdateTitle(editingId, editTitle.trim())
    }
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 pt-4 pb-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Conversations</h3>
            {currentProjectName && (
              <p className="text-xs text-gray-500 mt-0.5">
                in {currentProjectName}
              </p>
            )}
          </div>
          <button
            onClick={onCreateNew}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="New conversation"
          >
            <Plus size={18} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No conversations yet</p>
            <button
              onClick={onCreateNew}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Start a new one
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {conversations.map((conv) => (
              <li key={conv.id}>
                <div className="group relative flex items-center px-4 py-3 hover:bg-gray-50 transition-colors">
                  {editingId === conv.id ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit()
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      onBlur={saveEdit}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <>
                      <button
                        onClick={() => onSelectConv(conv.id)}
                        className={`flex-1 text-left text-sm truncate ${
                          currentConvId === conv.id
                            ? 'font-medium text-gray-900'
                            : 'text-gray-700'
                        }`}
                      >
                        {conv.title}
                      </button>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(conv)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Rename"
                        >
                          <Edit2 size={14} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => onDeleteConv(conv.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}