import { NextRequest, NextResponse } from 'next/server';
import { platforms, generateVariations } from '@/app/lib/platforms';

export const runtime = 'edge';

interface SearchResult {
    platform: string;
    url: string;
    found: boolean;
    username: string;
    category: string;
}

async function checkUsername(platform: any, username: string): Promise<SearchResult> {
    const url = platform.url.replace('{}', username);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        clearTimeout(timeoutId);

        // Consider 200-399 as "found"
        const found = response.status >= 200 && response.status < 400;

        return {
            platform: platform.name,
            url,
            found,
            username,
            category: platform.category,
        };
    } catch (error) {
        // If fetch fails, assume not found
        return {
            platform: platform.name,
            url,
            found: false,
            username,
            category: platform.category,
        };
    }
}

export async function POST(request: NextRequest) {
    try {
        const { query } = await request.json();

        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
        }

        // Generate username variations
        const variations = generateVariations(query);

        // Check all platforms for all variations (in parallel)
        const allChecks: Promise<SearchResult>[] = [];

        for (const variation of variations) {
            for (const platform of platforms) {
                allChecks.push(checkUsername(platform, variation));
            }
        }

        // Wait for all checks to complete
        const results = await Promise.all(allChecks);

        // Filter to only found results and deduplicate by platform
        const foundResults = results.filter(r => r.found);
        const uniqueResults = Array.from(
            new Map(foundResults.map(r => [r.platform, r])).values()
        );

        return NextResponse.json({
            query,
            variations,
            results: uniqueResults,
            totalChecked: allChecks.length,
            totalFound: uniqueResults.length,
        });

    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: 'Search failed' },
            { status: 500 }
        );
    }
}
