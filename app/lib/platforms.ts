export type PlatformCategory = 'social' | 'professional' | 'gaming' | 'creative' | 'other';

export interface Platform {
    name: string;
    url: string;
    category: PlatformCategory;
}

export interface SearchResult {
    platform: string;
    url: string;
    found: boolean;
    username: string;
    category: string;
    confidence: number;
    matchReasons: string[];
    scrapedBio: string;
    profileImage?: string;
}

export const platforms: Platform[] = [
    // Social Media
    { name: 'Instagram', url: 'https://www.instagram.com/{}/', category: 'social' },
    { name: 'Twitter/X', url: 'https://twitter.com/{}', category: 'social' },
    { name: 'Facebook', url: 'https://www.facebook.com/{}', category: 'social' },
    { name: 'TikTok', url: 'https://www.tiktok.com/@{}', category: 'social' },
    { name: 'Reddit', url: 'https://www.reddit.com/user/{}', category: 'social' },
    { name: 'Pinterest', url: 'https://www.pinterest.com/{}/', category: 'social' },
    { name: 'Tumblr', url: 'https://{}.tumblr.com/', category: 'social' },
    { name: 'Snapchat', url: 'https://www.snapchat.com/add/{}', category: 'social' },

    // Professional
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/{}', category: 'professional' },
    { name: 'GitHub', url: 'https://github.com/{}', category: 'professional' },
    { name: 'GitLab', url: 'https://gitlab.com/{}', category: 'professional' },
    { name: 'Medium', url: 'https://medium.com/@{}', category: 'professional' },
    { name: 'Dev.to', url: 'https://dev.to/{}', category: 'professional' },
    { name: 'StackOverflow', url: 'https://stackoverflow.com/users/{}', category: 'professional' },

    // Gaming
    { name: 'Twitch', url: 'https://www.twitch.tv/{}', category: 'gaming' },
    { name: 'Steam', url: 'https://steamcommunity.com/id/{}', category: 'gaming' },
    { name: 'Xbox', url: 'https://www.xboxgamertag.com/search/{}', category: 'gaming' },
    { name: 'PlayStation', url: 'https://psnprofiles.com/{}', category: 'gaming' },

    // Creative
    { name: 'YouTube', url: 'https://www.youtube.com/@{}', category: 'creative' },
    { name: 'SoundCloud', url: 'https://soundcloud.com/{}', category: 'creative' },
    { name: 'Spotify', url: 'https://open.spotify.com/user/{}', category: 'creative' },
    { name: 'Behance', url: 'https://www.behance.net/{}', category: 'creative' },
    { name: 'Dribbble', url: 'https://dribbble.com/{}', category: 'creative' },
    { name: 'Vimeo', url: 'https://vimeo.com/{}', category: 'creative' },

    // Other
    { name: 'Linktree', url: 'https://linktr.ee/{}', category: 'other' },
    { name: 'Patreon', url: 'https://www.patreon.com/{}', category: 'other' },
    { name: 'Telegram', url: 'https://t.me/{}', category: 'other' },
    { name: 'Letterboxd', url: 'https://letterboxd.com/{}/', category: 'other' },
    { name: 'Mastodon', url: 'https://mastodon.social/@{}', category: 'other' },
    { name: 'Threads', url: 'https://www.threads.net/@{}', category: 'social' },
    { name: 'Bluesky', url: 'https://bsky.app/profile/{}', category: 'social' },
    { name: 'Last.fm', url: 'https://www.last.fm/user/{}', category: 'creative' },
];

/**
 * Generate intelligent username variations based on input
 * Following OSINT v3.0 Tokenization Logic
 */
export function generateVariations(input: string): string[] {
    const variations = new Set<string>();
    const cleaned = input.toLowerCase().trim();
    const words = cleaned.split(/\s+/);
    const joined = words.join('');

    // 1. Direct Joins
    variations.add(joined);

    // 2. Standard Separators
    const separators = ['.', '_', '-'];
    if (words.length > 1) {
        separators.forEach(sep => variations.add(words.join(sep)));
    }

    // 3. Professional & Identity Tokens
    const prefixes = ['the', 'real', 'official', 'iam'];
    const suffixes = ['official', 'real', 'dev', 'hq', 'admin', 'profile'];

    // Add variations with top prefixes/suffixes
    prefixes.forEach(p => variations.add(`${p}${joined}`));
    suffixes.forEach(s => variations.add(`${joined}${s}`));

    // 4. Case-aware tokenization (for already stylized inputs)
    if (input.includes('_') || input.includes('.')) {
        const parts = input.toLowerCase().split(/[._-]/);
        if (parts.length > 1) {
            variations.add(parts.join(''));
            separators.forEach(sep => variations.add(parts.join(sep)));
        }
    }

    // Limit to 12 strongest variations for v3.0 Probing
    return Array.from(variations).slice(0, 12);
}
