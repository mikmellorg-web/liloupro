export interface EffectivePlanResult {
  planId: string;
  plan?: any;
  planName?: string;
  isTrial: boolean;
  isExpiredTrial: boolean;
  daysRemaining?: number;
  trialDaysLeft?: number;
}

export interface ResourceCheckResult {
  allowed: boolean;
  limit: number;
  current?: number;
  currentCount?: number;
  resourceNameLabel?: string;
  message?: string;
  effectivePlan?: EffectivePlanResult;
}

export const LILOU_PLANS: Record<string, any> = {
  semeadora: {
    id: 'semeadora',
    name: 'Semeadora (Gratuito)',
    price: 0,
    kiwifyCheckoutUrl: '',
    kiwifyAnnualCheckoutUrl: ''
  },
  completo: {
    id: 'completo',
    name: 'Plano Completo',
    price: 49,
    kiwifyCheckoutUrl: 'https://pay.kiwify.com.br/hzdGE1G',
    kiwifyAnnualCheckoutUrl: 'https://pay.kiwify.com.br/hzdGE1G'
  },
  premium: {
    id: 'premium',
    name: 'Plano Premium',
    price: 99,
    kiwifyCheckoutUrl: 'https://pay.kiwify.com.br/hzdGE1G',
    kiwifyAnnualCheckoutUrl: 'https://pay.kiwify.com.br/hzdGE1G'
  },
  vitalicio: {
    id: 'vitalicio',
    name: 'Acesso Vitalício',
    price: 697.9,
    kiwifyCheckoutUrl: 'https://pay.kiwify.com.br/hzdGE1G',
    kiwifyAnnualCheckoutUrl: 'https://pay.kiwify.com.br/hzdGE1G'
  }
};

export function isVitalicioPlan(churchData?: any): boolean {
  if (!churchData) return false;
  return churchData.plan === 'vitalicio' || churchData.isVitalicio === true;
}

export function getChurchEffectivePlan(churchData?: any): EffectivePlanResult {
  if (!churchData) {
    return {
      planId: 'completo',
      plan: LILOU_PLANS.completo,
      planName: 'Plano Completo',
      isTrial: false,
      isExpiredTrial: false,
      trialDaysLeft: 30
    };
  }

  const planKey = churchData.plan || 'completo';
  const planObj = LILOU_PLANS[planKey] || LILOU_PLANS.completo;
  return {
    planId: planKey,
    plan: planObj,
    planName: planKey === 'vitalicio' ? 'Acesso Vitalício' : (planKey === 'premium' ? 'Plano Premium' : 'Plano Completo'),
    isTrial: false,
    isExpiredTrial: false,
    daysRemaining: 30,
    trialDaysLeft: 30
  };
}

export function checkResourceLimit(resourceType: string, currentCount: number, churchData?: any): ResourceCheckResult {
  return {
    allowed: true,
    limit: 999999,
    current: currentCount,
    currentCount: currentCount,
    resourceNameLabel: resourceType,
    effectivePlan: getChurchEffectivePlan(churchData)
  };
}
