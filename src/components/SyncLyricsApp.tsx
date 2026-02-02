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
    setLineStartTime,
    setLineEndTime,
    clearTimestamp,
    clearAllTimestamps,
    setAudioFile,
    getActiveLineByTime,
    importBulkLyrics,
  } = useLyricsEditor();

  const {
    audioState,
    loadAudio,
    togglePlayPause,
    seek,
    rewind,
    forward,
    waveformPeaks,
    isLoadingWaveform,
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

  // Capture start time
  const handleCaptureStartTime = useCallback(() => {
    if (selectedLineId && audioState.isLoaded) {
      setLineStartTime(selectedLineId, audioState.currentTime * 1000);
    }
  }, [selectedLineId, audioState.currentTime, audioState.isLoaded, setLineStartTime]);

  // Capture end time
  const handleCaptureEndTime = useCallback(() => {
    if (selectedLineId && audioState.isLoaded) {
      setLineEndTime(selectedLineId, audioState.currentTime * 1000);
    }
  }, [selectedLineId, audioState.currentTime, audioState.isLoaded, setLineEndTime]);

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
            onImportBulkLyrics={importBulkLyrics}
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
          onCaptureStartTime={handleCaptureStartTime}
          onCaptureEndTime={handleCaptureEndTime}
          selectedLineText={selectedLine?.text || ''}
        />
      </div>
    </div>
  );
};
