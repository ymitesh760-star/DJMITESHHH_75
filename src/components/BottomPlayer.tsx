import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Shuffle, 
  Repeat, 
  Maximize2, 
  Heart, 
  ListMusic, 
  Disc,
  X
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { getSafeCoverArt } from '../constants/branding';

export const BottomPlayer: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    volume, 
    isMuted, 
    shuffle, 
    repeatMode, 
    queue,
    togglePlay, 
    nextTrack, 
    prevTrack, 
    seekTo, 
    setVolume, 
    toggleMute, 
    toggleShuffle, 
    toggleRepeat, 
    toggleFavorite,
    setExpandedFullscreen,
    playTrack
  } = useMusic();

  const [showQueueDrawer, setShowQueueDrawer] = useState(false);

  if (!currentTrack) return null;

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Popover Queue Drawer */}
      <AnimatePresence>
        {showQueueDrawer && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 right-4 sm:right-8 z-40 w-80 sm:w-96 rounded-3xl glass-bar p-5 shadow-[0_20px_60px_rgba(0,0,0,0.9)]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                STUDIO QUEUE ({queue.length} TRACKS)
              </span>
              <button
                onClick={() => setShowQueueDrawer(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {queue.map((t, idx) => {
                const isActive = t.id === currentTrack.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      playTrack(t);
                      setShowQueueDrawer(false);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all border ${
                      isActive
                        ? 'bg-[#7957FF]/20 border-[#7957FF] text-[#64DFFF]'
                        : 'bg-white/5 border-white/5 hover:border-white/20 text-[#A5ADBD] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[10px] font-mono text-zinc-500 w-4">{idx + 1}</span>
                      <img src={getSafeCoverArt(t.coverUrl)} alt={t.title} className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate text-white">{t.title}</div>
                        <div className="text-[10px] text-[#A5ADBD] truncate">{t.remixTitle}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">{t.durationFormatted}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Player Bar */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-8 sm:right-8 z-40 max-w-6xl mx-auto select-none">
        <div className="glass-bar rounded-3xl p-3 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)] border border-white/15">
          
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            
            {/* Left: Track Artwork & Title */}
            <div 
              onClick={() => setExpandedFullscreen(true)}
              className="flex items-center gap-3 sm:gap-4 min-w-0 cursor-pointer group"
            >
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-md bg-black">
                <img
                  src={getSafeCoverArt(currentTrack.coverUrl)}
                  alt={currentTrack.title}
                  className={`w-full h-full object-cover transition-transform duration-700 ${
                    isPlaying ? 'scale-105' : ''
                  }`}
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-display font-bold text-white truncate group-hover:text-[#64DFFF] transition-colors">
                    {currentTrack.title}
                  </h4>
                  <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/10 text-[#64DFFF] border border-white/10">
                    {currentTrack.format}
                  </span>
                </div>
                <p className="text-[11px] text-[#A5ADBD] truncate font-sans">
                  {currentTrack.remixTitle} {currentTrack.originalArtist ? `• ${currentTrack.originalArtist}` : ''}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(currentTrack.id);
                }}
                className={`hidden sm:block p-1.5 rounded-full hover:bg-white/10 transition-colors ${
                  currentTrack.isFavorite ? 'text-rose-400' : 'text-zinc-500 hover:text-white'
                }`}
                title="Favorite"
              >
                <Heart className={`w-4 h-4 ${currentTrack.isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Center: Playback Controls & Scrubber */}
            <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl px-2">
              
              {/* Transport Buttons */}
              <div className="flex items-center gap-2 sm:gap-4">
                
                <button
                  onClick={toggleShuffle}
                  className={`p-1.5 rounded-lg text-xs transition-colors hidden sm:block ${
                    shuffle ? 'text-[#7957FF]' : 'text-zinc-500 hover:text-white'
                  }`}
                  title="Shuffle"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={prevTrack}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  title="Previous Track"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={togglePlay}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-[#7957FF] to-[#64DFFF] text-white flex items-center justify-center shadow-[0_0_20px_rgba(121,87,255,0.6)] hover:scale-105 transition-all cursor-pointer"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-white" />
                  ) : (
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  )}
                </motion.button>

                <button
                  onClick={nextTrack}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  title="Next Track"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleRepeat}
                  className={`p-1.5 rounded-lg text-xs transition-colors hidden sm:block ${
                    repeatMode !== 'off' ? 'text-[#64DFFF]' : 'text-zinc-500 hover:text-white'
                  }`}
                  title={`Repeat: ${repeatMode}`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                </button>

              </div>

              {/* Progress Scrubber */}
              <div className="w-full flex items-center gap-2 text-[10px] font-mono text-[#A5ADBD]">
                <span className="w-8 text-right">{formatTime(currentTime)}</span>
                <div 
                  className="relative flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer overflow-hidden group"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = (e.clientX - rect.left) / rect.width;
                    seekTo(ratio * duration);
                  }}
                >
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#7957FF] to-[#64DFFF] rounded-full group-hover:brightness-125 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="w-8 text-left">{formatTime(duration)}</span>
              </div>

            </div>

            {/* Right: Volume, Queue, Expand */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              
              {/* Volume Slider (desktop) */}
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-1.5 text-zinc-400 hover:text-white"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-zinc-500" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-16 sm:w-20 h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#7957FF]"
                  title={`Volume: ${Math.round(volume * 100)}%`}
                />
              </div>

              {/* Queue Button */}
              <button
                onClick={() => setShowQueueDrawer(!showQueueDrawer)}
                className={`p-2 rounded-xl transition-all ${
                  showQueueDrawer 
                    ? 'bg-[#7957FF] text-white shadow-xs' 
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
                }`}
                title="View Playback Queue"
              >
                <ListMusic className="w-4 h-4" />
              </button>

              {/* Fullscreen Expand */}
              <button
                onClick={() => setExpandedFullscreen(true)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                title="Full-Screen Immersive Deck"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

            </div>

          </div>

        </div>
      </div>
    </>
  );
};
