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
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [isLoadingWaveform, setIsLoadingWaveform] = useState(false);

  // Extract waveform peaks from audio file
  const extractWaveformPeaks = useCallback(async (url: string) => {
    setIsLoadingWaveform(true);
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Mix to mono if stereo
      const channelData = audioBuffer.numberOfChannels > 1
        ? mixToMono(audioBuffer)
        : audioBuffer.getChannelData(0);
      
      const samplesCount = 200;
      const peaks: number[] = [];
      const blockSize = Math.floor(channelData.length / samplesCount);
      
      for (let i = 0; i < samplesCount; i++) {
        const start = i * blockSize;
        let max = 0;
        for (let j = 0; j < blockSize; j++) {
          const abs = Math.abs(channelData[start + j] || 0);
          if (abs > max) max = abs;
        }
        peaks.push(max);
      }
      
      // Normalize peaks to 0-1 range
      const maxPeak = Math.max(...peaks, 0.01);
      const normalizedPeaks = peaks.map(p => p / maxPeak);
      
      setWaveformPeaks(normalizedPeaks);
      audioContext.close();
    } catch (err) {
      console.error('Failed to extract waveform:', err);
      setWaveformPeaks([]);
    } finally {
      setIsLoadingWaveform(false);
    }
  }, []);

  const mixToMono = (audioBuffer: AudioBuffer): Float32Array => {
    const length = audioBuffer.length;
    const result = new Float32Array(length);
    const channels = audioBuffer.numberOfChannels;
    
    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (let c = 0; c < channels; c++) {
        sum += audioBuffer.getChannelData(c)[i];
      }
      result[i] = sum / channels;
    }
    
    return result;
  };

  const loadAudio = useCallback((url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    // Reset waveform for new audio
    setWaveformPeaks([]);
    
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

    // Extract waveform data
    extractWaveformPeaks(url);

    return audio;
  }, [extractWaveformPeaks]);

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
    waveformPeaks,
    isLoadingWaveform,
  };
};
