// ===============================================================
// DJ MITESHHH 75 — Official Studio Branding & Assets
// OBSIDIAN FREQUENCY // THE PRIVATE SOUND LAB
// ===============================================================

import defaultCoverImage from '../assets/dj-miteshhh-75-cover.png';

/**
 * Permanent official default cover image for DJ Miteshhh 75 Studio.
 * Bundled via Vite to guarantee 100% reliability across local dev,
 * production builds, and Vercel hosting.
 */
export const DEFAULT_COVER_ART: string = defaultCoverImage;

/**
 * Static public URL reference for Cloud Firestore track metadata,
 * ensuring backwards compatibility and permanent public streaming.
 */
export const DEFAULT_COVER_ART_URL: string = '/artworks/dj-miteshhh-75-cover.jpg';

export const STUDIO_BRANDING = {
  name: 'DJ MITESHHH 75',
  title: 'DJ MITESHHH 75 — OBSIDIAN FREQUENCY',
  concept: 'THE PRIVATE SOUND LAB',
  experience: 'OBSIDIAN FREQUENCY',
  subtitle: 'An independent remix archive by DJ Miteshhh 75.',
  tagline: 'MY SOUND. MY RULES. MY FREQUENCY.',
  taglines: [
    'MY SOUND.',
    'MY RULES.',
    'MY FREQUENCY.'
  ],
  editorialMeta: 'INDEPENDENT DJ / REMIX ARTIST / SOUND EXPERIMENTS',
  officialAdminEmail: 'djmiteshhh75@gmail.com',
  defaultCover: DEFAULT_COVER_ART,
  defaultCoverUrl: DEFAULT_COVER_ART_URL,
  primaryCTA: 'EXPLORE THE ARCHIVE',
  secondaryCTA: 'ENTER THE SOUND LAB',
} as const;

/**
 * Checks if a given cover URL represents a legacy default cover
 * that should be migrated to the new official DJ Miteshhh 75 cover.
 */
export function isLegacyDefaultCover(url?: string | null): boolean {
  if (!url || url.trim() === '') return true;
  const clean = url.trim().toLowerCase();
  return (
    clean.includes('apt-x-lollipop') ||
    clean.includes('la-mama-chammak-challo') ||
    clean.startsWith('data:image/svg') ||
    clean === '/artworks/default-cover.jpg' ||
    clean === 'default'
  );
}

/**
 * Resolves any track or playlist cover artwork URL.
 * Automatically replaces legacy covers and empty covers with the new
 * official DJ Miteshhh 75 branding artwork, while safely preserving
 * individual songs with custom user-uploaded artwork.
 */
export function getSafeCoverArt(url?: string | null): string {
  if (isLegacyDefaultCover(url)) {
    return DEFAULT_COVER_ART;
  }
  return url!;
}

export default DEFAULT_COVER_ART;
