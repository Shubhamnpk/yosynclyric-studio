import { useState } from 'react';
import { LyricsProject, ExportFormat } from '@/types/lyrics';
import { downloadLyrics, exportLyrics } from '@/utils/exportLyrics';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileText, Loader2 } from 'lucide-react';

interface ExportDialogProps {
  project: LyricsProject;
  trigger?: React.ReactNode;
}

export const ExportDialog = ({ project, trigger }: ExportDialogProps) => {
  const [format, setFormat] = useState<ExportFormat>('lrc');
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      downloadLyrics(project, format);
      setIsOpen(false);
    } finally {
      setIsExporting(false);
    }
  };

  const formatDescriptions: Record<ExportFormat, string> = {
    lrc: 'Standard lyrics format with timestamps. Compatible with most music players.',
    srt: 'Subtitle format commonly used for video synchronization.',
    vtt: 'WebVTT format for web video subtitles.',
    txt: 'Plain text without timestamps for basic lyrics display.',
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Lyrics
          </DialogTitle>
          <DialogDescription>
            Choose a format to export "{project.title || 'Untitled'}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Format</label>
            <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lrc">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>LRC (.lrc)</span>
                  </div>
                </SelectItem>
                <SelectItem value="srt">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>SRT (.srt)</span>
                  </div>
                </SelectItem>
                <SelectItem value="vtt">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>VTT (.vtt)</span>
                  </div>
                </SelectItem>
                <SelectItem value="txt">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>TXT (.txt)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formatDescriptions[format]}
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium">Export Preview</p>
            <pre className="text-xs text-muted-foreground overflow-hidden max-h-24 whitespace-pre-wrap">
              {exportLyrics(project, format).slice(0, 200)}
              {exportLyrics(project, format).length > 200 && '...'}
            </pre>
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export & Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
