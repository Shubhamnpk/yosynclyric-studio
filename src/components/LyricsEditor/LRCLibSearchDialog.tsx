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
import { Search, Music, Clock, Loader2, Database, ShieldCheck, Globe } from 'lucide-react';
import { LrcLibApi, LRCLibSearchResult } from '@/services/lrcLib';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useConvex, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface SearchResult extends LRCLibSearchResult {
    source: 'lrclib' | 'yosync';
}

interface LRCLibSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (lyrics: string, synced: boolean, metadata?: { title: string, artist: string, album?: string, duration?: number }) => void;
    initialQuery?: string;
}

export const LRCLibSearchDialog = ({ open, onOpenChange, onImport, initialQuery }: LRCLibSearchDialogProps) => {
    const convex = useConvex();
    const [query, setQuery] = useState(initialQuery || '');
    const [results, setResults] = useState<SearchResult[]>([]);
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
            // 1. Search LRCLIB
            const lrcPromise = LrcLibApi.search(q);

            // 2. Search Yosync (Convex)
            const yosyncPromise = convex.query(api.lyrics.searchByText, { query: q });

            const [lrcData, yosyncData] = await Promise.all([lrcPromise, yosyncPromise]);

            const formattedLrc: SearchResult[] = lrcData.map(r => ({ ...r, source: 'lrclib' }));
            const formattedYosync: SearchResult[] = (yosyncData || []).map(r => ({
                id: (r as any)._id,
                trackName: r.trackName,
                artistName: r.artistName,
                albumName: r.albumName || '',
                duration: r.duration,
                instrumental: false,
                plainLyrics: r.plainLyrics,
                syncedLyrics: r.syncedLyrics || '',
                source: 'yosync'
            }));

            // Combine and prioritize Yosync (Verified) results
            setResults([...formattedYosync, ...formattedLrc]);

        } catch (error) {
            console.error('Search error:', error);
            toast.error('Failed to search lyrics');
        } finally {
            setLoading(false);
        }
    };

    const incrementSearch = useMutation(api.lyrics.incrementSearchCount);

    const handleImport = async (lyrics: string, synced: boolean, source: string, id: any, metadata: { title: string, artist: string, album?: string, duration?: number }) => {
        if (source === 'yosync' && id) {
            try {
                await incrementSearch({ id });
            } catch (err) {
                console.error("Failed to increment search count", err);
            }
        }
        onImport(lyrics, synced, metadata);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl w-[95vw] h-[85vh] md:h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-xl">
                <DialogHeader className="p-6 md:p-8 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-b border-primary/10">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                        <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                            <Search className="h-5 w-5" />
                        </div>
                        Universal Lyrics Search
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        Find and import synchronized lyrics from Yosync Database and LRCLIB.
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
                                className="pl-10 h-11 bg-muted/40 border-muted-foreground/20 focus:border-primary/50 rounded-xl"
                                autoFocus
                            />
                        </div>
                        <Button onClick={() => handleSearch()} disabled={loading} className="w-full sm:w-auto h-11 px-6 font-bold shadow-lg shadow-primary/20 rounded-xl">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                            Search
                        </Button>
                    </div>
                </div>

                <ScrollArea className="flex-1 px-5 md:px-6">
                    <div className="space-y-4 pb-6">
                        {loading && results.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-5">
                                <div className="relative">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold tracking-tight text-foreground/80">Scanning Databases...</p>
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Connecting to global servers</p>
                                </div>
                            </div>
                        ) : results.map((result) => {
                            const mm = Math.floor(result.duration / 60);
                            const ss = Math.floor(result.duration % 60);
                            const timeStr = `${mm}:${ss.toString().padStart(2, '0')}`;
                            const isYosync = result.source === 'yosync';

                            return (
                                <div key={result.id + result.source} className={cn(
                                    "group relative flex flex-col gap-4 p-5 border rounded-2xl transition-all duration-300",
                                    isYosync
                                        ? "bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                                        : "bg-muted/5 border-muted-foreground/10 hover:bg-muted/20 hover:border-primary/20"
                                )}>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors truncate leading-tight">
                                                    {result.trackName}
                                                </h3>
                                                {isYosync && (
                                                    <Badge className="bg-primary text-primary-foreground text-[10px] h-5 px-1.5 font-bold shadow-sm">
                                                        <ShieldCheck className="h-3 w-3 mr-1" />
                                                        VERIFIED
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground font-medium truncate">{result.artistName} • {result.albumName}</p>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
                                                <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-mono bg-background/50 border-muted-foreground/10 gap-1 text-muted-foreground rounded-md">
                                                    <Clock className="h-3 w-3" />
                                                    {timeStr}
                                                </Badge>
                                                {result.syncedLyrics && (
                                                    <Badge variant="secondary" className="h-5 px-2 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold tracking-tight rounded-md">
                                                        SYNCED
                                                    </Badge>
                                                )}
                                                <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-muted/50 text-muted-foreground border-none gap-1 rounded-md">
                                                    {isYosync ? <Database className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}
                                                    {isYosync ? "YOSYNC" : "LRCLIB"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-row justify-end gap-3 mt-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs h-9 px-4 font-bold hover:bg-primary/5 rounded-xl transition-all"
                                            onClick={() => handleImport(result.plainLyrics, false, result.source, result.id, { title: result.trackName, artist: result.artistName, album: result.albumName, duration: result.duration })}
                                            disabled={!result.plainLyrics}
                                        >
                                            Plain Text
                                        </Button>
                                        <Button
                                            size="sm"
                                            className={cn(
                                                "text-xs h-9 px-6 font-bold rounded-xl transition-all",
                                                result.syncedLyrics ? "bg-primary shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground"
                                            )}
                                            onClick={() => handleImport(result.syncedLyrics, true, result.source, result.id, { title: result.trackName, artist: result.artistName, album: result.albumName, duration: result.duration })}
                                            disabled={!result.syncedLyrics}
                                        >
                                            <Music className="h-3.5 w-3.5 mr-2" />
                                            Import Synced
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}

                        {results.length === 0 && !loading && query && (
                            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground transition-all animate-in fade-in zoom-in-95">
                                <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-6">
                                    <Search className="h-10 w-10 text-muted-foreground/30" />
                                </div>
                                <p className="text-base font-bold text-foreground/70">No matching lyrics found</p>
                                <p className="text-xs mt-1 text-muted-foreground max-w-[280px] text-center">We couldn't find "{query}" in any of our databases. Try a different search term.</p>
                            </div>
                        )}
                        {!query && !loading && (
                            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                                <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 shadow-inner">
                                    <Music className="h-10 w-10 text-primary/20" />
                                </div>
                                <p className="text-lg font-bold text-foreground/70">Start Your Search</p>
                                <p className="text-sm mt-1 max-w-[320px] text-center px-4 text-muted-foreground leading-relaxed">Search millions of community-sourced and verified lyrics from Yosync and global databases.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
