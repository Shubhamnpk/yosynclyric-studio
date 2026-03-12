import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Search, Music, Clock, Loader2, UploadCloud, Database, Globe, CheckCircle2, X, Sparkles, Diff, LayoutGrid, FileText } from 'lucide-react';
import { LrcLibApi, LRCLibSearchResult } from '@/services/lrcLib';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { LyricsProject } from '@/types/lyrics';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { User } from 'lucide-react';

interface PublishDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: LyricsProject;
    audioDuration?: number;
}

export const PublishDialog = ({ open, onOpenChange, project, audioDuration }: PublishDialogProps) => {
    const [trackName, setTrackName] = useState(project.title);
    const [artistName, setArtistName] = useState(project.artist);
    const [albumName, setAlbumName] = useState(project.album || '');
    const [duration, setDuration] = useState(audioDuration ? Math.round(audioDuration) : (project.duration || 0));

    const [publishToLrcLib, setPublishToLrcLib] = useState(true);
    const [publishToYosync, setPublishToYosync] = useState(true);

    const publishMutation = useMutation(api.lyrics.publish);
    const ensureGuestMutation = useMutation(api.auth.ensureGuestUser);
    const { submissionUsername, user } = useAuth();

    const [isDuplicate, setIsDuplicate] = useState(false);
    const [originalId, setOriginalId] = useState<string | null>(null);
    const [parentLyricId, setParentLyricId] = useState<string | null>(null);
    const [showComparison, setShowComparison] = useState(false);

    const parentLyric = useQuery(api.lyrics.getById, parentLyricId ? { id: parentLyricId as any } : "skip");

    // Update state when props change
    useEffect(() => {
        if (open) {
            setTrackName(project.title);
            setArtistName(project.artist);
            setAlbumName(project.album || '');
            if (audioDuration) {
                setDuration(Math.round(audioDuration));
            } else if (project.duration) {
                setDuration(project.duration);
            }
        }
    }, [open, project.title, project.artist, project.album, project.duration, audioDuration]);

    const hasContent = project.lines.length > 0 && project.lines.some(l => l.text.trim().length > 0);
    const hasTimestamps = project.lines.some(l => l.startTime !== null);

    const isFormValid = trackName && artistName && duration && hasContent;

    // Yosync only allows synced lyrics
    const canPublishToYosync = hasTimestamps && isFormValid;

    const [publishing, setPublishing] = useState(false);
    const [status, setStatus] = useState('');

    const handlePublish = async () => {
        if (!isFormValid) {
            toast.error('Please check all fields and ensure the project has lyrics');
            return;
        }

        if (publishToYosync && !hasTimestamps) {
            toast.error('Only synchronized lyrics can be published to Yosync Database');
            return;
        }

        if (!publishToLrcLib && !publishToYosync) {
            toast.error('Please select at least one destination to publish');
            return;
        }

        setPublishing(true);

        try {
            const plainLyrics = project.lines.map(l => l.text).join('\n');
            const syncedLyrics = project.lines.map(l => {
                const totalSeconds = (l.startTime || 0) / 1000;
                const mm = Math.floor(totalSeconds / 60);
                const ss = Math.floor(totalSeconds % 60);
                const xx = Math.floor((totalSeconds % 1) * 100);
                const timeTag = `[${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}.${xx.toString().padStart(2, '0')}]`;
                return `${timeTag} ${l.text}`;
            }).join('\n');

            // 1. Publish to Yosync (Convex)
            if (publishToYosync) {
                setStatus('Publishing to Yosync Database...');

                let actualSubmittedById = user?._id;

                // If not logged in, ensure a guest user record exists in DB
                if (!actualSubmittedById) {
                    actualSubmittedById = await ensureGuestMutation({ name: submissionUsername });
                }

                const publishArgs: any = {
                    trackName,
                    artistName,
                    albumName: albumName || undefined,
                    duration,
                    plainLyrics,
                    syncedLyrics,
                    submittedBy: submissionUsername,
                    submittedById: actualSubmittedById as any
                };
                if (parentLyricId) {
                    publishArgs.parentLyricId = parentLyricId as any;
                }

                const publishResult: any = await publishMutation(publishArgs);

                if (publishResult.duplicate) {
                    setIsDuplicate(true);
                    setOriginalId(publishResult.originalId);
                    toast.warning("Duplicate detected");
                    setPublishing(false);
                    setStatus('');
                    return;
                }

                if (publishResult.success) {
                    toast.success(parentLyricId ? 'Improvement suggested! Awaiting review.' : 'Submitted to Yosync! Awaiting admin approval.');
                }
            }

            // 2. Publish to LRCLIB
            if (publishToLrcLib) {
                setStatus('Requesting LRCLIB challenge...');
                const challenge = await LrcLibApi.requestChallenge();
                if (challenge) {
                    setStatus('Solving LRCLIB challenge...');
                    const token = await LrcLibApi.solveChallenge(challenge.prefix, challenge.target);
                    setStatus('Publishing to LRCLIB...');
                    await LrcLibApi.publish({
                        trackName,
                        artistName,
                        albumName,
                        duration,
                        plainLyrics,
                        syncedLyrics
                    }, token);
                    toast.success('Lyrics published to LRCLIB!');
                }
            }

            onOpenChange(false);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to publish lyrics');
        } finally {
            setPublishing(false);
            setStatus('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] w-[95vw] p-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-xl">
                <DialogHeader className="p-6 md:p-8 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-b border-primary/10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                            <UploadCloud className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-2xl font-bold tracking-tight">
                            {parentLyricId ? "Submit Improvement" : "Publish Lyrics"}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-sm text-balance">
                        Share your synchronized lyrics with the world. Your contribution helps music lovers everywhere.
                    </DialogDescription>
                    <div className="flex items-center gap-2 mt-4 text-[11px] font-medium text-primary/70 bg-primary/10 px-3 py-1.5 rounded-full w-fit max-w-full truncate border border-primary/20">
                        <User className="h-3 w-3 shrink-0" />
                        <span>Contributing as: </span>
                        <span className="font-bold text-primary truncate">{submissionUsername}</span>
                    </div>
                </DialogHeader>

                <div className="p-6 md:p-8 space-y-6">
                    {/* Status Alerts */}
                    {isDuplicate ? (
                        <div className="flex flex-col gap-3 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-start gap-3">
                                <Search className="h-5 w-5 mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                    <p className="font-bold text-sm">Song Already in Database</p>
                                    <p className="text-[11px] leading-relaxed opacity-90">
                                        We already have an approved version of "{trackName}". You cannot create a duplicate, but you can suggest an improvement if your version is better.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-2 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 text-[10px] font-black uppercase tracking-widest h-9"
                                onClick={() => {
                                    setParentLyricId(originalId);
                                    setIsDuplicate(false);
                                    toast.info("Switched to Improvement Mode. You can now suggest your changes.");
                                }}
                            >
                                Submit as Improvement Instead
                            </Button>
                        </div>
                    ) : parentLyricId ? (
                        <div className="space-y-4 animate-in fade-in zoom-in-95">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary">
                                <Sparkles className="h-4 w-4 shrink-0" />
                                <div className="flex-1">
                                    <span className="font-medium">You are suggesting an improvement to the existing track. Admins will review and merge your changes.</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 text-[10px] uppercase font-bold hover:bg-primary/10"
                                        onClick={() => setShowComparison(!showComparison)}
                                    >
                                        <Diff className="h-3 w-3 mr-1.5" />
                                        {showComparison ? "Hide Comparison" : "Compare Changes"}
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setParentLyricId(null)}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            
                            {showComparison && parentLyric && (
                                <div className="grid grid-cols-2 gap-px bg-muted rounded-xl overflow-hidden border border-muted animate-in slide-in-from-top-2">
                                    <div className="flex flex-col bg-background h-[200px]">
                                        <div className="p-2 border-b bg-muted/30 flex items-center gap-2">
                                            <FileText className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Existing Version</span>
                                        </div>
                                        <ScrollArea className="flex-1 p-3 bg-muted/5">
                                            <pre className="text-[9px] leading-relaxed whitespace-pre-wrap font-mono text-muted-foreground/80 selection:bg-primary/20">
                                                {parentLyric.syncedLyrics}
                                            </pre>
                                        </ScrollArea>
                                    </div>
                                    <div className="flex flex-col bg-background h-[200px]">
                                        <div className="p-2 border-b bg-primary/5 flex items-center gap-2">
                                            <Sparkles className="h-3 w-3 text-primary" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Your Improved Version</span>
                                        </div>
                                        <ScrollArea className="flex-1 p-3 bg-primary/[0.02]">
                                            <pre className="text-[9px] leading-relaxed whitespace-pre-wrap font-mono text-primary/80 selection:bg-primary/20">
                                                {project.lines.map(l => {
                                                    const totalSeconds = (l.startTime || 0) / 1000;
                                                    const mm = Math.floor(totalSeconds / 60);
                                                    const ss = Math.floor(totalSeconds % 60);
                                                    const xx = Math.floor((totalSeconds % 1) * 100);
                                                    return `[${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}.${xx.toString().padStart(2, '0')}] ${l.text}`;
                                                }).join('\n')}
                                            </pre>
                                        </ScrollArea>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : !hasContent ? (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive animate-in fade-in zoom-in-95">
                            <X className="h-4 w-4 shrink-0" />
                            <span className="font-medium">The project has no lyrics to publish. Please import or write lyrics first.</span>
                        </div>
                    ) : !hasTimestamps ? (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 animate-in fade-in zoom-in-95">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span className="font-medium">Lyrics have no timestamps. They can only be published to LRCLIB as plain text.</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in zoom-in-95">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span className="font-medium">Perfect! Ready to publish synced lyrics for {project.lines.length} lines.</span>
                        </div>
                    )}

                    {/* Destination Selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div
                            className={cn(
                                "relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2",
                                publishToYosync ? "border-primary bg-primary/5" : "border-muted bg-muted/20 opacity-60",
                                !canPublishToYosync && "cursor-not-allowed grayscale"
                            )}
                            onClick={() => canPublishToYosync && setPublishToYosync(!publishToYosync)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="p-2 rounded-lg bg-background shadow-sm">
                                    <Database className={cn("h-4 w-4", publishToYosync ? "text-primary" : "text-muted-foreground")} />
                                </div>
                                <Switch
                                    checked={publishToYosync}
                                    disabled={!canPublishToYosync}
                                    onCheckedChange={setPublishToYosync}
                                />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Yosync Database</h3>
                                <p className="text-[10px] text-muted-foreground leading-tight">Official high-quality synced lyrics (Requires Approval)</p>
                            </div>
                        </div>

                        <div
                            className={cn(
                                "relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2",
                                publishToLrcLib ? "border-primary bg-primary/5" : "border-muted bg-muted/20 opacity-60"
                            )}
                            onClick={() => setPublishToLrcLib(!publishToLrcLib)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="p-2 rounded-lg bg-background shadow-sm">
                                    <Globe className={cn("h-4 w-4", publishToLrcLib ? "text-primary" : "text-muted-foreground")} />
                                </div>
                                <Switch
                                    checked={publishToLrcLib}
                                    onCheckedChange={setPublishToLrcLib}
                                />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">LRCLIB</h3>
                                <p className="text-[10px] text-muted-foreground leading-tight">Open source global database (Instant Public)</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Grid */}
                    <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Track Name</Label>
                                <Input
                                    value={trackName}
                                    onChange={e => setTrackName(e.target.value)}
                                    placeholder="Title"
                                    className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 h-10 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Artist Name</Label>
                                <Input
                                    value={artistName}
                                    onChange={e => setArtistName(e.target.value)}
                                    placeholder="Artist"
                                    className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 h-10 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Album (Optional)</Label>
                                <Input
                                    value={albumName}
                                    onChange={e => setAlbumName(e.target.value)}
                                    placeholder="Album"
                                    className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 h-10 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Duration (seconds)</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={duration || ''}
                                        onChange={e => setDuration(parseInt(e.target.value) || 0)}
                                        placeholder="e.g. 180"
                                        className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 pr-12 h-10 rounded-xl"
                                    />
                                    {audioDuration > 0 && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">
                                            AUTO
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {publishing && (
                        <div className="flex items-center gap-4 p-5 bg-primary/5 border border-primary/20 rounded-2xl animate-in fade-in slide-in-from-bottom-4 shadow-inner">
                            <div className="relative">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-primary tracking-tight">{status}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Please do not close this window</span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 md:p-8 bg-muted/20 border-t border-muted-foreground/10 flex flex-col sm:flex-row gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={publishing} className="w-full sm:w-auto rounded-xl">
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePublish}
                        disabled={publishing || !isFormValid || (!publishToLrcLib && !publishToYosync)}
                        className="w-full sm:flex-1 font-bold shadow-xl shadow-primary/20 h-11 rounded-xl group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/10 to-primary-foreground/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        {publishing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <UploadCloud className="h-4 w-4 mr-2 transition-transform group-hover:-translate-y-1" />
                        )}
                        Confirm Publication
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
