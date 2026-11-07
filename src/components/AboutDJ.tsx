import React from 'react';
import { motion } from 'framer-motion';
import { 
  Headphones, 
  Disc, 
  Sparkles, 
  Radio, 
  Flame, 
  Sliders,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { STUDIO_BRANDING, DEFAULT_COVER_ART } from '../constants/branding';

export const AboutDJ: React.FC = () => {
  const genres = [
    'Tech House', 'Latin Drill', 'Bollywood Edit', 
    'Club Mix', 'EDM', 'Afro House', 'Festival Dubplates'
  ];

  const soundPrinciples = [
    {
      title: '24-Bit Lossless WAV Audio Vault',
      description: 'Zero lossy MP3 compression. Rendered straight from multi-track studio stems to preserve full transient dynamic range and punch.'
    },
    {
      title: 'Obsidian Sub-Bass & Harmonic Depth',
      description: 'Engineered specifically for visceral club sound systems. Deep sub-bass extension (30–60 Hz) paired with pristine, non-fatiguing high frequencies.'
    },
    {
      title: 'Original Independent Remix Artistry',
      description: 'Independent sound and authentic creative collision. Iconic melodies re-imagined with modern electronic dance music production.'
    }
  ];

  const socials = [
    { name: 'Instagram', url: 'https://instagram.com/djmiteshhh_75', icon: Flame, handle: '@djmiteshhh_75' },
    { name: 'SoundCloud', url: 'https://soundcloud.com', icon: Radio, handle: 'DJ Miteshhh 75' },
    { name: 'YouTube', url: 'https://youtube.com', icon: Disc, handle: 'DJ Mitesh Official' },
    { name: 'Spotify Artist', url: 'https://spotify.com', icon: Headphones, handle: 'DJ Miteshhh' }
  ];

  return (
    <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24 select-none">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* LEFT COLUMN: BRAND VISUAL & STUDIO IDENTITY */}
        <div className="lg:col-span-5 relative">
          
          <div className="relative rounded-3xl overflow-hidden bg-[#11131B] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
            
            {/* Visual DJ Artwork Card */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black flex flex-col justify-end p-6 group">
              
              <img
                src={DEFAULT_COVER_ART}
                alt="DJ Miteshhh 75 Official Cover"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />

              {/* Gradient Overlay for Legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#07080C] via-[#07080C]/40 to-transparent pointer-events-none" />

              {/* Holographic Text Overlays */}
              <div className="relative z-10 space-y-1.5 text-white">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-mono tracking-wider border border-white/15">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#64DFFF] animate-pulse" />
                  <span>OBSIDIAN FREQUENCY</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-display font-black text-silver-glow">
                  DJ MITESHHH 75
                </h3>

                <p className="text-xs text-[#A5ADBD] font-sans">
                  The Private Sound Lab • Uncompressed WAV Vault
                </p>
              </div>

              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-mono font-bold text-[#64DFFF] shadow-md">
                OFFICIAL ARTIST
              </div>
            </div>

            {/* Social Media Links */}
            <div className="grid grid-cols-2 gap-2.5">
              {socials.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#7957FF] hover:bg-white/10 transition-all flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 text-[#7957FF] group-hover:scale-110 transition-transform" />
                      <div className="min-w-0 text-left">
                        <div className="text-xs font-bold text-white truncate">{s.name}</div>
                        <div className="text-[10px] text-zinc-400 truncate">{s.handle}</div>
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#64DFFF] shrink-0" />
                  </a>
                );
              })}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: MANIFESTO & SOUND PRINCIPLES */}
        <div className="lg:col-span-7 space-y-8">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-[#7957FF] font-bold uppercase tracking-[0.25em]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#64DFFF]" />
              <span>THE SOUND LAB // MANIFESTO</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight leading-tight uppercase">
              <span className="text-silver-glow">PURE FREQUENCY.</span>{' '}
              <span className="text-violet-cyan">UNCOMPROMISING ENERGY.</span>
            </h2>
          </div>

          <div className="space-y-4 text-[#A5ADBD] text-base leading-relaxed font-sans">
            <p>
              <strong className="text-white">DJ Miteshhh 75</strong> is an independent remix artist and electronic sound designer. Conceived as a private sound laboratory, this platform is where iconic vocal hooks and modern club rhythms collide.
            </p>
            <p>
              Unlike commercial streaming services that squash dynamic transients with lossy compression, every remix in this studio is preserved in uncompressed 24-bit master format. The result is visceral punch, surgical stereo imaging, and festival-grade bass weight.
            </p>
          </div>

          {/* Sound Principles */}
          <div className="space-y-3 pt-2">
            {soundPrinciples.map((principle, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-2xl bg-[#11131B]/80 border border-white/10 hover:border-[#7957FF]/40 transition-colors"
              >
                <div className="text-sm font-bold font-display text-white mb-1">
                  {principle.title}
                </div>
                <div className="text-xs font-sans text-[#A5ADBD] leading-relaxed">
                  {principle.description}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </section>
  );
};
