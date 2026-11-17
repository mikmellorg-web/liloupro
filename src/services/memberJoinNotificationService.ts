import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sendPushNotification } from './fcmService';

export interface MemberJoinWelcomePayload {
  churchId: string;
  churchName: string;
  memberUid: string;
  memberName: string;
  leaderPhone: string;
  whatsappText: string;
  createdAt: number;
}

export const WELCOME_JOIN_STORAGE_KEY = 'liloupro_welcome_member_join';
export const WELCOME_JOIN_EVENT_NAME = 'liloupro:member-joined';

const inMemoryNotifiedPairs = new Set<string>();

function normalizeBrazilianPhone(rawPhone?: string | null): string {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits || digits.length < 8) return '';
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

export function buildLeaderWhatsAppUrl(leaderPhone: string, whatsappText: string): string {
  const cleanPhone = normalizeBrazilianPhone(leaderPhone);
  const encodedText = encodeURIComponent(whatsappText);
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;
}

export function readPendingJoinWelcome(): MemberJoinWelcomePayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(WELCOME_JOIN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.churchId || !parsed.churchName) return null;
    return parsed as MemberJoinWelcomePayload;
  } catch {
    return null;
  }
}

export function clearPendingJoinWelcome(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(WELCOME_JOIN_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export async function notifyChurchLeadersOfNewMember(params: {
  memberUid: string;
  memberName: string;
  memberEmail?: string;
  churchId: string;
  churchData?: Record<string, any> | null;
}): Promise<void> {
  const { memberUid, memberName, memberEmail = '', churchId, churchData: initialChurchData } = params;
  if (!memberUid || !churchId) return;

  const dedupeKey = `${memberUid}_${churchId}`;
  const storageDedupeKey = `liloupro_join_notified_${dedupeKey}`;

  if (inMemoryNotifiedPairs.has(dedupeKey)) {
    return;
  }

  try {
    if (typeof window !== 'undefined' && localStorage.getItem(storageDedupeKey) === 'true') {
      inMemoryNotifiedPairs.add(dedupeKey);
      return;
    }
  } catch {
    // Ignore storage access errors
  }

  // Lock immediately to prevent duplicate triggers across auth listeners
  inMemoryNotifiedPairs.add(dedupeKey);
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageDedupeKey, 'true');
    }
  } catch {
    // Ignore storage errors
  }

  const cleanMemberName = (memberName || memberEmail.split('@')[0] || 'Novo Membro').trim();

  // 1. Resolve church document & name
  let churchDocData: Record<string, any> = initialChurchData ? { ...initialChurchData } : {};
  if (!churchDocData.name) {
    try {
      const cSnap = await getDoc(doc(db, 'churches', churchId));
      if (cSnap.exists()) {
        churchDocData = { id: cSnap.id, ...cSnap.data() };
      }
    } catch (err) {
      console.warn('[MemberJoinNotify] Erro ao buscar igreja:', err);
    }
  }

  const cleanChurchName = String(churchDocData.name || 'Igreja').trim();
  const exactMessage = `O membro ${cleanMemberName} efetuou o cadastro no LiLouPro na Igreja ${cleanChurchName}.`;
  const whatsappText = exactMessage;
  const notifTitle = '🎉 Novo Cadastro na Equipe!';

  // 2. Find church admins / leaders & collect leader phone + push tokens
  let adminMembers: any[] = [];
  try {
    const membersQuery = churchId === 'semente'
      ? collection(db, 'members')
      : query(collection(db, 'members'), where('churchId', '==', churchId));
    const membersSnap = await getDocs(membersQuery);
    adminMembers = membersSnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as any))
      .filter((m) => {
        const uid = m.uid || m.id;
        if (!uid || uid === memberUid) return false;
        const belongsToChurch = m.churchId === churchId || (!m.churchId && churchId === 'semente');
        if (!belongsToChurch) return false;
        const hasLeaderRole = Array.isArray(m.roles) && (
          m.roles.includes('Coordenador/Líder') ||
          m.roles.includes('Líder') ||
          m.roles.includes('Pastor/Ministro')
        );
        return Boolean(m.isAdmin) || hasLeaderRole;
      });
  } catch (err) {
    console.warn('[MemberJoinNotify] Erro ao buscar líderes da igreja:', err);
  }

  // 3. Resolve settings doc for WhatsApp Admin phone & optional webhook URL
  let settingsData: Record<string, any> = {};
  try {
    const settingsDocId = churchId === 'semente' ? 'notifications' : `notifications_${churchId}`;
    const settingsSnap = await getDoc(doc(db, 'settings', settingsDocId));
    if (settingsSnap.exists()) {
      settingsData = settingsSnap.data() || {};
    }
  } catch {
    // Settings document may not exist yet for newly created churches
  }

  // Resolve leader WhatsApp phone (churches.leaderWhatsapp -> fallback Church/Settings/Admin member)
  const adminMemberWithPhone = adminMembers.find((m) => normalizeBrazilianPhone(m.whatsapp || m.phone));
  const rawLeaderPhone =
    churchDocData.leaderWhatsapp ||
    churchDocData.whatsappAdmin ||
    churchDocData.contactPhone ||
    churchDocData.whatsapp ||
    churchDocData.leaderPhone ||
    settingsData.whatsappAdmin ||
    settingsData.whatsappAdmin2 ||
    settingsData.whatsappAdmin3 ||
    adminMemberWithPhone?.whatsapp ||
    adminMemberWithPhone?.phone ||
    '';
  const leaderPhone = normalizeBrazilianPhone(rawLeaderPhone);

  // Store & broadcast welcome banner/modal immediately for the new member
  const welcomePayload: MemberJoinWelcomePayload = {
    churchId,
    churchName: cleanChurchName,
    memberUid,
    memberName: cleanMemberName,
    leaderPhone,
    whatsappText,
    createdAt: Date.now()
  };

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(WELCOME_JOIN_STORAGE_KEY, JSON.stringify(welcomePayload));
      window.dispatchEvent(new CustomEvent(WELCOME_JOIN_EVENT_NAME, { detail: welcomePayload }));
    }
  } catch {
    // Ignore storage/event errors
  }

  // 4. Create internal bell notifications for every admin in this church
  const adminUids = Array.from(
    new Set(adminMembers.map((m) => String(m.uid || m.id || '')).filter(Boolean))
  );

  if (adminUids.length > 0) {
    await Promise.allSettled(
      adminUids.map((adminUid) =>
        addDoc(collection(db, 'notifications'), {
          userId: adminUid,
          title: notifTitle,
          content: exactMessage,
          type: 'member_join',
          targetTab: 'members',
          churchId,
          newMemberUid: memberUid,
          newMemberName: cleanMemberName,
          read: false,
          createdAt: serverTimestamp()
        })
      )
    );
  }

  // 5. Collect active FCM tokens for church admins & send Web Push
  try {
    const pushTokens: string[] = [];
    const addTokenSafe = (tok: any) => {
      if (typeof tok === 'string') {
        const clean = tok.trim();
        if (clean.length > 15 && !pushTokens.includes(clean)) {
          pushTokens.push(clean);
        }
      }
    };

    adminMembers.forEach((m) => {
      const tok =
        m.lastFcmToken ||
        m.fcmToken ||
        (Array.isArray(m.fcmTokens) ? m.fcmTokens[m.fcmTokens.length - 1] : null);
      if (tok) addTokenSafe(tok);
    });

    if (adminUids.length > 0) {
      const adminUidSet = new Set(adminUids);
      try {
        const tokensQuery = churchId === 'semente'
          ? collection(db, 'fcm_tokens')
          : query(collection(db, 'fcm_tokens'), where('churchId', '==', churchId));
        const tokensSnap = await getDocs(tokensQuery);
        tokensSnap.docs.forEach((d) => {
          const td = d.data() as any;
          if (td?.uid && adminUidSet.has(td.uid) && td?.token) {
            addTokenSafe(td.token);
          }
        });
      } catch {
        // Ignore token lookup error
      }
    }

    if (pushTokens.length > 0) {
      await sendPushNotification({
        tokens: pushTokens,
        title: notifTitle,
        body: exactMessage,
        url: '/?tab=members',
        tag: `member-join-${churchId}-${memberUid}`,
        data: {
          type: 'member_join',
          targetTab: 'members',
          churchId
        }
      });
    }
  } catch (pushErr) {
    console.warn('[MemberJoinNotify] Erro ao enviar push aos líderes:', pushErr);
  }

  // 6. Optional background WhatsApp webhook trigger if configured
  const webhookUrl = String(
    churchDocData.whatsappWebhookUrl ||
    settingsData.whatsappWebhookUrl ||
    (import.meta.env.VITE_WHATSAPP_WEBHOOK_URL as string | undefined) ||
    ''
  ).trim();

  if (webhookUrl && leaderPhone) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'member_joined',
        churchId,
        churchName: cleanChurchName,
        memberUid,
        memberName: cleanMemberName,
        memberEmail,
        leaderPhone,
        message: exactMessage,
        whatsappText
      })
    }).catch(() => {});
  }
}
