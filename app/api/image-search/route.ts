import { NextRequest, NextResponse } from 'next/server';
import { SearchResult } from '@/app/lib/platforms';

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
        const age = formData.get('age') as string;
        const gender = formData.get('gender') as string;
        const location = formData.get('location') as string;

        if (!image) {
            return NextResponse.json({ error: 'Image file required' }, { status: 400 });
        }

        // Simulate "Deep Identity Reconstruction" delay
        await new Promise(resolve => setTimeout(resolve, 3500));

        // Mock Discovery Logic: In a real app, this would use a facial recognition API
        // or reverse image search engine. Here we provide high-tech simulated results.

        const results: SearchResult[] = [
            {
                platform: 'Instagram',
                url: `https://www.instagram.com/reconstruct_${Math.floor(Math.random() * 1000)}/`,
                found: true,
                username: `identity_match_${age || '25'}`,
                category: 'social',
                confidence: 94,
                matchReasons: ['Visual Hash Alignment', 'Spatial Consistency'],
                scrapedBio: `Matched via visual reconstruction. Affinity detected in ${location || 'Global Repository'}.`,
                profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
            },
            {
                platform: 'LinkedIn',
                url: `https://www.linkedin.com/search/results/all/?keywords=${location || 'Professional'}`,
                found: true,
                username: 'verified_pro',
                category: 'professional',
                confidence: 82,
                matchReasons: ['Contextual Metadata Match', 'Location Proximity'],
                scrapedBio: `Professional candidate matching visual parameters in ${location || 'unspecified region'}.`,
                profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop'
            },
            {
                platform: 'Twitter/X',
                url: 'https://twitter.com/search?q=osint',
                found: true,
                username: 'shadow_profile',
                category: 'social',
                confidence: 65,
                matchReasons: ['Low-Resolution Affinity'],
                scrapedBio: 'Identity fragments detected in 2024 breach data dumps.',
            }
        ];

        return NextResponse.json({
            status: 'success',
            results: results,
            message: 'Visual reconstruction complete'
        });

    } catch (error) {
        console.error('Image Search Failure:', error);
        return NextResponse.json({ error: 'Visual reconstruction engine failed' }, { status: 500 });
    }
}
