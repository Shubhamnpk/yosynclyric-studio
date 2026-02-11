import { LyricsProject } from '@/types/lyrics';
import { getSettings } from './settingsStorage';


const STORAGE_KEY = 'synclyric_projects';
const BACKUP_KEY = 'synclyric_backups';

export const saveProject = (project: LyricsProject) => {
    const projects = getAllProjects();
    const existingIndex = projects.findIndex(p => p.id === project.id);

    // We can't save File objects to localStorage
    const projectToSave = {
        ...project,
        audioFile: null, // Always null when saving
        updatedAt: new Date().toISOString(),
        createdAt: project.createdAt instanceof Date ? project.createdAt.toISOString() : project.createdAt,
    };

    if (existingIndex >= 0) {
        projects[existingIndex] = projectToSave as any;
    } else {
        projects.push(projectToSave as any);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};


export const createBackup = (project: LyricsProject) => {
    try {
        const stored = localStorage.getItem(BACKUP_KEY);
        const backups = stored ? JSON.parse(stored) : [];

        const newBackup = {
            ...project,
            backupId: Math.random().toString(36).substring(2, 9),
            backupAt: new Date().toISOString(),
            audioFile: null,
        };

        // Keep last 10 backups total
        const updatedBackups = [newBackup, ...backups].slice(0, 10);
        localStorage.setItem(BACKUP_KEY, JSON.stringify(updatedBackups));
    } catch (e) {
        console.error('Failed to create backup', e);
    }
};

export const getBackups = (): (LyricsProject & { backupId: string, backupAt: string })[] => {
    const stored = localStorage.getItem(BACKUP_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch (e) {
        return [];
    }
};

export const getAllProjects = (): LyricsProject[] => {

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
        const projects = JSON.parse(stored);
        return projects.map((p: any) => ({
            ...p,
            // Ensure backward compatibility for new metadata fields
            album: p.album || '',
            year: p.year || '',
            genre: p.genre || '',
            coverArtUrl: p.coverArtUrl || null,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
        }));
    } catch (e) {
        console.error('Failed to parse projects from localStorage', e);
        return [];
    }
};

export const getProjectById = (id: string): LyricsProject | null => {
    const projects = getAllProjects();
    return projects.find(p => p.id === id) || null;
};

export const deleteProject = (id: string) => {
    const projects = getAllProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const createNewProject = (id: string, title: string = 'Untitled'): LyricsProject => {
    const settings = getSettings();
    return {
        id,
        title,
        artist: '',
        album: '',
        year: '',
        genre: '',
        coverArtUrl: null,
        lines: [{
            id: Math.random().toString(36).substring(2, 9),
            text: '',
            startTime: null,
            endTime: null,
            section: null,
        }],
        audioFile: null,
        audioUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        language: settings.defaultLanguage,
        isRTL: false,
        syncMode: settings.defaultSyncMode,
    };
};

