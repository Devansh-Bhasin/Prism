// Platform definitions for deep scraping
export interface Platform {
    name: string;
    url: string;
    searchPattern: string; // Google Dork pattern
    category: 'social' | 'professional' | 'gaming' | 'creative' | 'other';
}

export const platforms: Platform[] = [
    // Social Media
    {
        name: 'Instagram',
        url: 'https://www.instagram.com/{}/',
        searchPattern: 'site:instagram.com "{name}" "{location}"',
        category: 'social'
    },
    {
        name: 'Twitter/X',
        url: 'https://twitter.com/{}',
        searchPattern: 'site:twitter.com "{name}" "{location}"',
        category: 'social'
    },
    {
        name: 'Facebook',
        url: 'https://www.facebook.com/{}',
        searchPattern: 'site:facebook.com "{name}" "{location}"',
        category: 'social'
    },
    {
        name: 'LinkedIn',
        url: 'https://www.linkedin.com/in/{}',
        searchPattern: 'site:linkedin.com/in/ "{name}" "{location}"',
        category: 'professional'
    },
    {
        name: 'GitHub',
        url: 'https://github.com/{}',
        searchPattern: 'site:github.com "{name}" "{location}"',
        category: 'professional'
    },
    {
        name: 'TikTok',
        url: 'https://www.tiktok.com/@{}',
        searchPattern: 'site:tiktok.com "@{name}"',
        category: 'social'
    },
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

    // Limit to 10 variations
    return Array.from(variations).slice(0, 10);
}
