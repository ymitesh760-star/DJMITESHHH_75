import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Play, Pause, Disc3, Sparkles, Sliders, ArrowDown, ShieldCheck, Activity, Radio, Volume2 } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { STUDIO_BRANDING, DEFAULT_COVER_ART, getSafeCoverArt } from '../constants/branding';

interface HeroSectionProps {
  onOpenAdmin: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenAdmin }) => {
  const { currentTrack, isPlaying, togglePlay, playTrack, tracks } = useMusic();
  const heroRef = useRef<HTMLDivElement | null>(null);

  // Mouse 3D tilt physics for the right-hand vinyl display
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [16, -16]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-20, 20]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const activeMaster = currentTrack || tracks[0] || null;

  const scrollToArchive = () => {
    const el = document.getElementById('music-library') || document.getElementById('music-archive');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToStudioConsole = () => {
    const el = document.getElementById('gear-rack');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else onOpenAdmin();
  };

  return (
    <section 
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-[92vh] flex items-center pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden select-none"
    >
      {/* Dynamic Ambient Background Aura */}
      <div 
        className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none opacity-25 blur-[120px]"
        style={{
          background: 'radial-gradient(circle, rgba(121, 87, 255, 0.45) 0%, rgba(100, 223, 255, 0.25) 50%, transparent 70%)'
        }}
      />

      {/* ASYMMETRIC EDITORIAL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full z-10">
        
        {/* ============================================================== */}
        {/* LEFT COLUMN: EDITORIAL TYPOGRAPHY & BRAND STATEMENT (7 COLS) */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 space-y-8 text-left">
          
          {/* Eyebrow: OBSIDIAN FREQUENCY // THE PRIVATE SOUND LAB */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#11131B] border border-white/10 backdrop-blur-md shadow-md"
          >
            <span className="w-2 h-2 rounded-full bg-[#7957FF] animate-pulse shadow-[0_0_10px_#7957FF]" />
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.25em] text-[#64DFFF] uppercase">
              OBSIDIAN FREQUENCY
            </span>
            <span className="text-zinc-600 font-mono">•</span>
            <span className="text-[10px] font-mono tracking-widest text-[#A5ADBD] uppercase hidden sm:inline">
              THE PRIVATE SOUND LAB
            </span>
          </motion.div>

          {/* Main Monumental Heading: DJ MITESHHH 75 */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="space-y-2"
          >
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[5.5rem] font-black font-display tracking-tight leading-[0.92] uppercase text-white">
              <span className="text-silver-glow">DJ MITESHHH</span>
              <span className="text-violet-cyan ml-3 sm:ml-4 font-mono">75</span>
            </h1>
          </motion.div>

          {/* The Architectural 3-Line Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-1 border-l-2 border-[#7957FF] pl-4 sm:pl-6 py-1"
          >
            <div className="text-xl sm:text-3xl font-display font-black tracking-wider text-[#DCE1EA] uppercase">
              MY SOUND.
            </div>
            <div className="text-xl sm:text-3xl font-display font-black tracking-wider text-[#B8A8FF] uppercase">
              MY RULES.
            </div>
            <div className="text-xl sm:text-3xl font-display font-black tracking-wider text-[#64DFFF] uppercase">
              MY FREQUENCY.
            </div>
          </motion.div>

          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base sm:text-lg font-sans font-light text-[#A5ADBD] max-w-xl leading-relaxed"
          >
            An independent remix archive by DJ Miteshhh 75. Handcrafted dubplates, uncompressed 24-bit WAV club masters, and pure electronic performance dynamics.
          </motion.p>

          {/* Primary & Secondary CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            {/* Primary CTA: EXPLORE THE ARCHIVE */}
            <button
              onClick={scrollToArchive}
              className="group flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#7957FF] to-[#64DFFF] hover:from-[#8E70FF] hover:to-[#8CE7FF] text-white font-display font-bold text-xs sm:text-sm tracking-wider uppercase shadow-[0_10px_35px_rgba(121,87,255,0.45)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>{STUDIO_BRANDING.primaryCTA}</span>
              <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
            </button>

            {/* Secondary CTA: ENTER THE SOUND LAB */}
            <button
              onClick={scrollToStudioConsole}
              className="flex items-center gap-2.5 px-7 py-4 rounded-full bg-[#11131B] hover:bg-[#181B26] border border-white/15 hover:border-[#7957FF]/60 text-[#DCE1EA] hover:text-white font-display font-bold text-xs sm:text-sm tracking-wider uppercase backdrop-blur-md shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-[#64DFFF]" />
              <span>{STUDIO_BRANDING.secondaryCTA}</span>
            </button>
          </motion.div>

          {/* Technical Telemetry Strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 max-w-lg"
          >
            <div className="space-y-0.5">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">AUDIO FIDELITY</div>
              <div className="text-xs font-mono font-bold text-[#DCE1EA]">24-BIT / 48 kHz</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">ENCODING</div>
              <div className="text-xs font-mono font-bold text-[#64DFFF]">LOSSLESS WAV</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">VAULT STATUS</div>
              <div className="text-xs font-mono font-bold text-[#10B981] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span>ONLINE</span>
              </div>
            </div>
          </motion.div>

        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: SIGNATURE 3D INTERACTIVE VINYL EXPERIENCE (5 COLS) */}
        {/* ============================================================== */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          
          <motion.div
            style={{ rotateX, rotateY }}
            className="perspective-1200 transform-style-3d relative cursor-pointer group"
            onClick={() => {
              if (activeMaster) {
                if (currentTrack?.id === activeMaster.id) {
                  togglePlay();
                } else {
                  playTrack(activeMaster);
                }
              }
            }}
          >
            {/* Audio-Reactive Frequency Halo */}
            <div className={`absolute inset-[-25px] rounded-full border border-[#7957FF]/30 transition-all duration-700 pointer-events-none ${
              isPlaying ? 'animate-spin-slow opacity-80 scale-105' : 'opacity-30 scale-100'
            }`}>
              {[...Array(24)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-0.5 bg-gradient-to-t from-[#7957FF] to-[#64DFFF] origin-bottom"
                  style={{
                    height: isPlaying ? `${8 + (i % 4) * 4}px` : '4px',
                    transform: `rotate(${i * 15}deg) translate(0, -170px)`,
                    opacity: 0.6
                  }}
                />
              ))}
            </div>

            {/* Radial glow background */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7957FF]/30 to-[#64DFFF]/20 blur-2xl pointer-events-none" />

            {/* The 3D Vinyl Object */}
            <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full shadow-[0_30px_80px_rgba(0,0,0,0.95)] border-2 border-[#DCE1EA]/40 overflow-hidden bg-[#07080C] p-2.5">
              
              {/* Concentric Grooves */}
              <div className={`w-full h-full rounded-full vinyl-grooves relative flex items-center justify-center ${
                isPlaying ? 'animate-spin-slow' : ''
              }`}>
                
                {/* Conic Sheen Reflection */}
                <div className="absolute inset-0 rounded-full vinyl-sheen opacity-45 mix-blend-overlay pointer-events-none" />

                {/* Grooves Rings */}
                <div className="absolute inset-3 rounded-full border border-white/15 pointer-events-none" />
                <div className="absolute inset-8 rounded-full border border-white/10 pointer-events-none" />
                <div className="absolute inset-16 rounded-full border border-white/5 pointer-events-none" />

                {/* Center Label: DJ Miteshhh 75 Artwork */}
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-[#DCE1EA]/80 shadow-2xl p-1 bg-[#11131B]">
                  <img
                    src={getSafeCoverArt(activeMaster?.coverUrl)}
                    alt={activeMaster?.title || 'DJ Miteshhh 75'}
                    className="w-full h-full object-cover rounded-full"
                  />
                  {/* Spindle Center */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#07080C] border border-[#DCE1EA] shadow-inner flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#7957FF]" />
                  </div>
                </div>
              </div>

              {/* Hover Play/Pause Overlay Badge */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity rounded-full backdrop-blur-[2px]">
                <div className="w-16 h-16 rounded-full bg-[#7957FF] text-white flex items-center justify-center shadow-[0_0_30px_#7957FF] scale-90 group-hover:scale-100 transition-transform">
                  {isPlaying ? (
                    <Pause className="w-7 h-7 fill-white" />
                  ) : (
                    <Play className="w-7 h-7 fill-white ml-1" />
                  )}
                </div>
              </div>

            </div>
          </motion.div>

          {/* Active Master HUD Card underneath the vinyl */}
          {activeMaster && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 w-full max-w-sm p-4 rounded-2xl bg-[#11131B]/90 border border-white/10 backdrop-blur-md shadow-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10">
                  <img 
                    src={getSafeCoverArt(activeMaster.coverUrl)} 
                    alt={activeMaster.title} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate font-display">
                    {activeMaster.title}
                  </div>
                  <div className="text-[10px] text-[#A5ADBD] truncate font-mono">
                    {activeMaster.remixTitle} • {activeMaster.bpm} BPM
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentTrack?.id === activeMaster.id) {
                    togglePlay();
                  } else {
                    playTrack(activeMaster);
                  }
                }}
                className="w-9 h-9 rounded-full bg-[#7957FF] hover:bg-[#8E70FF] text-white flex items-center justify-center shadow-[0_0_15px_rgba(121,87,255,0.5)] shrink-0 transition-transform hover:scale-105 active:scale-95"
                title={isPlaying ? 'Pause' : 'Play Studio Master'}
              >
                {isPlaying && currentTrack?.id === activeMaster.id ? (
                  <Pause className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                )}
              </button>
            </motion.div>
          )}

        </div>

      </div>
    </section>
  );
};
