'use client';

import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle, Loader2, Sparkles, Download, FileJson, FileText, Info } from 'lucide-react';
import { SearchResult } from '../lib/platforms';

interface ResultsDisplayProps {
    results: SearchResult[];
    isLoading: boolean;
    query: string;
    metadata?: any;
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

export default function ResultsDisplay({ results, isLoading, query, metadata }: ResultsDisplayProps) {
    const handleExportCSV = () => {
        const headers = 'Platform,Username,URL,Confidence,Category,MatchReason\n';
        const rows = results.map(r =>
            `"${r.platform}","${r.username}","${r.url}",${r.confidence},"${r.category}","${r.matchReasons.join('|')}"`
        ).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prism-osint-${query || 'search'}.csv`;
        a.click();
    };

    const handleExportJSON = () => {
        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prism-osint-${query || 'search'}.json`;
        a.click();
    };

    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-3xl p-12 text-center mt-8 relative overflow-hidden"
            >
                {/* Scanning Beam Animation */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-cyan/10 to-transparent h-20 pointer-events-none"
                    animate={{ top: ['-20%', '120%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />

                <div className="relative z-10">
                    <Loader2 className="w-16 h-16 mx-auto mb-4 text-neon-cyan animate-spin" />
                    <h3 className="text-2xl font-bold mb-2 tracking-tight">Identity Reconstruction in Progress...</h3>
                    <p className="text-gray-400 font-mono text-sm">Interrogating global databases & visual hashes</p>

                    <div className="mt-6 flex justify-center gap-2">
                        {[1, 2, 3].map(i => (
                            <motion.div
                                key={i}
                                className="w-2 h-2 rounded-full bg-neon-cyan"
                                animate={{ opacity: [0.2, 1, 0.2] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        );
    }

    if (results.length === 0 && query) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-3xl p-12 text-center mt-8 border border-red-500/20"
            >
                <div className="text-4xl mb-4">🔍❌</div>
                <h3 className="text-2xl font-bold mb-2 text-gray-300">No Deep Matches Found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    We scanned multiple platforms for "{query}" but couldn't find a high-confidence profile. Try adjusting the name or providing more metadata.
                </p>
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
            {/* Summary Header */}
            <div className="glass rounded-2xl p-6 border border-neon-cyan/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/20 rounded-xl">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">
                                Intelligence Report
                            </h2>
                            <p className="text-gray-400 font-mono text-sm tracking-widest uppercase">
                                Findings Found: {results.length} Identity Fragments
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 hover:border-neon-cyan/50 transition-all text-gray-300"
                        >
                            <FileText className="w-4 h-4" /> CSV
                        </button>
                        <button
                            onClick={handleExportJSON}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 hover:border-neon-purple/50 transition-all text-gray-300"
                        >
                            <FileJson className="w-4 h-4" /> JSON
                        </button>
                    </div>
                </div>
            </div>

            {/* Metadata Section */}
            {metadata && (Object.keys(metadata).length > 0) && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass rounded-2xl p-6 border border-neon-purple/30 bg-neon-purple/5"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Loader2 className="w-5 h-5 text-neon-purple" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Image Metadata (EXIF)</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {metadata.make && (
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-mono">Device Make</p>
                                <p className="text-sm text-gray-200">{metadata.make}</p>
                            </div>
                        )}
                        {metadata.model && (
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-mono">Camera Model</p>
                                <p className="text-sm text-gray-200">{metadata.model}</p>
                            </div>
                        )}
                        {metadata.dateTime && (
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-mono">Captured At</p>
                                <p className="text-sm text-gray-200">{new Date(metadata.dateTime * 1000).toLocaleString()}</p>
                            </div>
                        )}
                        {metadata.software && (
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-mono">Software</p>
                                <p className="text-sm text-gray-200">{metadata.software}</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Platform Trust Warning */}
            <div className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-xl p-4 flex gap-3 items-start">
                <Info className="w-5 h-5 text-neon-cyan shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400 leading-relaxed">
                    Confidence scores are calculated using <span className="text-neon-cyan font-bold">Heuristic Behavioral Analysis</span>. A score above 80% indicates a high-probability link, but results should always be verified manually before inclusion in legal or security documentation.
                </p>
            </div>


            {/* Primary High-Confidence Matches */}
            {results.filter(r => ['Instagram', 'Facebook', 'LinkedIn'].includes(r.platform) && r.confidence > 60).length > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-1 rounded-2xl bg-gradient-to-r from-neon-cyan/20 via-primary/20 to-neon-cyan/20 border border-neon-cyan/30"
                >
                    <div className="glass bg-black/60 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-neon-cyan animate-pulse" />
                            <h3 className="text-xl font-bold text-white tracking-tight uppercase">Primary Intelligence Nodes</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {results.filter(r => ['Instagram', 'Facebook', 'LinkedIn'].includes(r.platform) && r.confidence > 60).map((result, idx) => (
                                <ProfileCard key={`primary-${idx}`} result={result} category="social" idx={idx} />
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

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
                            <ProfileCard key={`${result.platform}-${idx}`} result={result} category={category} idx={idx} />
                        ))}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}

function ProfileCard({ result, category, idx = 0 }: { result: SearchResult, category: string, idx?: number }) {
    return (
        <motion.a
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
                            {result.confidence > 90 && (
                                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            )}
                        </div>
                        <p className="text-xs text-gray-500 font-mono mb-2">@{result.username}</p>
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-tighter ${result.confidence > 80 ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                result.confidence > 50 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                    'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                {result.confidence}% Match
                            </span>
                            {result.matchReasons.some(r => r.toLowerCase().includes('visual')) && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-tighter bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                                    Visual
                                </span>
                            )}
                        </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-neon-cyan transition-colors flex-shrink-0" />
                </div>

                {result.scrapedBio && (
                    <div className="bg-black/40 rounded-lg p-3 mb-3 border border-white/5">
                        <p className="text-[11px] text-gray-300 italic line-clamp-4 leading-relaxed">
                            &quot;{result.scrapedBio}&quot;
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

            <div className={`h-1.5 rounded-full bg-gradient-to-r ${categoryColors[category] || categoryColors.other} opacity-40 group-hover:opacity-100 transition-opacity mt-auto`}
                style={{ width: `${result.confidence}%` }} />
        </motion.a>
    );
}
