import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileText, Upload, Music, Search } from 'lucide-react';


interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (text: string, replace: boolean) => void;
  hasExistingLyrics: boolean;
  onImportLRC?: (text: string) => void;
  onSearchOnline?: () => void;
}

export const BulkImportDialog = ({
  open,
  onOpenChange,
  onImport,
  hasExistingLyrics,
  onImportLRC,
  onSearchOnline,
}: BulkImportDialogProps) => {
  const [text, setText] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(true);

  const handleLRCFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportLRC) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          onImportLRC(content);
          onOpenChange(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImport = () => {
    if (text.trim()) {
      onImport(text, replaceExisting);
      setText('');
      onOpenChange(false);
    }
  };

  const lineCount = text.split('\n').filter(line => line.trim()).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Lyrics
          </DialogTitle>
          <DialogDescription>
            Paste your lyrics below. Each line will become a separate entry that you can sync with timestamps.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder={`Paste your lyrics here...\n\nExample:\nHello, it's me\nI was wondering if after all these years\nYou'd like to meet`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px] md:min-h-[300px] font-mono text-sm"
            autoFocus
          />

          {(onImportLRC || onSearchOnline) && (
            <div className="flex flex-col sm:flex-row gap-2">
              {onImportLRC && (
                <div className="relative flex-1">
                  <input
                    type="file"
                    accept=".lrc"
                    onChange={handleLRCFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  />
                  <Button variant="outline" size="sm" className="w-full">
                    <Music className="h-4 w-4 mr-2" />
                    Upload LRC File
                  </Button>
                </div>
              )}
              {onSearchOnline && (
                <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                  onOpenChange(false);
                  onSearchOnline();
                }}>
                  <Search className="h-4 w-4 mr-2" />
                  Search Online
                </Button>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground order-2 sm:order-1">
              {lineCount} {lineCount === 1 ? 'line' : 'lines'} detected
            </span>

            {hasExistingLyrics && (
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Checkbox
                  id="replace"
                  checked={replaceExisting}
                  onCheckedChange={(checked) => setReplaceExisting(checked === true)}
                />
                <Label htmlFor="replace" className="text-sm cursor-pointer">
                  Replace existing lyrics
                </Label>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="w-full sm:w-auto" onClick={handleImport} disabled={!text.trim()}>
            <Upload className="h-4 w-4 mr-2" />
            Import {lineCount} {lineCount === 1 ? 'Line' : 'Lines'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
