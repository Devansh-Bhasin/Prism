import { NextRequest, NextResponse } from 'next/server';
import { SearchResult } from '@/app/lib/platforms';
// @ts-ignore
import * as ExifParser from 'exif-parser';

export const runtime = 'nodejs';

/**
 * Image Search API: Simulates facial recognition OSINT discovery
 */
export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
        }

        const formData = await request.formData();
        const image = formData.get('image');
        const minAge = formData.get('minAge') as string;
        const maxAge = formData.get('maxAge') as string;
        const gender = formData.get('gender') as string;
        const location = formData.get('location') as string;

        if (!image || !(image instanceof Blob)) {
            return NextResponse.json({ error: 'Image file required' }, { status: 400 });
        }

        // --- Metadata Extraction (EXIF) ---
        let metadata: any = {};
        try {
            const buffer = await image.arrayBuffer();
            const parser = ExifParser.create(buffer);
            const exifData = parser.parse();
            metadata = {
                make: exifData.tags.Make,
                model: exifData.tags.Model,
                software: exifData.tags.Software,
                dateTime: exifData.tags.DateTimeOriginal,
                gps: exifData.tags.GPSLatitude ? {
                    lat: exifData.tags.GPSLatitude,
                    lon: exifData.tags.GPSLongitude
                } : null
            };
        } catch (e) {
            console.warn('Metadata extraction failed (likely no EXIF data)');
        }

        // Simulate "Deep Identity Reconstruction" delay
        await new Promise(resolve => setTimeout(resolve, 3500));

        // Mock Discovery Logic: In a real app, this would use a facial recognition API
        // or reverse image search engine. Here we provide high-tech simulated results.

        // Targeting only requested platforms: Instagram, Facebook, Twitter, YouTube
        const results: SearchResult[] = [
            {
                platform: 'Instagram',
                url: `https://www.instagram.com/reconstruct_${Math.floor(Math.random() * 1000)}/`,
                found: true,
                username: `identity_match_${minAge || '24'}`,
                category: 'social',
                confidence: 94,
                matchReasons: ['Visual Hash Alignment', 'Spatial Consistency', 'Primary Node'],
                scrapedBio: `Visual match confirmed on Instagram. Profile characteristics align with estimated age range (${minAge}-${maxAge}). Location: ${location || 'Verified'}.`,
                profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
            },
            {
                platform: 'Twitter/X',
                url: 'https://twitter.com/identity_verified',
                found: true,
                username: 'verified_handle',
                category: 'social',
                confidence: 82,
                matchReasons: ['Facial Landmark Sync', 'Handle Association'],
                scrapedBio: `Linked Twitter account discovered via visual reconstruction. Associated with digital footprint in ${location || 'Global'}.`,
                profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop'
            },
            {
                platform: 'YouTube',
                url: 'https://www.youtube.com/@reconstructed_identity',
                found: true,
                username: 'content_creator_v5',
                category: 'creative',
                confidence: 79,
                matchReasons: ['Video Frame Correspondence', 'Metadata Overlap'],
                scrapedBio: 'Visual markers identified in public video archives. Identity linked to multimedia content.',
                profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
            },
            {
                platform: 'Facebook',
                url: 'https://www.facebook.com/public/reconstruction',
                found: true,
                username: 'connected_profile',
                category: 'social',
                confidence: 76,
                matchReasons: ['Social Graph Affinity'],
                scrapedBio: 'Archived profile fragments matching visual parameters. Associated with local community data.',
                profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop'
            }
        ];

        // If metadata found, inject it into results summary
        if (metadata.dateTime || metadata.model) {
            results.forEach(r => {
                if (r.confidence > 80) {
                    r.matchReasons.push(`EXIF Data: ${metadata.model || 'Device'} match`);
                }
            });
        }

        return NextResponse.json({
            status: 'success',
            results: results,
            metadata: metadata,
            message: 'Visual reconstruction complete and metadata extracted'
        });

    } catch (error) {
        console.error('Image Search Failure:', error);
        return NextResponse.json({ error: 'Visual reconstruction engine failed' }, { status: 500 });
    }
}
