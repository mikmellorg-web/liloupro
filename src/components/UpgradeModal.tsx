import React, { useState } from 'react';
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
  const [selectedPlan, setSelectedPlan] = useState<'completo' | 'vitalicio' | 'premium'>('completo');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  if (!isOpen) return null;

  const currentCheck = resourceCheck;
  const isSemeadoraLimit = currentCheck && !currentCheck.allowed;
  const isExpiredTrial = currentCheck?.effectivePlan?.isExpiredTrial;

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
        ? 'Assinar Premium Anual (R$ 950,40/ano)'
        : 'Assinar Plano Premium (R$ 99/mês)';
    }
    return billingCycle === 'annual'
      ? 'Assinar Completo Anual (R$ 470,40/ano)'
      : 'Assinar Plano Completo (R$ 49/mês)';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-slate-900 border-2 border-brand/50 text-white rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
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
              {isExpiredTrial ? '30 Dias de Teste Concluídos' : 'Upgrade do Ministério'}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 justify-center sm:justify-start">
              {isExpiredTrial ? 'Seu período de teste grátis foi concluído! 🎉' : 'Seu ministério está crescendo! 🚀'}
            </h2>

            {/* Notification explaining trial expiration or limit */}
            {isExpiredTrial ? (
              <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/40 p-4 rounded-2xl text-xs text-amber-200 text-left space-y-1.5">
                <div className="font-extrabold flex items-center gap-1.5 text-amber-300 text-sm">
                  <Crown size={16} className="text-amber-400" /> Os 30 dias de avaliação gratuita terminaram
                </div>
                <p className="text-xs leading-relaxed text-amber-100/95">
                  Esperamos que o LiLouPro tenha abençoado a rotina da sua equipe! Sua igreja foi migrada para o <strong>Plano Semeadora (Gratuito)</strong>.
                  <strong className="text-white font-bold ml-1">Nenhum dado foi perdido!</strong> Suas cifras, escalas e membros continuam protegidos na nuvem.
                  Para continuar utilizando sem limites, faça o upgrade abaixo:
                </p>
              </div>
            ) : isSemeadoraLimit ? (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl text-xs text-amber-200 text-left space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <Lock size={14} /> Limite do Plano Semeadora atingido
                </div>
                <p className="text-[11px] leading-relaxed text-amber-100/90">
                  Você já cadastrou {currentCheck.currentCount} {currentCheck.resourceNameLabel} (limite de {currentCheck.limit}).
                  <strong className="text-white font-bold ml-1">Seus dados continuam 100% salvos e protegidos!</strong>
                  Faça upgrade para continuar cadastrando sem barreiras.
                </p>
              </div>
            ) : customMessage ? (
              <p className="text-xs text-slate-300 leading-relaxed">{customMessage}</p>
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed">
                Você já experimentou todo o potencial do LiLouPro. Liberte todo o poder da sua equipe de louvor e culto!
              </p>
            )}
          </div>

          {/* Highlighted Benefits List */}
          <div className="bg-black/40 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
            <div className="font-bold uppercase tracking-wider text-[10px] text-brand">
              Com a assinatura do Plano Completo, você continua utilizando:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-200 pt-1">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-brand shrink-0" />
                <span>Membros <strong>Ilimitados</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-brand shrink-0" />
                <span>Repertório & Cifras <strong>Ilimitadas</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-brand shrink-0" />
                <span>Liturgias & Cultos <strong>Ilimitados</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-brand shrink-0" />
                <span>Escalas de Ministério <strong>Ilimitadas</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-brand shrink-0" />
                <span>Projeção Premium para Telão</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-brand shrink-0" />
                <span>Inteligência Artificial <strong>Ilimitada</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-brand shrink-0" />
                <span>Automações no WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-brand shrink-0" />
                <span>Backup Automático & Suporte VIP</span>
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
                  {billingCycle === 'annual' ? '20% OFF' : 'Mensal'}
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
                {billingCycle === 'annual' ? 'Equivale a apenas R$ 39,20/mês.' : 'Acesso ilimitado a todas as funções sem multas.'}
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
                <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase">⭐ Sem Mensalidade</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-amber-300">R$ 697,90</span>
                <span className="text-[10px] text-slate-400">único</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Condição especial de lançamento: pague uma vez e use para sempre.
              </p>
            </div>

            {/* Plano Premium */}
            <div
              onClick={() => setSelectedPlan('premium')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 relative ${
                selectedPlan === 'premium'
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-400">Premium</span>
                <span className="text-[9px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase">
                  {billingCycle === 'annual' ? 'Anual' : 'Redes / Multi'}
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
              <p className="text-[10px] text-slate-400">
                {billingCycle === 'annual' ? 'Equivale a R$ 79,20/mês. Gestão multi-campus.' : 'Gestão multi-campus, relatórios e suporte VIP.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => handleSubscribe(selectedPlan)}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-brand via-emerald-500 to-emerald-600 hover:brightness-110 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap size={18} fill="currentColor" />
              {getButtonLabel()}
              <ArrowRight size={18} />
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Pagamento 100% seguro via Kiwify • Ativação imediata no sistema</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
