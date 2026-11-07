import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Shuffle, 
  Repeat, 
  Heart, 
  ListMusic, 
  Sparkles, 
  Disc,
  Radio
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { InteractiveVinyl } from './InteractiveVinyl';
import { AudioVisualizer } from './AudioVisualizer';
import { getSafeCoverArt } from '../constants/branding';

export const FullscreenPlayer: React.FC = () => {
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

  const [activeTab, setActiveTab] = useState<'visualizer' | 'lyrics' | 'queue'>('visualizer');

  // Modern dialog accessibility: Esc key dismisses modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setExpandedFullscreen]);

  if (!currentTrack) return null;

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 bg-[#07080C] text-white flex flex-col justify-between overflow-hidden overscroll-contain select-none"
    >
      {/* Dynamic Ambient Background Aurora Glow */}
      <div 
        className="absolute inset-0 opacity-30 blur-3xl pointer-events-none transition-all duration-1000 scale-125"
        style={{
          background: 'radial-gradient(circle at 50% 35%, rgba(121, 87, 255, 0.45) 0%, rgba(100, 223, 255, 0.25) 40%, #07080C 75%)'
        }}
      />

      {/* Top Bar: Close Button & Track Format Badge */}
      <div className="relative z-20 flex items-center justify-between px-6 py-5 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#7957FF] animate-pulse shadow-[0_0_10px_#7957FF]" />
          <span className="text-xs font-mono font-bold tracking-widest text-[#DCE1EA] uppercase">
            DJ MITESHHH 75 • OBSIDIAN FREQUENCY
          </span>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-[#B8A8FF] border border-white/10 font-bold">
            {currentTrack.format} 24-BIT MASTER
          </span>
        </div>

        {/* Center Tabs: Visualizer / Chops / Queue */}
        <div className="hidden sm:flex items-center gap-1 p-1 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'visualizer' ? 'bg-[#7957FF] text-white font-bold shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Visualizer Stage
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'lyrics' ? 'bg-[#7957FF] text-white font-bold shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Vocal Chops & Cues
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'queue' ? 'bg-[#7957FF] text-white font-bold shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Studio Queue ({queue.length})
          </button>
        </div>

        {/* Close Modal Button */}
        <button
          onClick={() => setExpandedFullscreen(false)}
          className="p-2.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white transition-colors"
          title="Close Fullscreen Player (ESC)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Center Stage: 3D Vinyl or Visualizer Tabs */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center p-6 gap-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Left: 3D Vinyl Experience */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <InteractiveVinyl track={currentTrack} size="lg" showArm={true} />

          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-wide">
              {currentTrack.title}
            </h2>
            <p className="text-sm font-sans text-[#A5ADBD]">
              {currentTrack.remixTitle} {currentTrack.originalArtist ? `• ${currentTrack.originalArtist}` : ''}
            </p>
            <div className="flex items-center justify-center gap-3 text-xs font-mono text-[#B8A8FF] pt-1">
              <span>{currentTrack.bpm} BPM</span>
              <span>•</span>
              <span>KEY: {currentTrack.key || '8A'}</span>
              <span>•</span>
              <span className="text-[#64DFFF] font-bold">{currentTrack.genre || 'TECH HOUSE'}</span>
            </div>
          </div>
        </div>

        {/* Right Tab Content */}
        <div className="w-full lg:max-w-xl">
          <AnimatePresence mode="wait">
            {activeTab === 'visualizer' && (
              <motion.div
                key="visualizer"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <AudioVisualizer height={340} />
              </motion.div>
            )}

            {activeTab === 'lyrics' && (
              <motion.div
                key="lyrics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 rounded-3xl bg-[#11131B]/80 border border-white/10 text-center space-y-4"
              >
                <div className="text-xs font-mono text-[#7957FF] uppercase tracking-widest font-bold">
                  STUDIO CUES & TRACK INFO
                </div>
                <h3 className="text-xl font-bold font-display text-white">
                  {currentTrack.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#A5ADBD] leading-relaxed max-w-md mx-auto">
                  {currentTrack.description || 'Mastered exclusively for DJ Miteshhh 75 live performances and festival sound systems.'}
                </p>
                <div className="pt-4 flex flex-wrap gap-2 justify-center">
                  {currentTrack.tags?.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full text-[10px] font-mono bg-white/5 border border-white/10 text-[#64DFFF]">
                      #{tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'queue' && (
              <motion.div
                key="queue"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 rounded-3xl bg-[#11131B]/80 border border-white/10 max-h-[380px] overflow-y-auto space-y-2"
              >
                <span className="text-xs font-mono text-[#DCE1EA] uppercase tracking-widest block mb-2 font-bold">
                  PLAYBACK QUEUE ({queue.length} TRACKS)
                </span>
                {queue.map((t, idx) => {
                  const isActive = t.id === currentTrack.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => playTrack(t)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                        isActive
                          ? 'bg-[#7957FF]/20 border-[#7957FF] text-[#64DFFF]'
                          : 'bg-white/5 border-white/5 hover:border-white/20 text-[#A5ADBD] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-zinc-500 w-5 text-center">
                          {idx + 1}
                        </span>
                        <img src={getSafeCoverArt(t.coverUrl)} alt={t.title} className="w-9 h-9 rounded-lg object-cover border border-white/10" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate text-white">{t.title}</div>
                          <div className="text-[10px] text-[#A5ADBD] truncate">{t.remixTitle}</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-zinc-400">{t.durationFormatted}</span>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Bottom Transport Controls */}
      <div className="relative z-20 border-t border-white/10 bg-[#07080C]/90 backdrop-blur-xl px-6 py-5">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-3">
          
          {/* Scrubber Bar */}
          <div className="w-full flex items-center gap-3 text-xs font-mono text-[#A5ADBD]">
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <div 
              className="relative flex-1 h-2 bg-white/10 rounded-full cursor-pointer overflow-hidden group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                seekTo(ratio * duration);
              }}
            >
              <div 
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#7957FF] to-[#64DFFF] rounded-full group-hover:brightness-125"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="w-10 text-left">{formatTime(duration)}</span>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleShuffle}
                className={`p-2 rounded-xl transition-colors ${
                  shuffle ? 'text-[#7957FF]' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <Shuffle className="w-4 h-4" />
              </button>
              <button
                onClick={toggleRepeat}
                className={`p-2 rounded-xl transition-colors ${
                  repeatMode !== 'off' ? 'text-[#64DFFF]' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={prevTrack}
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-[#7957FF] to-[#64DFFF] text-white flex items-center justify-center shadow-[0_0_30px_rgba(121,87,255,0.7)] hover:scale-105 active:scale-95 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-white" />
                ) : (
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleFavorite(currentTrack.id)}
                className={`p-2 rounded-xl transition-colors ${
                  currentTrack.isFavorite ? 'text-rose-400' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${currentTrack.isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};
