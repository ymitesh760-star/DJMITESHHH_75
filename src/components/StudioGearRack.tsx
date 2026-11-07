import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sliders, 
  Volume2, 
  Activity, 
  Zap, 
  Radio, 
  Flame, 
  Disc,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { audioEngine } from '../services/audioEngine';

export const StudioGearRack: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    lowEq, 
    midEq, 
    highEq, 
    djFilter,
    setEQ, 
    setDJFilter, 
    triggerCueFX,
    playbackRate 
  } = useMusic();

  const [vuLeft, setVuLeft] = useState<number>(0);
  const [vuRight, setVuRight] = useState<number>(0);
  const [activePad, setActivePad] = useState<string | null>(null);

  // Animate VU meters with real audio energy
  useEffect(() => {
    let animId: number;
    const updateVU = () => {
      if (isPlaying) {
        const metrics = audioEngine.getAudioMetrics();
        const base = metrics.energy * 10;
        setVuLeft(Math.min(10, Math.max(1, Math.round(base + (metrics.bass * 3) + Math.random() * 1.5))));
        setVuRight(Math.min(10, Math.max(1, Math.round(base + (metrics.treble * 3) + Math.random() * 1.5))));
      } else {
        setVuLeft(0);
        setVuRight(0);
      }
      animId = requestAnimationFrame(updateVU);
    };
    animId = requestAnimationFrame(updateVU);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const handlePadClick = (type: 'sub-drop' | 'airhorn' | 'laser' | 'scratch', name: string) => {
    setActivePad(name);
    triggerCueFX(type);
    setTimeout(() => setActivePad(null), 250);
  };

  return (
    <section id="gear-rack" className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24 select-none">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-[#DCE1EA]/15 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#7957FF] font-bold uppercase tracking-[0.25em]">
            <Sliders className="w-3.5 h-3.5 text-[#64DFFF]" />
            <span>PIONEER DJM EMULATION // STUDIO DSP</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-display font-black text-white tracking-tight uppercase">
            <span className="text-silver-glow">HARDWARE</span>{' '}
            <span className="text-violet-cyan">CONSOLE</span>
          </h2>
          <p className="text-[#A5ADBD] text-sm">
            Tactile 3-Band Isolator EQ, Resonant Sound Color Filter & Performance Hot Cues
          </p>
        </div>

        {/* Live Deck Status & Flat EQ Reset */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#11131B] border border-white/10 font-mono text-xs flex items-center gap-2">
            <span className="text-zinc-500">CLOCK:</span>
            <span className="text-[#7957FF] font-bold">{currentTrack ? `${currentTrack.bpm} BPM` : 'STANDBY'}</span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-500">KEY:</span>
            <span className="text-[#64DFFF] font-bold">{currentTrack?.key || '---'}</span>
          </div>

          <button
            onClick={() => {
              setEQ(0, 0, 0);
              setDJFilter(0);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-[#11131B] hover:bg-[#181B26] border border-white/10 text-xs font-mono text-[#DCE1EA] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset All Knobs to Flat 0dB"
          >
            <RotateCcw className="w-3 h-3 text-[#7957FF]" />
            <span>FLAT EQ</span>
          </button>
        </div>
      </div>

      {/* Obsidian DJ Control Desk Surface */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-[#14172A] to-[#07080C] border border-[#DCE1EA]/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] relative overflow-hidden">
        
        {/* Subtle Texture Effect */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* LEFT: 3-BAND ROTARY EQ CHANNEL STRIP */}
          <div className="lg:col-span-4 bg-[#0B0D14] p-5 rounded-2xl border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-mono font-bold tracking-widest text-[#DCE1EA]">ISOLATOR EQ</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#7957FF]/20 text-[#B8A8FF] font-bold border border-[#7957FF]/30">3-BAND</span>
            </div>

            {/* HIGH EQ */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#A5ADBD]">HIGH (6.5 kHz)</span>
                <span className={`font-bold ${highEq > 0 ? 'text-[#64DFFF]' : highEq < 0 ? 'text-rose-400' : 'text-[#A5ADBD]'}`}>
                  {highEq > 0 ? `+${highEq} dB` : `${highEq} dB`}
                </span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={highEq}
                onChange={(e) => setEQ(lowEq, midEq, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#64DFFF]"
              />
            </div>

            {/* MID EQ */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#A5ADBD]">MID (1.2 kHz)</span>
                <span className={`font-bold ${midEq > 0 ? 'text-[#7957FF]' : midEq < 0 ? 'text-rose-400' : 'text-[#A5ADBD]'}`}>
                  {midEq > 0 ? `+${midEq} dB` : `${midEq} dB`}
                </span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={midEq}
                onChange={(e) => setEQ(lowEq, parseFloat(e.target.value), highEq)}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#7957FF]"
              />
            </div>

            {/* LOW EQ (BASS) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#A5ADBD]">LOW / BASS (250 Hz)</span>
                <span className={`font-bold ${lowEq > 0 ? 'text-[#B8A8FF]' : lowEq < 0 ? 'text-rose-400' : 'text-[#A5ADBD]'}`}>
                  {lowEq > 0 ? `+${lowEq} dB` : `${lowEq} dB`}
                </span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={lowEq}
                onChange={(e) => setEQ(parseFloat(e.target.value), midEq, highEq)}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#B8A8FF]"
              />
            </div>

            {/* MASTER RESONANT COLOR FILTER */}
            <div className="pt-2 border-t border-white/10 space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white font-bold">COLOR FILTER</span>
                <span className="text-[#64DFFF] font-bold">
                  {djFilter === 0 ? 'CENTER (OFF)' : djFilter < 0 ? `LPF ${Math.abs(djFilter)}%` : `HPF ${djFilter}%`}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="2"
                value={djFilter}
                onChange={(e) => setDJFilter(parseFloat(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-blue-600 via-zinc-800 to-amber-500 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>LOWPASS (SUB SWEEP)</span>
                <span>NEUTRAL</span>
                <span>HIGHPASS (SIZZLE)</span>
              </div>
            </div>
          </div>

          {/* CENTER: STEREO LED VU METERS & DECK DISPLAY */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-black/70 rounded-2xl border border-white/10 text-center shadow-inner">
            
            <span className="text-[11px] font-mono text-[#A5ADBD] uppercase tracking-widest mb-3">
              MASTER OUTPUT LEVEL (PEAK RMS)
            </span>

            {/* Dual Stereo LED Towers */}
            <div className="flex items-center justify-center gap-4 py-4 px-6 rounded-xl bg-black/80 border border-zinc-800 shadow-inner">
              
              {/* Left Channel */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono text-zinc-500">CH-L</span>
                <div className="flex flex-col-reverse gap-1 h-32 w-4">
                  {[...Array(10)].map((_, i) => {
                    const active = vuLeft > i;
                    const isRed = i >= 8;
                    const isOrange = i >= 6 && i < 8;
                    return (
                      <div
                        key={i}
                        className={`w-full h-2 rounded-xs transition-colors duration-75 ${
                          active 
                            ? isRed 
                              ? 'vu-led-red' 
                              : isOrange 
                                ? 'vu-led-orange' 
                                : 'vu-led-green' 
                            : 'bg-zinc-800/40'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* dB Level Legend */}
              <div className="flex flex-col-reverse justify-between h-32 text-[9px] font-mono text-zinc-500 select-none py-0.5">
                <span>-30</span>
                <span>-18</span>
                <span>-6</span>
                <span className="text-amber-400">0dB</span>
                <span className="text-red-400">+6dB</span>
              </div>

              {/* Right Channel */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono text-zinc-500">CH-R</span>
                <div className="flex flex-col-reverse gap-1 h-32 w-4">
                  {[...Array(10)].map((_, i) => {
                    const active = vuRight > i;
                    const isRed = i >= 8;
                    const isOrange = i >= 6 && i < 8;
                    return (
                      <div
                        key={i}
                        className={`w-full h-2 rounded-xs transition-colors duration-75 ${
                          active 
                            ? isRed 
                              ? 'vu-led-red' 
                              : isOrange 
                                ? 'vu-led-orange' 
                                : 'vu-led-green' 
                            : 'bg-zinc-800/40'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Live Playback Rate / Pitch Info */}
            <div className="mt-4 text-xs font-mono text-[#DCE1EA]">
              PITCH: <span className="text-[#64DFFF] font-bold">{Math.round(playbackRate * 100)}%</span> (NORMAL SPEED)
            </div>

          </div>

          {/* RIGHT: PERFORMANCE HOT CUE TRIGGER PADS */}
          <div className="lg:col-span-4 bg-[#0B0D14] p-5 rounded-2xl border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-mono font-bold tracking-widest text-[#DCE1EA]">PERFORMANCE CUES</span>
              <span className="text-[10px] font-mono text-zinc-500">LIVE AUDIO FX</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => handlePadClick('sub-drop', 'sub-drop')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  activePad === 'sub-drop'
                    ? 'bg-[#7957FF] border-white text-white shadow-[0_0_20px_#7957FF]'
                    : 'bg-[#11131B] border-white/10 hover:border-[#7957FF]/60 text-[#DCE1EA]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Flame className="w-4 h-4 text-[#7957FF]" />
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5">CUE 1</span>
                </div>
                <div className="text-xs font-bold font-display">SUB DROP</div>
                <div className="text-[10px] text-zinc-500 font-mono">40Hz Sine Impact</div>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => handlePadClick('laser', 'laser')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  activePad === 'laser'
                    ? 'bg-[#64DFFF] border-white text-black shadow-[0_0_20px_#64DFFF]'
                    : 'bg-[#11131B] border-white/10 hover:border-[#64DFFF]/60 text-[#DCE1EA]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Zap className="w-4 h-4 text-[#64DFFF]" />
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5">CUE 2</span>
                </div>
                <div className="text-xs font-bold font-display">LASER SWEEP</div>
                <div className="text-[10px] text-zinc-500 font-mono">FM Modulated Zap</div>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => handlePadClick('airhorn', 'airhorn')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  activePad === 'airhorn'
                    ? 'bg-[#B8A8FF] border-white text-black shadow-[0_0_20px_#B8A8FF]'
                    : 'bg-[#11131B] border-white/10 hover:border-[#B8A8FF]/60 text-[#DCE1EA]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-4 h-4 text-[#B8A8FF]" />
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5">CUE 3</span>
                </div>
                <div className="text-xs font-bold font-display">DUB HORN</div>
                <div className="text-[10px] text-zinc-500 font-mono">Reggae Club Strobe</div>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => handlePadClick('scratch', 'scratch')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  activePad === 'scratch'
                    ? 'bg-[#10B981] border-white text-black shadow-[0_0_20px_#10B981]'
                    : 'bg-[#11131B] border-white/10 hover:border-[#10B981]/60 text-[#DCE1EA]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Disc className="w-4 h-4 text-[#10B981]" />
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5">CUE 4</span>
                </div>
                <div className="text-xs font-bold font-display">VINYL CHOP</div>
                <div className="text-[10px] text-zinc-500 font-mono">Turntable Brake</div>
              </motion.button>
            </div>

            <div className="text-[10px] font-mono text-zinc-500 text-center">
              PADS TRIGGER ZERO-LATENCY REALTIME WEB AUDIO FX
            </div>
          </div>

        </div>

      </div>

    </section>
  );
};
