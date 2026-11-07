import React from 'react';
import { Disc, ShieldCheck, Sparkles, ArrowUp } from 'lucide-react';
import { STUDIO_BRANDING } from '../constants/branding';

interface FooterProps {
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative border-t border-[#DCE1EA]/15 bg-[#07080C]/95 pt-16 pb-36 px-4 sm:px-6 lg:px-8 text-[#A5ADBD] font-sans z-10 transition-colors select-none">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
        
        {/* Brand Column */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7957FF] to-[#64DFFF] p-0.5 shadow-lg">
              <div className="w-full h-full bg-[#07080C] rounded-[14px] flex items-center justify-center">
                <Disc className="w-5 h-5 text-[#64DFFF]" />
              </div>
            </div>
            <div>
              <span className="font-display font-black text-xl text-white tracking-wider">
                <span className="text-silver-glow">DJ MITESHHH</span>{' '}
                <span className="text-violet-cyan font-mono">75</span>
              </span>
              <div className="text-[10px] font-mono text-[#B8A8FF] font-bold uppercase tracking-[0.2em]">
                OBSIDIAN FREQUENCY • THE PRIVATE SOUND LAB
              </div>
            </div>
          </div>

          <p className="text-sm text-[#A5ADBD] font-sans leading-relaxed max-w-sm">
            Cinematic electronic sound laboratory. Uncompressed 24-bit studio WAV productions engineered for visceral acoustic impact and club sound systems.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#DCE1EA]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>24-BIT LOSSLESS PCM AUDIO PIPELINE</span>
          </div>
        </div>

        {/* Studio Navigation */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-white">
            STUDIO NAVIGATION
          </h4>
          <ul className="space-y-2 text-xs font-mono">
            <li>
              <a href="#featured-remixes" className="hover:text-[#64DFFF] transition-colors">
                • Featured Remixes
              </a>
            </li>
            <li>
              <a href="#music-library" className="hover:text-[#64DFFF] transition-colors">
                • The Music Archive
              </a>
            </li>
            <li>
              <a href="#gear-rack" className="hover:text-[#64DFFF] transition-colors">
                • Hardware Console
              </a>
            </li>
            <li>
              <a href="#playlists" className="hover:text-[#64DFFF] transition-colors">
                • Signature Sets
              </a>
            </li>
            <li>
              <a href="#about" className="hover:text-[#64DFFF] transition-colors">
                • Sound Lab Manifesto
              </a>
            </li>
            <li>
              <button 
                onClick={onOpenAdmin} 
                className="text-[#7957FF] hover:text-[#64DFFF] transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>• Studio Control Room</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Contact & Inquiries */}
        <div className="md:col-span-4 space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-white">
            STUDIO INQUIRIES
          </h4>
          <p className="text-xs text-[#A5ADBD] font-sans leading-relaxed">
            Direct communication for remix stems, sound design inquiries, and production collaborations.
          </p>
          <div className="pt-2">
            <div className="text-xs font-mono text-white font-bold">
              OFFICIAL INBOX:
            </div>
            <a 
              href="mailto:djmiteshhh75@gmail.com" 
              className="text-xs sm:text-sm font-mono text-[#64DFFF] hover:underline"
            >
              djmiteshhh75@gmail.com
            </a>
          </div>
        </div>

      </div>

      {/* Bottom Legal / Copyright */}
      <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-500 gap-4">
        <div>
          © {new Date().getFullYear()} DJ MITESHHH 75. ALL RIGHTS RESERVED.
        </div>
        <div className="flex items-center gap-4">
          <span>THE PRIVATE SOUND LAB</span>
          <span>•</span>
          <span>MY SOUND. MY RULES. MY FREQUENCY.</span>
          <button 
            onClick={scrollToTop}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
            title="Back to Top"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
