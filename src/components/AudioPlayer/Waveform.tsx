import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface WaveformProps {
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  className?: string;
}

export const Waveform = ({ duration, currentTime, onSeek, className }: WaveformProps) => {
  // Generate pseudo-random waveform bars
  const bars = useMemo(() => {
    const count = 100;
    const heights: number[] = [];
    
    // Create a more realistic waveform pattern
    for (let i = 0; i < count; i++) {
      const base = 20;
      const variance = 60;
      // Add some patterns to make it look more realistic
      const pattern = Math.sin(i * 0.2) * 20 + Math.sin(i * 0.5) * 10;
      const random = Math.random() * variance;
      heights.push(Math.max(10, Math.min(100, base + pattern + random)));
    }
    
    return heights;
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * duration);
  };

  return (
    <div
      className={cn('h-20 flex items-center gap-0.5 cursor-pointer px-2', className)}
      onClick={handleClick}
    >
      {bars.map((height, i) => {
        const barProgress = (i / bars.length) * 100;
        const isPlayed = barProgress <= progress;
        
        return (
          <div
            key={i}
            className={cn(
              'flex-1 rounded-full transition-colors duration-100',
              isPlayed ? 'bg-waveform' : 'bg-waveform-inactive'
            )}
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
};
