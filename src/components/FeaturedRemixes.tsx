import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Sparkles, Disc, Flame } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Track } from '../types';
import { getSafeCoverArt } from '../constants/branding';

export const FeaturedRemixes: React.FC = () => {
  const { tracks, currentTrack, isPlaying, playTrack, togglePlay } = useMusic();

  // Show top featured or first 3 real master tracks
  const featuredList = tracks.slice(0, 3);

  const handleCardPlay = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  return (
    <section id="featured-remixes" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24 select-none">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 pb-4 border-b border-[#DCE1EA]/15 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#7957FF] font-bold uppercase tracking-[0.25em] mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#64DFFF]" />
            <span>VIP DUBPLATES // EXCLUSIVE EDITS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white uppercase">
            <span className="text-silver-glow">FEATURED</span>{' '}
            <span className="text-violet-cyan">REMIXES</span>
          </h2>
        </div>

        <p className="text-xs sm:text-sm font-mono text-[#A5ADBD] max-w-xs text-left sm:text-right">
          Lossless 24-bit master audio • Handcrafted stems & live performance flips
        </p>
      </div>

      {/* 3:4 Tall Poster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {featuredList.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;
          const isCurrentPlaying = isCurrent && isPlaying;

          return (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              whileHover={{ 
                y: -10, 
                rotate: idx % 2 === 0 ? -1.5 : 1.5,
                transition: { duration: 0.3 }
              }}
              onClick={(e) => handleCardPlay(track, e)}
              className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer border border-white/10 bg-gradient-to-b from-[#14172A] via-[#11131B] to-[#07080C] shadow-[0_20px_50px_rgba(0,0,0,0.85)] hover:border-[#7957FF]/60 hover:shadow-[0_25px_60px_rgba(121,87,255,0.35)] flex flex-col justify-between p-6 transition-colors"
            >
              {/* Giant Faint "M" Watermark Graphic in Background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none">
                <span className="text-[18rem] font-display font-black text-white leading-none select-none">
                  M
                </span>
              </div>

              {/* Artwork Background with Atmospheric Gradient Mask */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <img
                  src={getSafeCoverArt(track.coverUrl)}
                  alt={track.title}
                  className="w-full h-full object-cover opacity-50 group-hover:opacity-75 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080C] via-[#11131B]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#7957FF]/20 via-transparent to-transparent opacity-60" />
              </div>

              {/* Top Row: Genre Pill & BPM Badge */}
              <div className="relative z-10 flex items-center justify-between w-full">
                <span className="px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-black/80 backdrop-blur-md text-[#64DFFF] border border-[#64DFFF]/30 uppercase shadow-md">
                  {track.genre || 'CLUB REMIX'}
                </span>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-white/10 backdrop-blur-md text-[#DCE1EA] border border-white/10">
                  {track.bpm} BPM
                </span>
              </div>

              {/* Center Play Button Overlay on Hover */}
              <div className="relative z-10 flex items-center justify-center my-auto">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                    isCurrentPlaying
                      ? 'bg-gradient-to-r from-[#7957FF] to-[#64DFFF] text-white shadow-[0_0_35px_#7957FF] scale-100'
                      : 'bg-white/20 backdrop-blur-md border border-white/30 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 group-hover:bg-[#7957FF] group-hover:border-transparent group-hover:shadow-[0_0_30px_#7957FF]'
                  }`}
                >
                  {isCurrentPlaying ? (
                    <Pause className="w-7 h-7 fill-white" />
                  ) : (
                    <Play className="w-7 h-7 fill-white ml-1" />
                  )}
                </motion.div>
              </div>

              {/* Bottom Track Meta */}
              <div className="relative z-10 space-y-2">
                <div className="text-[10px] font-mono tracking-widest text-[#B8A8FF] uppercase">
                  MASTER 0{idx + 1} • {track.format} LOSSLESS
                </div>

                <h3 className="text-xl sm:text-2xl font-black font-display text-white leading-tight truncate group-hover:text-[#64DFFF] transition-colors">
                  {track.title}
                </h3>

                <p className="text-xs text-[#A5ADBD] truncate font-sans">
                  {track.remixTitle} {track.originalArtist ? `• ${track.originalArtist}` : ''}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-[#DCE1EA]/70 border-t border-white/10">
                  <span>{track.durationFormatted}</span>
                  <span className="text-[#64DFFF] font-bold">STUDIO MASTER</span>
                </div>
              </div>

            </motion.div>
          );
        })}
      </div>

    </section>
  );
};
