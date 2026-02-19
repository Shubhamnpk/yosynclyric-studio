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
import { Search, Music, Clock, Loader2 } from 'lucide-react';
import { LrcLibApi, LRCLibSearchResult } from '@/services/lrcLib';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LRCLibSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (lyrics: string, synced: boolean) => void;
    initialQuery?: string;
}

export const LRCLibSearchDialog = ({ open, onOpenChange, onImport, initialQuery }: LRCLibSearchDialogProps) => {
    const [query, setQuery] = useState(initialQuery || '');
    const [results, setResults] = useState<LRCLibSearchResult[]>([]);
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
            const data = await LrcLibApi.search(q);
            setResults(data);
        } catch (error) {
            toast.error('Failed to search lyrics');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl w-[95vw] h-[85vh] md:h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-5 md:p-6 bg-gradient-to-br from-primary/10 to-transparent border-b border-primary/10">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Search className="h-5 w-5 text-primary" />
                        LRCLIB Search
                    </DialogTitle>
                    <DialogDescription className="text-xs md:text-sm">
                        Find and import synchronized lyrics from the global LRCLIB database.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-5 md:p-6 pb-2">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search song title, artist, or album..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-10 bg-muted/30 border-muted-foreground/20 focus:border-primary/50"
                                autoFocus
                            />
                        </div>
                        <Button onClick={() => handleSearch()} disabled={loading} className="w-full sm:w-auto font-bold shadow-lg shadow-primary/10">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                            Search
                        </Button>
                    </div>
                </div>

                <ScrollArea className="flex-1 px-5 md:px-6">
                    <div className="space-y-3 pb-6">
                        {loading && results.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                                <span className="text-sm font-medium animate-pulse">Searching global database...</span>
                            </div>
                        ) : results.map((result) => {
                            const mm = Math.floor(result.duration / 60);
                            const ss = Math.floor(result.duration % 60);
                            const timeStr = `${mm}:${ss.toString().padStart(2, '0')}`;

                            return (
                                <div key={result.id} className="group relative flex flex-col gap-3 p-4 border border-muted-foreground/10 rounded-xl bg-muted/5 hover:bg-muted/30 hover:border-primary/20 transition-all duration-300">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-base group-hover:text-primary transition-colors truncate">{result.trackName}</h3>
                                            <p className="text-sm text-muted-foreground font-medium truncate">{result.artistName} • {result.albumName}</p>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                                                <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-mono bg-background/50 border-muted-foreground/10 gap-1 text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {timeStr}
                                                </Badge>
                                                {result.syncedLyrics && (
                                                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold tracking-tight">
                                                        SYNCED
                                                    </Badge>
                                                )}
                                                {result.instrumental && (
                                                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-amber-500/10 text-amber-600 border-none">
                                                        INSTRUMENTAL
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-row justify-end gap-2 mt-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs h-8 font-semibold hover:bg-primary/5"
                                            onClick={() => {
                                                onImport(result.plainLyrics, false);
                                                onOpenChange(false);
                                            }}
                                            disabled={!result.plainLyrics}
                                        >
                                            Plain Text
                                        </Button>
                                        <Button
                                            size="sm"
                                            className={cn(
                                                "text-xs h-8 font-bold px-4",
                                                result.syncedLyrics ? "bg-primary shadow-md shadow-primary/10" : "bg-muted text-muted-foreground"
                                            )}
                                            onClick={() => {
                                                onImport(result.syncedLyrics, true);
                                                onOpenChange(false);
                                            }}
                                            disabled={!result.syncedLyrics}
                                        >
                                            <Music className="h-3 w-3 mr-2" />
                                            Import Synced
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}

                        {results.length === 0 && !loading && query && (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                                    <Search className="h-8 w-8 text-muted-foreground/20" />
                                </div>
                                <p className="text-sm font-medium">No results found for "{query}"</p>
                                <p className="text-xs mt-1">Try searching for the artist or a different title.</p>
                            </div>
                        )}
                        {!query && !loading && (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                                    <Music className="h-8 w-8 text-primary/20" />
                                </div>
                                <p className="text-sm font-medium">Global Lyrics Database</p>
                                <p className="text-xs mt-1 max-w-[240px] text-center px-4">Enter a song title or artist to search millions of community-sourced lyrics.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
