import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { generateEmailHtml, EmailTemplatePayload } from './emailService';

export interface KiwifyProduct {
  product_id?: string;
  product_name?: string;
  name?: string;
}

export interface KiwifyCustomer {
  full_name?: string;
  name?: string;
  email: string;
  mobile?: string;
}

export interface KiwifySubscription {
  id?: string;
  status?: string;
  next_payment?: string;
  start_date?: string;
}

export interface KiwifyWebhookPayload {
  order_id?: string;
  order_ref?: string;
  order_status?: string;
  event_type?: string;
  payment_method?: string;
  is_simulation?: boolean;
  Product?: KiwifyProduct;
  product?: KiwifyProduct;
  product_name?: string;
  Customer?: KiwifyCustomer;
  customer?: KiwifyCustomer;
  Subscription?: KiwifySubscription;
  subscription?: KiwifySubscription;
  [key: string]: any;
}

export interface WebhookProcessResult {
  success: boolean;
  actionType: 'created' | 'updated' | 'skipped' | 'failed';
  churchId?: string;
  churchName?: string;
  inviteCode?: string;
  customerEmail?: string;
  customerName?: string;
  productName?: string;
  planStatus?: 'active' | 'suspended' | 'trial';
  expiresAtISO?: string | null;
  passwordTokenId?: string;
  passwordSetupUrl?: string;
  emailPayload?: {
    type: EmailTemplatePayload['type'];
    subject: string;
    html: string;
  };
  message: string;
  error?: string;
}

/**
 * Normaliza e extrai os campos principais do payload do webhook da Kiwify.
 */
export function parseKiwifyPayload(rawBody: KiwifyWebhookPayload) {
  const orderId = (rawBody.order_id || rawBody.order_ref || `ord-${Date.now()}`).toString();
  const orderStatus = (rawBody.order_status || rawBody.event_type || 'approved').toString().toLowerCase();
  const eventType = (rawBody.event_type || 'order_approved').toString().toLowerCase();
  const isSimulation = Boolean(rawBody.is_simulation);

  const customerName = (
    rawBody.Customer?.full_name || 
    rawBody.Customer?.name || 
    rawBody.customer?.name || 
    rawBody.customer?.full_name || 
    'Ministro de Louvor'
  ).toString();

  const customerEmail = (
    rawBody.Customer?.email || 
    rawBody.customer?.email || 
    ''
  ).toString().toLowerCase().trim();

  const productName = (
    rawBody.Product?.product_name || 
    rawBody.Product?.name || 
    rawBody.product?.name || 
    rawBody.product_name || 
    'Liloupro Plano Completo'
  ).toString();

  const subscriptionId = rawBody.Subscription?.id || rawBody.subscription?.id || null;

  return {
    orderId,
    orderStatus,
    eventType,
    isSimulation,
    customerName,
    customerEmail,
    productName,
    subscriptionId
  };
}

/**
 * Analisa o status do pedido e do evento Kiwify para determinar o status do plano e data de expiração.
 */
export function verifyPaymentStatus(orderStatus: string, eventType: string, productName: string) {
  const isApproved = 
    orderStatus.includes('paid') || 
    orderStatus.includes('approved') || 
    orderStatus.includes('active') || 
    orderStatus.includes('renewed') || 
    eventType.includes('approved') || 
    eventType.includes('paid') || 
    eventType.includes('renewed') || 
    eventType.includes('compra_aprovada');

  const isCancelledOrRefunded = 
    orderStatus.includes('refund') || 
    orderStatus.includes('cancel') || 
    orderStatus.includes('charged') || 
    orderStatus.includes('refus') || 
    eventType.includes('refund') || 
    eventType.includes('cancel');

  let planStatus: 'active' | 'suspended' | 'trial' = 'active';
  if (isCancelledOrRefunded) {
    planStatus = 'suspended';
  } else if (!isApproved) {
    planStatus = 'trial';
  }

  let expiresAtISO: string | null = null;
  if (planStatus === 'active') {
    const pLower = productName.toLowerCase();
    const now = new Date();
    if (pLower.includes('mensal') || pLower.includes('month')) {
      now.setDate(now.getDate() + 32);
      expiresAtISO = now.toISOString();
    } else if (pLower.includes('trimestral')) {
      now.setDate(now.getDate() + 92);
      expiresAtISO = now.toISOString();
    } else if (pLower.includes('vitalicio') || pLower.includes('lifetime') || pLower.includes('vitalício')) {
      expiresAtISO = null;
    } else {
      // Padrão Plano Anual (366 dias)
      now.setDate(now.getDate() + 366);
      expiresAtISO = now.toISOString();
    }
  }

  return {
    isApproved,
    isCancelledOrRefunded,
    planStatus,
    expiresAtISO
  };
}

/**
 * Processa a notificação da Kiwify, atualiza/cria a igreja no Firestore e gera os dados do e-mail.
 */
export async function processKiwifyWebhook(
  dbInstance: any,
  rawPayload: KiwifyWebhookPayload,
  appBaseUrl?: string
): Promise<WebhookProcessResult> {
  try {
    const {
      orderId,
      orderStatus,
      eventType,
      isSimulation,
      customerName,
      customerEmail,
      productName,
      subscriptionId
    } = parseKiwifyPayload(rawPayload);

    if (!customerEmail || !customerEmail.includes('@')) {
      return {
        success: false,
        actionType: 'failed',
        message: 'E-mail do cliente não fornecido ou inválido no payload.',
        error: 'INVALID_EMAIL'
      };
    }

    const { planStatus, expiresAtISO, isApproved, isCancelledOrRefunded } = verifyPaymentStatus(orderStatus, eventType, productName);

    const churchesCol = collection(dbInstance, 'churches');
    const q = query(churchesCol, where('contactEmail', '==', customerEmail));
    const querySnap = await getDocs(q);

    let churchId = '';
    let churchNameFormatted = '';
    let inviteCode = '';
    let actionType: 'created' | 'updated' = 'created';
    let passwordTokenId: string | undefined;
    let passwordSetupUrl: string | undefined;
    let emailTemplateType: EmailTemplatePayload['type'] = 'welcome_password_definition';

    const baseUrl = appBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://liloupro.com.br');

    if (!querySnap.empty) {
      // 1. Igreja já existente -> Atualizar Plano
      actionType = 'updated';
      const existingDoc = querySnap.docs[0];
      churchId = existingDoc.id;
      const churchData = existingDoc.data();
      churchNameFormatted = churchData.name || customerName;
      inviteCode = churchData.inviteCode || 'LILOU';

      const existingNotes = churchData.masterNotes || '';
      const newNote = `\n[${new Date().toLocaleDateString('pt-BR')}] Webhook Kiwify (${isSimulation ? 'Simulação' : 'Real'}): Pedido #${orderId} - Status: ${orderStatus.toUpperCase()}`;

      await setDoc(doc(dbInstance, 'churches', churchId), {
        planStatus,
        planName: productName,
        planExpiresAt: expiresAtISO,
        kiwifySubscriptionId: subscriptionId || churchData.kiwifySubscriptionId || null,
        masterNotes: (existingNotes + newNote).trim(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      if (isCancelledOrRefunded) {
        emailTemplateType = 'subscription_cancelled';
      } else if (isApproved) {
        emailTemplateType = 'payment_approved';
      } else {
        emailTemplateType = 'payment_failed';
      }

    } else {
      // 2. Igreja Nova -> Criar Registro Automático e Gerar Token de Senha
      actionType = 'created';
      churchId = `kw-${customerEmail.replace(/[^a-z0-9]/g, '-').slice(0, 25)}-${Date.now().toString().slice(-4)}`;
      
      const cleanNamePrefix = customerName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'LIL';
      inviteCode = `${cleanNamePrefix}${Math.floor(100 + Math.random() * 900)}`;

      churchNameFormatted = customerName.toLowerCase().includes('igreja') || customerName.toLowerCase().includes('comunidade')
        ? customerName
        : `Igreja de ${customerName}`;

      await setDoc(doc(dbInstance, 'churches', churchId), {
        name: churchNameFormatted,
        inviteCode: inviteCode,
        contactEmail: customerEmail,
        planStatus: planStatus,
        planName: productName,
        planExpiresAt: expiresAtISO,
        kiwifySubscriptionId: subscriptionId,
        masterNotes: `Ativação 100% Automática via Kiwify Webhook. Pedido #${orderId} (${isSimulation ? 'Simulado' : 'Real'})`,
        createdBy: 'Kiwify Webhook Engine',
        createdAt: new Date().toISOString()
      });

      // Gerar Token de Primeiro Acesso para Definir Senha
      try {
        passwordTokenId = `token-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;
        const expiresAtToken = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await setDoc(doc(dbInstance, 'password_tokens', passwordTokenId), {
          email: customerEmail,
          churchId,
          churchName: churchNameFormatted,
          userName: customerName,
          planName: productName,
          createdAt: new Date().toISOString(),
          expiresAt: expiresAtToken,
          used: false
        });

        passwordSetupUrl = `${baseUrl}/set-password?token=${passwordTokenId}`;
        emailTemplateType = 'welcome_password_definition';
      } catch (tokErr) {
        console.error('[Kiwify Webhook] Erro ao salvar password_token no Firestore:', tokErr);
      }
    }

    // 3. Registrar Log no Firestore
    try {
      const logId = `log-kw-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await setDoc(doc(dbInstance, 'kiwify_webhooks', logId), {
        orderId,
        orderStatus,
        eventType,
        customerEmail,
        customerName,
        productName,
        planStatus,
        churchId,
        inviteCode,
        actionType,
        isSimulation,
        receivedAt: new Date().toISOString()
      });
    } catch (logErr) {
      console.error('[Kiwify Webhook Log Error]:', logErr);
    }

    // 4. Gerar E-mail Automático de Boas-Vindas / Atualização
    const emailPayload: EmailTemplatePayload = {
      type: emailTemplateType,
      recipientEmail: customerEmail,
      recipientName: customerName,
      churchName: churchNameFormatted,
      planName: productName,
      startDateFormatted: new Date().toLocaleDateString('pt-BR'),
      passwordSetupUrl,
      loginUrl: `${baseUrl}/login`
    };

    const { subject, html } = generateEmailHtml(emailPayload);

    return {
      success: true,
      actionType,
      churchId,
      churchName: churchNameFormatted,
      inviteCode,
      customerEmail,
      customerName,
      productName,
      planStatus,
      expiresAtISO,
      passwordTokenId,
      passwordSetupUrl,
      emailPayload: {
        type: emailTemplateType,
        subject,
        html
      },
      message: actionType === 'created'
        ? `Igreja "${churchNameFormatted}" criada e ativada automaticamente com sucesso!`
        : `Plano da igreja "${churchNameFormatted}" atualizado com sucesso!`
    };

  } catch (err: any) {
    console.error('[processKiwifyWebhook Error]:', err);
    return {
      success: false,
      actionType: 'failed',
      message: 'Erro interno ao processar webhook Kiwify.',
      error: err.message || String(err)
    };
  }
}
