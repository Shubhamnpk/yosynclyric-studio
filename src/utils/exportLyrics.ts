import { LyricLine, LyricsProject, ExportFormat } from '@/types/lyrics';
import { formatLRCTimestamp, formatSRTTimestamp, formatVTTTimestamp } from './formatTime';

/**
 * Export lyrics to LRC format
 */
export const exportToLRC = (project: LyricsProject): string => {
  const lines: string[] = [];
  
  // Metadata
  if (project.title) lines.push(`[ti:${project.title}]`);
  if (project.artist) lines.push(`[ar:${project.artist}]`);
  lines.push('');
  
  // Lyrics
  const sortedLines = [...project.lines]
    .filter(l => l.text.trim())
    .sort((a, b) => (a.timestamp ?? Infinity) - (b.timestamp ?? Infinity));
  
  for (const line of sortedLines) {
    if (line.timestamp !== null) {
      lines.push(`${formatLRCTimestamp(line.timestamp)}${line.text}`);
    } else {
      lines.push(line.text);
    }
  }
  
  return lines.join('\n');
};

/**
 * Export lyrics to SRT format
 */
export const exportToSRT = (project: LyricsProject): string => {
  const lines: string[] = [];
  const sortedLines = [...project.lines]
    .filter(l => l.text.trim() && l.timestamp !== null)
    .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  
  for (let i = 0; i < sortedLines.length; i++) {
    const line = sortedLines[i];
    const nextLine = sortedLines[i + 1];
    
    const startTime = line.timestamp!;
    // End time is either next line's start time or current + 3 seconds
    const endTime = nextLine?.timestamp ?? (startTime + 3000);
    
    lines.push(`${i + 1}`);
    lines.push(`${formatSRTTimestamp(startTime)} --> ${formatSRTTimestamp(endTime)}`);
    lines.push(line.text);
    lines.push('');
  }
  
  return lines.join('\n');
};

/**
 * Export lyrics to VTT format
 */
export const exportToVTT = (project: LyricsProject): string => {
  const lines: string[] = ['WEBVTT', ''];
  
  if (project.title) {
    lines.push(`NOTE ${project.title} by ${project.artist || 'Unknown'}`, '');
  }
  
  const sortedLines = [...project.lines]
    .filter(l => l.text.trim() && l.timestamp !== null)
    .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  
  for (let i = 0; i < sortedLines.length; i++) {
    const line = sortedLines[i];
    const nextLine = sortedLines[i + 1];
    
    const startTime = line.timestamp!;
    const endTime = nextLine?.timestamp ?? (startTime + 3000);
    
    lines.push(`${formatVTTTimestamp(startTime)} --> ${formatVTTTimestamp(endTime)}`);
    lines.push(line.text);
    lines.push('');
  }
  
  return lines.join('\n');
};

/**
 * Export lyrics to plain text
 */
export const exportToTXT = (project: LyricsProject): string => {
  const lines: string[] = [];
  
  if (project.title) lines.push(project.title);
  if (project.artist) lines.push(`by ${project.artist}`);
  if (project.title || project.artist) lines.push('');
  
  for (const line of project.lines) {
    if (line.section) {
      lines.push(`[${line.section.charAt(0).toUpperCase() + line.section.slice(1)}]`);
    }
    if (line.text.trim()) {
      lines.push(line.text);
    }
  }
  
  return lines.join('\n');
};

/**
 * Export to any supported format
 */
export const exportLyrics = (project: LyricsProject, format: ExportFormat): string => {
  switch (format) {
    case 'lrc':
      return exportToLRC(project);
    case 'srt':
      return exportToSRT(project);
    case 'vtt':
      return exportToVTT(project);
    case 'txt':
      return exportToTXT(project);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
};

/**
 * Download exported lyrics as a file
 */
export const downloadLyrics = (project: LyricsProject, format: ExportFormat): void => {
  const content = exportLyrics(project, format);
  const mimeTypes: Record<ExportFormat, string> = {
    lrc: 'text/plain',
    srt: 'text/plain',
    vtt: 'text/vtt',
    txt: 'text/plain',
  };
  
  const blob = new Blob([content], { type: mimeTypes[format] });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title || 'lyrics'}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
