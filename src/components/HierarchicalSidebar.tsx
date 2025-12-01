// src/components/HierarchicalSidebar.tsx
import { useState } from 'react';
import { 
  Plus, 
  Folder, 
  MessageSquare, 
  ChevronRight, 
  ChevronDown, 
  Settings 
} from 'lucide-react';
import type { Project, Conversation } from '@/types';

// Perfect cn utility — matches your original exactly
const cn = (...inputs: (string | undefined | null | false)[]) => {
  return inputs.filter(Boolean).join(' ');
};

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
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(() => {
    // Auto-expand current project on load
    const set = new Set<string>();
    if (currentProject?.id) set.add(currentProject.id);
    return set;
  });

  const [newProjectTitle, setNewProjectTitle] = useState<string | undefined>(undefined);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const handleCreateProject = async () => {
    if (!newProjectTitle?.trim()) return;
    const project = await onCreateProject(newProjectTitle.trim());
    if (project) {
      setNewProjectTitle(undefined);
      setExpandedProjects(prev => new Set(prev).add(project.id));
    }
  };

  return (
    <div className="w-80 bg-muted/50 border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Workspace</h2>
        <button
          onClick={() => setNewProjectTitle('New Project')}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          title="New Project"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* New Project Input */}
      {newProjectTitle !== undefined && (
        <div className="p-3 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <input
              autoFocus
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject();
                if (e.key === 'Escape') setNewProjectTitle(undefined);
              }}
              onBlur={() => setTimeout(() => setNewProjectTitle(undefined), 150)}
              className="flex-1 bg-transparent outline-none text-sm font-medium"
              placeholder="Project name..."
            />
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="p-12 text-center">
            <Folder className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No projects yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Click + to create one</p>
          </div>
        ) : (
          <div className="py-2">
            {projects.map((project) => {
              const isExpanded = expandedProjects.has(project.id);
              const isActive = currentProject?.id === project.id;
              const projectConvs = conversations.filter(c => c.project_id === project.id);

              return (
                <div key={project.id}>
                  {/* Project Row */}
                  <div
                    className={cn(
                      "group flex items-center gap-2 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-all",
                      isActive 
                        ? "bg-accent text-accent-foreground font-medium" 
                        : "hover:bg-accent/50"
                    )}
                    onClick={() => onSwitchProject(project.id)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProject(project.id);
                      }}
                      className="p-1 -ml-1 opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <Folder className="w-5 h-5 text-muted-foreground" />
                    <span className="flex-1 truncate text-sm">
                      {project.title}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateConversation(project.id);
                      }}
                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background rounded"
                      title="New Chat"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Conversations */}
                  {isExpanded && projectConvs.length > 0 && (
                    <div className="ml-9 border-l-2 border-border/50">
                      {projectConvs.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => onSwitchConversation(conv.id)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 mx-2 rounded-lg cursor-pointer text-sm transition-all",
                            currentConv?.id === conv.id
                              ? "bg-accent text-accent-foreground font-medium"
                              : "hover:bg-accent/50"
                          )}
                        >
                          <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{conv.title}</span>
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

      {/* Settings Footer */}
      <div className="p-4 border-t border-border">
        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium">
          <Settings className="w-5 h-5" />
          Settings
        </button>
      </div>
    </div>
  );
};

export default HierarchicalSidebar;