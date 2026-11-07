export type AudioFormat = 'WAV' | 'MP3' | 'FLAC' | 'M4A' | 'OGG';

export interface Track {
  id: string;
  title: string;
  remixTitle: string;
  originalArtist: string;
  remixer: string;
  genre: string;
  bpm: number;
  key: string;
  duration: number; // in seconds
  durationFormatted: string;
  format: AudioFormat;
  bitDepth?: string; // e.g. "24-bit"
  sampleRate?: string; // e.g. "96 kHz" or "48 kHz"
  fileSizeFormatted: string;
  fileSizeBytes?: number;
  audioUrl: string;
  audioStoragePath?: string; // Firebase Storage reference path for deletion
  coverUrl: string;
  artworkStoragePath?: string; // Firebase Storage reference path for deletion
  waveformPeaks: number[];
  plays: number;
  likes: number;
  isFavorite?: boolean;
  featured?: boolean;
  published: boolean;
  releaseDate: string;
  tags: string[];
  description: string;
  lyrics?: string[];
  stemsAvailable?: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface Playlist {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  artworkStoragePath?: string;
  description: string;
  genre: string;
  trackIds: string[];
  curator: string;
  createdAt?: number;
}

export type VisualizerMode = 
  | 'frequency-bars'
  | 'circular-spectrum'
  | 'cinematic-waveform'
  | 'particle-field'
  | 'waves-3d'
  | 'minimal-line'
  | 'club-strobe';

export interface PlayerState {
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
  lowEq: number; // -12 to +12 dB
  midEq: number;
  highEq: number;
  filterFreq: number; // 20Hz - 20000Hz
  isExpandedFullscreen: boolean;
  isVisualizerFullscreen: boolean;
}

export interface StudioStats {
  totalPlays: number;
  totalTracks: number;
  wavRemixesCount: number;
  totalHoursStreamed: number;
  trendingGenres: { genre: string; count: number }[];
}
