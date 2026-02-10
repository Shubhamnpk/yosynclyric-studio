import { useEffect, useRef, useCallback, useMemo } from 'react';
import { LyricLine, SyncMode } from '@/types/lyrics';
import { formatTimestamp } from '@/utils/formatTime';
import { cn } from '@/lib/utils';
import { SectionBadge } from '@/components/LyricsEditor/SectionBadge';
import { Eye } from 'lucide-react';

interface LyricsPreviewProps {
  lines: LyricLine[];
  activeLineId: string | null;
  activeWordIndex: number | null;
  isRTL: boolean;
  title: string;
  artist: string;
  syncMode: SyncMode;
}

export const LyricsPreview = ({
  lines,
  activeLineId,
  activeWordIndex,
  isRTL,
  title,
  artist,
  syncMode,
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
        <div className="flex items-center gap-2 mb-2">
          <Eye className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Live Preview</h2>
        </div>
        {(title || artist) && (
          <div className="text-sm text-muted-foreground">
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
          <div className="h-[5%] flex-shrink-0" />

          <div className="px-6 space-y-5">
            {nonEmptyLines.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                Start writing lyrics to see them here
              </p>
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
                      opacity: isActive ? 1 : isPast ? 0.8 : 0.9,
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
                        isActive ? 'text-xl font-semibold' : 'text-lg',
                      )}
                      style={{
                        color: isActive
                          ? 'hsl(var(--primary))'
                          : isPast
                            ? 'hsl(var(--muted-foreground))'
                            : 'hsl(var(--foreground) / 0.7)',
                        textShadow: isActive
                          ? '0 0 20px hsl(var(--primary) / 0.3)'
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
                                fontWeight: isWordActive ? 700 : undefined,
                                textShadow: isWordActive
                                  ? '0 0 16px hsl(var(--primary) / 0.4)'
                                  : 'none',
                                transition: 'color 300ms ease, font-weight 300ms ease, text-shadow 300ms ease',
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
                        className="timestamp-display text-[10px] mt-1 block font-mono"
                        style={{
                          opacity: isActive ? 0.8 : 0.6,
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

          {/* Bottom spacer — lets last line center */}
          <div className="h-[5%] flex-shrink-0" />
        </div>
      </div>
    </div>
  );
};

