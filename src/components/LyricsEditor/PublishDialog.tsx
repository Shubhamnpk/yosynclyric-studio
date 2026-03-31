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

const getLineDiff = (left: string, right: string) => {
    if (left === right) {
        return {
            leftPrefix: left,
            leftChanged: '',
            leftSuffix: '',
            rightPrefix: right,
            rightChanged: '',
            rightSuffix: '',
            changed: false,
        };
    }

    let prefixLength = 0;
    const minLength = Math.min(left.length, right.length);
    while (prefixLength < minLength && left[prefixLength] === right[prefixLength]) {
        prefixLength++;
    }

    let leftSuffixLength = 0;
    let rightSuffixLength = 0;
    while (
        left.length - leftSuffixLength - 1 >= prefixLength &&
        right.length - rightSuffixLength - 1 >= prefixLength &&
        left[left.length - leftSuffixLength - 1] === right[right.length - rightSuffixLength - 1]
    ) {
        leftSuffixLength++;
        rightSuffixLength++;
    }

    return {
        leftPrefix: left.slice(0, prefixLength),
        leftChanged: left.slice(prefixLength, left.length - leftSuffixLength),
        leftSuffix: left.slice(left.length - leftSuffixLength),
        rightPrefix: right.slice(0, prefixLength),
        rightChanged: right.slice(prefixLength, right.length - rightSuffixLength),
        rightSuffix: right.slice(right.length - rightSuffixLength),
        changed: true,
    };
};

const renderDiffText = (
    text: string,
    changedText: string,
    suffix: string,
    tone: 'existing' | 'improved',
) => (
    <>
        <span>{text}</span>
        {changedText && (
            <span
                className={cn(
                    "rounded px-0.5 py-px",
                    tone === 'existing'
                        ? "bg-red-500/15 text-red-700 dark:text-red-300"
                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                )}
            >
                {changedText}
            </span>
        )}
        <span>{suffix}</span>
    </>
);

export const PublishDialog = ({ open, onOpenChange, project, audioDuration }: PublishDialogProps) => {
    const [trackName, setTrackName] = useState(project.title);
    const [artistName, setArtistName] = useState(project.artist);
    const [albumName, setAlbumName] = useState(project.album || '');
    const [duration, setDuration] = useState(audioDuration ? Math.round(audioDuration) : (project.duration || 0));

    const [publishToLrcLib, setPublishToLrcLib] = useState(false);
    const [publishToYosync, setPublishToYosync] = useState(false);

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

    const plainLyrics = project.lines.map(l => l.text).join('\n');
    const syncedLyrics = project.lines.map(l => {
        const totalSeconds = (l.startTime || 0) / 1000;
        const mm = Math.floor(totalSeconds / 60);
        const ss = Math.floor(totalSeconds % 60);
        const xx = Math.floor((totalSeconds % 1) * 100);
        const timeTag = `[${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}.${xx.toString().padStart(2, '0')}]`;
        return `${timeTag} ${l.text}`;
    }).join('\n');
    const existingLines = parentLyric?.syncedLyrics?.split('\n') ?? [];
    const improvedLines = syncedLyrics.split('\n');
    const comparisonRows = Array.from(
        { length: Math.max(existingLines.length, improvedLines.length) },
        (_, index) => {
            const existingLine = existingLines[index] ?? '';
            const improvedLine = improvedLines[index] ?? '';
            return {
                index,
                existingLine,
                improvedLine,
                diff: getLineDiff(existingLine, improvedLine),
            };
        }
    );

    const duplicateSuggestions = useQuery(
        api.lyrics.findPossibleDuplicates,
        open && trackName.trim() && artistName.trim()
            ? {
                trackName,
                artistName,
                duration: duration || undefined,
                plainLyrics,
                syncedLyrics,
            }
            : "skip"
    );

    const exactDuplicateSuggestion = duplicateSuggestions?.find((item: any) => item.isStrongDuplicate) || null;

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
            let yosyncDuplicateHandled = false;

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
                    yosyncDuplicateHandled = true;
                    setIsDuplicate(false);
                    setOriginalId(publishResult.originalId);
                    setParentLyricId(publishResult.originalId);
                    setShowComparison(true);
                    toast.warning(
                        publishToLrcLib
                            ? "Duplicate found in Yosync. Switched to improvement mode and continuing LRCLIB publish."
                            : "Duplicate found in Yosync. Switched to improvement mode."
                    );
                } else if (publishResult.success) {
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

            if (!yosyncDuplicateHandled || publishToLrcLib) {
                onOpenChange(false);
            }

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
            <DialogContent className="flex max-h-[92vh] w-[95vw] flex-col overflow-hidden border-none bg-background/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-[550px]">
                <DialogHeader className="p-6 md:p-8 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-b border-primary/10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                            <UploadCloud className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-2xl font-bold tracking-tight">
                            {parentLyricId ? "Submit Improvement" : "Publish Lyrics"}
                        </DialogTitle>
                    </div>
                    <div className="flex items-center gap-2 mt-4 text-[11px] font-medium text-primary/70 bg-primary/10 px-3 py-1.5 rounded-full w-fit max-w-full truncate border border-primary/20">
                        <User className="h-3 w-3 shrink-0" />
                        <span>Contributing as: </span>
                        <span className="font-bold text-primary truncate">{submissionUsername}</span>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
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
                                    setShowComparison(true);
                                    toast.info("Switched to Improvement Mode. You can now suggest your changes.");
                                }}
                            >
                                Review as Improvement
                            </Button>
                        </div>
                    ) : !parentLyricId && duplicateSuggestions && duplicateSuggestions.length > 0 ? (
                        <div className="space-y-4 p-4 rounded-2xl bg-primary/5 border border-primary/15 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-start gap-3">
                                <LayoutGrid className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                                <div className="space-y-1">
                                    <p className="font-bold text-sm text-foreground">Possible existing matches found</p>
                                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                                        We found similar tracks in Yosync before you publish. If one of these is the same song, submit your work as an improvement instead of creating a duplicate.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {duplicateSuggestions.slice(0, 3).map((item: any) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className={cn(
                                            "w-full text-left rounded-xl border p-3 transition-all hover:border-primary/40 hover:bg-primary/[0.03]",
                                            item.isStrongDuplicate ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-background/70"
                                        )}
                                        onClick={() => {
                                            setParentLyricId(item.id);
                                            setOriginalId(item.id);
                                            setShowComparison(Boolean(item.isStrongDuplicate || exactDuplicateSuggestion));
                                            toast.info("Improvement mode enabled for the closest existing track.");
                                        }}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold truncate">{item.trackName}</p>
                                                <p className="text-[11px] text-muted-foreground truncate">
                                                    {item.artistName}
                                                    {item.albumName ? ` • ${item.albumName}` : ''}
                                                </p>
                                            </div>
                                            <Badge variant={item.isApproved ? "default" : "secondary"} className="shrink-0">
                                                {item.isApproved ? "Approved" : item.status}
                                            </Badge>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {item.matchReasons.map((reason: string) => (
                                                <Badge key={reason} variant="outline" className="text-[10px]">
                                                    {reason}
                                                </Badge>
                                            ))}
                                            {item.durationDelta !== null && (
                                                <Badge variant="outline" className="text-[10px]">
                                                    Δ {item.durationDelta}s
                                                </Badge>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {exactDuplicateSuggestion && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full bg-primary/10 border-primary/20 hover:bg-primary/15 text-[10px] font-black uppercase tracking-widest h-9"
                                    onClick={() => {
                                        setParentLyricId(exactDuplicateSuggestion.id);
                                        setOriginalId(exactDuplicateSuggestion.id);
                                        setShowComparison(true);
                                        toast.info("Closest duplicate selected. You can now submit this as an improvement.");
                                    }}
                                >
                                    Use Closest Match as Improvement Base
                                </Button>
                            )}
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
                                <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-muted bg-muted animate-in slide-in-from-top-2 md:grid-cols-2">
                                    <div className="flex min-h-0 flex-col bg-background md:max-h-[min(42vh,24rem)]">
                                        <div className="p-2 border-b bg-muted/30 flex items-center gap-2">
                                            <FileText className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Existing Version</span>
                                        </div>
                                        <ScrollArea className="max-h-[28vh] flex-1 bg-muted/5 md:max-h-none">
                                            <div className="space-y-1 p-3 font-mono text-[9px] leading-relaxed">
                                                {comparisonRows.map((row) => (
                                                    <div
                                                        key={`existing-${row.index}`}
                                                        className={cn(
                                                            "rounded px-1.5 py-1 whitespace-pre-wrap break-words text-muted-foreground/80 selection:bg-primary/20",
                                                            row.diff.changed && "border border-red-500/20 bg-red-500/8"
                                                        )}
                                                    >
                                                        {renderDiffText(
                                                            row.diff.leftPrefix,
                                                            row.diff.leftChanged,
                                                            row.diff.leftSuffix,
                                                            'existing'
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                    <div className="flex min-h-0 flex-col bg-background md:max-h-[min(42vh,24rem)]">
                                        <div className="p-2 border-b bg-primary/5 flex items-center gap-2">
                                            <Sparkles className="h-3 w-3 text-primary" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Your Improved Version</span>
                                        </div>
                                        <ScrollArea className="max-h-[28vh] flex-1 bg-primary/[0.02] md:max-h-none">
                                            <div className="space-y-1 p-3 font-mono text-[9px] leading-relaxed">
                                                {comparisonRows.map((row) => (
                                                    <div
                                                        key={`improved-${row.index}`}
                                                        className={cn(
                                                            "rounded px-1.5 py-1 whitespace-pre-wrap break-words text-primary/80 selection:bg-primary/20",
                                                            row.diff.changed && "border border-emerald-500/20 bg-emerald-500/8"
                                                        )}
                                                    >
                                                        {renderDiffText(
                                                            row.diff.rightPrefix,
                                                            row.diff.rightChanged,
                                                            row.diff.rightSuffix,
                                                            'improved'
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
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
