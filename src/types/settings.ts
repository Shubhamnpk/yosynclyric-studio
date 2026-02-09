export interface AppSettings {
    defaultSyncMode: 'line' | 'word';
    autoSplitWords: boolean;
    theme: 'light' | 'dark' | 'system';
    exportFormat: 'lrc' | 'srt' | 'vtt' | 'txt';
    defaultLanguage: string;
    autoSaveInterval: number; // in seconds
}

export const DEFAULT_SETTINGS: AppSettings = {
    defaultSyncMode: 'line',
    autoSplitWords: true,
    theme: 'system',
    exportFormat: 'lrc',
    defaultLanguage: 'en',
    autoSaveInterval: 30,
};
