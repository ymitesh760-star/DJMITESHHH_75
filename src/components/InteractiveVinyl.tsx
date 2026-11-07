import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Disc3, Disc } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Track } from '../types';
import { audioEngine } from '../services/audioEngine';
import { getSafeCoverArt } from '../constants/branding';

interface InteractiveVinylProps {
  track: Track | null;
  size?: 'sm' | 'md' | 'lg';
  showArm?: boolean;
}

export const InteractiveVinyl: React.FC<InteractiveVinylProps> = ({ 
  track, 
  size = 'lg',
  showArm = true 
}) => {
  const { isPlaying, togglePlay, currentTime, seekTo } = useMusic();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const vinylRef = useRef<HTMLDivElement | null>(null);

  const [tilt, setTilt] = useState({ rotateX: 10, rotateY: -8 });
  const [isHovered, setIsHovered] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchAngle, setScratchAngle] = useState(0);
  const lastAngleRef = useRef(0);
  const lastScratchTimeRef = useRef(0);

  // Rotation angle state for continuous momentum and natural deceleration
  const [rotationAngle, setRotationAngle] = useState(0);
  const rotationVelocityRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Cursor 3D depth calculation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isScratching) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const maxTilt = 16;
    const rotateY = (x / (rect.width / 2)) * maxTilt;
    const rotateX = -(y / (rect.height / 2)) * maxTilt + 10;

    setTilt({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    if (!isScratching) {
      setIsHovered(false);
      setTilt({ rotateX: 10, rotateY: -8 });
    }
  };

  // -------------------------------------------------------------
  // CONTINUOUS VINYL INERTIA & NATURAL DECELERATION
  // -------------------------------------------------------------
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (!isScratching) {
        if (isPlaying) {
          // Accelerate to target speed ~33.3 RPM (approx 200 deg/sec)
          const targetVelocity = 200;
          rotationVelocityRef.current += (targetVelocity - rotationVelocityRef.current) * Math.min(1, delta * 3.5);
        } else {
          // Slow down naturally to 0 (realistic brake deceleration)
          rotationVelocityRef.current += (0 - rotationVelocityRef.current) * Math.min(1, delta * 2.2);
        }

        if (Math.abs(rotationVelocityRef.current) > 0.05) {
          setRotationAngle(prev => (prev + rotationVelocityRef.current * delta) % 360);
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isScratching]);

  // -------------------------------------------------------------
  // REAL-TIME TURNTABLE SCRATCH PHYSICS
  // -------------------------------------------------------------
  const getAngle = (clientX: number, clientY: number) => {
    if (!vinylRef.current) return 0;
    const rect = vinylRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  };

  const handleScratchStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsScratching(true);
    const angle = getAngle(e.clientX, e.clientY);
    lastAngleRef.current = angle;
    audioEngine.triggerCueFX('scratch');
  };

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      if (!isScratching) return;
      const currentAngle = getAngle(e.clientX, e.clientY);
      const deltaAngle = currentAngle - lastAngleRef.current;
      lastAngleRef.current = currentAngle;

      setScratchAngle(prev => prev + deltaAngle);

      // Trigger scratch audio chirp when scrubbed
      const now = performance.now();
      if (Math.abs(deltaAngle) > 3.5 && (now - lastScratchTimeRef.current) > 130) {
        audioEngine.triggerCueFX('scratch');
        lastScratchTimeRef.current = now;
        seekTo(Math.max(0, currentTime + (deltaAngle > 0 ? 0.35 : -0.35)));
      }
    };

    const handleGlobalUp = () => {
      if (isScratching) {
        setIsScratching(false);
      }
    };

    if (isScratching) {
      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
    };
  }, [isScratching, currentTime, seekTo]);

  const sizeClasses = {
    sm: 'w-48 h-48',
    md: 'w-72 h-72',
    lg: 'w-80 h-80 sm:w-96 sm:h-96'
  }[size];

  const discSize = {
    sm: 'w-44 h-44',
    md: 'w-64 h-64',
    lg: 'w-72 h-72 sm:w-88 sm:h-88'
  }[size];

  const currentDisplayAngle = isScratching ? scratchAngle : rotationAngle;

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`relative perspective-1000 flex items-center justify-center p-4 select-none ${sizeClasses}`}
    >
      {/* 3D Turntable Platter Chassis */}
      <motion.div
        animate={{
          rotateX: isScratching ? 8 : tilt.rotateX,
          rotateY: isScratching ? 0 : tilt.rotateY,
          scale: isScratching ? 1.04 : isHovered ? 1.02 : 1
        }}
        transition={{ type: 'spring', damping: 22, stiffness: 220 }}
        className="relative transform-style-3d flex items-center justify-center w-full h-full"
      >
        {/* Soft Ambient Underglow with Lavender & Icy Blue Reflections */}
        <div 
          className={`absolute inset-0 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
            isPlaying || isScratching ? 'opacity-70' : 'opacity-25'
          }`}
          style={{
            background: isScratching
              ? 'radial-gradient(circle, rgba(121, 87, 255, 0.6) 0%, rgba(100, 223, 255, 0.45) 50%, transparent 75%)'
              : 'radial-gradient(circle, rgba(121, 87, 255, 0.35) 0%, rgba(100, 223, 255, 0.25) 50%, transparent 75%)'
          }}
        />

        {/* Sculptural Metallic Turntable Outer Ring Edge (Silver Finish) */}
        <div className="absolute w-[95%] h-[95%] rounded-full bg-gradient-to-br from-[#FFFFFF] via-[#DCE1EA] to-[#11131B] border-4 border-[#DCE1EA]/50 shadow-[0_25px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(121,87,255,0.25)] flex items-center justify-center">
          
          {/* Stroboscopic Pitch Markings around perimeter */}
          <div className="absolute inset-2 rounded-full border border-dashed border-[#DCE1EA]/30 pointer-events-none" />

          {/* THE METALLIC VINYL RECORD */}
          <div
            ref={vinylRef}
            onMouseDown={handleScratchStart}
            style={{
              transform: `rotate(${currentDisplayAngle}deg)`
            }}
            className={`relative rounded-full vinyl-grooves shadow-[inset_0_0_40px_rgba(0,0,0,0.9),0_15px_30px_rgba(0,0,0,0.8)] border border-[#DCE1EA]/40 flex items-center justify-center cursor-grab active:cursor-grabbing group ${discSize}`}
          >
            {/* Vinyl Conic Light Sheen (Spun Metallic Reflection) */}
            <div className="absolute inset-0 rounded-full vinyl-sheen pointer-events-none opacity-60 mix-blend-screen" />

            {/* Run-out groove micro-rings */}
            <div className="absolute w-[82%] h-[82%] rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute w-[68%] h-[68%] rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute w-[54%] h-[54%] rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute w-[44%] h-[44%] rounded-full border border-white/8 pointer-events-none" />

            {/* Center Label (Official DJ Branding Artwork) */}
            <div 
              className="relative w-[36%] h-[36%] rounded-full overflow-hidden border-2 border-white/80 shadow-md bg-[#11131B] flex items-center justify-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
            >
              <img
                src={getSafeCoverArt(track?.coverUrl)}
                alt={track?.title || 'DJ Miteshhh 75 Vinyl Master'}
                className="w-full h-full object-cover select-none pointer-events-none"
                loading="lazy"
              />

              {/* Spindle Center Hole */}
              <div className="absolute w-4 h-4 rounded-full bg-[#07080C] border-2 border-[#DCE1EA] shadow-inner flex items-center justify-center pointer-events-none">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7957FF]" />
              </div>

              {/* Hover Center Play/Pause button on label */}
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white drop-shadow-md" />
                ) : (
                  <Play className="w-6 h-6 text-white fill-white ml-0.5 drop-shadow-md" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Polished Aluminum Tonearm Assembly */}
        {showArm && (
          <div className="absolute -top-6 -right-6 w-32 h-48 pointer-events-none z-20">
            {/* Pivot Base */}
            <div className="absolute top-2 right-4 w-9 h-9 rounded-full bg-gradient-to-b from-[#FFFFFF] via-[#DCE1EA] to-[#11131B] border-2 border-[#DCE1EA] shadow-md flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-[#11131B] border border-[#7957FF]" />
            </div>

            {/* Tonearm with smooth dynamic rotation onto record */}
            <motion.div
              animate={{
                rotate: isPlaying || isScratching ? 24 : -8,
                y: isPlaying || isScratching ? 0 : -8
              }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              style={{ transformOrigin: 'calc(100% - 22px) 20px' }}
              className="absolute top-0 right-0 w-28 h-40"
            >
              {/* Metallic Silver Arm Rod */}
              <div className="absolute top-5 right-5 w-1.5 h-32 bg-gradient-to-r from-[#FFFFFF] via-[#DCE1EA] to-[#A5ADBD] rounded-full shadow-[2px_4px_8px_rgba(0,0,0,0.5)] transform rotate-[-22deg]" />
              
              {/* Cartridge & Stylus Head in Violet */}
              <div className="absolute bottom-5 left-5 w-6 h-4 bg-gradient-to-r from-[#7957FF] to-[#64DFFF] rounded-xs shadow-md transform rotate-[-15deg] flex items-center justify-center">
                <div className="w-1 h-2 bg-white rounded-full shadow-[0_0_6px_#B8A8FF]" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Studio Status Badge below record */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#11131B]/95 border border-[#DCE1EA]/30 backdrop-blur-md text-[11px] font-mono text-[#DCE1EA] whitespace-nowrap shadow-xl">
          <span className={`w-2 h-2 rounded-full ${
            isScratching ? 'bg-[#7957FF] animate-ping' : isPlaying ? 'bg-[#10B981] animate-pulse' : 'bg-zinc-600'
          }`} />
          <span className="font-semibold tracking-wider">
            {isScratching ? 'TURNTABLE SCRATCHING...' : isPlaying ? 'DECK ACTIVE • 24-BIT WAV' : 'DECK STANDBY • CLICK TO PLAY'}
          </span>
          <span className="text-[#64DFFF] font-bold">LOSSLESS</span>
        </div>
      </motion.div>
    </div>
  );
};
