import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Upload, 
  Disc, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  BarChart3, 
  Music, 
  FileAudio, 
  Image as ImageIcon,
  Play, 
  Pause,
  Key,
  Lock,
  LogOut,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Radio,
  Layers,
  Settings,
  ListMusic,
  Save,
  RotateCcw,
  Search,
  Check,
  Copy,
  RefreshCw,
  Activity
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Track, Playlist, AudioFormat } from '../types';
import { 
  DEFAULT_COVER_ART, 
  DEFAULT_COVER_ART_URL, 
  getSafeCoverArt, 
  isLegacyDefaultCover 
} from '../constants/branding';
import { 
  uploadAudioFile, 
  uploadArtworkFile,
  loginAdmin,
  registerAdmin,
  signInWithGoogle,
  sendAdminPasswordReset,
  logoutAdmin,
  testFirebaseConnection,
  ConnectionTestResult,
  isFirebaseConfigured,
  isAuthorizedAdminEmail,
  getActiveFirebaseConfig,
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
  FirebaseConfig,
  UploadProgressInfo,
  getFriendlyStorageErrorMessage,
  formatBytes
} from '../services/firebase';
import { UploadTask } from 'firebase/storage';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QueuedUploadItem {
  id: string;
  file: File;
  format: AudioFormat;
  fileSizeFormatted: string;
  fileSizeBytes: number;
  duration: number;
  durationFormatted: string;
  waveformPeaks: number[];
  previewUrl: string;
  
  // Metadata fields
  title: string;
  remixTitle: string;
  originalArtist: string;
  genre: string;
  bpm: number;
  keySignature: string;
  description: string;
  tags: string;
  releaseDate: string;
  
  // Artwork
  artworkFile: File | null;
  artworkPreview: string;

  // Upload status & live telemetry
  status: 'idle' | 'uploading' | 'paused' | 'success' | 'error';
  progress: number;
  bytesTransferred?: number;
  totalBytes?: number;
  bytesFormatted?: string;
  speedFormatted?: string;
  timeRemainingFormatted?: string;
  errorMessage?: string;
  uploadTask?: UploadTask;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const { 
    tracks, 
    playlists, 
    isAdmin, 
    isCheckingAdmin,
    authUser, 
    addTrack, 
    updateTrack, 
    deleteTrack, 
    addPlaylist, 
    deletePlaylist 
  } = useMusic();

  // Authentication State
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string>('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [resetSentMessage, setResetSentMessage] = useState<string>('');
  const [copiedUid, setCopiedUid] = useState(false);

  // Connection Test Diagnostics
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Tabs: 'tracks' | 'upload' | 'playlists' | 'analytics' | 'config'
  const [activeTab, setActiveTab] = useState<'tracks' | 'upload' | 'playlists' | 'analytics' | 'config'>('tracks');

  // Multi-File Upload Queue
  const [uploadQueue, setUploadQueue] = useState<QueuedUploadItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAudioFilesSelected(e.dataTransfer.files);
    }
  };

  // Edit Track State
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editArtworkFile, setEditArtworkFile] = useState<File | null>(null);
  const [editArtworkPreview, setEditArtworkPreview] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Playlist Creator State
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [newPlaylistSubtitle, setNewPlaylistSubtitle] = useState('');
  const [newPlaylistGenre, setNewPlaylistGenre] = useState('Tech House');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);

  // Search filter inside admin
  const [adminSearch, setAdminSearch] = useState('');

  // Audio Preview in Dashboard
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Firebase Setup Form State (for live on-site configuration)
  const activeFirebaseConfig = getActiveFirebaseConfig();
  const [configForm, setConfigForm] = useState<FirebaseConfig>({
    apiKey: activeFirebaseConfig?.apiKey || '',
    authDomain: activeFirebaseConfig?.authDomain || '',
    projectId: activeFirebaseConfig?.projectId || '',
    storageBucket: activeFirebaseConfig?.storageBucket || '',
    messagingSenderId: activeFirebaseConfig?.messagingSenderId || '',
    appId: activeFirebaseConfig?.appId || ''
  });

  // Esc key dismiss listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !editingTrack) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, editingTrack, onClose]);

  // Handle Email/Password Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setResetSentMessage('');
    setIsAuthLoading(true);

    const cleanEmail = email.trim();

    // Client-side verification: prevent ordinary visitors from creating admin accounts
    if (authMode === 'register') {
      if (!isAuthorizedAdminEmail(cleanEmail)) {
        setAuthError(
          `Ordinary users cannot create administrator accounts. Only the verified studio administrator (${import.meta.env.VITE_ADMIN_EMAIL || 'djmiteshhh75@gmail.com'}) can register an admin account.`
        );
        setIsAuthLoading(false);
        return;
      }
      if (password.length < 6) {
        setAuthError('Password must be at least 6 characters long.');
        setIsAuthLoading(false);
        return;
      }
    }

    try {
      if (authMode === 'signin') {
        await loginAdmin(cleanEmail, password);
      } else {
        await registerAdmin(cleanEmail, password);
      }
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.error('Authentication error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setAuthError('Invalid email or password. Please verify your credentials.');
      } else if (err.code === 'auth/user-not-found') {
        setAuthError('No admin account found with this email. Switch to "Create Admin Account" to register.');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('This email is already registered. Please sign in with your password or use Google Sign-In.');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/too-many-requests') {
        setAuthError('Access temporarily disabled due to multiple failed login attempts. Please reset your password or try again later.');
      } else if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
        setAuthError(
          'Firebase Authentication is not yet activated in your Firebase Console for project "dj-mitesh-music".\n\n' +
          'Quick 1-Minute Fix:\n' +
          '1. Open Firebase Console: https://console.firebase.google.com/project/dj-mitesh-music/authentication\n' +
          '2. Click the blue "Get started" button under Authentication.\n' +
          '3. In the "Sign-in method" tab, click "Email/Password" and switch it to "Enable" > Save.\n' +
          '4. Click "Google", switch it to "Enable", choose support email "djmiteshhh75@gmail.com" > Save.\n' +
          '5. In "Settings" > "Authorized domains", click "Add domain" and enter "djmiteshhh-75.vercel.app".'
        );
      } else if (err.code === 'auth/operation-not-allowed') {
        setAuthError('Email/Password Sign-In is not enabled. In Firebase Console > Authentication > Sign-in method, enable Email/Password.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setAuthError(
          'This domain (djmiteshhh-75.vercel.app) is not authorized in Firebase Console.\n\n' +
          'Fix: Go to Firebase Console > Authentication > Settings > Authorized domains > Add "djmiteshhh-75.vercel.app".'
        );
      } else {
        setAuthError(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setAuthError('');
    setResetSentMessage('');
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Google sign-in popup was closed before completing.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setAuthError(
          'This domain (djmiteshhh-75.vercel.app) is not authorized for Google Sign-In.\n\n' +
          'Fix: Open Firebase Console > Authentication > Settings > Authorized domains > Click "Add domain" > Enter "djmiteshhh-75.vercel.app".'
        );
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('Popup blocked by browser. Please allow popups for djmiteshhh-75.vercel.app in your browser settings.');
      } else if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
        setAuthError(
          'Google Sign-In is not enabled in Firebase Console for project "dj-mitesh-music".\n\n' +
          'Quick 1-Minute Fix:\n' +
          '1. Open: https://console.firebase.google.com/project/dj-mitesh-music/authentication/providers\n' +
          '2. Click "Get started" (if prompted).\n' +
          '3. Under "Sign-in method", click "Google" > Click "Enable".\n' +
          '4. Select your support email (djmiteshhh75@gmail.com) and click "Save".\n' +
          '5. In "Settings" > "Authorized domains", add "djmiteshhh-75.vercel.app".'
        );
      } else if (err.code === 'auth/operation-not-allowed') {
        setAuthError('Google Sign-In is disabled in Firebase Console. Go to Authentication > Sign-in method and enable Google.');
      } else {
        setAuthError(err.message || 'Google sign-in failed. Please verify Authentication is enabled in Firebase Console.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError('Please enter your admin email in the box above to receive a password reset link.');
      return;
    }
    setAuthError('');
    try {
      await sendAdminPasswordReset(email);
      setResetSentMessage(`Password reset link sent to ${email}. Please check your inbox and spam folder.`);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to send password reset email.');
    }
  };

  // Copy UID helper
  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  // Handle Diagnostics Test
  const handleRunConnectionTest = async () => {
    setIsTestingConnection(true);
    try {
      const res = await testFirebaseConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        connected: false,
        authReady: false,
        firestoreReady: false,
        storageReady: false,
        details: err.message || 'Connection test failed.'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
  };

  // Sign out and immediately prompt Google account chooser to switch accounts
  const handleSignOutAndSwitchAccount = async () => {
    try {
      await logoutAdmin();
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        console.warn('Switch account error:', err);
      }
    }
  };

  // -------------------------------------------------------------
  // MULTI-FILE AUDIO QUEUE INGESTION & DECODING
  // -------------------------------------------------------------
  const handleAudioFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newItems: QueuedUploadItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      // Prevent duplicate file uploads
      const isDuplicate = uploadQueue.some(
        q => q.file.name === file.name && q.file.size === file.size
      );
      if (isDuplicate) {
        continue;
      }

      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      const nameLower = file.name.toLowerCase();
      let format: AudioFormat = 'WAV';
      if (nameLower.endsWith('.flac')) format = 'FLAC';
      else if (nameLower.endsWith('.mp3')) format = 'MP3';
      else if (nameLower.endsWith('.m4a')) format = 'M4A';
      else if (nameLower.endsWith('.ogg')) format = 'OGG';

      // Guess clean track title from file name
      const cleanTitle = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());

      // Create local preview object URL
      const previewUrl = URL.createObjectURL(file);

      // Extract duration efficiently without freezing the main thread
      let extractedDuration = 210;
      try {
        const audioEl = new Audio();
        audioEl.preload = 'metadata';
        audioEl.src = previewUrl;
        await new Promise((resolve) => {
          audioEl.onloadedmetadata = () => {
            if (audioEl.duration && !isNaN(audioEl.duration) && isFinite(audioEl.duration)) {
              extractedDuration = Math.round(audioEl.duration);
            }
            resolve(null);
          };
          audioEl.onerror = () => resolve(null);
          setTimeout(() => resolve(null), 1200);
        });
      } catch (metaErr) {
        console.warn('Audio metadata fallback:', metaErr);
      }

      // Generate dynamic visualizer peaks quickly without freezing
      const peaks: number[] = [];
      const seed = (file.size % 997) + file.name.length;
      for (let b = 0; b < 72; b++) {
        const val = 0.2 + 0.7 * Math.abs(Math.sin((seed + b * 13) * 0.17));
        peaks.push(parseFloat(val.toFixed(2)));
      }

      const durMins = Math.floor(extractedDuration / 60);
      const durSecs = extractedDuration % 60;
      const durationFormatted = `${durMins}:${durSecs < 10 ? '0' : ''}${durSecs}`;

      newItems.push({
        id: `queue-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        format,
        fileSizeFormatted: `${sizeInMB} MB`,
        fileSizeBytes: file.size,
        duration: extractedDuration,
        durationFormatted,
        waveformPeaks: peaks,
        previewUrl,
        title: cleanTitle,
        remixTitle: 'VIP Club Edit',
        originalArtist: 'DJ Miteshhh 75',
        genre: 'Tech House / Big Room',
        bpm: 128,
        keySignature: '8A (A Minor)',
        description: 'Mastered in 24-bit original lossless quality.',
        tags: 'WAV, VIP, Remix, Club',
        releaseDate: new Date().toISOString().split('T')[0],
        artworkFile: null,
        artworkPreview: DEFAULT_COVER_ART,
        status: 'idle',
        progress: 0
      });
    }

    if (newItems.length > 0) {
      setUploadQueue(prev => [...prev, ...newItems]);
      setActiveTab('upload');
    }
  };

  const updateQueueItem = (id: string, updates: Partial<QueuedUploadItem>) => {
    setUploadQueue(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeQueueItem = (id: string) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
  };

  // Upload an individual queued track to Firebase Storage & Cloud Firestore
  const uploadSingleItem = async (item: QueuedUploadItem) => {
    if (!isFirebaseConfigured) {
      updateQueueItem(item.id, {
        status: 'error',
        errorMessage: 'Firebase is not configured. Please add your Firebase credentials in the Config tab.'
      });
      return;
    }

    updateQueueItem(item.id, { 
      status: 'uploading', 
      progress: 0, 
      bytesTransferred: 0,
      totalBytes: item.fileSizeBytes,
      errorMessage: undefined 
    });

    try {
      const trackId = `track-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // 1. Upload Audio to Firebase Storage with real-time resumable telemetry
      const audioResult = await uploadAudioFile(
        item.file,
        trackId,
        (progressInfo: UploadProgressInfo) => {
          updateQueueItem(item.id, {
            progress: progressInfo.percentage,
            bytesTransferred: progressInfo.bytesTransferred,
            totalBytes: progressInfo.totalBytes,
            bytesFormatted: progressInfo.bytesFormatted,
            speedFormatted: progressInfo.speedFormatted,
            timeRemainingFormatted: progressInfo.timeRemainingFormatted,
            status: progressInfo.state === 'paused' ? 'paused' : 'uploading'
          });
        },
        (task) => updateQueueItem(item.id, { uploadTask: task })
      );

      // 2. Upload Artwork to Firebase Storage if custom artwork was selected
      let artworkUrl = item.artworkPreview;
      let artworkStoragePath = '';

      if (item.artworkFile) {
        const artResult = await uploadArtworkFile(item.artworkFile, trackId);
        artworkUrl = artResult.downloadUrl;
        artworkStoragePath = artResult.storagePath;
      } else if (!artworkUrl || isLegacyDefaultCover(artworkUrl) || artworkUrl === DEFAULT_COVER_ART) {
        // Automatically apply permanent official DJ Miteshhh 75 default cover
        artworkUrl = DEFAULT_COVER_ART_URL;
      }

      // 3. Create Track Document in Cloud Firestore
      const newTrack: Track = {
        id: trackId,
        title: item.title,
        remixTitle: item.remixTitle || 'Club Mix',
        originalArtist: item.originalArtist || 'DJ Miteshhh 75',
        remixer: 'DJ Miteshhh 75',
        genre: item.genre,
        bpm: Number(item.bpm) || 128,
        key: item.keySignature || '8A',
        duration: item.duration,
        durationFormatted: item.durationFormatted,
        format: item.format,
        bitDepth: item.format === 'WAV' ? '24-bit' : undefined,
        sampleRate: '96 kHz',
        fileSizeFormatted: item.fileSizeFormatted,
        fileSizeBytes: item.fileSizeBytes,
        audioUrl: audioResult.downloadUrl,
        audioStoragePath: audioResult.storagePath,
        coverUrl: artworkUrl,
        artworkStoragePath: artworkStoragePath || undefined,
        waveformPeaks: item.waveformPeaks,
        plays: 0,
        likes: 0,
        isFavorite: false,
        featured: false,
        published: true,
        releaseDate: item.releaseDate || new Date().toISOString().split('T')[0],
        tags: item.tags.split(',').map(t => t.trim()).filter(Boolean),
        description: item.description,
        stemsAvailable: true,
        createdAt: Date.now()
      };

      await addTrack(newTrack);

      updateQueueItem(item.id, { status: 'success', progress: 100 });
      
      // Auto-remove completed item after 2 seconds
      setTimeout(() => {
        removeQueueItem(item.id);
      }, 2000);

    } catch (err: any) {
      console.error('Upload failed:', err);
      const friendlyError = getFriendlyStorageErrorMessage(err);
      updateQueueItem(item.id, {
        status: 'error',
        errorMessage: friendlyError
      });
    }
  };

  // Upload All Items in Queue
  const uploadAllQueued = async () => {
    setIsProcessingQueue(true);
    for (const item of uploadQueue) {
      if (item.status !== 'success') {
        await uploadSingleItem(item);
      }
    }
    setIsProcessingQueue(false);
  };

  // Pause an active upload
  const pauseItemUpload = (item: QueuedUploadItem) => {
    if (item.uploadTask && item.status === 'uploading') {
      try {
        item.uploadTask.pause();
        updateQueueItem(item.id, { status: 'paused' });
      } catch (e) {
        console.warn('Could not pause upload:', e);
      }
    }
  };

  // Resume a paused upload
  const resumeItemUpload = (item: QueuedUploadItem) => {
    if (item.uploadTask && item.status === 'paused') {
      try {
        item.uploadTask.resume();
        updateQueueItem(item.id, { status: 'uploading' });
      } catch (e) {
        console.warn('Could not resume upload:', e);
      }
    }
  };

  // Retry a failed upload
  const retryItemUpload = (item: QueuedUploadItem) => {
    uploadSingleItem(item);
  };

  // Cancel an active upload
  const cancelItemUpload = (item: QueuedUploadItem) => {
    if (item.uploadTask) {
      try {
        item.uploadTask.cancel();
      } catch (e) {
        console.warn('Could not cancel upload:', e);
      }
    }
    updateQueueItem(item.id, { status: 'idle', progress: 0, uploadTask: undefined });
  };

  // Handle Edit Track Save
  const handleSaveEdit = async () => {
    if (!editingTrack) return;
    setIsSavingEdit(true);

    try {
      let coverUrl = editingTrack.coverUrl;
      let artworkStoragePath = editingTrack.artworkStoragePath;

      if (editArtworkFile) {
        const artResult = await uploadArtworkFile(editArtworkFile, editingTrack.id);
        coverUrl = artResult.downloadUrl;
        artworkStoragePath = artResult.storagePath;
      } else if (!coverUrl || isLegacyDefaultCover(coverUrl)) {
        coverUrl = DEFAULT_COVER_ART_URL;
        artworkStoragePath = undefined;
      }

      await updateTrack({
        ...editingTrack,
        coverUrl,
        artworkStoragePath
      });

      setEditingTrack(null);
      setEditArtworkFile(null);
      setEditArtworkPreview('');
    } catch (err) {
      console.error('Failed to update track:', err);
      alert('Failed to save track changes.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Create Playlist
  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle) return;

    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      title: newPlaylistTitle,
      subtitle: newPlaylistSubtitle || 'Curated DJ Set',
      genre: newPlaylistGenre,
      description: newPlaylistDesc || 'Curated by DJ Miteshhh 75',
      coverUrl: DEFAULT_COVER_ART_URL,
      trackIds: selectedTrackIds,
      curator: 'DJ Miteshhh 75',
      createdAt: Date.now()
    };

    await addPlaylist(newPlaylist);
    setNewPlaylistTitle('');
    setNewPlaylistSubtitle('');
    setNewPlaylistDesc('');
    setSelectedTrackIds([]);
  };

  // Preview audio in dashboard
  const handleTogglePreview = (url: string, id: string) => {
    if (previewTrackId === id) {
      previewAudioRef.current?.pause();
      setPreviewTrackId(null);
    } else {
      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio();
      }
      previewAudioRef.current.src = url;
      previewAudioRef.current.play();
      setPreviewTrackId(id);
    }
  };

  // Filtered tracks in admin
  const adminFilteredTracks = tracks.filter(t => 
    t.title.toLowerCase().includes(adminSearch.toLowerCase()) ||
    t.remixTitle.toLowerCase().includes(adminSearch.toLowerCase()) ||
    t.originalArtist.toLowerCase().includes(adminSearch.toLowerCase()) ||
    t.genre.toLowerCase().includes(adminSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-2 sm:p-6 overscroll-contain select-none"
    >
      <div className="relative w-full max-w-6xl h-[92vh] rounded-3xl bg-[#080911] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCE1EA]/15 bg-[#11131B]/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7957FF] to-[#64DFFF] p-0.5 shadow-[0_0_15px_rgba(121,87,255,0.4)]">
              <div className="w-full h-full bg-[#07080C] rounded-[10px] flex items-center justify-center text-[#64DFFF]">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-white text-base sm:text-lg">
                  STUDIO CONTROL ROOM // OBSIDIAN FREQUENCY
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  isFirebaseConfigured 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {isFirebaseConfigured ? 'FIREBASE CLOUD READY' : 'CONFIG REQUIRED'}
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#A5ADBD]">
                {isAdmin 
                  ? `LOGGED IN AS ADMIN: ${authUser?.email || 'STUDIO MASTER'}`
                  : authUser 
                    ? `SIGNED IN (VISITOR): ${authUser.email || 'USER'}`
                    : 'ENTER SECURE CREDENTIALS TO ACCESS UPLOADS'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {authUser && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">LOG OUT</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title="Close Control Room (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1A: ADMIN CLEARANCE VERIFICATION LOADING */}
        {/* ------------------------------------------------------------- */}
        {isCheckingAdmin ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 text-center">
            <RefreshCw className="w-8 h-8 text-dj-cyan animate-spin" />
            <h4 className="font-display font-bold text-white text-base tracking-wide">
              VERIFYING STUDIO CLEARANCE...
            </h4>
            <p className="text-xs text-zinc-400 font-mono">
              Validating administrator security credentials and permissions.
            </p>
          </div>
        ) : authUser && !isAdmin ? (

          /* ------------------------------------------------------------- */
          /* VIEW 1B: AUTHENTICATED VISITOR BUT NOT AUTHORIZED ADMIN */
          /* ------------------------------------------------------------- */
          <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
            <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-red-500/20 space-y-6 text-center shadow-[0_0_30px_rgba(239,68,68,0.15)]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 p-0.5 mx-auto">
                <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center text-red-400">
                  <ShieldAlert className="w-8 h-8" />
                </div>
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-violet-500/10 text-dj-cyan border border-violet-500/30 text-[10px] font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  SIGNED IN • VIP LISTENER
                </span>
                <h4 className="text-xl font-display font-bold text-white uppercase mt-2">
                  LISTENER ACCOUNT ACTIVE
                </h4>
                <p className="text-xs text-zinc-400 mt-2 font-sans leading-relaxed">
                  You are signed in as <strong className="text-white font-mono">{authUser.email || 'Authenticated User'}</strong>. 
                  Studio Control Room uploads are restricted to the verified administrator (<strong className="text-dj-cyan font-mono">djmiteshhh75@gmail.com</strong>).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/5 text-left space-y-2 text-xs font-mono">
                <div className="text-zinc-400 text-[11px] font-bold">YOUR USER ID (UID):</div>
                <div className="flex items-center justify-between gap-2 bg-zinc-900 p-2.5 rounded-lg border border-white/5">
                  <span className="truncate text-zinc-300 font-mono text-[11px] select-all">{authUser.uid}</span>
                  <button
                    onClick={() => handleCopyUid(authUser.uid)}
                    className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white shrink-0"
                    title="Copy UID"
                  >
                    {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 pt-1 leading-relaxed">
                  You have full public access to listen to all 24-bit tracks, create playlists, and use the DJ audio console on all devices.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-display font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:brightness-110 transition-all active:scale-95"
                >
                  RETURN TO PUBLIC MUSIC PLAYER
                </button>
                <button
                  onClick={handleSignOutAndSwitchAccount}
                  className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-dj-cyan" />
                  <span>SIGN OUT & SWITCH GOOGLE ACCOUNT</span>
                </button>
              </div>
            </div>
          </div>
        ) : !isAdmin ? (

          /* ------------------------------------------------------------- */
          /* VIEW 1C: LOGIN & REGISTRATION (GOOGLE + EMAIL/PASSWORD) */
          /* ------------------------------------------------------------- */
          <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
            <div className="max-w-md w-full glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-5 text-center">
              
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5 mx-auto shadow-[0_0_25px_rgba(139,92,246,0.5)]">
                <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                  <Lock className="w-7 h-7 text-dj-cyan" />
                </div>
              </div>

              <div>
                <h4 className="text-xl font-display font-bold text-white uppercase tracking-tight">
                  ADMIN AUTHENTICATION
                </h4>
                <p className="text-xs text-zinc-400 mt-1 font-sans">
                  Sign in with your verified administrator credentials to access the live upload and studio control room.
                </p>
              </div>

              {/* 1. Google Sign-In Provider Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isAuthLoading}
                className="w-full py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs font-mono flex items-center justify-center gap-3 shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-zinc-900" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                )}
                <span>{isGoogleLoading ? 'AUTHENTICATING GOOGLE...' : 'SIGN IN WITH GOOGLE'}</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">OR WITH EMAIL</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center rounded-xl bg-zinc-950 p-1 border border-white/10 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setAuthError(''); setResetSentMessage(''); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    authMode === 'signin' ? 'bg-violet-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  SIGN IN
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); setResetSentMessage(''); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    authMode === 'register' ? 'bg-violet-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  CREATE ADMIN ACCOUNT
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-left">
                {authMode === 'register' && (
                  <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/25 text-[11px] text-zinc-300 font-mono space-y-1">
                    <div className="text-violet-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>ADMINISTRATOR REGISTRATION POLICY</span>
                    </div>
                    <p className="text-zinc-400 leading-relaxed text-[11px]">
                      Only the verified studio administrator (<span className="text-dj-cyan font-bold select-all">djmiteshhh75@gmail.com</span>) is authorized to create the admin account. Ordinary visitors cannot register.
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-mono text-zinc-400">ADMIN EMAIL</label>
                  <input
                    type="email"
                    placeholder={authMode === 'register' ? 'djmiteshhh75@gmail.com' : 'admin@djmitesh75.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white focus:outline-none focus:border-violet-500 font-mono transition-colors min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-zinc-400">PASSWORD</label>
                    {authMode === 'signin' && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-[11px] font-mono text-dj-cyan hover:underline py-1"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white focus:outline-none focus:border-violet-500 font-mono transition-colors min-h-[44px]"
                  />
                </div>

                {resetSentMessage && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-mono flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{resetSentMessage}</span>
                  </div>
                )}

                {authError && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-mono flex items-start gap-2.5 whitespace-pre-line leading-relaxed text-left">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <span className="flex-1">{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthLoading || isGoogleLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold text-xs tracking-wider shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:scale-102 active:scale-98 transition-all disabled:opacity-50 uppercase font-mono"
                >
                  {isAuthLoading ? 'AUTHENTICATING...' : authMode === 'signin' ? 'UNLOCK CONTROL ROOM' : 'CREATE ADMIN ACCOUNT'}
                </button>
              </form>

              {/* Notice if Firebase is not yet configured */}
              {!isFirebaseConfigured && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-mono text-left space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Firebase Credentials Notice</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Your Firebase project credentials need to be set in .env or the setup wizard below to enable live cloud authentication.
                  </p>
                  <button
                    onClick={() => setActiveTab('config')}
                    className="text-dj-cyan underline text-[11px] pt-1 block"
                  >
                    Open Firebase Live Config Wizard →
                  </button>
                </div>
              )}

              <div className="text-[11px] font-mono text-zinc-500">
                PROTECTED ACCESS • SECURE FIREBASE AUTHENTICATION
              </div>
            </div>
          </div>
        ) : (

          /* ------------------------------------------------------------- */
          /* VIEW 2: AUTHENTICATED ADMIN CONTROL ROOM */
          /* ------------------------------------------------------------- */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 bg-zinc-950/60 overflow-x-auto">
              <button
                onClick={() => setActiveTab('tracks')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all whitespace-nowrap ${
                  activeTab === 'tracks' ? 'bg-violet-600 text-white font-bold shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>MY TRACKS ({tracks.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all whitespace-nowrap ${
                  activeTab === 'upload' ? 'bg-violet-600 text-white font-bold shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>UPLOAD AUDIO {uploadQueue.length > 0 ? `(${uploadQueue.length})` : ''}</span>
              </button>

              <button
                onClick={() => setActiveTab('playlists')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all whitespace-nowrap ${
                  activeTab === 'playlists' ? 'bg-violet-600 text-white font-bold shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5" />
                <span>PLAYLISTS ({playlists.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all whitespace-nowrap ${
                  activeTab === 'analytics' ? 'bg-violet-600 text-white font-bold shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>STATS & PLAYS</span>
              </button>

              <button
                onClick={() => setActiveTab('config')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all whitespace-nowrap ${
                  activeTab === 'config' ? 'bg-violet-600 text-white font-bold shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>FIREBASE SETUP</span>
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              
              {/* ------------------------------------------------------- */}
              {/* TAB: TRACKS MANAGER */}
              {/* ------------------------------------------------------- */}
              {activeTab === 'tracks' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
                    <div>
                      <h4 className="font-display font-bold text-white text-lg">UPLOADED SONGS VAULT</h4>
                      <p className="text-xs text-zinc-400">
                        {tracks.length === 0 ? 'Your music library is currently empty.' : `${tracks.length} songs live in Cloud Firestore & Storage.`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Search uploaded tracks..."
                          value={adminSearch}
                          onChange={(e) => setAdminSearch(e.target.value)}
                          className="pl-8 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs text-white font-mono"
                        />
                      </div>

                      <button
                        onClick={() => setActiveTab('upload')}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-mono text-xs font-bold shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>UPLOAD AUDIO</span>
                      </button>
                    </div>
                  </div>

                  {tracks.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl glass-card border border-white/5 space-y-4">
                      <Music className="w-12 h-12 text-zinc-600 mx-auto" />
                      <h3 className="text-lg font-bold text-white font-display">No Remixes Uploaded Yet</h3>
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto font-sans">
                        Drag and drop your original WAV, MP3, FLAC, M4A, or OGG master audio files in the upload tab.
                      </p>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-bold transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        <span>GO TO UPLOAD AREA</span>
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/5 overflow-hidden bg-zinc-950/70">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-zinc-900/80 text-zinc-400 border-b border-white/5">
                          <tr>
                            <th className="p-3.5">TRACK</th>
                            <th className="p-3.5 hidden sm:table-cell">GENRE</th>
                            <th className="p-3.5 hidden md:table-cell">FORMAT / SIZE</th>
                            <th className="p-3.5">BPM</th>
                            <th className="p-3.5 hidden sm:table-cell">PLAYS</th>
                            <th className="p-3.5 text-right">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {adminFilteredTracks.map((track) => {
                            const isPreviewing = previewTrackId === track.id;
                            return (
                              <tr key={track.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-3.5">
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => handleTogglePreview(track.audioUrl, track.id)}
                                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                        isPreviewing ? 'bg-cyan-500 text-zinc-950' : 'bg-white/10 text-white hover:bg-violet-600'
                                      }`}
                                      title={isPreviewing ? 'Pause Preview' : 'Play Audio Preview'}
                                    >
                                      {isPreviewing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                                    </button>
                                    <img src={getSafeCoverArt(track.coverUrl)} alt={track.title} className="w-9 h-9 rounded-lg object-cover" />
                                    <div className="min-w-0">
                                      <div className="font-bold text-white truncate max-w-xs">{track.title}</div>
                                      <div className="text-[11px] text-zinc-400 truncate">{track.remixTitle}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3.5 hidden sm:table-cell text-zinc-400">
                                  {track.genre}
                                </td>
                                <td className="p-3.5 hidden md:table-cell">
                                  <span className="px-2 py-0.5 rounded bg-violet-600/20 text-violet-300 border border-violet-500/20 text-[10px] font-bold">
                                    {track.format} {track.bitDepth || ''}
                                  </span>
                                  <span className="text-zinc-500 text-[10px] ml-2">{track.fileSizeFormatted}</span>
                                </td>
                                <td className="p-3.5 text-zinc-300 font-bold">
                                  {track.bpm}
                                </td>
                                <td className="p-3.5 hidden sm:table-cell text-zinc-400">
                                  {(track.plays || 0).toLocaleString()}
                                </td>
                                <td className="p-3.5 text-right space-x-2">
                                  <button
                                    onClick={() => updateTrack({ ...track, published: !track.published })}
                                    className={`p-1.5 rounded-lg border transition-colors ${
                                      track.published ? 'text-emerald-400 border-emerald-500/30' : 'text-zinc-500 border-white/5'
                                    }`}
                                    title={track.published ? 'Published to Public' : 'Unpublished (Hidden from Public)'}
                                  >
                                    {track.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                  </button>

                                  <button
                                    onClick={() => {
                                      setEditingTrack(track);
                                      setEditArtworkPreview(getSafeCoverArt(track.coverUrl));
                                    }}
                                    className="p-1.5 rounded-lg border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                                    title="Edit Track Metadata"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete "${track.title}"? This permanently deletes the track from the studio.`)) {
                                        deleteTrack(track);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
                                    title="Delete Permanently from Cloud"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------- */}
              {/* TAB: MULTI-FILE AUDIO UPLOAD QUEUE */}
              {/* ------------------------------------------------------- */}
              {activeTab === 'upload' && (
                <div className="space-y-6">
                  
                  {/* Large Drag and Drop Audio Zone */}
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`p-8 sm:p-12 rounded-3xl border-2 border-dashed text-center space-y-4 group transition-all cursor-pointer ${
                      isDragging 
                        ? 'border-[#7857FF] bg-[#7857FF]/15 scale-[1.01] shadow-[0_0_30px_rgba(120,87,255,0.3)]' 
                        : 'border-white/15 hover:border-[#7857FF]/50 bg-zinc-950/60'
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      accept=".wav,.mp3,.flac,.m4a,.ogg,audio/*"
                      id="multi-audio-upload"
                      className="hidden"
                      onChange={(e) => handleAudioFilesSelected(e.target.files)}
                    />
                    <label htmlFor="multi-audio-upload" className="cursor-pointer block space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5 mx-auto group-hover:scale-105 transition-transform shadow-[0_0_25px_rgba(139,92,246,0.5)]">
                        <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center text-dj-cyan">
                          <Upload className="w-8 h-8" />
                        </div>
                      </div>
                      <h4 className="text-lg font-bold font-display text-white">
                        CLICK OR DRAG MASTER AUDIO FILES HERE
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans max-w-md mx-auto">
                        Upload single or multiple files directly from your laptop. Supports <strong className="text-dj-cyan">24-bit WAV</strong>, FLAC, 320kbps MP3, M4A, and OGG formats. Original quality is preserved without conversion.
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                        <span>CLOUDINARY MEDIA VAULT & FIRESTORE READY</span>
                      </div>
                    </label>
                  </div>

                  {/* Queued Files Processing List */}
                  {uploadQueue.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-white">
                          UPLOAD QUEUE ({uploadQueue.length} {uploadQueue.length === 1 ? 'TRACK' : 'TRACKS'})
                        </span>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setUploadQueue([])}
                            className="text-xs font-mono text-zinc-500 hover:text-zinc-300"
                          >
                            Clear Queue
                          </button>
                          <button
                            onClick={uploadAllQueued}
                            disabled={isProcessingQueue}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-mono text-xs font-bold shadow-md hover:scale-102 active:scale-98 transition-all disabled:opacity-50"
                          >
                            {isProcessingQueue ? 'UPLOADING TO STORAGE...' : 'UPLOAD ALL TRACKS'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {uploadQueue.map((item, index) => (
                          <div
                            key={item.id}
                            className="p-5 rounded-2xl bg-zinc-950 border border-white/10 space-y-4 shadow-lg"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  onClick={() => handleTogglePreview(item.previewUrl, item.id)}
                                  className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-violet-600 shrink-0"
                                  title="Listen to local file preview"
                                >
                                  {previewTrackId === item.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                                </button>
                                <div className="min-w-0">
                                  <div className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md">
                                    {item.file.name}
                                  </div>
                                  <div className="text-xs font-mono text-zinc-400">
                                    <span className="text-dj-cyan font-bold">{item.format}</span> • {item.fileSizeFormatted} • {item.durationFormatted}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                {item.status === 'uploading' ? (
                                  <>
                                    <button
                                      onClick={() => pauseItemUpload(item)}
                                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-amber-500/20 text-xs font-mono text-zinc-300 hover:text-amber-300 transition-colors flex items-center gap-1"
                                      title="Pause Upload"
                                    >
                                      <Pause className="w-3.5 h-3.5" />
                                      <span>Pause</span>
                                    </button>
                                    <button
                                      onClick={() => cancelItemUpload(item)}
                                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-xs font-mono text-zinc-300 hover:text-red-300 transition-colors"
                                      title="Cancel Upload"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : item.status === 'paused' ? (
                                  <>
                                    <button
                                      onClick={() => resumeItemUpload(item)}
                                      className="px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-mono font-bold text-white transition-colors flex items-center gap-1"
                                      title="Resume Upload"
                                    >
                                      <Play className="w-3.5 h-3.5 fill-white" />
                                      <span>Resume</span>
                                    </button>
                                    <button
                                      onClick={() => cancelItemUpload(item)}
                                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-xs font-mono text-zinc-300 hover:text-red-300 transition-colors"
                                      title="Cancel Upload"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : item.status === 'error' ? (
                                  <button
                                    onClick={() => retryItemUpload(item)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-bold transition-colors"
                                    title="Retry Upload to Cloudinary"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Retry</span>
                                  </button>
                                ) : item.status === 'success' ? (
                                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-mono">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Uploaded</span>
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => uploadSingleItem(item)}
                                    className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-bold shadow transition-colors"
                                  >
                                    Upload Track
                                  </button>
                                )}

                                <button
                                  onClick={() => removeQueueItem(item.id)}
                                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400"
                                  title="Remove from queue"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Real-time Resumable Upload Progress & Telemetry */}
                            {item.status === 'uploading' && (
                              <div className="space-y-1.5 p-3 rounded-xl bg-violet-950/20 border border-violet-500/20">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono">
                                  <div className="flex items-center gap-2">
                                    <span className="text-dj-cyan font-bold flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                                      STREAMING AUDIO BYTES...
                                    </span>
                                    {item.speedFormatted && (
                                      <span className="text-zinc-400 font-medium">• {item.speedFormatted}</span>
                                    )}
                                    {item.timeRemainingFormatted && (
                                      <span className="text-zinc-500 hidden sm:inline">• {item.timeRemainingFormatted}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between sm:justify-end gap-3 text-zinc-400">
                                    {item.bytesFormatted && (
                                      <span className="text-zinc-400 text-[11px]">{item.bytesFormatted}</span>
                                    )}
                                    <span className="text-dj-cyan font-bold text-sm">{item.progress}%</span>
                                  </div>
                                </div>
                                <div className="h-2.5 w-full bg-zinc-800/80 rounded-full overflow-hidden p-0.5">
                                  <div
                                    className="h-full bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-400 rounded-full transition-all duration-200"
                                    style={{ width: `${item.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Paused Upload State */}
                            {item.status === 'paused' && (
                              <div className="space-y-1.5 p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
                                <div className="flex items-center justify-between text-xs font-mono text-amber-300">
                                  <span className="font-bold flex items-center gap-1.5">
                                    <Pause className="w-3.5 h-3.5" />
                                    UPLOAD PAUSED
                                  </span>
                                  <span className="font-bold">{item.progress}%</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-amber-500 rounded-full transition-all duration-150"
                                    style={{ width: `${item.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Error Message with Quick Retry */}
                            {item.status === 'error' && (
                              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start justify-between gap-3 text-xs font-mono text-red-300">
                                <div className="space-y-1">
                                  <div className="font-bold flex items-center gap-1.5 text-red-400">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>UPLOAD FAILED</span>
                                  </div>
                                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                                    {item.errorMessage || 'Audio upload encountered an error. Please verify network connection.'}
                                  </p>
                                </div>
                                <button
                                  onClick={() => retryItemUpload(item)}
                                  className="px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600 text-white font-mono text-xs font-bold transition-colors shrink-0 flex items-center gap-1"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Retry</span>
                                </button>
                              </div>
                            )}

                            {/* Metadata Editor Grid for this file */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                              <div>
                                <label className="text-zinc-500 block mb-1">TRACK TITLE</label>
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => updateQueueItem(item.id, { title: e.target.value })}
                                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-violet-500"
                                />
                              </div>

                              <div>
                                <label className="text-zinc-500 block mb-1">REMIX SUBTITLE</label>
                                <input
                                  type="text"
                                  value={item.remixTitle}
                                  onChange={(e) => updateQueueItem(item.id, { remixTitle: e.target.value })}
                                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-violet-500"
                                />
                              </div>

                              <div>
                                <label className="text-zinc-500 block mb-1">ORIGINAL ARTIST</label>
                                <input
                                  type="text"
                                  value={item.originalArtist}
                                  onChange={(e) => updateQueueItem(item.id, { originalArtist: e.target.value })}
                                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-violet-500"
                                />
                              </div>

                              <div>
                                <label className="text-zinc-500 block mb-1">GENRE</label>
                                <select
                                  value={item.genre}
                                  onChange={(e) => updateQueueItem(item.id, { genre: e.target.value })}
                                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                                >
                                  <option value="Tech House / Big Room">Tech House / Big Room</option>
                                  <option value="Bollywood Melodic">Bollywood Melodic</option>
                                  <option value="Punjabi Bass / Drill">Punjabi Bass / Drill</option>
                                  <option value="Cyber Club / Bollywood">Cyber Club / Bollywood</option>
                                  <option value="Melodic Techno">Melodic Techno</option>
                                  <option value="Psy-Trance">Psy-Trance (138)</option>
                                  <option value="Afro House">Afro House</option>
                                  <option value="Lo-Fi Chill Remix">Lo-Fi Chill Remix</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-zinc-500 block mb-1">BPM</label>
                                <input
                                  type="number"
                                  value={item.bpm}
                                  onChange={(e) => updateQueueItem(item.id, { bpm: parseInt(e.target.value) || 128 })}
                                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-violet-500"
                                />
                              </div>

                              <div>
                                <label className="text-zinc-500 block mb-1">MUSICAL KEY</label>
                                <input
                                  type="text"
                                  value={item.keySignature}
                                  onChange={(e) => updateQueueItem(item.id, { keySignature: e.target.value })}
                                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-violet-500"
                                />
                              </div>
                            </div>

                            {/* Artwork selection row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/5">
                              <div className="flex items-center gap-3 min-w-0">
                                <img 
                                  src={getSafeCoverArt(item.artworkPreview)} 
                                  alt="Artwork Preview" 
                                  className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0 shadow-md" 
                                />
                                <div className="min-w-0">
                                  <div className="text-[11px] font-mono text-white font-medium truncate">
                                    {item.artworkFile ? item.artworkFile.name : 'DJ Miteshhh 75 Official Cover (Default)'}
                                  </div>
                                  <div className="text-[10px] font-mono text-zinc-500">
                                    {item.artworkFile ? 'Custom cover selected for this song' : 'Permanent branding applied automatically'}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/30 text-xs font-mono text-zinc-300 cursor-pointer transition-colors">
                                  <ImageIcon className="w-3.5 h-3.5 text-dj-cyan" />
                                  <span>{item.artworkFile ? 'Change Cover' : 'Upload Custom Cover'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => updateQueueItem(item.id, {
                                          artworkFile: file,
                                          artworkPreview: ev.target?.result as string
                                        });
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>

                                {item.artworkFile && (
                                  <button
                                    type="button"
                                    onClick={() => updateQueueItem(item.id, {
                                      artworkFile: null,
                                      artworkPreview: DEFAULT_COVER_ART
                                    })}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-mono transition-colors"
                                    title="Restore official default cover"
                                  >
                                    Reset Default
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------- */}
              {/* TAB: PLAYLISTS CREATOR & MANAGER */}
              {/* ------------------------------------------------------- */}
              {activeTab === 'playlists' && (
                <div className="space-y-6">
                  {/* Create Playlist Form */}
                  <form onSubmit={handleCreatePlaylist} className="p-6 rounded-2xl bg-zinc-950 border border-white/10 space-y-4">
                    <h4 className="font-display font-bold text-white text-base">CREATE NEW CURATED PLAYLIST</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                      <div>
                        <label className="text-zinc-400 block mb-1">PLAYLIST TITLE *</label>
                        <input
                          type="text"
                          placeholder="e.g. Midnight Club Sessions"
                          value={newPlaylistTitle}
                          onChange={(e) => setNewPlaylistTitle(e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-400 block mb-1">SUBTITLE</label>
                        <input
                          type="text"
                          placeholder="e.g. Dark Tech House Bangers"
                          value={newPlaylistSubtitle}
                          onChange={(e) => setNewPlaylistSubtitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-400 block mb-1">GENRE</label>
                        <input
                          type="text"
                          placeholder="e.g. Tech House / Bollywood Bass"
                          value={newPlaylistGenre}
                          onChange={(e) => setNewPlaylistGenre(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    <div className="text-xs font-mono">
                      <label className="text-zinc-400 block mb-1">DESCRIPTION</label>
                      <input
                        type="text"
                        placeholder="Curated for peak-time club sets..."
                        value={newPlaylistDesc}
                        onChange={(e) => setNewPlaylistDesc(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    {/* Track selection checkboxes */}
                    {tracks.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-mono text-zinc-400 block">SELECT TRACKS TO INCLUDE</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-zinc-900/60 rounded-xl border border-white/5">
                          {tracks.map(t => {
                            const isChecked = selectedTrackIds.includes(t.id);
                            return (
                              <label key={t.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer text-xs font-mono">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedTrackIds(prev => prev.filter(id => id !== t.id));
                                    } else {
                                      setSelectedTrackIds(prev => [...prev, t.id]);
                                    }
                                  }}
                                  className="accent-dj-cyan"
                                />
                                <span className="text-white truncate">{t.title}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-bold transition-all shadow"
                    >
                      SAVE PLAYLIST TO FIRESTORE
                    </button>
                  </form>

                  {/* Existing Playlists Table */}
                  <div className="space-y-3">
                    <h5 className="font-mono text-xs font-bold text-white uppercase">EXISTING PLAYLISTS ({playlists.length})</h5>
                    {playlists.length === 0 ? (
                      <div className="p-8 text-center rounded-xl bg-zinc-950/60 border border-white/5 text-xs font-mono text-zinc-500">
                        No playlists created yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {playlists.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-white/5 text-xs font-mono">
                            <div>
                              <div className="font-bold text-white">{p.title}</div>
                              <div className="text-[11px] text-zinc-400">{p.subtitle} • {p.trackIds.length} tracks</div>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm(`Delete playlist "${p.title}"?`)) {
                                  deletePlaylist(p.id);
                                }
                              }}
                              className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------- */}
              {/* TAB: STUDIO ANALYTICS */}
              {/* ------------------------------------------------------- */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-1">
                      <span className="text-[11px] font-mono text-zinc-500">TOTAL STREAM PLAYS</span>
                      <div className="text-2xl font-bold font-display text-white">
                        {tracks.reduce((sum, t) => sum + (t.plays || 0), 0).toLocaleString()}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">Updated in real-time</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-1">
                      <span className="text-[11px] font-mono text-zinc-500">LIVE REMIXES</span>
                      <div className="text-2xl font-bold font-display text-dj-cyan">{tracks.length}</div>
                      <span className="text-[10px] text-zinc-500 font-mono">Firestore Document Store</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-1">
                      <span className="text-[11px] font-mono text-zinc-500">24-BIT WAV EDITS</span>
                      <div className="text-2xl font-bold font-display text-dj-violet">
                        {tracks.filter(t => t.format === 'WAV').length}
                      </div>
                      <span className="text-[10px] text-violet-300 font-mono">Uncompressed Master Quality</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-1">
                      <span className="text-[11px] font-mono text-zinc-500">PLAYLISTS CREATED</span>
                      <div className="text-2xl font-bold font-display text-pink-400">{playlists.length}</div>
                      <span className="text-[10px] text-zinc-500 font-mono">Curated Sets</span>
                    </div>
                  </div>

                  {/* Leaderboard */}
                  <div className="p-6 rounded-2xl bg-zinc-950/70 border border-white/5 space-y-4">
                    <h5 className="font-display font-bold text-white text-sm uppercase tracking-wider">
                      CATALOGUE LEADERBOARD
                    </h5>
                    {tracks.length === 0 ? (
                      <div className="text-xs font-mono text-zinc-500 text-center py-4">No tracks uploaded yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {tracks.slice(0, 10).map((track, i) => (
                          <div key={track.id} className="flex items-center justify-between text-xs font-mono">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-zinc-600 font-bold w-4">#{i + 1}</span>
                              <span className="text-white font-bold truncate max-w-xs">{track.title}</span>
                              <span className="text-zinc-500 hidden sm:inline truncate">({track.remixTitle})</span>
                            </div>
                            <span className="text-dj-cyan font-bold">{(track.plays || 0).toLocaleString()} plays</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------- */}
              {/* TAB: FIREBASE SETUP & ENVIRONMENT CONFIG */}
              {/* ------------------------------------------------------- */}
              {activeTab === 'config' && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div>
                    <h4 className="text-lg font-display font-bold text-white">FIREBASE PROJECT CONFIGURATION</h4>
                    <p className="text-xs text-zinc-400 mt-1 font-sans">
                      Connect your Google Cloud Firebase project (`dj-mitesh-music`) for Cloud Firestore, Storage, and Authentication. These settings enable uploads to work on both localhost and your live deployed site (Vercel / Netlify).
                    </p>
                  </div>

                  {/* Real-Time Connection Diagnostic Test */}
                  <div className="p-5 rounded-2xl bg-zinc-950/90 border border-white/10 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h5 className="font-display font-bold text-white text-sm flex items-center gap-2">
                          <Activity className="w-4 h-4 text-dj-cyan" />
                          <span>LIVE FIREBASE CONNECTION DIAGNOSTIC</span>
                        </h5>
                        <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          Run a live test to verify Authentication, Firestore, and Storage connectivity.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleRunConnectionTest}
                        disabled={isTestingConnection}
                        className="px-4 py-2 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-300 hover:text-white font-mono text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                        <span>{isTestingConnection ? 'TESTING CLOUD...' : 'TEST CONNECTION'}</span>
                      </button>
                    </div>

                    {testResult && (
                      <div className="space-y-2.5 pt-2 border-t border-white/5 font-mono text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                            testResult.authReady ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}>
                            {testResult.authReady ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            <span>AUTH: {testResult.authReady ? 'INITIALIZED' : 'INACTIVE'}</span>
                          </div>

                          <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                            testResult.firestoreReady ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}>
                            {testResult.firestoreReady ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            <span>FIRESTORE: {testResult.firestoreReady ? 'CONNECTED' : 'CHECK RULES'}</span>
                          </div>

                          <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                            testResult.storageReady ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}>
                            {testResult.storageReady ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            <span>STORAGE: {testResult.storageReady ? 'INITIALIZED' : 'INACTIVE'}</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-zinc-900 border border-white/5 text-[11px] text-zinc-300">
                          <strong>Diagnostic Report: </strong>{testResult.details}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cloudinary Media Vault Status */}
                  <div className="p-4 rounded-2xl bg-zinc-950/90 border border-white/10 space-y-3 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        CLOUDINARY MEDIA VAULT (AUDIO & ARTWORKS)
                      </span>
                      <span className="text-[10px] text-dj-cyan font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        SPARK COMPLIANT
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-400 text-[11px] pt-1">
                      <div className="p-2.5 rounded-lg bg-zinc-900 border border-white/5">
                        <span className="text-zinc-500 block text-[10px]">CLOUD NAME:</span>
                        <span className="text-white font-bold">{import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'le9ztzey'}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-900 border border-white/5">
                        <span className="text-zinc-500 block text-[10px]">UPLOAD PRESET:</span>
                        <span className="text-white font-bold">{import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'dj_music_upload'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-4 text-xs font-mono">
                    <div className="space-y-1">
                      <label className="text-zinc-400 block">API KEY (apiKey)</label>
                      <input
                        type="text"
                        value={configForm.apiKey}
                        onChange={(e) => setConfigForm({ ...configForm, apiKey: e.target.value })}
                        placeholder="AIzaSy..."
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400 block">PROJECT ID (projectId)</label>
                      <input
                        type="text"
                        value={configForm.projectId}
                        onChange={(e) => setConfigForm({ ...configForm, projectId: e.target.value })}
                        placeholder="dj-mitesh-music"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400 block">AUTH DOMAIN (authDomain)</label>
                      <input
                        type="text"
                        value={configForm.authDomain}
                        onChange={(e) => setConfigForm({ ...configForm, authDomain: e.target.value })}
                        placeholder="dj-mitesh-music.firebaseapp.com"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400 block">STORAGE BUCKET (storageBucket)</label>
                      <input
                        type="text"
                        value={configForm.storageBucket}
                        onChange={(e) => setConfigForm({ ...configForm, storageBucket: e.target.value })}
                        placeholder="dj-mitesh-music.firebasestorage.app"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400 block">MESSAGING SENDER ID (messagingSenderId)</label>
                      <input
                        type="text"
                        value={configForm.messagingSenderId}
                        onChange={(e) => setConfigForm({ ...configForm, messagingSenderId: e.target.value })}
                        placeholder="Your 12-digit Sender ID"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400 block">APP ID (appId)</label>
                      <input
                        type="text"
                        value={configForm.appId}
                        onChange={(e) => setConfigForm({ ...configForm, appId: e.target.value })}
                        placeholder="1:104928374619:web:9876543210abcdef"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => clearCustomFirebaseConfig()}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Reset Configuration
                      </button>

                      <button
                        type="button"
                        onClick={() => saveCustomFirebaseConfig(configForm)}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold shadow-md hover:scale-102 transition-all"
                      >
                        SAVE & CONNECT FIREBASE
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* EDIT TRACK MODAL DIALOG */}
        {/* ------------------------------------------------------------- */}
        <AnimatePresence>
          {editingTrack && (
            <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="max-w-xl w-full bg-[#0d0f1c] border border-white/10 rounded-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="font-display font-bold text-white text-base">EDIT TRACK METADATA</h4>
                  <button onClick={() => setEditingTrack(null)} className="text-zinc-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <label className="text-zinc-400 block mb-1">TRACK TITLE</label>
                    <input
                      type="text"
                      value={editingTrack.title}
                      onChange={(e) => setEditingTrack({ ...editingTrack, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">REMIX SUBTITLE</label>
                    <input
                      type="text"
                      value={editingTrack.remixTitle}
                      onChange={(e) => setEditingTrack({ ...editingTrack, remixTitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">ORIGINAL ARTIST</label>
                    <input
                      type="text"
                      value={editingTrack.originalArtist}
                      onChange={(e) => setEditingTrack({ ...editingTrack, originalArtist: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-400 block mb-1">GENRE</label>
                      <input
                        type="text"
                        value={editingTrack.genre}
                        onChange={(e) => setEditingTrack({ ...editingTrack, genre: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">BPM</label>
                      <input
                        type="number"
                        value={editingTrack.bpm}
                        onChange={(e) => setEditingTrack({ ...editingTrack, bpm: parseInt(e.target.value) || 128 })}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">DESCRIPTION</label>
                    <textarea
                      rows={2}
                      value={editingTrack.description}
                      onChange={(e) => setEditingTrack({ ...editingTrack, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-white"
                    />
                  </div>

                  {/* Artwork edit */}
                  <div className="space-y-1">
                    <label className="text-zinc-400 block">ALBUM ARTWORK</label>
                    <div className="flex items-center gap-3">
                      <img 
                        src={getSafeCoverArt(editArtworkPreview || editingTrack.coverUrl)} 
                        alt="Art" 
                        className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0" 
                      />
                      <div className="space-y-1.5">
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/30 text-xs font-mono text-zinc-300 cursor-pointer">
                          <ImageIcon className="w-3.5 h-3.5 text-dj-cyan" />
                          <span>Upload Custom Cover</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setEditArtworkFile(file);
                                const reader = new FileReader();
                                reader.onload = (ev) => setEditArtworkPreview(ev.target?.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setEditArtworkFile(null);
                            setEditArtworkPreview(DEFAULT_COVER_ART);
                            setEditingTrack({ ...editingTrack, coverUrl: DEFAULT_COVER_ART_URL, artworkStoragePath: undefined });
                          }}
                          className="block text-[11px] font-mono text-zinc-400 hover:text-dj-cyan transition-colors"
                        >
                          Restore Official DJ Miteshhh 75 Cover
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    onClick={() => setEditingTrack(null)}
                    className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSavingEdit}
                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isSavingEdit ? 'SAVING CHANGES...' : 'SAVE CHANGES'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
};
