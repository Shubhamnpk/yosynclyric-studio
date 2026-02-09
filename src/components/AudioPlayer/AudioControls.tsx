import { useRef, useCallback, useEffect, useState } from 'react';
import { LyricLine, AudioState, SyncMode } from '@/types/lyrics';
import { Waveform } from './Waveform';
import { formatSeconds } from '@/utils/formatTime';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  selectedLineText: string;
  syncMode?: SyncMode;
  onWordSync?: (wordIndex: number, startTime: number, endTime: number) => void;
  selectedLine?: LyricLine;
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
  selectedLineText,
  syncMode = 'line',
  onWordSync,
  selectedLine,
}: AudioControlsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [syncingWordIndex, setSyncingWordIndex] = useState<number | null>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      onSetAudioFile(file);
      const url = URL.createObjectURL(file);
      onLoadAudio(url);
    }
  }, [onSetAudioFile, onLoadAudio]);

  const handleWordSync = useCallback(() => {
    if (!onWordSync || !selectedLine || syncingWordIndex === null) return;

    const words = selectedLine.text.split(/\s+/).filter(w => w.length > 0);
    const currentTimeMs = audioState.currentTime * 1000;

    // Set end time for current word and start time for next
    const currentWordStartTime = selectedLine.words?.[syncingWordIndex]?.startTime || currentTimeMs;
    onWordSync(syncingWordIndex, currentWordStartTime, currentTimeMs);

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
      // Don't capture if typing in an input (except for specific shortcuts)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Allow [ and ] in inputs for timestamp capture
        if (e.key === '[') {
          e.preventDefault();
          onCaptureStartTime();
          return;
        }
        if (e.key === ']') {
          e.preventDefault();
          onCaptureEndTime();
          return;
        }
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (syncingWordIndex !== null) {
            handleWordSync();
          } else {
            onPlayPause();
          }
          break;
        case 'Enter':
          if (syncMode === 'word' && syncingWordIndex === null) {
            e.preventDefault();
            startWordSync();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onRewind(e.shiftKey ? 1 : 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          onForward(e.shiftKey ? 1 : 5);
          break;
        case 'BracketLeft': // [
          e.preventDefault();
          onCaptureStartTime();
          break;
        case 'BracketRight': // ]
          e.preventDefault();
          onCaptureEndTime();
          break;
        case 'KeyS':
          if (e.shiftKey) {
            e.preventDefault();
            onCaptureStartTime();
          }
          break;
        case 'KeyE':
          if (e.shiftKey) {
            e.preventDefault();
            onCaptureEndTime();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayPause, onRewind, onForward, onCaptureStartTime, onCaptureEndTime, syncingWordIndex, handleWordSync, startWordSync, syncMode]);

  const showWaveform = audioState.isLoaded || isLoadingWaveform;
  const words = selectedLine?.text.split(/\s+/).filter(w => w.length > 0) || [];

  return (
    <div className="h-full flex flex-col bg-panel rounded-lg border border-panel-border">
      {/* Waveform Area */}
      <div className="h-24 bg-timeline rounded-t-lg overflow-hidden">
        {showWaveform ? (
          <Waveform
            duration={audioState.duration}
            currentTime={audioState.currentTime}
            peaks={waveformPeaks}
            isLoading={isLoadingWaveform}
            onSeek={onSeek}
          />
        ) : (
          <div
            className="h-full flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="flex items-center gap-3">
                <Music className="h-8 w-8 text-primary/60" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Upload your audio file</p>
                  <p className="text-xs text-muted-foreground">
                    MP3, WAV, OGG, M4A supported
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                Choose File
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 p-4 border-t border-panel-border">
        <div className="flex items-center gap-4">
          {/* Time display */}
          <div className="flex-shrink-0 w-24 font-mono text-sm">
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
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={onPlayPause}
              disabled={!audioState.isLoaded}
              className="h-10 w-10 relative"
              title="Play/Pause (Space)"
            >
              {audioState.isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onForward(5)}
              disabled={!audioState.isLoaded}
              title="Forward 5s (→)"
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
                  className="bg-primary/10 hover:bg-primary/20 text-primary border-none"
                >
                  <span className="kbd mr-1.5 opacity-50">[</span>
                  Start
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onCaptureEndTime}
                  disabled={!audioState.isLoaded}
                  className="bg-primary/10 hover:bg-primary/20 text-primary border-none"
                >
                  <span className="kbd mr-1.5 opacity-50">]</span>
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
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Sync Words (Enter)
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleWordSync}
                    className="bg-primary animate-pulse"
                  >
                    Next Word: {words[syncingWordIndex]} (Space)
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Current line preview */}
          <div className="flex-1 min-w-0 px-4">
            <p className="text-sm text-muted-foreground truncate font-medium">
              {selectedLineText || 'Select a line to sync'}
            </p>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="h-8 w-8"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              onValueChange={([v]) => {
                setVolume(v / 100);
                setIsMuted(false);
              }}
              max={100}
              step={1}
              className="w-20"
            />
          </div>

          {/* Playback Speed */}
          <div className="flex items-center gap-1.5 flex-shrink-0 bg-muted/30 p-1.5 rounded-md border border-panel-border/50">
            <Gauge className="h-3.5 w-3.5 text-muted-foreground mr-1" />
            {[0.25, 0.5, 0.75, 1.0].map((rate) => (
              <Button
                key={rate}
                variant={audioState.playbackRate === rate ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-7 px-2.5 text-[10px] font-bold transition-all",
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


          {/* Upload button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0"
          >
            <Upload className="h-4 w-4 mr-2" />
            {audioState.isLoaded ? 'Change' : 'Upload'}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

