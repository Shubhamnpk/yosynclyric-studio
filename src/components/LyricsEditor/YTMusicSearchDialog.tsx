import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Music, Clock, Loader2, Youtube, ExternalLink, Play } from 'lucide-react';
import { YTMusicApi, YTMusicSearchResult } from '@/services/ytMusic';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface YTMusicSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (videoId: string, metadata: { title: string, artist: string, album?: string, duration?: number, thumbnail?: string }) => void;
    initialQuery?: string;
}

export const YTMusicSearchDialog = ({ open, onOpenChange, onSelect, initialQuery }: YTMusicSearchDialogProps) => {
    const [query, setQuery] = useState(initialQuery || '');
    const [results, setResults] = useState<YTMusicSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasAutoSearched, setHasAutoSearched] = useState(false);

    useEffect(() => {
        if (open && initialQuery && !hasAutoSearched) {
            setQuery(initialQuery);
            handleSearch(initialQuery);
            setHasAutoSearched(true);
        }
    }, [open, initialQuery]);

    const handleSearch = async (searchQuery?: string) => {
        const q = searchQuery || query;
        if (!q.trim()) return;
        setLoading(true);
        try {
            const data = await YTMusicApi.search(q);
            setResults(data);
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Failed to search YouTube Music');
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (result: YTMusicSearchResult) => {
        const artist = result.artists.map(a => a.name).join(', ');
        onSelect(result.videoId, {
            title: result.title,
            artist: artist,
            album: result.album?.name,
            duration: result.duration_seconds,
            thumbnail: result.thumbnails[result.thumbnails.length - 1]?.url
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl w-[95vw] h-[85vh] md:h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-xl">
                <DialogHeader className="p-6 md:p-8 bg-gradient-to-br from-red-500/20 via-red-500/5 to-transparent border-b border-red-500/10">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                        <div className="p-2 rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/20">
                            <Youtube className="h-5 w-5" />
                        </div>
                        YouTube Music Search
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        Find and link high-quality audio from YouTube Music for synchronization.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-5 md:p-6 pb-2">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search song, artist, or paste Video ID..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-10 h-11 bg-muted/40 border-muted-foreground/20 focus:border-red-500/50 rounded-xl"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => handleSearch()} disabled={loading} className="flex-1 sm:w-auto h-11 px-6 font-bold shadow-lg shadow-red-600/20 rounded-xl bg-red-600 hover:bg-red-700 text-white">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                                Search
                            </Button>
                            {query.length === 11 && !query.includes(' ') && (
                                <Button
                                    variant="outline"
                                    onClick={() => onSelect(query, { title: 'Direct Link', artist: 'Unknown' })}
                                    className="h-11 rounded-xl border-dashed"
                                >
                                    Use ID
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1 px-5 md:px-6">
                    <div className="space-y-4 pb-6">
                        {loading && results.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-5">
                                <div className="relative">
                                    <Loader2 className="h-10 w-10 animate-spin text-red-500/40" />
                                    <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold tracking-tight text-foreground/80">Searching YouTube Music...</p>
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Fetching official audio tracks</p>
                                </div>
                            </div>
                        ) : results.map((result) => {
                            return (
                                <div key={result.videoId} className={cn(
                                    "group relative flex items-center gap-4 p-4 border rounded-2xl transition-all duration-300",
                                    "bg-muted/5 border-muted-foreground/10 hover:bg-red-500/5 hover:border-red-500/30"
                                )}>
                                    <div className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden shadow-md">
                                        <img
                                            src={result.thumbnails[0]?.url}
                                            alt={result.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Play className="h-6 w-6 text-white fill-white" />
                                        </div>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-base group-hover:text-red-500 transition-colors truncate leading-tight" title={result.title}>
                                            {result.title.length > 70 ? result.title.substring(0, 70) + '...' : result.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-medium truncate" title={result.artists.map(a => a.name).join(', ')}>
                                            {(() => {
                                                const artistStr = result.artists.map(a => a.name).join(', ');
                                                const truncatedArtist = artistStr.length > 50 ? artistStr.substring(0, 50) + '...' : artistStr;
                                                return truncatedArtist + (result.album ? ` • ${result.album.name}` : '');
                                            })()}
                                        </p>

                                        <div className="flex items-center gap-3 mt-2">
                                            {result.duration && (
                                                <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-mono bg-background/50 border-muted-foreground/10 gap-1 text-muted-foreground rounded-md">
                                                    <Clock className="h-3 w-3" />
                                                    {result.duration}
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-red-500/10 text-red-600 border-none gap-1 rounded-md">
                                                <Youtube className="h-2.5 w-2.5" />
                                                {result.resultType?.toUpperCase() || 'SONG'}
                                            </Badge>
                                        </div>
                                    </div>

                                    <Button
                                        size="sm"
                                        className="hidden sm:flex h-9 px-4 font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/10"
                                        onClick={() => handleSelect(result)}
                                    >
                                        Select
                                    </Button>

                                    {/* Mobile Select Overlay */}
                                    <button
                                        className="absolute inset-0 sm:hidden z-10"
                                        onClick={() => handleSelect(result)}
                                    />
                                </div>
                            );
                        })}

                        {results.length === 0 && !loading && query && (
                            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground transition-all animate-in fade-in zoom-in-95">
                                <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-6">
                                    <Youtube className="h-10 w-10 text-muted-foreground/30" />
                                </div>
                                <p className="text-base font-bold text-foreground/70">No matching tracks found</p>
                                <p className="text-xs mt-1 text-muted-foreground max-w-[280px] text-center">We couldn't find "{query}" on YouTube Music. Try a more specific title and artist.</p>
                            </div>
                        )}

                        {!query && !loading && (
                            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                                <div className="w-20 h-20 rounded-2xl bg-red-500/5 flex items-center justify-center mb-6 shadow-inner">
                                    <Youtube className="h-10 w-10 text-red-500/20" />
                                </div>
                                <p className="text-lg font-bold text-foreground/70">Find Perfect Audio</p>
                                <p className="text-sm mt-1 max-w-[320px] text-center px-4 text-muted-foreground leading-relaxed">Search official YouTube Music tracks to get high-quality audio for your lyrics synchronization.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
