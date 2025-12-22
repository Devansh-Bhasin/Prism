'use client';

import { useState } from 'react';
import { Search, Upload, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import ResultsDisplay from './components/ResultsDisplay';

export default function HomePage() {
  const [searchMode, setSearchMode] = useState<'text' | 'image'>('text');
  const [searchQuery, setSearchQuery] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('unspecified');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
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

    try {
      if (searchMode === 'text') {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: searchQuery,
            age,
            gender,
            location
          }),
        });

        const data = await response.json();
        setResults(data.results || []);
      } else {
        // TODO: Implement image search
        alert('Image search coming soon! Use text search for now.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
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
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-neon-cyan transition-all"
                  />
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
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-neon-cyan transition-all"
                  />
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-2">
                Providing more details results in higher accuracy "Bulletproof" matching.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block">
                <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center cursor-pointer hover:border-neon-cyan transition-all">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg text-gray-300 mb-2">
                    {imageFile ? imageFile.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </label>
            </div>
          )}

          {/* Search Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSearch}
            className="w-full mt-6 py-4 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-xl font-bold text-lg shadow-lg shadow-neon-cyan/30 hover:shadow-neon-cyan/50 transition-all"
          >
            Start Discovery
          </motion.button>
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
        <ResultsDisplay results={results} isLoading={isLoading} query={searchQuery} />
      </motion.div>
    </div>
  );
}
