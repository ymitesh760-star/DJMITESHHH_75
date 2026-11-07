# DJ MITESHHH 75 — Live Music Management Platform & Remix Studio

An ultra-premium, cinematic, fully animated DJ Remix Music Studio & Live Music Management website built for **DJ Miteshhh 75**.

This website is a **live music platform**: you can deploy it to **Vercel**, **Netlify**, or **Firebase Hosting**, open your live website in any browser, log in as Admin, and upload your master WAV/MP3 files anytime without editing code, JSON, or redeploying.

---

## ⚡ Core Architecture

- **Empty Library by Default**: Starts with a clean slate. No demo songs, sample audio, or placeholder tracks.
- **Firebase Storage**: Stores original lossless audio files (24-bit WAV, FLAC, 320kbps MP3, M4A, OGG) and high-res cover art.
- **Cloud Firestore**: Stores track metadata and triggers real-time listeners (`onSnapshot`) so newly uploaded songs appear automatically across all live visitors without refreshing or redeploying.
- **Firebase Authentication**: Secure Email/Password admin login protecting the upload panel and catalogue management.
- **Client-Side Audio Analysis**: Web Audio API automatically extracts duration, audio format, file size, and computes 72 waveform peaks upon drag & drop before uploading.
- **Pristine Quality**: Direct streaming via HTML5 Audio and real-time frequency analysis with Web Audio API AnalyserNode (512-point FFT).
- **Security Rules**: Production-grade `firestore.rules` and `storage.rules` ensure only the authenticated admin can upload or delete tracks.

---

## 🚀 Getting Started

### 1. Install & Run Locally
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 2. Build for Production
```bash
npm run build
```

---

## ☁️ Connecting Firebase for Live Website Uploads

To enable uploads on your live deployed website:

### Step 1: Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/) and click **Add Project** (e.g., `dj-mitesh-remix-studio`).
2. In the left menu, enable:
   - **Authentication** -> Get Started -> Enable **Email/Password**.
   - **Firestore Database** -> Create Database -> Start in production mode.
   - **Storage** -> Get Started -> Start in production mode.

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Web App config from Firebase Project Settings:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=dj-mitesh-remix-studio.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dj-mitesh-remix-studio
VITE_FIREBASE_STORAGE_BUCKET=dj-mitesh-remix-studio.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=104928374619
VITE_FIREBASE_APP_ID=1:104928374619:web:abcdef123456
```

*(Note: On the live deployed site, you can also enter these credentials directly in the **Admin Control Room -> Firebase Setup** tab without rebuilding!)*

### Step 3: Deploy Security Rules
```bash
firebase deploy --only firestore:rules,storage
```

---

## 🎛️ How to Upload Music After Deploying to Vercel / Netlify

1. Open your live website URL (e.g. `https://dj-mitesh-75.vercel.app`).
2. Click **CONTROL ROOM** in the top navigation bar.
3. Sign in or click **Create Admin Account** with your administrator email & password.
4. Navigate to the **UPLOAD AUDIO** tab.
5. Drag and drop your WAV, MP3, FLAC, M4A, or OGG audio files from your laptop.
6. Verify the detected duration, format, and waveform preview.
7. Customize title, remix subtitle, original artist, genre, BPM, key, and upload a square album cover.
8. Click **UPLOAD TRACK** (or **UPLOAD ALL TRACKS**).
9. The audio is uploaded to Firebase Storage and registered in Cloud Firestore.
10. The track instantly appears in the public **Remix Vault** and is immediately playable!

---

## 🎧 DJ Studio Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Play / Pause master audio |
| `Arrow Right` | Seek forward 5 seconds |
| `Arrow Left` | Seek backward 5 seconds |
| `M` | Toggle Mute |
| `F` | Expand / Collapse Fullscreen Immersive Mode |
| `V` | Open / Close Arena Audio Visualizer Stage |
| `Esc` | Close modal / dismiss overlay |

---

## 🛡️ Security & Privacy
- **Public Visitors**: Can stream published songs, view visualizers, search, and browse playlists. Cannot access the upload panel or delete/edit songs.
- **Admin**: Can upload, preview, edit metadata, change cover art, publish/unpublish, and delete tracks (which removes both the Firestore document and the Firebase Storage audio object).
