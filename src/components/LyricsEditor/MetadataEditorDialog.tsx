import { useState, useRef, useCallback, useEffect } from 'react';
import { LyricsProject } from '@/types/lyrics';
import { downloadWithMetadata, fetchCoverArtBlob } from '@/utils/metadataWriter';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    Music,
    User,
    Disc3,
    Calendar,
    Tag,
    Image as ImageIcon,
    Download,
    Upload,
    Loader2,
    CheckCircle2,
    XCircle,
    FileAudio,
    Sparkles,
    Info,
    Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import features from '@/config/features.json';

interface MetadataEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: LyricsProject;
    onUpdateProject: (updates: Partial<LyricsProject>) => void;
}

const GENRE_SUGGESTIONS = [
    'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Jazz', 'Classical', 'Electronic',
    'Country', 'Folk', 'Metal', 'Punk', 'Blues', 'Reggae', 'Soul',
    'Indie', 'Alternative', 'K-Pop', 'J-Pop', 'Latin', 'Lo-fi',
];

export const MetadataEditorDialog = ({
    open,
    onOpenChange,
    project,
    onUpdateProject,
}: MetadataEditorDialogProps) => {
    // Local state for fields (edit locally, apply on save)
    const [title, setTitle] = useState(project.title);
    const [artist, setArtist] = useState(project.artist);
    const [album, setAlbum] = useState(project.album || '');
    const [year, setYear] = useState(project.year || '');
    const [genre, setGenre] = useState(project.genre || '');
    const [duration, setDuration] = useState(project.duration ? String(project.duration) : '');
    const [coverPreview, setCoverPreview] = useState<string | null>(project.coverArtUrl);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [embedLyrics, setEmbedLyrics] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // Sync local state when dialog opens or project changes
    useEffect(() => {
        if (open) {
            setTitle(project.title);
            setArtist(project.artist);
            setAlbum(project.album || '');
            setYear(project.year || '');
            setGenre(project.genre || '');
            setDuration(project.duration ? String(project.duration) : '');
            setCoverPreview(project.coverArtUrl);
            setCoverFile(null);
            setIsSaved(false);
        }
    }, [open, project]);

    const handleCoverUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        setCoverFile(file);
        const url = URL.createObjectURL(file);
        setCoverPreview(url);
    }, []);

    const handleRemoveCover = useCallback(() => {
        setCoverPreview(null);
        setCoverFile(null);
        if (coverInputRef.current) {
            coverInputRef.current.value = '';
        }
    }, []);

    const handleSave = useCallback(() => {
        const updates: Partial<LyricsProject> = {
            title,
            artist,
            album,
            year,
            genre,
            duration: duration ? parseInt(duration) : undefined,
        };

        // Update cover art URL if a new file was uploaded
        if (coverFile) {
            updates.coverArtUrl = URL.createObjectURL(coverFile);
        } else if (!coverPreview) {
            updates.coverArtUrl = null;
        }

        onUpdateProject(updates);
        setIsSaved(true);
        toast.success('Metadata saved to project');
        setTimeout(() => setIsSaved(false), 2000);
    }, [title, artist, album, year, genre, coverFile, coverPreview, onUpdateProject]);

    const handleExport = useCallback(async () => {
        if (!project.audioFile) {
            toast.error('No audio file loaded. Load an MP3 first to embed metadata.');
            return;
        }

        setIsExporting(true);
        try {
            // First save the current edits to project
            handleSave();

            // Get cover art blob
            let coverBlob: Blob | null = null;
            if (coverFile) {
                coverBlob = coverFile;
            } else if (coverPreview) {
                coverBlob = await fetchCoverArtBlob(coverPreview);
            }

            // Create updated project with current edits for export
            const updatedProject: LyricsProject = {
                ...project,
                title,
                artist,
                album,
                year,
                genre,
                duration: duration ? parseInt(duration) : project.duration,
            };

            await downloadWithMetadata(updatedProject, {
                embedLyrics,
                coverArtBlob: coverBlob,
            });

            toast.success('Audio exported with embedded metadata!');
        } catch (error) {
            console.error('Export failed:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Failed to export: ${message}`);
        } finally {
            setIsExporting(false);
        }
    }, [project, title, artist, album, year, genre, embedLyrics, coverFile, coverPreview, handleSave]);

    const hasAudioFile = !!project.audioFile;
    const hasLyrics = project.lines.some(l => l.text.trim());
    const hasSyncedLyrics = project.lines.some(l => l.startTime !== null);

    const isEnabled = features.metadataEditor.enabled;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "max-h-[90vh] overflow-y-auto p-0 gap-0",
                isEnabled ? "sm:max-w-[640px]" : "sm:max-w-[400px]"
            )}>
                {!isEnabled ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 rotate-3 shadow-xl shadow-primary/5">
                            <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight">Coming Soon!</h2>
                            <p className="text-muted-foreground text-sm">
                                We're working on something amazing. The Metadata Editor will be available in a future update.
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            className="w-full rounded-xl h-12 font-semibold"
                            onClick={() => onOpenChange(false)}
                        >
                            Got it, thanks!
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Header section with gradient background */}
                        <div className="relative overflow-hidden">
                            {/* Gradient header bg */}
                            <div
                                className="absolute inset-0 opacity-[0.08]"
                                style={{
                                    background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.3), transparent)',
                                }}
                            />
                            <DialogHeader className="relative p-6 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
                                        <Tag className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl font-bold">Metadata Editor</DialogTitle>
                                        <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                                            Edit ID3 tags and embed lyrics into your audio file
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                        </div>

                        <div className="px-4 md:px-6 pb-6 space-y-6">
                            {/* Cover Art + Title/Artist Row */}
                            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
                                {/* Cover Art */}
                                <div className="flex-shrink-0">
                                    <div
                                        className={cn(
                                            'relative w-[140px] h-[140px] rounded-xl overflow-hidden border-2 border-dashed transition-all duration-300 group cursor-pointer',
                                            coverPreview
                                                ? 'border-transparent shadow-lg shadow-primary/10'
                                                : 'border-muted-foreground/20 hover:border-primary/40'
                                        )}
                                        onClick={() => coverInputRef.current?.click()}
                                    >
                                        {coverPreview ? (
                                            <>
                                                <img
                                                    src={coverPreview}
                                                    alt="Cover Art"
                                                    className="w-full h-full object-cover"
                                                />
                                                {/* Hover overlay */}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                                    <div className="text-white text-center">
                                                        <Upload className="h-5 w-5 mx-auto mb-1" />
                                                        <span className="text-xs font-medium">Change</span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 group-hover:text-primary/60 transition-colors">
                                                <ImageIcon className="h-8 w-8 mb-2" />
                                                <span className="text-[10px] font-medium uppercase tracking-wider">Add Cover</span>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={coverInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleCoverUpload}
                                    />
                                    {coverPreview && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full mt-1.5 h-7 text-xs text-muted-foreground hover:text-destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveCover();
                                            }}
                                        >
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Remove
                                        </Button>
                                    )}
                                </div>

                                {/* Title & Artist */}
                                <div className="flex-1 w-full space-y-3">
                                    <div className="text-left">
                                        <Label htmlFor="meta-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                            <Music className="h-3 w-3" />
                                            Title
                                        </Label>
                                        <Input
                                            id="meta-title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Song Title"
                                            className="bg-background/50 border-muted-foreground/20 focus:border-primary/50 h-10 text-base font-medium"
                                        />
                                    </div>
                                    <div className="text-left">
                                        <Label htmlFor="meta-artist" className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                            <User className="h-3 w-3" />
                                            Artist
                                        </Label>
                                        <Input
                                            id="meta-artist"
                                            value={artist}
                                            onChange={(e) => setArtist(e.target.value)}
                                            placeholder="Artist Name"
                                            className="bg-background/50 border-muted-foreground/20 focus:border-primary/50 h-10"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator className="opacity-50" />

                            {/* Album, Year, Genre Row */}
                            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="meta-album" className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                        <Disc3 className="h-3 w-3" />
                                        Album
                                    </Label>
                                    <Input
                                        id="meta-album"
                                        value={album}
                                        onChange={(e) => setAlbum(e.target.value)}
                                        placeholder="Album Name"
                                        className="bg-background/50 border-muted-foreground/20 focus:border-primary/50"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="meta-year" className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                        <Calendar className="h-3 w-3" />
                                        Year
                                    </Label>
                                    <Input
                                        id="meta-year"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        placeholder="2025"
                                        className="bg-background/50 border-muted-foreground/20 focus:border-primary/50"
                                        maxLength={4}
                                    />
                                </div>
                                <div className="xs:col-span-2 md:col-span-1">
                                    <Label htmlFor="meta-genre" className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                        <Tag className="h-3 w-3" />
                                        Genre
                                    </Label>
                                    <Input
                                        id="meta-genre"
                                        value={genre}
                                        onChange={(e) => setGenre(e.target.value)}
                                        placeholder="Pop"
                                        className="bg-background/50 border-muted-foreground/20 focus:border-primary/50"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="meta-duration" className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                        <Clock className="h-3 w-3" />
                                        Duration (sec)
                                    </Label>
                                    <Input
                                        id="meta-duration"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        placeholder="210"
                                        className="bg-background/50 border-muted-foreground/20 focus:border-primary/50"
                                        type="number"
                                    />
                                </div>
                            </div>

                            {/* Genre suggestions */}
                            <div className="flex flex-wrap gap-1.5">
                                {GENRE_SUGGESTIONS.filter(g =>
                                    !genre || g.toLowerCase().includes(genre.toLowerCase()) || genre === ''
                                ).slice(0, 12).map((g) => (
                                    <Badge
                                        key={g}
                                        variant={genre === g ? 'default' : 'outline'}
                                        className={cn(
                                            'cursor-pointer text-[10px] px-2 py-0.5 transition-all duration-200 hover:scale-105',
                                            genre === g
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'hover:bg-primary/10 hover:border-primary/30'
                                        )}
                                        onClick={() => setGenre(genre === g ? '' : g)}
                                    >
                                        {g}
                                    </Badge>
                                ))}
                            </div>

                            <Separator className="opacity-50" />

                            {/* Embed Lyrics Toggle */}
                            <div className="bg-muted/30 rounded-xl p-3 md:p-4 space-y-3 border border-muted-foreground/10">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg bg-primary/10 flex-shrink-0">
                                            <Sparkles className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">Embed Synced Lyrics</p>
                                            <p className="text-[10px] md:text-xs text-muted-foreground">
                                                Include LRC in MP3
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={embedLyrics}
                                        onCheckedChange={setEmbedLyrics}
                                        disabled={!hasSyncedLyrics}
                                    />
                                </div>

                                {/* Status indicators */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] md:text-xs">
                                    <div className="flex items-center gap-1.5">
                                        {hasLyrics ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                        ) : (
                                            <XCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
                                        )}
                                        <span className={hasLyrics ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/50'}>
                                            {project.lines.filter(l => l.text.trim()).length} lines
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {hasSyncedLyrics ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                        ) : (
                                            <XCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
                                        )}
                                        <span className={hasSyncedLyrics ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/50'}>
                                            {project.lines.filter(l => l.startTime !== null).length} synced
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Info banner when no audio */}
                            {!hasAudioFile && (
                                <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 md:p-3.5">
                                    <Info className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-amber-600 dark:text-amber-400 text-xs md:text-sm">No audio file loaded</p>
                                        <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 leading-tight">
                                            Load an MP3 file to embed metadata directly into the audio.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex flex-col xs:flex-row items-center gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={handleSave}
                                    className={cn(
                                        "w-full xs:flex-1 h-11 font-semibold transition-all duration-300",
                                        isSaved && "border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
                                    )}
                                >
                                    {isSaved ? (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Saved!
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Save to Project
                                        </>
                                    )}
                                </Button>

                                <Button
                                    onClick={handleExport}
                                    disabled={!hasAudioFile || isExporting}
                                    className="w-full xs:flex-1 h-11 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300"
                                >
                                    {isExporting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Exporting...
                                        </>
                                    ) : (
                                        <>
                                            <FileAudio className="h-4 w-4 mr-2" />
                                            Export Audio
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
