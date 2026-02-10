import { KeyboardEvent, useCallback, useState } from 'react';
import { LyricLine, SectionType, LyricsProject } from '@/types/lyrics';
import { LyricLineItem } from './LyricLineItem';
import { BulkImportDialog } from './BulkImportDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, FileText, Upload, UploadCloud } from 'lucide-react';
import { LRCLibSearchDialog } from './LRCLibSearchDialog';
import { PublishDialog } from './PublishDialog';

import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface LyricsPanelProps {
  project: LyricsProject;
  selectedLineId: string | null;
  activeLineId: string | null;
  onSelectLine: (id: string) => void;
  onUpdateLine: (id: string, updates: Partial<LyricLine>) => void;
  onAddLine: (afterId?: string) => void;
  onDeleteLine: (id: string) => void;
  onDuplicateLine: (id: string) => void;
  onSetSection: (id: string, section: SectionType) => void;

  onClearTimestamp: (id: string) => void;
  onUpdateProject: (updates: Partial<LyricsProject>) => void;
  onImportBulkLyrics: (text: string, replace: boolean) => void;
  onImportLRC: (text: string) => void;
  onSplitWords: (id: string) => void;

  onWordClick: (lineId: string, wordIndex: number) => void;
  audioDuration?: number;
}

export const LyricsPanel = ({
  project,
  selectedLineId,
  activeLineId,
  onSelectLine,
  onUpdateLine,
  onAddLine,
  onDeleteLine,
  onDuplicateLine,
  onSetSection,

  onClearTimestamp,
  onUpdateProject,
  onImportBulkLyrics,
  onImportLRC,
  onSplitWords,
  onWordClick,
  audioDuration,
}: LyricsPanelProps) => {

  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const [lrcLibDialogOpen, setLrcLibDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);


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

  const hasExistingLyrics = project.lines.some(l => l.text.trim());

  return (
    <div className="h-full flex flex-col bg-panel rounded-lg border border-panel-border">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-panel-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Lyrics Editor</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPublishDialogOpen(true)}
            >
              <UploadCloud className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>

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
      </div >

      {/* Lines */}
      < ScrollArea className="flex-1" >
        <div className="p-4 space-y-1">
          {project.lines.map((line) => (
            <div key={line.id} id={`line-${line.id}`}>
              <LyricLineItem
                line={line}
                isSelected={selectedLineId === line.id}
                isActive={activeLineId === line.id}
                isRTL={project.isRTL}
                syncMode={project.syncMode}
                onSelect={() => onSelectLine(line.id)}
                onTextChange={(text) => onUpdateLine(line.id, { text })}
                onSectionChange={(section) => onSetSection(line.id, section)}
                onDelete={() => onDeleteLine(line.id)}
                onTimestampClear={() => onClearTimestamp(line.id)}
                onAddLineAfter={() => onAddLine(line.id)}
                onDuplicate={() => onDuplicateLine(line.id)}
                onKeyDown={(e) => handleKeyDown(line.id, e)}

                onSplitWords={() => onSplitWords(line.id)}
                onWordClick={(wordIndex) => onWordClick(line.id, wordIndex)}
              />
            </div>
          ))}

        </div>
      </ScrollArea >


      {/* Footer */}
      < div className="flex-shrink-0 p-4 border-t border-panel-border" >
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddLine()}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Line
        </Button>
      </div >

      {/* Bulk Import Dialog */}
      < BulkImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={onImportBulkLyrics}
        hasExistingLyrics={hasExistingLyrics}
        onImportLRC={onImportLRC}
        onSearchOnline={() => setLrcLibDialogOpen(true)}
      />


      <LRCLibSearchDialog
        open={lrcLibDialogOpen}
        onOpenChange={setLrcLibDialogOpen}
        onImport={(lyrics, synced) => {
          if (synced) {
            onImportLRC(lyrics);
          } else {
            onImportBulkLyrics(lyrics, true);
          }
          toast('Lyrics imported successfully');
        }}
        initialQuery={project.title && project.artist ? `${project.title} ${project.artist}` : undefined}
      />

      <PublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        project={project}
        audioDuration={audioDuration}
      />
    </div>
  );
};
