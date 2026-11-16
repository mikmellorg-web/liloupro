import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, Crown, X, ArrowRight, ShieldCheck, Zap, Lock, Building2 } from 'lucide-react';
import { LILOU_PLANS, ResourceCheckResult } from '../services/planService';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceCheck?: ResourceCheckResult | null;
  customMessage?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  resourceCheck,
  customMessage
}) => {
  const isExpiredTrial = Boolean(resourceCheck?.effectivePlan?.isExpiredTrial);
  const isMemberLimitReached = Boolean(
    resourceCheck &&
    !resourceCheck.allowed &&
    !isExpiredTrial &&
    resourceCheck.resourceType === 'members' &&
    (resourceCheck.limit === 50 || resourceCheck.maxAllowed === 50)
  );

  const [selectedPlan, setSelectedPlan] = useState<'completo' | 'vitalicio' | 'premium'>(
    isMemberLimitReached ? 'premium' : 'completo'
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  useEffect(() => {
    if (isOpen) {
      setSelectedPlan(isMemberLimitReached ? 'premium' : 'completo');
    }
  }, [isOpen, isMemberLimitReached]);

  if (!isOpen) return null;

  const currentCheck = resourceCheck;
  const isGenericBlocked = Boolean(currentCheck && !currentCheck.allowed && !isExpiredTrial && !isMemberLimitReached);

  const handleSubscribe = (planKey: 'completo' | 'vitalicio' | 'premium') => {
    const plan = LILOU_PLANS[planKey];
    if (planKey === 'vitalicio') {
      window.open(plan?.kiwifyCheckoutUrl || 'https://pay.kiwify.com.br/hzdGE1G', '_blank');
      return;
    }
    const checkoutUrl = billingCycle === 'annual'
      ? (plan?.kiwifyAnnualCheckoutUrl || plan?.kiwifyCheckoutUrl)
      : plan?.kiwifyCheckoutUrl;
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    } else {
      window.open('https://kiwify.app', '_blank');
    }
  };

  const getButtonLabel = () => {
    if (selectedPlan === 'vitalicio') return 'Garantir Acesso Vitalício (R$ 697,90)';
    if (selectedPlan === 'premium') {
      return billingCycle === 'annual'
        ? 'Fazer Upgrade para o Plano Premium (R$ 950,40/ano)'
        : 'Fazer Upgrade para o Plano Premium (R$ 99/mês)';
    }
    return billingCycle === 'annual'
      ? 'Assinar Plano Completo Anual (R$ 470,40/ano)'
      : 'Assinar Plano Completo (R$ 49/mês)';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-slate-900 border-2 border-brand/50 text-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Subtle Ambient Light Effect */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-all cursor-pointer z-10"
          >
            <X size={18} />
          </button>

          {/* Header Badge & Title */}
          <div className="space-y-3 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/20 text-brand text-[10px] font-black uppercase tracking-wider border border-brand/30">
              <Sparkles size={14} className="text-amber-300 animate-pulse" />
              {isExpiredTrial
                ? '30 Dias de Teste Concluídos'
                : isMemberLimitReached
                  ? 'Limite de 50 Membros Atingido'
                  : 'Planos & Upgrade do Ministério'}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 justify-center sm:justify-start">
              {isExpiredTrial
                ? 'Seu período de teste grátis foi concluído! 🎉'
                : isMemberLimitReached
                  ? 'Sua equipe cresceu além de 50 membros! 🚀'
                  : 'Escolha o plano ideal para sua igreja 🚀'}
            </h2>

            {/* Notification explaining trial expiration or 50-member cap */}
            {isExpiredTrial ? (
              <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/40 p-4 rounded-2xl text-xs text-amber-200 text-left space-y-1.5">
                <div className="font-extrabold flex items-center gap-1.5 text-amber-300 text-sm">
                  <Crown size={16} className="text-amber-400" /> Os 30 dias de avaliação gratuita terminaram
                </div>
                <p className="text-xs leading-relaxed text-amber-100/95">
                  O acesso de teste ao Plano Completo foi encerrado e o cadastro de novos membros, cultos e recursos completos foi pausado.
                  <strong className="text-white font-bold ml-1">Nenhum dado foi perdido!</strong> Todas as suas músicas, cifras, escalas e membros seguem salvos na nuvem.
                  Para reativar sua igreja, assine o <strong>Plano Completo</strong> (até 50 membros) ou faça upgrade para o <strong>Plano Premium</strong> (membros ilimitados + multi-campus):
                </p>
              </div>
            ) : isMemberLimitReached ? (
              <div className="bg-gradient-to-r from-indigo-500/20 via-brand/10 to-transparent border border-indigo-400/40 p-4 rounded-2xl text-xs text-indigo-100 text-left space-y-1.5">
                <div className="font-extrabold flex items-center gap-1.5 text-indigo-300 text-sm">
                  <Building2 size={16} className="text-brand" /> Limite de 50 membros ativos do Plano Completo atingido
                </div>
                <p className="text-xs leading-relaxed text-slate-200">
                  Você já cadastrou <strong>{currentCheck?.currentCount ?? 50}</strong> de <strong>50 membros ativos</strong> permitidos no {currentCheck?.effectivePlan?.plan?.name || 'Plano Completo'}.
                  <strong className="text-white font-bold ml-1">Seus dados estão 100% salvos!</strong> Faça upgrade para o <strong>Plano Premium</strong> para liberar <strong>membros ILIMITADOS</strong>, gestão multi-campus e relatórios consolidados.
                </p>
              </div>
            ) : isGenericBlocked ? (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl text-xs text-amber-200 text-left space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <Lock size={14} /> Limite do plano atingido
                </div>
                <p className="text-[11px] leading-relaxed text-amber-100/90">
                  {currentCheck?.message || 'Faça a assinatura do Plano Completo ou upgrade para o Plano Premium para continuar sem barreiras.'}
                </p>
              </div>
            ) : customMessage ? (
              <p className="text-xs text-slate-300 leading-relaxed">{customMessage}</p>
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed">
                Comece grátis por 30 dias com acesso ao Plano Completo. Após o período de testes, escolha assinar o Plano Completo ou fazer upgrade para o Plano Premium.
              </p>
            )}
          </div>

          {/* Accurate Comparison: Plano Completo vs Plano Premium */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-black/40 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="font-black uppercase tracking-wider text-[10px] text-brand">
                Plano Completo • Igrejas Locais
              </div>
              <div className="space-y-1.5 text-slate-200 pt-1">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-brand shrink-0" />
                  <span><strong>Até 50 membros</strong> ativos na equipe</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-brand shrink-0" />
                  <span>Repertório, cifras e liturgias ilimitadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-brand shrink-0" />
                  <span>Escalas e confirmação via WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-brand shrink-0" />
                  <span>Projeção LiLouPro + integração com OBS &amp; Holyrics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-brand shrink-0" />
                  <span>Assistente IA e exportação Google Docs</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-950/30 border border-indigo-500/35 rounded-2xl p-4 space-y-2">
              <div className="font-black uppercase tracking-wider text-[10px] text-indigo-300">
                Plano Premium • Redes &amp; Multi-campus
              </div>
              <div className="space-y-1.5 text-slate-200 pt-1">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" />
                  <span><strong>Membros ILIMITADOS</strong> na equipe</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" />
                  <span>Gestão <strong>Multi-Campus</strong> / Congregações</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" />
                  <span>Relatórios gerenciais consolidados</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" />
                  <span>Suporte prioritário via WhatsApp / VIP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" />
                  <span>Tudo do Plano Completo sem restrições</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seletor de Ciclo de Faturamento (Mensal vs Anual 20% OFF) */}
          <div className="flex items-center justify-center gap-2 py-1">
            <div className="bg-slate-950/80 p-1 rounded-xl border border-white/10 inline-flex items-center">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white/10 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pagamento Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  billingCycle === 'annual'
                    ? 'bg-brand text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Pagamento Anual</span>
                <span className="text-[10px] bg-slate-950 text-brand px-1.5 py-0.5 rounded font-black uppercase">20% OFF</span>
              </button>
            </div>
          </div>

          {/* Pricing Option Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Plano Completo */}
            <div
              onClick={() => setSelectedPlan('completo')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 relative ${
                selectedPlan === 'completo'
                  ? 'border-brand bg-brand/10 shadow-lg shadow-brand/10'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-brand">Completo</span>
                <span className="text-[9px] font-black bg-brand text-slate-950 px-2 py-0.5 rounded-full uppercase">
                  {billingCycle === 'annual' ? '20% OFF' : 'Até 50'}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white">
                  {billingCycle === 'annual' ? 'R$ 470,40' : 'R$ 49,00'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {billingCycle === 'annual' ? '/ano' : '/mês'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {billingCycle === 'annual'
                  ? 'R$ 39,20/mês • Até 50 membros, OBS/Holyrics, IA e Docs.'
                  : 'Até 50 membros ativos, projeção OBS/Holyrics, IA e Docs.'}
              </p>
            </div>

            {/* Acesso Vitalício */}
            <div
              onClick={() => setSelectedPlan('vitalicio')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 relative ${
                selectedPlan === 'vitalicio'
                  ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/15'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">Vitalício</span>
                <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase">⭐ Único</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-amber-300">R$ 697,90</span>
                <span className="text-[10px] text-slate-400">único</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Pague uma única vez e tenha acesso permanente sem mensalidades.
              </p>
            </div>

            {/* Plano Premium */}
            <div
              onClick={() => setSelectedPlan('premium')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 relative ${
                selectedPlan === 'premium'
                  ? 'border-indigo-400 bg-indigo-500/15 shadow-lg shadow-indigo-500/15'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-300">Premium</span>
                <span className="text-[9px] font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 px-2 py-0.5 rounded-full uppercase">
                  {isMemberLimitReached ? 'Recomendado' : 'Multi-campus'}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white">
                  {billingCycle === 'annual' ? 'R$ 950,40' : 'R$ 99,00'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {billingCycle === 'annual' ? '/ano' : '/mês'}
                </span>
              </div>
              <p className="text-[10px] text-slate-300">
                {billingCycle === 'annual'
                  ? 'R$ 79,20/mês • Membros ilimitados, Multi-campus e VIP.'
                  : 'Membros ilimitados, Multi-campus, relatórios e suporte VIP.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={() => handleSubscribe(selectedPlan)}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-brand via-emerald-500 to-emerald-600 hover:brightness-110 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-brand/20 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap size={18} fill="currentColor" />
              {getButtonLabel()}
              <ArrowRight size={18} />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSubscribe('completo')}
                className="py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer"
              >
                Assinar Plano Completo ({billingCycle === 'annual' ? 'R$ 470,40/ano' : 'R$ 49/mês'})
              </button>
              <button
                type="button"
                onClick={() => handleSubscribe('premium')}
                className="py-2.5 px-4 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/35 border border-indigo-400/40 text-xs font-bold text-indigo-200 transition-all cursor-pointer"
              >
                Fazer Upgrade para Premium ({billingCycle === 'annual' ? 'R$ 950,40/ano' : 'R$ 99/mês'})
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium pt-1">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Pagamento 100% seguro via Kiwify • Ativação imediata no sistema</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
