import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, CheckCircle2, ArrowRight, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, createUserWithEmailAndPassword, updateProfile } from '../lib/firebase';

interface SetPasswordViewProps {
  token: string;
  onPasswordSetSuccess: (email: string) => void;
  onGoToLogin: () => void;
}

export const SetPasswordView: React.FC<SetPasswordViewProps> = ({
  token,
  onPasswordSetSuccess,
  onGoToLogin
}) => {
  const [loadingToken, setLoadingToken] = useState(true);
  const [tokenData, setTokenData] = useState<any>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setTokenError('Link de definição de senha inválido ou ausente.');
        setLoadingToken(false);
        return;
      }

      try {
        if (!db) {
          throw new Error('Banco de dados indisponível.');
        }

        const tokenRef = doc(db, 'password_tokens', token);
        const snap = await getDoc(tokenRef);

        if (!snap.exists()) {
          setTokenError('Este link para definição de senha é inválido ou já foi utilizado.');
          setLoadingToken(false);
          return;
        }

        const data = snap.data();
        const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

        if (expiresAt && expiresAt < new Date()) {
          setTokenError('Este link expirou (válido por 24h). Por favor, solicite um novo link de redefinição de senha.');
          setLoadingToken(false);
          return;
        }

        setTokenData(data);
      } catch (err: any) {
        setTokenError(err?.message || 'Erro ao validar token de segurança.');
      } finally {
        setLoadingToken(false);
      }
    }

    verifyToken();
  }, [token]);

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (newPassword.length < 6) {
      setFormError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('As senhas digitadas não coincidem.');
      return;
    }

    setSubmitting(true);

    try {
      const email = tokenData.email;
      const userName = tokenData.userName || tokenData.churchName || 'Líder de Louvor';

      // 1. Criar usuário no Firebase Auth com a senha escolhida
      try {
        const userCred = await createUserWithEmailAndPassword(auth, email, newPassword);
        if (userCred.user) {
          await updateProfile(userCred.user, { displayName: userName });
        }
      } catch (authErr: any) {
        // Se o usuário já existia no Auth (ex: cadastro prévio)
        if (authErr?.code === 'auth/email-already-in-use') {
          console.warn('Usuário já existe no Auth. Registrando atualização.');
        } else {
          throw authErr;
        }
      }

      // 2. Apagar o token de uso único por segurança
      if (db) {
        try {
          await deleteDoc(doc(db, 'password_tokens', token));
        } catch (delErr) {
          console.error('Erro ao deletar token consumido:', delErr);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onPasswordSetSuccess(email);
      }, 1500);

    } catch (err: any) {
      setFormError(err?.message || 'Erro ao salvar a nova senha. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/20 text-brand text-[10px] font-black uppercase tracking-wider border border-brand/30">
            <Sparkles size={14} className="text-emerald-400" />
            Configuração Inicial de Segurança
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight">
            Criar Minha Senha
          </h1>
          <p className="text-xs text-slate-400">
            Defina sua senha de acesso ao LiLouPro para a sua igreja.
          </p>
        </div>

        {loadingToken ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Validando token seguro de acesso...</p>
          </div>
        ) : tokenError ? (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl space-y-3 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-xs text-red-200">{tokenError}</p>
            <button
              onClick={onGoToLogin}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Ir para Tela de Login
            </button>
          </div>
        ) : success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-emerald-300">Senha Criada com Sucesso!</h3>
            <p className="text-xs text-emerald-100/90">
              Sua conta está ativada e pronta. Redirecionando para o sistema...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitPassword} className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Conta de E-mail</span>
              <span className="text-xs font-mono font-bold text-brand">{tokenData?.email}</span>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-xs text-red-300">
                {formError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">
                Nova Senha (mínimo 6 caracteres)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none focus:border-brand"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none focus:border-brand"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-brand hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando Senha...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Salvar Senha e Acessar LiLouPro
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
