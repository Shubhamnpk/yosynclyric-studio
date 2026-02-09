import { AppSettings, DEFAULT_SETTINGS } from '@/types/settings';

const SETTINGS_KEY = 'synclyric_settings';

export const getSettings = (): AppSettings => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch (e) {
        return DEFAULT_SETTINGS;
    }
};

export const saveSettings = (settings: AppSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    // Apply theme if changed
    if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else if (settings.theme === 'light') {
        document.documentElement.classList.remove('dark');
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
    }
};
