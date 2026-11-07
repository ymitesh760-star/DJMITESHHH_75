import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Grid, 
  List, 
  Play, 
  Shuffle, 
  Heart, 
  Music2, 
  ArrowUpDown,
  Upload,
  Sparkles,
  Sliders,
  History,
  X
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { TrackCard } from './TrackCard';
import { STUDIO_BRANDING, DEFAULT_COVER_ART } from '../constants/branding';

interface MusicLibraryProps {
  onOpenAdmin: () => void;
}

export const MusicLibrary: React.FC<MusicLibraryProps> = ({ onOpenAdmin }) => {
  const { tracks, playAll, isAdmin, queue } = useMusic();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'plays' | 'bpm' | 'title'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Extract distinct genres from actual uploaded and published tracks
  const defaultGenres = ['All', 'Tech House', 'Latin Drill', 'Mashup', 'Bollywood Edit', 'Club Mix', 'EDM'];
  
  const genres = useMemo(() => {
    const list = new Set<string>(defaultGenres);
    tracks.forEach(t => {
      if (t.genre) list.add(t.genre);
    });
    return Array.from(list);
  }, [tracks]);

  // Filter and sort tracks (only showing real uploaded and published tracks)
  const filteredTracks = useMemo(() => {
    return tracks
      .filter((t) => {
        // Enforce published flag unless admin
        if (!isAdmin && !t.published) return false;

        const matchesSearch = 
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.remixTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.originalArtist.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesGenre = selectedGenre === 'All' || t.genre.toLowerCase() === selectedGenre.toLowerCase();
        const matchesFav = !onlyFavorites || t.isFavorite;

        return matchesSearch && matchesGenre && matchesFav;
      })
      .sort((a, b) => {
        if (sortBy === 'plays') return (b.plays || 0) - (a.plays || 0);
        if (sortBy === 'bpm') return b.bpm - a.bpm;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [tracks, searchQuery, selectedGenre, onlyFavorites, sortBy, isAdmin]);

  return (
    <section id="music-library" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24 select-none">
      {/* Anchor alias */}
      <div id="music-archive" className="sr-only" />

      {/* SECTION HEADER: OBSIDIAN FREQUENCY EDITORIAL */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-[#DCE1EA]/15 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 text-xs font-mono text-[#7957FF] font-bold uppercase tracking-[0.25em]">
            <span className="w-2 h-2 rounded-full bg-[#64DFFF] animate-pulse shadow-[0_0_8px_#64DFFF]" />
            <span>DISCOGRAPHY // INDEPENDENT ARCHIVE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black font-display tracking-tight text-white uppercase">
            <span className="text-silver-glow">THE MUSIC</span>{' '}
            <span className="text-violet-cyan">ARCHIVE</span>
          </h2>
          <p className="text-sm sm:text-base text-[#A5ADBD] font-sans max-w-xl">
            Curated independent remixes, festival edits, and uncompressed 24-bit WAV masters direct from the studio.
          </p>
        </div>

        {/* Global Play / Shuffle Buttons */}
        {filteredTracks.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => playAll(false)}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#7957FF] to-[#64DFFF] hover:from-[#8E70FF] hover:to-[#8CE7FF] text-white font-display font-bold text-xs tracking-wider uppercase shadow-[0_10px_30px_rgba(121,87,255,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>PLAY ALL</span>
            </button>

            <button
              onClick={() => playAll(true)}
              className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-[#11131B] hover:bg-[#181B26] border border-white/10 text-white font-display font-bold text-xs tracking-wider uppercase transition-all shadow-md hover:border-[#7957FF]/40 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5 text-[#B8A8FF]" />
              <span className="hidden sm:inline">SHUFFLE</span>
            </button>
          </div>
        )}
      </div>

      {/* CONTROLS BAR: SEARCH, GENRES, SORTS, VIEWS */}
      <div className="space-y-5 mb-10">
        
        {/* Top Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Search Input with Pearl-White Subtle Elevation */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A5ADBD]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by track name, artist, bpm, or genre..."
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-[#11131B] border border-white/10 hover:border-[#7957FF]/40 focus:border-[#7957FF] focus:outline-none text-xs sm:text-sm font-sans text-white placeholder:text-zinc-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Action Chips: Favorites, Sorting, View Toggle */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
            
            {/* Favorites Filter Chip */}
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-mono font-medium transition-all ${
                onlyFavorites
                  ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : 'bg-[#11131B] border-white/10 text-[#A5ADBD] hover:text-white hover:border-white/20'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-rose-400 text-rose-400' : ''}`} />
              <span>FAVORITES</span>
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#11131B] border border-white/10 text-xs font-mono text-[#DCE1EA]">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#7957FF]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none text-xs font-mono text-white focus:outline-none cursor-pointer"
              >
                <option value="latest" className="bg-[#11131B] text-white">LATEST</option>
                <option value="plays" className="bg-[#11131B] text-white">MOST PLAYED</option>
                <option value="bpm" className="bg-[#11131B] text-white">BPM (HIGH-LOW)</option>
                <option value="title" className="bg-[#11131B] text-white">TITLE (A-Z)</option>
              </select>
            </div>

            {/* Grid / List View Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-[#11131B] border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-[#7957FF] text-white shadow-xs' 
                    : 'text-zinc-500 hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list' 
                    ? 'bg-[#7957FF] text-white shadow-xs' 
                    : 'text-zinc-500 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {genres.map((genre) => {
            const isSelected = selectedGenre === genre;
            return (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-full text-xs font-mono tracking-wider whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#F5F6FA] text-[#07080C] font-bold border-[#F5F6FA] shadow-[0_0_20px_rgba(245,246,250,0.35)] scale-105'
                    : 'bg-[#11131B] text-[#A5ADBD] border-white/10 hover:border-[#7957FF]/40 hover:text-white'
                }`}
              >
                {genre.toUpperCase()}
              </button>
            );
          })}
        </div>

      </div>

      {/* TRACKS DISPLAY: GRID OR LIST */}
      {filteredTracks.length === 0 ? (
        <div className="p-16 rounded-3xl bg-[#11131B] border border-white/10 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#7957FF]">
            <Music2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold font-display text-white">
            No Tracks Found
          </h3>
          <p className="text-sm text-[#A5ADBD] max-w-md mx-auto">
            {searchQuery 
              ? `No remix matched "${searchQuery}". Try a different keyword or genre.`
              : 'The audio archive is updating. Check back soon for new masters.'
            }
          </p>
          {(searchQuery || selectedGenre !== 'All' || onlyFavorites) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGenre('All');
                setOnlyFavorites(false);
              }}
              className="px-6 py-2.5 rounded-full bg-[#7957FF] text-white font-mono text-xs uppercase tracking-wider transition-all hover:bg-[#8E70FF]"
            >
              CLEAR FILTERS
            </button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-3'
        }>
          {filteredTracks.map((track) => (
            <TrackCard 
              key={track.id} 
              track={track} 
              viewMode={viewMode} 
            />
          ))}
        </div>
      )}

      {/* Curated Archive Meta Footer */}
      <div className="mt-12 pt-6 border-t border-[#DCE1EA]/10 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#A5ADBD] gap-4">
        <div>
          SHOWING {filteredTracks.length} OF {tracks.length} PUBLISHED STUDIO MASTERS
        </div>
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span>ORIGINAL MASTER VAULT</span>
          <span>•</span>
          <span className="text-[#64DFFF]">LOSSLESS FLAC / WAV</span>
        </div>
      </div>

    </section>
  );
};
