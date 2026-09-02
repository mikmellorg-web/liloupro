import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging, type MulticastMessage } from 'firebase-admin/messaging';

// Inicialização segura do Firebase Admin com suporte a Vercel Serverless
if (!getApps().length) {
  try {
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (rawServiceAccount) {
      let serviceAccount: any;
      if (typeof rawServiceAccount === 'string') {
        serviceAccount = JSON.parse(rawServiceAccount.trim());
      } else {
        serviceAccount = rawServiceAccount;
      }
      initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('[Firebase Admin] Inicializado com sucesso via Service Account.');
    } else {
      initializeApp();
      console.log('[Firebase Admin] Inicializado com Default Credentials.');
    }
  } catch (initErr) {
    console.error('[Firebase Admin Init Error]:', initErr);
  }
}

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

    const payloadTitle = title || 'LiLouPro • Notificação';
    const payloadBody = body || 'Nova mensagem no ministério de louvor.';

    // Envio oficial via Firebase Admin SDK (FCM HTTP v1)
    if (getApps().length) {
      const messagePayload: MulticastMessage = {
        notification: {
          title: payloadTitle,
          body: payloadBody,
        },
        data: {
          title: payloadTitle,
          body: payloadBody,
          url: url || '/',
          ...(data || {})
        },
        webpush: {
          headers: {
            Urgency: 'high',
            TTL: '86400'
          },
          notification: {
            title: payloadTitle,
            body: payloadBody,
            icon: '/pwa-512x512.png?v=4.0',
            badge: '/pwa-192x192.png?v=4.0',
            vibrate: [200, 100, 200]
          },
          fcmOptions: {
            link: url || '/'
          }
        },
        tokens: validTokens
      };

      const response = await getMessaging().sendEachForMulticast(messagePayload);
      console.log(`[FCM HTTP v1] Disparo para ${validTokens.length} tokens: ${response.successCount} sucesso(s), ${response.failureCount} falha(s).`);

      const errors: any[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          errors.push({ token: validTokens[idx].slice(0, 10) + '...', error: resp.error ? resp.error.message : 'Unknown' });
        }
      });

      return res.status(200).json({
        success: true,
        sentCount: response.successCount,
        totalTokens: validTokens.length,
        errors: errors.length > 0 ? errors : undefined
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Firebase Admin SDK não pôde ser inicializado no servidor.'
    });
  } catch (err: any) {
    console.error('[FCM Handler Error]:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Erro interno ao processar disparo de notificações push'
    });
  }
}
