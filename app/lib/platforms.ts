// Platform definitions for username enumeration
export interface Platform {
    name: string;
    url: string;
    errorType: 'status_code' | 'error_msg';
    errorMsg?: string;
    category: 'social' | 'professional' | 'gaming' | 'creative' | 'other';
}

export const platforms: Platform[] = [
    // Social Media
    { name: 'Instagram', url: 'https://www.instagram.com/{}/', errorType: 'status_code', category: 'social' },
    { name: 'Twitter/X', url: 'https://twitter.com/{}', errorType: 'status_code', category: 'social' },
    { name: 'Facebook', url: 'https://www.facebook.com/{}', errorType: 'status_code', category: 'social' },
    { name: 'TikTok', url: 'https://www.tiktok.com/@{}', errorType: 'status_code', category: 'social' },
    { name: 'Snapchat', url: 'https://www.snapchat.com/add/{}', errorType: 'status_code', category: 'social' },
    { name: 'Reddit', url: 'https://www.reddit.com/user/{}', errorType: 'status_code', category: 'social' },
    { name: 'Pinterest', url: 'https://www.pinterest.com/{}/', errorType: 'status_code', category: 'social' },
    { name: 'Tumblr', url: 'https://{}.tumblr.com', errorType: 'status_code', category: 'social' },

    // Professional
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/{}', errorType: 'status_code', category: 'professional' },
    { name: 'GitHub', url: 'https://github.com/{}', errorType: 'status_code', category: 'professional' },
    { name: 'GitLab', url: 'https://gitlab.com/{}', errorType: 'status_code', category: 'professional' },
    { name: 'Medium', url: 'https://medium.com/@{}', errorType: 'status_code', category: 'professional' },
    { name: 'Dev.to', url: 'https://dev.to/{}', errorType: 'status_code', category: 'professional' },

    // Gaming
    { name: 'Twitch', url: 'https://www.twitch.tv/{}', errorType: 'status_code', category: 'gaming' },
    { name: 'Steam', url: 'https://steamcommunity.com/id/{}', errorType: 'status_code', category: 'gaming' },
    { name: 'Xbox', url: 'https://xboxgamertag.com/search/{}', errorType: 'status_code', category: 'gaming' },
    { name: 'PlayStation', url: 'https://psnprofiles.com/{}', errorType: 'status_code', category: 'gaming' },

    // Creative
    { name: 'YouTube', url: 'https://www.youtube.com/@{}', errorType: 'status_code', category: 'creative' },
    { name: 'Vimeo', url: 'https://vimeo.com/{}', errorType: 'status_code', category: 'creative' },
    { name: 'SoundCloud', url: 'https://soundcloud.com/{}', errorType: 'status_code', category: 'creative' },
    { name: 'Spotify', url: 'https://open.spotify.com/user/{}', errorType: 'status_code', category: 'creative' },
    { name: 'Behance', url: 'https://www.behance.net/{}', errorType: 'status_code', category: 'creative' },
    { name: 'Dribbble', url: 'https://dribbble.com/{}', errorType: 'status_code', category: 'creative' },

    // Other
    { name: 'Patreon', url: 'https://www.patreon.com/{}', errorType: 'status_code', category: 'other' },
    { name: 'Telegram', url: 'https://t.me/{}', errorType: 'status_code', category: 'other' },
    { name: 'Discord', url: 'https://discord.com/users/{}', errorType: 'status_code', category: 'other' },
    { name: 'Linktree', url: 'https://linktr.ee/{}', errorType: 'status_code', category: 'other' },
];

// Generate username variations
export function generateVariations(input: string): string[] {
    const variations = new Set<string>();
    const cleaned = input.toLowerCase().trim();

    // Original
    variations.add(cleaned);

    // Remove spaces
    variations.add(cleaned.replace(/\s+/g, ''));

    // Replace spaces with common separators
    variations.add(cleaned.replace(/\s+/g, '.'));
    variations.add(cleaned.replace(/\s+/g, '_'));
    variations.add(cleaned.replace(/\s+/g, '-'));

    // Add common suffixes
    const suffixes = ['official', '123', 'real', 'hq'];
    suffixes.forEach(suffix => {
        variations.add(`${cleaned.replace(/\s+/g, '')}${suffix}`);
        variations.add(`${cleaned.replace(/\s+/g, '_')}_${suffix}`);
    });

    // Limit to 10 variations
    return Array.from(variations).slice(0, 10);
}
