import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { confirmPasswordReset } from 'firebase/auth';

interface SetPasswordViewProps {
  token: string;
  onPasswordSetSuccess: () => void;
  onGoToLogin: () => void;
}

export const SetPasswordView: React.FC<SetPasswordViewProps> = ({
  token,
  onPasswordSetSuccess,
  onGoToLogin
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (auth && token) {
        await confirmPasswordReset(auth, token, password);
      }
      setSuccess(true);
      setTimeout(() => {
        onPasswordSetSuccess();
      }, 1500);
    } catch (err: any) {
      console.error('[SetPasswordView] Erro ao redefinir senha:', err);
      // Fornecer mensagem clara em português
      if (err.code === 'auth/invalid-action-code') {
        setError('O link de recuperação expirou ou já foi utilizado. Solicite um novo link.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha informada é muito fraca. Escolha uma senha mais segura.');
      } else {
        setError(err.message || 'Não foi possível definir a nova senha.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lock size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Definir Nova Senha</h1>
            <p className="text-xs text-slate-400">LiLouPro - Gestão de Louvor & Culto</p>
          </div>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 size={48} className="text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-semibold text-white">Senha alterada com sucesso!</h3>
            <p className="text-xs text-slate-300">Redirecionando você para a tela de login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nova Senha (mínimo 6 caracteres)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Confirmar Nova Senha
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Salvando nova senha...</span>
              ) : (
                <>
                  <span>Salvar e Acessar Conta</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onGoToLogin}
              className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Voltar para o Login
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default SetPasswordView;
