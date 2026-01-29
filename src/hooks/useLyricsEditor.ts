import { useState, useCallback } from 'react';
import { LyricLine, SectionType, LyricsProject } from '@/types/lyrics';

const generateId = () => Math.random().toString(36).substring(2, 9);

const createEmptyLine = (): LyricLine => ({
  id: generateId(),
  text: '',
  startTime: null,
  endTime: null,
  section: null,
});

const initialProject: LyricsProject = {
  id: generateId(),
  title: 'Untitled',
  artist: '',
  lines: [createEmptyLine()],
  audioFile: null,
  audioUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  language: 'en',
  isRTL: false,
};

export const useLyricsEditor = () => {
  const [project, setProject] = useState<LyricsProject>(initialProject);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(project.lines[0]?.id || null);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);

  const updateProject = useCallback((updates: Partial<LyricsProject>) => {
    setProject(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date(),
    }));
  }, []);

  const updateLine = useCallback((lineId: string, updates: Partial<LyricLine>) => {
    setProject(prev => ({
      ...prev,
      lines: prev.lines.map(line =>
        line.id === lineId ? { ...line, ...updates } : line
      ),
      updatedAt: new Date(),
    }));
  }, []);

  const addLine = useCallback((afterLineId?: string) => {
    const newLine = createEmptyLine();
    setProject(prev => {
      const index = afterLineId
        ? prev.lines.findIndex(l => l.id === afterLineId) + 1
        : prev.lines.length;
      const newLines = [...prev.lines];
      newLines.splice(index, 0, newLine);
      return { ...prev, lines: newLines, updatedAt: new Date() };
    });
    setSelectedLineId(newLine.id);
    return newLine.id;
  }, []);

  const deleteLine = useCallback((lineId: string) => {
    setProject(prev => {
      if (prev.lines.length <= 1) return prev;
      const index = prev.lines.findIndex(l => l.id === lineId);
      const newLines = prev.lines.filter(l => l.id !== lineId);
      const newSelectedIndex = Math.min(index, newLines.length - 1);
      setSelectedLineId(newLines[newSelectedIndex]?.id || null);
      return { ...prev, lines: newLines, updatedAt: new Date() };
    });
  }, []);

  const setLineSection = useCallback((lineId: string, section: SectionType) => {
    updateLine(lineId, { section });
  }, [updateLine]);

  const setLineStartTime = useCallback((lineId: string, time: number) => {
    updateLine(lineId, { startTime: time });
  }, [updateLine]);

  const setLineEndTime = useCallback((lineId: string, time: number) => {
    updateLine(lineId, { endTime: time });
    // Auto-advance to next line after setting end time
    setProject(prev => {
      const index = prev.lines.findIndex(l => l.id === lineId);
      if (index < prev.lines.length - 1) {
        setSelectedLineId(prev.lines[index + 1].id);
      }
      return prev;
    });
  }, [updateLine]);

  const clearTimestamp = useCallback((lineId: string) => {
    updateLine(lineId, { startTime: null, endTime: null });
  }, [updateLine]);

  const clearAllTimestamps = useCallback(() => {
    setProject(prev => ({
      ...prev,
      lines: prev.lines.map(line => ({ ...line, startTime: null, endTime: null })),
      updatedAt: new Date(),
    }));
  }, []);

  const setAudioFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    updateProject({ audioFile: file, audioUrl: url });
  }, [updateProject]);

  const getActiveLineByTime = useCallback((currentTime: number): string | null => {
    const currentTimeMs = currentTime * 1000;
    
    // Find line where startTime <= currentTime < endTime
    const activeLine = project.lines.find(l => {
      if (l.startTime === null) return false;
      const endTime = l.endTime ?? Infinity;
      return l.startTime <= currentTimeMs && currentTimeMs < endTime;
    });
    
    if (activeLine) return activeLine.id;
    
    // Fallback: find the most recent line that has started
    const timestampedLines = project.lines
      .filter(l => l.startTime !== null)
      .sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
    
    for (let i = timestampedLines.length - 1; i >= 0; i--) {
      if ((timestampedLines[i].startTime || 0) <= currentTimeMs) {
        return timestampedLines[i].id;
      }
    }
    return null;
  }, [project.lines]);

  const moveLineUp = useCallback((lineId: string) => {
    setProject(prev => {
      const index = prev.lines.findIndex(l => l.id === lineId);
      if (index <= 0) return prev;
      const newLines = [...prev.lines];
      [newLines[index - 1], newLines[index]] = [newLines[index], newLines[index - 1]];
      return { ...prev, lines: newLines, updatedAt: new Date() };
    });
  }, []);

  const moveLineDown = useCallback((lineId: string) => {
    setProject(prev => {
      const index = prev.lines.findIndex(l => l.id === lineId);
      if (index < 0 || index >= prev.lines.length - 1) return prev;
      const newLines = [...prev.lines];
      [newLines[index], newLines[index + 1]] = [newLines[index + 1], newLines[index]];
      return { ...prev, lines: newLines, updatedAt: new Date() };
    });
  }, []);

  const importBulkLyrics = useCallback((text: string, replace: boolean = true) => {
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

    setProject(prev => {
      const newLines = replace ? lines : [...prev.lines.filter(l => l.text.trim()), ...lines];
      return { ...prev, lines: newLines, updatedAt: new Date() };
    });

    setSelectedLineId(lines[0]?.id || null);
  }, []);

  return {
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
    moveLineUp,
    moveLineDown,
    importBulkLyrics,
  };
};
