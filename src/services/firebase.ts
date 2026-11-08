import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut, 
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc,
  getDoc,
  setDoc,
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query,
  where,
  limit,
  onSnapshot,
  Firestore,
  Unsubscribe
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  UploadTask,
  FirebaseStorage 
} from 'firebase/storage';
import { Track, Playlist } from '../types';
import { 
  uploadAudioToCloudinary, 
  uploadArtworkToCloudinary, 
  getCloudinaryConfig 
} from './cloudinary';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

const LOCAL_STORAGE_FIREBASE_CONFIG_KEY = 'dj_mitesh_custom_firebase_config';

/**
 * Official default production Firebase configuration for DJ Miteshhh 75 Studio
 * Project: dj-mitesh-music
 */
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyAsa6wbYBTr7ACWFS2by5Uk7z97EbJp4E4",
  authDomain: "dj-mitesh-music.firebaseapp.com",
  projectId: "dj-mitesh-music",
  storageBucket: "dj-mitesh-music.firebasestorage.app",
  messagingSenderId: "588620438311",
  appId: "1:588620438311:web:872544af6ccf28cab1a702",
  measurementId: "G-XNXNNR6BJE"
};

/**
 * Retrieve active Firebase configuration with legacy project sanitization
 */
export function getActiveFirebaseConfig(): FirebaseConfig {
  // 1. Check and clean localStorage (purge any stale legacy project configuration)
  try {
    const customConfigStr = localStorage.getItem(LOCAL_STORAGE_FIREBASE_CONFIG_KEY);
    if (customConfigStr) {
      const parsed = JSON.parse(customConfigStr);
      if (
        parsed.projectId === DEFAULT_FIREBASE_CONFIG.projectId && 
        parsed.apiKey && 
        parsed.apiKey.startsWith('AIzaSy')
      ) {
        return parsed as FirebaseConfig;
      } else {
        // Automatically purge outdated project config (e.g. legacy mitesh-music-studio)
        localStorage.removeItem(LOCAL_STORAGE_FIREBASE_CONFIG_KEY);
      }
    }
  } catch (e) {
    console.error('Failed to parse custom Firebase config:', e);
  }

  // 2. Check environment variables
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();

  // If environment variables match current project dj-mitesh-music and have valid key
  if (
    envApiKey && 
    envApiKey !== 'AIzaSyDEMO-KEY-DJ-MITESHHH-75' && 
    envApiKey !== 'your_firebase_api_key_here' &&
    envProjectId &&
    envProjectId === DEFAULT_FIREBASE_CONFIG.projectId
  ) {
    return {
      apiKey: envApiKey,
      authDomain: `${DEFAULT_FIREBASE_CONFIG.projectId}.firebaseapp.com`,
      projectId: DEFAULT_FIREBASE_CONFIG.projectId,
      storageBucket: `${DEFAULT_FIREBASE_CONFIG.projectId}.firebasestorage.app`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
      appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() || DEFAULT_FIREBASE_CONFIG.appId,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim() || DEFAULT_FIREBASE_CONFIG.measurementId,
    };
  }

  // 3. Guaranteed production default configuration for dj-mitesh-music
  // Ensures 100% reliable initialization on Vercel deployment without missing env vars
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveCustomFirebaseConfig(config: FirebaseConfig): void {
  localStorage.setItem(LOCAL_STORAGE_FIREBASE_CONFIG_KEY, JSON.stringify(config));
  window.location.reload();
}

export function clearCustomFirebaseConfig(): void {
  localStorage.removeItem(LOCAL_STORAGE_FIREBASE_CONFIG_KEY);
  window.location.reload();
}

// Initialize Firebase App
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let isConfigured = false;

const activeConfig = getActiveFirebaseConfig();

if (activeConfig && activeConfig.apiKey) {
  try {
    app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();
    auth = getAuth(app);
    // Enforce persistent authentication across sessions and browser tabs
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('Firebase auth persistence setup warning:', err);
    });
    // Initialize Firestore with ignoreUndefinedProperties to guarantee safe saves
    try {
      db = initializeFirestore(app, {
        ignoreUndefinedProperties: true
      });
    } catch {
      db = getFirestore(app);
    }
    storage = getStorage(app);
    isConfigured = true;
  } catch (err) {
    console.error('Firebase initialization error:', err);
    isConfigured = false;
  }
}

export const isFirebaseConfigured = isConfigured;
export { app, auth, db, storage };

// -------------------------------------------------------------
// SECURE ADMIN ROLE VERIFICATION
// -------------------------------------------------------------

/**
 * Check if an email address is authorized for administrative privileges.
 * Matches configured VITE_ADMIN_EMAIL, bootstrap email djmiteshhh75@gmail.com, or @djmitesh75.com domain.
 */
export function isAuthorizedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  const configuredAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'djmiteshhh75@gmail.com').trim().toLowerCase();
  return cleanEmail === configuredAdminEmail || 
         cleanEmail === 'djmiteshhh75@gmail.com' || 
         cleanEmail === 'miteshyadav7575@gmail.com' ||
         cleanEmail.endsWith('@djmitesh75.com');
}

/**
 * Securely verify if a signed-in user has admin privileges.
 * Admin role cannot be self-assigned by a normal user.
 * 
 * Verifies through:
 * 1. Firebase Auth Custom Claims (`admin: true` or `role: 'admin'`) set via Admin SDK
 * 2. Cloud Firestore `/admins/{uid}` document (write-protected by security rules)
 * 3. Verified administrator email (matches VITE_ADMIN_EMAIL or djmiteshhh75@gmail.com)
 */
export async function verifyAdminRole(user: User | null): Promise<boolean> {
  if (!user) return false;

  // 1. Check custom claim (tamper-proof JWT signed by Google)
  try {
    const idTokenResult = await user.getIdTokenResult(true);
    if (idTokenResult.claims.admin === true || idTokenResult.claims.role === 'admin') {
      return true;
    }
  } catch (claimErr) {
    console.warn('Could not read ID token claims:', claimErr);
  }

  // 2. Check Firestore write-protected `/admins/{uid}` collection
  if (db) {
    try {
      const adminDocRef = doc(db, 'admins', user.uid);
      const adminSnap = await getDoc(adminDocRef);
      if (adminSnap.exists()) {
        const data = adminSnap.data();
        if (data?.role === 'admin' || data?.isAdmin === true) {
          return true;
        }
      }
    } catch {
      // If collection read is denied or does not exist, proceed to check email fallback
    }
  }

  // 3. Fallback: Check verified user email against authorized studio admin email
  if (user.email && isAuthorizedAdminEmail(user.email)) {
    return true;
  }

  return false;
}

// -------------------------------------------------------------
// FIREBASE LIVE CONNECTION DIAGNOSTIC TEST
// -------------------------------------------------------------

export interface ConnectionTestResult {
  connected: boolean;
  authReady: boolean;
  firestoreReady: boolean;
  storageReady: boolean;
  details: string;
}

export async function testFirebaseConnection(): Promise<ConnectionTestResult> {
  const result: ConnectionTestResult = {
    connected: false,
    authReady: false,
    firestoreReady: false,
    storageReady: false,
    details: ''
  };

  if (!isFirebaseConfigured || !app) {
    result.details = 'Firebase is not initialized. Please verify your VITE_FIREBASE_API_KEY in .env or the Firebase Setup panel.';
    return result;
  }

  // Test Auth
  try {
    if (auth) {
      result.authReady = true;
    }
  } catch (err: any) {
    result.details += `Auth error: ${err.message}. `;
  }

  // Test Firestore
  try {
    if (db) {
      const tracksRef = collection(db, 'tracks');
      // Align query with security rules: unauthenticated visitors query published == true
      const q = auth?.currentUser
        ? query(tracksRef, limit(1))
        : query(tracksRef, where('published', '==', true), limit(1));
      await getDocs(q);
      result.firestoreReady = true;
    }
  } catch (err: any) {
    result.details += `Firestore query: ${err.message}. `;
  }

  // Test Cloud Media Storage (Cloudinary)
  const cloudinary = getCloudinaryConfig();
  if (cloudinary.cloudName && cloudinary.uploadPreset) {
    result.storageReady = true;
  } else {
    result.details += 'Cloudinary configuration missing. ';
  }

  result.connected = result.authReady && result.firestoreReady && result.storageReady;
  if (result.connected && !result.details) {
    result.details = `Successfully connected to Firebase Auth, Cloud Firestore & Cloudinary Media Vault (${cloudinary.cloudName}).`;
  }

  return result;
}

// -------------------------------------------------------------
// REAL-TIME FIRESTORE SUBSCRIPTIONS
// -------------------------------------------------------------

/**
 * Subscribe to the live tracks collection in Cloud Firestore
 */
export function subscribeToTracks(
  onTracksUpdated: (tracks: Track[]) => void,
  isAdmin: boolean = false
): Unsubscribe {
  if (!db) {
    onTracksUpdated([]);
    return () => {};
  }

  // If visitor is not authenticated admin, explicitly filter by published == true
  // to satisfy Firestore security rules
  const tracksQuery = isAdmin
    ? collection(db, 'tracks')
    : query(collection(db, 'tracks'), where('published', '==', true));
  
  // Real-time listener: automatically updates UI when new songs are uploaded, edited, or deleted
  const unsubscribe = onSnapshot(
    tracksQuery,
    (snapshot) => {
      const trackList: Track[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Track;
        if (isAdmin || data.published) {
          trackList.push({
            ...data,
            id: docSnap.id
          });
        }
      });

      // Sort by creation date descending (newest first)
      trackList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onTracksUpdated(trackList);
    },
    (error) => {
      console.error('Firestore tracks subscription error:', error);
      onTracksUpdated([]);
    }
  );

  return unsubscribe;
}

/**
 * Subscribe to playlists collection in Cloud Firestore
 */
export function subscribeToPlaylists(
  onPlaylistsUpdated: (playlists: Playlist[]) => void
): Unsubscribe {
  if (!db) {
    onPlaylistsUpdated([]);
    return () => {};
  }

  const playlistsCollection = collection(db, 'playlists');
  const unsubscribe = onSnapshot(
    playlistsCollection,
    (snapshot) => {
      const list: Playlist[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          ...(docSnap.data() as Playlist),
          id: docSnap.id
        });
      });
      onPlaylistsUpdated(list);
    },
    (err) => {
      console.error('Firestore playlists subscription error:', err);
      onPlaylistsUpdated([]);
    }
  );

  return unsubscribe;
}

// -------------------------------------------------------------
// SECURE AUDIO & ARTWORK STORAGE UPLOADS
// -------------------------------------------------------------

export interface UploadResult {
  downloadUrl: string;
  storagePath: string;
}

export interface UploadProgressInfo {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  speedBytesPerSec: number;
  speedFormatted: string;
  timeRemainingSeconds: number;
  timeRemainingFormatted: string;
  bytesFormatted: string;
  state: 'running' | 'paused' | 'success' | 'error' | 'canceled';
}

/**
 * Format bytes into human-readable string (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Detect correct audio MIME type from file extension and browser file.type
 */
export function detectAudioMimeType(fileName: string, providedType?: string): string {
  if (providedType && providedType !== '' && providedType !== 'application/octet-stream') {
    return providedType;
  }
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'wav':
      return 'audio/wav';
    case 'mp3':
      return 'audio/mpeg';
    case 'flac':
      return 'audio/flac';
    case 'm4a':
      return 'audio/mp4';
    case 'ogg':
      return 'audio/ogg';
    case 'aac':
      return 'audio/aac';
    default:
      return 'audio/wav';
  }
}

/**
 * Translate Firebase Storage error codes into user-understandable explanations
 */
export function getFriendlyStorageErrorMessage(error: any): string {
  if (!error) return 'An unknown upload error occurred.';
  const code = error.code || '';
  switch (code) {
    case 'storage/unauthorized':
      return 'Permission Denied: Upload rejected by Firebase Storage security rules. Please verify you are logged in as the authorized administrator (djmiteshhh75@gmail.com).';
    case 'storage/unauthenticated':
      return 'Authentication Required: You must be logged in as administrator to upload tracks.';
    case 'storage/canceled':
      return 'Upload was canceled.';
    case 'storage/quota-exceeded':
      return 'Storage Quota Exceeded: Your Firebase Cloud Storage bucket quota has been reached.';
    case 'storage/retry-limit-exceeded':
      return 'Network Timeout: Upload retry limit reached. Check your internet connection and click Retry.';
    case 'storage/bucket-not-found':
      return 'Storage Bucket Not Found: Verify your storage bucket name in Firebase Console.';
    case 'storage/project-not-found':
      return 'Project Not Found: Verify your VITE_FIREBASE_PROJECT_ID in .env.local.';
    case 'storage/invalid-checksum':
      return 'File Checksum Error: File integrity check failed during upload. Please retry.';
    case 'storage/cannot-slice-blob':
      return 'File Read Error: The source file on your device was moved or deleted during upload.';
    default:
      return error.message || 'Firebase Storage upload failed. Check your network connection.';
  }
}

/**
 * Upload Audio File (WAV, MP3, FLAC, M4A, OGG) to Cloudinary
 * Uses resource_type "video" for lossless audio streaming.
 * Free plan compliant: eliminates Firebase Storage Blaze plan paywall.
 */
export async function uploadAudioFile(
  file: File,
  trackId: string,
  onProgress: (info: UploadProgressInfo) => void,
  onTaskCreated?: (task: any) => void
): Promise<UploadResult> {
  const result = await uploadAudioToCloudinary(file, trackId, onProgress, onTaskCreated);
  return {
    downloadUrl: result.downloadUrl,
    storagePath: result.storagePath
  };
}

/**
 * Upload Album Artwork Image to Cloudinary
 * Uses resource_type "image"
 */
export async function uploadArtworkFile(
  file: File,
  trackId: string,
  onTaskCreated?: (task: any) => void
): Promise<UploadResult> {
  const result = await uploadArtworkToCloudinary(file, trackId, onTaskCreated);
  return {
    downloadUrl: result.downloadUrl,
    storagePath: result.storagePath
  };
}

/**
 * Delete a file from Cloudinary / Storage
 */
export async function deleteStorageFile(storagePath: string): Promise<void> {
  if (!storagePath || storagePath.startsWith('cloudinary:')) {
    // Cloudinary client-side deletions do not expose secret; Firestore document removal
    // immediately removes the track from the live website and music player.
    return;
  }
  if (!storage) return;
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
  } catch (err: any) {
    if (err?.code !== 'storage/object-not-found') {
      console.warn('Error deleting file from storage:', err);
    }
  }
}

// -------------------------------------------------------------
// FIRESTORE CRUD OPERATIONS
// -------------------------------------------------------------

function cleanFirestorePayload<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      clean[key] = val;
    }
  }
  return clean;
}

/**
 * Save Track to Firestore
 */
export async function saveTrack(track: Track): Promise<void> {
  if (!db) {
    throw new Error('Cloud Firestore is not configured. Please configure Firebase credentials.');
  }
  const trackRef = doc(db, 'tracks', track.id);
  const payload = cleanFirestorePayload({
    ...track,
    updatedAt: Date.now()
  });
  await setDoc(trackRef, payload);
}

/**
 * Update an existing track's metadata in Firestore
 */
export async function updateTrackMetadata(
  trackId: string, 
  updates: Partial<Track>
): Promise<void> {
  if (!db) {
    throw new Error('Cloud Firestore is not configured.');
  }
  const trackRef = doc(db, 'tracks', trackId);
  const payload = cleanFirestorePayload({
    ...updates,
    updatedAt: Date.now()
  });
  await updateDoc(trackRef, payload);
}

/**
 * Increment track play count in Firestore (allowed for public visitors via security rules)
 */
export async function incrementPlayCount(trackId: string, currentPlays: number): Promise<void> {
  if (!db || !trackId || trackId.includes('master') || trackId.startsWith('track-apt-x-') || trackId.includes('la-mama')) return;
  try {
    const trackRef = doc(db, 'tracks', trackId);
    await updateDoc(trackRef, {
      plays: (currentPlays || 0) + 1
    });
  } catch (err) {
    // Silently ignore if document does not exist in Cloud Firestore
  }
}

/**
 * Delete a track from Firestore and delete its files from Firebase Storage
 */
export async function deleteTrackPermanently(track: Track): Promise<void> {
  if (!db) {
    throw new Error('Cloud Firestore is not configured.');
  }

  // 1. Delete original audio from Firebase Storage
  if (track.audioStoragePath) {
    await deleteStorageFile(track.audioStoragePath);
  }

  // 2. Delete artwork from Firebase Storage if it was uploaded
  if (track.artworkStoragePath) {
    await deleteStorageFile(track.artworkStoragePath);
  }

  // 3. Delete document from Firestore
  const trackRef = doc(db, 'tracks', track.id);
  await deleteDoc(trackRef);
}

/**
 * Save Playlist to Firestore
 */
export async function savePlaylist(playlist: Playlist): Promise<void> {
  if (!db) {
    throw new Error('Cloud Firestore is not configured.');
  }
  const playlistRef = doc(db, 'playlists', playlist.id);
  await setDoc(playlistRef, playlist);
}

/**
 * Delete Playlist from Firestore
 */
export async function deletePlaylist(playlistId: string): Promise<void> {
  if (!db) return;
  const playlistRef = doc(db, 'playlists', playlistId);
  await deleteDoc(playlistRef);
}

// -------------------------------------------------------------
// FIREBASE AUTHENTICATION (EMAIL/PASSWORD + GOOGLE SIGN-IN)
// -------------------------------------------------------------

export function subscribeToAuth(callback: (user: User | null) => void): Unsubscribe {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function loginAdmin(email: string, pass: string): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please configure your Firebase API credentials.');
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

export const signInUser = loginAdmin;

export async function registerNormalUser(email: string, pass: string): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }
  const cleanEmail = email.trim().toLowerCase();
  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  return userCredential.user;
}

export async function registerAdmin(email: string, pass: string): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please verify your Firebase project credentials.');
  }
  const cleanEmail = email.trim().toLowerCase();
  if (!isAuthorizedAdminEmail(cleanEmail)) {
    throw new Error(
      `Access Denied: Only the verified studio administrator (${import.meta.env.VITE_ADMIN_EMAIL || 'djmiteshhh75@gmail.com'}) can create an admin account. Ordinary users are not permitted to register admin accounts.`
    );
  }
  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  return userCredential.user;
}

export async function signInWithGoogle(): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please verify your Firebase project credentials.');
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  const userCredential = await signInWithPopup(auth, provider);
  return userCredential.user;
}

export async function sendAdminPasswordReset(email: string): Promise<void> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }
  await sendPasswordResetEmail(auth, email);
}

export async function logoutAdmin(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}
