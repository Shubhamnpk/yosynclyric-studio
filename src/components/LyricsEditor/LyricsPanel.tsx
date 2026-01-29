import { KeyboardEvent, useCallback, useRef, useEffect } from 'react';
import { LyricLine, SectionType, LyricsProject } from '@/types/lyrics';
import { LyricLineItem } from './LyricLineItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LyricsPanelProps {
  project: LyricsProject;
  selectedLineId: string | null;
  activeLineId: string | null;
  onSelectLine: (id: string) => void;
  onUpdateLine: (id: string, updates: Partial<LyricLine>) => void;
  onAddLine: (afterId?: string) => void;
  onDeleteLine: (id: string) => void;
  onSetSection: (id: string, section: SectionType) => void;
  onClearTimestamp: (id: string) => void;
  onUpdateProject: (updates: Partial<LyricsProject>) => void;
}

export const LyricsPanel = ({
  project,
  selectedLineId,
  activeLineId,
  onSelectLine,
  onUpdateLine,
  onAddLine,
  onDeleteLine,
  onSetSection,
  onClearTimestamp,
  onUpdateProject,
}: LyricsPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll active line into view
  useEffect(() => {
    if (activeLineId) {
      const element = document.getElementById(`line-${activeLineId}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLineId]);

  const handleKeyDown = useCallback((lineId: string, e: KeyboardEvent<HTMLTextAreaElement>) => {
    const currentIndex = project.lines.findIndex(l => l.id === lineId);
    
    if (e.key === 'ArrowUp' && currentIndex > 0) {
      e.preventDefault();
      onSelectLine(project.lines[currentIndex - 1].id);
    } else if (e.key === 'ArrowDown' && currentIndex < project.lines.length - 1) {
      e.preventDefault();
      onSelectLine(project.lines[currentIndex + 1].id);
    } else if (e.key === 'Backspace' && !project.lines[currentIndex].text && project.lines.length > 1) {
      e.preventDefault();
      onDeleteLine(lineId);
    }
  }, [project.lines, onSelectLine, onDeleteLine]);

  return (
    <div className="h-full flex flex-col bg-panel rounded-lg border border-panel-border">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-panel-border">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Lyrics Editor</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Song Title"
            value={project.title}
            onChange={(e) => onUpdateProject({ title: e.target.value })}
            className="bg-background"
          />
          <Input
            placeholder="Artist Name"
            value={project.artist}
            onChange={(e) => onUpdateProject({ artist: e.target.value })}
            className="bg-background"
          />
        </div>
      </div>

      {/* Lines */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {project.lines.map((line) => (
            <div key={line.id} id={`line-${line.id}`}>
              <LyricLineItem
                line={line}
                isSelected={selectedLineId === line.id}
                isActive={activeLineId === line.id}
                isRTL={project.isRTL}
                onSelect={() => onSelectLine(line.id)}
                onTextChange={(text) => onUpdateLine(line.id, { text })}
                onSectionChange={(section) => onSetSection(line.id, section)}
                onDelete={() => onDeleteLine(line.id)}
                onTimestampClear={() => onClearTimestamp(line.id)}
                onAddLineAfter={() => onAddLine(line.id)}
                onKeyDown={(e) => handleKeyDown(line.id, e)}
              />
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-panel-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddLine()}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Line
        </Button>
      </div>
    </div>
  );
};
