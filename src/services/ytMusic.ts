export interface YTMusicSearchResult {
    videoId: string;
    title: string;
    artists: { name: string; id?: string }[];
    album?: { name: string; id?: string };
    duration?: string;
    duration_seconds?: number;
    thumbnails: { url: string; width: number; height: number }[];
    category?: string;
    resultType?: string;
}

export const YTMusicApi = {
    baseUrl: 'https://yoytmusic-api.vercel.app',

    async search(query: string, limit: number = 10, filter: string = 'songs'): Promise<YTMusicSearchResult[]> {
        const url = new URL(`${this.baseUrl}/api/public/search`);
        url.searchParams.append('q', query);
        url.searchParams.append('limit', limit.toString());
        url.searchParams.append('filter', filter);

        try {
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`YTMusic API error: ${response.statusText}`);
            }
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('Failed to search YTMusic:', error);
            throw error;
        }
    }
};
