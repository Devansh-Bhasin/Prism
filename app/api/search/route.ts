import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { Platform, SearchResult, platforms, generateVariations } from '@/app/lib/platforms';

export const runtime = 'nodejs';

interface SearchMetadata {
    minAge?: string;
    maxAge?: string;
    gender?: string;
    location?: string;
    query: string;
}

interface ScoringEvidence {
    handleMatch: boolean;
    locationMatch: boolean;
    identityLinkFound: boolean;
    bioKeywordMatch: boolean;
    structuredDataFound: boolean;
}

/**
 * Enhanced Discovery: Uses advanced Google Dorks for higher precision
 */
async function searchDiscovery(query: string, platform: Platform): Promise<string[]> {
    const domain = new URL(platform.url).hostname;
    const apiKey = process.env.SERPAPI_API_KEY;

    if (!apiKey) return [];

    // Advanced Dorking: Target profiles, exclude search/login noise
    const searchQuery = `site:${domain} intitle:"${query}" -inurl:search -inurl:login`;
    const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(searchQuery)}&api_key=${apiKey}&num=5`;

    try {
        const response = await fetch(searchUrl);
        const data = await response.json();

        if (data.error || !data.organic_results) return [];

        return data.organic_results
            .map((res: any) => res.link)
            .filter((link: string) => link.includes(domain))
            .slice(0, 3);
    } catch (e) {
        return [];
    }
}

/**
 * Weighted Scoring Model
 */
function calculateWeightedScore(username: string, query: string, bio: string, title: string, metadata: SearchMetadata, hasJsonLd: boolean): { score: number, reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const lowBio = bio.toLowerCase();
    const lowTitle = title.toLowerCase();
    const lowQuery = query.toLowerCase();
    const lowUser = username.toLowerCase();

    // 1. Handle Match (40%)
    if (lowUser.includes(lowQuery) || lowQuery.includes(lowUser)) {
        score += 40;
        reasons.push('Identity Handle Correspondence');
    }

    // 2. Location Match (25%)
    if (metadata.location) {
        const loc = metadata.location.toLowerCase();
        if (lowBio.includes(loc) || lowTitle.includes(loc)) {
            score += 25;
            reasons.push('Geographic Entity Match');
        }
    }

    // 3. Identity Linking (20%) - Detect other social links in bio
    const socialPatterns = ['twitter.com', 't.co', 'facebook.com', 'linkedin.com', 'github.com', 'youtube.com'];
    if (socialPatterns.some(p => lowBio.includes(p))) {
        score += 20;
        reasons.push('Cross-Platform Identity Links Detected');
    }

    // 4. Bio/Keyword Affinity (15%)
    const professionalKeywords = ['engineer', 'developer', 'creator', 'founder', 'student', 'artist', 'writer'];
    if (professionalKeywords.some(k => lowBio.includes(k))) {
        score += 15;
        reasons.push('Professional Context Match');
    }

    // Bonus for Structured Data
    if (hasJsonLd) score += 5;

    return { score: Math.min(score, 100), reasons };
}

/**
 * Professional Scraper: JSON-LD + OG + Meta
 */
async function scrapeProfile(platform: Platform, username: string, metadata: SearchMetadata, urlOverride?: string): Promise<SearchResult> {
    const url = urlOverride || platform.url.replace('{}', username);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            signal: AbortSignal.timeout(8000),
        });

        if (response.status === 404) return { platform: platform.name, url, found: false, username, category: platform.category, confidence: 0, scrapedBio: '', matchReasons: [] };

        // Handle private/restricted (still found)
        if (response.status === 403 || response.status === 401) {
            return { platform: platform.name, url, found: true, username, category: platform.category, confidence: 50, scrapedBio: '[Private/Restricted Profile]', matchReasons: ['Security Restricted (Verified Exist)'], profileImage: '' };
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // 1. JSON-LD Extraction (Priority)
        let structuredBio = '';
        let hasJsonLd = false;
        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const data = JSON.parse($(el).html() || '{}');
                structuredBio = data.description || data.about || structuredBio;
                if (structuredBio) hasJsonLd = true;
            } catch (e) { }
        });

        // 2. Fallbacks
        const pageTitle = $('title').text();
        const ogBio = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
        const finalBio = structuredBio || ogBio;
        const profileImage = $('meta[property="og:image"]').attr('content') || '';

        // 3. Status/Soft-404 verification
        const noIndex = $('meta[name="robots"]').attr('content')?.includes('noindex');
        if (noIndex && !finalBio) {
            return { platform: platform.name, url, found: false, username, category: platform.category, confidence: 0, scrapedBio: '', matchReasons: [] };
        }

        const { score, reasons } = calculateWeightedScore(username, metadata.query, finalBio, pageTitle, metadata, hasJsonLd);

        return {
            platform: platform.name,
            url,
            found: true,
            username,
            category: platform.category,
            confidence: score,
            scrapedBio: finalBio.slice(0, 250),
            matchReasons: reasons,
            profileImage
        };
    } catch (e) {
        return { platform: platform.name, url, found: false, username, category: platform.category, confidence: 0, scrapedBio: '', matchReasons: [] };
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, location, platforms: requestedPlatforms } = body;
        const metadata: SearchMetadata = { ...body, query };

        if (!query) return NextResponse.json({ error: 'Identity query required' }, { status: 400 });

        const targetPlatforms = requestedPlatforms
            ? platforms.filter(p => requestedPlatforms.includes(p.name))
            : platforms;

        // Run Discovery and Direct Guessing in Parallel
        const results = await Promise.all(targetPlatforms.map(async (p) => {
            // Priority 1: Discovery via Dorks
            const discoveredUrls = await searchDiscovery(query, p);
            if (discoveredUrls.length > 0) {
                const discoveryScrapes = await Promise.all(
                    discoveredUrls.map(url => scrapeProfile(p, query, metadata, url))
                );
                return discoveryScrapes;
            }

            // Priority 2: Direct Handle Matching
            const variations = generateVariations(query);
            return [await scrapeProfile(p, variations[0], metadata)];
        }));

        const flatResults = results.flat().filter(r => r.found && r.confidence >= 30);

        // Tiered Deduplication (Prefer higher confidence for same URL)
        const unique = Array.from(
            new Map(flatResults.sort((a, b) => b.confidence - a.confidence).map(r => [r.url, r])).values()
        );

        return NextResponse.json({
            status: 'success',
            results: unique.sort((a, b) => b.confidence - a.confidence),
            query: metadata
        });

    } catch (error) {
        return NextResponse.json({ error: 'OSINT Engine Failure' }, { status: 500 });
    }
}
