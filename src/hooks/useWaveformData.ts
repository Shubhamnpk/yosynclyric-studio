import { useState, useCallback } from 'react';

export interface WaveformData {
  peaks: number[];
  duration: number;
}

export const useWaveformData = () => {
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractPeaks = useCallback(async (audioBuffer: AudioBuffer, samplesCount: number = 200): Promise<number[]> => {
    // Use mono or mix down stereo
    const channelData = audioBuffer.numberOfChannels > 1
      ? mixToMono(audioBuffer)
      : audioBuffer.getChannelData(0);
    
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
    return peaks.map(p => p / maxPeak);
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

  const loadFromUrl = useCallback(async (url: string, samplesCount: number = 200) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const peaks = await extractPeaks(audioBuffer, samplesCount);
      
      const data: WaveformData = {
        peaks,
        duration: audioBuffer.duration,
      };
      
      setWaveformData(data);
      audioContext.close();
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load audio';
      setError(message);
      console.error('Waveform extraction error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [extractPeaks]);

  const loadFromFile = useCallback(async (file: File, samplesCount: number = 200) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const peaks = await extractPeaks(audioBuffer, samplesCount);
      
      const data: WaveformData = {
        peaks,
        duration: audioBuffer.duration,
      };
      
      setWaveformData(data);
      audioContext.close();
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load audio';
      setError(message);
      console.error('Waveform extraction error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [extractPeaks]);

  const reset = useCallback(() => {
    setWaveformData(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    waveformData,
    isLoading,
    error,
    loadFromUrl,
    loadFromFile,
    reset,
  };
};
