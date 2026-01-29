export type SectionType = 'verse' | 'chorus' | 'bridge' | 'outro' | 'intro' | 'pre-chorus' | 'hook' | null;

export interface LyricLine {
  id: string;
  text: string;
  startTime: number | null;  // When line appears (ms)
  endTime: number | null;    // When line disappears (ms)
  section: SectionType;
}

export interface LyricsProject {
  id: string;
  title: string;
  artist: string;
  lines: LyricLine[];
  audioFile: File | null;
  audioUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  language: string;
  isRTL: boolean;
}

export type ExportFormat = 'lrc' | 'srt' | 'vtt' | 'txt';

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoaded: boolean;
}
