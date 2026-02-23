import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioState } from '@/types/lyrics';

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [youtubePlayer, setYoutubePlayer] = useState<any>(null);
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLoaded: false,
    playbackRate: 1.0,
    volume: 1.0,
    isYoutube: false,
    youtubeId: null,
  });

  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [isLoadingWaveform, setIsLoadingWaveform] = useState(false);

  // Extract waveform peaks from audio file
  const extractWaveformPeaks = useCallback(async (url: string) => {
    // Don't extract for YouTube as we can't get the buffer easily
    if (audioState.isYoutube) return;

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
  }, [audioState.isYoutube]);

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

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const generatePseudoWaveform = () => {
    // Return a flat line (straight line) for YouTube/URLs where peaks aren't available
    return Array.from({ length: 200 }, () => 0.05);
  };

  const loadAudio = useCallback((url: string) => {
    // Reset player states
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setYoutubePlayer(null);

    // Reset waveform
    setWaveformPeaks([]);

    if (!url) {
      setAudioState({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        isLoaded: false,
        playbackRate: 1.0,
        volume: audioState.volume,
        isYoutube: false,
        youtubeId: null,
      });
      return null;
    }

    const youtubeId = getYoutubeId(url);
    if (youtubeId) {
      setAudioState(prev => ({
        ...prev,
        isYoutube: true,
        youtubeId,
        isLoaded: true,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
      }));
      setWaveformPeaks(generatePseudoWaveform());
      return null;
    }

    setAudioState(prev => ({ ...prev, isYoutube: false, youtubeId: null }));

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

    // Extract waveform data for blobs/local files
    if (url.startsWith('blob:') || url.startsWith('http')) {
      extractWaveformPeaks(url);
    }

    return audio;
  }, [extractWaveformPeaks]);

  const play = useCallback(() => {
    if (audioState.isYoutube && youtubePlayer) {
      youtubePlayer.playVideo();
    } else {
      audioRef.current?.play();
    }
  }, [audioState.isYoutube, youtubePlayer]);

  const pause = useCallback(() => {
    if (audioState.isYoutube && youtubePlayer) {
      youtubePlayer.pauseVideo();
    } else {
      audioRef.current?.pause();
    }
  }, [audioState.isYoutube, youtubePlayer]);

  const togglePlayPause = useCallback(() => {
    if (audioState.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [audioState.isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (audioState.isYoutube && youtubePlayer) {
      youtubePlayer.seekTo(time);
      setAudioState(prev => ({ ...prev, currentTime: time }));
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
      setAudioState(prev => ({ ...prev, currentTime: time }));
    }
  }, [audioState.isYoutube, youtubePlayer]);

  const seekRelative = useCallback((delta: number) => {
    const current = audioState.currentTime;
    const newTime = Math.max(0, Math.min(current + delta, audioState.duration));
    seek(newTime);
  }, [seek, audioState.currentTime, audioState.duration]);

  const rewind = useCallback((seconds: number = 5) => {
    seekRelative(-seconds);
  }, [seekRelative]);

  const forward = useCallback((seconds: number = 5) => {
    seekRelative(seconds);
  }, [seekRelative]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (audioState.isYoutube && youtubePlayer) {
      youtubePlayer.setPlaybackRate(rate);
      setAudioState(prev => ({ ...prev, playbackRate: rate }));
    } else if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      setAudioState(prev => ({ ...prev, playbackRate: rate }));
    }
  }, [audioState.isYoutube, youtubePlayer]);

  const setVolume = useCallback((volume: number) => {
    setAudioState(prev => ({ ...prev, volume }));
  }, []);

  // Sync volume with audio elements
  useEffect(() => {
    if (audioState.isYoutube && youtubePlayer) {
      try {
        youtubePlayer.setVolume(audioState.volume * 100);
      } catch (e) { }
    } else if (audioRef.current) {
      audioRef.current.volume = audioState.volume;
    }
  }, [audioState.volume, audioState.isYoutube, youtubePlayer]);

  // Sync YouTube time with state
  useEffect(() => {
    let interval: any;
    if (audioState.isYoutube && youtubePlayer && audioState.isPlaying) {
      interval = setInterval(() => {
        try {
          const time = youtubePlayer.getCurrentTime();
          if (time !== undefined) {
            setAudioState(prev => ({ ...prev, currentTime: time }));
          }
        } catch (e) { }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [audioState.isYoutube, youtubePlayer, audioState.isPlaying]);

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
    setAudioState,
    setYoutubePlayer,
    play,
    pause,
    togglePlayPause,
    seek,
    rewind,
    forward,
    setPlaybackRate,
    setVolume,
    audioRef,
    waveformPeaks,
    isLoadingWaveform,
  };
};

