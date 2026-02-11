import { SectionType } from '@/types/lyrics';
import { cn } from '@/lib/utils';

interface SectionBadgeProps {
  section: SectionType;
  className?: string;
}

const sectionLabels: Record<NonNullable<SectionType>, string> = {
  verse: 'Verse',
  chorus: 'Chorus',
  bridge: 'Bridge',
  outro: 'Outro',
  intro: 'Intro',
  'pre-chorus': 'Pre-Chorus',
  hook: 'Hook',
};

const sectionStyles: Record<NonNullable<SectionType>, string> = {
  verse: 'section-verse',
  chorus: 'section-chorus',
  bridge: 'section-bridge',
  outro: 'section-outro',
  intro: 'section-verse',
  'pre-chorus': 'section-bridge',
  hook: 'section-chorus',
};

export const SectionBadge = ({ section, className }: SectionBadgeProps) => {
  if (!section) return null;

  return (
    <span className={cn('section-label', sectionStyles[section], className)}>
      {sectionLabels[section]}
    </span>
  );
};
