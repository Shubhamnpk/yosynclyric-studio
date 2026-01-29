import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioState } from '@/types/lyrics';

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLoaded: false,
  });

  const loadAudio = useCallback((url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setAudioState(prev => ({
        ...prev,
        duration: audio.duration,
        isLoaded: true,
      }));
    });

    audio.addEventListener('timeupdate', () => {
      setAudioState(prev => ({
        ...prev,
        currentTime: audio.currentTime,
      }));
    });

    audio.addEventListener('ended', () => {
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    });

    audio.addEventListener('play', () => {
      setAudioState(prev => ({ ...prev, isPlaying: true }));
    });

    audio.addEventListener('pause', () => {
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    });

    return audio;
  }, []);

  const play = useCallback(() => {
    audioRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const togglePlayPause = useCallback(() => {
    if (audioState.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [audioState.isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setAudioState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const seekRelative = useCallback((delta: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(audioRef.current.currentTime + delta, audioState.duration));
      seek(newTime);
    }
  }, [seek, audioState.duration]);

  const rewind = useCallback((seconds: number = 5) => {
    seekRelative(-seconds);
  }, [seekRelative]);

  const forward = useCallback((seconds: number = 5) => {
    seekRelative(seconds);
  }, [seekRelative]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    audioState,
    loadAudio,
    play,
    pause,
    togglePlayPause,
    seek,
    rewind,
    forward,
    audioRef,
  };
};
