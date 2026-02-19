import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { LyricLine, SectionType, SyncMode } from '@/types/lyrics';
import { SectionBadge } from './SectionBadge';
import { formatTimestamp } from '@/utils/formatTime';
import { cn } from '@/lib/utils';
import { GripVertical, Trash2, Clock, Zap, Scissors, Copy } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface LyricLineItemProps {
  line: LyricLine;
  isSelected: boolean;
  isActive: boolean;
  isRTL: boolean;
  syncMode: SyncMode;
  onSelect: () => void;
  onTextChange: (text: string) => void;
  onSectionChange: (section: SectionType) => void;
  onDelete: () => void;
  onTimestampClear: () => void;
  onAddLineAfter: () => void;
  onDuplicate: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSplitWords: () => void;

  onWordClick: (wordIndex: number) => void;
}


const sections: { value: SectionType; label: string }[] = [
  { value: null, label: 'None' },
  { value: 'verse', label: 'Verse' },
  { value: 'chorus', label: 'Chorus' },
  { value: 'bridge', label: 'Bridge' },
  { value: 'pre-chorus', label: 'Pre-Chorus' },
  { value: 'intro', label: 'Intro' },
  { value: 'outro', label: 'Outro' },
  { value: 'hook', label: 'Hook' },
];

export const LyricLineItem = ({
  line,
  isSelected,
  isActive,
  isRTL,
  syncMode,
  onSelect,
  onTextChange,
  onSectionChange,
  onDelete,
  onTimestampClear,
  onAddLineAfter,
  onDuplicate,
  onKeyDown,
  onSplitWords,
  onWordClick,
}: LyricLineItemProps) => {

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isSelected && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isSelected]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onAddLineAfter();
    } else {
      onKeyDown(e);
    }
  };

  const hasTimestamps = line.startTime !== null || line.endTime !== null;
  const hasWordTimestamps = line.words && line.words.length > 0 && line.words.some(w => w.startTime > 0);
  const syncedWordsCount = line.words?.filter(w => w.endTime > 0).length || 0;
  const totalWordsCount = line.text.split(/\s+/).filter(w => w.length > 0).length;
  const isDivided = line.words && line.words.length > 0;

  return (
    <div
      className={cn(
        'lyric-line group flex items-start gap-1 md:gap-2 animate-slide-in p-1 rounded-md transition-all duration-200',
        isSelected && 'bg-primary/5 ring-1 ring-primary/20',
        isActive && 'border-l-4 border-l-primary bg-primary/10'
      )}
      onClick={onSelect}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Drag handle - always slightly visible on mobile */}
      <div className="flex-shrink-0 pt-2 opacity-10 md:opacity-0 group-hover:opacity-50 cursor-grab px-0.5 md:px-1">
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Timestamps - Compact on mobile */}
      <div className="flex-shrink-0 w-[100px] md:w-[140px] pt-1.5 md:pt-2 flex flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-x-1 gap-y-0">
          <span className="timestamp-display text-[10px] md:text-[11px] font-mono font-medium" title="Start time">
            {formatTimestamp(line.startTime)}
          </span>
          <span className="text-muted-foreground text-[9px] md:text-[10px]">→</span>
          <span className="timestamp-display text-[10px] md:text-[11px] font-mono font-medium" title="End time">
            {formatTimestamp(line.endTime)}
          </span>
        </div>
        {hasWordTimestamps && (
          <div className="flex items-center gap-1 text-[9px] md:text-[10px] text-accent font-medium">
            <Zap className="h-2.5 w-2.5" />
            <span className="hidden xs:inline">Word sync: {syncedWordsCount}/{totalWordsCount}</span>
            <span className="xs:hidden">{syncedWordsCount}/{totalWordsCount}</span>
          </div>
        )}
      </div>

      {/* Section badge - Smaller on mobile */}
      <div className="flex-shrink-0 w-12 md:w-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-7 min-w-[3rem] md:min-w-[4rem] flex items-center justify-center">
              {line.section ? (
                <div className="scale-90 md:scale-100">
                  <SectionBadge section={line.section} />
                </div>
              ) : (
                <span className="text-[10px] md:text-xs text-muted-foreground opacity-30 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  +Sec
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {sections.map((s) => (
              <DropdownMenuItem
                key={s.value || 'none'}
                onClick={() => onSectionChange(s.value)}
              >
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Text input / Word display */}
      <div className="flex-1 min-w-0">
        {syncMode === 'word' && isDivided ? (
          <div className="flex flex-wrap gap-1 py-1 px-1">
            {line.words?.map((word, i) => (
              <span
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  onWordClick(i);
                }}
                className={cn(
                  "px-2 py-0.5 rounded text-xs md:text-sm lg:text-base border border-transparent cursor-pointer transition-all",
                  word.endTime > 0 ? "bg-primary/20 text-primary border-primary/30" : "bg-panel border-panel-border text-foreground/70 hover:bg-muted",
                  isSelected && "border-primary/20"
                )}
                title={word.endTime > 0 ? `${formatTimestamp(word.startTime)} - ${formatTimestamp(word.endTime)} (Shift+Click to clear)` : 'Click to timestamp at current time'}
              >
                {word.text}
              </span>
            ))}

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onSplitWords();
              }}
              title="Re-divide words (will reset timings)"
            >
              <Scissors className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={line.text}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter lyrics..."
            className={cn(
              'w-full bg-transparent resize-none outline-none py-1 md:py-2 transition-all',
              'placeholder:text-muted-foreground/30',
              'text-sm md:text-base leading-relaxed',
              isActive && 'font-medium',
              isRTL && 'text-right'
            )}
            rows={1}
            style={{
              height: 'auto',
              minHeight: '2.5rem',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
        )}
      </div>

      {/* Actions - Always partially visible on mobile, icon sizes adjusted */}
      <div className="flex-shrink-0 flex items-center gap-0.5 md:gap-1 pt-1 opacity-20 md:opacity-0 group-hover:opacity-100 transition-opacity pr-1 md:pr-2">
        {syncMode === 'word' && !isDivided && line.text && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 md:h-7 md:w-7 text-accent"
            onClick={(e) => {
              e.stopPropagation();
              onSplitWords();
            }}
          >
            <Scissors className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Button>
        )}
        {hasTimestamps && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 md:h-7 md:w-7 hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              onTimestampClear();
            }}
          >
            <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 md:h-7 md:w-7 hover:bg-muted"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
        >
          <Copy className="h-3 w-3 md:h-3.5 md:w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 md:h-7 md:w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
        </Button>

      </div>
    </div>
  );
};


