import { useState } from 'react';
import { LyricsProject } from '@/types/lyrics';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Music2, 
  MoreVertical, 
  Trash2, 
  Copy, 
  Edit3,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardProps {
  projects: LyricsProject[];
  onSelectProject: (project: LyricsProject) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  isLoading: boolean;
}

export const Dashboard = ({
  projects,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onDuplicateProject,
  isLoading,
}: DashboardProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      onDeleteProject(id);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM d, yyyy');
  };

  const getSyncedCount = (project: LyricsProject) => {
    return project.lines.filter(l => l.startTime !== null).length;
  };

  const getTotalLines = (project: LyricsProject) => {
    return project.lines.length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Music2 className="h-6 w-6" />
                SyncLyric Studio
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your synchronized lyrics projects
              </p>
            </div>
            <Button onClick={onCreateProject} size="lg">
              <Edit3 className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="container mx-auto px-6 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <Music2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first lyrics project to get started
            </p>
            <Button onClick={onCreateProject} size="lg">
              <Edit3 className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card 
                key={project.id}
                className="cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => onSelectProject(project)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate">
                        {project.title || 'Untitled'}
                      </CardTitle>
                      <CardDescription>
                        {project.artist || 'Unknown artist'}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateProject(project.id);
                        }}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => handleDelete(project.id, e)}
                          className="text-destructive focus:text-destructive"
                          disabled={deletingId === project.id}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deletingId === project.id ? 'Deleting...' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDate(project.updatedAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">
                        {getSyncedCount(project)}/{getTotalLines(project)}
                      </span>
                      <span>lines synced</span>
                    </div>
                  </div>
                  {project.audioUrl && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 w-fit">
                      <Music2 className="h-3 w-3" />
                      Audio attached
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
