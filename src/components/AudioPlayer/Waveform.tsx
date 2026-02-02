import { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { formatSeconds } from '@/utils/formatTime';
import { Loader2 } from 'lucide-react';

interface WaveformProps {
  duration: number;
  currentTime: number;
  peaks: number[];
  isLoading: boolean;
  onSeek: (time: number) => void;
  className?: string;
}

export const Waveform = ({ 
  duration, 
  currentTime, 
  peaks, 
  isLoading,
  onSeek, 
  className 
}: WaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || peaks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { width, height } = dimensions;

    // Set canvas size with device pixel ratio for sharpness
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const progress = duration > 0 ? currentTime / duration : 0;
    const progressX = progress * width;

    // Waveform settings
    const barWidth = Math.max(2, (width / peaks.length) - 1);
    const gap = 1;
    const centerY = height / 2;
    const maxBarHeight = (height / 2) - 20; // Leave space for time markers

    // Colors from CSS variables
    const playedColor = getComputedStyle(document.documentElement).getPropertyValue('--waveform').trim();
    const unplayedColor = getComputedStyle(document.documentElement).getPropertyValue('--waveform-inactive').trim();

    // Draw waveform bars
    peaks.forEach((peak, i) => {
      const x = (i / peaks.length) * width;
      const barHeight = Math.max(4, peak * maxBarHeight);
      
      const isPlayed = x <= progressX;
      ctx.fillStyle = isPlayed ? `hsl(${playedColor})` : `hsl(${unplayedColor})`;

      // Draw mirrored bars (top and bottom from center)
      ctx.fillRect(x, centerY - barHeight, barWidth, barHeight);
      ctx.fillRect(x, centerY, barWidth, barHeight);
    });

    // Draw playhead
    if (progress > 0 && progress < 1) {
      ctx.fillStyle = `hsl(${playedColor})`;
      ctx.fillRect(progressX - 1, 10, 2, height - 20);
      
      // Playhead cap
      ctx.beginPath();
      ctx.arc(progressX, 10, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw time markers
    const markerCount = Math.ceil(duration / 30); // Every 30 seconds
    const interval = duration > 180 ? 60 : duration > 60 ? 30 : 15; // Adjust interval based on duration
    const actualMarkerCount = Math.floor(duration / interval);
    
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    
    for (let i = 0; i <= actualMarkerCount; i++) {
      const time = i * interval;
      const x = (time / duration) * width;
      
      // Don't draw markers too close to edges
      if (x < 30 || x > width - 30) continue;
      
      const isPlayed = x <= progressX;
      ctx.fillStyle = isPlayed ? `hsl(${playedColor})` : `hsla(${unplayedColor}, 0.7)`;
      
      // Tick mark
      ctx.fillRect(x, height - 12, 1, 6);
      
      // Time label
      ctx.fillText(formatSeconds(time), x, height - 2);
    }

    // Draw hover indicator
    if (hoverX !== null && hoverTime !== null) {
      ctx.fillStyle = `hsl(${playedColor})`;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(hoverX - 1, 10, 2, height - 20);
      ctx.globalAlpha = 1;
    }

  }, [peaks, currentTime, duration, dimensions, hoverX, hoverTime]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    
    setHoverX(x);
    setHoverTime(Math.max(0, Math.min(duration, time)));
  }, [duration]);

  const handleMouseLeave = useCallback(() => {
    setHoverX(null);
    setHoverTime(null);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * duration);
  }, [duration, onSeek]);

  if (isLoading) {
    return (
      <div className={cn('h-full flex items-center justify-center', className)}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Analyzing audio...</span>
        </div>
      </div>
    );
  }

  if (peaks.length === 0) {
    return (
      <div className={cn('h-full flex items-center justify-center', className)}>
        <span className="text-sm text-muted-foreground">No waveform data</span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn('h-full relative cursor-pointer select-none', className)}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
      
      {/* Hover tooltip */}
      {hoverTime !== null && hoverX !== null && (
        <div 
          className="absolute bottom-16 px-2 py-1 bg-popover border border-border rounded text-xs font-mono shadow-lg pointer-events-none transform -translate-x-1/2"
          style={{ left: hoverX }}
        >
          {formatSeconds(hoverTime)}
        </div>
      )}
    </div>
  );
};
