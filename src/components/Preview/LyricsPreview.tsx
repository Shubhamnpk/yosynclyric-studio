import { useEffect, useRef } from 'react';
import { LyricLine } from '@/types/lyrics';
import { formatTimestamp } from '@/utils/formatTime';
import { cn } from '@/lib/utils';
import { SectionBadge } from '@/components/LyricsEditor/SectionBadge';
import { Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LyricsPreviewProps {
  lines: LyricLine[];
  activeLineId: string | null;
  isRTL: boolean;
  title: string;
  artist: string;
}

export const LyricsPreview = ({
  lines,
  activeLineId,
  isRTL,
  title,
  artist,
}: LyricsPreviewProps) => {
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineId]);

  const nonEmptyLines = lines.filter(l => l.text.trim());

  return (
    <div className="h-full flex flex-col bg-panel rounded-lg border border-panel-border">
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

      {/* Preview content */}
      <ScrollArea className="flex-1">
        <div
          className="p-6 space-y-4"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {nonEmptyLines.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              Start writing lyrics to see them here
            </p>
          ) : (
            nonEmptyLines.map((line, index) => {
              const isActive = line.id === activeLineId;
              const isPast = (() => {
                if (!activeLineId) return false;
                const activeIndex = nonEmptyLines.findIndex(l => l.id === activeLineId);
                return index < activeIndex;
              })();

              return (
                <div
                  key={line.id}
                  ref={isActive ? activeRef : undefined}
                  className={cn(
                    'transition-all duration-300',
                    isActive && 'scale-105 origin-left',
                    isRTL && isActive && 'origin-right'
                  )}
                >
                  {line.section && (
                    <div className="mb-1">
                      <SectionBadge section={line.section} />
                    </div>
                  )}
                  <p
                    className={cn(
                      'text-lg leading-relaxed transition-colors duration-300',
                      isActive && 'text-primary font-medium text-xl',
                      isPast && 'text-muted-foreground',
                      !isActive && !isPast && 'text-foreground/70'
                    )}
                  >
                    {line.text}
                  </p>
                  {(line.startTime !== null || line.endTime !== null) && (
                    <span
                      className={cn(
                        'timestamp-display text-xs mt-1 block opacity-50',
                        isActive && 'opacity-100'
                      )}
                    >
                      {formatTimestamp(line.startTime)} → {formatTimestamp(line.endTime)}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
