import { useState, useEffect, useCallback } from 'react';
import { useLyricsEditor } from '@/hooks/useLyricsEditor';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Header } from '@/components/Header/Header';
import { LyricsPanel } from '@/components/LyricsEditor/LyricsPanel';
import { AudioControls } from '@/components/AudioPlayer/AudioControls';
import { LyricsPreview } from '@/components/Preview/LyricsPreview';

export const SyncLyricsApp = () => {
  const [isDark, setIsDark] = useState(true);
  
  const {
    project,
    selectedLineId,
    activeLineId,
    setSelectedLineId,
    setActiveLineId,
    updateProject,
    updateLine,
    addLine,
    deleteLine,
    setLineSection,
    setLineTimestamp,
    clearTimestamp,
    clearAllTimestamps,
    setAudioFile,
    getActiveLineByTime,
  } = useLyricsEditor();

  const {
    audioState,
    loadAudio,
    togglePlayPause,
    seek,
    rewind,
    forward,
  } = useAudioPlayer();

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Update active line based on playback
  useEffect(() => {
    if (audioState.isPlaying) {
      const activeId = getActiveLineByTime(audioState.currentTime);
      setActiveLineId(activeId);
    }
  }, [audioState.currentTime, audioState.isPlaying, getActiveLineByTime, setActiveLineId]);

  // Capture timestamp
  const handleCaptureTimestamp = useCallback(() => {
    if (selectedLineId && audioState.isLoaded) {
      setLineTimestamp(selectedLineId, audioState.currentTime * 1000);
    }
  }, [selectedLineId, audioState.currentTime, audioState.isLoaded, setLineTimestamp]);

  const selectedLine = project.lines.find(l => l.id === selectedLineId);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <Header
        project={project}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        onToggleRTL={() => updateProject({ isRTL: !project.isRTL })}
        onClearAllTimestamps={clearAllTimestamps}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Lyrics Editor */}
        <div className="w-1/2 p-3 overflow-hidden">
          <LyricsPanel
            project={project}
            selectedLineId={selectedLineId}
            activeLineId={activeLineId}
            onSelectLine={setSelectedLineId}
            onUpdateLine={updateLine}
            onAddLine={addLine}
            onDeleteLine={deleteLine}
            onSetSection={setLineSection}
            onClearTimestamp={clearTimestamp}
            onUpdateProject={updateProject}
          />
        </div>

        {/* Right panel - Preview */}
        <div className="w-1/2 p-3 pl-0 overflow-hidden">
          <LyricsPreview
            lines={project.lines}
            activeLineId={activeLineId}
            isRTL={project.isRTL}
            title={project.title}
            artist={project.artist}
          />
        </div>
      </div>

      {/* Bottom panel - Audio controls */}
      <div className="flex-shrink-0 p-3 pt-0">
        <AudioControls
          audioState={audioState}
          audioUrl={project.audioUrl}
          onLoadAudio={loadAudio}
          onSetAudioFile={setAudioFile}
          onPlayPause={togglePlayPause}
          onSeek={seek}
          onRewind={rewind}
          onForward={forward}
          onCaptureTimestamp={handleCaptureTimestamp}
          selectedLineText={selectedLine?.text || ''}
        />
      </div>
    </div>
  );
};
