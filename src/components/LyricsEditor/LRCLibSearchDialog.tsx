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
            <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Search Lyrics on LRCLIB</DialogTitle>
                    <DialogDescription>
                        Find and import synchronized lyrics from the LRCLIB database.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 py-4">
                    <Input
                        placeholder="Search by song, artist, or album..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        autoFocus
                    />
                    <Button onClick={() => handleSearch()} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                        Search
                    </Button>
                </div>

                <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="space-y-4 pb-4">
                        {results.map((result) => (
                            <div key={result.id} className="flex flex-col gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold">{result.trackName}</h3>
                                        <p className="text-sm text-muted-foreground">{result.artistName} • {result.albumName}</p>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {Math.floor(result.duration / 60)}:{(result.duration % 60).toString().padStart(2, '0')}
                                            </span>
                                            {result.instrumental && <span className="bg-secondary px-1.5 py-0.5 rounded">Instrumental</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            onImport(result.plainLyrics, false);
                                            onOpenChange(false);
                                        }}
                                        disabled={!result.plainLyrics}
                                    >
                                        Import Text
                                    </Button>
                                    <Button
                                        size="sm"
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
                        ))}
                        {results.length === 0 && !loading && query && (
                            <div className="text-center py-10 text-muted-foreground">
                                No results found.
                            </div>
                        )}
                        {!query && !loading && (
                            <div className="text-center py-10 text-muted-foreground">
                                Enter a song title or artist to start searching.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
