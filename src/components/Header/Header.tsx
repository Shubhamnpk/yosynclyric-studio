import { ExportFormat, LyricsProject, SyncMode } from '@/types/lyrics';
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
  ListMusic,
  Zap,
  Undo2,
  Redo2,
  Save,
  Presentation,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HeaderProps {
  project: LyricsProject;
  isDark: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onToggleDark: () => void;
  onToggleRTL: () => void;
  onClearAllTimestamps: () => void;
  onToggleSyncMode: (mode: SyncMode) => void;
  onBackup: () => void;
  onToggleKaraoke: () => void;
  leftElement?: React.ReactNode;
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
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onToggleDark,
  onToggleRTL,
  onClearAllTimestamps,
  onToggleSyncMode,
  onBackup,
  onToggleKaraoke,
  leftElement,
}: HeaderProps) => {
  const handleExport = (format: ExportFormat) => {
    downloadLyrics(project, format);
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-panel-border bg-panel">
      {/* Logo */}
      <div className="flex items-center gap-3">
        {leftElement}
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
          <Music2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-semibold text-lg tracking-tight">SyncLyrics</h1>
        </div>
      </div>

      {/* Undo/Redo & Mode Switcher */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        <Tabs
          value={project.syncMode}
          onValueChange={(v) => onToggleSyncMode(v as SyncMode)}
          className="w-[180px]"
        >
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="line" className="text-[10px] uppercase font-bold tracking-wider gap-1.5">
              <ListMusic className="h-3.5 w-3.5" />
              Line
            </TabsTrigger>
            <TabsTrigger value="word" className="text-[10px] uppercase font-bold tracking-wider gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Word
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>


      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleKaraoke}
          className="mr-2 h-9 px-3 font-medium text-xs hidden sm:flex items-center gap-2"
        >
          <Presentation className="h-4 w-4" />
          Karaoke
        </Button>

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
                <Label htmlFor="dark-mode" className="font-normal text-sm">Dark mode</Label>
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
                <Label htmlFor="rtl-mode" className="font-normal text-sm">RTL mode</Label>
              </div>
              <Switch
                id="rtl-mode"
                checked={project.isRTL}
                onCheckedChange={onToggleRTL}
              />
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onBackup}>
              <Save className="h-4 w-4 mr-2" />
              Create manual backup
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onToggleKaraoke} className="sm:hidden">
              <Presentation className="h-4 w-4 mr-2" />
              Karaoke Mode
            </DropdownMenuItem>

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
            <Button variant="default" size="sm" className="shadow-md">
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
                  <span className="font-medium text-sm">{format.label}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
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


