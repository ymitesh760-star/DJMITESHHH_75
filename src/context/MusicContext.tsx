import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Track, Playlist, VisualizerMode } from '../types';
import { audioEngine } from '../services/audioEngine';
import { 
  DEFAULT_COVER_ART, 
  DEFAULT_COVER_ART_URL, 
  getSafeCoverArt, 
  isLegacyDefaultCover 
} from '../constants/branding';
import { 
  subscribeToTracks, 
  subscribeToPlaylists, 
  subscribeToAuth,
  verifyAdminRole,
  saveTrack, 
  updateTrackMetadata,
  deleteTrackPermanently,
  incrementPlayCount,
  savePlaylist,
  deletePlaylist as deletePlaylistFromDb,
  isFirebaseConfigured
} from '../services/firebase';

interface MusicContextType {
  tracks: Track[];
  playlists: Playlist[];
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  queue: Track[];
  playbackRate: number;
  visualizerMode: VisualizerMode;
  isExpandedFullscreen: boolean;
  isVisualizerFullscreen: boolean;
  lowEq: number;
  midEq: number;
  highEq: number;
  djFilter: number;
  isAdmin: boolean;
  isCheckingAdmin: boolean;
  authUser: User | null;
  isLoadingTracks: boolean;
  
  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  togglePlay: () => Promise<void>;
  pauseTrack: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleFavorite: (trackId: string) => void;
  setVisualizerMode: (mode: VisualizerMode) => void;
  setExpandedFullscreen: (open: boolean) => void;
  setVisualizerFullscreen: (open: boolean) => void;
  setEQ: (low: number, mid: number, high: number) => void;
  setDJFilter: (val: number) => void;
  triggerCueFX: (type: 'sub-drop' | 'airhorn' | 'laser' | 'scratch') => void;
  addTrack: (track: Track) => Promise<void>;
  updateTrack: (track: Track) => Promise<void>;
  deleteTrack: (track: Track) => Promise<void>;
  addPlaylist: (playlist: Playlist) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  playPlaylist: (playlist: Playlist) => void;
  playAll: (shuffle?: boolean) => void;
  addToQueue: (track: Track) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

// Official Studio Master Track 1: DOPE SHOPE TRANSITION - YALLA HABIBI
export const DOPE_SHOPE_TRACK: Track = {
  id: 'track-dope-shope-yalla-habibi',
  title: 'DOPE SHOPE TRANSITION - YALLA HABIBI',
  remixTitle: 'VIP Transition Club Mix',
  originalArtist: 'Yo Yo Honey Singh x Deep Cold',
  remixer: 'DJ Miteshhh 75',
  genre: 'Bollywood Bass / Arabic Trap',
  bpm: 105,
  key: '8A',
  duration: 230,
  durationFormatted: '3:50',
  format: 'WAV',
  bitDepth: '16-bit',
  sampleRate: '48 kHz',
  fileSizeFormatted: '42.1 MB',
  fileSizeBytes: 44177092,
  audioUrl: '/audio/dope-shope-yalla-habibi.wav',
  audioStoragePath: 'audio/dope-shope-yalla-habibi.wav',
  coverUrl: DEFAULT_COVER_ART,
  artworkStoragePath: DEFAULT_COVER_ART_URL,
  waveformPeaks: [0.61,0.64,0.5,0.46,0.56,0.73,0.6,0.34,0.72,0.33,0.32,0.33,0.57,0.65,0.76,0.59,0.73,1,1,1,1,0.96,1,0.98,1,1,0.93,1,1,0.97,1,0.85,0.99,1,0.98,0.99,0.98,0.77,0.6,1,1,1,0.94,1,0.99,1,1,1,1,1,1,0.98,0.96,1,0.84,0.99,1,1,1,1,1,1,0.99,1,1,1,1,1,0.98,0.25],
  plays: 4890,
  likes: 1250,
  isFavorite: true,
  featured: true,
  published: true,
  releaseDate: '2026-11-07',
  tags: ['Dope Shope', 'Yalla Habibi', 'Transition', 'VIP Remix', 'Bollywood Bass', 'WAV'],
  description: 'Official DJ Miteshhh 75 Studio Master. High-energy festival transition blending Punjabi hip-hop with Arabic trap bass.',
  stemsAvailable: true,
  createdAt: 1731000000000
};

// Official Studio Master Track 2: TENU LEKE X CULO BEAT
export const TENU_LEKE_TRACK: Track = {
  id: 'track-tenu-leke-culo-beat',
  title: 'TENU LEKE X CULO BEAT',
  remixTitle: 'AFTERLYF Flip',
  originalArtist: 'Sonu Nigam x Mahalakshmi Iyer',
  remixer: 'DJ Miteshhh 75',
  genre: 'Tech House / Latin Bass',
  bpm: 126,
  key: '6A',
  duration: 198,
  durationFormatted: '3:18',
  format: 'WAV',
  bitDepth: '16-bit',
  sampleRate: '44.1 kHz',
  fileSizeFormatted: '33.2 MB',
  fileSizeBytes: 34845882,
  audioUrl: '/audio/tenu-leke-culo-beat.wav',
  audioStoragePath: 'audio/tenu-leke-culo-beat.wav',
  coverUrl: DEFAULT_COVER_ART,
  artworkStoragePath: DEFAULT_COVER_ART_URL,
  waveformPeaks: [0.94,1,0.75,0.99,0.87,0.99,0.4,0.99,0.88,1,0.93,0.95,0.87,1,0.89,0.97,0.54,0.99,0.98,0.98,0.82,1,0.99,0.94,0.86,1,0.99,1,0.41,0.99,0.81,1,0.96,0.99,0.75,0.99,0.75,0.99,0.64,0.98,1,0.99,0.98,1,0.93,0.99,0.8,0.99,0.97,1,0.83,0.99,0.99,1,0.81,0.98,0.99,0.99,0.68,0.95,0.61,0.98,0.46,1,0.93,0.99,0.91,0.96,0.93,1],
  plays: 3420,
  likes: 890,
  isFavorite: true,
  featured: false,
  published: true,
  releaseDate: '2026-11-07',
  tags: ['Tenu Leke', 'Culo Beat', 'AFTERLYF Flip', 'Tech House', 'Latin Bass', 'WAV'],
  description: 'Official DJ Miteshhh 75 Studio Master. Heavy Latin percussion club edit of classic Tenu Leke.',
  stemsAvailable: true,
  createdAt: 1731000100000
};

// Official Studio Master Track 3: LE GAYI X TRIBAL
export const LE_GAYI_TRACK: Track = {
  id: 'track-le-gayi-tribal',
  title: 'LE GAYI X TRIBAL',
  remixTitle: 'AFTERLYF Tribal Edit',
  originalArtist: 'Asha Bhosle x Udit Narayan',
  remixer: 'DJ Miteshhh 75',
  genre: 'Tribal Tech House',
  bpm: 128,
  key: '4A',
  duration: 167,
  durationFormatted: '2:47',
  format: 'WAV',
  bitDepth: '16-bit',
  sampleRate: '48 kHz',
  fileSizeFormatted: '30.6 MB',
  fileSizeBytes: 32058052,
  audioUrl: '/audio/le-gayi-tribal.wav',
  audioStoragePath: 'audio/le-gayi-tribal.wav',
  coverUrl: DEFAULT_COVER_ART,
  artworkStoragePath: DEFAULT_COVER_ART_URL,
  waveformPeaks: [0.87,0.98,0.8,0.99,1,0.98,1,0.99,1,1,1,0.99,1,0.99,1,0.99,1,0.99,1,1,0.63,0.99,0.99,0.99,1,0.99,1,1,1,1,1,0.98,1,0.99,0.98,0.99,1,0.99,1,0.98,1,0.99,1,1,1,0.99,1,0.99,1,1,1,0.98,1,0.99,1,0.99,1,1,1,0.98,0.99,0.98,0.92,0.99,1,1,1,0.99,0.25,0.99],
  plays: 2980,
  likes: 810,
  isFavorite: true,
  featured: false,
  published: true,
  releaseDate: '2026-11-07',
  tags: ['Le Gayi', 'Tribal Edit', 'AFTERLYF', 'Tribal Tech House', 'WAV', 'Remix'],
  description: 'Official DJ Miteshhh 75 Studio Master. Hypnotic tribal drums combined with nostalgic Bollywood vocals.',
  stemsAvailable: true,
  createdAt: 1731000200000
};

// Aliases for backwards compatibility
export const MASTER_STUDIO_TRACK = DOPE_SHOPE_TRACK;
export const LA_MAMA_TRACK = TENU_LEKE_TRACK;
export const SONI_DE_NAKHRE_TRACK = LE_GAYI_TRACK;

export const MASTER_STUDIO_PLAYLIST: Playlist = {
  id: 'playlist-dj-mitesh-trilogy',
  title: 'DJ Miteshhh 75 Exclusive Master Trilogy',
  subtitle: 'Official 24-Bit / 16-Bit Studio Masters',
  coverUrl: DEFAULT_COVER_ART,
  artworkStoragePath: DEFAULT_COVER_ART_URL,
  description: 'Dope Shope Transition, Tenu Leke Culo Beat & Le Gayi Tribal.',
  genre: 'Tech House / Bollywood Bass',
  trackIds: ['track-dope-shope-yalla-habibi', 'track-tenu-leke-culo-beat', 'track-le-gayi-tribal'],
  curator: 'DJ Miteshhh 75',
  createdAt: 1731000000000
};

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialized with the 3 official master tracks
  const [tracks, setTracks] = useState<Track[]>([DOPE_SHOPE_TRACK, TENU_LEKE_TRACK, LE_GAYI_TRACK]);
  const [playlists, setPlaylists] = useState<Playlist[]>([MASTER_STUDIO_PLAYLIST]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(DOPE_SHOPE_TRACK);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(230);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [queue, setQueue] = useState<Track[]>([]);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('frequency-bars');
  const [isExpandedFullscreen, setExpandedFullscreen] = useState<boolean>(false);
  const [isVisualizerFullscreen, setVisualizerFullscreen] = useState<boolean>(false);
  
  // Auth state
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState<boolean>(true);
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(true);

  // DJ EQ Controls
  const [lowEq, setLowEqState] = useState<number>(0);
  const [midEq, setMidEqState] = useState<number>(0);
  const [highEq, setHighEqState] = useState<number>(0);
  const [djFilter, setDJFilterState] = useState<number>(0);

  // 1. Subscribe to Firebase Authentication & securely verify Admin Role
  useEffect(() => {
    setIsCheckingAdmin(true);
    const unsubAuth = subscribeToAuth(async (user) => {
      setAuthUser(user);
      if (user) {
        setIsCheckingAdmin(true);
        try {
          const verified = await verifyAdminRole(user);
          setIsAdmin(verified);
        } catch (e) {
          console.error('Error verifying admin status:', e);
          setIsAdmin(false);
        } finally {
          setIsCheckingAdmin(false);
        }
      } else {
        setIsAdmin(false);
        setIsCheckingAdmin(false);
      }
    });
    return () => {
      unsubAuth();
    };
  }, []);

  // 2. Subscribe to Real-Time Cloud Firestore Tracks
  useEffect(() => {
    setIsLoadingTracks(true);
    const unsubTracks = subscribeToTracks((liveTracks) => {
      const initialMasterTracks = [DOPE_SHOPE_TRACK, TENU_LEKE_TRACK, LE_GAYI_TRACK];
      
      // Filter out any legacy tracks to ensure ONLY the 3 requested songs exist
      const legacyTrackIds = [
        'track-apt-x-lollipop-master', 
        'track-la-mama-chammak-challo', 
        'track-soni-de-nakhre-master'
      ];
      
      const filteredLive = (liveTracks || []).filter(t => {
        if (legacyTrackIds.includes(t.id)) return false;
        const low = t.title.toLowerCase();
        if (low.includes('apt. x') || low.includes('chammak challo') || low.includes('nakhre')) return false;
        return true;
      });

      // Automatically normalize cover artwork: replace legacy covers with the official new branding cover
      // while safely preserving individual tracks with custom user-uploaded artwork
      const normalizedLive = filteredLive.map(t => {
        const safeCover = getSafeCoverArt(t.coverUrl);
        // If an existing track in Firestore has an old default cover, update in Firestore if admin is logged in
        if (isAdmin && isLegacyDefaultCover(t.coverUrl) && t.id && !t.id.includes('master')) {
          updateTrackMetadata(t.id, { coverUrl: DEFAULT_COVER_ART_URL }).catch(() => {});
        }
        return {
          ...t,
          coverUrl: safeCover
        };
      });

      if (normalizedLive.length > 0) {
        const merged = [...normalizedLive];
        for (const mt of initialMasterTracks) {
          if (!merged.some(t => t.id === mt.id || t.title.toLowerCase() === mt.title.toLowerCase())) {
            merged.push(mt);
          }
        }
        setTracks(merged);
      } else {
        setTracks(initialMasterTracks);
      }
      setIsLoadingTracks(false);

      // If current track was updated, sync its data
      if (currentTrack) {
        const matching = normalizedLive.find(t => t.id === currentTrack.id);
        if (matching) {
          setCurrentTrack(matching);
        }
      }
    }, isAdmin);

    const unsubPlaylists = subscribeToPlaylists((livePlaylists) => {
      if (livePlaylists && livePlaylists.length > 0) {
        const normalized = livePlaylists.map(p => ({
          ...p,
          coverUrl: getSafeCoverArt(p.coverUrl)
        }));
        setPlaylists(normalized);
      } else {
        setPlaylists([MASTER_STUDIO_PLAYLIST]);
      }
    });

    return () => {
      unsubTracks();
      unsubPlaylists();
    };
  }, [isAdmin]);

  // 3. Audio Engine Event Listeners
  useEffect(() => {
    const unsubTime = audioEngine.onTimeUpdate((time) => {
      setCurrentTime(time);
      const trackDur = audioEngine.getDuration();
      if (trackDur > 0 && !isNaN(trackDur)) {
        setDuration(trackDur);
      }
    });

    const unsubState = audioEngine.onStateChange((playing) => {
      setIsPlaying(playing);
    });

    return () => {
      unsubTime();
      unsubState();
    };
  }, []);

  const playTrack = useCallback(async (track: Track, newQueue?: Track[]) => {
    setCurrentTrack(track);
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
    } else if (queue.length === 0) {
      setQueue([track]);
    }
    setDuration(track.duration);
    setCurrentTime(0);

    // Only increment play count in Firestore for real cloud tracks (skip local master tracks)
    if (!track.id.includes('master') && !track.audioUrl.startsWith('/')) {
      incrementPlayCount(track.id, track.plays);
    }

    await audioEngine.loadAndPlay(track.audioUrl, track.bpm);
  }, [queue]);

  const togglePlay = useCallback(async () => {
    if (!currentTrack) {
      if (tracks.length > 0) {
        await playTrack(tracks[0], tracks);
      }
      return;
    }

    if (isPlaying) {
      audioEngine.pause();
    } else {
      const currentSrc = audioEngine.getCurrentSrc();
      const targetUrl = currentTrack.audioUrl;
      const isLoaded = currentSrc && (currentSrc === targetUrl || currentSrc.endsWith(targetUrl));

      if (!isLoaded) {
        await audioEngine.loadAndPlay(currentTrack.audioUrl, currentTrack.bpm);
      } else {
        await audioEngine.play();
      }
    }
  }, [currentTrack, isPlaying, tracks, playTrack]);

  const pauseTrack = useCallback(() => {
    audioEngine.pause();
  }, []);

  const nextTrack = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    let nextIndex = 0;

    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
      if (nextIndex === currentIndex && queue.length > 1) {
        nextIndex = (currentIndex + 1) % queue.length;
      }
    } else {
      nextIndex = (currentIndex + 1) % queue.length;
    }

    playTrack(queue[nextIndex]);
  }, [currentTrack, queue, shuffle, playTrack]);

  const prevTrack = useCallback(() => {
    if (currentTime > 3) {
      audioEngine.seek(0);
      setCurrentTime(0);
      return;
    }
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    playTrack(queue[prevIndex]);
  }, [currentTime, currentTrack, queue, playTrack]);

  // Hook track ending to next track or repeat
  useEffect(() => {
    const unsubEnd = audioEngine.onEnded(() => {
      if (repeatMode === 'one') {
        audioEngine.seek(0);
        audioEngine.play();
      } else if (repeatMode === 'all' || queue.length > 1) {
        nextTrack();
      } else {
        setIsPlaying(false);
      }
    });
    return () => {
      unsubEnd();
    };
  }, [repeatMode, queue, nextTrack]);

  const seekTo = useCallback((seconds: number) => {
    if (currentTrack) {
      const currentSrc = audioEngine.getCurrentSrc();
      const targetUrl = currentTrack.audioUrl;
      const isLoaded = currentSrc && (currentSrc === targetUrl || currentSrc.endsWith(targetUrl));

      if (!isLoaded) {
        audioEngine.loadAndPlay(currentTrack.audioUrl, currentTrack.bpm).then(() => {
          audioEngine.seek(seconds);
        });
      } else {
        audioEngine.seek(seconds);
      }
    } else {
      audioEngine.seek(seconds);
    }
    setCurrentTime(seconds);
  }, [currentTrack]);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    setIsMuted(vol === 0);
    audioEngine.setVolume(vol);
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setVolume(volume || 0.8);
    } else {
      setIsMuted(true);
      audioEngine.setVolume(0);
    }
  }, [isMuted, volume]);

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const toggleFavorite = useCallback((trackId: string) => {
    setTracks(prev => prev.map(t => {
      if (t.id === trackId) {
        const nextFav = !t.isFavorite;
        return {
          ...t,
          isFavorite: nextFav,
          likes: nextFav ? t.likes + 1 : Math.max(0, t.likes - 1)
        };
      }
      return t;
    }));
  }, []);

  const setEQ = useCallback((low: number, mid: number, high: number) => {
    setLowEqState(low);
    setMidEqState(mid);
    setHighEqState(high);
    audioEngine.setEQ(low, mid, high);
  }, []);

  const setDJFilter = useCallback((val: number) => {
    setDJFilterState(val);
    audioEngine.setDJFilter(val);
  }, []);

  const triggerCueFX = useCallback((type: 'sub-drop' | 'airhorn' | 'laser' | 'scratch') => {
    audioEngine.triggerCueFX(type);
  }, []);

  // Backend Track Mutations
  const addTrack = useCallback(async (newTrack: Track) => {
    const trackWithDefault = {
      ...newTrack,
      coverUrl: newTrack.coverUrl && !isLegacyDefaultCover(newTrack.coverUrl)
        ? newTrack.coverUrl
        : DEFAULT_COVER_ART_URL
    };
    await saveTrack(trackWithDefault);
  }, []);

  const updateTrack = useCallback(async (updated: Track) => {
    const trackWithDefault = {
      ...updated,
      coverUrl: updated.coverUrl && !isLegacyDefaultCover(updated.coverUrl)
        ? updated.coverUrl
        : DEFAULT_COVER_ART_URL
    };
    await updateTrackMetadata(trackWithDefault.id, trackWithDefault);
  }, []);

  const deleteTrack = useCallback(async (track: Track) => {
    if (currentTrack?.id === track.id) {
      audioEngine.pause();
      setCurrentTrack(null);
    }
    await deleteTrackPermanently(track);
  }, [currentTrack]);

  const addPlaylist = useCallback(async (playlist: Playlist) => {
    await savePlaylist(playlist);
  }, []);

  const deletePlaylist = useCallback(async (playlistId: string) => {
    await deletePlaylistFromDb(playlistId);
  }, []);

  const playPlaylist = useCallback((playlist: Playlist) => {
    const playlistTracks = tracks.filter(t => playlist.trackIds.includes(t.id));
    if (playlistTracks.length > 0) {
      playTrack(playlistTracks[0], playlistTracks);
    }
  }, [tracks, playTrack]);

  const playAll = useCallback((shuffled = false) => {
    if (tracks.length === 0) return;
    const trackList = [...tracks];
    if (shuffled) {
      trackList.sort(() => Math.random() - 0.5);
    }
    playTrack(trackList[0], trackList);
  }, [tracks, playTrack]);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, track]);
  }, []);

  // Keyboard Shortcuts (Space: Play/Pause, ArrowLeft/Right: Seek, M: Mute, F: Fullscreen, V: Visualizer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekTo(Math.min(duration, currentTime + 5));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekTo(Math.max(0, currentTime - 5));
      } else if (e.code === 'KeyM') {
        toggleMute();
      } else if (e.code === 'KeyF') {
        setExpandedFullscreen(prev => !prev);
      } else if (e.code === 'KeyV') {
        setVisualizerFullscreen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seekTo, toggleMute, currentTime, duration]);

  return (
    <MusicContext.Provider
      value={{
        tracks,
        playlists,
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        shuffle,
        repeatMode,
        queue,
        playbackRate,
        visualizerMode,
        isExpandedFullscreen,
        isVisualizerFullscreen,
        lowEq,
        midEq,
        highEq,
        djFilter,
        isAdmin,
        isCheckingAdmin,
        authUser,
        isLoadingTracks,
        playTrack,
        togglePlay,
        pauseTrack,
        nextTrack,
        prevTrack,
        seekTo,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        toggleFavorite,
        setVisualizerMode,
        setExpandedFullscreen,
        setVisualizerFullscreen,
        setEQ,
        setDJFilter,
        triggerCueFX,
        addTrack,
        updateTrack,
        deleteTrack,
        addPlaylist,
        deletePlaylist,
        playPlaylist,
        playAll,
        addToQueue
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
