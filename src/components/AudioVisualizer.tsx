import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart2, 
  CircleDot, 
  Activity, 
  Sparkles, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Sliders, 
  Flame,
  Radio,
  Zap,
  RotateCcw
} from 'lucide-react';
import { audioEngine, AudioMetrics } from '../services/audioEngine';
import { useMusic } from '../context/MusicContext';
import { VisualizerMode } from '../types';

interface AudioVisualizerProps {
  height?: number | string;
  isHero?: boolean;
  onExpandFullscreen?: () => void;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  height = 360, 
  isHero = false,
  onExpandFullscreen 
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isPlaying, currentTrack, visualizerMode, setVisualizerMode } = useMusic();
  
  // Custom visualizer settings
  const [sensitivity, setSensitivity] = useState<number>(1.2);
  const [colorScheme, setColorScheme] = useState<'neon-cyber' | 'electric-cyan' | 'ultra-violet' | 'acid-fire'>('neon-cyber');
  const [fps, setFps] = useState<number>(60);
  const [showSettings, setShowSettings] = useState(false);

  // Peak hold array for frequency bars
  const peakHoldRef = useRef<number[]>([]);
  const peakDecayRef = useRef<number[]>([]);
  // Floating particles state for particle visualizer mode
  const visualizerParticlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; radius: number; hue: number }>>([]);

  const modes: { id: VisualizerMode; label: string; icon: React.ElementType }[] = [
    { id: 'frequency-bars', label: 'Neon Bars', icon: BarChart2 },
    { id: 'circular-spectrum', label: 'Circular Radial', icon: CircleDot },
    { id: 'cinematic-waveform', label: 'Oscilloscope Wave', icon: Activity },
    { id: 'particle-field', label: 'Particle Storm', icon: Sparkles },
    { id: 'waves-3d', label: '3D Terrain Mesh', icon: Layers },
    { id: 'minimal-line', label: 'Minimal Wave', icon: Radio },
    { id: 'club-strobe', label: 'Club Laser Stage', icon: Zap }
  ];

  // Initialize visualizer particles
  useEffect(() => {
    const pts = [];
    for (let i = 0; i < 90; i++) {
      pts.push({
        x: Math.random() * 800,
        y: Math.random() * 400,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 3 + 1,
        hue: Math.random() * 60 + 260 // Violet/Cyan/Pink
      });
    }
    visualizerParticlesRef.current = pts;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = (time: number) => {
      // Calculate real FPS
      frameCount++;
      if (time - fpsTimer >= 1000) {
        setFps(Math.round((frameCount * 1000) / (time - fpsTimer)));
        frameCount = 0;
        fpsTimer = time;
      }

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Clear Canvas
      ctx.clearRect(0, 0, w, h);

      // Background subtle gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, 'rgba(8, 9, 16, 0.95)');
      bgGrad.addColorStop(1, 'rgba(4, 4, 8, 0.98)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle DJ Studio Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      for (let x = 0; x < w; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Read audio data from Web Audio AnalyserNode
      const freqData = audioEngine.getByteFrequencyData();
      const timeData = audioEngine.getByteTimeDomainData();
      const metrics = isPlaying 
        ? audioEngine.getAudioMetrics() 
        : { bass: 0, mid: 0, treble: 0, energy: 0, beatDetected: false, peakValue: 0 };

      // Palettes
      const getColor = (ratio: number, alpha = 1): string => {
        if (colorScheme === 'electric-cyan') {
          return `rgba(100, 223, 255, ${alpha})`;
        }
        if (colorScheme === 'ultra-violet') {
          return `rgba(121, 87, 255, ${alpha})`;
        }
        if (colorScheme === 'acid-fire') {
          return `rgba(255, ${Math.floor(ratio * 160)}, 70, ${alpha})`;
        }
        // Default Obsidian Frequency (Electric Violet #7957FF -> Lavender #B8A8FF -> Icy Blue #64DFFF)
        if (ratio < 0.5) {
          const norm = ratio * 2;
          const r = Math.floor(121 + (184 - 121) * norm);
          const g = Math.floor(87 + (168 - 87) * norm);
          const b = Math.floor(255);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        } else {
          const norm = (ratio - 0.5) * 2;
          const r = Math.floor(184 - (184 - 100) * norm);
          const g = Math.floor(168 + (223 - 168) * norm);
          const b = Math.floor(255);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
      };

      // -------------------------------------------------------------
      // MODE 1: NEON FREQUENCY BARS
      // -------------------------------------------------------------
      if (visualizerMode === 'frequency-bars') {
        const barCount = Math.min(64, Math.floor(w / 10));
        const barWidth = Math.max(3, (w / barCount) - 4);
        const binStep = Math.max(1, Math.floor(freqData.length / barCount));

        if (peakHoldRef.current.length !== barCount) {
          peakHoldRef.current = new Array(barCount).fill(0);
          peakDecayRef.current = new Array(barCount).fill(0);
        }

        for (let i = 0; i < barCount; i++) {
          const rawVal = freqData[i * binStep] || 0;
          // Apply log scale weight to equalize higher frequencies visually
          const freqMultiplier = 1 + (i / barCount) * 1.5;
          const normalized = Math.min(1.0, (rawVal / 255) * sensitivity * freqMultiplier);
          const barHeight = Math.max(4, normalized * (h - 60));

          const x = i * (barWidth + 4) + (w - (barCount * (barWidth + 4))) / 2;
          const y = h - barHeight - 20;

          // Peak hold indicator physics
          if (barHeight > peakHoldRef.current[i]) {
            peakHoldRef.current[i] = barHeight;
            peakDecayRef.current[i] = 0;
          } else {
            peakDecayRef.current[i] += 0.8;
            peakHoldRef.current[i] = Math.max(4, peakHoldRef.current[i] - peakDecayRef.current[i]);
          }

          // Bar gradient
          const barGrad = ctx.createLinearGradient(0, y, 0, h - 20);
          barGrad.addColorStop(0, getColor(i / barCount, 0.95));
          barGrad.addColorStop(1, getColor(i / barCount, 0.25));

          ctx.fillStyle = barGrad;
          ctx.shadowColor = getColor(i / barCount, 0.7);
          ctx.shadowBlur = normalized > 0.6 ? 16 : 6;
          
          // Draw rounded bar
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
          ctx.fill();

          // Peak line indicator
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#00f2fe';
          ctx.shadowBlur = 8;
          ctx.fillRect(x, h - peakHoldRef.current[i] - 22, barWidth, 2.5);
          ctx.shadowBlur = 0;
        }
      }

      // -------------------------------------------------------------
      // MODE 2: CIRCULAR AUDIO SPECTRUM (Radial around DJ Core)
      // -------------------------------------------------------------
      else if (visualizerMode === 'circular-spectrum') {
        const cx = w / 2;
        const cy = h / 2;
        const baseRadius = Math.min(w, h) * 0.22 + metrics.bass * 25;
        const bars = 96;
        const step = Math.floor(freqData.length / bars);

        // Center spinning glowing DJ hub
        ctx.save();
        ctx.translate(cx, cy);

        // Radial glow
        const radGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, baseRadius + 70);
        radGrad.addColorStop(0, `rgba(139, 92, 246, ${0.3 + metrics.bass * 0.4})`);
        radGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.1)');
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius + 70, 0, Math.PI * 2);
        ctx.fill();

        // Inner disc
        ctx.fillStyle = '#0a0b14';
        ctx.strokeStyle = metrics.beatDetected ? '#00f2fe' : 'rgba(139, 92, 246, 0.6)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#7c3aed';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius - 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Radiating frequency spikes
        for (let i = 0; i < bars; i++) {
          const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
          const val = (freqData[i * step] || 0) / 255;
          const length = (val * sensitivity) * (Math.min(w, h) * 0.28) + 4;

          const x1 = Math.cos(angle) * baseRadius;
          const y1 = Math.sin(angle) * baseRadius;
          const x2 = Math.cos(angle) * (baseRadius + length);
          const y2 = Math.sin(angle) * (baseRadius + length);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = getColor(i / bars, 0.85);
          ctx.lineWidth = Math.max(1.5, (Math.PI * 2 * baseRadius / bars) - 1.5);
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // Center DJ Brand Text inside radial ring
        ctx.restore();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DJ MITESHHH', cx, cy - 8);
        ctx.fillStyle = '#06b6d4';
        ctx.font = '600 11px JetBrains Mono, monospace';
        ctx.fillText(`${Math.round(metrics.energy * 100)}% ENERGY`, cx, cy + 12);
      }

      // -------------------------------------------------------------
      // MODE 3: CINEMATIC WAVEFORM (Dual Oscilloscopic Sine Beam)
      // -------------------------------------------------------------
      else if (visualizerMode === 'cinematic-waveform') {
        const sliceWidth = w / (timeData.length - 1);
        const cy = h / 2;

        // Draw multiple glowing harmonic wave layers
        const layers = [
          { alpha: 0.9, blur: 18, color: '#00f2fe', width: 3, amp: 1.0 },
          { alpha: 0.6, blur: 12, color: '#8b5cf6', width: 2, amp: 0.7 },
          { alpha: 0.35, blur: 6, color: '#ec4899', width: 1.5, amp: 0.45 }
        ];

        layers.forEach((layer) => {
          ctx.beginPath();
          ctx.strokeStyle = layer.color;
          ctx.shadowColor = layer.color;
          ctx.shadowBlur = layer.blur;
          ctx.lineWidth = layer.width;

          for (let i = 0; i < timeData.length; i++) {
            const v = (timeData[i] - 128) / 128; // -1.0 to 1.0
            const y = cy + v * (h * 0.38) * sensitivity * layer.amp;
            const x = i * sliceWidth;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        });
        ctx.shadowBlur = 0;
      }

      // -------------------------------------------------------------
      // MODE 4: PARTICLE STORM (Audio-reactive explosive particles)
      // -------------------------------------------------------------
      else if (visualizerMode === 'particle-field') {
        const particles = visualizerParticlesRef.current;
        const cx = w / 2;
        const cy = h / 2;
        const kickEnergy = metrics.beatDetected ? 3.5 : 1 + metrics.bass * 2;

        particles.forEach((p, idx) => {
          // Attract or explode based on bass
          p.x += p.vx * kickEnergy;
          p.y += p.vy * kickEnergy;

          if (metrics.beatDetected) {
            // Explode away from center
            const dx = p.x - cx;
            const dy = p.y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            p.vx = (dx / dist) * (4 + Math.random() * 5);
            p.vy = (dy / dist) * (4 + Math.random() * 5);
          } else {
            // Smooth drift decay
            p.vx *= 0.98;
            p.vy *= 0.98;
          }

          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;

          // Frequency mapping to particle size
          const freqSample = (freqData[idx % freqData.length] || 0) / 255;
          const radius = p.radius + freqSample * 8 * sensitivity;

          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1.5, radius), 0, Math.PI * 2);
          ctx.fillStyle = `hsl(${p.hue + metrics.energy * 80}, 95%, 65%)`;
          ctx.shadowColor = `hsl(${p.hue}, 100%, 70%)`;
          ctx.shadowBlur = 12 * kickEnergy;
          ctx.fill();
        });
        ctx.shadowBlur = 0;
      }

      // -------------------------------------------------------------
      // MODE 5: 3D TERRAIN MESH (Wireframe Soundstage)
      // -------------------------------------------------------------
      else if (visualizerMode === 'waves-3d') {
        const rows = 18;
        const cols = 28;
        const stepX = w / cols;
        const horizonY = h * 0.25;
        const depthStep = (h - horizonY) / rows;

        ctx.lineWidth = 1.5;

        for (let r = 0; r < rows; r++) {
          const rowProgress = r / rows;
          const yBase = horizonY + r * depthStep;
          const perspectiveScale = 0.3 + rowProgress * 0.7;

          ctx.beginPath();
          ctx.strokeStyle = getColor(rowProgress, 0.2 + rowProgress * 0.75);

          for (let c = 0; c <= cols; c++) {
            const freqIdx = Math.floor(((c / cols) * freqData.length * 0.6 + r * 3) % freqData.length);
            const val = (freqData[freqIdx] || 0) / 255;
            const elevation = val * 85 * sensitivity * perspectiveScale;

            const x = (c - cols / 2) * (stepX * perspectiveScale) + w / 2;
            const y = yBase - elevation;

            if (c === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      // -------------------------------------------------------------
      // MODE 6: MINIMAL SOUNDCLOUD STYLE LINE
      // -------------------------------------------------------------
      else if (visualizerMode === 'minimal-line') {
        const bars = 80;
        const barW = (w / bars) - 2;
        const cy = h / 2;

        for (let i = 0; i < bars; i++) {
          const val = (freqData[Math.floor((i / bars) * (freqData.length / 2))] || 0) / 255;
          const barH = Math.max(4, val * h * 0.45 * sensitivity);
          const x = i * (barW + 2);

          // Mirrored top and bottom
          ctx.fillStyle = i % 2 === 0 ? '#8b5cf6' : '#06b6d4';
          ctx.fillRect(x, cy - barH / 2, barW, barH);
        }
      }

      // -------------------------------------------------------------
      // MODE 7: CLUB STROBE LASER STAGE
      // -------------------------------------------------------------
      else if (visualizerMode === 'club-strobe') {
        // Bass kick flash strobe
        if (metrics.beatDetected) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
          ctx.fillRect(0, 0, w, h);
        }

        // Lasers shooting from top corners to the floor
        const lasers = 7;
        for (let i = 0; i < lasers; i++) {
          const freqVal = (freqData[i * 12] || 0) / 255;
          const angle = (i / (lasers - 1)) * Math.PI * 0.8 + 0.35;
          const targetX = (w / 2) + Math.cos(angle + (time * 0.001)) * (w * 0.45);
          const targetY = h - 10;

          ctx.beginPath();
          ctx.moveTo(w / 2, 0);
          ctx.lineTo(targetX, targetY);
          ctx.strokeStyle = getColor(i / lasers, 0.4 + freqVal * 0.6);
          ctx.shadowColor = getColor(i / lasers, 1);
          ctx.shadowBlur = 24 * freqVal;
          ctx.lineWidth = 2 + freqVal * 6;
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [isPlaying, visualizerMode, sensitivity, colorScheme]);

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden bg-white border border-[#D9DDE7] ${isHero ? 'shadow-light-card' : ''}`}>
      
      {/* Top Header Controls Bar (Light Premium Theme) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-white border-b border-[#D9DDE7] z-10 relative">
        
        {/* Left: Live Status & Active Track Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#059669]/10 border border-[#059669]/20 text-[#059669] text-xs font-mono font-bold">
            <span className={`w-2 h-2 rounded-full bg-[#059669] ${isPlaying ? 'animate-ping' : ''}`} />
            <span>REAL-TIME 60FPS</span>
          </div>

          <div className="hidden sm:block text-xs font-mono text-[#73788A]">
            {currentTrack ? (
              <span>SPECTRUM: <strong className="text-[#171923]">{currentTrack.title}</strong> ({currentTrack.format})</span>
            ) : (
              <span>SPECTRUM: ENGINE ACTIVE</span>
            )}
          </div>
        </div>

        {/* Center: Visualizer Mode Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
          {modes.map((m) => {
            const Icon = m.icon;
            const active = visualizerMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setVisualizerMode(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all whitespace-nowrap border ${
                  active 
                    ? 'bg-[#7555E8] text-white border-[#7555E8] font-bold shadow-xs' 
                    : 'bg-white border-[#D9DDE7] text-[#73788A] hover:text-[#171923] hover:bg-[#EEF0F6]'
                }`}
                title={m.label}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Quick Settings & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl text-xs border transition-colors ${
              showSettings 
                ? 'bg-[#EEF0F6] border-[#7555E8] text-[#7555E8]' 
                : 'border-[#D9DDE7] text-[#73788A] hover:text-[#171923] hover:bg-[#EEF0F6]'
            }`}
            title="Visualizer Tweaks"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {onExpandFullscreen && (
            <button
              onClick={onExpandFullscreen}
              className="p-2 rounded-xl text-xs border border-[#D9DDE7] text-[#73788A] hover:text-[#171923] hover:bg-[#EEF0F6] transition-colors"
              title="Full Stage Visualizer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Settings Drawer (Animated Dropdown) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 py-4 bg-zinc-950/90 border-b border-white/10 backdrop-blur-xl flex flex-wrap items-center justify-between gap-6 z-20 relative"
          >
            {/* Sensitivity Slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-400">GAIN / SENSITIVITY:</span>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                className="w-32 accent-dj-cyan cursor-pointer"
              />
              <span className="text-xs font-mono text-dj-cyan font-bold">{sensitivity.toFixed(1)}x</span>
            </div>

            {/* Color Scheme Pills */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400">NEON PALETTE:</span>
              {(['neon-cyber', 'electric-cyan', 'ultra-violet', 'acid-fire'] as const).map(scheme => (
                <button
                  key={scheme}
                  onClick={() => setColorScheme(scheme)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono capitalize transition-all ${
                    colorScheme === scheme 
                      ? 'bg-white text-zinc-950 font-bold shadow-md' 
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/10'
                  }`}
                >
                  {scheme.replace('-', ' ')}
                </button>
              ))}
            </div>

            {/* Reset */}
            <button
              onClick={() => {
                setSensitivity(1.2);
                setColorScheme('neon-cyber');
              }}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 font-mono"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Canvas Element */}
      <div className="relative w-full overflow-hidden" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />

        {/* Overlay Notice if Paused */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-white/20 backdrop-blur-xs flex items-center justify-center pointer-events-none">
            <div className="px-5 py-2.5 rounded-full bg-white/95 border border-[#D9DDE7] text-xs font-mono text-[#171923] flex items-center gap-2.5 shadow-md">
              <span className="w-2 h-2 rounded-full bg-[#D97706]" />
              <span>{currentTrack ? 'DECK PAUSED — HIT PLAY TO RESUME FREQUENCY DYNAMICS' : 'AWAITING TRACK PLAYBACK — SELECT OR UPLOAD A TRACK'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

