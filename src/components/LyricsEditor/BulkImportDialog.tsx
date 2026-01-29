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
import { FileText, Upload } from 'lucide-react';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (text: string, replace: boolean) => void;
  hasExistingLyrics: boolean;
}

export const BulkImportDialog = ({
  open,
  onOpenChange,
  onImport,
  hasExistingLyrics,
}: BulkImportDialogProps) => {
  const [text, setText] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(true);

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
      <DialogContent className="sm:max-w-2xl">
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
            className="min-h-[300px] font-mono text-sm"
            autoFocus
          />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {lineCount} {lineCount === 1 ? 'line' : 'lines'} detected
            </span>

            {hasExistingLyrics && (
              <div className="flex items-center gap-2">
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!text.trim()}>
            <Upload className="h-4 w-4 mr-2" />
            Import {lineCount} {lineCount === 1 ? 'Line' : 'Lines'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
