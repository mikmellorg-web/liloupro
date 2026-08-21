import React from 'react';

export function LeaderOnboardingWizard(props: any) {
  if (props.isOpen === false) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
        <h2 className="text-xl font-black text-text-main">Bem-vindo ao LiLouPro</h2>
        <p className="text-xs text-text-muted">Configure sua igreja e equipe de louvor facilmente.</p>
        <button
          onClick={props.onComplete || props.onFinish || props.onClose}
          className="w-full py-2.5 bg-brand text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow cursor-pointer"
        >
          Começar
        </button>
      </div>
    </div>
  );
}

export default LeaderOnboardingWizard;
