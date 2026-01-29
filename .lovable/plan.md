
# Bulk Lyrics Import with Start/End Timestamp Syncing

## Overview

Transform the lyrics entry workflow to allow users to paste all lyrics at once, then sync each line with start and end timestamps while the song plays.

## New User Workflow

```text
Step 1: Bulk Import
+----------------------------------+
|  Paste or type all lyrics here   |
|  (one line per lyric line)       |
|                                  |
|  "Hello, it's me"               |
|  "I was wondering..."           |
|  "After all these years..."     |
+----------------------------------+
        [ Import Lyrics ]

Step 2: Line-by-Line Syncing
+----------------------------------------------------------+
| Line 1: "Hello, it's me"     [Start: 00:05.320] [End: 00:08.150]  |
| Line 2: "I was wondering..." [Start: --:--:--] [End: --:--:--]    | <- Selected
| Line 3: "After all..."       [Start: --:--:--] [End: --:--:--]    |
+----------------------------------------------------------+
| [ Set Start ] [ Set End ] while playing audio            |
+----------------------------------------------------------+
```

## What Will Change

**For Users:**
- New "Import Lyrics" button opens a dialog where you can paste all lyrics at once
- Each line automatically becomes a separate lyric entry
- Two timestamps per line: **Start** (when to show) and **End** (when to hide)
- Press keyboard shortcuts while playing to capture start/end times for the selected line

**Current vs New:**
| Current | New |
|---------|-----|
| Add lines one-by-one | Paste all lyrics, split automatically |
| Single timestamp per line | Start and end timestamps |
| Only captures "when to show" | Captures full duration of each line |

---

## Technical Implementation Details

### 1. Update Data Model

**File:** `src/types/lyrics.ts`

Modify the `LyricLine` interface to support both start and end timestamps:

```typescript
export interface LyricLine {
  id: string;
  text: string;
  startTime: number | null;  // When line appears (ms)
  endTime: number | null;    // When line disappears (ms)
  section: SectionType;
}
```

### 2. Create Bulk Import Dialog

**New File:** `src/components/LyricsEditor/BulkImportDialog.tsx`

A dialog component with:
- Large textarea for pasting multiple lines of lyrics
- "Import" button that splits by newlines and creates `LyricLine` entries
- Option to clear existing lyrics or append

### 3. Add `importBulkLyrics` Function

**File:** `src/hooks/useLyricsEditor.ts`

New function to parse and import bulk text:

```typescript
const importBulkLyrics = useCallback((text: string, replace: boolean = true) => {
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(text => ({
      id: generateId(),
      text,
      startTime: null,
      endTime: null,
      section: null,
    }));
  
  setProject(prev => ({
    ...prev,
    lines: replace ? lines : [...prev.lines, ...lines],
    updatedAt: new Date(),
  }));
}, []);
```

### 4. Update Timestamp Capture System

**File:** `src/hooks/useLyricsEditor.ts`

Add separate functions for start and end timestamps:

```typescript
const setLineStartTime = useCallback((lineId: string, time: number) => {
  updateLine(lineId, { startTime: time });
}, [updateLine]);

const setLineEndTime = useCallback((lineId: string, time: number) => {
  updateLine(lineId, { endTime: time });
  // Auto-advance to next line after setting end time
  const index = project.lines.findIndex(l => l.id === lineId);
  if (index < project.lines.length - 1) {
    setSelectedLineId(project.lines[index + 1].id);
  }
}, [updateLine, project.lines]);
```

### 5. Update Keyboard Shortcuts

**File:** `src/components/AudioPlayer/AudioControls.tsx`

- `Shift + S` or `[` - Set start time for selected line
- `Shift + E` or `]` - Set end time for selected line
- After setting end time, automatically select next line

### 6. Update LyricLineItem Display

**File:** `src/components/LyricsEditor/LyricLineItem.tsx`

Show both timestamps:

```text
[00:05.32 - 00:08.15]  "Hello, it's me"  [Clear]
```

### 7. Update LyricsPanel

**File:** `src/components/LyricsEditor/LyricsPanel.tsx`

- Add "Import Lyrics" button in header
- Integrate the bulk import dialog
- Keep existing "Add Line" for manual additions

### 8. Update Preview Logic

**File:** `src/components/Preview/LyricsPreview.tsx`

Update `getActiveLineByTime` to use time ranges:

```typescript
// Line is active when: startTime <= currentTime < endTime
const isActive = startTime <= currentTime && currentTime < endTime;
```

### 9. Update Export Utilities

**File:** `src/utils/exportLyrics.ts`

Update LRC/SRT/VTT exports to use the new start/end time format. SRT and VTT already support time ranges natively.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/types/lyrics.ts` | Modify - Add `startTime`/`endTime` |
| `src/components/LyricsEditor/BulkImportDialog.tsx` | Create - New dialog component |
| `src/hooks/useLyricsEditor.ts` | Modify - Add bulk import + start/end functions |
| `src/components/LyricsEditor/LyricsPanel.tsx` | Modify - Add import button |
| `src/components/LyricsEditor/LyricLineItem.tsx` | Modify - Show both timestamps |
| `src/components/AudioPlayer/AudioControls.tsx` | Modify - New keyboard shortcuts |
| `src/components/Preview/LyricsPreview.tsx` | Modify - Update active line logic |
| `src/utils/exportLyrics.ts` | Modify - Use time ranges |
| `src/utils/formatTime.ts` | Modify - Add range formatting |
