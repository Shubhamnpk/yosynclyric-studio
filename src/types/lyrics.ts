export type SectionType = 'verse' | 'chorus' | 'bridge' | 'outro' | 'intro' | 'pre-chorus' | 'hook' | null;

export interface WordTiming {
  text: string;
  startTime: number; // relative to line start or absolute? Absolute is easier for playback.
  endTime: number;
}

export interface LyricLine {
  id: string;
  text: string;
  startTime: number | null;  // When line appears (ms)
  endTime: number | null;    // When line disappears (ms)
  section: SectionType;
  words?: WordTiming[];      // Optional word-level timing
}

export type SyncMode = 'line' | 'word';

export interface LyricsProject {
  id: string;
  title: string;
  artist: string;
  album: string;
  year: string;
  genre: string;
  coverArtUrl: string | null;
  lines: LyricLine[];
  audioFile: File | null;
  audioUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  language: string;
  isRTL: boolean;
  syncMode: SyncMode;
}

export type ExportFormat = 'lrc' | 'srt' | 'vtt' | 'txt';

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoaded: boolean;
  playbackRate: number;
  volume: number;
  isYoutube?: boolean;
  youtubeId?: string | null;
}


