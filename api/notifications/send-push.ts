export default async function handler(req: any, res: any) {
  // Configurar cabeçalhos CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { tokens, title, body, url = '/', data = {} } = req.body || {};
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({ success: false, error: 'Nenhum token fornecido.' });
    }

    const validTokens = tokens.filter((t: any) => typeof t === 'string' && t.trim().length > 10);
    if (validTokens.length === 0) {
      return res.status(400).json({ success: false, error: 'Nenhum token válido encontrado.' });
    }

    const payloadNotification = {
      title: title || 'LiLouPro • Notificação',
      body: body || 'Nova mensagem no ministério de louvor.',
      icon: '/pwa-512x512.png?v=4.0',
      badge: '/pwa-192x192.png?v=4.0'
    };

    let sentCount = 0;
    const errors: string[] = [];

    // Chave de autorização pública/servidor do Firebase
    const serverKey = process.env.FIREBASE_SERVER_KEY || 'AIzaSyD5TRm6D05LxqHuN8kthOHIfwGBxTXK5Hk';

    for (const token of validTokens) {
      try {
        const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${serverKey}`
          },
          body: JSON.stringify({
            to: token,
            notification: payloadNotification,
            data: {
              ...data,
              title: payloadNotification.title,
              body: payloadNotification.body,
              url: url || '/'
            },
            priority: 'high'
          })
        });

        if (fcmResponse.ok) {
          sentCount++;
        } else {
          const errText = await fcmResponse.text();
          errors.push(errText);
        }
      } catch (itemErr: any) {
        errors.push(itemErr?.message || String(itemErr));
      }
    }

    return res.status(200).json({
      success: true,
      sentCount,
      totalTokens: validTokens.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Erro interno ao processar disparo de notificações push'
    });
  }
}
