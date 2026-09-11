// Vercel Serverless Function: Import Cifra Club by Title and Artist
export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { title, artist } = req.body || {};
    if (!title) {
      return res.status(400).json({ error: 'O título da música é obrigatório.' });
    }

    const slugify = (text: string) => {
      return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    };

    const songSlug = slugify(title);
    const artistSlug = artist ? slugify(artist) : '';

    const candidateUrls: string[] = [];
    if (artistSlug && songSlug) {
      candidateUrls.push(`https://www.cifraclub.com.br/${artistSlug}/${songSlug}/`);
      candidateUrls.push(`https://www.cifraclub.com.br/${artistSlug}/${songSlug}`);
    }

    // Try common gospel artists if artist not specified
    if (!artistSlug && songSlug) {
      const popularGospelArtists = [
        'gabriela-rocha',
        'isaias-saad',
        'morada',
        'kemuel',
        'diante-do-trono',
        'fernandinho',
        'fhop-music',
        'alessandro-vilas-boas',
        'aline-barros',
        'casa-worship',
        'preto-no-branco'
      ];
      for (const a of popularGospelArtists) {
        candidateUrls.push(`https://www.cifraclub.com.br/${a}/${songSlug}/`);
      }
    }

    for (const testUrl of candidateUrls) {
      try {
        const response = await fetch(testUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Referer': 'https://www.cifraclub.com.br/'
          }
        });
        if (response.ok) {
          const html = await response.text();
          if (html.includes('<pre') || html.includes('cifra_cnt')) {
            // Forward to import-cifraclub handler logic
            const importRes = await fetch(
              `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host || 'www.liloupro.com.br'}/api/songs/import-cifraclub`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: testUrl })
              }
            ).catch(() => null);

            if (importRes && importRes.ok) {
              const data = await importRes.json();
              return res.status(200).json(data);
            }
          }
        }
      } catch (e) {
        // continue trying next URL
      }
    }

    return res.status(404).json({
      error: `Não foi possível encontrar a cifra para "${title}" no Cifra Club.`,
      details: 'Tente colar o link direto da música copiado do navegador.'
    });
  } catch (error: any) {
    console.error('[Vercel CifraClub Search Error]:', error);
    return res.status(500).json({
      error: 'Erro ao buscar cifra.',
      details: error?.message || String(error)
    });
  }
}
