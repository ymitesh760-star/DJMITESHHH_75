import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Sparkles, Disc, ArrowRight, X, FastForward, Play } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { STUDIO_BRANDING, DEFAULT_COVER_ART } from '../constants/branding';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  // Scene state: 1 to 6
  const [currentScene, setCurrentScene] = useState<number>(1);
  const [isExiting, setIsExiting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastTapRef = useRef<number>(0);

  // Check prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' 
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scene progression timers
  useEffect(() => {
    if (prefersReducedMotion) {
      setCurrentScene(6);
      return;
    }

    const t1 = setTimeout(() => setCurrentScene(2), 1200); // Scene 2: Frequency Activation
    const t2 = setTimeout(() => setCurrentScene(3), 2600); // Scene 3: The Vinyl Emerges
    const t3 = setTimeout(() => setCurrentScene(4), 4200); // Scene 4: The Brand Reveal (DJ MITESHHH 75)
    const t4 = setTimeout(() => setCurrentScene(5), 5800); // Scene 5: The Private Sound Lab
    const t5 = setTimeout(() => setCurrentScene(6), 7200); // Scene 6: Enter The Sound Lab & Final CTA

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [prefersReducedMotion]);

  // Snappy enter / skip handler
  const handleEnterExperience = useCallback(async () => {
    if (isExiting) return;
    setIsExiting(true);

    try {
      await audioEngine.resume();
      audioEngine.triggerCueFX('laser');
    } catch (e) {
      // Ignored if user has not yet interacted with page
    }

    setTimeout(() => {
      onComplete();
    }, 400);
  }, [isExiting, onComplete]);

  // Keyboard shortcut listener for Mac & Desktop: ESC, Space, Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        if (e.key === ' ') {
          e.preventDefault(); // Stop page scrolling
        }
        handleEnterExperience();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEnterExperience]);

  // Double-tap or double-click anywhere on the screen to skip instantly
  const handleBackgroundTouchOrClick = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      handleEnterExperience();
    }
    lastTapRef.current = now;
  };

  // Ambient soundwave canvas for Scenes 2 & 5
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.04;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Draw active multi-frequency wave
      ctx.beginPath();
      ctx.lineWidth = 2.5;

      // Electric violet to icy blue gradient
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, 'rgba(120, 87, 255, 0)');
      grad.addColorStop(0.3, 'rgba(120, 87, 255, 0.9)');
      grad.addColorStop(0.7, 'rgba(99, 216, 255, 0.9)');
      grad.addColorStop(1, 'rgba(99, 216, 255, 0)');
      ctx.strokeStyle = grad;

      for (let x = 0; x < width; x += 3) {
        const norm = (x / width) * Math.PI * 4;
        const envelope = Math.sin((x / width) * Math.PI); // Pinches ends
        const y = centerY + 
          (Math.sin(norm * 1.5 - t * 1.8) * 25 + 
           Math.cos(norm * 3.2 + t * 2.2) * 14 + 
           Math.sin(norm * 6.5 - t * 3.5) * 6) * envelope;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Traveling light packet
      const packetX = ((t * 80) % (width + 200)) - 100;
      const packetGrad = ctx.createRadialGradient(packetX, centerY, 0, packetX, centerY, 40);
      packetGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      packetGrad.addColorStop(0.4, 'rgba(99, 216, 255, 0.6)');
      packetGrad.addColorStop(1, 'rgba(120, 87, 255, 0)');

      ctx.fillStyle = packetGrad;
      ctx.beginPath();
      ctx.arc(packetX, centerY, 40, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1, scale: isExiting ? 1.05 : 1, filter: isExiting ? 'blur(16px)' : 'blur(0px)' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={handleBackgroundTouchOrClick}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#08090D] overflow-hidden select-none touch-manipulation cursor-default"
    >
      {/* 7% SVG Film Grain Overlay */}
      <div className="absolute inset-0 film-grain opacity-80 pointer-events-none" />

      {/* Atmospheric dark radial depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(17, 19, 35, 0.7) 0%, rgba(8, 9, 13, 0.96) 60%, #08090D 100%)'
        }}
      />

      {/* ========================================================= */}
      {/* 1. TOP-RIGHT SKIP BUTTON (OPTIMIZED FOR BOTH MAC & PHONE) */}
      {/* ========================================================= */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-50 flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEnterExperience();
          }}
          className="group relative flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2 rounded-full bg-[#111323]/90 hover:bg-[#1C1F33] active:bg-[#282C48] border border-[#7857FF]/40 hover:border-[#63D8FF] text-xs font-mono font-bold text-[#D9DDE8] hover:text-white transition-all backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,0.8)] active:scale-95 cursor-pointer touch-manipulation"
          style={{ minHeight: '44px' }}
          title="Skip Intro to Music Studio (Press ESC or Space)"
          aria-label="Skip Intro to Music Studio"
        >
          {/* Animated Neon Pulse Indicator */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#63D8FF] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7857FF]" />
          </span>

          <span className="tracking-wider">SKIP INTRO</span>

          {/* Desktop Mac / PC keyboard hint */}
          <span className="hidden sm:inline-block text-[10px] text-zinc-400 font-bold px-1.5 py-0.5 rounded bg-white/10 group-hover:text-[#63D8FF] transition-colors">
            ESC
          </span>

          <X className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#63D8FF] group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      {/* ========================================================= */}
      {/* 2. MOBILE THUMB-ZONE FLOATING SKIP PILL (EASY 1-HAND PHONE SKIP) */}
      {/* ========================================================= */}
      <div className="sm:hidden fixed bottom-6 left-0 right-0 z-50 flex justify-center px-6 pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEnterExperience();
          }}
          className="w-full max-w-[290px] flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-full bg-gradient-to-r from-[#111323]/95 via-[#1a1c32]/95 to-[#111323]/95 border-2 border-[#7857FF]/70 text-white font-mono text-xs font-bold tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(120,87,255,0.5)] backdrop-blur-2xl active:scale-95 touch-manipulation cursor-pointer"
          style={{ minHeight: '48px' }}
          aria-label="Quick Skip Intro on Phone"
        >
          <FastForward className="w-4 h-4 text-[#63D8FF] animate-pulse" />
          <span>SKIP INTRO</span>
          <ArrowRight className="w-4 h-4 text-[#7857FF]" />
        </button>
      </div>

      {/* ========================================================= */}
      {/* SCENE 1: ABSOLUTE BLACK + VIOLET BEACON & FREQUENCY LINE */}
      {/* ========================================================= */}
      {currentScene === 1 && (
        <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-xl px-6">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.8, 1], opacity: [0, 1, 0.8] }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="w-3 h-3 rounded-full bg-[#7857FF] shadow-[0_0_20px_#7857FF]"
          />

          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-64 sm:w-80 h-[1.5px] bg-gradient-to-r from-transparent via-[#7857FF] to-transparent shadow-[0_0_15px_#7857FF] mt-4"
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-[10px] font-mono tracking-[0.3em] text-[#D9DDE8] uppercase mt-6"
          >
            OBSIDIAN FREQUENCY // INITIALIZING SYSTEM
          </motion.div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SCENE 2: FREQUENCY ACTIVATION */}
      {/* ========================================================= */}
      {currentScene === 2 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-20 flex flex-col items-center justify-center w-full px-6"
        >
          <canvas 
            ref={canvasRef} 
            width={720} 
            height={160} 
            className="w-full max-w-2xl h-32 sm:h-36"
          />

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-3 text-xs font-mono tracking-widest text-[#63D8FF] uppercase mt-4"
          >
            <span className="w-2 h-2 rounded-full bg-[#63D8FF] animate-ping" />
            <span>FREQUENCY LOCK ACQUIRED • 24-BIT AUDIO ENGINE</span>
          </motion.div>
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* SCENE 3 & 4 & 5 & 6: 3D METALLIC VINYL & BRAND STACK */}
      {/* ========================================================= */}
      {currentScene >= 3 && (
        <div className="relative z-20 flex flex-col items-center justify-center max-w-4xl mx-auto px-6 text-center">
          
          {/* 3D Metallic Vinyl Disc (Tappable on mobile/Mac to enter immediately) */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotateX: 45, rotateY: -35, z: -300 }}
            animate={{ 
              scale: currentScene >= 6 ? 0.72 : 1, 
              opacity: 1, 
              rotateX: currentScene >= 6 ? 12 : 20, 
              rotateY: currentScene >= 6 ? -8 : -14,
              z: 0 
            }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => {
              e.stopPropagation();
              handleEnterExperience();
            }}
            className="relative perspective-1200 transform-style-3d mb-5 sm:mb-6 cursor-pointer group active:scale-95 transition-transform"
            title="Tap Vinyl to Enter Studio"
          >
            {/* Soft Ambient Rim Light */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7857FF]/35 to-[#63D8FF]/30 blur-2xl scale-110 pointer-events-none group-hover:scale-125 transition-transform" />

            {/* Circular Orbiting Frequency Bars (Scene 5+) */}
            {currentScene >= 5 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-[-30px] sm:inset-[-40px] pointer-events-none flex items-center justify-center"
              >
                <div className="w-full h-full rounded-full border border-[#63D8FF]/20 animate-spin-reverse relative">
                  {[...Array(36)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-1/2 left-1/2 w-1 bg-gradient-to-t from-[#7857FF] to-[#63D8FF] rounded-full origin-bottom"
                      style={{
                        height: `${12 + (i % 6) * 6}px`,
                        transform: `rotate(${i * 10}deg) translate(0, -160px)`,
                        opacity: 0.65
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* The Physical Metallic Vinyl Body */}
            <div className="relative w-56 h-56 sm:w-76 sm:h-76 md:w-80 md:h-80 rounded-full shadow-[0_30px_70px_rgba(0,0,0,0.95)] border-2 border-[#D9DDE8]/40 overflow-hidden bg-[#08090D] p-2">
              
              {/* Concentric Grooves Texture */}
              <div className="w-full h-full rounded-full vinyl-grooves relative flex items-center justify-center">
                
                {/* Conic Metallic Sheen with Silver & Violet Reflections */}
                <div className="absolute inset-0 rounded-full vinyl-sheen opacity-40 mix-blend-overlay pointer-events-none" />
                
                {/* Outer Rim Highlight */}
                <div className="absolute inset-2 rounded-full border border-white/15 pointer-events-none" />
                <div className="absolute inset-6 rounded-full border border-white/10 pointer-events-none" />
                <div className="absolute inset-12 rounded-full border border-white/5 pointer-events-none" />

                {/* Center Label: Official DJ Miteshhh 75 Artwork */}
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-[#D9DDE8]/70 shadow-2xl p-1 bg-[#111323]">
                  <img
                    src={DEFAULT_COVER_ART}
                    alt="DJ Miteshhh 75 Brand Artwork"
                    className="w-full h-full object-cover rounded-full"
                  />
                  {/* Spindle Hole */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#08090D] border border-[#D9DDE8] shadow-inner flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7857FF]" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ========================================================= */}
          {/* SCENE 4: THE BRAND REVEAL (TYPOGRAPHIC STACK) */}
          {/* ========================================================= */}
          {currentScene === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-1"
            >
              <div className="text-4xl sm:text-6xl font-black font-display tracking-tight text-silver leading-none">
                DJ
              </div>
              <div className="text-5xl sm:text-7xl md:text-8xl font-black font-display tracking-wider text-silver-glow leading-none">
                MITESHHH
              </div>
              <div className="text-5xl sm:text-7xl font-mono font-bold text-violet-cyan leading-none">
                75
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* SCENE 5: BRAND COMPOSITION */}
          {/* ========================================================= */}
          {currentScene === 5 && (
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-2.5 sm:space-y-3"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] sm:text-xs font-mono text-[#63D8FF] tracking-[0.25em] uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#7857FF]" />
                <span>THE PRIVATE SOUND LAB</span>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-display tracking-tight text-white uppercase">
                <span className="text-silver-glow">DJ MITESHHH</span>
                <span className="text-violet-cyan ml-2.5 sm:ml-3 font-mono">75</span>
              </h1>

              <div className="text-xs sm:text-base font-mono font-bold tracking-[0.3em] text-[#B9A7FF] uppercase">
                OBSIDIAN FREQUENCY
              </div>

              <p className="text-[11px] sm:text-sm font-sans tracking-widest text-[#D9DDE8]/80 uppercase pt-1">
                MY SOUND. MY RULES. MY FREQUENCY.
              </p>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* SCENE 6: ENTER THE EXPERIENCE WITH INTERACTIVE BUTTON */}
          {/* ========================================================= */}
          {currentScene >= 6 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4 sm:space-y-5 pt-1"
            >
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-mono text-[#63D8FF] tracking-[0.25em] uppercase">
                  <span>THE PRIVATE SOUND LAB</span>
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-white uppercase">
                  <span className="text-silver-glow">DJ MITESHHH</span>
                  <span className="text-violet-cyan ml-2 font-mono">75</span>
                </h1>
                <p className="text-[11px] sm:text-xs font-mono tracking-widest text-[#B9A7FF]">
                  MY SOUND. MY RULES. MY FREQUENCY.
                </p>
              </div>

              {/* The "ENTER THE SOUND LAB" Main Button */}
              <div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEnterExperience();
                  }}
                  className="group relative inline-flex items-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4.5 rounded-full bg-gradient-to-r from-[#7857FF] via-[#5A38DD] to-[#63D8FF] text-white font-display font-black text-xs sm:text-sm tracking-[0.2em] uppercase shadow-[0_0_40px_rgba(120,87,255,0.6)] border border-white/25 hover:shadow-[0_0_60px_rgba(99,216,255,0.8)] transition-all cursor-pointer touch-manipulation"
                  style={{ minHeight: '48px' }}
                  aria-label="Enter The Sound Lab Studio"
                >
                  <span className="relative z-10">ENTER THE SOUND LAB</span>
                  <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                </motion.button>
              </div>

              {/* Helpful Hint for Desktop & Mobile */}
              <div className="text-[10px] sm:text-[11px] font-mono text-zinc-400 tracking-wider">
                <span className="hidden sm:inline">PRESS ESC / SPACE TO SKIP • CLICK TO ENTER</span>
                <span className="sm:hidden">TAP ANYWHERE TO ENTER</span>
              </div>
            </motion.div>
          )}

        </div>
      )}

      {/* Bottom Audio Engine Status Line (Desktop only, mobile has quick thumb skip pill) */}
      <div className="hidden sm:flex absolute bottom-6 left-0 right-0 z-30 items-center justify-center pointer-events-none">
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span>AUDIO ENGINE: ARMORED • 24-BIT UNCOMPRESSED WAV • OBSIDIAN FREQUENCY</span>
        </div>
      </div>
    </motion.div>
  );
};