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
        let nonce = 0;
        while (true) {
            const input = prefix + nonce.toString();
            // Use subtle crypto for performance
            const encoder = new TextEncoder();
            const data = encoder.encode(input);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            if (hashHex.startsWith(target)) {
                return `${prefix}:${nonce}:${hashHex}`;
                // Note: The documentation might specify what the token format is. 
                // Wait, the docs say: "The solution to this challenge (a nonce) is used to create a Publish Token"
                // Usually it's just the nonce or the combined string. 
                // Let's re-read carefully or valididate.
                // The doc says: "Submit the nonce as the X-Publish-Token header." or similar?
                // Actually, often these APIs follow a specific pattern. 
                // Let's check if I can find more info on the token format.
                // Re-reading docs snippet: "The solution to this challenge (a nonce) is used to create a Publish Token"
                // It likely means the token is `prefix:nonce` or just `nonce`.
                // However, another source says: "token = prefix + ':' + nonce"
                // Let's assume it IS `prefix:nonce`.
                // Wait, if I look at similar services (like verifying PoW), usually you send the nonce.
                // But the python client for lrclib uses `prefix + ":" + nonce`.
                // I will try `prefix + ":" + nonce`. 
            }
            nonce++;
            if (nonce % 1000 === 0) {
                await new Promise(r => setTimeout(r, 0)); // Yield to main thread
            }
        }
    }
};
