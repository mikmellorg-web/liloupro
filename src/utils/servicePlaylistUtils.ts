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
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }
  const trimmed = url.trim();
  if (trimmed.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Extracts all unique, ordered song IDs linked to a service.
 * - When the liturgy contains song items, the liturgy is the authoritative source.
 * - Non-song liturgy items (reading, prayer, speech, announcements, offering, etc.) are strictly ignored.
 * - Falls back to setlist only when liturgy has no song items.
 */
export function getServiceSongIds(service: any, allSongs: any[] = []): string[] {
  if (!service) return [];

  const songIds: string[] = [];
  const seenIds = new Set<string>();

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
    for (const item of liturgySongItems) {
      if (typeof item === 'string') {
        const match = allSongs.find(s => s.id === item) || findBestSongMatch(allSongs, item);
        const matchedId = match ? match.id : item;
        if (matchedId && !seenIds.has(matchedId)) {
          seenIds.add(matchedId);
          songIds.push(matchedId);
        }
      } else if (typeof item === 'object') {
        if (item.songId) {
          if (!seenIds.has(item.songId)) {
            seenIds.add(item.songId);
            songIds.push(item.songId);
          }
        } else if (item.title) {
          const match = findBestSongMatch(allSongs, item.title);
          if (match && !seenIds.has(match.id)) {
            seenIds.add(match.id);
            songIds.push(match.id);
          } else if (item.id && allSongs.some(s => s.id === item.id) && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            songIds.push(item.id);
          }
        }
      }
    }
    return songIds;
  }

  // Fallback: If no liturgy song items exist, inspect service.setlist
  const setlist = Array.isArray(service.setlist) ? service.setlist : [];
  for (const item of setlist) {
    if (!item) continue;
    if (typeof item === 'string') {
      const match = allSongs.find(s => s.id === item) || findBestSongMatch(allSongs, item);
      const matchedId = match ? match.id : item;
      if (matchedId && !seenIds.has(matchedId)) {
        seenIds.add(matchedId);
        songIds.push(matchedId);
      }
    } else if (typeof item === 'object') {
      if (item.songId && !seenIds.has(item.songId)) {
        seenIds.add(item.songId);
        songIds.push(item.songId);
      } else if (item.id && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        songIds.push(item.id);
      } else if (item.title) {
        const match = findBestSongMatch(allSongs, item.title);
        if (match && !seenIds.has(match.id)) {
          seenIds.add(match.id);
          songIds.push(match.id);
        }
      }
    }
  }

  return songIds;
}

/**
 * Resolves full song objects in service order.
 */
export function getServiceSongs(service: any, allSongs: any[] = []): any[] {
  const ids = getServiceSongIds(service, allSongs);
  return ids
    .map(id => allSongs.find(s => s.id === id))
    .filter(Boolean);
}

/**
 * Returns playable songs for in-app or external playlist with valid YouTube videos.
 */
export function getServicePlaylistSongs(service: any, allSongs: any[] = []): any[] {
  const serviceSongs = getServiceSongs(service, allSongs);
  return serviceSongs.filter(s => s && s.youtube && parseYoutubeVideoId(s.youtube));
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
