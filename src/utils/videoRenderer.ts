import { LyricLine, SyncMode } from '@/types/lyrics';

interface RenderConfig {
    width: number;
    height: number;
    title: string;
    artist: string;
    lines: LyricLine[];
    syncMode: SyncMode;
    backgroundImage?: HTMLImageElement | null;
}

export class VideoRenderer {
    private ctx: CanvasRenderingContext2D;
    private config: RenderConfig;
    private activeLineIndex: number = -1;
    private scrollY: number = 0;

    constructor(ctx: CanvasRenderingContext2D, config: RenderConfig) {
        this.ctx = ctx;
        this.config = config;

        // Setup text styles
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
    }

    render(currentTime: number) {
        const { width, height, lines, title, artist, syncMode } = this.config;
        const ctx = this.ctx;

        // 1. Draw Background
        this.drawBackground(currentTime);

        // 2. Determine Active Line & Scroll Position
        this.updateScrollLogic(currentTime);

        // 3. Draw Lyrics
        ctx.save();
        // Center the scroll view vertically
        const centerY = height / 2;

        // Apply scroll translation
        // We want the current scrollY to be at centerY
        ctx.translate(width / 2, centerY - this.scrollY);

        lines.forEach((line, index) => {
            this.drawLine(line, index, currentTime);
        });

        ctx.restore();

        // 4. Draw Header/Overlay (Title, Artist)
        this.drawHeader();

        // 5. Draw Watermark/Footer
        this.drawFooter();
    }

    private drawBackground(time: number) {
        const { width, height } = this.config;
        const ctx = this.ctx;

        // Dark background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // Animated blobs (simplified)
        // Blob 1 (Purple)
        const t = time * 0.5;
        const x1 = width * 0.3 + Math.sin(t) * 50;
        const y1 = height * 0.3 + Math.cos(t * 0.8) * 50;
        const radius1 = width * 0.6;

        const grad1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, radius1);
        grad1.addColorStop(0, 'rgba(124, 58, 237, 0.15)'); // Purple
        grad1.addColorStop(1, 'transparent');

        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, width, height);

        // Blob 2 (Blue)
        const x2 = width * 0.7 - Math.cos(t * 0.7) * 50;
        const y2 = height * 0.7 - Math.sin(t) * 50;
        const radius2 = width * 0.5;

        const grad2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, radius2);
        grad2.addColorStop(0, 'rgba(37, 99, 235, 0.15)'); // Blue
        grad2.addColorStop(1, 'transparent');

        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, width, height);
    }

    private updateScrollLogic(currentTime: number) {
        const { lines } = this.config;
        const lineHeight = 120; // Pixels per line height estimate (depends on font)

        // Find active line
        const activeIdx = lines.findIndex(l =>
            currentTime >= (l.startTime || 0) / 1000 &&
            currentTime < (l.endTime || Infinity) / 1000
        );

        if (activeIdx !== -1) {
            this.activeLineIndex = activeIdx;
        }

        // Target scroll is the Y position of the active line center
        // Let's assume uniform line height for simplicity first, 
        // or calculate strictly based on index * spacing
        const targetScroll = (activeIdx !== -1 ? activeIdx : 0) * lineHeight;

        // Smooth scroll interpolation (simple lerp)
        // In a real video renderer, we might want exact keyframes, 
        // but lerp is fine if framedelta is small. 
        // However, for 60fps export, we want instant or strictly timed transitions?
        // Let's use a "spring" or simple approach: always aim for active line.

        // For video export, we want deterministic behavior if possible.
        // But since we are recording real-time playback, lerp works.
        // Initial scroll
        if (this.activeLineIndex === -1) {
            this.scrollY = 0;
        } else {
            // Lerp factor
            const lerp = 0.05;
            this.scrollY += (targetScroll - this.scrollY) * lerp;
        }
    }

    private drawLine(line: LyricLine, index: number, currentTime: number) {
        const ctx = this.ctx;
        const lineHeight = 120;
        const y = index * lineHeight;

        // Distance from active
        const dist = Math.abs(index - this.activeLineIndex);

        // Styles
        let opacity = 1;
        let scale = 1;
        let blur = 0;

        if (this.activeLineIndex !== -1) {
            if (index === this.activeLineIndex) {
                opacity = 1;
                scale = 1.05;
                blur = 0;
            } else {
                opacity = Math.max(0.1, 0.4 - dist * 0.1);
                scale = 1;
                blur = Math.min(10, dist * 2);
            }
        }

        ctx.save();
        ctx.translate(0, y);
        ctx.scale(scale, scale);

        // Font settings
        const fontSize = 50; // px
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;

        // Shadow for active line
        // Color and Shadow refinements for Active Line
        if (index === this.activeLineIndex) {
            ctx.shadowColor = 'rgba(124, 58, 237, 0.8)'; // Stronger glow
            ctx.shadowBlur = 40;
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.shadowBlur = 0;
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        }

        // Filter for blur (canvas filter is supported in modern browsers)
        if (blur > 0) {
            ctx.filter = `blur(${blur}px)`;
        }

        // Draw Text
        // Check if line has words for mixed mode support
        const hasWords = line.words && line.words.length > 0;

        if (hasWords && index === this.activeLineIndex) {
            this.drawSyncedWords(line, currentTime);
        } else {
            // Simple Line (Active or Inactive)
            ctx.fillText(line.text || '', 0, 0);
        }

        ctx.restore();
    }

    private drawSyncedWords(line: LyricLine, currentTime: number) {
        const ctx = this.ctx;
        // We need to measure total width to center properly
        // Or render word by word.
        // Simple approach: measure all words, calculate total width, start X.

        const words = line.words || [];
        const wordMetrics = words.map(w => ({
            text: w.text,
            width: ctx.measureText(w.text + ' ').width
        }));

        const totalWidth = wordMetrics.reduce((a, b) => a + b.width, 0);
        let currentX = -totalWidth / 2; // Start from left to center

        words.forEach((word, i) => {
            const width = wordMetrics[i].width;

            // Check if word is active
            // Note: word.startTime/endTime are usually absolute or relative?
            // Project types says: startTime: number (ms).
            // currentTime is in Seconds in render(), need to convert.
            const wordStart = word.startTime / 1000;
            const wordEnd = word.endTime / 1000;

            const isPast = currentTime > wordEnd;
            const isActive = currentTime >= wordStart && currentTime <= wordEnd;

            // Highlight logic
            if (isActive) {
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                ctx.shadowBlur = 20;
            } else if (isPast) {
                ctx.fillStyle = '#ffffff'; // Keep white but maybe no shadow
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; // Dim future words
                ctx.shadowBlur = 0;
            }

            // Draw word
            // We align 'left' for individual words relative to currentX
            ctx.textAlign = 'left';
            ctx.fillText(word.text, currentX, 0);

            currentX += width;
        });

        // Reset text align
        ctx.textAlign = 'center';
    }

    private drawHeader() {
        const ctx = this.ctx;
        const { width, title, artist } = this.config;

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 32px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(title, 60, 60);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '500 24px Inter, sans-serif';
        ctx.fillText(artist, 60, 100);
        ctx.restore();
    }

    private drawFooter() {
        // Optional watermark
        const ctx = this.ctx;
        const { width, height } = this.config;

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '16px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('Yosync Studio', width - 40, height - 40);
        ctx.restore();
    }
}
