// Direct client-side and API-proxied scraper for Cifra Club

export interface ScrapedCifraClubSong {
  title: string;
  artist: string;
  tone?: string;
  bpm?: number;
  timeSignature?: string;
  lyrics: string;
  chords?: string[];
  url?: string;
  tags?: string[];
}

export async function fetchCifraClubDirect(urlOrCandidate: string): Promise<ScrapedCifraClubSong> {
  if (!urlOrCandidate || typeof urlOrCandidate !== 'string') {
    throw new Error('URL ou termo de busca do Cifra Club é obrigatório.');
  }

  let targetUrl = urlOrCandidate.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://www.cifraclub.com.br/' + targetUrl.replace(/^\/+/, '');
  }

  try {
    const response = await fetch('/api/songs/import-cifraclub', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: targetUrl })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || 'Música Sem Título',
        artist: data.artist || 'Artista Desconhecido',
        tone: data.tone || data.key || 'C',
        bpm: data.bpm ? Number(data.bpm) : undefined,
        timeSignature: data.timeSignature || '4/4',
        lyrics: data.lyrics || data.content || '',
        chords: Array.isArray(data.chords) ? data.chords : [],
        url: targetUrl,
        tags: data.tags || ['Louvor']
      };
    } else {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Erro HTTP ${response.status} ao importar do Cifra Club.`);
    }
  } catch (err: any) {
    console.warn('[cifraClubClientScraper] Falha na API interna:', err);
    throw err;
  }
}

export default {
  fetchCifraClubDirect
};
