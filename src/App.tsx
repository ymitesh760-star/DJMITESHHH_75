import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MusicProvider, useMusic } from './context/MusicContext';
import { BackgroundCanvas } from './components/BackgroundCanvas';
import { IntroAnimation } from './components/IntroAnimation';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { GenreMarquee } from './components/GenreMarquee';
import { FeaturedRemixes } from './components/FeaturedRemixes';
import { MusicLibrary } from './components/MusicLibrary';
import { StudioGearRack } from './components/StudioGearRack';
import { AudioVisualizer } from './components/AudioVisualizer';
import { PlaylistsSection } from './components/PlaylistsSection';
import { AboutDJ } from './components/AboutDJ';
import { Footer } from './components/Footer';
import { BottomPlayer } from './components/BottomPlayer';
import { FullscreenPlayer } from './components/FullscreenPlayer';
import { VisualizerStageModal } from './components/VisualizerStageModal';
import { AdminDashboard } from './components/AdminDashboard';

const MainStudioContent: React.FC = () => {
  const { isExpandedFullscreen, isVisualizerFullscreen, setVisualizerFullscreen } = useMusic();
  
  // Track whether cinematic intro has played in this session
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    return sessionStorage.getItem('dj_mitesh_intro_played') !== 'true';
  });

  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const handleIntroComplete = () => {
    setShowIntro(false);
    sessionStorage.setItem('dj_mitesh_intro_played', 'true');
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  return (
    <div className="relative min-h-screen bg-[#07080C] text-white font-sans selection:bg-[#7957FF] selection:text-white antialiased">
      
      {/* Animated Obsidian Frequency Aura, 7% Film Grain Overlay & Cursor Spotlight */}
      <BackgroundCanvas />

      {/* 7-Scene Cinematic Opening Sequence */}
      <AnimatePresence>
        {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      </AnimatePresence>

      {/* Floating Glass Navigation Bar */}
      <Navbar 
        onOpenAdmin={() => setIsAdminOpen(true)} 
        onReplayIntro={handleReplayIntro} 
      />

      {/* Main Obsidian Frequency Editorial Experience */}
      <main className="relative z-10 space-y-12 sm:space-y-20 pb-36">
        
        {/* Section 1: Asymmetric Hero with 3D Interactive Vinyl & Architectural Tagline */}
        <HeroSection onOpenAdmin={() => setIsAdminOpen(true)} />

        {/* Section 2: Infinite Marquee of Genres in Outline Text */}
        <GenreMarquee />

        {/* Section 3: Featured Remixes as 3:4 Tall Poster Cards */}
        <FeaturedRemixes />

        {/* Section 4: Curated Music Archive */}
        <MusicLibrary onOpenAdmin={() => setIsAdminOpen(true)} />

        {/* Section 5: Hardware Console Emulation (Pioneer DJM Style) */}
        <StudioGearRack />

        {/* Section 6: Real-Time Audio Visualizer Lab */}
        <section id="visualizer-stage" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24 select-none">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs font-mono text-[#7957FF] font-bold uppercase tracking-[0.25em] mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#64DFFF] animate-pulse" />
              <span>REAL-TIME DYNAMICS // WEB AUDIO ANALYSER</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-display font-black text-white uppercase">
              <span className="text-silver-glow">AUDIO VISUALIZER</span>{' '}
              <span className="text-violet-cyan">LAB</span>
            </h2>
            <p className="text-[#A5ADBD] text-sm mt-0.5">
              Switch through 7 visualizer modes powered by Web Audio API & Canvas 60 FPS rendering.
            </p>
          </div>

          <AudioVisualizer 
            height={380} 
            isHero={true} 
            onExpandFullscreen={() => setVisualizerFullscreen(true)} 
          />
        </section>

        {/* Section 7: Signature DJ Playlists */}
        <PlaylistsSection onOpenAdmin={() => setIsAdminOpen(true)} />

        {/* Section 8: Sound Lab Manifesto */}
        <AboutDJ />

      </main>

      {/* Footer */}
      <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Persistent Floating Glass Player Bar */}
      <BottomPlayer />

      {/* Full-Screen Now Playing View (Big vinyl, waveform scrubber, BPM + genre) */}
      <AnimatePresence>
        {isExpandedFullscreen && <FullscreenPlayer />}
      </AnimatePresence>

      {/* Full-Screen Visualizer Modal */}
      <AnimatePresence>
        {isVisualizerFullscreen && (
          <VisualizerStageModal 
            isOpen={isVisualizerFullscreen} 
            onClose={() => setVisualizerFullscreen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Studio Admin Dashboard Modal */}
      <AnimatePresence>
        {isAdminOpen && (
          <AdminDashboard 
            isOpen={isAdminOpen} 
            onClose={() => setIsAdminOpen(false)} 
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export function App() {
  return (
    <MusicProvider>
      <MainStudioContent />
    </MusicProvider>
  );
}

export default App;
