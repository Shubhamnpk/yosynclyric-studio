import { useState, useEffect, useCallback, useRef } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useProjects } from '@/hooks/useProjects';
import { Header } from '@/components/Header/Header';
import { Dashboard } from '@/components/Dashboard/Dashboard';
import { LyricsPanel } from '@/components/LyricsEditor/LyricsPanel';
import { AudioControls } from '@/components/AudioPlayer/AudioControls';
import { LyricsPreview } from '@/components/Preview/LyricsPreview';
import { LyricLine, SectionType, LyricsProject } from '@/types/lyrics';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

const generateId = () => Math.random().toString(36).substring(2, 9);

const createEmptyLine = (): LyricLine => ({
  id: generateId(),
  text: '',
  startTime: null,
  endTime: null,
  section: null,
});

export const SyncLyricsApp = () => {
  const [isDark, setIsDark] = useState(true);
  const [currentProject, setCurrentProject] = useState<LyricsProject | null>(null);
  
  // Editor state that syncs with current project
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [audioUrl, setAudioUrlState] = useState<string | null>(null);
  
  const {
    projects,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
  } = useProjects();

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

  // Sync state when current project changes
  useEffect(() => {
    if (currentProject) {
      setAudioUrlState(currentProject.audioUrl);
      // Set first line as selected if no selection
      if (!selectedLineId && currentProject.lines.length > 0) {
        setSelectedLineId(currentProject.lines[0].id);
      }
    }
  }, [currentProject?.id]);

  // Line management functions
  const handleUpdateLine = useCallback((lineId: string, updates: Partial<LyricLine>) => {
    if (!currentProject) return;
    
    const updatedLines = currentProject.lines.map(line =>
      line.id === lineId ? { ...line, ...updates } : line
    );
    
    const updatedProject = { ...currentProject, lines: updatedLines, updatedAt: new Date() };
    setCurrentProject(updatedProject);
    updateProject(currentProject.id, updatedProject);
  }, [currentProject, updateProject]);

  const handleAddLine = useCallback((afterLineId?: string) => {
    if (!currentProject) return;
    
    const newLine = createEmptyLine();
    const index = afterLineId
      ? currentProject.lines.findIndex(l => l.id === afterLineId) + 1
      : currentProject.lines.length;
    
    const newLines = [...currentProject.lines];
    newLines.splice(index, 0, newLine);
    
    const updatedProject = { ...currentProject, lines: newLines, updatedAt: new Date() };
    setCurrentProject(updatedProject);
    updateProject(currentProject.id, updatedProject);
    setSelectedLineId(newLine.id);
  }, [currentProject, updateProject]);

  const handleDeleteLine = useCallback((lineId: string) => {
    if (!currentProject) return;
    if (currentProject.lines.length <= 1) return;
    
    const newLines = currentProject.lines.filter(l => l.id !== lineId);
    const newSelectedIndex = Math.min(
      currentProject.lines.findIndex(l => l.id === lineId),
      newLines.length - 1
    );
    
    const updatedProject = { ...currentProject, lines: newLines, updatedAt: new Date() };
    setCurrentProject(updatedProject);
    updateProject(currentProject.id, updatedProject);
    setSelectedLineId(newLines[newSelectedIndex]?.id || null);
  }, [currentProject, updateProject]);

  const handleSetSection = useCallback((lineId: string, section: SectionType) => {
    handleUpdateLine(lineId, { section });
  }, [handleUpdateLine]);

  const handleSetLineStartTime = useCallback((lineId: string, time: number) => {
    // Check if current line already has a start time, if so advance to next line first
    const currentLine = currentProject?.lines.find(l => l.id === lineId);
    if (currentLine && currentLine.startTime !== null) {
      // Already has start time, move to next line
      const currentIndex = currentProject!.lines.findIndex(l => l.id === lineId);
      if (currentIndex < currentProject!.lines.length - 1) {
        const nextLine = currentProject!.lines[currentIndex + 1];
        setSelectedLineId(nextLine.id);
      }
      return;
    }
    handleUpdateLine(lineId, { startTime: time });
  }, [handleUpdateLine, currentProject]);

  const handleSetLineEndTime = useCallback((lineId: string, time: number) => {
    handleUpdateLine(lineId, { endTime: time });
    // Auto-advance to next line after setting end time
    if (currentProject) {
      const currentIndex = currentProject.lines.findIndex(l => l.id === lineId);
      if (currentIndex < currentProject.lines.length - 1) {
        const nextLine = currentProject.lines[currentIndex + 1];
        setSelectedLineId(nextLine.id);
      }
    }
  }, [handleUpdateLine, currentProject]);

  const handleClearTimestamp = useCallback((lineId: string) => {
    handleUpdateLine(lineId, { startTime: null, endTime: null });
  }, [handleUpdateLine]);

  const handleClearAllTimestamps = useCallback(() => {
    if (!currentProject) return;
    
    const updatedLines = currentProject.lines.map(line => ({
      ...line,
      startTime: null,
      endTime: null,
    }));
    
    const updatedProject = { ...currentProject, lines: updatedLines, updatedAt: new Date() };
    setCurrentProject(updatedProject);
    updateProject(currentProject.id, updatedProject);
  }, [currentProject, updateProject]);

  const handleUpdateProject = useCallback((updates: Partial<LyricsProject>) => {
    if (!currentProject) return;
    
    const updatedProject = { ...currentProject, ...updates, updatedAt: new Date() };
    setCurrentProject(updatedProject);
    updateProject(currentProject.id, updatedProject);
  }, [currentProject, updateProject]);

  const handleImportBulkLyrics = useCallback((text: string, replace: boolean = true) => {
    if (!currentProject) return;
    
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(text => ({
        id: generateId(),
        text,
        startTime: null,
        endTime: null,
        section: null,
      }));

    if (lines.length === 0) return;

    const newLines = replace ? lines : [...currentProject.lines.filter(l => l.text.trim()), ...lines];
    const updatedProject = { ...currentProject, lines: newLines, updatedAt: new Date() };
    setCurrentProject(updatedProject);
    updateProject(currentProject.id, updatedProject);
    setSelectedLineId(lines[0]?.id || null);
  }, [currentProject, updateProject]);

  const handleSetAudioFile = useCallback((file: File) => {
    if (!currentProject) return;
    
    const url = URL.createObjectURL(file);
    handleUpdateProject({ audioFile: file, audioUrl: url });
    setAudioUrlState(url);
  }, [currentProject, handleUpdateProject]);

  // Get active line by time
  const getActiveLineByTime = useCallback((currentTime: number): string | null => {
    if (!currentProject) return null;
    
    const currentTimeMs = currentTime * 1000;
    
    const activeLine = currentProject.lines.find(l => {
      if (l.startTime === null) return false;
      const endTime = l.endTime ?? Infinity;
      return l.startTime <= currentTimeMs && currentTimeMs < endTime;
    });
    
    if (activeLine) return activeLine.id;
    
    const timestampedLines = currentProject.lines
      .filter(l => l.startTime !== null)
      .sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
    
    for (let i = timestampedLines.length - 1; i >= 0; i--) {
      if ((timestampedLines[i].startTime || 0) <= currentTimeMs) {
        return timestampedLines[i].id;
      }
    }
    return null;
  }, [currentProject]);

  // Update active line based on playback
  useEffect(() => {
    if (audioState.isPlaying) {
      const activeId = getActiveLineByTime(audioState.currentTime);
      setActiveLineId(activeId);
    }
  }, [audioState.currentTime, audioState.isPlaying, getActiveLineByTime]);

  // Capture start time
  const handleCaptureStartTime = useCallback(() => {
    if (selectedLineId && audioState.isLoaded) {
      handleSetLineStartTime(selectedLineId, audioState.currentTime * 1000);
    }
  }, [selectedLineId, audioState.currentTime, audioState.isLoaded, handleSetLineStartTime]);

  // Capture end time
  const handleCaptureEndTime = useCallback(() => {
    if (selectedLineId && audioState.isLoaded) {
      handleSetLineEndTime(selectedLineId, audioState.currentTime * 1000);
    }
  }, [selectedLineId, audioState.currentTime, audioState.isLoaded, handleSetLineEndTime]);

  // Handle project selection
  const handleSelectProject = useCallback((project: LyricsProject) => {
    setCurrentProject(project);
    setSelectedLineId(project.lines[0]?.id || null);
    setActiveLineId(null);
  }, []);

  // Handle creating new project
  const handleCreateProject = useCallback(() => {
    const newProject = createProject('Untitled');
    setCurrentProject(newProject);
    setSelectedLineId(newProject.lines[0]?.id || null);
    setActiveLineId(null);
    toast.success('New project created');
  }, [createProject]);

  // Handle going back to dashboard
  const handleBackToDashboard = useCallback(() => {
    setCurrentProject(null);
    setSelectedLineId(null);
    setActiveLineId(null);
  }, []);

  // Handle manual save
  const handleSave = useCallback(() => {
    if (currentProject) {
      // Re-save the current project to ensure it's persisted
      updateProject(currentProject.id, currentProject);
      toast.success('Project saved');
    }
  }, [currentProject, updateProject]);

  // Handle project deletion
  const handleDeleteProject = useCallback((id: string) => {
    deleteProject(id);
    if (currentProject?.id === id) {
      setCurrentProject(null);
    }
    toast.success('Project deleted');
  }, [currentProject, deleteProject]);

  // Handle project duplication
  const handleDuplicateProject = useCallback((id: string) => {
    const duplicated = duplicateProject(id);
    if (duplicated) {
      toast.success('Project duplicated');
    }
  }, [duplicateProject]);

  // Determine which project to display
  const displayProject = currentProject;
  const selectedLine = displayProject?.lines.find(l => l.id === selectedLineId);

  // Show dashboard if no project is selected
  if (!currentProject && projects.length > 0) {
    return (
      <>
        <Dashboard
          projects={projects}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onDuplicateProject={handleDuplicateProject}
          isLoading={isLoading}
        />
        <Toaster />
      </>
    );
  }

  // Empty state - no projects at all
  if (projects.length === 0 && !currentProject) {
    return (
      <>
        <Dashboard
          projects={[]}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onDuplicateProject={handleDuplicateProject}
          isLoading={isLoading}
        />
        <Toaster />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <Header
        project={displayProject!}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        onToggleRTL={() => handleUpdateProject({ isRTL: !displayProject!.isRTL })}
        onClearAllTimestamps={handleClearAllTimestamps}
        onBackToDashboard={handleBackToDashboard}
        onSave={handleSave}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Lyrics Editor */}
        <div className="w-1/2 p-3 overflow-hidden">
          <LyricsPanel
            project={displayProject!}
            selectedLineId={selectedLineId}
            activeLineId={activeLineId}
            onSelectLine={setSelectedLineId}
            onUpdateLine={handleUpdateLine}
            onAddLine={handleAddLine}
            onDeleteLine={handleDeleteLine}
            onSetSection={handleSetSection}
            onClearTimestamp={handleClearTimestamp}
            onUpdateProject={handleUpdateProject}
            onImportBulkLyrics={handleImportBulkLyrics}
          />
        </div>

        {/* Right panel - Preview */}
        <div className="w-1/2 p-3 pl-0 overflow-hidden">
          <LyricsPreview
            lines={displayProject!.lines}
            activeLineId={activeLineId}
            isRTL={displayProject!.isRTL}
            title={displayProject!.title}
            artist={displayProject!.artist}
          />
        </div>
      </div>

      <div className="flex-shrink-0 p-3 pt-0">
        <AudioControls
          audioState={audioState}
          audioUrl={audioUrl}
          waveformPeaks={waveformPeaks}
          isLoadingWaveform={isLoadingWaveform}
          onLoadAudio={loadAudio}
          onSetAudioFile={handleSetAudioFile}
          onPlayPause={togglePlayPause}
          onSeek={seek}
          onRewind={rewind}
          onForward={forward}
          onCaptureStartTime={handleCaptureStartTime}
          onCaptureEndTime={handleCaptureEndTime}
          selectedLineText={selectedLine?.text || ''}
        />
      </div>
      <Toaster />
    </div>
  );
};
