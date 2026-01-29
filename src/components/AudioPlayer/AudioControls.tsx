import { useRef, useCallback, useEffect } from 'react';
import { AudioState } from '@/types/lyrics';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AudioControlsProps {
  audioState: AudioState;
  audioUrl: string | null;
  onLoadAudio: (url: string) => void;
  onSetAudioFile: (file: File) => void;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onRewind: (seconds?: number) => void;
  onForward: (seconds?: number) => void;
  onCaptureTimestamp: () => void;
  selectedLineText: string;
}

export const AudioControls = ({
  audioState,
  audioUrl,
  onLoadAudio,
  onSetAudioFile,
  onPlayPause,
  onSeek,
  onRewind,
  onForward,
  onCaptureTimestamp,
  selectedLineText,
}: AudioControlsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      onSetAudioFile(file);
      const url = URL.createObjectURL(file);
      onLoadAudio(url);
    }
  }, [onSetAudioFile, onLoadAudio]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.code === 'Space' && e.shiftKey) {
          e.preventDefault();
          onCaptureTimestamp();
        }
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (e.shiftKey) {
            onCaptureTimestamp();
          } else {
            onPlayPause();
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayPause, onRewind, onForward, onCaptureTimestamp]);

  return (
    <div className="h-full flex flex-col bg-panel rounded-lg border border-panel-border">
      {/* Waveform */}
      <div className="flex-1 bg-timeline rounded-t-lg overflow-hidden">
        {audioState.isLoaded ? (
          <Waveform
            duration={audioState.duration}
            currentTime={audioState.currentTime}
            onSeek={onSeek}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Upload className="h-8 w-8" />
              <span className="text-sm">Upload audio file</span>
            </button>
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
              className="h-10 w-10"
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

          {/* Timestamp capture */}
          <Button
            variant="secondary"
            onClick={onCaptureTimestamp}
            disabled={!audioState.isLoaded}
            className="flex-shrink-0"
            title="Capture timestamp (Shift+Space)"
          >
            <span className="kbd mr-2 text-[10px]">⇧</span>
            <span className="kbd mr-2 text-[10px]">Space</span>
            Sync
          </Button>

          {/* Current line preview */}
          <div className="flex-1 min-w-0 px-4">
            <p className="text-sm text-muted-foreground truncate">
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
