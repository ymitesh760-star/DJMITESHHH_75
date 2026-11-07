import React from 'react';
import { motion } from 'framer-motion';

export const GenreMarquee: React.FC = () => {
  const genres = [
    'TECH HOUSE',
    'LATIN DRILL',
    'MASHUP',
    'BOLLYWOOD EDIT',
    'CLUB MIX',
    'EDM',
    'AFRO HOUSE',
    'FESTIVAL DUBPLATE',
  ];

  // Duplicate for seamless infinite marquee loop
  const marqueeItems = [...genres, ...genres, ...genres];

  return (
    <div className="relative w-full overflow-hidden py-8 border-y border-[#DCE1EA]/15 bg-[#07080C]/80 backdrop-blur-md select-none z-10">
      {/* Edge Blur Masks for cinematic fade */}
      <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-[#07080C] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-[#07080C] to-transparent z-10 pointer-events-none" />

      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration: 26,
        }}
        className="flex items-center gap-12 whitespace-nowrap will-change-transform"
      >
        {marqueeItems.map((genre, idx) => (
          <div key={idx} className="flex items-center gap-12 group">
            <span
              className="text-3xl sm:text-5xl lg:text-6xl font-black font-display tracking-wider transition-colors duration-300"
              style={{
                WebkitTextStroke: '1.5px rgba(220, 225, 234, 0.3)',
                color: 'transparent',
              }}
            >
              <span className="group-hover:text-white group-hover:drop-shadow-[0_0_20px_#7957FF] transition-all">
                {genre}
              </span>
            </span>

            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#7957FF] to-[#64DFFF] opacity-70 shadow-[0_0_10px_#7957FF]" />
          </div>
        ))}
      </motion.div>
    </div>
  );
};
