'use client';

import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle, Loader2, Sparkles, Download, FileJson, FileText, Info, Fingerprint, Camera, MapPin, Search } from 'lucide-react';
import { SearchResult } from '../lib/platforms';

interface TieredResults {
    verified: SearchResult[];
    visual?: SearchResult[];
    probable?: SearchResult[];
}

interface ResultsDisplayProps {
    results: SearchResult[] | TieredResults;
    isLoading: boolean;
    query: string;
    forensicReport?: any;
    verificationLevel?: string;
}

const statusColors: Record<string, string> = {
    Verified: 'text-green-400 bg-green-500/10 border-green-500/20',
    Probable: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    Inconclusive: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
};

export default function ResultsDisplay({ results, isLoading, query, forensicReport, verificationLevel }: ResultsDisplayProps) {
    const isTiered = !Array.isArray(results);
    const tiered = isTiered ? results as TieredResults : null;
    const flat = !isTiered ? results as SearchResult[] : null;

    // Normalize data for exports and general count
    const allResultsRaw: SearchResult[] = tiered
        ? [...(tiered.verified || []), ...(tiered.visual || []), ...(tiered.probable || [])]
        : (flat || []);

    const handleExportCSV = () => {
        const headers = 'Platform,Username,URL,Confidence,Category,MatchReason\n';
        const rows = allResultsRaw.map(r =>
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
        const blob = new Blob([JSON.stringify({ forensicReport, results, verificationLevel }, null, 2)], { type: 'application/json' });
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
                <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-cyan/10 to-transparent h-20 pointer-events-none"
                    animate={{ top: ['-20%', '120%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
                <div className="relative z-10">
                    <Loader2 className="w-16 h-16 mx-auto mb-4 text-neon-cyan animate-spin" />
                    <h3 className="text-2xl font-bold mb-2 tracking-tight uppercase">Executing Multi-Vector Analysis...</h3>
                    <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">v3.0 Probing & Forensic Correlation Active</p>
                </div>
            </motion.div>
        );
    }

    if (allResultsRaw.length === 0 && query) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-3xl p-12 text-center mt-8 border border-red-500/20"
            >
                <Fingerprint className="w-12 h-12 text-red-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-2xl font-bold mb-2 text-gray-300 uppercase">Search Inconclusive</h3>
                <p className="text-gray-500 max-w-sm mx-auto text-sm italic">
                    No verified identity nodes were recovered for "{query}" across targeted platform probes.
                </p>
            </motion.div>
        );
    }

    if (allResultsRaw.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
        >
            {/* Professional OSINT Header */}
            <div className="glass rounded-2xl p-6 border border-white/10 bg-black/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl border ${verificationLevel ? statusColors[verificationLevel] : 'border-neon-cyan/20'}`}>
                            <Fingerprint className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold tracking-tight uppercase">Intelligence Report</h2>
                                {verificationLevel && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-black border uppercase tracking-widest ${statusColors[verificationLevel]}`}>
                                        {verificationLevel === 'Contextual' ? 'Contextual Findings' : verificationLevel}
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest mt-1">
                                Generated for: {query || 'Visual Inquiry'} | Probed Nodes: {allResultsRaw.length}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={handleExportCSV} className="btn-osint text-xs px-3 py-1.5 flex items-center gap-2">
                            <Download className="w-3 h-3" /> CSV REPORT
                        </button>
                        <button onClick={handleExportJSON} className="btn-osint text-xs px-3 py-1.5 flex items-center gap-2">
                            <FileJson className="w-3 h-3" /> JSON DATA
                        </button>
                    </div>
                </div>
            </div>

            {/* Forensic Detail Section */}
            {forensicReport && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6 border border-neon-purple/30 bg-neon-purple/5">
                    <div className="flex items-center gap-2 mb-4">
                        <Camera className="w-4 h-4 text-neon-purple" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Image Forensic Evidence</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {forensicReport.device && (
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-mono mb-1">Acquisition Device</p>
                                <p className="text-xs text-gray-200 font-bold">{forensicReport.device.make} {forensicReport.device.model}</p>
                            </div>
                        )}
                        {forensicReport.timestamp && (
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-mono mb-1">Time of Capture</p>
                                <p className="text-xs text-gray-200 font-bold">{new Date(forensicReport.timestamp * 1000).toLocaleString()}</p>
                            </div>
                        )}
                        {forensicReport.location && (
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-mono mb-1">GPS Anchor</p>
                                <p className="text-xs text-neon-cyan font-bold flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {forensicReport.location.lat.toFixed(4)}, {forensicReport.location.lon.toFixed(4)}
                                </p>
                            </div>
                        )}
                        {forensicReport.dimensions && (
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-mono mb-1">Resolution Specs</p>
                                <p className="text-xs text-gray-200 font-bold">{forensicReport.dimensions.width} x {forensicReport.dimensions.height}px</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* TIER 1: VERIFIED MATCHES */}
            {tiered && tiered.verified && tiered.verified.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-green-500/20 pb-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-green-500">Verified Identity Nodes</h3>
                        <span className="text-[10px] text-gray-500 ml-auto font-mono uppercase">Strong Correlation Anchor</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tiered.verified.map((r, i) => <ProfileCard key={i} result={r} tier="verified" />)}
                    </div>
                </div>
            )}

            {/* TIER 2: PROBABLE / RELEVANT */}
            {(!isTiered || (tiered && tiered.probable && tiered.probable.length > 0)) && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                        <Search className="w-4 h-4 text-neon-cyan" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300">
                            {tiered ? 'Identity Correlation Matches' : 'Discovery Results'}
                        </h3>
                        <span className="text-[10px] text-gray-500 ml-auto font-mono uppercase">Contextual Alignment Detected</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(tiered ? tiered.probable || [] : flat || []).map((r, i) => <ProfileCard key={i} result={r} tier="probable" />)}
                    </div>
                </div>
            )}

            {/* TIER 3: VISUAL MATCHES */}
            {tiered && tiered.visual && tiered.visual.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                        <Sparkles className="w-4 h-4 text-neon-purple" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Contextual Visual Evidence</h3>
                        <span className="text-[10px] text-red-500/70 ml-auto font-mono uppercase italic">No Identity Match Claimed</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70 hover:opacity-100 transition-opacity">
                        {tiered.visual.map((r, i) => <ProfileCard key={i} result={r} tier="visual" />)}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function ProfileCard({ result, tier }: { result: SearchResult, tier: 'verified' | 'probable' | 'visual' }) {
    const tierConfig = {
        verified: 'border-green-500/30 bg-green-500/5',
        probable: 'border-white/10 bg-white/5',
        visual: 'border-white/5 bg-black/20',
    };

    return (
        <motion.a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -4, scale: 1.02 }}
            className={`glass rounded-xl p-4 flex flex-col gap-3 border ${tierConfig[tier]} group transition-all relative overflow-hidden`}
        >
            <div className="flex items-start gap-3 relative z-10">
                {result.profileImage ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0">
                        <img src={result.profileImage} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                    </div>
                ) : (
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                        <Fingerprint className="w-6 h-6 text-gray-600" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-bold text-xs truncate uppercase tracking-tight text-white group-hover:text-neon-cyan">
                            {result.platform}
                        </h4>
                        <ExternalLink className="w-3 h-3 text-gray-600 group-hover:text-neon-cyan" />
                    </div>
                    <p className="text-[10px] font-mono text-gray-500 truncate mb-1">@{result.username}</p>

                    {tier !== 'visual' && (
                        <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black border uppercase ${result.confidence > 85 ? 'text-green-400 border-green-500/20 bg-green-500/5' : 'text-neon-cyan border-neon-cyan/20 bg-neon-cyan/5'
                                }`}>
                                {result.confidence}% Confidence
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {result.scrapedBio && (
                <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed italic relative z-10">
                    &quot;{result.scrapedBio}&quot;
                </p>
            )}

            <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-white/5 relative z-10">
                {result.matchReasons.slice(0, 3).map((reason, i) => (
                    <span key={i} className="text-[7px] font-bold uppercase tracking-tighter bg-white/5 px-1.5 py-0.5 rounded text-gray-500 border border-white/5">
                        {reason}
                    </span>
                ))}
            </div>
        </motion.a>
    );
}
