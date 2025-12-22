'use client';

import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle, Loader2 } from 'lucide-react';

interface SearchResult {
    platform: string;
    url: string;
    found: boolean;
    username: string;
    category: string;
    confidence: number;
    matchReasons: string[];
    scrapedBio: string;
    profileImage?: string;
}

interface ResultsDisplayProps {
    results: SearchResult[];
    isLoading: boolean;
    query: string;
}

const categoryColors: Record<string, string> = {
    social: 'from-pink-500 to-rose-500',
    professional: 'from-blue-500 to-cyan-500',
    gaming: 'from-purple-500 to-violet-500',
    creative: 'from-orange-500 to-amber-500',
    other: 'from-gray-500 to-slate-500',
};

const categoryIcons: Record<string, string> = {
    social: '👥',
    professional: '💼',
    gaming: '🎮',
    creative: '🎨',
    other: '🔗',
};

export default function ResultsDisplay({ results, isLoading, query }: ResultsDisplayProps) {
    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-3xl p-12 text-center"
            >
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-neon-cyan animate-spin" />
                <h3 className="text-2xl font-bold mb-2">Engaging Deep Scraper...</h3>
                <p className="text-gray-400">Interrogating metadata for "{query}"</p>
            </motion.div>
        );
    }

    if (results.length === 0) {
        return null;
    }

    // Group by category
    const grouped = results.reduce((acc, result) => {
        if (!acc[result.category]) {
            acc[result.category] = [];
        }
        acc[result.category].push(result);
        return acc;
    }, {} as Record<string, SearchResult[]>);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
        >
            {/* Summary */}
            <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">
                            Bulletproof Findings ({results.length})
                        </h2>
                        <p className="text-gray-400">Verified identity fragments for "{query}"</p>
                    </div>
                    <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
            </div>

            {/* Results by Category */}
            {Object.entries(grouped).map(([category, categoryResults]) => (
                <motion.div
                    key={category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{categoryIcons[category]}</span>
                        <h3 className="text-xl font-bold capitalize">{category}</h3>
                        <span className="text-sm text-gray-500">({categoryResults.length} matches)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryResults.map((result, idx) => (
                            <motion.a
                                key={`${result.platform}-${idx}`}
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                className="glass rounded-xl p-5 group cursor-pointer flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start gap-4 mb-3">
                                        {result.profileImage && (
                                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-neon-cyan/30 flex-shrink-0">
                                                <img
                                                    src={result.profileImage}
                                                    alt={result.platform}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-lg group-hover:text-neon-cyan transition-colors line-clamp-1">
                                                    {result.platform}
                                                </h4>
                                            </div>
                                            <p className="text-xs text-gray-500 font-mono mb-2">@{result.username}</p>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase whitespace-nowrap ${result.confidence > 80 ? 'bg-green-500/20 text-green-400' :
                                                    result.confidence > 50 ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-red-500/20 text-red-400'
                                                }`}>
                                                {result.confidence}% Confirmed
                                            </span>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-neon-cyan transition-colors flex-shrink-0" />
                                    </div>

                                    {result.scrapedBio && (
                                        <div className="bg-black/40 rounded-lg p-3 mb-3 border border-white/5">
                                            <p className="text-[11px] text-gray-300 italic line-clamp-4 leading-relaxed">
                                                "{result.scrapedBio}"
                                            </p>
                                        </div>
                                    )}

                                    {result.matchReasons.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {result.matchReasons.map((reason, rIdx) => (
                                                <span key={rIdx} className="text-[8px] bg-neon-cyan/10 border border-neon-cyan/20 rounded-md px-1.5 py-0.5 text-neon-cyan/80 font-bold tracking-tight">
                                                    {reason}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className={`h-1.5 rounded-full bg-gradient-to-r ${categoryColors[category]} opacity-40 group-hover:opacity-100 transition-opacity mt-auto`}
                                    style={{ width: `${result.confidence}%` }} />
                            </motion.a>
                        ))}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
