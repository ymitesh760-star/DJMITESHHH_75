import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';
import { useMusic } from '../context/MusicContext';

export const BackgroundCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ 
    x: window.innerWidth / 2, 
    y: window.innerHeight / 2, 
    targetX: window.innerWidth / 2, 
    targetY: window.innerHeight / 2 
  });
  const { isPlaying } = useMusic();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Sophisticated Obsidian Frequency Aurora Accents
    const blobs = [
      { x: width * 0.25, y: height * 0.3, vx: 0.2, vy: 0.15, radius: 380, color: 'rgba(121, 87, 255, 0.16)' },
      { x: width * 0.75, y: height * 0.4, vx: -0.18, vy: 0.25, radius: 420, color: 'rgba(100, 223, 255, 0.14)' },
      { x: width * 0.5, y: height * 0.8, vx: 0.15, vy: -0.2, radius: 360, color: 'rgba(184, 168, 255, 0.12)' },
    ];

    let t = 0;

    const render = () => {
      t += 0.006;

      // Cursor follower easing
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Base Obsidian Black canvas (#07080C)
      ctx.fillStyle = '#07080C';
      ctx.fillRect(0, 0, width, height);

      // Real audio reactivity metrics
      const metrics = isPlaying 
        ? audioEngine.getAudioMetrics() 
        : { bass: 0, mid: 0, treble: 0, energy: 0, beatDetected: false, peakValue: 0 };

      // Render slowly drifting Aurora Blobs with ~90px blur
      ctx.save();
      ctx.filter = 'blur(90px)';

      blobs.forEach((blob, i) => {
        // Organic sinusoidal drifting
        const curX = blob.x + Math.sin(t + i * 2) * 70;
        const curY = blob.y + Math.cos(t * 0.8 + i) * 50;
        const radius = blob.radius + metrics.bass * 100;

        const grad = ctx.createRadialGradient(curX, curY, 0, curX, curY, radius);
        grad.addColorStop(0, blob.color);
        grad.addColorStop(1, 'rgba(7, 8, 12, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(curX, curY, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Cursor-following violet spotlight glow
      const spotRadius = 360 + metrics.energy * 120;
      const spotGrad = ctx.createRadialGradient(
        mouseRef.current.x,
        mouseRef.current.y,
        0,
        mouseRef.current.x,
        mouseRef.current.y,
        spotRadius
      );
      spotGrad.addColorStop(0, `rgba(121, 87, 255, ${0.16 + metrics.energy * 0.12})`);
      spotGrad.addColorStop(0.5, `rgba(100, 223, 255, ${0.06 + metrics.mid * 0.08})`);
      spotGrad.addColorStop(1, 'rgba(7, 8, 12, 0)');

      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.arc(mouseRef.current.x, mouseRef.current.y, spotRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isPlaying]);

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 pointer-events-none z-0"
      />
      {/* 7% SVG Film Grain Overlay */}
      <div className="fixed inset-0 film-grain z-0 opacity-80" />
    </>
  );
};
