// LiLouPro Plan and Subscription Management Service

export interface EffectivePlanResult {
  planId: 'vitalicio' | 'completo' | 'premium' | 'semeadora' | 'expired' | 'gratis' | string;
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
    multiCampus: boolean;
    advancedReports: boolean;
    prioritySupport: boolean;
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
    badge: 'Igrejas Locais',
    priceMonthly: 49,
    priceAnnual: 470.40,
    kiwifyCheckoutUrl: 'https://pay.kiwify.com.br/3qXHMCe',
    kiwifyAnnualCheckoutUrl: 'https://pay.kiwify.com.br/xrEKt4N',
    description: 'Ideal para igrejas e ministérios locais.',
    maxMembers: 50,
    maxSongs: 9999,
    features: [
      'Até 50 membros ativos na equipe',
      'Repertório, cifras e liturgias ilimitadas',
      'Escalas e confirmação de presença via WhatsApp',
      'Projeção OBS Studio & Holyrics inclusa',
      'Assistente IA e exportação Google Docs'
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
    badge: 'Mais Popular / Redes & Multi-campus',
    priceMonthly: 99,
    priceAnnual: 950.40,
    kiwifyCheckoutUrl: 'https://pay.kiwify.com.br/BlF0RJs',
    kiwifyAnnualCheckoutUrl: 'https://pay.kiwify.com.br/xlsUZKY',
    description: 'Para igrejas em crescimento, redes e múltiplos polos.',
    maxMembers: 9999,
    maxSongs: 9999,
    features: [
      'Membros ILIMITADOS na equipe',
      'Gestão Multi-Campus / Múltiplas Congregações',
      'Relatórios gerenciais consolidados de participação',
      'Suporte prioritário via WhatsApp / VIP',
      'Tudo do Plano Completo sem restrições'
    ]
  },
  semeadora: {
    id: 'semeadora',
    name: 'Período de Testes Encerrado',
    priceMonthly: 0,
    priceAnnual: 0,
    description: 'Assine o Plano Completo ou Premium para continuar utilizando os recursos da equipe.',
    maxMembers: 0,
    maxSongs: 0,
    features: [
      'Dados históricos preservados na nuvem',
      'Requer assinatura ativa para novos cadastros'
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
      planId: 'completo',
      planName: 'Plano Completo (Teste 30 Dias)',
      plan: { id: 'completo', name: 'Plano Completo' },
      isTrial: true,
      trialDaysLeft: 30,
      isExpiredTrial: false,
      isVitalicio: false,
      isPaidActive: false,
      maxMembers: 50,
      maxSongs: 9999,
      features: {
        projection: true,
        unlimitedSongs: true,
        aiAssistant: true,
        fcmPush: true,
        googleDocsCaderno: true,
        scalesAndAvailability: true,
        customThemes: true,
        multiCampus: false,
        advancedReports: false,
        prioritySupport: false
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
        customThemes: true,
        multiCampus: true,
        advancedReports: true,
        prioritySupport: true
      }
    };
  }

  const rawPlanStr = String(
    churchData.planId ||
    churchData.subscription?.plan ||
    churchData.planName ||
    'completo'
  ).toLowerCase();
  
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
  const planStatus = String(churchData.planStatus || '').toLowerCase();
  const isSuspendedOrCancelled = planStatus === 'suspended' || planStatus === 'cancelled';
  const isPaidActive = !isSuspendedOrCancelled && Boolean(churchData.subscription?.active || planStatus === 'active');
  const isExpired = !isPaidActive && elapsed > trialDurationMs;
  const isTrial = !isPaidActive && !isExpired;
  const isPremiumPaid = isPaidActive && rawPlanStr.includes('premium');

  // Trial expirado sem assinatura ativa: bloqueia novos membros e recursos premium/completos
  if (isExpired) {
    return {
      planId: 'semeadora',
      planName: 'Período de Testes Encerrado',
      plan: { id: 'semeadora', name: 'Período de Testes Encerrado' },
      isTrial: false,
      trialDaysLeft: 0,
      isExpiredTrial: true,
      isVitalicio: false,
      isPaidActive: false,
      maxMembers: 0,
      maxSongs: 0,
      features: {
        projection: false,
        unlimitedSongs: false,
        aiAssistant: false,
        fcmPush: false,
        googleDocsCaderno: false,
        scalesAndAvailability: false,
        customThemes: false,
        multiCampus: false,
        advancedReports: false,
        prioritySupport: false
      }
    };
  }

  // Plano Premium ativo: membros ilimitados + multi-campus + relatórios consolidados + suporte VIP
  if (isPremiumPaid) {
    return {
      planId: 'premium',
      planName: 'Plano Premium',
      plan: { id: 'premium', name: 'Plano Premium' },
      isTrial: false,
      trialDaysLeft: 0,
      isExpiredTrial: false,
      isVitalicio: false,
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
        customThemes: true,
        multiCampus: true,
        advancedReports: true,
        prioritySupport: true
      }
    };
  }

  // Trial de 30 dias OU Plano Completo ativo: teto estrito de 50 membros + projeção OBS/Holyrics e recursos completos
  return {
    planId: 'completo',
    planName: isTrial ? 'Plano Completo (Teste 30 Dias)' : 'Plano Completo',
    plan: { id: 'completo', name: 'Plano Completo' },
    isTrial,
    trialDaysLeft,
    isExpiredTrial: false,
    isVitalicio: false,
    isPaidActive,
    maxMembers: 50,
    maxSongs: 9999,
    features: {
      projection: true,
      unlimitedSongs: true,
      aiAssistant: true,
      fcmPush: true,
      googleDocsCaderno: true,
      scalesAndAvailability: true,
      customThemes: true,
      multiCampus: false,
      advancedReports: false,
      prioritySupport: false
    }
  };
}

export function checkResourceLimit(
  churchData: any,
  resourceType: 'members' | 'songs' | 'services' | string,
  currentCount: number
): ResourceCheckResult {
  const plan = getChurchEffectivePlan(churchData);

  const resourceNameLabel =
    resourceType === 'members'
      ? 'membros'
      : resourceType === 'songs'
        ? 'músicas'
        : resourceType === 'services'
          ? 'cultos'
          : resourceType;

  if (plan.isVitalicio) {
    return {
      allowed: true,
      resourceType,
      currentCount,
      maxAllowed: 9999,
      effectivePlan: plan
    };
  }

  // Trial expirado sem assinatura ativa: bloqueia novos cadastros (maxMembers = 0)
  if (plan.isExpiredTrial) {
    return {
      allowed: false,
      resourceType,
      currentCount,
      maxAllowed: 0,
      limit: 0,
      resourceNameLabel,
      message: `O período de teste gratuito de 30 dias encerrou e o cadastro de novos ${resourceNameLabel} foi bloqueado. Seus dados continuam 100% salvos na nuvem. Assine o Plano Completo ou faça upgrade para o Plano Premium para reativar todos os recursos da equipe.`,
      effectivePlan: plan
    };
  }

  // Validação real do teto estrito de 50 membros no Trial de 30 dias e no Plano Completo ativo
  if (resourceType === 'members' && plan.maxMembers < 9999) {
    // Observação: o fluxo de entrada por código sem autenticação prévia usa sentinela 999 apenas para checar expiração do trial
    if (currentCount !== 999 && currentCount >= plan.maxMembers) {
      return {
        allowed: false,
        resourceType: 'members',
        currentCount,
        maxAllowed: plan.maxMembers,
        limit: plan.maxMembers,
        resourceNameLabel: 'membros',
        message: `Sua igreja atingiu o limite máximo de ${plan.maxMembers} membros ativos do ${plan.plan?.name || 'Plano Completo'}. Faça upgrade para o Plano Premium para liberar membros ILIMITADOS, gestão multi-campus e relatórios gerenciais consolidados!`,
        effectivePlan: plan
      };
    }

    return {
      allowed: true,
      resourceType: 'members',
      currentCount,
      maxAllowed: plan.maxMembers,
      limit: plan.maxMembers,
      effectivePlan: plan
    };
  }

  return {
    allowed: true,
    resourceType,
    currentCount,
    maxAllowed: 9999,
    effectivePlan: plan
  };
}

export function checkMemberLimit(churchData: any, currentCount: number): ResourceCheckResult {
  return checkResourceLimit(churchData, 'members', currentCount);
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

