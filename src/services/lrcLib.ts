export interface LRCLibSearchResult {
    id: number;
    trackName: string;
    artistName: string;
    albumName: string;
    duration: number;
    instrumental: boolean;
    plainLyrics: string;
    syncedLyrics: string;
}

const BASE_URL = 'https://lrclib.net/api';

export const LrcLibApi = {
    async search(query: string): Promise<LRCLibSearchResult[]> {
        try {
            const response = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Failed to fetch from LRCLIB');
            return await response.json();
        } catch (error) {
            console.error('LRCLIB Search Error:', error);
            return [];
        }
    },

    async get(trackName: string, artistName: string, albumName: string, duration: number) {
        try {
            const params = new URLSearchParams({
                track_name: trackName,
                artist_name: artistName,
                album_name: albumName,
                duration: duration.toString(),
            });
            const response = await fetch(`${BASE_URL}/get?${params}`);
            if (!response.ok) throw new Error('Failed to fetch from LRCLIB');
            return await response.json();
        } catch (error) {
            console.error('LRCLIB Get Error:', error);
            return null;
        }
    },

    async getById(id: number) {
        try {
            const response = await fetch(`${BASE_URL}/get/${id}`);
            if (!response.ok) throw new Error('Failed to fetch from LRCLIB');
            return await response.json();
        } catch (error) {
            console.error('LRCLIB GetById Error:', error);
            return null;
        }
    },

    async requestChallenge(): Promise<{ prefix: string; target: string } | null> {
        try {
            const response = await fetch(`${BASE_URL}/request-challenge`, {
                method: 'POST'
            });
            if (!response.ok) throw new Error('Failed to request challenge');
            return await response.json();
        } catch (error) {
            console.error('LRCLIB Request Challenge Error:', error);
            return null;
        }
    },

    async publish(data: {
        trackName: string;
        artistName: string;
        albumName: string;
        duration: number;
        plainLyrics: string;
        syncedLyrics: string;
    }, token: string) {
        try {
            const response = await fetch(`${BASE_URL}/publish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Publish-Token': token
                },
                body: JSON.stringify({
                    track_name: data.trackName,
                    artist_name: data.artistName,
                    album_name: data.albumName,
                    duration: data.duration,
                    plain_lyrics: data.plainLyrics,
                    synced_lyrics: data.syncedLyrics
                })
            });
            if (!response.ok) throw new Error('Failed to publish to LRCLIB');
            return true;
        } catch (error) {
            console.error('LRCLIB Publish Error:', error);
            throw error;
        }
    },

    async solveChallenge(prefix: string, target: string): Promise<string> {
        return new Promise((resolve) => {
            const numWorkers = Math.max(1, navigator.hardwareConcurrency || 4);
            const workers: Worker[] = [];
            let solved = false;

            const workerCode = `
                onmessage = async (e) => {
                    const { prefix, target, startNonce, stepSize } = e.data;
                    let nonce = startNonce;
                    const encoder = new TextEncoder();
                    const targetLen = target.length;
                    
                    // Pre-compute hex table for faster conversion
                    const hexTab = new Array(256);
                    for (let i = 0; i < 256; i++) {
                        hexTab[i] = i.toString(16).padStart(2, '0');
                    }

                    while (true) {
                        const input = prefix + nonce;
                        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(input));
                        const hashArray = new Uint8Array(hashBuffer);
                        
                        let hashHex = '';
                        // Only convert as many bytes as needed to check the target
                        const bytesToConvert = Math.ceil(targetLen / 2);
                        for (let i = 0; i < bytesToConvert; i++) {
                            hashHex += hexTab[hashArray[i]];
                        }
                        
                        if (hashHex.startsWith(target)) {
                            postMessage(nonce);
                            return;
                        }
                        nonce += stepSize;
                    }
                };
            `;

            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);

            const terminateAll = () => {
                workers.forEach(w => w.terminate());
                URL.revokeObjectURL(workerUrl);
            };

            for (let i = 0; i < numWorkers; i++) {
                const worker = new Worker(workerUrl);
                worker.onmessage = (e) => {
                    if (!solved) {
                        solved = true;
                        terminateAll();
                        resolve(`${prefix}:${e.data}`);
                    }
                };
                worker.postMessage({
                    prefix,
                    target,
                    startNonce: i,
                    stepSize: numWorkers
                });
                workers.push(worker);
            }
        });
    }
};
