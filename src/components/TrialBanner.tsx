import React from 'react';
import { Sparkles, ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { EffectivePlanResult } from '../services/planService';

interface TrialBannerProps {
  effectivePlan: EffectivePlanResult;
  onOpenUpgradeModal: () => void;
  isAdmin?: boolean;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({
  effectivePlan,
  onOpenUpgradeModal,
  isAdmin = false
}) => {
  // Durante os 30 dias de teste ativo, membros normais NUNCA veem contagem de dias grátis
  if (!isAdmin && !effectivePlan.isExpiredTrial) {
    return null;
  }

  // Igrejas com Plano Vitalício (como a Graça Soberana de Rio Grande) têm acesso permanente e NUNCA exibem aviso de trial
  if (
    effectivePlan.planId === 'vitalicio' || 
    !effectivePlan.isTrial && !effectivePlan.isExpiredTrial
  ) {
    return null;
  }

  // Case 1: Trial Active (within 30 days) - Exibido apenas para Admin
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

  // Case 2A: Trial Expired - Visão do Membro Voluntário (Opção 1: Bíblia e Estudo liberados, Ministério pausado)
  if (!isAdmin) {
    return (
      <div className="bg-gradient-to-r from-amber-950/85 via-slate-900 to-amber-950/85 border-b border-amber-500/40 text-amber-100 py-2.5 px-4 text-xs font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
              <Clock size={14} />
            </span>
            <span>
              O período de avaliação da sua igreja encerrou. <strong className="text-white font-bold">Peça ao seu líder para reativar a escala completa e demais recursos da equipe!</strong>
              <span className="ml-1 text-emerald-300 text-[11px] font-bold">
                (Bíblia Sagrada e Academia de Teoria Musical continuam liberadas para você)
              </span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Case 2B: Trial Expired - Visão do Administrador (Migrated to Plano Semeadora - Gratuito)
  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/40 text-amber-100 py-2.5 px-4 text-xs font-medium">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
            <Clock size={14} />
          </span>
          <span>
            Seu período de avaliação gratuita foi concluído. Sua igreja está no <strong className="text-white font-bold">Plano Semeadora (Gratuito • Limite 5 Membros e 15 Músicas)</strong>.
            <span className="ml-1 text-amber-300 text-[11px] font-bold">
              (Nenhum dado foi apagado!)
            </span>
          </span>
        </div>

        <button
          onClick={onOpenUpgradeModal}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
        >
          Desbloquear Equipe & Recursos (R$ 49/mês)
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
