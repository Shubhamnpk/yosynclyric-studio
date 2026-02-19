import { useEffect, useRef, useCallback, useMemo } from 'react';
import { LyricLine, SyncMode } from '@/types/lyrics';
import { formatTimestamp } from '@/utils/formatTime';
import { cn } from '@/lib/utils';
import { SectionBadge } from '@/components/LyricsEditor/SectionBadge';
import { Eye, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LyricsPreviewProps {
  lines: LyricLine[];
  activeLineId: string | null;
  activeWordIndex: number | null;
  isRTL: boolean;
  title: string;
  artist: string;
  syncMode: SyncMode;
  onToggleKaraoke?: () => void;
}

export const LyricsPreview = ({
  lines,
  activeLineId,
  activeWordIndex,
  isRTL,
  title,
  artist,
  syncMode,
  onToggleKaraoke,
}: LyricsPreviewProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastAutoScrollTime = useRef(0);
  const isUserScrolling = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const nonEmptyLines = useMemo(() => lines.filter(l => l.text.trim()), [lines]);

  // Custom smooth scroll with EaseOutQuart for buttery deceleration
  const smoothScrollTo = useCallback((container: HTMLElement, targetScroll: number, duration: number = 650) => {
    const startScroll = container.scrollTop;
    const distance = targetScroll - startScroll;

    // Skip trivial scrolls
    if (Math.abs(distance) < 2) return;

    const startTime = performance.now();
    const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

    const animateScroll = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      container.scrollTop = startScroll + (distance * easedProgress);

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  }, []);

  // Auto-scroll to center the active line with a polished delay
  useEffect(() => {
    if (!activeLineId || isUserScrolling.current) return;

    const container = scrollContainerRef.current;
    const lineEl = lineRefs.current.get(activeLineId);
    if (!container || !lineEl) return;

    const containerHeight = container.clientHeight;
    const lineTop = lineEl.offsetTop;
    const lineHeight = lineEl.offsetHeight;
    const targetScroll = lineTop - (containerHeight / 2) + (lineHeight / 2);

    // Small delay lets opacity transition start first — feels more cinematic
    const scrollDelay = setTimeout(() => {
      smoothScrollTo(container, Math.max(0, targetScroll), 600);
    }, 50);

    lastAutoScrollTime.current = Date.now();
    return () => clearTimeout(scrollDelay);
  }, [activeLineId, smoothScrollTo]);

  // Detect user scrolling to pause auto-scroll
  const handleScroll = useCallback(() => {
    if (Date.now() - lastAutoScrollTime.current < 150) return;

    isUserScrolling.current = true;

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 3000);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Register a line element ref
  const setLineRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) lineRefs.current.set(id, el);
    else lineRefs.current.delete(id);
  }, []);

  return (
    <div className="h-full flex flex-col bg-panel rounded-lg border border-panel-border overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-panel-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Live Preview</h2>
          </div>
          {onToggleKaraoke && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleKaraoke}
              className="h-8 gap-2 bg-primary/5 border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
            >
              <Presentation className="h-4 w-4 text-primary group-hover:text-primary-foreground" />
              <span className="text-xs font-bold uppercase tracking-wider">Karaoke</span>
            </Button>
          )}
        </div>
        {(title || artist) && (
          <div className="text-sm text-muted-foreground truncate pr-20">
            {title && <span className="font-medium text-foreground">{title}</span>}
            {title && artist && <span> • </span>}
            {artist && <span>{artist}</span>}
          </div>
        )}
      </div>

      {/* Preview content with mask-image edge fades */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto no-scrollbar"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Top spacer — lets first line center */}
          <div className="h-[20%] flex-shrink-0" />

          <div className="px-6 space-y-5 pb-[40%]">
            {nonEmptyLines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-2">
                  <Eye className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground max-w-[200px] text-sm leading-relaxed">
                  Start writing lyrics to see them here
                </p>
              </div>
            ) : (
              nonEmptyLines.map((line, index) => {
                const isActive = line.id === activeLineId;
                const activeIndex = nonEmptyLines.findIndex(l => l.id === activeLineId);
                const isPast = activeLineId ? index < activeIndex : false;

                return (
                  <div
                    key={line.id}
                    ref={(el) => setLineRef(line.id, el)}
                    className="py-1"
                    style={{
                      opacity: isActive ? 1 : isPast ? 0.7 : 0.4,
                      transform: isActive ? 'scale(1.02)' : 'scale(1)',
                      transition: 'opacity 600ms cubic-bezier(0.4, 0, 0.2, 1), transform 600ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {line.section && (
                      <div className="mb-1">
                        <SectionBadge section={line.section} />
                      </div>
                    )}
                    <div
                      className={cn(
                        'leading-relaxed flex flex-wrap gap-x-[0.25em]',
                        isActive ? 'text-2xl font-bold' : 'text-xl font-medium',
                      )}
                      style={{
                        color: isActive
                          ? 'hsl(var(--primary))'
                          : isPast
                            ? 'hsl(var(--muted-foreground))'
                            : 'hsl(var(--foreground) / 0.7)',
                        textShadow: isActive
                          ? '0 0 30px hsl(var(--primary) / 0.4)'
                          : 'none',
                        transition: 'color 600ms cubic-bezier(0.4, 0, 0.2, 1), text-shadow 600ms cubic-bezier(0.4, 0, 0.2, 1), font-size 300ms ease',
                      }}
                    >
                      {syncMode === 'word' && line.words && line.words.length > 0 ? (
                        line.words.map((word, wIdx) => {
                          const isWordActive = isActive && activeWordIndex === wIdx;
                          const isWordPast = isPast || (isActive && activeWordIndex !== null && wIdx < activeWordIndex);

                          return (
                            <span
                              key={wIdx}
                              style={{
                                color: isWordActive
                                  ? 'hsl(var(--primary))'
                                  : isWordPast
                                    ? 'hsl(var(--muted-foreground))'
                                    : isActive
                                      ? 'hsl(var(--foreground))'
                                      : undefined,
                                fontWeight: isWordActive ? 800 : undefined,
                                textShadow: isWordActive
                                  ? '0 0 24px hsl(var(--primary) / 0.5)'
                                  : 'none',
                                transform: isWordActive ? 'translateY(-2px)' : 'none',
                                display: 'inline-block',
                                transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                              }}
                            >
                              {word.text}
                            </span>
                          );
                        })
                      ) : (
                        <span>{line.text}</span>
                      )}
                    </div>
                    {(line.startTime !== null || line.endTime !== null) && (
                      <span
                        className="timestamp-display text-[10px] mt-1.5 block font-mono"
                        style={{
                          opacity: isActive ? 0.8 : 0.4,
                          transition: 'opacity 600ms cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        {formatTimestamp(line.startTime)} → {formatTimestamp(line.endTime)}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="h-[10%] flex-shrink-0" />
        </div>
      </div>
    </div>
  );
};

