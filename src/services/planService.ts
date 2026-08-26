export interface PlanDefinition {
  id: 'semeadora' | 'completo' | 'premium' | 'vitalicio';
  name: string;
  priceFormatted: string;
  priceMonthly: number;
  priceAnnualFormatted?: string;
  description: string;
  popular?: boolean;
  kiwifyCheckoutUrl?: string;
  kiwifyAnnualCheckoutUrl?: string;
  limits: {
    maxActiveMembers: number; // Infinity for unlimited
    maxSongs: number;
    maxScalesPerMonth: number;
    maxLiturgiesPerMonth: number;
    maxAiUsesPerMonth: number;
    hasPremiumProjection: boolean;
    hasMultiCampus: boolean;
    hasAdvancedStats: boolean;
    hasAutomations: boolean;
  };
  features: string[];
}

export const LILOU_PLANS: Record<string, PlanDefinition> = {
  semeadora: {
    id: 'semeadora',
    name: 'Plano Semeadora',
    priceFormatted: 'R$ 0,00',
    priceMonthly: 0,
    description: 'Plano gratuito permanente. Ideal para manter sua igreja funcionando após o período de avaliação.',
    limits: {
      maxActiveMembers: 12,
      maxSongs: 15,
      maxScalesPerMonth: 5,
      maxLiturgiesPerMonth: 3,
      maxAiUsesPerMonth: 5,
      hasPremiumProjection: false,
      hasMultiCampus: false,
      hasAdvancedStats: false,
      hasAutomations: false
    },
    features: [
      'Até 12 membros ativos',
      'Até 15 músicas/cifras cadastradas',
      'Até 5 escalas por mês',
      'Até 3 liturgias por mês',
      'Projeção básica no navegador',
      'Bíblia sagrada integrada',
      'Inteligência Artificial limitada (5 usos/mês)'
    ]
  },
  completo: {
    id: 'completo',
    name: 'Plano Completo',
    priceFormatted: 'R$ 49,00',
    priceMonthly: 49.00,
    priceAnnualFormatted: 'R$ 470,40',
    description: 'Tudo o que sua igreja precisa para gerenciar todas as liturgias, escalas e projeções sem nenhuma limitação.',
    popular: true,
    kiwifyCheckoutUrl: 'https://pay.kiwify.com.br/3qXHMCe',
    kiwifyAnnualCheckoutUrl: 'https://pay.kiwify.com.br/xrEKt4N',
    limits: {
      maxActiveMembers: Infinity,
      maxSongs: Infinity,
      maxScalesPerMonth: Infinity,
      maxLiturgiesPerMonth: Infinity,
      maxAiUsesPerMonth: Infinity,
      hasPremiumProjection: true,
      hasMultiCampus: false,
      hasAdvancedStats: false,
      hasAutomations: true
    },
    features: [
      'Membros ilimitados',
      'Músicas e cifras ilimitadas',
      'Escalas e liturgias ilimitadas',
      'Projeção Premium customizável',
      'Bíblia integrada com busca ultra-rápida',
      'Inteligência Artificial ilimitada',
      'Automações e avisos no WhatsApp',
      'Backup automático na nuvem',
      'Suporte prioritário e novidades em primeira mão'
    ]
  },
  premium: {
    id: 'premium',
    name: 'Plano Premium',
    priceFormatted: 'R$ 99,00',
    priceMonthly: 99.00,
    priceAnnualFormatted: 'R$ 950,40',
    description: 'Ideal para redes de igrejas, grandes ministérios ou multi-campis que exigem gestão avançada.',
    kiwifyCheckoutUrl: 'https://pay.kiwify.com.br/BlF0RJs',
    kiwifyAnnualCheckoutUrl: 'https://pay.kiwify.com.br/xlsUZKY',
    limits: {
      maxActiveMembers: Infinity,
      maxSongs: Infinity,
      maxScalesPerMonth: Infinity,
      maxLiturgiesPerMonth: Infinity,
      maxAiUsesPerMonth: Infinity,
      hasPremiumProjection: true,
      hasMultiCampus: true,
      hasAdvancedStats: true,
      hasAutomations: true
    },
    features: [
      'Tudo do Plano Completo',
      'Multi-campus e múltiplas congregações',
      'Dashboard gerencial com estatísticas avançadas',
      'Relatórios completos de presença e repertório',
      'Backup avançado e segurança dedicada',
      'Atendimento VIP prioritário'
    ]
  },
  vitalicio: {
    id: 'vitalicio',
    name: 'Acesso Vitalício',
    priceFormatted: 'R$ 697,90',
    priceMonthly: 0,
    description: 'Condição de lançamento. Pagamento único sem mensalidade, com todas as funções do Plano Completo para sempre.',
    kiwifyCheckoutUrl: 'https://pay.kiwify.com.br/hzdGE1G',
    limits: {
      maxActiveMembers: Infinity,
      maxSongs: Infinity,
      maxScalesPerMonth: Infinity,
      maxLiturgiesPerMonth: Infinity,
      maxAiUsesPerMonth: Infinity,
      hasPremiumProjection: true,
      hasMultiCampus: false,
      hasAdvancedStats: true,
      hasAutomations: true
    },
    features: [
      'Pagamento ÚNICO sem mensalidades futuras',
      'Voluntários e membros ilimitados',
      'Músicas, cifras e escalas ilimitadas',
      'Projeção Premium para telão',
      'Inteligência Artificial sem restrições',
      'Automações e avisos no WhatsApp',
      'Garantia incondicional de 7 dias via Kiwify'
    ]
  }
};

export const TRIAL_DURATION_DAYS = 30;

export interface EffectivePlanResult {
  planId: 'semeadora' | 'completo' | 'premium' | 'vitalicio';
  plan: PlanDefinition;
  isTrial: boolean;
  trialDaysLeft: number;
  isExpiredTrial: boolean;
  statusLabel: string;
}

/**
 * Calcula os dias restantes de trial de 30 dias a partir da data de criação da igreja.
 */
export function calculateTrialDaysLeft(createdAtDate: string | Date | number | undefined): number {
  if (!createdAtDate) return 0;
  
  const created = typeof createdAtDate === 'string' || typeof createdAtDate === 'number'
    ? new Date(createdAtDate)
    : createdAtDate;

  if (isNaN(created.getTime())) return 0;

  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const remaining = TRIAL_DURATION_DAYS - diffDays;

  return remaining > 0 ? remaining : 0;
}

/**
 * Retorna se a igreja possui Acesso Vitalício por qualquer flag ou nome do plano.
 */
export function isVitalicioPlan(churchData: any): boolean {
  if (!churchData) return false;
  if (churchData.isLifetime === true || churchData.isVitalicio === true) return true;

  const rawPlanId = (churchData.planId || '').toLowerCase();
  if (rawPlanId === 'vitalicio' || rawPlanId === 'lifetime') return true;

  const rawPlanName = (churchData.planName || '').toLowerCase();
  if (
    rawPlanName.includes('vitalicio') ||
    rawPlanName.includes('vitalício') ||
    rawPlanName.includes('lifetime') ||
    rawPlanName.includes('acesso vitalício')
  ) {
    return true;
  }

  const planStatus = (churchData.planStatus || '').toLowerCase();
  if (planStatus === 'vitalicio' || planStatus === 'lifetime') return true;

  // Reconhecimento de Acesso Vitalício permanente para a igreja "Graça Soberana" e instâncias fundadoras
  const churchNameNormalized = (churchData.name || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (
    churchNameNormalized.includes('graca soberana') ||
    churchData.id === 'semente' ||
    churchData.id === 'graca-soberana' ||
    churchData.createdBy === 'mikmellorg@gmail.com' ||
    churchData.creatorEmail === 'mikmellorg@gmail.com' ||
    churchData.contactEmail === 'mikmellorg@gmail.com' ||
    churchData.ownerEmail === 'mikmellorg@gmail.com'
  ) {
    return true;
  }

  return false;
}

/**
 * Retorna se a igreja possui uma assinatura ativa (mensal/anual/vitalício).
 */
export function isPaidOrLifetimePlan(churchData: any): boolean {
  if (!churchData) return false;
  if (isVitalicioPlan(churchData)) return true;

  const planStatus = (churchData.planStatus || '').toLowerCase();
  const isPaidActive = planStatus === 'active' || planStatus === 'paid' || planStatus === 'pro';

  if (!isPaidActive) return false;

  // Se tem data de expiração, verificar se não expirou
  if (churchData.planExpiresAt) {
    const expDate = new Date(churchData.planExpiresAt);
    if (!isNaN(expDate.getTime()) && expDate < new Date()) {
      return false; // Assinatura expirada
    }
  }

  return true;
}

/**
 * Retorna o plano efetivo da igreja considerando se a assinatura paga está ativa,
 * se possui Acesso Vitalício, se está no período de avaliação gratuita de 30 dias,
 * ou se expirou para o Plano Semeadora.
 */
export function getChurchEffectivePlan(churchData: any): EffectivePlanResult {
  if (!churchData) {
    const plan = LILOU_PLANS['semeadora'];
    return {
      planId: 'semeadora',
      plan,
      isTrial: false,
      trialDaysLeft: 0,
      isExpiredTrial: true,
      statusLabel: 'Plano Semeadora (Gratuito)'
    };
  }

  const planStatus = (churchData.planStatus || '').toLowerCase();
  const rawPlanName = (churchData.planName || '').toLowerCase();
  const rawPlanId = (churchData.planId || '').toLowerCase();
  const createdAt = churchData.createdAt;

  // 1. Acesso Vitalício
  const isVitalicio = isVitalicioPlan(churchData);
  if (isVitalicio) {
    const plan = LILOU_PLANS['vitalicio'];
    return {
      planId: 'vitalicio',
      plan,
      isTrial: false,
      trialDaysLeft: 0,
      isExpiredTrial: false,
      statusLabel: 'Acesso Vitalício (Ativo)'
    };
  }

  // 2. Assinatura Paga Ativa (Mensal ou Anual)
  const isPaidActive = planStatus === 'active' || planStatus === 'paid' || planStatus === 'pro';

  if (isPaidActive) {
    // Verificar se a assinatura expirou
    if (churchData.planExpiresAt) {
      const expDate = new Date(churchData.planExpiresAt);
      if (!isNaN(expDate.getTime()) && expDate < new Date()) {
        const plan = LILOU_PLANS['semeadora'];
        return {
          planId: 'semeadora',
          plan,
          isTrial: false,
          trialDaysLeft: 0,
          isExpiredTrial: true,
          statusLabel: 'Assinatura Expirada (Plano Semeadora)'
        };
      }
    }

    let targetPlanId: 'completo' | 'premium' = 'completo';
    if (rawPlanName.includes('premium') || rawPlanName.includes('templo') || rawPlanName.includes('multi') || rawPlanId === 'premium') {
      targetPlanId = 'premium';
    }

    const plan = LILOU_PLANS[targetPlanId];
    return {
      planId: targetPlanId,
      plan,
      isTrial: false,
      trialDaysLeft: 0,
      isExpiredTrial: false,
      statusLabel: `Ativo (${plan.name})`
    };
  }

  // 3. Período de Avaliação Gratuita (30 dias do Plano Completo)
  const daysLeft = calculateTrialDaysLeft(createdAt);
  const isInTrial = daysLeft > 0 && planStatus !== 'suspended' && planStatus !== 'cancelled';

  if (isInTrial) {
    const plan = LILOU_PLANS['completo'];
    return {
      planId: 'completo',
      plan,
      isTrial: true,
      trialDaysLeft: daysLeft,
      isExpiredTrial: false,
      statusLabel: `Avaliação Gratuita (${daysLeft} dia${daysLeft > 1 ? 's' : ''} restante${daysLeft > 1 ? 's' : ''})`
    };
  }

  // 4. Avaliação Expirada -> Migração Automática para Plano Semeadora (Gratuito)
  const plan = LILOU_PLANS['semeadora'];
  return {
    planId: 'semeadora',
    plan,
    isTrial: false,
    trialDaysLeft: 0,
    isExpiredTrial: true,
    statusLabel: 'Plano Semeadora (Gratuito)'
  };
}

export type ResourceType = 'members' | 'songs' | 'scalesThisMonth' | 'liturgiesThisMonth' | 'aiUsesThisMonth' | 'multiCampus';

export interface ResourceCheckResult {
  allowed: boolean;
  limit: number;
  currentCount: number;
  resourceNameLabel: string;
  effectivePlan: EffectivePlanResult;
}

/**
 * Valida se a igreja pode criar ou usar um determinado recurso com base nos limites do plano.
 * NOTA CRÍTICA: Se exceder, NENHUM DADO É APAGADO! Apenas impede a criação de novos itens além do limite.
 */
export function checkResourceLimit(
  churchData: any,
  resource: ResourceType,
  currentCount: number
): ResourceCheckResult {
  const effectivePlan = getChurchEffectivePlan(churchData);
  const limits = effectivePlan.plan.limits;

  let limit = Infinity;
  let resourceNameLabel = '';

  switch (resource) {
    case 'members':
      limit = limits.maxActiveMembers;
      resourceNameLabel = 'membros ativos';
      break;
    case 'songs':
      limit = limits.maxSongs;
      resourceNameLabel = 'músicas/cifras';
      break;
    case 'scalesThisMonth':
      limit = limits.maxScalesPerMonth;
      resourceNameLabel = 'escalas neste mês';
      break;
    case 'liturgiesThisMonth':
      limit = limits.maxLiturgiesPerMonth;
      resourceNameLabel = 'liturgias neste mês';
      break;
    case 'aiUsesThisMonth':
      limit = limits.maxAiUsesPerMonth;
      resourceNameLabel = 'consultas de Inteligência Artificial';
      break;
    case 'multiCampus':
      limit = limits.hasMultiCampus ? Infinity : 1;
      resourceNameLabel = 'multi-campis';
      break;
  }

  const allowed = currentCount < limit;

  return {
    allowed,
    limit,
    currentCount,
    resourceNameLabel,
    effectivePlan
  };
}

/**
 * Métodos utilitários centralizados para verificação rápida de recursos na UI.
 */
export function canAddMember(churchData: any, currentMemberCount: number): ResourceCheckResult {
  return checkResourceLimit(churchData, 'members', currentMemberCount);
}

export function canAddSong(churchData: any, currentSongCount: number): ResourceCheckResult {
  return checkResourceLimit(churchData, 'songs', currentSongCount);
}

export function canCreateScale(churchData: any, currentScaleCountThisMonth: number): ResourceCheckResult {
  return checkResourceLimit(churchData, 'scalesThisMonth', currentScaleCountThisMonth);
}

export function canCreateLiturgy(churchData: any, currentLiturgyCountThisMonth: number): ResourceCheckResult {
  return checkResourceLimit(churchData, 'liturgiesThisMonth', currentLiturgyCountThisMonth);
}

export function canUseAI(churchData: any, currentAiUseCountThisMonth: number): ResourceCheckResult {
  return checkResourceLimit(churchData, 'aiUsesThisMonth', currentAiUseCountThisMonth);
}

export function canUseMultiCampus(churchData: any): ResourceCheckResult {
  return checkResourceLimit(churchData, 'multiCampus', 1);
}

export function canUseAutomations(churchData: any): boolean {
  return getChurchEffectivePlan(churchData).plan.limits.hasAutomations;
}

export function canUseAdvancedStats(churchData: any): boolean {
  return getChurchEffectivePlan(churchData).plan.limits.hasAdvancedStats;
}

export function canUsePremiumProjection(churchData: any): boolean {
  return getChurchEffectivePlan(churchData).plan.limits.hasPremiumProjection;
}

export interface PlanUsageOverview {
  effectivePlan: EffectivePlanResult;
  members: ResourceCheckResult;
  songs: ResourceCheckResult;
  scales: ResourceCheckResult;
  liturgies: ResourceCheckResult;
  aiUses: ResourceCheckResult;
}

/**
 * Retorna um panorama completo de uso dos recursos da igreja comparados aos limites do plano ativo.
 */
export function getPlanUsageOverview(
  churchData: any,
  counts: {
    membersCount: number;
    songsCount: number;
    scalesCountThisMonth: number;
    liturgiesCountThisMonth: number;
    aiUsesCountThisMonth: number;
  }
): PlanUsageOverview {
  const effectivePlan = getChurchEffectivePlan(churchData);
  return {
    effectivePlan,
    members: checkResourceLimit(churchData, 'members', counts.membersCount),
    songs: checkResourceLimit(churchData, 'songs', counts.songsCount),
    scales: checkResourceLimit(churchData, 'scalesThisMonth', counts.scalesCountThisMonth),
    liturgies: checkResourceLimit(churchData, 'liturgiesThisMonth', counts.liturgiesCountThisMonth),
    aiUses: checkResourceLimit(churchData, 'aiUsesThisMonth', counts.aiUsesCountThisMonth)
  };
}

