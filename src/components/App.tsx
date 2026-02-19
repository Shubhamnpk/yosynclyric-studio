import { useState, useEffect, useCallback } from 'react';
import { useLyricsEditor } from '@/hooks/useLyricsEditor';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Header } from '@/components/Header/Header';
import { createBackup } from '@/utils/projectStorage';
import { LyricsPanel } from '@/components/LyricsEditor/LyricsPanel';
import { AudioControls } from '@/components/AudioPlayer/AudioControls';
import { LyricsPreview } from '@/components/Preview/LyricsPreview';
import { LyricsProject } from '@/types/lyrics';
import { KaraokeMode } from '@/components/Preview/KaraokeMode';
import { MetadataEditorDialog } from '@/components/LyricsEditor/MetadataEditorDialog';
import { VideoExportDialog } from '@/components/VideoExport/VideoExportDialog';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { ArrowLeft, FileText, Eye } from 'lucide-react';
import { getSettings, saveSettings } from '@/utils/settingsStorage';
import { cn } from '@/lib/utils';


interface SyncLyricsAppProps {
  initialProject: LyricsProject;
}

export const SyncLyricsApp = ({ initialProject }: SyncLyricsAppProps) => {
  const settings = getSettings();
  const [isDark, setIsDark] = useState(settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const [isKaraokeMode, setIsKaraokeMode] = useState(false);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [isVideoExportOpen, setIsVideoExportOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const navigate = useNavigate();


  const {
    project,
    selectedLineId,
    activeLineId,
    activeWordIndex,
    setSelectedLineId,
    setActiveLineId,
    setActiveWordIndex,
    updateProject,
    updateLine,
    addLine,
    deleteLine,
    duplicateLine,
    setLineSection,

    setLineStartTime,
    setLineEndTime,
    setWordTiming,
    clearTimestamp,
    clearAllTimestamps,
    setAudioFile,
    getActiveInfoByTime,
    moveLineUp,
    moveLineDown,
    importBulkLyrics,
    importLRC,
    splitLineIntoWords,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useLyricsEditor(initialProject);



  const {
    audioState,
    loadAudio,
    togglePlayPause,
    seek,
    rewind,
    forward,
    setPlaybackRate,
    waveformPeaks,
    isLoadingWaveform,
  } = useAudioPlayer();

  const handleToggleDark = useCallback(() => {
    const newDark = !isDark;
    setIsDark(newDark);
    const currentSettings = getSettings();
    saveSettings({ ...currentSettings, theme: newDark ? 'dark' : 'light' });
  }, [isDark]);

  // Update active line based on playback

  useEffect(() => {
    if (audioState.isPlaying) {
      const { lineId, wordIndex } = getActiveInfoByTime(audioState.currentTime);
      setActiveLineId(lineId);
      setActiveWordIndex(wordIndex);
    }
  }, [audioState.currentTime, audioState.isPlaying, getActiveInfoByTime, setActiveLineId, setActiveWordIndex]);

  // Auto-split line into words when in word mode
  useEffect(() => {
    if (project.syncMode === 'word' && selectedLineId) {
      const line = project.lines.find(l => l.id === selectedLineId);
      if (line && line.text && (!line.words || line.words.length === 0)) {
        splitLineIntoWords(selectedLineId);
      }
    }
  }, [project.syncMode, selectedLineId, project.lines, splitLineIntoWords]);

  // Capture start time for line or word

  const handleCaptureStartTime = useCallback(() => {
    if (selectedLineId && audioState.isLoaded) {
      setLineStartTime(selectedLineId, audioState.currentTime * 1000);
    }
  }, [selectedLineId, audioState.currentTime, audioState.isLoaded, setLineStartTime]);

  // Capture end time for line or word
  const handleCaptureEndTime = useCallback(() => {
    if (selectedLineId && audioState.isLoaded) {
      setLineEndTime(selectedLineId, audioState.currentTime * 1000);
    }
  }, [selectedLineId, audioState.currentTime, audioState.isLoaded, setLineEndTime]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handlePausePlayback = useCallback(() => {
    if (audioState.isPlaying) {
      togglePlayPause();
    }
  }, [audioState.isPlaying, togglePlayPause]);

  const selectedLine = project.lines.find(l => l.id === selectedLineId);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden font-sans">
      {/* Header */}
      <Header
        project={project}
        isDark={isDark}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onToggleDark={handleToggleDark}
        onToggleRTL={() => updateProject({ isRTL: !project.isRTL })}

        onClearAllTimestamps={clearAllTimestamps}
        onToggleSyncMode={(mode) => updateProject({ syncMode: mode })}
        onBackup={() => createBackup(project)}
        onToggleKaraoke={() => setIsKaraokeMode(true)}
        onToggleMetadata={() => setIsMetadataOpen(true)}
        onExportVideo={() => setIsVideoExportOpen(true)}
        leftElement={
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mr-2">
            <ArrowLeft className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Dashboard</span>
          </Button>
        }
      />

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex-shrink-0 px-3 pt-2">
        <div className="flex bg-muted/50 rounded-lg p-1 gap-1">
          <button
            onClick={() => setMobileTab('editor')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
              mobileTab === 'editor'
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="h-4 w-4" />
            Editor
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
              mobileTab === 'preview'
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Lyrics Editor */}
        <div className={cn(
          "p-3 overflow-hidden",
          "md:w-1/2 md:block",
          mobileTab === 'editor' ? "w-full block" : "hidden"
        )}>
          <LyricsPanel
            project={project}
            selectedLineId={selectedLineId}
            activeLineId={activeLineId}
            onSelectLine={setSelectedLineId}
            onUpdateLine={updateLine}
            onAddLine={addLine}
            onDeleteLine={deleteLine}
            onDuplicateLine={duplicateLine}
            onSetSection={setLineSection}

            onClearTimestamp={clearTimestamp}
            onUpdateProject={updateProject}
            onImportBulkLyrics={importBulkLyrics}
            onImportLRC={importLRC}
            onSplitWords={splitLineIntoWords}

            onWordClick={(lineId, wordIndex) => {
              if (audioState.isLoaded) {
                const timeMs = audioState.currentTime * 1000;
                setWordTiming(lineId, wordIndex, timeMs, timeMs + 500);
              }
            }}
            audioDuration={audioState.duration}
          />
        </div>

        {/* Right panel - Preview */}
        <div className={cn(
          "p-3 md:pl-0 overflow-hidden",
          "md:w-1/2 md:block",
          mobileTab === 'preview' ? "w-full block" : "hidden"
        )}>
          <LyricsPreview
            lines={project.lines}
            activeLineId={activeLineId}
            activeWordIndex={activeWordIndex}
            isRTL={project.isRTL}
            title={project.title}
            artist={project.artist}
            syncMode={project.syncMode}
            onToggleKaraoke={() => setIsKaraokeMode(true)}
          />
        </div>
      </div>

      <div className="flex-shrink-0 p-3 pt-0">
        <AudioControls
          audioState={audioState}
          audioUrl={project.audioUrl}
          waveformPeaks={waveformPeaks}
          isLoadingWaveform={isLoadingWaveform}
          onLoadAudio={loadAudio}
          onSetAudioFile={setAudioFile}
          onPlayPause={togglePlayPause}
          onSeek={seek}
          onRewind={rewind}
          onForward={forward}
          onSetPlaybackRate={setPlaybackRate}
          onCaptureStartTime={handleCaptureStartTime}
          onCaptureEndTime={handleCaptureEndTime}
          selectedLineText={selectedLine?.text || ''}
          syncMode={project.syncMode}
          onWordSync={(wordIndex, start, end) => {
            if (selectedLineId) setWordTiming(selectedLineId, wordIndex, start, end);
          }}
          selectedLine={selectedLine}
        />
      </div>

      {isKaraokeMode && (
        <KaraokeMode
          lines={project.lines}
          activeLineId={activeLineId}
          activeWordIndex={activeWordIndex}
          currentTime={audioState.currentTime}
          isPlaying={audioState.isPlaying}
          onPlayPause={togglePlayPause}
          onSeek={seek}
          onClose={() => setIsKaraokeMode(false)}
          title={project.title}
          artist={project.artist}
          duration={audioState.duration}
          syncMode={project.syncMode}
          audioUrl={project.audioUrl}
        />
      )}

      {/* Metadata Editor Dialog */}
      <MetadataEditorDialog
        open={isMetadataOpen}
        onOpenChange={setIsMetadataOpen}
        project={project}
        onUpdateProject={updateProject}
      />

      {/* Video Export Dialog */}
      <VideoExportDialog
        open={isVideoExportOpen}
        onOpenChange={setIsVideoExportOpen}
        project={project}
        onPausePlayback={handlePausePlayback}
      />
    </div>
  );
};
