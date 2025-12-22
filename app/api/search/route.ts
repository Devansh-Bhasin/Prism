import { NextRequest, NextResponse } from 'next/server';
import { platforms, generateVariations } from '@/app/lib/platforms';

export const runtime = 'edge';

interface SearchResult {
    platform: string;
    url: string;
    found: boolean;
    username: string;
    category: string;
    confidence: number;
    matchReasons: string[];
}

async function checkUsername(platform: any, username: string, metadata: any): Promise<SearchResult> {
    const url = platform.url.replace('{}', username);
    let confidence = 40; // Base confidence
    const matchReasons = ['Username Pattern Match'];

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        clearTimeout(timeoutId);
        if (response.status < 200 || response.status >= 400) {
            return { platform: platform.name, url, found: false, username, category: platform.category, confidence: 0, matchReasons: [] };
        }

        const body = await response.text();
        const lowBody = body.toLowerCase();

        // Attribute Scraper Logic
        if (metadata.location && lowBody.includes(metadata.location.toLowerCase())) {
            confidence += 30;
            matchReasons.push('Location Fragment Found');
        }
        if (metadata.age && (lowBody.includes(` ${metadata.age} `) || lowBody.includes(`${metadata.age} years`))) {
            confidence += 20;
            matchReasons.push('Age Reference Detected');
        }
        if (metadata.gender !== 'unspecified' && lowBody.includes(metadata.gender)) {
            confidence += 10;
            matchReasons.push('Gender Identifier Context');
        }

        return {
            platform: platform.name,
            url,
            found: true,
            username,
            category: platform.category,
            confidence: Math.min(confidence, 100),
            matchReasons,
        };
    } catch (error) {
        return { platform: platform.name, url, found: false, username, category: platform.category, confidence: 0, matchReasons: [] };
    }
}

export async function POST(request: NextRequest) {
    try {
        const { query, age, gender, location } = await request.json();
        const metadata = { age, gender, location };

        if (!query) {
            return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
        }

        const variations = generateVariations(query);
        const allChecks: Promise<SearchResult>[] = [];

        // Prioritize top 20 platforms for deeper analysis
        const prioritizedPlatforms = platforms.slice(0, 20);

        for (const variation of variations) {
            for (const platform of prioritizedPlatforms) {
                allChecks.push(checkUsername(platform, variation, metadata));
            }
        }

        const results = await Promise.all(allChecks);
        const foundResults = results.filter(r => r.found);

        // Sort by confidence
        const sortedResults = foundResults.sort((a, b) => b.confidence - a.confidence);

        // Deduplicate and filter high-quality matches
        const uniqueResults = Array.from(
            new Map(sortedResults.map(r => [r.platform, r])).values()
        ).slice(0, 10);

        return NextResponse.json({
            results: uniqueResults,
            totalFound: uniqueResults.length,
        });

    } catch (error) {
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}

