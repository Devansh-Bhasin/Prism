import { NextRequest, NextResponse } from 'next/server';
import { SearchResult } from '@/app/lib/platforms';
// @ts-ignore
import * as ExifParser from 'exif-parser';

export const runtime = 'nodejs';

/**
 * Image Intelligence API: Professional OSINT Visual Discovery
 * Strictly separates forensic metadata from visual similarity matches.
 */
export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
        }

        const formData = await request.formData();
        const image = formData.get('image');
        if (!image || !(image instanceof Blob)) {
            return NextResponse.json({ error: 'Image file required' }, { status: 400 });
        }

        // --- PHASE 1: Forensic Metadata Extraction (EXIF) ---
        let forensicData: any = null;
        try {
            const buffer = await image.arrayBuffer();
            const parser = ExifParser.create(buffer);
            const exifData = parser.parse();

            if (exifData.tags && Object.keys(exifData.tags).length > 0) {
                forensicData = {
                    device: {
                        make: exifData.tags.Make,
                        model: exifData.tags.Model,
                        software: exifData.tags.Software
                    },
                    timestamp: exifData.tags.DateTimeOriginal,
                    dimensions: {
                        width: exifData.imageSize?.width,
                        height: exifData.imageSize?.height
                    },
                    location: exifData.tags.GPSLatitude ? {
                        lat: exifData.tags.GPSLatitude,
                        lon: exifData.tags.GPSLongitude
                    } : null
                };
            }
        } catch (e) {
            console.warn('Metadata extraction failed (likely stripped or unsupported format)');
        }

        const verifiedMatches: SearchResult[] = [];
        const visualMatches: SearchResult[] = [];

        // --- PHASE 2: Visual Intelligence (Google Lens via SerpApi) ---
        const apiKey = process.env.SERPAPI_API_KEY;

        if (apiKey) {
            try {
                const buffer = await image.arrayBuffer();
                const lensUrl = 'https://serpapi.com/search.json';

                // Construct SerpApi Form Data
                const lensFormData = new FormData();
                lensFormData.append('engine', 'google_lens');
                lensFormData.append('api_key', apiKey);
                lensFormData.append('file', new Blob([buffer], { type: image.type }));

                const lensResponse = await fetch(lensUrl, {
                    method: 'POST',
                    body: lensFormData
                });

                const lensData = await lensResponse.json();

                if (lensData.visual_matches) {
                    lensData.visual_matches.forEach((match: any) => {
                        const sourceUrl = new URL(match.link);
                        const platformName = sourceUrl.hostname.replace('www.', '').split('.')[0];

                        // Categorize Visual Matches
                        visualMatches.push({
                            platform: platformName.charAt(0).toUpperCase() + platformName.slice(1),
                            url: match.link,
                            found: true,
                            username: match.source || 'Visual Source Found',
                            category: 'visual-match',
                            confidence: 85, // Direct visual similarity is high confidence in perception
                            matchReasons: ['Visual Signature Alignment', 'Google Lens Verified Source'],
                            scrapedBio: match.title || 'Visually similar media detected in the wild.',
                            profileImage: match.thumbnail
                        });
                    });
                }
            } catch (e) {
                console.error('Visual discovery phase failed:', e);
            }
        }

        // --- PHASE 3: Correlation & Finalization ---
        // If EXIF GPS matches visual source metadata (if any were available to cross-reference)
        // Here we could perform deeper correlation if we had a persistent identity database

        return NextResponse.json({
            status: 'success',
            forensicReport: forensicData,
            results: {
                verified: verifiedMatches, // Strictly verified identity (Handle match + EXIF match)
                visual: visualMatches.slice(0, 20) // Ranked visual similarities
            },
            verificationLevel: verifiedMatches.length > 0 ? 'Verified' : (visualMatches.length > 0 ? 'Probable' : 'Inconclusive'),
            message: apiKey ? 'Visual Intelligence analysis complete' : 'Analysis limited: Forensic extraction only'
        });

    } catch (error) {
        return NextResponse.json({ error: 'Image intelligence engine failure' }, { status: 500 });
    }
}
