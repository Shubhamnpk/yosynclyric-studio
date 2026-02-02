
# Real Audio Waveform Visualization

## Overview

Transform the current fake waveform bars into a real audio waveform that displays the actual sound data from the uploaded file. This will make it much easier for users to identify vocals, pauses, and beats when syncing lyrics.

## What You'll Get

**Current State:**
- Random bars that don't match the audio
- No way to see where vocals or beats are
- Difficult to find the right timing points

**After Implementation:**
- Real waveform showing actual audio peaks and valleys
- Easy to spot quiet sections (between lyrics)
- Visual identification of vocals vs instrumental sections
- Playhead indicator showing exact position
- Time markers along the timeline
- Zoom capability for precise syncing
- Click anywhere to seek
- Hover to preview time position

## Visual Preview

```text
Before (fake random bars):
┌─────────────────────────────────────────────────────────────────┐
│  ▌▐▌▌▐▐▌▌▐▌▌▐▐▌▌▐▌▌▐▐▌▌▐▌▌▐▐▌▌▐▌▌▐▐▌▌▐▌▌▐▐▌▌▐▌▌▐▐▌▌▐▌▌▐▐▌▌▐▌  │
└─────────────────────────────────────────────────────────────────┘

After (real waveform with features):
┌─────────────────────────────────────────────────────────────────┐
│  0:00     0:30      1:00      1:30      2:00      2:30    3:00  │  <- Time markers
│  ▁▃▅█▅▃▁▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▁▃▅▇█▇▅▃▁▁▂▄▆█▆▄▂▁▁▃▅▇█▇▅▃▁▁▂▄▆█▆▄▂▁  │  <- Real peaks
│                    ▼                                             │  <- Playhead
│  ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  <- Progress
└─────────────────────────────────────────────────────────────────┘
                      ↑ Hover: 1:23.456
```

## Key Features

1. **Real Waveform Data** - Extract actual audio peaks using Web Audio API
2. **Playhead Indicator** - Clear vertical line showing current position
3. **Time Markers** - Labels at regular intervals (every 30s or based on duration)
4. **Progress Bar** - Visual indication of played vs remaining
5. **Hover Preview** - Show timestamp when hovering
6. **Smooth Rendering** - Optimized canvas rendering for performance

---

## Technical Implementation

### 1. Create Waveform Data Hook

**New File:** `src/hooks/useWaveformData.ts`

This hook will:
- Accept an audio URL or File
- Use Web Audio API's `AudioContext` and `decodeAudioData`
- Extract audio buffer samples
- Downsample to create peak data for visualization
- Return an array of normalized amplitudes (0-1)

```typescript
// Process audio file to extract waveform peaks
const extractWaveformPeaks = async (audioBuffer: AudioBuffer, samplesPerPeak: number) => {
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const peaks: number[] = [];
  const blockSize = Math.floor(channelData.length / samplesPerPeak);
  
  for (let i = 0; i < samplesPerPeak; i++) {
    const start = i * blockSize;
    let max = 0;
    for (let j = 0; j < blockSize; j++) {
      const abs = Math.abs(channelData[start + j]);
      if (abs > max) max = abs;
    }
    peaks.push(max);
  }
  return peaks;
};
```

### 2. Redesign Waveform Component

**Update File:** `src/components/AudioPlayer/Waveform.tsx`

Transform from simple div bars to a canvas-based waveform with:

**Visual Elements:**
- Center-aligned waveform (peaks go up and down from center)
- Gradient coloring (played = primary color, unplayed = muted)
- Vertical playhead line at current position
- Time markers at regular intervals
- Hover tooltip showing timestamp

**Props Interface:**
```typescript
interface WaveformProps {
  duration: number;
  currentTime: number;
  peaks: number[];        // Real audio peak data
  isLoading: boolean;     // Show loading state
  onSeek: (time: number) => void;
  className?: string;
}
```

**Rendering Approach:**
- Use HTML5 Canvas for smooth, performant rendering
- Draw mirrored bars (top and bottom from center line)
- Apply gradient fill for played/unplayed sections
- Draw playhead as animated vertical line
- Draw time labels at calculated intervals

### 3. Update Audio Player Hook

**Update File:** `src/hooks/useAudioPlayer.ts`

Add waveform data extraction when audio is loaded:
- Create AudioContext
- Fetch audio file and decode it
- Extract peak data
- Store peaks in state and return from hook

New return values:
```typescript
return {
  // existing...
  waveformPeaks: number[];
  isLoadingWaveform: boolean;
};
```

### 4. Update AudioControls

**Update File:** `src/components/AudioPlayer/AudioControls.tsx`

- Pass `waveformPeaks` and `isLoadingWaveform` to Waveform component
- Show loading spinner while waveform is being extracted
- Handle waveform data in the component hierarchy

### 5. Update SyncLyricsApp

**Update File:** `src/components/SyncLyricsApp.tsx`

- Receive and pass waveform data through props

### 6. Add CSS for Waveform

**Update File:** `src/index.css`

Add styles for:
- Waveform container
- Playhead animation
- Time markers
- Hover tooltip
- Loading state

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useWaveformData.ts` | Create | Extract real audio peaks using Web Audio API |
| `src/components/AudioPlayer/Waveform.tsx` | Rewrite | Canvas-based real waveform with playhead and markers |
| `src/hooks/useAudioPlayer.ts` | Modify | Integrate waveform extraction on audio load |
| `src/components/AudioPlayer/AudioControls.tsx` | Modify | Pass waveform data and loading state |
| `src/components/SyncLyricsApp.tsx` | Modify | Wire up waveform props |
| `src/index.css` | Modify | Add waveform-specific styles |

---

## User Experience Improvements

- **Easier Sync Points**: See exactly where vocals start/stop in the waveform
- **Visual Pauses**: Flat sections = silence = good places to end lyrics
- **Beat Detection**: Peaks often align with musical beats
- **Precise Seeking**: Click on a visible peak to jump to that moment
- **Time Awareness**: Always know where you are with time markers
