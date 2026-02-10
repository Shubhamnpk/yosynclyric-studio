import { useState, useCallback, useEffect } from 'react';
import { LyricLine, SectionType, LyricsProject } from '@/types/lyrics';
import * as mmb from 'music-metadata-browser';
import { parseLRC } from '@/utils/parseLRC';
import { saveProject } from '@/utils/projectStorage';


const generateId = () => Math.random().toString(36).substring(2, 9);

const createEmptyLine = (): LyricLine => ({
  id: generateId(),
  text: '',
  startTime: null,
  endTime: null,
  section: null,
});

export const useLyricsEditor = (initialProject: LyricsProject) => {
  const [history, setHistory] = useState<{
    past: LyricsProject[];
    present: LyricsProject;
    future: LyricsProject[];
  }>({
    past: [],
    present: initialProject,
    future: [],
  });

  const project = history.present;

  const [selectedLineId, setSelectedLineId] = useState<string | null>(project.lines[0]?.id || null);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);

  // Helper to update project and handle history
  const updateState = useCallback((newProject: LyricsProject | ((prev: LyricsProject) => LyricsProject), addToHistory = true) => {
    setHistory(prev => {
      const next = typeof newProject === 'function' ? newProject(prev.present) : newProject;
      if (next === prev.present) return prev;

      if (!addToHistory) {
        return { ...prev, present: next };
      }

      return {
        past: [...prev.past.slice(-49), prev.present], // Keep last 50 steps
        present: next,
        future: [],
      };
    });
  }, []);

  // Auto-save to localStorage when project changes
  useEffect(() => {
    saveProject(project);
  }, [project]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const updateProject = useCallback((updates: Partial<LyricsProject>) => {
    updateState(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date(),
    }), false); // Metadata changes like sync mode (tabs) don't need history
  }, [updateState]);

  const updateLine = useCallback((lineId: string, updates: Partial<LyricLine>) => {
    updateState(prev => ({
      ...prev,
      lines: prev.lines.map(line =>
        line.id === lineId ? { ...line, ...updates } : line
      ),
      updatedAt: new Date(),
    }));
  }, [updateState]);

  const setWordTiming = useCallback((lineId: string, wordIndex: number, startTime: number, endTime: number) => {
    updateState(prev => ({
      ...prev,
      lines: prev.lines.map(line => {
        if (line.id !== lineId) return line;
        const words = [...(line.words || [])];

        // If words array doesn't exist or is empty, try to populate it from text
        if (words.length === 0 && line.text) {
          const splitWords = line.text.split(/\s+/).filter(w => w.length > 0);
          splitWords.forEach((tw, i) => {
            words[i] = { text: tw, startTime: 0, endTime: 0 };
          });
        }

        if (words[wordIndex]) {
          words[wordIndex] = { ...words[wordIndex], startTime, endTime };
        }

        return { ...line, words };
      }),
      updatedAt: new Date(),
    }), true); // Word timing IS a meaningful change for undo/redo
  }, [updateState]);


  const addLine = useCallback((afterLineId?: string) => {
    const newLine = createEmptyLine();
    updateState(prev => {
      const index = afterLineId
        ? prev.lines.findIndex(l => l.id === afterLineId) + 1
        : prev.lines.length;
      const newLines = [...prev.lines];
      newLines.splice(index, 0, newLine);
      return { ...prev, lines: newLines, updatedAt: new Date() };
    });
    setSelectedLineId(newLine.id);
    return newLine.id;
  }, [updateState]);

  const deleteLine = useCallback((lineId: string) => {
    updateState(prev => {
      if (prev.lines.length <= 1) return prev;
      const index = prev.lines.findIndex(l => l.id === lineId);
      const newLines = prev.lines.filter(l => l.id !== lineId);
      const newSelectedIndex = Math.min(index, newLines.length - 1);
      setSelectedLineId(newLines[newSelectedIndex]?.id || null);
      return { ...prev, lines: newLines, updatedAt: new Date() };
    });
  }, [updateState]);

  const duplicateLine = useCallback((lineId: string) => {
    updateState(prev => {
      const index = prev.lines.findIndex(l => l.id === lineId);
      if (index === -1) return prev;

      const sourceLine = prev.lines[index];
      const newLine: LyricLine = {
        ...sourceLine,
        id: generateId(),
        // Keep text but maybe clear timestamps? User said "duplicate the lyrics", 
        // usually implies keeping text. Keeping timestamps might be confusing 
        // but often requested. Let's keep text and clear timestamps for the copy.
        startTime: null,
        endTime: null,
        words: sourceLine.words?.map(w => ({ ...w, startTime: 0, endTime: 0 })),
      };

      const newLines = [...prev.lines];
      newLines.splice(index + 1, 0, newLine);
      return { ...prev, lines: newLines, updatedAt: new Date() };
    });
  }, [updateState]);


  const setLineSection = useCallback((lineId: string, section: SectionType) => {
    updateLine(lineId, { section });
  }, [updateLine]);

  const setLineStartTime = useCallback((lineId: string, time: number) => {
    updateLine(lineId, { startTime: time });
  }, [updateLine]);

  const setLineEndTime = useCallback((lineId: string, time: number) => {
    updateLine(lineId, { endTime: time });
    // Auto-advance to next line after setting end time
    setHistory(prev => {
      const index = prev.present.lines.findIndex(l => l.id === lineId);
      if (index < prev.present.lines.length - 1) {
        setSelectedLineId(prev.present.lines[index + 1].id);
      }
      return prev;
    });
  }, [updateLine]);

  const clearTimestamp = useCallback((lineId: string) => {
    updateLine(lineId, { startTime: null, endTime: null, words: [] });
  }, [updateLine]);

  const clearAllTimestamps = useCallback(() => {
    updateState(prev => ({
      ...prev,
      lines: prev.lines.map(line => ({ ...line, startTime: null, endTime: null, words: [] })),
      updatedAt: new Date(),
    }));
  }, [updateState]);

  const setAudioFile = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    const updates: Partial<LyricsProject> = { audioFile: file, audioUrl: url };

    // Auto extract metadata if currently "Untitled" or empty
    if (project.title === 'Untitled' || !project.title.trim()) {
      try {
        const metadata = await mmb.parseBlob(file);
        const { title, artist, album, year, genre, picture } = metadata.common;

        if (title) updates.title = title;
        if (artist) updates.artist = artist;
        if (album) updates.album = album;
        if (year) updates.year = String(year);
        if (genre && genre.length > 0) updates.genre = genre[0];

        // Extract cover art
        if (picture && picture.length > 0) {
          const pic = picture[0];
          const blob = new Blob([new Uint8Array(pic.data)], { type: pic.format });
          updates.coverArtUrl = URL.createObjectURL(blob);
        }

        // If metadata is still missing, fallback to filename
        if (!updates.title) {
          const fileName = file.name.replace(/\.[^/.]+$/, "");
          const separatorIndex = fileName.indexOf(' - ');

          if (separatorIndex !== -1) {
            updates.title = fileName.substring(0, separatorIndex).trim();
            updates.artist = updates.artist || fileName.substring(separatorIndex + 3).trim();
          } else {
            updates.title = fileName.trim();
          }
        }
      } catch (error) {
        console.error('Error parsing audio metadata:', error);
        // Fallback to filename on error
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        const separatorIndex = fileName.indexOf(' - ');
        if (separatorIndex !== -1) {
          updates.title = fileName.substring(0, separatorIndex).trim();
          updates.artist = fileName.substring(separatorIndex + 3).trim();
        } else {
          updates.title = fileName.trim();
        }
      }
    } else {
      // Even if title is set, try to extract cover art and other missing fields
      try {
        const metadata = await mmb.parseBlob(file);
        const { album, year, genre, picture } = metadata.common;

        if (!project.album && album) updates.album = album;
        if (!project.year && year) updates.year = String(year);
        if (!project.genre && genre && genre.length > 0) updates.genre = genre[0];

        if (!project.coverArtUrl && picture && picture.length > 0) {
          const pic = picture[0];
          const blob = new Blob([new Uint8Array(pic.data)], { type: pic.format });
          updates.coverArtUrl = URL.createObjectURL(blob);
        }
      } catch (error) {
        console.error('Error extracting additional metadata:', error);
      }
    }

    updateProject(updates);
  }, [project.title, project.album, project.year, project.genre, project.coverArtUrl, updateProject]);



  const getActiveInfoByTime = useCallback((currentTime: number): { lineId: string | null, wordIndex: number | null } => {
    const currentTimeMs = currentTime * 1000;

    // Find line where startTime <= currentTime < endTime
    const activeLine = project.lines.find(l => {
      if (l.startTime === null) return false;
      const endTime = l.endTime ?? Infinity;
      return l.startTime <= currentTimeMs && currentTimeMs < endTime;
    });

    if (activeLine) {
      // Find active word
      let wordIndex = null;
      if (activeLine.words && activeLine.words.length > 0) {
        wordIndex = activeLine.words.findIndex(w =>
          w.startTime <= currentTimeMs && currentTimeMs < w.endTime
        );
        if (wordIndex === -1) wordIndex = null;
      }
      return { lineId: activeLine.id, wordIndex };
    }

    // Fallback: find the most recent line that has started
    const timestampedLines = project.lines
      .filter(l => l.startTime !== null)
      .sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

    for (let i = timestampedLines.length - 1; i >= 0; i--) {
      if ((timestampedLines[i].startTime || 0) <= currentTimeMs) {
        return { lineId: timestampedLines[i].id, wordIndex: null };
      }
    }
    return { lineId: null, wordIndex: null };
  }, [project.lines]);

  const moveLineUp = useCallback((lineId: string) => {
    updateState(prev => {
      const index = prev.lines.findIndex(l => l.id === lineId);
      if (index <= 0) return prev;
      const newLines = [...prev.lines];
      [newLines[index - 1], newLines[index]] = [newLines[index], newLines[index - 1]];
      return { ...prev, lines: newLines, updatedAt: new Date() };
    });
  }, [updateState]);

  const moveLineDown = useCallback((lineId: string) => {
    updateState(prev => {
      const index = prev.lines.findIndex(l => l.id === lineId);
      if (index < 0 || index >= prev.lines.length - 1) return prev;
      const newLines = [...prev.lines];
      [newLines[index], newLines[index + 1]] = [newLines[index + 1], newLines[index]];
      return { ...prev, lines: newLines, updatedAt: new Date() };
    });
  }, [updateState]);

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

    updateState(prev => {
      const newLines = replace ? lines : [...prev.lines.filter(l => l.text.trim()), ...lines];
      return { ...prev, lines: newLines, updatedAt: new Date() };
    });

    setSelectedLineId(lines[0]?.id || null);
  }, [updateState]);

  const importLRC = useCallback((text: string) => {
    const { lines, metadata } = parseLRC(text);
    if (lines.length === 0) return;

    updateState(prev => {
      const updates: any = {
        lines,
        updatedAt: new Date(),
      };
      if (metadata.title && (!prev.title || prev.title === 'Untitled')) updates.title = metadata.title;
      if (metadata.artist && !prev.artist) updates.artist = metadata.artist;

      return { ...prev, ...updates };
    });

    setSelectedLineId(lines[0]?.id || null);
  }, [updateState]);

  return {
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
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    splitLineIntoWords: useCallback((lineId: string) => {
      updateState(prev => ({
        ...prev,
        lines: prev.lines.map(line => {
          if (line.id !== lineId || !line.text) return line;
          const splitWords = line.text.split(/\s+/).filter(w => w.length > 0);
          const words = splitWords.map(tw => ({ text: tw, startTime: 0, endTime: 0 }));
          return { ...line, words };
        }),
        updatedAt: new Date(),
      }));
    }, [updateState]),
  };
};


