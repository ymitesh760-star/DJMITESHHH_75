/**
 * DJ MITESHHH 75 — Cloudinary Audio & Media Upload Engine
 * 
 * Provides real unsigned uploads to Cloudinary for lossless 24-bit WAV,
 * 320kbps MP3, FLAC, M4A, OGG, and high-res artwork images.
 * Eliminates Firebase Storage Blaze plan requirements on free Firebase Spark plan.
 */

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

export const DEFAULT_CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName: 'le9ztzey',
  uploadPreset: 'dj_music_upload'
};

/**
 * Retrieve active Cloudinary configuration from environment or built-in default
 */
export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim() || DEFAULT_CLOUDINARY_CONFIG.cloudName;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim() || DEFAULT_CLOUDINARY_CONFIG.uploadPreset;
  return { cloudName, uploadPreset };
}

export interface CloudinaryUploadResult {
  downloadUrl: string;
  storagePath: string;
  bytes: number;
  format: string;
  duration?: number;
}

export interface CloudinaryProgressInfo {
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

export interface CloudinaryUploadTask {
  cancel: () => void;
  pause: () => void;
  resume: () => void;
}

/**
 * Format bytes into readable format
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
 * Upload Audio File (WAV, MP3, FLAC, M4A, OGG) to Cloudinary using resource_type "video"
 */
export function uploadAudioToCloudinary(
  file: File,
  trackId: string,
  onProgress: (info: CloudinaryProgressInfo) => void,
  onTaskCreated?: (task: CloudinaryUploadTask) => void
): Promise<CloudinaryUploadResult> {
  const { cloudName, uploadPreset } = getCloudinaryConfig();

  if (!cloudName || !uploadPreset) {
    return Promise.reject(new Error('Cloudinary credentials missing. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.'));
  }

  // Cloudinary treats audio files under the "video" resource_type
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'dj_mitesh_audio');
    formData.append('context', `trackId=${trackId}|title=${encodeURIComponent(file.name)}`);

    let isCanceled = false;

    // Provide cancel handle to UI
    const task: CloudinaryUploadTask = {
      cancel: () => {
        isCanceled = true;
        xhr.abort();
      },
      pause: () => {
        // XHR does not support pause, keep running or abort
      },
      resume: () => {
        // Resume not supported natively by single XHR
      }
    };

    if (onTaskCreated) {
      onTaskCreated(task);
    }

    let lastBytes = 0;
    let lastTime = performance.now();
    let speedBytesPerSec = 0;

    xhr.upload.onprogress = (event) => {
      if (isCanceled) return;

      if (event.lengthComputable) {
        const currentTime = performance.now();
        const timeDelta = (currentTime - lastTime) / 1000;

        if (timeDelta >= 0.25 || event.loaded === event.total) {
          const bytesDelta = event.loaded - lastBytes;
          if (timeDelta > 0 && bytesDelta >= 0) {
            const currentSpeed = bytesDelta / timeDelta;
            speedBytesPerSec = speedBytesPerSec === 0 ? currentSpeed : speedBytesPerSec * 0.7 + currentSpeed * 0.3;
          }
          lastBytes = event.loaded;
          lastTime = currentTime;
        }

        const percentage = event.total > 0
          ? Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100)))
          : 0;

        const remainingBytes = Math.max(0, event.total - event.loaded);
        const timeRemainingSeconds = speedBytesPerSec > 0 ? Math.ceil(remainingBytes / speedBytesPerSec) : 0;

        const progressInfo: CloudinaryProgressInfo = {
          bytesTransferred: event.loaded,
          totalBytes: event.total,
          percentage,
          speedBytesPerSec,
          speedFormatted: speedBytesPerSec > 0 ? `${formatBytes(speedBytesPerSec)}/s` : 'Streaming...',
          timeRemainingSeconds,
          timeRemainingFormatted: timeRemainingSeconds > 0
            ? `${timeRemainingSeconds >= 60 ? `${Math.floor(timeRemainingSeconds / 60)}m ` : ''}${timeRemainingSeconds % 60}s left`
            : event.loaded === event.total ? 'Processing audio on Cloudinary...' : 'Estimating...',
          bytesFormatted: `${formatBytes(event.loaded)} / ${formatBytes(event.total)}`,
          state: 'running'
        };

        onProgress(progressInfo);
      }
    };

    xhr.onload = () => {
      if (isCanceled) {
        reject(new Error('Upload canceled.'));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          const downloadUrl = response.secure_url || response.url;
          const storagePath = `cloudinary:${response.public_id}`;

          resolve({
            downloadUrl,
            storagePath,
            bytes: response.bytes || file.size,
            format: (response.format || file.name.split('.').pop() || 'WAV').toUpperCase(),
            duration: response.duration ? Math.round(response.duration) : undefined
          });
        } catch (parseErr) {
          reject(new Error('Invalid response received from Cloudinary.'));
        }
      } else {
        try {
          const errorJson = JSON.parse(xhr.responseText);
          const errorMsg = errorJson?.error?.message || `Cloudinary upload failed with status ${xhr.status}`;
          reject(new Error(errorMsg));
        } catch {
          reject(new Error(`Cloudinary upload failed with status ${xhr.status}: ${xhr.statusText || 'Check upload preset settings'}`));
        }
      }
    };

    xhr.onerror = () => {
      if (isCanceled) {
        reject(new Error('Upload canceled.'));
      } else {
        reject(new Error('Network error during Cloudinary upload. Please check your internet connection.'));
      }
    };

    xhr.onabort = () => {
      reject(new Error('Upload canceled by user.'));
    };

    xhr.open('POST', uploadUrl);
    xhr.send(formData);
  });
}

/**
 * Upload Album Artwork to Cloudinary using resource_type "image"
 */
export function uploadArtworkToCloudinary(
  file: File,
  trackId: string,
  onTaskCreated?: (task: CloudinaryUploadTask) => void
): Promise<CloudinaryUploadResult> {
  const { cloudName, uploadPreset } = getCloudinaryConfig();

  if (!cloudName || !uploadPreset) {
    return Promise.reject(new Error('Cloudinary credentials missing.'));
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'dj_mitesh_artworks');
    formData.append('context', `trackId=${trackId}`);

    let isCanceled = false;

    if (onTaskCreated) {
      onTaskCreated({
        cancel: () => {
          isCanceled = true;
          xhr.abort();
        },
        pause: () => {},
        resume: () => {}
      });
    }

    xhr.onload = () => {
      if (isCanceled) {
        reject(new Error('Upload canceled.'));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          const downloadUrl = response.secure_url || response.url;
          const storagePath = `cloudinary:${response.public_id}`;

          resolve({
            downloadUrl,
            storagePath,
            bytes: response.bytes || file.size,
            format: (response.format || 'JPG').toUpperCase()
          });
        } catch {
          reject(new Error('Invalid response received for artwork upload.'));
        }
      } else {
        try {
          const errorJson = JSON.parse(xhr.responseText);
          reject(new Error(errorJson?.error?.message || `Artwork upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Artwork upload failed (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error uploading artwork to Cloudinary.'));
    xhr.onabort = () => reject(new Error('Artwork upload canceled.'));

    xhr.open('POST', uploadUrl);
    xhr.send(formData);
  });
}

