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
    kiwifyCheckoutUrl: 'https://pay.kiwify.com.br/hzdGE1G',
    kiwifyAnnualCheckoutUrl: 'https://pay.kiwify.com.br/hzdGE1G',
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
    kiwifyCheckoutUrl: 'https://pay.kiwify.com.br/hzdGE1G',
    kiwifyAnnualCheckoutUrl: 'https://pay.kiwify.com.br/hzdGE1G',
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
    maxSongs: 20,
    features: [
      'Até 5 membros na equipe',
      'Até 20 músicas no repertório',
      'Projeção básica'
    ]
  }
};

export function isVitalicioPlan(churchData: any): boolean {
  if (!churchData) return false;
  const planId = (churchData.planId || churchData.subscription?.plan || '').toLowerCase();
  const churchName = (churchData.name || churchData.churchName || '').toLowerCase();
  
  if (planId === 'vitalicio' || planId === 'lifetime' || churchData.isVitalicio === true) {
    return true;
  }
  // Igreja pioneira com plano vitalício concedido
  if (churchName.includes('graça soberana') || churchName.includes('graca soberana')) {
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
      maxSongs: 20,
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
  const createdAt = churchData.createdAt ? new Date(churchData.createdAt).getTime() : Date.now();
  const trialDurationMs = 30 * 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - createdAt;
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
    maxMembers: isPaidActive ? 9999 : 50,
    maxSongs: isPaidActive ? 9999 : 9999,
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

  let max = 9999;
  if (resourceType === 'members') {
    max = 5;
  } else if (resourceType === 'songs') {
    max = 20;
  }

  const allowed = currentCount < max;
  return {
    allowed,
    resourceType,
    currentCount,
    maxAllowed: max,
    message: allowed ? undefined : `Limite de ${max} ${resourceType} atingido no Plano Semeadora. Faça upgrade para desbloquear ilimitado.`,
    effectivePlan: plan
  };
}
