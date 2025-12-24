import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { Platform, SearchResult, platforms, generateVariations } from '@/app/lib/platforms';

// Use Node.js runtime for deeper scraping capabilities
export const runtime = 'nodejs';

interface SearchMetadata {
    minAge?: string;
    maxAge?: string;
    gender?: string;
    location?: string;
    query: string;
}

/**
 * OSINT Aggregator: Uses SerpApi (Google) to find real profiles via 'site:' dorks
 */
async function searchDiscovery(query: string, platformName: string, platformBaseUrl: string): Promise<string[]> {
    const domain = new URL(platformBaseUrl).hostname;
    const apiKey = process.env.SERPAPI_API_KEY;

    if (!apiKey) {
        console.warn('SERPAPI_API_KEY not found. Falling back to local guessing.');
        return [];
    }

    const searchQuery = `site:${domain} "${query}"`;
    const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(searchQuery)}&api_key=${apiKey}&num=3`;

    try {
        const response = await fetch(searchUrl);
        const data = await response.json();

        if (data.error) {
            console.error('SerpApi Error:', data.error);
            return [];
        }

        const links = data.organic_results?.map((res: any) => res.link) || [];
        console.log(`SerpApi: Found ${links.length} results for ${platformName}`);

        return links.filter((link: string) => link.includes(domain)).slice(0, 2);
    } catch (e) {
        console.error(`SerpApi Discovery failed for ${platformName}:`, e);
        return [];
    }
}

/**
 * Deep Scraper: Fetches the actual page and parses metadata tags
 */
async function scrapeProfile(platform: Platform, username: string, metadata: SearchMetadata): Promise<SearchResult> {
    const url = platform.url.replace('{}', username);
    let confidence = 30; // Base confidence for finding a valid profile page
    const matchReasons = ['Profile Discovery'];
    let scrapedBio = '';
    let profileImage = '';

    const USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
    ];

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            },
            signal: AbortSignal.timeout(10000), // 10s timeout
            redirect: 'follow',
        });

        // Handle common non-200 statuses
        if (response.status === 404) {
            return { platform: platform.name, url, found: false, username, category: platform.category, confidence: 0, scrapedBio: '', matchReasons: [] };
        }

        if (response.status !== 200) {
            // Some platforms return 403 or 401 for private profiles, which STILL means they exist
            if (response.status === 403 || response.status === 401) {
                return { platform: platform.name, url, found: true, username, category: platform.category, confidence: 50, scrapedBio: 'Private Profile', matchReasons: ['Platform restricted access (Profile likely exists)'], profileImage: '' };
            }
            return { platform: platform.name, url, found: false, username, category: platform.category, confidence: 0, scrapedBio: '', matchReasons: [] };
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Soft 404 Detection
        const pageTitle = $('title').text().toLowerCase();
        const pageContent = $('body').text().toLowerCase().slice(0, 1000); // Check first 1000 chars
        const soft404Markers = [
            'page not found',
            'user not found',
            'not found',
            'doesn\'t exist',
            'does not exist',
            'couldn\'t find',
            'error 404',
            'login • instagram',
            'log in to twitter',
            'login on twitter',
            'create an account or log in'
        ];

        if (soft404Markers.some(marker => pageTitle.includes(marker) || pageContent.includes(marker))) {
            // Exceptions: some platforms have "not found" in titles for valid pages if they are profiles (rare)
            // But usually this is a good indicator
            return { platform: platform.name, url, found: false, username, category: platform.category, confidence: 0, scrapedBio: '', matchReasons: [] };
        }

        // Extract Bio from OpenGraph tags (standard across social media)
        scrapedBio = $('meta[property="og:description"]').attr('content') ||
            $('meta[name="description"]').attr('content') ||
            $('meta[property="twitter:description"]').attr('content') || '';

        profileImage = $('meta[property="og:image"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content') || '';

        const lowBio = scrapedBio.toLowerCase();
        const lowTitle = pageTitle;

        // 🎯 Intelligence Matching
        if (metadata.location && (lowBio.includes(metadata.location.toLowerCase()) || lowTitle.includes(metadata.location.toLowerCase()))) {
            confidence += 35;
            matchReasons.push('Verified Location Match');
        }

        if (metadata.minAge || metadata.maxAge) {
            const min = parseInt(metadata.minAge || '0');
            const max = parseInt(metadata.maxAge || '100');

            // Look for numbers in bio/title and see if they fall in range
            const numbers = (lowBio + ' ' + lowTitle).match(/\d+/g);
            if (numbers) {
                const foundInRange = numbers.some(n => {
                    const val = parseInt(n);
                    return val >= min && val <= max && val > 12; // Basic sanity check for age
                });
                if (foundInRange) {
                    confidence += 25;
                    matchReasons.push('Age Range Affinity Verified');
                }
            }
        }

        if (metadata.gender && metadata.gender !== 'unspecified' && (lowBio.includes(metadata.gender) || lowTitle.includes(metadata.gender))) {
            confidence += 15;
            matchReasons.push('Gender Consistency');
        }

        // Platform specific markers for "Person Profile"
        const personMarkers = ['profile', 'joined', 'follower', 'following', 'posts', 'bio', 'social', 'member'];
        if (personMarkers.some(m => lowBio.includes(m) || lowTitle.includes(m))) {
            confidence += 10;
        }

        return {
            platform: platform.name,
            url,
            found: true,
            username,
            category: platform.category,
            confidence: Math.min(confidence, 100),
            scrapedBio: scrapedBio.slice(0, 200), // Limit bio length
            matchReasons,
            profileImage
        };
    } catch (error) {
        // console.warn(`Scrape failed for ${platform.name} (${username}):`, error instanceof Error ? error.message : error);
        return { platform: platform.name, url, found: false, username, category: platform.category, confidence: 0, scrapedBio: '', matchReasons: [] };
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, minAge, maxAge, gender, location, platforms: requestedPlatforms } = body;
        const metadata: SearchMetadata = { minAge, maxAge, gender, location, query };

        if (!query) return NextResponse.json({ error: 'Identity query required' }, { status: 400 });

        const variations = generateVariations(query);

        // Filter platforms based on user selection or defaults
        const targetPlatforms = requestedPlatforms
            ? platforms.filter(p => requestedPlatforms.includes(p.name))
            : platforms;

        // Prioritize Instagram, Facebook, Twitter, YouTube as requested
        const coreNames = ['Instagram', 'Facebook', 'Twitter/X', 'YouTube'];
        const corePlatforms = targetPlatforms.filter(p => coreNames.includes(p.name));
        const extraPlatforms = targetPlatforms.filter(p => !coreNames.includes(p.name));

        const mainVariation = variations[0];

        // --- PHASE 1: Discovery (The Aggregator) ---
        console.log(`Starting Aggregator Discovery for query: "${query}"`);
        const discoveryResults = await Promise.all(
            corePlatforms.map(async (p) => {
                const foundUrls = await searchDiscovery(query, p.name, p.url);
                return { platform: p, urls: foundUrls };
            })
        );

        // --- PHASE 2: Deep Scrape ---
        // Now we scrape the ACTUAL URLs we found
        const scrapeTasks: Promise<SearchResult>[] = [];

        for (const dr of discoveryResults) {
            if (dr.urls.length > 0) {
                console.log(`Discovery: Using ${dr.urls.length} found URLs for ${dr.platform.name}`);
                dr.urls.forEach(url => {
                    const parts = url.split('/').filter(Boolean);
                    const username = parts[parts.length - 1] || query;
                    scrapeTasks.push(scrapeProfile(dr.platform, username, metadata));
                });
            } else {
                console.log(`Discovery: No URLs found for ${dr.platform.name}, falling back to Variation Guessing`);
                scrapeTasks.push(scrapeProfile(dr.platform, mainVariation, metadata));
            }
        }

        const coreResults = await Promise.all(scrapeTasks);

        // 2. Broad Check: Extra Platforms (Quick guess for speed on less important sites)
        const extraChecks = extraPlatforms.map(p => scrapeProfile(p, mainVariation, metadata));
        const extraResults = await Promise.all(extraChecks);

        let allResults = [...coreResults, ...extraResults];

        const validResults = allResults.filter(r => r.found && r.confidence >= 30);

        // Rank by confidence and deduplicate
        const uniqueRanked = Array.from(
            new Map(validResults.sort((a, b) => b.confidence - a.confidence).map(r => [r.platform + r.url, r])).values()
        );
        return NextResponse.json({
            status: 'success',
            results: uniqueRanked.slice(0, 35),
            query: metadata,
        });

    } catch (error) {
        console.error('Scraping Engine Failure:', error);
        return NextResponse.json({ error: 'Scraping engine failure' }, { status: 500 });
    }
}
