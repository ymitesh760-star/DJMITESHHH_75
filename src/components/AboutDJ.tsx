import React from 'react';
import { DEFAULT_COVER_ART } from '../constants/branding';

export const AboutDJ: React.FC = () => {
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

  return (
    <section id="about" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24 select-none">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        
        {/* LEFT COLUMN: BRAND VISUAL & STUDIO IDENTITY */}
        <div className="lg:col-span-5 relative">
          
          <div className="relative rounded-3xl overflow-hidden bg-[#11131B] border border-white/10 p-4 sm:p-6 shadow-2xl">
            
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
