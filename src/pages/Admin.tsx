import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Check,
    X,
    Shield,
    Clock,
    FileText,
    ArrowLeft,
    Search,
    Trash2,
    Database,
    Activity,
    Edit3,
    History,
    CheckCircle2,
    AlertCircle,
    Save,
    Loader2
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { parseLRC } from "@/utils/parseLRC";
import { Play, Pause, RotateCcw, Youtube, Music2, Link2, MonitorPlay } from "lucide-react";
import YouTube from "react-youtube";

const EASE_SMOOTH = 'cubic-bezier(0.4, 0, 0.2, 1)';

const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const PlaybackPreview = ({ lyrics, trackInfo }: { lyrics: string, trackInfo?: { track: string, artist: string } }) => {
    const { lines } = parseLRC(lyrics);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [videoId, setVideoId] = useState<string | null>(null);
    const [player, setPlayer] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [duration, setDuration] = useState(0);
    const isUserScrolling = useRef(false);
    const lastAutoScrollTime = useRef(0);
    const scrollTimeoutRef = useRef<NodeJS.Timeout>();
    const scrollAnimationRef = useRef<number>();

    // ── Custom smooth scroll with cancelation ────────────────────────
    const smoothScrollTo = useCallback((container: HTMLElement, targetScroll: number, dur: number = 400) => {
        if (scrollAnimationRef.current) {
            cancelAnimationFrame(scrollAnimationRef.current);
        }

        const startScroll = container.scrollTop;
        const distance = targetScroll - startScroll;
        if (Math.abs(distance) < 1) return;

        const startTime = performance.now();
        const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / dur, 1);

            container.scrollTop = startScroll + distance * easeOutQuart(progress);

            if (progress < 1) {
                scrollAnimationRef.current = requestAnimationFrame(animate);
            } else {
                scrollAnimationRef.current = undefined;
            }
        };
        scrollAnimationRef.current = requestAnimationFrame(animate);
    }, []);

    // Simulation fallback when no video is present
    useEffect(() => {
        let interval: any;
        if (isPlaying && !videoId) {
            // Estimate duration from last line if simulating
            const lastLineTime = lines[lines.length - 1]?.startTime ?? 0;
            setDuration(lastLineTime + 5000);

            interval = setInterval(() => {
                setCurrentTime(prev => {
                    const next = prev + (50 * playbackSpeed);
                    if (next >= (lastLineTime + 5000)) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return next;
                });
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isPlaying, playbackSpeed, videoId, lines]);

    // Fast sync with player
    useEffect(() => {
        let interval: any;
        if (player && isPlaying) {
            interval = setInterval(() => {
                try {
                    const time = player.getCurrentTime();
                    if (time !== undefined) {
                        setCurrentTime(time * 1000);
                    }
                } catch (e) {
                    console.error("Error getting player time", e);
                }
            }, 100);
        }
        return () => clearInterval(interval);
    }, [player, isPlaying]);

    const nonEmptyLines = useMemo(() => lines.filter(l => l.text.trim()), [lines]);

    const activeIndex = nonEmptyLines.findIndex((l, i) => {
        const nextTime = nonEmptyLines[i + 1]?.startTime ?? Infinity;
        return currentTime >= (l.startTime ?? 0) && currentTime < nextTime;
    });

    const activeLineId = activeIndex !== -1 ? nonEmptyLines[activeIndex]?.startTime?.toString() : null;

    // ── Auto-scroll to center active line ──────────────────────────────
    useEffect(() => {
        if (activeIndex === -1 || isUserScrolling.current) return;

        const container = scrollContainerRef.current;
        const lineEl = lineRefs.current.get(activeIndex);
        if (!container || !lineEl) return;

        const containerH = container.clientHeight;
        const target = lineEl.offsetTop - (containerH / 2) + (lineEl.offsetHeight / 2);

        lastAutoScrollTime.current = Date.now();
        smoothScrollTo(container, Math.max(0, target), 400);
    }, [activeIndex, smoothScrollTo]);

    const handleYoutubeInput = (url: string) => {
        setYoutubeUrl(url);
        const id = getYoutubeId(url);
        if (id) {
            setVideoId(id);
            setIsLoading(true);
            toast.success("Loading YouTube audio...");
        }
    };

    const togglePlay = () => {
        if (player) {
            if (isPlaying) player.pauseVideo();
            else player.playVideo();
        }
        setIsPlaying(!isPlaying);
    };

    const reset = () => {
        if (player) {
            player.seekTo(0);
            player.pauseVideo();
        }
        setCurrentTime(0);
        setIsPlaying(false);
    };

    const handleSeek = (timeMs: number) => {
        if (player) {
            player.seekTo(timeMs / 1000);
        }
        setCurrentTime(timeMs);
        isUserScrolling.current = false;
    };

    const formatMs = (ms: number) => {
        const totalSec = Math.floor(ms / 1000);
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div className="h-full flex flex-col gap-6 relative overflow-hidden">
            <div className="flex flex-col gap-4 p-5 bg-card border rounded-[2rem] shadow-xl shadow-primary/5 z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Button
                            size="icon"
                            variant="default"
                            className="h-14 w-14 rounded-full shadow-lg shadow-primary/30 bg-primary hover:scale-110 transition-transform active:scale-95"
                            onClick={togglePlay}
                            disabled={videoId && isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-7 w-7 animate-spin" />
                            ) : isPlaying ? (
                                <Pause className="h-7 w-7" />
                            ) : (
                                <Play className="h-7 w-7 ml-1" />
                            )}
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-10 w-10 rounded-full hover:bg-muted"
                            onClick={reset}
                        >
                            <RotateCcw className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col">
                            <span className="text-2xl font-mono font-bold tabular-nums text-primary tracking-tight">
                                {formatMs(currentTime)}
                                <span className="text-xs text-muted-foreground/50 ml-1">.{Math.floor((currentTime % 1000) / 10).toString().padStart(2, '0')}</span>
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                {videoId ? <MonitorPlay className="h-3 w-3 text-emerald-500" /> : <Activity className="h-3 w-3" />}
                                {videoId ? (isLoading ? "Syncing..." : "Linked Playback") : "Simulation Mode"}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Speed</Label>
                            {[1, 1.5, 2].map(speed => (
                                <Button
                                    key={speed}
                                    variant={playbackSpeed === speed ? "default" : "outline"}
                                    size="sm"
                                    className="h-7 w-12 rounded-lg text-[10px] font-bold"
                                    onClick={() => {
                                        setPlaybackSpeed(speed);
                                        if (player) player.setPlaybackRate(speed);
                                    }}
                                >
                                    {speed}x
                                </Button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-64">
                            <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Paste YouTube link for audio..."
                                className="pl-9 h-8 text-xs bg-muted/30 border-none rounded-full"
                                value={youtubeUrl}
                                onChange={(e) => handleYoutubeInput(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Music Slider */}
                <div className="flex items-center gap-4 px-2">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground w-10 tabular-nums">
                        {formatMs(currentTime)}
                    </span>
                    <Slider
                        value={[currentTime]}
                        max={duration || 1}
                        step={100}
                        onValueChange={(val) => handleSeek(val[0])}
                        className="flex-1 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono font-bold text-muted-foreground w-10 tabular-nums">
                        {formatMs(duration)}
                    </span>
                </div>

                {videoId && (
                    <div className="opacity-0 absolute pointer-events-none w-1 h-1 overflow-hidden">
                        <YouTube
                            videoId={videoId}
                            opts={{
                                height: '1',
                                width: '1',
                                playerVars: {
                                    autoplay: 0,
                                    controls: 0,
                                    modestbranding: 1,
                                    disablekb: 1,
                                    origin: window.location.origin
                                },
                            }}
                            onReady={(e) => {
                                setPlayer(e.target);
                                setIsLoading(false);
                                setDuration(e.target.getDuration() * 1000);
                                e.target.unMute();
                                e.target.setVolume(100);
                            }}
                            onStateChange={(e) => {
                                // 1 = playing, 2 = paused
                                if (e.data === 1) setIsPlaying(true);
                                if (e.data === 2) setIsPlaying(false);
                            }}
                            onError={() => {
                                setIsLoading(false);
                                toast.error("Error loading YouTube video. Check the link.");
                            }}
                        />
                    </div>
                )}
            </div>

            <div className="flex-1 border rounded-[2.5rem] bg-muted/5 overflow-hidden relative group z-10">
                <div
                    ref={scrollContainerRef}
                    className="absolute inset-0 overflow-y-auto no-scrollbar"
                    onScroll={() => {
                        if (Date.now() - lastAutoScrollTime.current < 150) return;
                        isUserScrolling.current = true;
                        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
                        scrollTimeoutRef.current = setTimeout(() => {
                            isUserScrolling.current = false;
                        }, 3000);
                    }}
                >
                    {/* Top spacer lets first line center */}
                    <div className="h-[25%] flex-shrink-0" />

                    <div className="px-8 md:px-12 space-y-6 pb-[40%] max-w-3xl mx-auto">
                        {nonEmptyLines.map((line, idx) => {
                            const isActive = idx === activeIndex;
                            const isPast = idx < activeIndex;
                            const opacity = isActive ? 1 : isPast ? 0.7 : 0.4;

                            return (
                                <div
                                    key={idx}
                                    ref={(el) => { if (el) lineRefs.current.set(idx, el); else lineRefs.current.delete(idx); }}
                                    className="cursor-pointer py-4"
                                    style={{
                                        opacity,
                                        transition: `opacity 400ms ${EASE_SMOOTH}`,
                                    }}
                                    onClick={() => handleSeek(line.startTime ?? 0)}
                                >
                                    <p
                                        className={cn(
                                            "font-bold leading-[1.2] tracking-tight text-center text-xl md:text-4xl",
                                            !isActive && "text-muted-foreground/50"
                                        )}
                                        style={{
                                            color: isActive ? 'var(--primary)' : 'currentColor',
                                            textShadow: isActive
                                                ? '0 0 30px hsla(var(--primary), 0.4)'
                                                : 'none',
                                            transition: `all 400ms ${EASE_SMOOTH}`,
                                        }}
                                    >
                                        <span className="block text-[10px] font-mono opacity-40 mb-1">
                                            {formatMs(line.startTime ?? 0)}
                                        </span>
                                        {line.text}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminPage = () => {
    const navigate = useNavigate();
    
    // Server-side auth state
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [password, setPassword] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [adminSecret, setAdminSecret] = useState("");

    // Server-side auth verification mutation
    const verifyAdminMutation = useMutation(api.lyrics.verifyAdmin);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) {
            toast.error("Please enter a password");
            return;
        }
        
        try {
            setIsVerifying(true);
            const isValid = await verifyAdminMutation({ password });
            if (isValid) {
                setIsAuthorized(true);
                setAdminSecret(password); // Store the password as adminSecret for subsequent calls
                toast.success("Welcome, Admin");
            } else {
                toast.error("Invalid password");
            }
        } catch (error) {
            toast.error("Authentication failed");
        } finally {
            setIsVerifying(false);
        }
    };

    const [adminView, setAdminView] = useState<"pending" | "approved" | "rejected" | "all">("pending");
    const [searchQuery, setSearchQuery] = useState("");

    // Data Hooks - Only initialize after server-side auth succeeds
    const allLyrics = isAuthorized ? useQuery(api.lyrics.listAll, { adminSecret }) : undefined;
    const stats = isAuthorized ? useQuery(api.lyrics.getStats, { adminSecret }) : undefined;
    const updateStatus = useMutation(api.lyrics.updateStatus);
    const updateLyrics = useMutation(api.lyrics.updateLyrics);
    const deleteLyric = useMutation(api.lyrics.deleteLyric);

    // Filter Logic
    const filteredLyrics = allLyrics?.filter(l => {
        const matchesStatus = adminView === "all" ? true : l.status === adminView;
        const matchesQuery = !searchQuery ||
            l.trackName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.artistName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesQuery;
    });

    const [selectedLyric, setSelectedLyric] = useState<any>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editData, setEditData] = useState<any>(null);

    const handleSelect = (lyric: any) => {
        setSelectedLyric(lyric);
        setEditData({ ...lyric });
        setIsEditMode(false);
    };

    const handleStatus = async (id: Id<"lyrics">, status: "approved" | "rejected") => {
        try {
            await updateStatus({ id, status, adminSecret });
            toast.success(`Lyrics ${status} successfully`);
            if (selectedLyric?._id === id) setSelectedLyric(null);
        } catch (error) {
            toast.error(`Failed to update status`);
        }
    };

    const handleDelete = async (id: Id<"lyrics">) => {
        if (!confirm("Are you sure you want to delete this lyrics entry? This cannot be undone.")) return;
        try {
            await deleteLyric({ id, adminSecret });
            toast.success("Lyrics deleted permanently");
            setSelectedLyric(null);
        } catch (error) {
            toast.error("Failed to delete lyrics");
        }
    };

    const handleUpdate = async () => {
        try {
            await updateLyrics({
                id: editData._id,
                trackName: editData.trackName,
                artistName: editData.artistName,
                albumName: editData.albumName,
                plainLyrics: editData.plainLyrics,
                syncedLyrics: editData.syncedLyrics,
                adminSecret,
            });
            toast.success("Lyrics updated successfully");
            setIsEditMode(false);
            // Update the selected lyric in view
            setSelectedLyric(editData);
        } catch (error) {
            toast.error("Failed to update lyrics");
        }
    };

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <Card className="w-full max-w-md border-none shadow-2xl bg-card/50 backdrop-blur-xl">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
                            <Shield className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight">Admin Access</CardTitle>
                        <CardDescription className="text-lg">Enter password to manage lyrics database</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleLogin}>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="h-12 text-center text-lg tracking-widest bg-muted/50 border-none focus-visible:ring-1"
                                        autoFocus
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3 pb-8">
                            <Button type="submit" className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20">
                                Authenticate
                            </Button>
                            <Button variant="ghost" onClick={() => navigate("/")} className="w-full h-11 text-muted-foreground">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
            <SEO title="Admin Power Panel" description="Manage, edit, and approve community-submitted lyrics with advanced tools." />

            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate('/')}
                                className="rounded-full h-10 w-10 mr-2"
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                <Shield className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">Admin Power Panel</h1>
                        </div>
                        <p className="text-muted-foreground text-lg">Central hub for quality control and database management.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAuthorized(false);
                                setPassword("");
                                setAdminSecret("");
                            }}
                            className="rounded-full border-muted-foreground/20"
                        >
                            Log Out
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-muted/30 border-none shadow-sm overflow-hidden relative">
                        <CardHeader className="p-4 pb-0">
                            <CardDescription className="text-xs uppercase tracking-wider font-bold">Total Lyrics</CardDescription>
                            <CardTitle className="text-2xl">{stats?.total || 0}</CardTitle>
                        </CardHeader>
                        <div className="absolute top-2 right-2 p-2 rounded-lg bg-primary/10 text-primary">
                            <Database className="h-4 w-4" />
                        </div>
                        <div className="h-1 w-full bg-primary/20 mt-4" />
                    </Card>
                    <Card className="bg-emerald-500/5 border-emerald-500/10 shadow-sm overflow-hidden relative">
                        <CardHeader className="p-4 pb-0">
                            <CardDescription className="text-xs uppercase tracking-wider font-bold text-emerald-600">Approved</CardDescription>
                            <CardTitle className="text-2xl text-emerald-700">{stats?.approved || 0}</CardTitle>
                        </CardHeader>
                        <div className="absolute top-2 right-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div className="h-1 w-full bg-emerald-500/20 mt-4" />
                    </Card>
                    <Card className="bg-amber-500/5 border-amber-500/10 shadow-sm overflow-hidden relative">
                        <CardHeader className="p-4 pb-0">
                            <CardDescription className="text-xs uppercase tracking-wider font-bold text-amber-600">Pending</CardDescription>
                            <CardTitle className="text-2xl text-amber-700">{stats?.pending || 0}</CardTitle>
                        </CardHeader>
                        <div className="absolute top-2 right-2 p-2 rounded-lg bg-amber-500/10 text-amber-600">
                            <History className="h-4 w-4" />
                        </div>
                        <div className="h-1 w-full bg-amber-500/20 mt-4" />
                    </Card>
                    <Card className="bg-blue-500/5 border-blue-500/10 shadow-sm overflow-hidden relative">
                        <CardHeader className="p-4 pb-0">
                            <CardDescription className="text-xs uppercase tracking-wider font-bold text-blue-600">Total Imports</CardDescription>
                            <CardTitle className="text-2xl text-blue-700">{stats?.totalSearches || 0}</CardTitle>
                        </CardHeader>
                        <div className="absolute top-2 right-2 p-2 rounded-lg bg-blue-500/10 text-blue-600">
                            <Activity className="h-4 w-4" />
                        </div>
                        <div className="h-1 w-full bg-blue-500/20 mt-4" />
                    </Card>
                </div>

                {/* Main Content Areas */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <Tabs
                            value={adminView}
                            onValueChange={(v: any) => setAdminView(v)}
                            className="w-full md:w-auto"
                        >
                            <TabsList className="bg-muted p-1 rounded-xl">
                                <TabsTrigger value="pending" className="rounded-lg px-4 font-bold">Pending</TabsTrigger>
                                <TabsTrigger value="approved" className="rounded-lg px-4 font-bold">Approved</TabsTrigger>
                                <TabsTrigger value="rejected" className="rounded-lg px-4 font-bold">Rejected</TabsTrigger>
                                <TabsTrigger value="all" className="rounded-lg px-4 font-bold">All Library</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Filter results..."
                                className="pl-10 h-10 bg-muted/50 border-none rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-card border rounded-2xl overflow-hidden shadow-xl shadow-primary/5">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-b border-muted">
                                    <TableHead className="font-bold py-4">Status</TableHead>
                                    <TableHead className="font-bold py-4">Track / Artist</TableHead>
                                    <TableHead className="font-bold py-4">Duration</TableHead>
                                    <TableHead className="font-bold py-4 text-center">Engagement</TableHead>
                                    <TableHead className="font-bold py-4 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLyrics?.map((lyric) => (
                                    <TableRow key={lyric._id} className="hover:bg-muted/20 transition-colors border-b border-muted/50 last:border-0">
                                        <TableCell className="py-5">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "font-bold uppercase text-[10px] px-2 py-0.5 rounded-full border-none",
                                                    lyric.status === "approved" ? "bg-emerald-500/10 text-emerald-600" :
                                                        lyric.status === "rejected" ? "bg-destructive/10 text-destructive" :
                                                            "bg-amber-500/10 text-amber-600"
                                                )}
                                            >
                                                {lyric.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-base text-foreground line-clamp-1">{lyric.trackName}</span>
                                                <span className="text-sm text-primary font-medium line-clamp-1">{lyric.artistName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex items-center gap-1.5 text-sm font-medium">
                                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                {Math.floor(lyric.duration / 60)}:{(lyric.duration % 60).toString().padStart(2, '0')}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center py-5">
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-bold">{lyric.searchHistory || 0}</span>
                                                <span className="text-[10px] text-muted-foreground">IMPORTS</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-5">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-all"
                                                    onClick={() => handleSelect(lyric)}
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </Button>
                                                {lyric.status !== "approved" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 rounded-full text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950 transition-all"
                                                        onClick={() => handleStatus(lyric._id, "approved")}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-full text-destructive hover:bg-destructive/10 transition-all"
                                                    onClick={() => handleDelete(lyric._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredLyrics?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-96 text-center">
                                            <div className="flex flex-col items-center justify-center py-12">
                                                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                                                    <Search className="h-10 w-10 text-muted-foreground/30" />
                                                </div>
                                                <h3 className="text-lg font-bold">No results found</h3>
                                                <p className="text-muted-foreground mt-1 px-4 max-w-sm mx-auto text-center">
                                                    Try changing your filters or searching for something else.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Powerful Preview & Edit Dialog */}
            <Dialog open={!!selectedLyric} onOpenChange={(open) => !open && setSelectedLyric(null)}>
                <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-6 md:p-8 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-b border-primary/10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1">
                                {isEditMode ? (
                                    <div className="space-y-2 max-w-md">
                                        <Input
                                            value={editData.trackName}
                                            onChange={(e) => setEditData({ ...editData, trackName: e.target.value })}
                                            className="h-10 text-xl font-bold bg-background/50 border-primary/30"
                                            placeholder="Track Name"
                                        />
                                        <div className="flex gap-2">
                                            <Input
                                                value={editData.artistName}
                                                onChange={(e) => setEditData({ ...editData, artistName: e.target.value })}
                                                className="h-9 text-sm bg-background/50 border-primary/20 font-medium"
                                                placeholder="Artist Name"
                                            />
                                            <Input
                                                value={editData.albumName || ""}
                                                onChange={(e) => setEditData({ ...editData, albumName: e.target.value })}
                                                className="h-9 text-sm bg-background/50 border-primary/20"
                                                placeholder="Album (Optional)"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <DialogTitle className="text-3xl font-bold tracking-tight">
                                            {selectedLyric?.trackName}
                                        </DialogTitle>
                                        <DialogDescription className="text-lg font-medium text-primary mt-1">
                                            {selectedLyric?.artistName} • {selectedLyric?.albumName || 'Unknown Album'}
                                        </DialogDescription>
                                    </>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {isEditMode ? (
                                    <>
                                        <Button variant="outline" onClick={() => setIsEditMode(false)} className="rounded-xl px-6">
                                            Cancel
                                        </Button>
                                        <Button onClick={handleUpdate} className="rounded-xl px-8 shadow-lg shadow-primary/20 bg-primary">
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsEditMode(true)}
                                            className="rounded-xl px-6 border-primary/20 hover:bg-primary/5 text-primary"
                                        >
                                            <Edit3 className="h-4 w-4 mr-2" />
                                            Edit Content
                                        </Button>
                                        <div className="h-8 w-px bg-muted mx-2 hidden md:block" />
                                        <Button
                                            variant="destructive"
                                            onClick={() => handleStatus(selectedLyric._id, "rejected")}
                                            className="rounded-xl px-6"
                                            disabled={selectedLyric?.status === "rejected"}
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Reject
                                        </Button>
                                        <Button
                                            variant="default"
                                            onClick={() => handleStatus(selectedLyric._id, "approved")}
                                            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-8 shadow-lg shadow-emerald-500/20"
                                            disabled={selectedLyric?.status === "approved"}
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Approve
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden p-6 md:p-8">
                        <Tabs defaultValue="synced" className="h-full flex flex-col">
                            <TabsList className="w-fit mb-6 h-12 p-1 bg-muted/50 rounded-2xl">
                                <TabsTrigger value="synced" className="rounded-xl px-8 font-bold">Synced Lyrics</TabsTrigger>
                                <TabsTrigger value="playback" className="rounded-xl px-8 font-bold flex items-center gap-2">
                                    <Music2 className="h-4 w-4" />
                                    Playback Check
                                </TabsTrigger>
                                <TabsTrigger value="plain" className="rounded-xl px-8 font-bold">Plain Text</TabsTrigger>
                            </TabsList>

                            <TabsContent value="playback" className="flex-1 overflow-hidden m-0">
                                <PlaybackPreview
                                    lyrics={selectedLyric?.syncedLyrics || ""}
                                    trackInfo={{
                                        track: selectedLyric?.trackName,
                                        artist: selectedLyric?.artistName
                                    }}
                                />
                            </TabsContent>

                            <TabsContent value="synced" className="flex-1 overflow-hidden m-0">
                                <div className="h-full flex flex-col gap-4">
                                    <div className="flex items-center gap-2 p-3 bg-blue-500/5 text-blue-600 rounded-xl border border-blue-500/10 text-xs font-medium">
                                        <Clock className="h-4 w-4" />
                                        <span>Synchronized timestamps are preserved in [mm:ss.xx] format.</span>
                                    </div>
                                    <div className="flex-1 border rounded-3xl bg-muted/10 p-4 md:p-6 overflow-hidden focus-within:ring-2 ring-primary/20 transition-all">
                                        {isEditMode ? (
                                            <Textarea
                                                className="h-full resize-none bg-transparent border-none focus-visible:ring-0 p-0 font-mono text-sm leading-relaxed"
                                                value={editData.syncedLyrics}
                                                onChange={(e) => setEditData({ ...editData, syncedLyrics: e.target.value })}
                                            />
                                        ) : (
                                            <ScrollArea className="h-full">
                                                <pre className="text-xs md:text-sm font-mono leading-relaxed whitespace-pre-wrap">
                                                    {selectedLyric?.syncedLyrics}
                                                </pre>
                                            </ScrollArea>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="plain" className="flex-1 overflow-hidden m-0">
                                <div className="h-full border rounded-3xl bg-muted/10 p-4 md:p-6 overflow-hidden focus-within:ring-2 ring-primary/20 transition-all">
                                    {isEditMode ? (
                                        <Textarea
                                            className="h-full resize-none bg-transparent border-none focus-visible:ring-0 p-0 font-sans text-sm leading-relaxed"
                                            value={editData.plainLyrics}
                                            onChange={(e) => setEditData({ ...editData, plainLyrics: e.target.value })}
                                        />
                                    ) : (
                                        <ScrollArea className="h-full">
                                            <pre className="text-xs md:text-sm font-sans leading-relaxed whitespace-pre-wrap">
                                                {selectedLyric?.plainLyrics}
                                            </pre>
                                        </ScrollArea>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <DialogFooter className="px-8 py-6 bg-muted/30 border-t border-muted border-none flex sm:justify-between items-center">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                            <Activity className="h-3 w-3" />
                            <span>Unique Contribution ID: {selectedLyric?._id}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full h-10 border-red-500/20 text-red-600 hover:bg-red-50"
                                onClick={() => {
                                    const query = encodeURIComponent(`${selectedLyric?.trackName} ${selectedLyric?.artistName} lyrics`);
                                    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
                                }}
                            >
                                <Youtube className="h-4 w-4 mr-2" />
                                Find on YouTube
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 h-10 w-10 p-0 rounded-full"
                                onClick={() => handleDelete(selectedLyric._id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminPage;
