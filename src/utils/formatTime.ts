/**
 * Format milliseconds to MM:SS.mmm
 */
export const formatTimestamp = (ms: number | null): string => {
  if (ms === null) return '--:--.---';
  
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor(ms % 1000);
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
};

/**
 * Format seconds to MM:SS
 */
export const formatSeconds = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Parse timestamp string to milliseconds
 * Supports formats: MM:SS.mmm, MM:SS
 */
export const parseTimestamp = (str: string): number | null => {
  const match = str.match(/^(\d+):(\d{2})(?:\.(\d{1,3}))?$/);
  if (!match) return null;
  
  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  const ms = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
  
  return (minutes * 60 + seconds) * 1000 + ms;
};

/**
 * Format for LRC timestamp [MM:SS.xx]
 */
export const formatLRCTimestamp = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  
  return `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}]`;
};

/**
 * Format for SRT timestamp HH:MM:SS,mmm
 */
export const formatSRTTimestamp = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
};

/**
 * Format for VTT timestamp HH:MM:SS.mmm
 */
export const formatVTTTimestamp = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
};
