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
        const minAge = formData.get('minAge') as string;
        const maxAge = formData.get('maxAge') as string;
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
                username: `identity_match_${minAge || '24'}`,
                category: 'social',
                confidence: 94,
                matchReasons: ['Visual Hash Alignment', 'Spatial Consistency', 'Primary Node'],
                scrapedBio: `Visual match confirmed. Profile characteristics align with estimated age range (${minAge}-${maxAge}). Location: ${location || 'Verified'}.`,
                profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
            },
            {
                platform: 'LinkedIn',
                url: `https://www.linkedin.com/search/results/all/?keywords=${location || 'Professional'}`,
                found: true,
                username: 'verified_industry_pro',
                category: 'professional',
                confidence: 88,
                matchReasons: ['Contextual Metadata Match', 'Location Proximity', 'Facial Landmark Sync'],
                scrapedBio: `Matching professional identity found in ${location || 'Target Region'}. Higher education and career markers detected.`,
                profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop'
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
                profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
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
