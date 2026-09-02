import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging, type MulticastMessage } from 'firebase-admin/messaging';

function initFirebaseAdmin() {
  if (getApps().length > 0) return true;

  try {
    // 1. Verificar variável FIREBASE_SERVICE_ACCOUNT (JSON ou base64)
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (rawServiceAccount) {
      let serviceAccount: any;
      if (typeof rawServiceAccount === 'string') {
        const trimmed = rawServiceAccount.trim();
        if (trimmed.startsWith('{')) {
          serviceAccount = JSON.parse(trimmed);
        } else {
          // Tentar base64 decode
          const decoded = Buffer.from(trimmed, 'base64').toString('utf-8');
          serviceAccount = JSON.parse(decoded);
        }
      } else {
        serviceAccount = rawServiceAccount;
      }
      initializeApp({ credential: cert(serviceAccount) });
      console.log('[Firebase Admin] Inicializado com sucesso via Service Account.');
      return true;
    }

    // 2. Verificar variáveis separadas (comuns no Vercel)
    const projectId = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0330039755';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('[Firebase Admin] Inicializado com sucesso via variáveis individuais.');
      return true;
    }

    // 3. Fallback para Application Default Credentials (ambientes GCP/Cloud Run)
    initializeApp();
    console.log('[Firebase Admin] Inicializado com Default Credentials.');
    return true;
  } catch (initErr: any) {
    console.warn('[Firebase Admin Init Warning]:', initErr?.message || initErr);
    return false;
  }
}

initFirebaseAdmin();

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

    initFirebaseAdmin();

    // Sanitizar data: O Firebase Admin SDK exige estritamente que TODAS as chaves e valores de `data` sejam strings.
    const sanitizedData: Record<string, string> = {
      title: String(payloadTitle),
      body: String(payloadBody),
      url: String(url || '/'),
    };
    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          sanitizedData[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
        }
      });
    }

    // Envio oficial via Firebase Admin SDK (FCM HTTP v1)
    if (getApps().length) {
      const messagePayload: MulticastMessage = {
        notification: {
          title: payloadTitle,
          body: payloadBody,
        },
        data: sanitizedData,
        webpush: {
          headers: {
            Urgency: 'high',
            TTL: '86400'
          },
          notification: {
            title: payloadTitle,
            body: payloadBody,
            icon: '/pwa-512x512.png?v=4.0',
            badge: '/pwa-192x192.png?v=4.0'
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

    return res.status(200).json({
      success: false,
      sentCount: 0,
      totalTokens: validTokens.length,
      error: 'Firebase Admin SDK requer a chave FIREBASE_SERVICE_ACCOUNT configurada nas variáveis de ambiente da Vercel.'
    });
  } catch (err: any) {
    console.error('[FCM Handler Error]:', err);
    return res.status(200).json({
      success: false,
      sentCount: 0,
      error: err?.message || 'Erro ao processar disparo de notificações push'
    });
  }
}
