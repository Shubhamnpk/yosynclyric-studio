import { useState } from 'react';
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
import { Loader2, UploadCloud } from 'lucide-react';
import { LrcLibApi } from '@/services/lrcLib';
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

    const hasContent = project.lines.length > 0 && project.lines.some(l => l.text.trim().length > 0);
    const hasTimestamps = project.lines.some(l => l.startTime !== null);

    const isFormValid = trackName && artistName && duration && hasContent;
    // We can't easily get duration unless we have the audio file loaded and its metadata read.
    // For now we will ask the user or try to guess?
    // Ideally we assume the user knows or it's optional?
    // LRCLIB API requires duration.

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
            setStatus('Solving proof-of-work challenge (this may take a moment)...');
            const token = await LrcLibApi.solveChallenge(challenge.prefix, challenge.target);

            // 3. Prepare Lyrics
            const plainLyrics = project.lines.map(l => l.text).join('\n');
            const syncedLyrics = project.lines.map(l => {
                const mm = Math.floor((l.startTime || 0) / 60);
                const ss = Math.floor((l.startTime || 0) % 60);
                const xx = Math.floor(((l.startTime || 0) % 1) * 100);
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Publish to LRCLIB</DialogTitle>
                    <DialogDescription>
                        Contribute your synchronized lyrics to the open LRCLIB database.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {!hasContent && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                            The project has no lyrics to publish. Please import or type some lyrics first.
                        </div>
                    )}
                    {!hasTimestamps && hasContent && (
                        <div className="rounded-md bg-yellow-500/15 p-3 text-sm text-yellow-600 dark:text-yellow-400">
                            Warning: These lyrics have no timestamps. They will be published as plain text only.
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Track Name</Label>
                            <Input value={trackName} onChange={e => setTrackName(e.target.value)} placeholder="Title" />
                        </div>
                        <div className="space-y-2">
                            <Label>Artist Name</Label>
                            <Input value={artistName} onChange={e => setArtistName(e.target.value)} placeholder="Artist" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Album Name (Optional)</Label>
                            <Input value={albumName} onChange={e => setAlbumName(e.target.value)} placeholder="Album" />
                        </div>
                        <div className="space-y-2">
                            <Label>Duration (seconds)</Label>
                            <Input
                                type="number"
                                value={duration || ''}
                                onChange={e => setDuration(parseInt(e.target.value) || 0)}
                                placeholder="e.g. 180"
                            />
                            <p className="text-[10px] text-muted-foreground">Required by LRCLIB</p>
                        </div>
                    </div>

                    {publishing && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted rounded">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {status}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={publishing}>
                        Cancel
                    </Button>
                    <Button onClick={handlePublish} disabled={publishing || !isFormValid}>
                        <UploadCloud className="h-4 w-4 mr-2" />
                        Publish
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
