import { useRef, useCallback, useEffect, useState } from 'react';
import { LyricLine, AudioState, SyncMode } from '@/types/lyrics';
import { Waveform } from './Waveform';
import { formatSeconds } from '@/utils/formatTime';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Upload,
  Volume2,
  VolumeX,
  Music,
  Zap,
  Gauge,
  Youtube,
  Link2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import YouTube from 'react-youtube';
import { YTMusicSearchDialog } from '../LyricsEditor/YTMusicSearchDialog';
import { toast } from 'sonner';

interface AudioControlsProps {
  audioState: AudioState;
  audioUrl: string | null;
  waveformPeaks: number[];
  isLoadingWaveform: boolean;
  onLoadAudio: (url: string) => void;
  onSetAudioFile: (file: File) => void;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onRewind: (seconds?: number) => void;
  onForward: (seconds?: number) => void;
  onCaptureStartTime: () => void;
  onCaptureEndTime: () => void;
  onSetPlaybackRate: (rate: number) => void;
  onSetVolume: (volume: number) => void;
  selectedLineText: string;
  syncMode?: SyncMode;
  onWordSync?: (wordIndex: number, start: number, end: number) => void;
  selectedLine?: LyricLine;
  setYoutubePlayer?: (player: any) => void;
  setAudioState?: (state: any) => void;
  onUpdateProject?: (updates: Partial<{ title: string; artist: string; album?: string }>) => void;
  defaultSearchQuery?: string;
}

export const AudioControls = ({
  audioState,
  audioUrl,
  waveformPeaks,
  isLoadingWaveform,
  onLoadAudio,
  onSetAudioFile,
  onPlayPause,
  onSeek,
  onRewind,
  onForward,
  onCaptureStartTime,
  onCaptureEndTime,
  onSetPlaybackRate,
  onSetVolume,
  selectedLineText,
  syncMode = 'line',
  onWordSync,
  selectedLine,
  setYoutubePlayer,
  setAudioState,
  onUpdateProject,
  defaultSearchQuery,
}: AudioControlsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [syncingWordIndex, setSyncingWordIndex] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const [isYTSearchOpen, setIsYTSearchOpen] = useState(false);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      onSetAudioFile(file);
      const url = URL.createObjectURL(file);
      onLoadAudio(url);
    }
  }, [onSetAudioFile, onLoadAudio]);

  const handleUrlSubmit = useCallback(() => {
    if (urlInput.trim()) {
      onLoadAudio(urlInput.trim());
    }
  }, [urlInput, onLoadAudio]);

  const handleWordSync = useCallback(() => {
    if (!onWordSync || !selectedLine || syncingWordIndex === null) return;

    const currentTimeMs = audioState.currentTime * 1000;
    const currentWordStartTime = selectedLine.words?.[syncingWordIndex]?.startTime || currentTimeMs;
    onWordSync(syncingWordIndex, currentWordStartTime, currentTimeMs);

    const words = selectedLine.text.split(/\s+/).filter(w => w.length > 0);
    if (syncingWordIndex < words.length - 1) {
      setSyncingWordIndex(syncingWordIndex + 1);
    } else {
      setSyncingWordIndex(null);
    }
  }, [onWordSync, selectedLine, syncingWordIndex, audioState.currentTime]);

  const startWordSync = useCallback(() => {
    if (syncMode !== 'word' || !selectedLine) return;
    setSyncingWordIndex(0);
  }, [syncMode, selectedLine]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === '[') { e.preventDefault(); onCaptureStartTime(); return; }
        if (e.key === ']') { e.preventDefault(); onCaptureEndTime(); return; }
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (syncingWordIndex !== null) handleWordSync();
          else onPlayPause();
          break;
        case 'Enter':
          if (syncMode === 'word' && syncingWordIndex === null) { e.preventDefault(); startWordSync(); }
          break;
        case 'ArrowLeft': e.preventDefault(); onRewind(e.shiftKey ? 1 : 5); break;
        case 'ArrowRight': e.preventDefault(); onForward(e.shiftKey ? 1 : 5); break;
        case 'BracketLeft': e.preventDefault(); onCaptureStartTime(); break;
        case 'BracketRight': e.preventDefault(); onCaptureEndTime(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayPause, onRewind, onForward, onCaptureStartTime, onCaptureEndTime, syncingWordIndex, handleWordSync, startWordSync, syncMode]);

  const showWaveform = audioState.isLoaded || isLoadingWaveform;
  const words = selectedLine?.text.split(/\s+/).filter(w => w.length > 0) || [];

  return (
    <div className="relative">
      <div className="h-full flex flex-col bg-panel rounded-xl border border-panel-border overflow-hidden shadow-2xl relative">
        {/* Waveform / YouTube Integration */}
        <div className="h-28 bg-timeline overflow-hidden relative group">
          {showWaveform ? (
            <>
              <Waveform
                duration={audioState.duration}
                currentTime={audioState.currentTime}
                peaks={waveformPeaks}
                isLoading={isLoadingWaveform}
                onSeek={onSeek} />
              {audioState.isYoutube && (
                <div className="absolute top-2 right-2 z-30 flex items-center gap-1">
                  <button
                    onClick={() => setShowVideo(!showVideo)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1 rounded-l bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold transition-all hover:bg-black/80",
                      showVideo ? "text-primary" : "text-white/50"
                    )}
                  >
                    {showVideo ? "Hide Video" : "Show Video"}
                  </button>
                  <div className="flex items-center gap-2 px-2 py-1 rounded-r bg-black/60 backdrop-blur-md border border-red-500/30 border-l-0">
                    <Youtube className="h-3 w-3 text-red-500" />
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-tighter">YouTube Audio Bridge</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-4">
              <div className="flex flex-col md:flex-row items-center gap-6 w-full max-w-2xl">
                <div
                  className="flex-1 w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary/20 rounded-xl hover:border-primary/40 transition-all cursor-pointer p-6 bg-primary/5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Music className="h-8 w-8 text-primary/60 mb-2" />
                  <p className="text-sm font-bold">Local Audio File</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">MP3, WAV, M4A</p>
                </div>

                <div className="flex items-center gap-2 md:flex-col md:gap-1 text-muted-foreground/30 font-bold italic">
                  <div className="h-[1px] w-8 bg-current md:w-[1px] md:h-8" />
                  <span>OR</span>
                  <div className="h-[1px] w-8 bg-current md:w-[1px] md:h-8" />
                </div>

                  <div className="flex-1 w-full bg-muted/30 rounded-xl p-6 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-primary" />
                        Audio Source
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[10px] font-bold text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-1.5"
                        onClick={() => setIsYTSearchOpen(true)}
                      >
                        <Youtube className="h-3 w-3" />
                        SEARCH YT MUSIC
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Paste YouTube Link or Video ID..."
                        className="bg-background/50 h-9 text-xs"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()} />
                      <Button size="sm" onClick={handleUrlSubmit}>Load</Button>
                    </div>
                  </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 p-2 md:p-4 border-t border-panel-border">
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            {/* Time display */}
            <div className="flex-shrink-0 font-mono text-xs md:text-sm">
              <span className="text-foreground">{formatSeconds(audioState.currentTime)}</span>
              <span className="text-muted-foreground"> / {formatSeconds(audioState.duration)}</span>
            </div>

            {/* Playback controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRewind(5)}
                disabled={!audioState.isLoaded}
                title="Rewind 5s (←)"
                className="h-8 w-8 md:h-10 md:w-10"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="default"
                size="icon"
                onClick={onPlayPause}
                disabled={!audioState.isLoaded}
                className="h-9 w-9 md:h-10 md:w-10 relative"
                title="Play/Pause (Space)"
              >
                {audioState.isPlaying ? (
                  <Pause className="h-4 w-4 md:h-5 md:w-5" />
                ) : (
                  <Play className="h-4 w-4 md:h-5 md:w-5 ml-0.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onForward(5)}
                disabled={!audioState.isLoaded}
                title="Forward 5s (→)"
                className="h-8 w-8 md:h-10 md:w-10"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Sync Controls */}
            <div className="flex items-center gap-2">
              {syncMode === 'line' ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onCaptureStartTime}
                    disabled={!audioState.isLoaded}
                    className="bg-primary/10 hover:bg-primary/20 text-primary border-none h-8 px-2 md:px-3"
                  >
                    <span className="kbd mr-1 md:mr-1.5 opacity-50 hidden sm:inline">[</span>
                    Start
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onCaptureEndTime}
                    disabled={!audioState.isLoaded}
                    className="bg-primary/10 hover:bg-primary/20 text-primary border-none h-8 px-2 md:px-3"
                  >
                    <span className="kbd mr-1 md:mr-1.5 opacity-50 hidden sm:inline">]</span>
                    End
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  {syncingWordIndex === null ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={startWordSync}
                      disabled={!audioState.isLoaded || !selectedLine}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground h-8"
                    >
                      <Zap className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Sync Words</span>
                      <span className="sm:hidden">Sync</span>
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleWordSync}
                      className="bg-primary animate-pulse h-8"
                    >
                      {words[syncingWordIndex]}
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="hidden md:block flex-1 border-l pl-4 border-panel-border/30">
              <p className="text-sm text-muted-foreground font-medium truncate">
                {selectedLineText || "Click a line to start syncing"}
              </p>
            </div>

            {/* Spacer on mobile to push to next row */}
            <div className="flex-1 md:hidden" />

            {/* Volume - compact on mobile */}
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="h-8 w-8"
              >
                {isMuted || audioState.volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : audioState.volume * 100]}
                onValueChange={([v]) => {
                  onSetVolume(v / 100);
                  if (v > 0) setIsMuted(false);
                }}
                max={100}
                step={1}
                className="w-20" />
            </div>

            {/* Playback Speed - compact on mobile */}
            <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0 bg-muted/30 p-1.5 rounded-md border border-panel-border/50">
              <Gauge className="h-3.5 w-3.5 text-muted-foreground mr-1" />
              {[0.5, 0.75, 1.0].map((rate) => (
                <Button
                  key={rate}
                  variant={audioState.playbackRate === rate ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-7 px-2 md:px-2.5 text-[10px] font-bold transition-all",
                    audioState.playbackRate === rate
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                  onClick={() => onSetPlaybackRate(rate)}
                >
                  {rate}x
                </Button>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={() => { setUrlInput(""); onLoadAudio(""); }} className="h-8 border-dashed">
              <RefreshCw className="h-3.5 w-3.5 mr-2" /> Change Source
            </Button>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />

      {/* YouTube Player (Hidden by default, floating if showVideo is true) */}
      {audioState.isYoutube && audioState.youtubeId && (
        <div className={cn(
          "absolute bottom-20 left-4 z-[100] transition-all duration-500 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-black",
          showVideo
            ? "w-[240px] aspect-video opacity-100 scale-100 translate-y-0"
            : "w-0 h-0 opacity-0 scale-50 translate-y-10 pointer-events-none"
        )}>
          <YouTube
            videoId={audioState.youtubeId}
            opts={{
              height: '100%',
              width: '100%',
              playerVars: {
                autoplay: 1,
                controls: 0,
                modestbranding: 1,
                disablekb: 1,
                origin: window.location.origin,
                iv_load_policy: 3,
                rel: 0
              },
            }}
            className="w-full h-full"
            onReady={(e) => {
              setYoutubePlayer?.(e.target);
              setAudioState?.((prev: any) => ({ ...prev, duration: e.target.getDuration(), isLoaded: true }));
              e.target.unMute();
              e.target.setVolume(100);
            }}
            onStateChange={(e) => {
              if (e.data === 1) setAudioState?.((prev: any) => ({ ...prev, isPlaying: true }));
              if (e.data === 2) setAudioState?.((prev: any) => ({ ...prev, isPlaying: false }));
            }}
          />
        </div>
      )}
      <YTMusicSearchDialog
        open={isYTSearchOpen}
        onOpenChange={setIsYTSearchOpen}
        initialQuery={defaultSearchQuery || selectedLineText || ""}
        onSelect={(videoId, metadata) => {
          const url = `https://www.youtube.com/watch?v=${videoId}`;
          onLoadAudio(url);
          
          if (onUpdateProject) {
            onUpdateProject({
              title: metadata.title,
              artist: metadata.artist,
              album: metadata.album
            });
          }
          toast.success(`Linked: ${metadata.title}`);
        }}
      />
    </div>
  );
};