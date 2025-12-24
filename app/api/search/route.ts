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
 * Minimizes API overhead and false positives
 */
async function probeAccount(url: string): Promise<{ exists: boolean; status: number }> {
    try {
        const response = await fetch(url, {
            method: 'HEAD',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(5000),
        });

        // Solid discovery: Redirects or OK usually mean a profile node exists
        return {
            exists: response.status >= 200 && response.status < 400,
            status: response.status
        };
    } catch {
        return { exists: false, status: 0 };
    }
}

/**
 * v3.0 Evidence Accumulation Scoring
 * Missing data is treated as NEUTRAL (0 weight impact)
 */
function calculateForensicScore(username: string, query: string, bio: string, title: string, metadata: SearchMetadata): { score: number, reasons: string[] } {
    let rawScore = 0;
    let totalWeight = 0;
    const reasons: string[] = [];

    const lowBio = bio.toLowerCase();
    const lowTitle = title.toLowerCase();
    const lowQuery = query.toLowerCase();
    const lowUser = username.toLowerCase();

    // 1. Handle Correlation (Weight: 40)
    totalWeight += 40;
    if (lowUser === lowQuery) {
        rawScore += 40;
        reasons.push('Identity Anchor: Exact Handle Match');
    } else if (lowUser.includes(lowQuery) || lowQuery.includes(lowUser)) {
        rawScore += 30;
        reasons.push('Identity Correlation: Fuzzy Handle Match');
    }

    // 2. Geographic Context (Weight: 25)
    if (metadata.location) {
        totalWeight += 25;
        const loc = metadata.location.toLowerCase();
        if (lowBio.includes(loc) || lowTitle.includes(loc)) {
            rawScore += 25;
            reasons.push('Contextual Alignment: Geographic Marker Found');
        }
    }

    // 3. Identity Linking (Weight: 20)
    const socialPatterns = ['twitter.com', 't.co', 'facebook.com', 'linkedin.com', 'github.com', 'instagram.com'];
    if (socialPatterns.some(p => lowBio.includes(p))) {
        totalWeight += 20;
        rawScore += 20;
        reasons.push('Forensic Evidence: Cross-Platform identity Links');
    }

    // 4. Bio Keyword Affinity (Weight: 15)
    const profKeys = ['engineer', 'developer', 'creator', 'founder', 'artist', 'writer', 'student'];
    if (profKeys.some(k => lowBio.includes(k))) {
        totalWeight += 15;
        rawScore += 15;
        reasons.push('Behavioral Consistency: Bio Keywords');
    }

    // Normalization: Calculate percentage of available evidence found
    const finalScore = totalWeight > 0 ? (rawScore / totalWeight) * 100 : 0;
    return { score: Math.round(finalScore), reasons };
}

/**
 * OSINT Scraper for v3.0
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

        // Parallel Probing & Scraping across platforms
        await Promise.all(targetPlatforms.map(async (platform) => {
            const platformResults: SearchResult[] = [];

            // Probing Phase: Check top 3 variations directly
            for (const username of variations.slice(0, 3)) {
                const url = platform.url.replace('{}', username);
                const probe = await probeAccount(url);
                if (probe.exists) {
                    const profile = await scrapeProfile(platform, username, metadata);
                    if (profile.found) platformResults.push(profile);
                }
            }

            // Fallback Discovery Phase: If no probe hits, try Google Dorking
            if (platformResults.length === 0) {
                const apiKey = process.env.SERPAPI_API_KEY;
                if (apiKey) {
                    const domain = new URL(platform.url).hostname;
                    const searchQuery = `site:${domain} intitle:"${query}" -inurl:search -inurl:login`;
                    const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(searchQuery)}&api_key=${apiKey}&num=3`;

                    try {
                        const response = await fetch(searchUrl);
                        const data = await response.json();
                        if (data.organic_results) {
                            for (const res of data.organic_results.slice(0, 2)) {
                                const profile = await scrapeProfile(platform, query, metadata, res.link);
                                if (profile.found) platformResults.push(profile);
                            }
                        }
                    } catch { }
                }
            }

            results.push(...platformResults);
        }));

        // v3.0 Deduplication: Use URL-based Map and keep highest confidence
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
