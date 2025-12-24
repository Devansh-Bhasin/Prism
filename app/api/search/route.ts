import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { Platform, SearchResult, platforms, generateVariations } from '@/app/lib/platforms';

export const runtime = 'nodejs';

interface SearchMetadata {
    location?: string;
    query: string;
}

/**
 * Platform-First Probing: Verifies account existence before scraping
 * v3.2 Heuristic: Checks status and prevents false positives from generic redirect shells
 */
async function probeAccount(url: string): Promise<{ exists: boolean; status: number }> {
    try {
        const response = await fetch(url, {
            method: 'GET', // Switched to GET for heuristic content checks
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(5000),
        });

        const text = await response.text();
        const lowText = text.toLowerCase();

        // Solid discovery: Redirects to login/join are often non-existent signs on some platforms
        const isLoginRedirect = lowText.includes('login') || lowText.includes('signup') || lowText.includes('sign in');
        const exists = response.status >= 200 && response.status < 300 && !isLoginRedirect;

        return { exists, status: response.status };
    } catch {
        return { exists: false, status: 0 };
    }
}

/**
 * v3.2 Multi-Anchor Evidence Accumulation
 * Promotes to "Verified" if 2+ anchors are found.
 */
function calculateForensicScore(username: string, query: string, bio: string, title: string, metadata: SearchMetadata): { score: number, reasons: string[] } {
    let rawScore = 0;
    let totalWeight = 0;
    const reasons: string[] = [];
    const anchorsFound: string[] = [];

    const lowBio = bio.toLowerCase();
    const lowTitle = title.toLowerCase();
    const lowQuery = query.toLowerCase();
    const cleanQuery = lowQuery.replace(/[^a-z0-9]/g, '');
    const lowUser = username.toLowerCase();
    const cleanUser = lowUser.replace(/[^a-z0-9]/g, '');

    // 1. Anchor 1: Handle Correlation (Weight: 40)
    totalWeight += 40;
    if (cleanUser === cleanQuery) {
        rawScore += 40;
        reasons.push('Identity Anchor: Exact Handle Match');
        anchorsFound.push('handle');
    } else if (cleanUser.includes(cleanQuery) || cleanQuery.includes(cleanUser)) {
        rawScore += 35;
        reasons.push('Identity Correlation: Strong Handle Alignment');
    } else {
        const queryTokens = lowQuery.split(/\s+/).filter(t => t.length > 2);
        const matchToken = queryTokens.some(t => cleanUser.includes(t.replace(/[^a-z0-9]/g, '')));
        if (matchToken) {
            rawScore += 25;
            reasons.push('Identity Correlation: Partial Handle Match');
        } else {
            rawScore += 10;
            reasons.push('Discovery Node: Platform Match via Smart Probing');
        }
    }

    // 2. Anchor 2: Geographic Context (Weight: 25)
    if (metadata.location) {
        totalWeight += 25;
        const loc = metadata.location.toLowerCase();
        if (lowBio.includes(loc) || lowTitle.includes(loc)) {
            rawScore += 25;
            reasons.push('Contextual Alignment: Geographic Marker Found');
            anchorsFound.push('geo');
        }
    }

    // 3. Anchor 3: Forensic Identity Linking (Weight: 20)
    const socialPatterns = ['twitter.com', 't.co', 'facebook.com', 'linkedin.com', 'github.com', 'instagram.com', 'linktree', 'bio.link'];
    if (socialPatterns.some(p => lowBio.includes(p))) {
        totalWeight += 20;
        rawScore += 20;
        reasons.push('Forensic Evidence: Cross-Platform identity Links');
        anchorsFound.push('link');
    }

    // 4. Behavioral Consistency (Weight: 15)
    const profKeys = ['engineer', 'developer', 'creator', 'founder', 'artist', 'writer', 'student', 'designer', 'photography', 'tech', 'software'];
    if (profKeys.some(k => lowBio.includes(k))) {
        totalWeight += 15;
        rawScore += 15;
        reasons.push('Behavioral Consistency: Bio Keywords');
    }

    // Normalization: Calculate percentage of available evidence found
    let finalScore = totalWeight > 0 ? (rawScore / totalWeight) * 100 : 0;

    // v3.2: Verification Promotion (2+ anchors = min 90% confidence)
    if (anchorsFound.length >= 2) {
        finalScore = Math.max(finalScore, 90);
    }

    return { score: Math.max(Math.round(finalScore), 15), reasons };
}

/**
 * OSINT Scraper for v3.2
 */
async function scrapeProfile(platform: Platform, username: string, metadata: SearchMetadata, urlOverride?: string): Promise<SearchResult> {
    const url = urlOverride || platform.url.replace('{}', username);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            },
            signal: AbortSignal.timeout(8000),
        });

        if (response.status === 404) {
            return { platform: platform.name, url, found: false, username, category: platform.category, confidence: 0, scrapedBio: '', matchReasons: [] };
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Soft-404 detection
        const title = $('title').text().toLowerCase();
        if (title.includes('page not found') || title.includes('content unavailable')) {
            return { platform: platform.name, url, found: false, username, category: platform.category, confidence: 0, scrapedBio: '', matchReasons: [] };
        }

        const ogBio = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
        const profileImage = $('meta[property="og:image"]').attr('content') || '';

        const { score, reasons } = calculateForensicScore(username, metadata.query, ogBio, title, metadata);

        return {
            platform: platform.name,
            url,
            found: true,
            username,
            category: platform.category,
            confidence: score,
            matchReasons: reasons,
            scrapedBio: ogBio.slice(0, 250),
            profileImage
        };
    } catch (e) {
        return { platform: platform.name, url, found: false, username, category: platform.category, confidence: 0, scrapedBio: '', matchReasons: [] };
    }
}

export async function POST(request: NextRequest) {
    try {
        const { query, location, platforms: requestedPlatforms } = await request.json();
        const metadata: SearchMetadata = { query, location };

        if (!query) return NextResponse.json({ error: 'Identity query required' }, { status: 400 });

        const targetPlatforms = requestedPlatforms
            ? platforms.filter(p => requestedPlatforms.includes(p.name))
            : platforms;

        const variations = generateVariations(query);
        const results: SearchResult[] = [];

        // Parallel Discovery Engine (v3.2)
        await Promise.all(targetPlatforms.map(async (platform) => {
            const platformDiscovery: Promise<SearchResult[]>[] = [];

            // Vector A: Probative Probing (Simultaneous)
            const probeTask = (async () => {
                const probeHits: SearchResult[] = [];
                for (const username of variations.slice(0, 3)) {
                    const url = platform.url.replace('{}', username);
                    const probe = await probeAccount(url);
                    if (probe.exists) {
                        const profile = await scrapeProfile(platform, username, metadata);
                        if (profile.found) probeHits.push(profile);
                    }
                }
                return probeHits;
            })();
            platformDiscovery.push(probeTask);

            // Vector B: Discovery Dorking (Simultaneous)
            const dorkTask = (async () => {
                const apiKey = process.env.SERPAPI_API_KEY;
                if (!apiKey) return [];

                const dorkHits: SearchResult[] = [];
                const domain = new URL(platform.url).hostname;
                const searchQuery = `site:${domain} intitle:"${query}" -inurl:search -inurl:login`;
                const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(searchQuery)}&api_key=${apiKey}&num=5`; // Increased yield

                try {
                    const response = await fetch(searchUrl);
                    const data = await response.json();
                    if (data.organic_results) {
                        for (const res of data.organic_results) {
                            const profile = await scrapeProfile(platform, query, metadata, res.link);
                            if (profile.found) dorkHits.push(profile);
                        }
                    }
                } catch { }
                return dorkHits;
            })();
            platformDiscovery.push(dorkTask);

            // Wait for all discovery vectors for this platform
            const subResults = await Promise.all(platformDiscovery);
            results.push(...subResults.flat());
        }));

        // Deduplication: URL-based Persistence
        const uniqueResults = Array.from(
            results.reduce((acc, current) => {
                const existing = acc.get(current.url);
                if (!existing || current.confidence > existing.confidence) {
                    acc.set(current.url, current);
                }
                return acc;
            }, new Map<string, SearchResult>()).values()
        );

        return NextResponse.json({
            status: 'success',
            results: uniqueResults.sort((a, b) => b.confidence - a.confidence),
            query: metadata
        });

    } catch (error) {
        console.error('Search failure:', error);
        return NextResponse.json({ error: 'Forensic Engine Analysis Interrupted' }, { status: 500 });
    }
}
