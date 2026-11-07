import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Disc, Sparkles, Layers, ListMusic, ChevronRight, Plus } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Playlist } from '../types';
import { getSafeCoverArt } from '../constants/branding';

interface PlaylistsSectionProps {
  onOpenAdmin: () => void;
}

export const PlaylistsSection: React.FC<PlaylistsSectionProps> = ({ onOpenAdmin }) => {
  const { playlists, tracks, playPlaylist, playTrack, currentTrack, isPlaying, isAdmin } = useMusic();
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(playlists[0]?.id || null);

  const selectedPlaylist = playlists.find(p => p.id === activePlaylistId) || playlists[0] || null;
  const playlistTracks = selectedPlaylist ? tracks.filter(t => selectedPlaylist.trackIds.includes(t.id)) : [];

  return (
    <section id="playlists" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24 select-none">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-[#DCE1EA]/15 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono text-[#7957FF] font-bold uppercase tracking-[0.25em]">
            <ListMusic className="w-3.5 h-3.5 text-[#64DFFF]" />
            <span>CURATED DJ SETS // LIVE SESSIONS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white uppercase">
            <span className="text-silver-glow">SIGNATURE</span>{' '}
            <span className="text-violet-cyan">SETS</span>
          </h2>
          <p className="text-sm sm:text-base text-[#A5ADBD] font-sans">
            Seamlessly sequenced collections crafted for club sound systems, road trips, and late-night sessions.
          </p>
        </div>

        {playlists.length > 0 && selectedPlaylist && (
          <button
            onClick={() => playPlaylist(selectedPlaylist)}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#7957FF] to-[#64DFFF] hover:from-[#8E70FF] hover:to-[#8CE7FF] text-white font-display font-bold text-xs tracking-wider uppercase shadow-[0_10px_30px_rgba(121,87,255,0.4)] hover:scale-105 active:scale-95 transition-all self-start md:self-auto cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>PLAY SET</span>
          </button>
        )}
      </div>

      {playlists.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#11131B] border border-white/10 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#7957FF]">
            <ListMusic className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold font-display text-white">
            {isAdmin ? 'No Playlists Created Yet' : 'Curated Sets Coming Soon'}
          </h3>
          <p className="text-sm text-[#A5ADBD] max-w-md mx-auto">
            {isAdmin 
              ? 'You can sequence your master remixes into curated sets (e.g. Midnight Club, Bollywood Bass, Late Night Chill) from the Admin Control Room.'
              : 'Exclusive curated DJ sets will appear here. Listen to any track from the archive above.'
            }
          </p>
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#7957FF] to-[#64DFFF] text-white font-display font-bold text-xs uppercase tracking-wider transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>CREATE FIRST SET</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: PLAYLIST SELECTION CARDS */}
          <div className="lg:col-span-5 space-y-3">
            {playlists.map((playlist) => {
              const isSelected = playlist.id === selectedPlaylist?.id;
              const count = tracks.filter(t => playlist.trackIds.includes(t.id)).length;

              return (
                <div
                  key={playlist.id}
                  onClick={() => setActivePlaylistId(playlist.id)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#181B26] border-[#7957FF] shadow-[0_0_30px_rgba(121,87,255,0.25)]'
                      : 'bg-[#11131B]/80 border-white/10 hover:border-white/25 hover:bg-[#181B26]/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-black">
                      <img
                        src={getSafeCoverArt(playlist.coverUrl)}
                        alt={playlist.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-display font-bold text-white truncate">
                        {playlist.title}
                      </h4>
                      <p className="text-xs text-[#A5ADBD] truncate font-sans">
                        {playlist.subtitle}
                      </p>
                      <div className="text-[10px] font-mono text-[#64DFFF] pt-0.5">
                        {count} TRACKS • {playlist.genre || 'TECH HOUSE'}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className={`w-5 h-5 transition-transform ${
                    isSelected ? 'text-[#7957FF] translate-x-1' : 'text-zinc-600'
                  }`} />
                </div>
              );
            })}
          </div>

          {/* RIGHT COLUMN: ACTIVE PLAYLIST TRACKLIST */}
          <div className="lg:col-span-7 bg-[#11131B]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {selectedPlaylist ? (
              <div className="space-y-6">
                
                {/* Playlist Banner Header */}
                <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-white/10">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border-2 border-white/15 shadow-xl bg-black">
                    <img
                      src={getSafeCoverArt(selectedPlaylist.coverUrl)}
                      alt={selectedPlaylist.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="text-center sm:text-left space-y-1 min-w-0 flex-1">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#7957FF] uppercase">
                      CURATED BY {selectedPlaylist.curator.toUpperCase()}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black font-display text-white">
                      {selectedPlaylist.title}
                    </h3>
                    <p className="text-xs text-[#A5ADBD] font-sans">
                      {selectedPlaylist.description}
                    </p>
                  </div>
                </div>

                {/* Track List */}
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {playlistTracks.length === 0 ? (
                    <div className="p-8 text-center text-xs font-mono text-zinc-500">
                      No tracks currently mapped in this set.
                    </div>
                  ) : (
                    playlistTracks.map((t, index) => {
                      const isCurrent = currentTrack?.id === t.id;
                      const isCurrentPlaying = isCurrent && isPlaying;

                      return (
                        <div
                          key={t.id}
                          onClick={() => playTrack(t)}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                            isCurrentPlaying
                              ? 'bg-[#7957FF]/20 border-[#7957FF] text-[#64DFFF]'
                              : 'bg-white/5 border-white/5 hover:border-white/15 text-[#DCE1EA] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-mono text-zinc-500 w-5 text-center">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate text-white">
                                {t.title}
                              </div>
                              <div className="text-[10px] text-[#A5ADBD] truncate font-sans">
                                {t.remixTitle}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 shrink-0">
                            <span>{t.durationFormatted}</span>
                            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                              {isCurrentPlaying ? (
                                <Disc className="w-3.5 h-3.5 text-[#64DFFF] animate-spin" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            ) : null}
          </div>

        </div>
      )}

    </section>
  );
};
