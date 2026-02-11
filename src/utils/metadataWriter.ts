import { LyricsProject } from '@/types/lyrics';
import { exportToLRC } from './exportLyrics';



/**
 * Write ID3 tags to an MP3 file using browser-id3-writer.
 * Returns a Blob of the modified MP3 with embedded metadata + lyrics.
 */
export const writeMetadataToAudio = async (
    project: LyricsProject,
    options: {
        embedLyrics?: boolean;
        coverArtBlob?: Blob | null;
    } = {}
): Promise<Blob> => {
    const { embedLyrics = true, coverArtBlob = null } = options;

    if (!project.audioFile) {
        throw new Error('No audio file loaded');
    }

    // Read the audio file as ArrayBuffer
    const arrayBuffer = await project.audioFile.arrayBuffer();

    // Dynamically import browser-id3-writer
    const { ID3Writer } = await import('browser-id3-writer');

    const writer = new ID3Writer(arrayBuffer);

    // Set text frames
    if (project.title) {
        writer.setFrame('TIT2', project.title); // Title
    }
    if (project.artist) {
        writer.setFrame('TPE1', [project.artist]); // Artist (array)
    }
    if (project.album) {
        writer.setFrame('TALB', project.album); // Album
    }
    const yearInt = parseInt(project.year);
    if (project.year && !isNaN(yearInt)) {
        writer.setFrame('TYER', yearInt); // Year
    }
    if (project.genre) {
        writer.setFrame('TCON', [project.genre]); // Genre (array)
    }

    // Embed cover art
    if (coverArtBlob) {
        try {
            const coverArrayBuffer = await coverArtBlob.arrayBuffer();
            writer.setFrame('APIC', {
                type: 3, // Front cover
                data: coverArrayBuffer,
                description: 'Cover',
                useUnicodeEncoding: false,
            });
        } catch (e) {
            console.error('Failed to embed cover art:', e);
        }
    }

    // Embed synchronized lyrics as USLT (unsynchronized lyrics text)
    if (embedLyrics) {
        const lrcContent = exportToLRC(project);
        if (lrcContent.trim()) {
            writer.setFrame('USLT', {
                description: 'Lyrics',
                lyrics: lrcContent,
                language: getISO6392Code(project.language || 'en'),
            });
        }
    }

    writer.addTag();
    return writer.getBlob();
};

/**
 * Helper to convert common language codes to ISO-639-2 (3-letter) codes
 * Defaults to 'eng' if unknown
 */
function getISO6392Code(lang: string): string {
    const map: Record<string, string> = {
        'en': 'eng', 'english': 'eng', 'eng': 'eng',
        'es': 'spa', 'spanish': 'spa', 'spa': 'spa',
        'fr': 'fra', 'french': 'fra', 'fre': 'fra', 'fra': 'fra',
        'de': 'deu', 'german': 'deu', 'ger': 'deu', 'deu': 'deu',
        'it': 'ita', 'italian': 'ita', 'ita': 'ita',
        'ja': 'jpn', 'japanese': 'jpn', 'jpn': 'jpn',
        'ko': 'kor', 'korean': 'kor', 'kor': 'kor',
        'zh': 'zho', 'chinese': 'zho', 'chi': 'zho', 'zho': 'zho',
        'hi': 'hin', 'hindi': 'hin', 'hin': 'hin',
        'ne': 'nep', 'nepali': 'nep', 'nep': 'nep',
        'pt': 'por', 'portuguese': 'por', 'por': 'por',
        'ru': 'rus', 'russian': 'rus', 'rus': 'rus',
        'ar': 'ara', 'arabic': 'ara', 'ara': 'ara',
        'tr': 'tur', 'turkish': 'tur', 'tur': 'tur',
        'nl': 'nld', 'dutch': 'nld', 'nld': 'nld', 'dut': 'nld',
    };

    const cleanLang = lang.toLowerCase().trim().slice(0, 3);
    // If it's already a valid 3-letter code like 'nep' or 'ita', use it directly if mapped, 
    // or just return it if it looks like an ISO code (3 letters)
    if (map[cleanLang]) return map[cleanLang];

    // Try mapping 2-letter codes
    const twoLetter = cleanLang.slice(0, 2);
    if (map[twoLetter]) return map[twoLetter];

    // Build a fallback: if it is exactly 3 letters, assume valid. otherwise default to 'eng'
    return cleanLang.length === 3 ? cleanLang : 'eng';
}

/**
 * Download the audio file with embedded metadata
 */
export const downloadWithMetadata = async (
    project: LyricsProject,
    options: {
        embedLyrics?: boolean;
        coverArtBlob?: Blob | null;
    } = {}
): Promise<void> => {
    const blob = await writeMetadataToAudio(project, options);

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Build filename
    const artist = project.artist ? ` - ${project.artist}` : '';
    const filename = `${project.title || 'audio'}${artist}.mp3`;
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Fetch a cover art image from a URL and return as Blob
 */
export const fetchCoverArtBlob = async (url: string): Promise<Blob | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.blob();
    } catch {
        return null;
    }
};
