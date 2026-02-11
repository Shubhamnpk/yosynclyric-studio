import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { LyricLine, SyncMode } from '@/types/lyrics';
import { cn } from '@/lib/utils';
import { X, Play, Pause, ChevronLeft, ChevronRight, Maximize2, Minimize2, Type, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface KaraokeModeProps {
    lines: LyricLine[];
    activeLineId: string | null;
    activeWordIndex: number | null;
    currentTime: number;
    isPlaying: boolean;
    onPlayPause: () => void;
    onSeek: (time: number) => void;
    onClose: () => void;
    title: string;
    artist: string;
    duration: number;
    syncMode: SyncMode;
    audioUrl: string | null;
}

type FontSize = 'small' | 'medium' | 'large';

const FONT_SIZES: Record<FontSize, string> = {
    small: 'text-2xl md:text-3xl lg:text-4xl',
    medium: 'text-3xl md:text-5xl lg:text-6xl',
    large: 'text-4xl md:text-6xl lg:text-7xl',
};

// Shared transition curve — same as Spotify / Apple Music lyrics
const EASE_SMOOTH = 'cubic-bezier(0.4, 0, 0.2, 1)';

export const KaraokeMode = ({
    lines,
    activeLineId,
    activeWordIndex,
    currentTime,
    isPlaying,
    onPlayPause,
    onSeek,
    onClose,
    title,
    artist,
    duration,
    syncMode,
}: KaraokeModeProps) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const lineRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const [showControls, setShowControls] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [fontSize, setFontSize] = useState<FontSize>('medium');
    const controlsTimeoutRef = useRef<NodeJS.Timeout>();
    const lastAutoScrollTime = useRef(0);
    const isUserScrolling = useRef(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout>();

    const nonEmptyLines = useMemo(() => lines.filter(l => l.text.trim()), [lines]);

    // ── Custom smooth scroll with EaseOutQuart ──────────────────────────
    const smoothScrollTo = useCallback((container: HTMLElement, targetScroll: number, dur: number = 750) => {
        const startScroll = container.scrollTop;
        const distance = targetScroll - startScroll;
        if (Math.abs(distance) < 2) return;

        const startTime = performance.now();
        // EaseOutQuart — ultra-smooth deceleration
        const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / dur, 1);
            container.scrollTop = startScroll + distance * easeOutQuart(progress);
            if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }, []);

    // ── Auto-scroll to center active line ───────────────────────────────
    useEffect(() => {
        if (!activeLineId || isUserScrolling.current) return;

        const container = scrollContainerRef.current;
        const lineEl = lineRefs.current.get(activeLineId);
        if (!container || !lineEl) return;

        const containerH = container.clientHeight;
        const target = lineEl.offsetTop - containerH / 2 + lineEl.offsetHeight / 2;

        // 50ms delay lets opacity animate first → cinematic "glow then scroll" feel
        const id = setTimeout(() => {
            smoothScrollTo(container, Math.max(0, target), 700);
        }, 50);

        lastAutoScrollTime.current = Date.now();
        return () => clearTimeout(id);
    }, [activeLineId, smoothScrollTo]);

    // ── Mouse/Touch controls auto-hide ───────────────────────────────────
    useEffect(() => {
        const onInteraction = () => {
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => {
                if (isPlaying) setShowControls(false);
            }, 3000);
        };

        window.addEventListener('mousemove', onInteraction);
        window.addEventListener('mousedown', onInteraction);
        window.addEventListener('touchstart', onInteraction);
        window.addEventListener('keydown', onInteraction);

        return () => {
            window.removeEventListener('mousemove', onInteraction);
            window.removeEventListener('mousedown', onInteraction);
            window.removeEventListener('touchstart', onInteraction);
            window.removeEventListener('keydown', onInteraction);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, [isPlaying]);

    // ── Detect user scroll → pause auto-scroll for 3s ───────────────────
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
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    // ── Helpers ─────────────────────────────────────────────────────────
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullScreen(true);
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
            setIsFullScreen(false);
        }
    };

    const cycleFontSize = () => {
        const order: FontSize[] = ['small', 'medium', 'large'];
        setFontSize(order[(order.indexOf(fontSize) + 1) % order.length]);
    };

    const fmt = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    // ── Render ──────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[100] bg-black text-white selection:bg-white/20 overflow-hidden font-sans select-none">

            {/* ─── Animated Background Blobs ─────────────────────────── */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[10%] -left-[10%] w-[80%] h-[80%] rounded-full blur-[140px] opacity-20 animate-blob"
                    style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }}
                />
                <div
                    className="absolute top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full blur-[140px] opacity-20 animate-blob animation-delay-2000"
                    style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)' }}
                />
                <div
                    className="absolute -bottom-[20%] left-[20%] w-[75%] h-[75%] rounded-full blur-[140px] opacity-20 animate-blob animation-delay-4000"
                    style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)' }}
                />
            </div>

            {/* ─── Glassy Depth Layer ────────────────────────────────── */}
            <div className="absolute inset-0 z-[5] backdrop-blur-[100px] bg-black/40 pointer-events-none" />

            {/* ─── Top Header ────────────────────────────────────────── */}
            <div
                className="absolute top-0 inset-x-0 p-8 flex justify-between items-center z-[110]"
                style={{
                    opacity: showControls ? 1 : 0,
                    transform: showControls ? 'translateY(0)' : 'translateY(-16px)',
                    pointerEvents: showControls ? 'auto' : 'none',
                    transition: `opacity 700ms ${EASE_SMOOTH}, transform 700ms ${EASE_SMOOTH}`,
                }}
            >
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl md:text-3xl font-bold tracking-tight text-white/90 truncate max-w-[300px] md:max-w-xl">
                            {title || 'Untitled Track'}
                        </h2>
                        <div className="px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/60">
                            <Sparkles className="h-2.5 w-2.5" />
                            {syncMode === 'word' ? 'Word Sync' : 'Synced'}
                        </div>
                    </div>
                    <p className="text-sm md:text-lg text-white/50 font-medium">
                        {artist || 'Unknown Artist'}
                    </p>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <Button variant="ghost" size="icon" onClick={cycleFontSize}
                        className="rounded-full bg-white/5 hover:bg-white/15 h-11 w-11 text-white/70 hover:text-white transition-colors duration-300"
                        title="Change Font Size"
                    >
                        <Type className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={toggleFullScreen}
                        className="rounded-full bg-white/5 hover:bg-white/15 h-11 w-11 text-white/70 hover:text-white transition-colors duration-300"
                    >
                        {isFullScreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onClose}
                        className="rounded-full bg-white/5 hover:bg-white/20 h-11 w-11 text-white/70 hover:text-white transition-colors duration-300"
                    >
                        <X className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            {/* ─── Lyrics Scroll Area ────────────────────────────────── */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="h-full w-full overflow-y-auto no-scrollbar py-[45vh] px-6 md:px-[8%] lg:px-[12%] relative z-10"
                style={{
                    maskImage: 'linear-gradient(to bottom, transparent 2%, black 18%, black 82%, transparent 98%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 2%, black 18%, black 82%, transparent 98%)',
                }}
            >
                <div className="max-w-4xl mx-auto flex flex-col gap-4">
                    {nonEmptyLines.map((line, index) => {
                        const isActive = line.id === activeLineId;
                        const activeIdx = nonEmptyLines.findIndex(l => l.id === activeLineId);
                        const isPast = activeIdx !== -1 && index < activeIdx;
                        const distance = activeIdx === -1 ? 999 : Math.abs(index - activeIdx);

                        // Spotify-style: opacity only, no scale — feels cleaner
                        const opacity = isActive ? 1 : isPast ? 0.25 : Math.max(0.08, 0.45 - distance * 0.12);

                        return (
                            <div
                                key={line.id}
                                ref={(el) => { if (el) lineRefs.current.set(line.id, el); else lineRefs.current.delete(line.id); }}
                                className="py-5 cursor-pointer"
                                style={{
                                    opacity,
                                    transition: `opacity 600ms ${EASE_SMOOTH}`,
                                }}
                                onClick={() => {
                                    if (line.startTime !== null) {
                                        onSeek(line.startTime / 1000);
                                        isUserScrolling.current = false;
                                    }
                                }}
                            >
                                <p
                                    className={cn(
                                        'font-bold leading-[1.2] tracking-tight text-center',
                                        FONT_SIZES[fontSize],
                                    )}
                                    style={{
                                        color: isActive ? '#ffffff' : 'rgba(255,255,255,0.9)',
                                        textShadow: isActive
                                            ? '0 0 30px rgba(124, 58, 237, 0.5), 0 0 60px rgba(37, 99, 235, 0.25)'
                                            : 'none',
                                        transition: `text-shadow 600ms ${EASE_SMOOTH}, color 600ms ${EASE_SMOOTH}`,
                                    }}
                                >
                                    {syncMode === 'word' && line.words && line.words.length > 0 ? (
                                        <span className="flex flex-wrap justify-center gap-x-[0.25em] gap-y-2">
                                            {line.words.map((word, wIdx) => {
                                                const isWordActive = isActive && activeWordIndex === wIdx;
                                                const isWordPast = isActive && activeWordIndex !== null && wIdx < activeWordIndex;

                                                return (
                                                    <span
                                                        key={wIdx}
                                                        className="inline-block transform-gpu"
                                                        style={{
                                                            color: (isWordActive || isWordPast)
                                                                ? '#ffffff'
                                                                : isActive ? 'rgba(255,255,255,0.25)' : undefined,
                                                            textShadow: isWordActive
                                                                ? '0 0 20px rgba(255,255,255,0.5)'
                                                                : 'none',
                                                            transform: isWordActive ? 'scale(1.08)' : 'scale(1)',
                                                            transition: `color 400ms ${EASE_SMOOTH}, text-shadow 400ms ${EASE_SMOOTH}, transform 400ms ${EASE_SMOOTH}`,
                                                        }}
                                                    >
                                                        {word.text}
                                                    </span>
                                                );
                                            })}
                                        </span>
                                    ) : (
                                        line.text
                                    )}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── Playback Controls ─────────────────────────────────── */}
            <div
                className="absolute bottom-0 inset-x-0 pb-12 pt-20 px-8 bg-gradient-to-t from-black via-black/70 to-transparent z-[110]"
                style={{
                    opacity: showControls ? 1 : 0,
                    transform: showControls ? 'translateY(0)' : 'translateY(24px)',
                    pointerEvents: showControls ? 'auto' : 'none',
                    transition: `opacity 700ms ${EASE_SMOOTH}, transform 700ms ${EASE_SMOOTH}`,
                }}
            >
                <div className="max-w-4xl mx-auto flex flex-col gap-8">
                    {/* Progress */}
                    <div className="flex items-center gap-6 px-4">
                        <span className="text-[10px] tracking-[0.2em] font-black text-white/30 w-14 text-right tabular-nums">
                            {fmt(currentTime)}
                        </span>
                        <Slider
                            value={[currentTime]}
                            max={duration || 100}
                            step={0.1}
                            onValueChange={(val) => onSeek(val[0])}
                            className="flex-1"
                        />
                        <span className="text-[10px] tracking-[0.2em] font-black text-white/30 w-14 tabular-nums">
                            {fmt(duration)}
                        </span>
                    </div>

                    {/* Transport */}
                    <div className="flex items-center justify-center gap-12">
                        <Button
                            variant="ghost" size="icon"
                            className="h-16 w-16 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all duration-300 transform hover:scale-110 active:scale-90"
                            onClick={() => onSeek(Math.max(0, currentTime - 5))}
                        >
                            <ChevronLeft className="h-10 w-10" />
                        </Button>

                        <Button
                            size="icon"
                            className="h-24 w-24 rounded-full bg-white text-black hover:bg-white/90 shadow-[0_0_50px_rgba(255,255,255,0.25)] transition-all duration-300 transform hover:scale-110 active:scale-90"
                            onClick={onPlayPause}
                        >
                            {isPlaying
                                ? <Pause className="h-12 w-12 fill-current" />
                                : <Play className="h-12 w-12 fill-current ml-1.5" />
                            }
                        </Button>

                        <Button
                            variant="ghost" size="icon"
                            className="h-16 w-16 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all duration-300 transform hover:scale-110 active:scale-90"
                            onClick={() => onSeek(Math.min(duration, currentTime + 5))}
                        >
                            <ChevronRight className="h-10 w-10" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* ─── Post-processing layers ────────────────────────────── */}
            <div className="absolute inset-0 pointer-events-none z-[105] opacity-40 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
            <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black to-transparent pointer-events-none z-[100]" />
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none z-[100]" />
        </div>
    );
};

