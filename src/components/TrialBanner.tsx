import React from 'react';
import { Sparkles, ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { EffectivePlanResult } from '../services/planService';

interface TrialBannerProps {
  effectivePlan: EffectivePlanResult;
  onOpenUpgradeModal: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({
  effectivePlan,
  onOpenUpgradeModal
}) => {
  if (!effectivePlan.isTrial && !effectivePlan.isExpiredTrial) {
    return null;
  }

  // Case 1: Trial Active (within 30 days)
  if (effectivePlan.isTrial) {
    const days = effectivePlan.trialDaysLeft;
    return (
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-500/30 text-white py-2.5 px-4 text-xs font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-200">
            <span className="p-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shrink-0">
              <Sparkles size={14} className="text-amber-300 animate-pulse" />
            </span>
            <span>
              Você está utilizando gratuitamente todos os recursos do <strong className="text-white font-bold">Plano Completo</strong>.
              <span className="ml-1 text-indigo-300 font-bold bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30 font-mono">
                Restam {days} dia{days > 1 ? 's' : ''} de avaliação
              </span>
            </span>
          </div>

          <button
            onClick={onOpenUpgradeModal}
            className="px-3.5 py-1.5 rounded-xl bg-brand hover:brightness-110 text-slate-950 font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
          >
            Assinar Plano Completo (R$ 49/mês)
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    );
  }

  // Case 2: Trial Expired (Migrated to Plano Semeadora - Gratuito)
  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/40 text-amber-100 py-2.5 px-4 text-xs font-medium">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
            <Clock size={14} />
          </span>
          <span>
            Seu período de avaliação gratuita foi concluído. Sua igreja está no <strong className="text-white font-bold">Plano Semeadora (Gratuito)</strong>.
            <span className="ml-1 text-amber-300 text-[11px] font-bold">
              (Nenhum dado foi apagado!)
            </span>
          </span>
        </div>

        <button
          onClick={onOpenUpgradeModal}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
        >
          Desbloquear Recursos Ilimitados (R$ 49/mês)
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
