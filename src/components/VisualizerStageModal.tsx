import React from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Disc, Radio } from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';
import { useMusic } from '../context/MusicContext';

interface VisualizerStageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VisualizerStageModal: React.FC<VisualizerStageModalProps> = ({ isOpen, onClose }) => {
  const { currentTrack, isPlaying } = useMusic();

  // Modern dialog accessibility: Esc key dismisses modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'KeyV') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#030307] flex flex-col justify-between overflow-hidden overscroll-contain select-none"
    >
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center">
            <Radio className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-black text-white text-base">
              ARENA AUDIO VISUALIZER STAGE
            </h3>
            <p className="text-xs font-mono text-zinc-400">
              {currentTrack ? `${currentTrack.title} (${currentTrack.format})` : 'READY FOR PLAYBACK'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors"
          title="Exit Visualizer Stage (ESC / V)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Full-Screen Visualizer Component */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center">
        <AudioVisualizer height="100%" isHero={true} />
      </div>

      {/* Bottom Info Bar */}
      <div className="px-6 py-3 border-t border-white/10 bg-zinc-950/90 text-center text-xs font-mono text-zinc-500 flex items-center justify-between">
        <span>PRESS [V] TO TOGGLE STAGE</span>
        <span className="text-dj-cyan font-bold">WEB AUDIO API • 512-POINT FFT ANALYSER</span>
        <span>PRESS [SPACE] TO PLAY / PAUSE</span>
      </div>
    </motion.div>
  );
};
