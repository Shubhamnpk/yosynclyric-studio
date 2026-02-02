import { useRef, useEffect, useState, useCallback, forwardRef } from 'react';
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

export const Waveform = forwardRef<HTMLDivElement, WaveformProps>(({ 
  duration, 
  currentTime, 
  peaks, 
  isLoading,
  onSeek, 
  className 
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    };

    // Initial measurement
    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

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

    // If no peaks, draw placeholder bars
    const displayPeaks = peaks.length > 0 ? peaks : generatePlaceholderPeaks(100);
    
    const progress = duration > 0 ? currentTime / duration : 0;
    const progressX = progress * width;

    // Waveform settings
    const barWidth = Math.max(2, (width / displayPeaks.length) - 1);
    const centerY = height / 2;
    const maxBarHeight = (height / 2) - 16; // Leave space for time markers

    // Get colors from CSS variables
    const computedStyle = getComputedStyle(document.documentElement);
    const playedColorRaw = computedStyle.getPropertyValue('--waveform').trim();
    const unplayedColorRaw = computedStyle.getPropertyValue('--waveform-inactive').trim();
    
    // Fallback colors if CSS variables are empty
    const playedColor = playedColorRaw ? `hsl(${playedColorRaw})` : 'hsl(38, 92%, 50%)';
    const unplayedColor = unplayedColorRaw ? `hsl(${unplayedColorRaw})` : 'hsl(0, 0%, 30%)';

    // Draw waveform bars
    displayPeaks.forEach((peak, i) => {
      const x = (i / displayPeaks.length) * width;
      const barHeight = Math.max(4, peak * maxBarHeight);
      
      const isPlayed = x <= progressX;
      ctx.fillStyle = isPlayed ? playedColor : unplayedColor;

      // Draw mirrored bars (top and bottom from center)
      ctx.fillRect(x, centerY - barHeight, barWidth, barHeight);
      ctx.fillRect(x, centerY, barWidth, barHeight);
    });

    // Draw center line
    ctx.fillStyle = unplayedColor;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, centerY - 0.5, width, 1);
    ctx.globalAlpha = 1;

    // Draw playhead
    if (progress > 0 && progress <= 1 && duration > 0) {
      ctx.fillStyle = playedColor;
      ctx.fillRect(progressX - 1, 8, 2, height - 16);
      
      // Playhead cap
      ctx.beginPath();
      ctx.arc(progressX, 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw time markers
    if (duration > 0) {
      const interval = duration > 180 ? 60 : duration > 60 ? 30 : 15;
      const actualMarkerCount = Math.floor(duration / interval);
      
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      
      for (let i = 0; i <= actualMarkerCount; i++) {
        const time = i * interval;
        const x = (time / duration) * width;
        
        // Don't draw markers too close to edges
        if (x < 25 || x > width - 25) continue;
        
        const isPlayed = x <= progressX;
        ctx.fillStyle = isPlayed ? playedColor : unplayedColor;
        ctx.globalAlpha = isPlayed ? 0.8 : 0.5;
        
        // Tick mark
        ctx.fillRect(x, height - 10, 1, 5);
        
        // Time label
        ctx.fillText(formatSeconds(time), x, height - 1);
      }
      ctx.globalAlpha = 1;
    }

    // Draw hover indicator
    if (hoverX !== null && hoverTime !== null) {
      ctx.fillStyle = playedColor;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(hoverX - 1, 8, 2, height - 16);
      ctx.globalAlpha = 1;
    }

  }, [peaks, currentTime, duration, dimensions, hoverX, hoverTime]);

  const generatePlaceholderPeaks = (count: number): number[] => {
    const peaks: number[] = [];
    for (let i = 0; i < count; i++) {
      peaks.push(0.1 + Math.random() * 0.2);
    }
    return peaks;
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
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
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * duration);
  }, [duration, onSeek]);

  if (isLoading) {
    return (
      <div className={cn('h-full flex items-center justify-center', className)}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm">Analyzing audio waveform...</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn('h-full w-full relative cursor-pointer select-none', className)}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full"
      />
      
      {/* Hover tooltip */}
      {hoverTime !== null && hoverX !== null && duration > 0 && (
        <div 
          className="absolute bottom-14 px-2 py-1 bg-popover border border-border rounded text-xs font-mono shadow-lg pointer-events-none transform -translate-x-1/2 z-10"
          style={{ left: hoverX }}
        >
          {formatSeconds(hoverTime)}
        </div>
      )}
    </div>
  );
});

Waveform.displayName = 'Waveform';
