import React from 'react';

export function SetPasswordView({ token, onPasswordSetSuccess, onGoToLogin, onComplete }: any) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full text-center space-y-4">
        <h2 className="text-xl font-black text-text-main">Definir Senha de Acesso</h2>
        <p className="text-xs text-text-muted">Crie sua senha segura para continuar.</p>
        <button
          onClick={onPasswordSetSuccess || onComplete}
          className="w-full py-2.5 bg-brand text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}

export default SetPasswordView;
