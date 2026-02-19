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
import { Search, Music, Clock, Loader2, UploadCloud } from 'lucide-react';
import { LrcLibApi, LRCLibSearchResult } from '@/services/lrcLib';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { LyricsProject } from '@/types/lyrics';

interface PublishDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: LyricsProject;
    audioDuration?: number;
}

export const PublishDialog = ({ open, onOpenChange, project, audioDuration }: PublishDialogProps) => {
    const [trackName, setTrackName] = useState(project.title);
    const [artistName, setArtistName] = useState(project.artist);
    const [albumName, setAlbumName] = useState('');
    const [duration, setDuration] = useState(audioDuration ? Math.round(audioDuration) : 0);

    // Update state when props change
    useEffect(() => {
        if (open) {
            setTrackName(project.title);
            setArtistName(project.artist);
            if (audioDuration) {
                setDuration(Math.round(audioDuration));
            }
        }
    }, [open, project.title, project.artist, audioDuration]);

    const hasContent = project.lines.length > 0 && project.lines.some(l => l.text.trim().length > 0);
    const hasTimestamps = project.lines.some(l => l.startTime !== null);

    const isFormValid = trackName && artistName && duration && hasContent;

    const [publishing, setPublishing] = useState(false);
    const [status, setStatus] = useState('');

    const handlePublish = async () => {
        if (!isFormValid) {
            toast.error('Please check all fields and ensure the project has lyrics');
            return;
        }

        setPublishing(true);
        setStatus('Requesting challenge...');

        try {
            // 1. Request Challenge
            const challenge = await LrcLibApi.requestChallenge();
            if (!challenge) {
                throw new Error('Could not get challenge from server');
            }

            // 2. Solve Challenge
            setStatus('Solving proof-of-work challenge...');
            const token = await LrcLibApi.solveChallenge(challenge.prefix, challenge.target);

            // 3. Prepare Lyrics
            const plainLyrics = project.lines.map(l => l.text).join('\n');
            const syncedLyrics = project.lines.map(l => {
                const totalSeconds = (l.startTime || 0) / 1000;
                const mm = Math.floor(totalSeconds / 60);
                const ss = Math.floor(totalSeconds % 60);
                const xx = Math.floor((totalSeconds % 1) * 100);
                const timeTag = `[${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}.${xx.toString().padStart(2, '0')}]`;
                return `${timeTag} ${l.text}`;
            }).join('\n');


            // 4. Publish
            setStatus('Publishing lyrics...');
            await LrcLibApi.publish({
                trackName,
                artistName,
                albumName,
                duration,
                plainLyrics,
                syncedLyrics
            }, token);

            toast.success('Lyrics published successfully!');
            onOpenChange(false);

        } catch (error) {
            console.error(error);
            toast.error('Failed to publish lyrics');
        } finally {
            setPublishing(false);
            setStatus('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] w-[95vw] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-5 md:p-6 bg-gradient-to-br from-primary/10 to-transparent border-b border-primary/10">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <UploadCloud className="h-5 w-5 text-primary" />
                        Publish to LRCLIB
                    </DialogTitle>
                    <DialogDescription className="text-xs md:text-sm">
                        Contribute your synchronized lyrics to the open LRCLIB database.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-5 md:p-6 space-y-5">
                    {/* Status Alerts */}
                    {!hasContent ? (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                            <UploadCloud className="h-4 w-4 shrink-0" />
                            <span>The project has no lyrics to publish. Please import lyrics first.</span>
                        </div>
                    ) : !hasTimestamps ? (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                            <UploadCloud className="h-4 w-4 shrink-0" />
                            <span>Lyrics have no timestamps. They will be published as plain text only.</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400">
                            <UploadCloud className="h-4 w-4 shrink-0" />
                            <span>Ready to publish synced lyrics for {project.lines.length} lines.</span>
                        </div>
                    )}

                    {/* Form Grid */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Track Name</Label>
                                <Input
                                    value={trackName}
                                    onChange={e => setTrackName(e.target.value)}
                                    placeholder="Title"
                                    className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-0.5">Artist Name</Label>
                                <Input
                                    value={artistName}
                                    onChange={e => setArtistName(e.target.value)}
                                    placeholder="Artist"
                                    className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50"
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
                                    className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50"
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
                                        className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 pr-12"
                                    />
                                    {audioDuration > 0 && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-primary font-bold">
                                            AUTO
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {publishing && (
                        <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl animate-in fade-in slide-in-from-bottom-2">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-primary">{status}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Please do not close this dialog</span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 bg-muted/30 border-t border-muted-foreground/10 flex flex-col xs:flex-row gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={publishing} className="w-full xs:w-auto">
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePublish}
                        disabled={publishing || !isFormValid}
                        className="w-full xs:flex-1 font-bold shadow-lg shadow-primary/20"
                    >
                        {publishing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <UploadCloud className="h-4 w-4 mr-2" />
                        )}
                        Publish to LRCLIB
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
