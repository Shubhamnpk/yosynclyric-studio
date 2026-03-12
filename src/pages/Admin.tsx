import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/hooks/useAuth";
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
    ArrowLeft,
    Search,
    Trash2,
    Database,
    Activity,
    Edit3,
    History,
    CheckCircle2,
    Save,
    Loader2,
    Sparkles
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
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">Speed</span>
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
                                    style={{ opacity, transition: `opacity 400ms ${EASE_SMOOTH}` }}
                                    onClick={() => handleSeek(line.startTime ?? 0)}
                                >
                                    <p
                                        className={cn(
                                            "font-bold leading-[1.2] tracking-tight text-center text-xl md:text-4xl",
                                            !isActive && "text-muted-foreground/50"
                                        )}
                                        style={{
                                            color: isActive ? 'var(--primary)' : 'currentColor',
                                            textShadow: isActive ? '0 0 30px hsla(var(--primary), 0.4)' : 'none',
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

// Admin Page Component
const AdminPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, login, logout, token } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [adminView, setAdminView] = useState<"pending" | "improvement_pending" | "approved" | "rejected" | "all">("pending");
    const [searchQuery, setSearchQuery] = useState("");

    const [selectedLyric, setSelectedLyric] = useState<any>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isRejecting, setIsRejecting] = useState(false);

    // Data hooks - use skip to avoid calling when not authenticated
    const allLyrics = useQuery(
        api.lyrics.listAll,
        token ? { token } : "skip"
    );
    const stats = useQuery(
        api.lyrics.getStats,
        token ? { token } : "skip"
    );
    const updateStatus = useMutation(api.lyrics.updateStatus);
    const updateLyrics = useMutation(api.lyrics.updateLyrics);
    const deleteLyric = useMutation(api.lyrics.deleteLyric);
    const migrateLegacy = useMutation(api.lyrics.migrateLegacyLyrics);

    const parentLyric = useQuery(
        api.lyrics.getById,
        selectedLyric?.parentLyricId ? { id: selectedLyric.parentLyricId } : "skip"
    );

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        const success = await login(email, password);
        
        if (success) {
            toast.success("Welcome, Admin!");
        } else {
            toast.error("Invalid credentials");
        }
        setIsLoading(false);
    };

    const handleLogout = async () => {
        await logout();
        toast.success("Logged out successfully");
    };

    const handleMigrate = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const result = await migrateLegacy({ token });
            toast.success(`Successfully migrated ${result.updated} legacy records!`);
        } catch (error) {
            toast.error("Migration failed");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLyrics = allLyrics?.filter(l => {
        const matchesStatus = adminView === "all" ? true : l.status === adminView;
        const matchesQuery = !searchQuery ||
            l.trackName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.artistName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesQuery;
    });


    const handleSelect = (lyric: any) => {
        setSelectedLyric(lyric);
        setEditData({ ...lyric });
        setIsEditMode(false);
    };

    const handleStatus = async (id: Id<"lyrics">, status: "approved" | "rejected") => {
        try {
            await updateStatus({ id, status, rejectionReason: status === "rejected" ? rejectionReason : undefined, token });
            toast.success(`Lyrics ${status} successfully`);
            if (selectedLyric?._id === id) {
                setSelectedLyric(null);
                setRejectionReason("");
                setIsRejecting(false);
            }
        } catch (error) {
            toast.error(`Failed to update status`);
        }
    };

    const handleDelete = async (id: Id<"lyrics">) => {
        if (!confirm("Are you sure you want to delete this lyrics entry?")) return;
        try {
            await deleteLyric({ id, token: token || "" });
            toast.success("Lyrics deleted");
            setSelectedLyric(null);
        } catch (error) {
            toast.error("Failed to delete");
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
                token: token || "",
            });
            toast.success("Lyrics updated successfully");
            setIsEditMode(false);
            setSelectedLyric(editData);
        } catch (error) {
            toast.error("Failed to update lyrics");
        }
    };

    // Login form
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <Card className="w-full max-w-md border-none shadow-2xl bg-card/50 backdrop-blur-xl">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
                            <Shield className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight">Admin Access</CardTitle>
                        <CardDescription className="text-lg">Sign in to manage lyrics</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleLogin}>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        type="email"
                                        placeholder="admin@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-12 bg-muted/50 border-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="h-12 text-center text-lg tracking-widest bg-muted/50 border-none"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3 pb-8">
                            <Button type="submit" className="w-full h-12 text-lg font-bold rounded-xl" disabled={isLoading}>
                                {isLoading ? "Signing in..." : "Sign In"}
                            </Button>
                            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="w-full h-11 text-muted-foreground">
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
            <SEO title="Admin Power Panel" description="Manage, edit, and approve community-submitted lyrics." />

            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate('/dashboard')}
                                className="rounded-full h-10 w-10 mr-2"
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                <Shield className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">Admin Power Panel</h1>
                        </div>
                        <p className="text-muted-foreground text-lg">
                            Welcome, {user?.name || user?.email}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            onClick={handleMigrate} 
                            disabled={isLoading}
                            className="rounded-full border-primary/20 hover:bg-primary/5 text-primary"
                        >
                            <History className="h-4 w-4 mr-2" />
                            Migrate Legacy
                        </Button>
                        <Button variant="outline" onClick={handleLogout} className="rounded-full">
                            Log Out
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card className="bg-muted/30 border-none shadow-sm">
                        <CardHeader className="p-4 pb-0">
                            <CardDescription className="text-xs uppercase tracking-wider font-bold">Total</CardDescription>
                            <CardTitle className="text-2xl">{stats?.total || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-emerald-500/5 border-emerald-500/10">
                        <CardHeader className="p-4 pb-0">
                            <CardDescription className="text-xs uppercase tracking-wider font-bold text-emerald-600">Approved</CardDescription>
                            <CardTitle className="text-2xl text-emerald-700">{stats?.approved || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-amber-500/5 border-amber-500/10">
                        <CardHeader className="p-4 pb-0">
                            <CardDescription className="text-xs uppercase tracking-wider font-bold text-amber-600">Pending</CardDescription>
                            <CardTitle className="text-2xl text-amber-700">{stats?.pending || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-primary/5 border-primary/10">
                        <CardHeader className="p-4 pb-0">
                            <CardDescription className="text-xs uppercase tracking-wider font-bold text-primary">Improvements</CardDescription>
                            <CardTitle className="text-2xl text-primary font-black">{(stats as any)?.improvements || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-blue-500/5 border-blue-500/10">
                        <CardHeader className="p-4 pb-0">
                            <CardDescription className="text-xs uppercase tracking-wider font-bold text-blue-600">Searches</CardDescription>
                            <CardTitle className="text-2xl text-blue-700">{stats?.totalSearches || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <Tabs value={adminView} onValueChange={(v: any) => setAdminView(v)} className="w-full md:w-auto">
                            <TabsList className="bg-muted p-1 rounded-xl">
                                <TabsTrigger value="pending" className="rounded-lg px-4 font-bold">Pending</TabsTrigger>
                                <TabsTrigger value="improvement_pending" className="rounded-lg px-4 font-bold flex gap-2">
                                    Improvements
                                    <Badge variant="secondary" className="h-4 p-0 px-1 text-[9px] bg-primary text-primary-foreground">
                                        {allLyrics?.filter(l => l.status === "improvement_pending").length || 0}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="approved" className="rounded-lg px-4 font-bold">Approved</TabsTrigger>
                                <TabsTrigger value="rejected" className="rounded-lg px-4 font-bold">Rejected</TabsTrigger>
                                <TabsTrigger value="all" className="rounded-lg px-4 font-bold">All</TabsTrigger>
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

                    <div className="bg-card border rounded-2xl overflow-hidden shadow-xl">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="font-bold">Status</TableHead>
                                    <TableHead className="font-bold">Track / Artist</TableHead>
                                    <TableHead className="font-bold">Duration</TableHead>
                                    <TableHead className="font-bold">Contributor</TableHead>
                                    <TableHead className="font-bold text-center">Searches</TableHead>
                                    <TableHead className="font-bold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLyrics?.map((lyric) => (
                                    <TableRow key={lyric._id} className="hover:bg-muted/20">
                                        <TableCell>
                                            <Badge variant="outline" className={cn(
                                                "font-bold uppercase text-[10px]",
                                                lyric.status === "approved" ? "bg-emerald-500/10 text-emerald-600" :
                                                lyric.status === "rejected" ? "bg-destructive/10 text-destructive" :
                                                lyric.status === "improvement_pending" ? "bg-primary/10 text-primary" :
                                                "bg-amber-500/10 text-amber-600"
                                            )}>
                                                {lyric.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold">{lyric.trackName}</span>
                                                <span className="text-sm text-primary">{lyric.artistName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                {Math.floor(lyric.duration / 60)}:{(lyric.duration % 60).toString().padStart(2, '0')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                    {lyric.submittedBy?.[0]?.toUpperCase() || 'L'}
                                                </div>
                                                <span className="text-xs font-medium truncate max-w-[120px]">
                                                    {lyric.submittedBy}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">{lyric.searchHistory || 0}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleSelect(lyric)}>
                                                    <Edit3 className="h-4 w-4" />
                                                </Button>
                                                {lyric.status !== "approved" && (
                                                    <Button variant="ghost" size="icon" className="text-emerald-600" onClick={() => handleStatus(lyric._id, "approved")}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(lyric._id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!selectedLyric} onOpenChange={(open) => {
                if (!open) {
                    setSelectedLyric(null);
                    setRejectionReason("");
                    setIsRejecting(false);
                }
            }}>
                <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent">
                        <DialogTitle>{selectedLyric?.trackName}</DialogTitle>
                        <DialogDescription className="flex flex-wrap items-center gap-4">
                            <span>{selectedLyric?.artistName} • {selectedLyric?.albumName}</span>
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                                Contributor: {selectedLyric?.submittedBy}
                            </Badge>
                            {selectedLyric?.parentLyricId && (
                                <Badge variant="outline" className="border-primary/30 text-primary flex gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    IMPROVEMENT REQUEST
                                </Badge>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden p-6">
                        <Tabs defaultValue="synced" className="h-full flex flex-col">
                            <TabsList className="w-fit mb-4">
                                <TabsTrigger value="synced">Synced Lyrics</TabsTrigger>
                                {selectedLyric?.parentLyricId && (
                                    <TabsTrigger value="compare" className="bg-primary/5 text-primary">Compare Changes</TabsTrigger>
                                )}
                                <TabsTrigger value="playback">Preview</TabsTrigger>
                                <TabsTrigger value="plain">Plain</TabsTrigger>
                            </TabsList>

                            {selectedLyric?.parentLyricId && (
                                <TabsContent value="compare" className="flex-1 overflow-hidden m-0">
                                    <div className="grid grid-cols-2 h-full gap-4">
                                        <div className="flex flex-col border rounded-xl overflow-hidden">
                                            <div className="bg-muted p-2 text-[10px] font-bold uppercase tracking-widest flex justify-between">
                                                <span>Original Version</span>
                                                <span className="text-muted-foreground">Live Record</span>
                                            </div>
                                            <ScrollArea className="flex-1 p-4 bg-muted/5">
                                                <pre className="text-xs font-mono whitespace-pre-wrap opacity-60 italic">{parentLyric?.syncedLyrics || "Loading original..."}</pre>
                                            </ScrollArea>
                                        </div>
                                        <div className="flex flex-col border border-primary/20 rounded-xl overflow-hidden shadow-lg shadow-primary/5">
                                            <div className="bg-primary/10 p-2 text-[10px] font-bold uppercase tracking-widest text-primary flex justify-between">
                                                <span>Improvement Proposal</span>
                                                <span className="animate-pulse">Suggested</span>
                                            </div>
                                            <ScrollArea className="flex-1 p-4 bg-primary/5">
                                                <pre className="text-xs font-mono whitespace-pre-wrap font-bold text-primary">{selectedLyric?.syncedLyrics}</pre>
                                            </ScrollArea>
                                        </div>
                                    </div>
                                </TabsContent>
                            )}

                            <TabsContent value="playback" className="flex-1 overflow-hidden m-0">
                                <PlaybackPreview lyrics={selectedLyric?.syncedLyrics || ""} />
                            </TabsContent>

                            <TabsContent value="synced" className="flex-1 overflow-hidden m-0">
                                <ScrollArea className="h-full">
                                    <pre className="text-sm font-mono whitespace-pre-wrap">{selectedLyric?.syncedLyrics}</pre>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="plain" className="flex-1 overflow-hidden m-0">
                                <ScrollArea className="h-full">
                                    <pre className="text-sm whitespace-pre-wrap">{selectedLyric?.plainLyrics}</pre>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <DialogFooter className="p-4 border-t flex flex-col gap-4">
                        {isRejecting ? (
                            <div className="w-full space-y-3 p-4 bg-destructive/5 rounded-xl border border-destructive/10">
                                <Label className="text-xs font-bold uppercase text-destructive">Rejection Reason</Label>
                                <Textarea 
                                    placeholder="Tell the contributor why this was rejected (e.g., incorrect timestamps, typos...)"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="min-h-[100px] bg-background border-destructive/20 focus:border-destructive"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" onClick={() => setIsRejecting(false)}>Cancel</Button>
                                    <Button 
                                        variant="destructive" 
                                        disabled={!rejectionReason.trim()}
                                        onClick={() => handleStatus(selectedLyric._id, "rejected")}
                                    >
                                        Confirm Rejection
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex w-full justify-between items-center">
                                <div className="flex gap-2">
                                    <Button variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(selectedLyric._id)}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Forever
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="border-destructive/20 text-destructive hover:bg-destructive/5" onClick={() => setIsRejecting(true)}>
                                        Reject Submission
                                    </Button>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20" onClick={() => handleStatus(selectedLyric._id, "approved")}>
                                        <Check className="h-4 w-4 mr-2" />
                                        Approve & Publish
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminPage;
