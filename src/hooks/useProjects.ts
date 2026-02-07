import { useState, useEffect, useCallback } from 'react';
import { LyricsProject } from '@/types/lyrics';

const STORAGE_KEY = 'synclyric-studio-projects';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useProjects = () => {
  const [projects, setProjects] = useState<LyricsProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load projects from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const projectsWithDates = parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }));
        setProjects(projectsWithDates);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
  }, [projects, isLoading]);

  const createProject = useCallback((title: string = 'Untitled'): LyricsProject => {
    const newProject: LyricsProject = {
      id: generateId(),
      title,
      artist: '',
      lines: [{ id: generateId(), text: '', startTime: null, endTime: null, section: null }],
      audioFile: null,
      audioUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      language: 'en',
      isRTL: false,
    };
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<LyricsProject>) => {
    setProjects(prev => prev.map(p => 
      p.id === id 
        ? { ...p, ...updates, updatedAt: new Date() }
        : p
    ));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  const duplicateProject = useCallback((id: string): LyricsProject | null => {
    const project = projects.find(p => p.id === id);
    if (!project) return null;

    const duplicated: LyricsProject = {
      ...project,
      id: generateId(),
      title: `${project.title} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProjects(prev => [duplicated, ...prev]);
    return duplicated;
  }, [projects]);

  return {
    projects,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
  };
};
