import { useRef, useEffect, useState, useCallback } from 'react';
import { LyricsProject } from '@/types/lyrics';
import { VideoRenderer } from '@/utils/videoRenderer';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Film, Download, XCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface VideoExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: LyricsProject;
    onPausePlayback: () => void;
}

const RESOLUTIONS = [
    { label: '1080p (Full HD)', width: 1920, height: 1080 },
    { label: '720p (HD)', width: 1280, height: 720 },
    { label: 'Square (1:1)', width: 1080, height: 1080 },
    { label: 'Portrait (9:16)', width: 1080, height: 1920 },
];

export const VideoExportDialog = ({
    open,
    onOpenChange,
    project,
    onPausePlayback,
}: VideoExportDialogProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'completed' | 'error'>('idle');
    const [selectedResolution, setSelectedResolution] = useState(RESOLUTIONS[0]);
    const rendererRef = useRef<VideoRenderer | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const animationFrameRef = useRef<number>();

    // Clean up on close
    useEffect(() => {
        if (!open) {
            stopExport();
            setStatus('idle');
            setProgress(0);
        }
    }, [open]);

    // Initialize renderer preview when open
    useEffect(() => {
        if (open && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Set canvas size for preview (scaled down via CSS)
            canvas.width = selectedResolution.width;
            canvas.height = selectedResolution.height;

            rendererRef.current = new VideoRenderer(ctx, {
                width: selectedResolution.width,
                height: selectedResolution.height,
                title: project.title,
                artist: project.artist,
                lines: project.lines,
                syncMode: project.syncMode,
            });

            // Initial render
            rendererRef.current.render(0);
        }
    }, [open, selectedResolution, project]);

    const stopExport = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsExporting(false);
        // Pause playback if it was playing
        onPausePlayback();
    };

    const handleStartExport = async () => {
        if (!canvasRef.current || !project.audioFile) {
            toast.error('Missing resources for export');
            return;
        }

        // Ensure playback is paused before starting heavy export
        onPausePlayback();

        setIsExporting(true);
        setStatus('recording');
        setProgress(0);
        chunksRef.current = [];

        try {
            // 1. Setup Audio Context to mix into stream
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const actx = new AudioContext();
            const dest = actx.createMediaStreamDestination();

            // Create source from the file directly to avoid capturing mic or system audio quirks
            // Decoding the whole file ensuring high quality
            const arrayBuffer = await project.audioFile.arrayBuffer();
            const audioBuffer = await actx.decodeAudioData(arrayBuffer);
            const source = actx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(dest);
            source.connect(actx.destination); // Let user hear it too (optional, maybe mute?)

            // 2. Setup Canvas Stream
            const canvasStream = canvasRef.current.captureStream(60); // 60 FPS

            // 3. Combine Streams
            const combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...dest.stream.getAudioTracks(),
            ]);

            // 4. Setup Recorder
            const mimeType = MediaRecorder.isTypeSupported('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')
                ? 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
                : 'video/webm; codecs=vp9';

            const recorder = new MediaRecorder(combinedStream, {
                mimeType,
                videoBitsPerSecond: 8000000, // 8 Mbps high quality
            });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                setStatus('processing');
                const blob = new Blob(chunksRef.current, { type: mimeType });
                const url = URL.createObjectURL(blob);

                // Trigger download
                const a = document.createElement('a');
                a.href = url;
                a.download = `${project.title || 'video'} - ${project.artist || 'artist'}.mp4`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                setStatus('completed');
                setIsExporting(false);
                toast.success('Video exported successfully!');
                actx.close();
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            source.start(0); // Start audio

            // 5. Start Animation Loop
            const startTime = performance.now();
            const duration = audioBuffer.duration;

            const animate = () => {
                const now = performance.now();
                const elapsed = (now - startTime) / 1000; // seconds

                if (elapsed >= duration) {
                    recorder.stop();
                    return;
                }

                // Render frame
                if (rendererRef.current) {
                    rendererRef.current.render(elapsed);
                }

                // Update UI
                setProgress((elapsed / duration) * 100);

                animationFrameRef.current = requestAnimationFrame(animate);
            };

            animate();

        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Export failed. See console for details.');
            setStatus('error');
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={isExporting ? undefined : onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Film className="h-5 w-5 text-primary" />
                        Export Video
                    </DialogTitle>
                    <DialogDescription>
                        Render your synchronized lyrics as a high-quality video.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col md:flex-row gap-6 p-6 pt-2 min-h-0 overflow-hidden">
                    {/* Preview Area */}
                    <div className="flex-1 bg-black/90 rounded-xl overflow-hidden aspect-video relative flex items-center justify-center border border-white/10 shadow-2xl">
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full object-contain"
                        />
                        {status === 'recording' && (
                            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-red-500/90 text-white rounded-full text-xs font-bold animate-pulse">
                                <div className="w-2 h-2 bg-white rounded-full" />
                                REC
                            </div>
                        )}
                    </div>

                    {/* Controls Sidebar */}
                    <div className="w-full md:w-64 flex flex-col gap-6 shrink-0">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Resolution</Label>
                                <Select
                                    value={selectedResolution.label}
                                    onValueChange={(val) => {
                                        const res = RESOLUTIONS.find(r => r.label === val);
                                        if (res) setSelectedResolution(res);
                                    }}
                                    disabled={isExporting}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {RESOLUTIONS.map(res => (
                                            <SelectItem key={res.label} value={res.label}>
                                                {res.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Progress & Status */}
                            {status !== 'idle' && (
                                <div className="space-y-2 bg-muted/50 p-4 rounded-lg border border-primary/10">
                                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                        <span className="capitalize">{status}...</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                </div>
                            )}
                        </div>

                        <div className="mt-auto flex flex-col gap-3">
                            {isExporting ? (
                                <Button
                                    variant="destructive"
                                    onClick={stopExport}
                                    className="w-full h-12 font-semibold"
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancel Export
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleStartExport}
                                    className="w-full h-12 font-semibold"
                                    disabled={!project.audioFile}
                                >
                                    {status === 'completed' ? (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Done (Export Again)
                                        </>
                                    ) : (
                                        <>
                                            <Film className="mr-2 h-4 w-4" />
                                            Start Export
                                        </>
                                    )}
                                </Button>
                            )}

                            {!project.audioFile && (
                                <p className="text-xs text-destructive text-center">
                                    Audio file required for export
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
