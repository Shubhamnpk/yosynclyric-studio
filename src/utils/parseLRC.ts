import { LyricLine } from '@/types/lyrics';
import { parseTimestamp } from './formatTime';

/**
 * Parse an LRC file content into an array of LyricLines
 */
export const parseLRC = (content: string): { lines: LyricLine[], metadata: { title?: string, artist?: string, album?: string, duration?: number } } => {
    const lines: LyricLine[] = [];
    const metadata: { title?: string, artist?: string, album?: string, duration?: number } = {};

    const rawLines = content.split(/\r?\n/);

    // Regex for timestamps [mm:ss.xx] or [mm:ss]
    const timestampRegex = /\[(\d{2,}:\d{2}(?:\.\d{1,3})?)\]/g;
    // Regex for metadata tags like [ti:Title], [ar:Artist], [al:Album], [length:03:45]
    const metadataRegex = /\[(ti|ar|al|length|duration):(.*)\]/i;

    for (const rawLine of rawLines) {
        const trimmed = rawLine.trim();
        if (!trimmed) continue;

        // Check for metadata
        const metaMatch = trimmed.match(metadataRegex);
        if (metaMatch) {
            const key = metaMatch[1].toLowerCase();
            const value = metaMatch[2].trim();
            
            if (key === 'ti') metadata.title = value;
            if (key === 'ar') metadata.artist = value;
            if (key === 'al') metadata.album = value;
            if (key === 'length' || key === 'duration') {
                const ms = parseTimestamp(value);
                if (ms !== null) metadata.duration = Math.round(ms / 1000);
            }
            continue;
        }

        // Extract all timestamps from the line (LRC supports multiple timestamps for same text)
        const timestamps: number[] = [];
        let match;
        let lastIndex = 0;

        while ((match = timestampRegex.exec(trimmed)) !== null) {
            const ms = parseTimestamp(match[1]);
            if (ms !== null) {
                timestamps.push(ms);
            }
            lastIndex = timestampRegex.lastIndex;
        }

        // The text is whatever is left after the timestamps
        const text = trimmed.substring(lastIndex).trim();
        if (text || timestamps.length > 0) {
            for (const startTime of timestamps) {
                lines.push({
                    id: Math.random().toString(36).substring(2, 9),
                    text: text,
                    startTime,
                    endTime: null, // End time is usually inferred from next line
                    section: null,
                    words: []
                });
            }
        }
    }

    // Sort lines by start time
    lines.sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0));

    // Inferred end times (from the start of the next line)
    for (let i = 0; i < lines.length - 1; i++) {
        lines[i].endTime = lines[i + 1].startTime;
    }

    return { lines, metadata };
};
