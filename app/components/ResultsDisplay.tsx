'use client';

import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle, Loader2 } from 'lucide-react';

interface SearchResult {
    platform: string;
    url: string;
    found: boolean;
    username: string;
    category: string;
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
                <h3 className="text-2xl font-bold mb-2">Scanning the web...</h3>
                <p className="text-gray-400">Checking 50+ platforms for "{query}"</p>
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
                            Found {results.length} Profile{results.length !== 1 ? 's' : ''}
                        </h2>
                        <p className="text-gray-400">Results for "{query}"</p>
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
                        <span className="text-sm text-gray-500">({categoryResults.length})</span>
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
                                className="glass rounded-xl p-5 group cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg mb-1 group-hover:text-neon-cyan transition-colors">
                                            {result.platform}
                                        </h4>
                                        <p className="text-sm text-gray-400 font-mono">@{result.username}</p>
                                    </div>
                                    <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-neon-cyan transition-colors" />
                                </div>

                                <div className={`h-1 rounded-full bg-gradient-to-r ${categoryColors[category]} opacity-50 group-hover:opacity-100 transition-opacity`} />
                            </motion.a>
                        ))}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
