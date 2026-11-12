// LiLouPro Plan and Subscription Management Service

export interface EffectivePlanResult {
  planId: 'vitalicio' | 'completo' | 'premium' | 'semeadora' | 'gratis' | string;
  planName: string;
  plan?: {
    id: string;
    name: string;
    description?: string;
  };
  isTrial: boolean;
  trialDaysLeft: number;
  isExpiredTrial: boolean;
  isVitalicio: boolean;
  isPaidActive: boolean;
  maxMembers: number;
  maxSongs: number;
  features: {
    projection: boolean;
    unlimitedSongs: boolean;
    aiAssistant: boolean;
    fcmPush: boolean;
    googleDocsCaderno: boolean;
    scalesAndAvailability: boolean;
    customThemes: boolean;
    [key: string]: boolean;
  };
}

export interface ResourceCheckResult {
  allowed: boolean;
  resourceType?: 'members' | 'songs' | 'services' | string;
  currentCount: number;
  maxAllowed?: number;
  limit?: number;
  resourceNameLabel?: string;
  message?: string;
  effectivePlan?: EffectivePlanResult;
}

export interface PlanDefinition {
  id: string;
  name: string;
  badge?: string;
  priceMonthly: number;
  priceAnnual: number;
  kiwifyCheckoutUrl?: string;
  kiwifyAnnualCheckoutUrl?: string;
  description: string;
  maxMembers: number;
  maxSongs: number;
  features: string[];
}

export const LILOU_PLANS: Record<string, PlanDefinition> = {
  completo: {
    id: 'completo',
    name: 'Plano Completo',
    badge: 'Mais Popular',
    priceMonthly: 49,
    priceAnnual: 470.40,
    kiwifyCheckoutUrl: 'https://pay.kiwify.com.br/3qXHMCe',
    kiwifyAnnualCheckoutUrl: 'https://pay.kiwify.com.br/xrEKt4N',
    description: 'Gestão integral com repertório ilimitado, projeção em tempo real e escalas.',
    maxMembers: 50,
    maxSongs: 9999,
    features: [
      'Repertório e cifras ilimitadas',
      'Projeção simultânea em telão e OBS',
      'Assistente de Voz Lilou Hands-free',
      'Exportação de Caderno em PDF / Google Docs',
      'Escalas de ministério e disponibilidades'
    ]
  },
  vitalicio: {
    id: 'vitalicio',
    name: 'Plano Vitalício',
    badge: 'Acesso Eterno',
    priceMonthly: 697.90,
    priceAnnual: 697.90,
    kiwifyCheckoutUrl: 'https://pay.kiwify.com.br/hzdGE1G',
    kiwifyAnnualCheckoutUrl: 'https://pay.kiwify.com.br/hzdGE1G',
    description: 'Pague uma única vez e tenha acesso permanente sem mensalidades futuras.',
    maxMembers: 9999,
    maxSongs: 9999,
    features: [
      'Acesso perpétuo sem renovação periódica',
      'Todos os recursos presentes e futuros',
      'Membros e músicas ilimitadas',
      'Suporte prioritário via WhatsApp'
    ]
  },
  premium: {
    id: 'premium',
    name: 'Plano Premium',
    badge: 'Igrejas Grandes',
    priceMonthly: 99,
    priceAnnual: 950.40,
    kiwifyCheckoutUrl: 'https://pay.kiwify.com.br/BlF0RJs',
    kiwifyAnnualCheckoutUrl: 'https://pay.kiwify.com.br/xlsUZKY',
    description: 'Para ministérios com múltiplos polos e grande quantidade de integrantes.',
    maxMembers: 9999,
    maxSongs: 9999,
    features: [
      'Membros ilimitados',
      'Múltiplas salas de projeção simultâneas',
      'Integrações avançadas'
    ]
  },
  semeadora: {
    id: 'semeadora',
    name: 'Plano Semeadora',
    priceMonthly: 0,
    priceAnnual: 0,
    description: 'Plano inicial para pequenas congregações.',
    maxMembers: 5,
    maxSongs: 15,
    features: [
      'Até 5 membros na equipe',
      'Até 15 músicas no repertório',
      'Projeção básica'
    ]
  }
};

export function isVitalicioPlan(churchData: any): boolean {
  if (!churchData) return false;
  const planId = (churchData.planId || churchData.subscription?.plan || '').toLowerCase();
  const churchName = (churchData.name || churchData.churchName || '').toLowerCase();
  const churchId = (churchData.id || '').toLowerCase();
  
  // 1. Igreja pioneira e semente (Graça Soberana) tem acesso perpétuo vitalício incondicional
  if (
    churchId === 'semente' ||
    churchData.isSeedChurch === true ||
    churchName.includes('graça soberana') ||
    churchName.includes('graca soberana')
  ) {
    return true;
  }

  if (planId === 'vitalicio' || planId === 'lifetime' || churchData.isVitalicio === true) {
    return true;
  }

  return false;
}

export function getChurchEffectivePlan(churchData: any): EffectivePlanResult {
  if (!churchData) {
    return {
      planId: 'gratis',
      planName: 'Plano Gratuito',
      plan: { id: 'gratis', name: 'Plano Gratuito' },
      isTrial: true,
      trialDaysLeft: 30,
      isExpiredTrial: false,
      isVitalicio: false,
      isPaidActive: false,
      maxMembers: 5,
      maxSongs: 15,
      features: {
        projection: true,
        unlimitedSongs: false,
        aiAssistant: true,
        fcmPush: true,
        googleDocsCaderno: true,
        scalesAndAvailability: true,
        customThemes: true
      }
    };
  }

  // Igreja Pioneira (Graça Soberana / Semente) NUNCA inicia contagem de dias e NUNCA expira
  if (isVitalicioPlan(churchData)) {
    return {
      planId: 'vitalicio',
      planName: 'Plano Vitalício',
      plan: { id: 'vitalicio', name: 'Plano Vitalício' },
      isTrial: false,
      trialDaysLeft: 9999,
      isExpiredTrial: false,
      isVitalicio: true,
      isPaidActive: true,
      maxMembers: 9999,
      maxSongs: 9999,
      features: {
        projection: true,
        unlimitedSongs: true,
        aiAssistant: true,
        fcmPush: true,
        googleDocsCaderno: true,
        scalesAndAvailability: true,
        customThemes: true
      }
    };
  }

  const rawPlanId = (churchData.planId || churchData.subscription?.plan || 'completo').toLowerCase();
  
  // Parse createdAt safely across Firestore Timestamp objects, numbers, and ISO strings
  let createdAtMs = Date.now();
  if (churchData.createdAt) {
    if (typeof churchData.createdAt.toDate === 'function') {
      createdAtMs = churchData.createdAt.toDate().getTime();
    } else if (churchData.createdAt.seconds) {
      createdAtMs = churchData.createdAt.seconds * 1000;
    } else if (typeof churchData.createdAt === 'number') {
      createdAtMs = churchData.createdAt;
    } else if (typeof churchData.createdAt === 'string') {
      const parsed = new Date(churchData.createdAt).getTime();
      if (!isNaN(parsed)) {
        createdAtMs = parsed;
      }
    }
  }

  const trialDurationMs = 30 * 24 * 60 * 60 * 1000;
  const elapsed = Math.max(0, Date.now() - createdAtMs);
  const trialDaysLeft = Math.max(0, Math.ceil((trialDurationMs - elapsed) / (24 * 60 * 60 * 1000)));
  const isExpired = elapsed > trialDurationMs && !churchData.subscription?.active;
  const isPaidActive = Boolean(churchData.subscription?.active);
  const pName = isExpired ? 'Plano Semeadora' : (LILOU_PLANS[rawPlanId]?.name || 'Plano Completo');

  return {
    planId: isExpired ? 'semeadora' : rawPlanId,
    planName: pName,
    plan: { id: isExpired ? 'semeadora' : rawPlanId, name: pName },
    isTrial: !isPaidActive && !isExpired,
    trialDaysLeft,
    isExpiredTrial: isExpired,
    isVitalicio: false,
    isPaidActive,
    maxMembers: isPaidActive ? 9999 : (isExpired ? 5 : 50),
    maxSongs: isPaidActive ? 9999 : (isExpired ? 15 : 9999),
    features: {
      projection: true,
      unlimitedSongs: !isExpired,
      aiAssistant: true,
      fcmPush: true,
      googleDocsCaderno: true,
      scalesAndAvailability: true,
      customThemes: true
    }
  };
}

export function checkResourceLimit(
  churchData: any,
  resourceType: 'members' | 'songs' | 'services' | string,
  currentCount: number
): ResourceCheckResult {
  const plan = getChurchEffectivePlan(churchData);

  if (plan.isVitalicio || plan.isPaidActive || plan.isTrial) {
    return {
      allowed: true,
      resourceType,
      currentCount,
      maxAllowed: 9999,
      effectivePlan: plan
    };
  }

  const resourceNameLabel =
    resourceType === 'members'
      ? 'membros'
      : resourceType === 'songs'
        ? 'músicas'
        : resourceType === 'services'
          ? 'cultos'
          : resourceType;

  const freeCap = resourceType === 'songs' ? 15 : resourceType === 'members' ? 5 : 0;

  return {
    allowed: false,
    resourceType,
    currentCount,
    maxAllowed: freeCap,
    limit: freeCap,
    resourceNameLabel,
    message: `O período de teste gratuito de 30 dias encerrou e sua igreja está no Plano Semeadora (Gratuito, com acesso limitado a 15 músicas e 5 membros ativos). Seus dados já cadastrados permanecem salvos. Faça upgrade para cadastrar novos ${resourceNameLabel} e liberar toda a equipe e repertório.`,
    effectivePlan: plan
  };
}

function parseMemberTimestamp(member: any, fallbackIndex: number): number {
  const raw = member?.createdAt;
  if (!raw) return 9000000000000 + fallbackIndex;
  if (typeof raw?.toDate === 'function') return raw.toDate().getTime();
  if (typeof raw?.seconds === 'number') return raw.seconds * 1000;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const parsed = new Date(raw).getTime();
    if (!isNaN(parsed)) return parsed;
  }
  return 9000000000000 + fallbackIndex;
}

/**
 * Retorna os IDs dos 5 membros ativos permitidos no Plano Semeadora (Gratuito)
 * após o encerramento dos 30 dias de teste:
 * - Vaga 1: Administrador / Líder criador da igreja
 * - Vagas 2 a 5: Os 4 primeiros membros cadastrados por ordem de antiguidade
 */
export function getActiveFreeMemberIds(members: any[], churchData?: any): Set<string> {
  const activeIds = new Set<string>();
  if (!Array.isArray(members) || members.length === 0) return activeIds;

  const creatorUid = churchData?.createdBy || '';
  const indexed = members.map((m, idx) => ({ member: m, idx }));

  indexed.sort((a, b) => {
    const aIsCreator = Boolean(creatorUid && (a.member.id === creatorUid || a.member.uid === creatorUid));
    const bIsCreator = Boolean(creatorUid && (b.member.id === creatorUid || b.member.uid === creatorUid));
    if (aIsCreator !== bIsCreator) return aIsCreator ? -1 : 1;

    const aIsAdmin = Boolean(a.member.isAdmin);
    const bIsAdmin = Boolean(b.member.isAdmin);
    if (aIsAdmin !== bIsAdmin) return aIsAdmin ? -1 : 1;

    const timeA = parseMemberTimestamp(a.member, a.idx);
    const timeB = parseMemberTimestamp(b.member, b.idx);
    if (timeA !== timeB) return timeA - timeB;
    return a.idx - b.idx;
  });

  indexed.slice(0, 5).forEach(({ member }) => {
    if (member?.id) activeIds.add(String(member.id));
    if (member?.uid) activeIds.add(String(member.uid));
  });

  return activeIds;
}

export function isMemberPausedByFreeLimit(member: any, members: any[], churchData?: any): boolean {
  if (!member) return false;
  const plan = getChurchEffectivePlan(churchData);
  if (plan.isVitalicio || plan.isPaidActive || plan.isTrial || !plan.isExpiredTrial) {
    return false;
  }
  const activeIds = getActiveFreeMemberIds(members, churchData);
  const memberId = member.id ? String(member.id) : '';
  const memberUid = member.uid ? String(member.uid) : '';
  if ((memberId && activeIds.has(memberId)) || (memberUid && activeIds.has(memberUid))) {
    return false;
  }
  return true;
}

