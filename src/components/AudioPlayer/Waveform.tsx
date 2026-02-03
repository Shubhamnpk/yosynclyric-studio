import { useRef, useEffect, useState, useCallback, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { formatSeconds } from '@/utils/formatTime';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  // Calculate minimum width for detailed waveform
  const minBarWidth = 3; // Minimum width per bar for detail
  const numBars = peaks.length > 0 ? peaks.length : 1009; // More bars for detail
  const minWaveformWidth = numBars * minBarWidth + 10; // +20 for padding

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
        // Check if scroll is needed
        setShowScrollButtons(minWaveformWidth > width);
      }
    };

    // Initial measurement
    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [minWaveformWidth]);

  // Auto-scroll to keep playhead in view
  useEffect(() => {
    if (!scrollContainerRef.current || duration <= 0) return;

    const progress = currentTime / duration;
    const containerWidth = scrollContainerRef.current.clientWidth;
    const scrollWidth = scrollContainerRef.current.scrollWidth;
    
    // Calculate playhead position
    const playheadX = progress * scrollWidth;
    
    // Keep playhead centered with some padding
    const targetScroll = Math.max(0, playheadX - containerWidth / 2);
    const maxScroll = scrollWidth - containerWidth;
    const clampedScroll = Math.min(targetScroll, maxScroll);
    
    // Smooth scroll to playhead
    scrollContainerRef.current.scrollTo({
      left: clampedScroll,
      behavior: 'smooth'
    });
    
    setScrollPosition(clampedScroll);
  }, [currentTime, duration]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { width, height } = dimensions;

    // Use the minimum width for detailed waveform
    const canvasWidth = Math.max(width, minWaveformWidth);
    
    // Set canvas size with device pixel ratio for sharpness
    canvas.width = canvasWidth * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, height);

    // If no peaks, draw placeholder bars
    const displayPeaks = peaks.length > 0 ? peaks : generatePlaceholderPeaks(200);
    
    const progress = duration > 0 ? currentTime / duration : 0;
    const progressX = progress * canvasWidth;

    // Waveform settings - more detailed
    const barWidth = Math.max(2, (canvasWidth / displayPeaks.length) - 0.5);
    const barGap = 0.5;
    const centerY = height / 2;
    const maxBarHeight = (height / 2) - 20; // Leave more space for time markers

    // Get colors from CSS variables
    const computedStyle = getComputedStyle(document.documentElement);
    const playedColorRaw = computedStyle.getPropertyValue('--waveform').trim();
    const unplayedColorRaw = computedStyle.getPropertyValue('--waveform-inactive').trim();
    
    // Fallback colors if CSS variables are empty
    const playedColor = playedColorRaw ? `hsl(${playedColorRaw})` : 'hsl(38, 92%, 50%)';
    const unplayedColor = unplayedColorRaw ? `hsl(${unplayedColorRaw})` : 'hsl(0, 0%, 30%)';

    // Draw waveform bars with gradient for more detail
    displayPeaks.forEach((peak, i) => {
      const x = (i / displayPeaks.length) * canvasWidth;
      const barHeight = Math.max(3, peak * maxBarHeight);
      
      const isPlayed = x <= progressX;
      
      // Create gradient for played bars
      if (isPlayed) {
        const gradient = ctx.createLinearGradient(x, centerY - barHeight, x, centerY + barHeight);
        gradient.addColorStop(0, playedColor);
        gradient.addColorStop(0.5, playedColor);
        gradient.addColorStop(1, playedColor);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = unplayedColor;
      }

      // Draw mirrored bars (top and bottom from center) with rounded effect
      const barX = x + barGap / 2;
      const actualBarWidth = barWidth - barGap;
      
      // Top bar
      ctx.fillRect(barX, centerY - barHeight, actualBarWidth, barHeight);
      // Bottom bar
      ctx.fillRect(barX, centerY, actualBarWidth, barHeight);
    });

    // Draw center line
    ctx.fillStyle = unplayedColor;
    ctx.globalAlpha = 0.2;
    ctx.fillRect(0, centerY - 0.5, canvasWidth, 1);
    ctx.globalAlpha = 1;

    // Draw playhead with glow effect
    if (progress > 0 && progress <= 1 && duration > 0) {
      // Glow effect
      ctx.shadowColor = playedColor;
      ctx.shadowBlur = 10;
      ctx.fillStyle = playedColor;
      ctx.fillRect(progressX - 1.5, 10, 3, height - 20);
      ctx.shadowBlur = 0;
      
      // Playhead cap
      ctx.beginPath();
      ctx.arc(progressX, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Playhead bottom cap
      ctx.beginPath();
      ctx.arc(progressX, height - 10, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw time markers with more detail
    if (duration > 0) {
      const interval = duration > 300 ? 60 : duration > 120 ? 30 : duration > 60 ? 15 : 5;
      const actualMarkerCount = Math.floor(duration / interval);
      
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      
      for (let i = 0; i <= actualMarkerCount; i++) {
        const time = i * interval;
        const x = (time / duration) * canvasWidth;
        
        // Don't draw markers too close to edges
        if (x < 30 || x > canvasWidth - 30) continue;
        
        const isPlayed = x <= progressX;
        ctx.fillStyle = isPlayed ? playedColor : unplayedColor;
        ctx.globalAlpha = isPlayed ? 0.9 : 0.6;
        
        // Tick mark
        ctx.fillRect(x, height - 12, 1.5, 6);
        
        // Time label
        ctx.fillText(formatSeconds(time), x, height - 2);
      }
      ctx.globalAlpha = 1;
    }

    // Draw hover indicator
    if (hoverX !== null && hoverTime !== null) {
      ctx.fillStyle = playedColor;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(hoverX - 1, 10, 2, height - 20);
      ctx.globalAlpha = 1;
    }

  }, [peaks, currentTime, duration, dimensions, hoverX, hoverTime, minWaveformWidth]);

  const generatePlaceholderPeaks = (count: number): number[] => {
    const peaks: number[] = [];
    for (let i = 0; i < count; i++) {
      // More varied placeholder peaks for better visual
      const base = 0.15 + Math.random() * 0.35;
      const variation = Math.sin(i * 0.1) * 0.1;
      peaks.push(Math.max(0.1, Math.min(0.8, base + variation)));
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

  const handleScrollLeft = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const newScroll = Math.max(0, scrollPosition - 200);
    scrollContainerRef.current.scrollTo({ left: newScroll, behavior: 'smooth' });
    setScrollPosition(newScroll);
  }, [scrollPosition]);

  const handleScrollRight = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const maxScroll = scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth;
    const newScroll = Math.min(maxScroll, scrollPosition + 200);
    scrollContainerRef.current.scrollTo({ left: newScroll, behavior: 'smooth' });
    setScrollPosition(newScroll);
  }, [scrollPosition]);

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
      className={cn('h-full w-full relative', className)}
    >
      {/* Scroll buttons */}
      {showScrollButtons && (
        <>
          <button
            onClick={handleScrollLeft}
            disabled={scrollPosition <= 0}
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-background/80 border border-border shadow-lg',
              'hover:bg-background transition-all disabled:opacity-30 disabled:cursor-not-allowed'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleScrollRight}
            disabled={scrollContainerRef.current ? scrollPosition >= scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth : false}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-background/80 border border-border shadow-lg',
              'hover:bg-background transition-all disabled:opacity-30 disabled:cursor-not-allowed'
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Scrollable waveform container */}
      <div 
        ref={scrollContainerRef}
        className="h-full w-full overflow-x-auto overflow-y-hidden cursor-pointer select-none scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="h-full relative" style={{ minWidth: `${minWaveformWidth}px` }}>
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0"
          />
        </div>
      </div>
      
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
