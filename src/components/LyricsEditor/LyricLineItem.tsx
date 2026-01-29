import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { LyricLine, SectionType } from '@/types/lyrics';
import { SectionBadge } from './SectionBadge';
import { formatTimestamp } from '@/utils/formatTime';
import { cn } from '@/lib/utils';
import { GripVertical, Trash2, Clock } from 'lucide-react';
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
  onSelect: () => void;
  onTextChange: (text: string) => void;
  onSectionChange: (section: SectionType) => void;
  onDelete: () => void;
  onTimestampClear: () => void;
  onAddLineAfter: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
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
  onSelect,
  onTextChange,
  onSectionChange,
  onDelete,
  onTimestampClear,
  onAddLineAfter,
  onKeyDown,
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

  return (
    <div
      className={cn(
        'lyric-line group flex items-start gap-2 animate-slide-in',
        isSelected && 'ring-1 ring-primary/50',
        isActive && 'active'
      )}
      onClick={onSelect}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Drag handle */}
      <div className="flex-shrink-0 pt-2 opacity-0 group-hover:opacity-50 cursor-grab">
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Timestamps - Start and End */}
      <div className="flex-shrink-0 w-40 pt-2 flex items-center gap-1">
        <span className="timestamp-display text-xs font-mono" title="Start time">
          {formatTimestamp(line.startTime)}
        </span>
        <span className="text-muted-foreground text-xs">→</span>
        <span className="timestamp-display text-xs font-mono" title="End time">
          {formatTimestamp(line.endTime)}
        </span>
      </div>

      {/* Section badge */}
      <div className="flex-shrink-0 w-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-7 min-w-[4rem] flex items-center justify-center">
              {line.section ? (
                <SectionBadge section={line.section} />
              ) : (
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  + Section
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

      {/* Text input */}
      <div className="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={line.text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter lyrics..."
          className={cn(
            'w-full bg-transparent resize-none outline-none py-2',
            'placeholder:text-muted-foreground/50',
            'text-base leading-relaxed',
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
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {hasTimestamps && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onTimestampClear();
            }}
            title="Clear timestamps"
          >
            <Clock className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete line"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
