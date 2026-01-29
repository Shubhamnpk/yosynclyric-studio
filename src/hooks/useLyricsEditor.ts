import { useState, useCallback } from 'react';
import { LyricLine, SectionType, LyricsProject } from '@/types/lyrics';

const generateId = () => Math.random().toString(36).substring(2, 9);

const createEmptyLine = (): LyricLine => ({
  id: generateId(),
  text: '',
  timestamp: null,
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

  const setLineTimestamp = useCallback((lineId: string, timestamp: number) => {
    updateLine(lineId, { timestamp });
    // Auto-select next line after setting timestamp
    setProject(prev => {
      const index = prev.lines.findIndex(l => l.id === lineId);
      if (index < prev.lines.length - 1) {
        setSelectedLineId(prev.lines[index + 1].id);
      }
      return prev;
    });
  }, [updateLine]);

  const clearTimestamp = useCallback((lineId: string) => {
    updateLine(lineId, { timestamp: null });
  }, [updateLine]);

  const clearAllTimestamps = useCallback(() => {
    setProject(prev => ({
      ...prev,
      lines: prev.lines.map(line => ({ ...line, timestamp: null })),
      updatedAt: new Date(),
    }));
  }, []);

  const setAudioFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    updateProject({ audioFile: file, audioUrl: url });
  }, [updateProject]);

  const getActiveLineByTime = useCallback((currentTime: number): string | null => {
    const timestampedLines = project.lines
      .filter(l => l.timestamp !== null)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    for (let i = timestampedLines.length - 1; i >= 0; i--) {
      if ((timestampedLines[i].timestamp || 0) <= currentTime * 1000) {
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
    setLineTimestamp,
    clearTimestamp,
    clearAllTimestamps,
    setAudioFile,
    getActiveLineByTime,
    moveLineUp,
    moveLineDown,
  };
};
