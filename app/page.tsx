'use client';

import { useState } from 'react';
import { Search, Upload, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import ResultsDisplay from './components/ResultsDisplay';
import { SearchResult } from './lib/platforms';

export default function HomePage() {
  const [searchMode, setSearchMode] = useState<'text' | 'image'>('text');
  const [searchQuery, setSearchQuery] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [gender, setGender] = useState('unspecified');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [extractedMetadata, setExtractedMetadata] = useState<any>(null);
  const [searchStatus, setSearchStatus] = useState('');
  const [searchProgress, setSearchProgress] = useState(0);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Instagram', 'Facebook', 'Twitter/X', 'YouTube']);

  const allPlatforms = ['Instagram', 'Facebook', 'Twitter/X', 'YouTube', 'LinkedIn', 'TikTok', 'GitHub', 'Reddit'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = async () => {
    if (searchMode === 'text' && !searchQuery.trim()) {
      return;
    }
    if (searchMode === 'image' && !imageFile) {
      return;
    }

    setIsLoading(true);
    setResults([]);
    setExtractedMetadata(null);
    setSearchProgress(10);
    setSearchStatus('Initializing discovery engines...');

    try {
      if (searchMode === 'text') {
        setSearchStatus('Connecting to distributed nodes...');
        setSearchProgress(30);

        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: searchQuery,
            minAge,
            maxAge,
            gender,
            location,
            platforms: selectedPlatforms
          }),
        });

        setSearchStatus('Scanning platform clusters...');
        setSearchProgress(60);

        const data = await response.json();
        setSearchStatus('Aggregating identity fragments...');
        setSearchProgress(90);
        setResults(data.results || []);
      } else {
        // Image Search Implementation
        if (!imageFile) return;

        // Using form data for binary file upload
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('minAge', minAge);
        formData.append('maxAge', maxAge);
        formData.append('gender', gender);
        formData.append('location', location);

        setSearchStatus('Performing visual reconstruction...');
        setSearchProgress(40);

        const response = await fetch('/api/image-search', {
          method: 'POST',
          body: formData,
        });

        setSearchStatus('Syncing with reverse-image databases...');
        setSearchProgress(75);

        const data = await response.json();
        setSearchStatus('Finalizing matches...');
        setSearchProgress(95);
        setResults(data.results || []);
        if (data.metadata) setExtractedMetadata(data.metadata);
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
      setSearchProgress(100);
      setSearchStatus('Complete');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-4xl"
      >
        {/* Logo & Title */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <Sparkles className="w-12 h-12 text-neon-cyan" />
            <h1 className="text-7xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
              Prism
            </h1>
          </motion.div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Discover digital footprints across the web. Find social media profiles using names or faces.
          </p>
        </div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass rounded-3xl p-8 shadow-2xl"
        >
          {/* Mode Switcher */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setSearchMode('text')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${searchMode === 'text'
                ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-lg shadow-neon-cyan/50'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
            >
              <Search className="w-5 h-5 inline mr-2" />
              Text Search
            </button>
            <button
              onClick={() => setSearchMode('image')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${searchMode === 'image'
                ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-lg shadow-neon-purple/50'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
            >
              <Upload className="w-5 h-5 inline mr-2" />
              Image Search
            </button>
          </div>

          {/* Search Input */}
          {searchMode === 'text' ? (
            <div className="space-y-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Full Name or Username..."
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-lg focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/50 transition-all mb-4"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 col-span-1 md:col-span-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Age Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={minAge}
                      onChange={(e) => setMinAge(e.target.value)}
                      placeholder="Min"
                      title="Narrow search based on estimated age markers found in profile bios."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-neon-cyan transition-all"
                    />
                    <input
                      type="number"
                      value={maxAge}
                      onChange={(e) => setMaxAge(e.target.value)}
                      placeholder="Max"
                      title="Narrow search based on estimated age markers found in profile bios."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-neon-cyan transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-neon-cyan transition-all appearance-none text-gray-300"
                  >
                    <option value="unspecified">Unspecified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. London, UK"
                    title="Matches location keywords mentioned in public profile metadata."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-neon-cyan transition-all"
                  />
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-2">
                Providing more details results in higher accuracy &quot;Bulletproof&quot; matching.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block group">
                <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all h-64 flex flex-col items-center justify-center relative overflow-hidden ${imagePreview ? 'border-neon-cyan/50 bg-neon-cyan/5' : 'border-white/20 hover:border-neon-cyan bg-white/5'
                  }`}>
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm" />
                      <div className="relative z-10">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full border-2 border-neon-cyan overflow-hidden shadow-lg shadow-neon-cyan/20">
                          <img src={imagePreview} alt="Face Preview" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-lg font-bold text-white mb-1">Face Profile Ready</p>
                        <p className="text-sm text-neon-cyan group-hover:underline">Click to change identity</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400 group-hover:text-neon-cyan transition-colors" />
                      <p className="text-lg text-gray-300 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500 font-mono">PNG, JPG (MAX 10MB)</p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </label>

              {/* Metadata for Image Search */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Age Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={minAge}
                      onChange={(e) => setMinAge(e.target.value)}
                      placeholder="Min"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-neon-cyan transition-all"
                    />
                    <input
                      type="number"
                      value={maxAge}
                      onChange={(e) => setMaxAge(e.target.value)}
                      placeholder="Max"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-neon-cyan transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-neon-cyan transition-all appearance-none text-gray-300"
                  >
                    <option value="unspecified">Unspecified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Home Base</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. London, UK"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-neon-cyan transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Search Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSearch}
            disabled={isLoading}
            className={`w-full mt-6 py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${isLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-neon-cyan to-neon-purple shadow-neon-cyan/30 hover:shadow-neon-cyan/50'
              }`}
          >
            {isLoading ? 'Searching...' : 'Start Discovery'}
          </motion.button>

          {/* Progress Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-mono text-neon-cyan">{searchStatus}</span>
                <span className="text-sm font-mono text-gray-400">{searchProgress}%</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-neon-cyan to-neon-purple h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${searchProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Platform Selection */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 glass rounded-2xl"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">[ TARGET_PLATFORMS ]</h3>
            <button
              onClick={() => setSelectedPlatforms(allPlatforms)}
              className="text-xs text-neon-cyan hover:underline"
            >
              Select All
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {allPlatforms.map(platform => (
              <button
                key={platform}
                onClick={() => setSelectedPlatforms(prev =>
                  prev.includes(platform)
                    ? prev.filter(p => p !== platform)
                    : [...prev, platform]
                )}
                className={`py-2 px-3 rounded-lg border text-sm transition-all text-center ${selectedPlatforms.includes(platform)
                  ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan'
                  : 'border-white/10 bg-white/5 text-gray-500 hover:border-white/30'
                  }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {[
            { title: '50+ Platforms', desc: 'Search across major social networks' },
            { title: 'Smart Matching', desc: 'AI-powered username variations' },
            { title: 'Instant Results', desc: 'Real-time profile discovery' },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
              className="glass rounded-xl p-4 text-center"
            >
              <h3 className="font-bold text-neon-cyan mb-1">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Results */}
        <ResultsDisplay results={results} isLoading={isLoading} query={searchQuery} metadata={extractedMetadata} />

        {/* Legal & Ethical Disclaimer */}
        <footer className="mt-20 pt-8 border-t border-white/5 text-center px-4">
          <div className="flex justify-center gap-6 mb-4 text-xs font-mono text-gray-500 uppercase tracking-widest">
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Ethical Use Compliant</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Public Data Only</span>
          </div>
          <p className="text-xs text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Prism is an AI-powered OSINT discovery tool designed for ethical research and verification. We only access publicly available information and adhere to platform-specific privacy policies. Users are responsible for ensuring their use cases comply with local laws and ethical standards.
          </p>
        </footer>
      </motion.div>
    </div>
  );
}
