import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function normalizeSongTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function calculateSongMatchScore(normTitle: string, normSearch: string): number {
  if (!normTitle || !normSearch) return 0;
  if (normTitle === normSearch) return 100;

  const titleWords = normTitle.split(' ').filter(w => w.length > 1);
  const searchWords = normSearch.split(' ').filter(w => w.length > 1);

  if (titleWords.length === 0 || searchWords.length === 0) return 0;

  let matches = 0;
  for (const sw of searchWords) {
    if (titleWords.some(tw => tw.includes(sw) || sw.includes(tw))) {
      matches++;
    }
  }

  const wordMatchRatio = matches / Math.max(searchWords.length, titleWords.length);
  const substringBonus = (normTitle.includes(normSearch) || normSearch.includes(normTitle)) ? 30 : 0;
  const lengthDiff = Math.abs(normTitle.length - normSearch.length);
  const lengthPenalty = Math.min(20, lengthDiff * 0.5);

  return (wordMatchRatio * 80) + substringBonus - lengthPenalty;
}

export function findBestSongMatch<T extends { title: string }>(songs: T[], rawSearch: string): T | null {
  const normSearch = normalizeSongTitle(rawSearch);
  if (!normSearch) return null;

  // 1. Exact normalized match
  const exactMatch = songs.find(s => normalizeSongTitle(s.title) === normSearch);
  if (exactMatch) return exactMatch;

  // 2. Score all songs to find highest candidate
  let bestSong: T | null = null;
  let bestScore = 0;

  for (const song of songs) {
    const normTitle = normalizeSongTitle(song.title);
    const score = calculateSongMatchScore(normTitle, normSearch);
    if (score >= 40 && score > bestScore) {
      bestScore = score;
      bestSong = song;
    }
  }

  return bestSong;
}

export function parseYoutubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (trimmed.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  
  // 1. Parameter v= anywhere in query string (watch?v=..., watch?feature=shared&v=..., etc.)
  const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})(?:[&?#]|$)/i);
  if (vMatch && vMatch[1]) {
    return vMatch[1];
  }

  // 2. Path-based IDs: youtu.be/ID, embed/ID, shorts/ID, live/ID, v/ID
  const pathMatch = trimmed.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed|shorts|live|v)\/)([a-zA-Z0-9_-]{11})(?:[&?#]|$)/i);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }

  return null;
}

export function parseYoutubePlaylistId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)(?:[&?#]|$)/i);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

/**
 * Extracts all unique, ordered song IDs linked to a service.
 * - When the liturgy contains song items, the liturgy is the authoritative source.
 * - Non-song liturgy items (reading, prayer, speech, announcements, offering, etc.) are strictly ignored.
 * - Falls back to setlist only when liturgy has no song items.
 */
export function getServiceSongs(service: any, allSongs: any[] = []): any[] {
  if (!service) return [];
  const liturgy = Array.isArray(service.liturgy) ? service.liturgy : [];

  // Filter liturgy for genuine song items only
  const liturgySongItems = liturgy.filter((item: any) => {
    if (!item) return false;
    if (typeof item === 'string') return true;

    const type = String(item.type || '').toLowerCase();
    // Strictly exclude non-song liturgy moments
    if (['reading', 'speech', 'prayer', 'announcements', 'announcement', 'offering', 'moment', 'other'].includes(type)) {
      return false;
    }

    if (type === 'song' || item.songId) return true;

    // Legacy / un-typed item: only treat as a song if it matches an actual song in the database
    if (item.title && allSongs.length > 0) {
      const match = findBestSongMatch(allSongs, item.title);
      return !!match;
    }
    return false;
  });

  // If liturgy has song items, liturgy is the definitive source of order and songs
  if (liturgySongItems.length > 0) {
    return liturgySongItems.map((item: any, idx: number) => {
      if (typeof item === 'string') {
        const match = allSongs.find(s => s.id === item) || findBestSongMatch(allSongs, item);
        return match || { id: item, title: item, artist: '' };
      }
      const sId = item.songId || item.id;
      const found = (sId ? allSongs.find(s => s.id === sId) : null)
        || (item.title ? allSongs.find(s => s.title?.toLowerCase().trim() === item.title?.toLowerCase().trim()) : null)
        || (item.title ? findBestSongMatch(allSongs, item.title) : null);

      if (found) {
        return {
          ...found,
          ...item,
          id: found.id || sId || `liturgy-song-${idx}`,
          title: item.title || item.songTitle || found.title,
          artist: item.artist || item.songArtist || found.artist,
          youtube: found.youtube || found.youtubeUrl || item.youtube || item.youtubeUrl || found.link || found.video,
          youtubeUrl: found.youtubeUrl || found.youtube || item.youtubeUrl || item.youtube || found.link || found.video,
          audio: (Array.isArray(item.audio) && item.audio.length > 0) ? item.audio : (found.audio || []),
        };
      }
      return {
        id: sId || `liturgy-song-${idx}`,
        title: item.title || item.songTitle || 'Música',
        artist: item.artist || item.songArtist || '',
        youtube: item.youtube || item.youtubeUrl || '',
        youtubeUrl: item.youtubeUrl || item.youtube || '',
        audio: item.audio || [],
        ...item
      };
    });
  }

  // Fallback: If no liturgy song items exist, inspect service.setlist
  const setlist = Array.isArray(service.setlist) ? service.setlist : [];
  if (setlist.length > 0) {
    return setlist.map((idOrItem: any, idx: number) => {
      const sId = typeof idOrItem === 'string' ? idOrItem : idOrItem.songId || idOrItem.id;
      const match = allSongs.find(s => s.id === sId) || (typeof idOrItem === 'string' ? findBestSongMatch(allSongs, idOrItem) : null);
      return match || (typeof idOrItem === 'object' ? idOrItem : { id: sId || `setlist-${idx}`, title: String(idOrItem), artist: '' });
    }).filter(Boolean);
  }

  return [];
}

/**
 * Extracts all unique, ordered song IDs linked to a service.
 */
export function getServiceSongIds(service: any, allSongs: any[] = []): string[] {
  const songs = getServiceSongs(service, allSongs);
  const seenIds = new Set<string>();
  const ids: string[] = [];
  for (const s of songs) {
    if (s && s.id && !seenIds.has(s.id)) {
      seenIds.add(s.id);
      ids.push(s.id);
    }
  }
  return ids;
}

/**
 * Returns songs for in-app or external playlist in exact service liturgy order.
 */
export function getServicePlaylistSongs(service: any, allSongs: any[] = []): any[] {
  return getServiceSongs(service, allSongs);
}

/**
 * Updates a service playlist URL across Firestore and ensures immediate synchronization.
 */
export async function updateServicePlaylistUrl(serviceId: string, playlistUrl: string): Promise<void> {
  if (!serviceId) return;
  const cleanUrl = (playlistUrl || '').trim();
  await updateDoc(doc(db, 'services', serviceId), {
    playlistUrl: cleanUrl,
    updatedAt: new Date().toISOString()
  });
}
