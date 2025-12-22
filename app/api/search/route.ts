import { NextRequest, NextResponse } from 'next/server';
import { platforms, generateVariations } from '@/app/lib/platforms';
import * as cheerio from 'cheerio';

// use Node.js runtime for deeper scraping capabilities
export const runtime = 'nodejs';

interface SearchResult {
    platform: string;
    url: string;
    found: boolean;
    username: string;
    category: string;
    confidence: number;
    scrapedBio: string;
    matchReasons: string[];
    profileImage?: string;
}

/**
 * Deep Scraper: Fetches the actual page and parses metadata tags
 */
async function scrapeProfile(platform: any, username: string, metadata: any): Promise<SearchResult> {
    const url = platform.url.replace('{}', username);
    let confidence = 30; // Base confidence for finding a valid profile page
    const matchReasons = ['Profile Discovery'];
    let scrapedBio = '';
    let profileImage = '';

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            },
        });

        if (response.status !== 200) {
            return { platform: platform.name, url, found: false, username, category: platform.category, confidence: 0, scrapedBio: '', matchReasons: [] };
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract Bio from OpenGraph tags (standard across social media)
        scrapedBio = $('meta[property="og:description"]').attr('content') ||
            $('meta[name="description"]').attr('content') || '';

        profileImage = $('meta[property="og:image"]').attr('content') || '';

        const lowBio = scrapedBio.toLowerCase();

        // 🎯 Intelligence Matching
        if (metadata.location && lowBio.includes(metadata.location.toLowerCase())) {
            confidence += 35;
            matchReasons.push('Verified Location Match');
        }

        if (metadata.age) {
            const agePattern = new RegExp(`\\b${metadata.age}\\b`, 'i');
            if (agePattern.test(lowBio)) {
                confidence += 20;
                matchReasons.push('Age Affinity Detected');
            }
        }

        if (metadata.gender !== 'unspecified' && lowBio.includes(metadata.gender)) {
            confidence += 15;
            matchReasons.push('Gender Consistency');
        }

        // Search engine optimization check (is this likely a person profile?)
        if (lowBio.includes('profile') || lowBio.includes('joined') || lowBio.includes('follower')) {
            confidence += 10;
        }

        return {
            platform: platform.name,
            url,
            found: true,
            username,
            category: platform.category,
            confidence: Math.min(confidence, 100),
            scrapedBio,
            matchReasons,
            profileImage
        };
    } catch (error) {
        return { platform: platform.name, url, found: false, username, category: platform.category, confidence: 0, scrapedBio: '', matchReasons: [] };
    }
}

export async function POST(request: NextRequest) {
    try {
        const { query, age, gender, location } = await request.json();
        const metadata = { age, gender, location, query };

        if (!query) return NextResponse.json({ error: 'Identity query required' }, { status: 400 });

        const variations = generateVariations(query);
        const allChecks: Promise<SearchResult>[] = [];

        // Aggressive Discovery: Check variations across top platforms
        for (const variation of variations) {
            for (const platform of platforms) {
                allChecks.push(scrapeProfile(platform, variation, metadata));
            }
        }

        const results = await Promise.all(allChecks);
        const validResults = results.filter(r => r.found && r.confidence > 30);

        // Rank by confidence and deduplicate
        const uniqueRanked = Array.from(
            new Map(validResults.sort((a, b) => b.confidence - a.confidence).map(r => [r.platform + r.url, r])).values()
        );

        return NextResponse.json({
            status: 'success',
            results: uniqueRanked.slice(0, 15), // Deep list of potential matches
            query: metadata,
        });

    } catch (error) {
        console.error('Scraping Engine Failure:', error);
        return NextResponse.json({ error: 'Scraping engine timeout or failure' }, { status: 500 });
    }
}
