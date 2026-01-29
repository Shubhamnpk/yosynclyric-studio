import { ExportFormat, LyricsProject } from '@/types/lyrics';
import { downloadLyrics } from '@/utils/exportLyrics';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Download,
  Moon,
  Sun,
  Music2,
  Languages,
  Trash2,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  project: LyricsProject;
  isDark: boolean;
  onToggleDark: () => void;
  onToggleRTL: () => void;
  onClearAllTimestamps: () => void;
}

const exportFormats: { value: ExportFormat; label: string; description: string }[] = [
  { value: 'lrc', label: 'LRC', description: 'Music players' },
  { value: 'srt', label: 'SRT', description: 'Video subtitles' },
  { value: 'vtt', label: 'VTT', description: 'Web video' },
  { value: 'txt', label: 'Plain Text', description: 'Simple text' },
];

export const Header = ({
  project,
  isDark,
  onToggleDark,
  onToggleRTL,
  onClearAllTimestamps,
}: HeaderProps) => {
  const handleExport = (format: ExportFormat) => {
    downloadLyrics(project, format);
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-panel-border bg-panel">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
          <Music2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-semibold text-lg tracking-tight">SyncLyrics</h1>
        </div>
      </div>

      {/* Center - Keyboard shortcuts hint */}
      <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          <kbd className="kbd">Space</kbd> Play/Pause
        </span>
        <span>
          <kbd className="kbd">⇧</kbd>+<kbd className="kbd">Space</kbd> Sync
        </span>
        <span>
          <kbd className="kbd">←</kbd><kbd className="kbd">→</kbd> Seek
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings2 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Theme toggle */}
            <div className="flex items-center justify-between px-2 py-2">
              <div className="flex items-center gap-2">
                {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <Label htmlFor="dark-mode" className="font-normal">Dark mode</Label>
              </div>
              <Switch
                id="dark-mode"
                checked={isDark}
                onCheckedChange={onToggleDark}
              />
            </div>
            
            {/* RTL toggle */}
            <div className="flex items-center justify-between px-2 py-2">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                <Label htmlFor="rtl-mode" className="font-normal">RTL mode</Label>
              </div>
              <Switch
                id="rtl-mode"
                checked={project.isRTL}
                onCheckedChange={onToggleRTL}
              />
            </div>

            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={onClearAllTimestamps}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear all timestamps
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {exportFormats.map((format) => (
              <DropdownMenuItem
                key={format.value}
                onClick={() => handleExport(format.value)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{format.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {format.description}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
