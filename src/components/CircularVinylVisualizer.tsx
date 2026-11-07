import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { audioEngine } from '../services/audioEngine';
import { getSafeCoverArt } from '../constants/branding';

interface CircularVinylVisualizerProps {
  size?: number; // Visualizer diameter in px
}

export const CircularVinylVisualizer: React.FC<CircularVinylVisualizerProps> = ({ 
  size = 460 
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { currentTrack, isPlaying, togglePlay } = useMusic();
  const [isHovered, setIsHovered] = useState(false);

  // Rotation angle state for continuous vinyl momentum
  const [rotation, setRotation] = useState(0);
  const velocityRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Continuous momentum and natural deceleration physics
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        // Accelerate to ~33.3 RPM (approx 200 deg/sec)
        velocityRef.current += (200 - velocityRef.current) * Math.min(1, delta * 3.5);
      } else {
        // Natural deceleration
        velocityRef.current += (0 - velocityRef.current) * Math.min(1, delta * 2.2);
      }

      if (Math.abs(velocityRef.current) > 0.05) {
        setRotation(prev => (prev + velocityRef.current * delta) % 360);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // -------------------------------------------------------------
  // CANVAS: 96 ROUNDED BARS CIRCULAR AUDIO-REACTIVE VISUALIZER
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const barCount = 96; // Exactly 96 rounded bars
    const innerRadius = 145; // Just outside the vinyl disc edge
    const maxBarLength = 65;

    const render = () => {
      t += 0.03;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Fetch real frequency data if playing, otherwise compute simulated wave
      const freqData = isPlaying ? audioEngine.getByteFrequencyData() : null;

      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2;

        let amplitude = 0;

        if (isPlaying && freqData && freqData.length > 0) {
          // Map 96 bars across the audible frequency range
          const binIndex = Math.min(
            freqData.length - 1,
            Math.floor((i < barCount / 2 ? i : barCount - i) * (freqData.length / (barCount / 1.5)))
          );
          const raw = freqData[binIndex] || 0;
          amplitude = Math.min(1.0, (raw / 255) * 1.3);
        } else {
          // Smooth sinusoidal breathing simulation
          amplitude = 0.18 + Math.sin(t * 1.5 + i * 0.18) * 0.12 + Math.cos(t * 0.8 + i * 0.35) * 0.08;
        }

        const barLength = Math.max(6, amplitude * maxBarLength);

        const x1 = cx + Math.cos(angle) * innerRadius;
        const y1 = cy + Math.sin(angle) * innerRadius;
        const x2 = cx + Math.cos(angle) * (innerRadius + barLength);
        const y2 = cy + Math.sin(angle) * (innerRadius + barLength);

        // Circular Color Gradient: Electric Violet (#7957FF) -> Lavender (#B8A8FF) -> Icy Blue (#64DFFF)
        const ratio = i / barCount;
        let strokeColor = '';
        if (ratio < 0.33) {
          strokeColor = '#7957FF'; // Electric Violet
        } else if (ratio < 0.66) {
          strokeColor = '#B8A8FF'; // Lavender
        } else {
          strokeColor = '#64DFFF'; // Icy Blue
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = isPlaying ? 10 : 4;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  return (
    <div 
      className="relative flex items-center justify-center select-none"
      style={{ width: `${size}px`, height: `${size}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 96-Bar Circular Visualizer Canvas */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* Subtle Ambient Radial Glow */}
      <div 
        className={`absolute inset-12 rounded-full blur-2xl transition-opacity duration-700 pointer-events-none ${
          isPlaying ? 'opacity-80' : 'opacity-30'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.45) 0%, rgba(56, 189, 248, 0.3) 50%, transparent 75%)'
        }}
      />

      {/* THE SPINNER VINYL DISC WITH GRADIENT "M" LABEL */}
      <div
        onClick={togglePlay}
        style={{ transform: `rotate(${rotation}deg)` }}
        className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full vinyl-grooves border-2 border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.9),inset_0_0_35px_rgba(0,0,0,0.95)] flex items-center justify-center cursor-pointer group z-20 transition-transform duration-100"
      >
        {/* Conic Metallic Sheen */}
        <div className="absolute inset-0 rounded-full vinyl-sheen pointer-events-none opacity-40 mix-blend-screen" />

        {/* Micro concentric groove rings */}
        <div className="absolute w-[84%] h-[84%] rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute w-[68%] h-[68%] rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute w-[52%] h-[52%] rounded-full border border-white/8 pointer-events-none" />

        {/* Center Disc Label: Gradient "M" Emblem */}
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-[#121224] via-[#1e1b4b] to-[#0f172a] border-2 border-white/30 shadow-xl flex items-center justify-center overflow-hidden">
          
          {/* Subtle spinning gradient background */}
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/40 via-pink-500/30 to-cyan-400/40 opacity-70 pointer-events-none" />

          {/* If track has artwork, show faint background preview */}
          {currentTrack && (
            <img
              src={getSafeCoverArt(currentTrack.coverUrl)}
              alt="Track Cover"
              className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-overlay"
            />
          )}

          {/* Giant Gradient "M" Emblem */}
          <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-4xl font-display font-black bg-gradient-to-b from-white via-cyan-200 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(139,92,246,0.8)] leading-none">
              M
            </span>
            <span className="text-[8px] font-mono font-bold tracking-widest text-[#38bdf8] uppercase mt-0.5">
              DJ MITESH 75
            </span>
          </div>

          {/* Spindle Center Pin */}
          <div className="absolute w-3.5 h-3.5 rounded-full bg-[#05050a] border border-white/40 shadow-inner flex items-center justify-center pointer-events-none z-20">
            <div className="w-1 h-1 rounded-full bg-white" />
          </div>

          {/* Hover Play/Pause Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-30 backdrop-blur-xs">
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white drop-shadow-[0_0_10px_#8b5cf6]" />
            ) : (
              <Play className="w-8 h-8 text-white fill-white ml-1 drop-shadow-[0_0_10px_#38bdf8]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

