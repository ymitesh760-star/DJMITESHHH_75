import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Heart, 
  Download, 
  Clock, 
  Sparkles,
  Activity
} from 'lucide-react';
import { Track } from '../types';
import { useMusic } from '../context/MusicContext';
import { getSafeCoverArt } from '../constants/branding';

interface TrackCardProps {
  track: Track;
  viewMode?: 'grid' | 'list';
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, viewMode = 'grid' }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleFavorite } = useMusic();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const isCurrentTrack = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (viewMode === 'list') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = -(e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setTilt({ x: y * 5, y: x * 5 });
  };

  const handleCardMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(track.id);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = track.audioUrl;
    link.download = `${track.title} (${track.remixTitle}) - DJ Miteshhh 75.${track.format.toLowerCase()}`;
    link.target = '_blank';
    link.click();
  };

  // -----------------------------------------------------------------
  // LIST VIEW LAYOUT
  // -----------------------------------------------------------------
  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        onClick={handlePlay}
        className={`group relative flex items-center justify-between p-4 rounded-2xl transition-all duration-300 cursor-pointer border ${
          isCurrentlyPlaying
            ? 'bg-[#181B26] border-[#7957FF] shadow-[0_0_25px_rgba(121,87,255,0.3)]'
            : 'bg-[#11131B]/80 border-white/10 hover:border-[#7957FF]/40 hover:bg-[#181B26]/80'
        }`}
      >
        {/* Left: Thumbnail & Song Info */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-md border border-white/10 bg-black">
            <img
              src={getSafeCoverArt(track.coverUrl)}
              alt={track.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {/* Play Overlay */}
            <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
              isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              {isCurrentlyPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              )}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-display font-bold text-white truncate group-hover:text-[#64DFFF] transition-colors">
                {track.title}
              </h4>
              {track.format && (
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/10 text-[#64DFFF]">
                  {track.format}
                </span>
              )}
            </div>
            <div className="text-xs text-[#A5ADBD] truncate font-sans">
              {track.remixTitle} {track.originalArtist ? `• ${track.originalArtist}` : ''}
            </div>
          </div>
        </div>

        {/* Center/Right Metadata */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <div className="hidden md:flex items-center gap-3 text-xs font-mono text-[#A5ADBD]">
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[#DCE1EA]">
              {track.genre || 'TECH HOUSE'}
            </span>
            <span>{track.bpm} BPM</span>
            {track.key && <span>{track.key}</span>}
          </div>

          <div className="text-xs font-mono text-zinc-400">
            {track.durationFormatted}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleFavoriteClick}
              className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${
                track.isFavorite ? 'text-rose-400' : 'text-zinc-500 hover:text-white'
              }`}
              title="Add to Favorites"
            >
              <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={handleDownload}
              className="p-2 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-[#64DFFF] transition-colors"
              title="Download Master Audio"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // -----------------------------------------------------------------
  // GRID VIEW CARD LAYOUT
  // -----------------------------------------------------------------
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6 }}
      onMouseMove={handleCardMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleCardMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.15s ease-out'
      }}
      onClick={handlePlay}
      className={`group relative rounded-3xl p-5 cursor-pointer transition-all duration-300 border ${
        isCurrentlyPlaying
          ? 'bg-[#181B26] border-[#7957FF] shadow-[0_15px_45px_rgba(121,87,255,0.3)] ring-1 ring-[#7957FF]'
          : 'bg-[#11131B]/90 border-white/10 hover:border-[#7957FF]/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
      }`}
    >
      {/* Artwork Container */}
      <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-black border border-white/10 shadow-lg">
        <img
          src={getSafeCoverArt(track.coverUrl)}
          alt={track.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />

        {/* Ambient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Format Badge (WAV 24-Bit) */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider bg-black/75 backdrop-blur-md text-[#64DFFF] border border-white/10 uppercase shadow-md">
          {track.format} MASTER
        </div>

        {/* BPM Badge */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-black/75 backdrop-blur-md text-white border border-white/10">
          {track.bpm} BPM
        </div>

        {/* Center Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handlePlay}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
              isCurrentlyPlaying
                ? 'bg-[#7957FF] text-white shadow-[0_0_30px_#7957FF] scale-100 opacity-100'
                : 'bg-white/20 backdrop-blur-md text-white border border-white/30 opacity-0 group-hover:opacity-100 group-hover:scale-105 group-hover:bg-[#7957FF] group-hover:border-transparent'
            }`}
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </motion.button>
        </div>

        {/* Audio Waveform Peak Indicator in Card */}
        {track.waveformPeaks && track.waveformPeaks.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 h-6 flex items-end gap-0.5 opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none">
            {track.waveformPeaks.slice(0, 32).map((peak, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-full bg-gradient-to-t from-[#7957FF] to-[#64DFFF]"
                style={{
                  height: `${Math.max(15, peak * 100)}%`,
                  opacity: isCurrentlyPlaying ? 0.9 : 0.5
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Content & Metadata */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-display font-bold text-white truncate group-hover:text-[#64DFFF] transition-colors">
              {track.title}
            </h3>
            <p className="text-xs font-sans text-[#A5ADBD] truncate">
              {track.remixTitle}
            </p>
          </div>

          <button
            onClick={handleFavoriteClick}
            className={`p-1.5 rounded-full hover:bg-white/10 shrink-0 transition-colors ${
              track.isFavorite ? 'text-rose-400' : 'text-zinc-500 hover:text-white'
            }`}
            title="Favorite"
          >
            <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Tags / Sub-info */}
        <div className="flex items-center justify-between text-xs font-mono text-[#A5ADBD] pt-2 border-t border-white/10">
          <span className="text-[#B8A8FF] text-[11px] font-bold">
            {track.genre || 'TECH HOUSE'}
          </span>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-500" />
              <span>{track.durationFormatted}</span>
            </span>

            <button
              onClick={handleDownload}
              className="p-1 hover:text-[#64DFFF] text-zinc-500 transition-colors"
              title="Download Master Audio"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </motion.div>
  );
};
