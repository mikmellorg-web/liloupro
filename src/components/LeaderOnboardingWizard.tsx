import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Music, Share2, Clipboard, Copy, 
  ChevronRight, ArrowLeft, Check, Plus, X, Phone
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface LeaderOnboardingWizardProps {
  user: any;
  memberData: any;
  onComplete: () => void;
  onDismiss: () => void;
}

const DEFAULT_ROLES = [
  { id: 'Teclado', label: '🎹 Teclado' },
  { id: 'Violão', label: '🎸 Violão' },
  { id: 'Voz', label: '🎤 Voz/Cantor' },
  { id: 'Guitarra', label: '🎸 Guitarra' },
  { id: 'Baixo', label: '🎸 Baixo' },
  { id: 'Bateria', label: '🥁 Bateria' },
  { id: 'Mesa de Som', label: '🎛️ Mesa de Som' },
  { id: 'Percussão', label: '🥁 Percussão' }
];

export const LeaderOnboardingWizard: React.FC<LeaderOnboardingWizardProps> = ({ 
  user, 
  memberData, 
  onComplete, 
  onDismiss 
}) => {
  const [step, setStep] = useState(1);
  const [churchName, setChurchName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Teclado', 'Violão', 'Voz']);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  const [generatedInviteCode, setGeneratedInviteCode] = useState('');
  const [generatedChurchId, setGeneratedChurchId] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleRole = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(prev => prev.filter(r => r !== roleId));
    } else {
      setSelectedRoles(prev => [...prev, roleId]);
    }
  };

  const handleAddCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRole = customRoleInput.trim();
    if (cleanRole && !selectedRoles.includes(cleanRole) && !customRoles.includes(cleanRole)) {
      setCustomRoles(prev => [...prev, cleanRole]);
      setSelectedRoles(prev => [...prev, cleanRole]);
      setCustomRoleInput('');
    }
  };

  const handleRemoveCustomRole = (roleId: string) => {
    setCustomRoles(prev => prev.filter(r => r !== roleId));
    setSelectedRoles(prev => prev.filter(r => r !== roleId));
  };

  const handleCreateChurch = async () => {
    if (!churchName.trim() || !user) return;
    setIsSubmitting(true);
    try {
      // Create random uppercase invite code
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const inviteCode = `IGREJA-${randomSuffix}`;
      const churchId = `igreja_${Date.now()}`;
      
      const churchRef = doc(db, 'churches', churchId);
      
      // Save church config with selected template roles/instruments
      await setDoc(churchRef, {
        name: churchName.trim(),
        inviteCode,
        roles: selectedRoles, // custom list of instruments
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      
      // Update leader member profile with churchId and status as isAdmin
      const memberRef = doc(db, 'members', user.uid);
      await updateDoc(memberRef, {
        churchId,
        isAdmin: true,
        roles: ['Coordenador/Líder'] // assign leader role initial
      });
      
      setGeneratedInviteCode(inviteCode);
      setGeneratedChurchId(churchId);
      setStep(3);
    } catch (err) {
      console.error('Erro ao registrar congregação no onboarding:', err);
      alert('Houve um erro técnico ao criar sua congregação. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/?invite=${generatedInviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const inviteLink = `${window.location.origin}/?invite=${generatedInviteCode}`;
    const text = `Olá, pessoal! Estou usando o LiLouPro para gerenciar e organizar as nossas escalas do ministério de louvor da *${churchName}* e gostaria de convidar todos vocês para se cadastrarem!\n\nSeja voluntário na escala tocando ou cantando. É bem rápido!\n\n👇 Cadastre-se clicando neste link direto:\n🔗 ${inviteLink}\n\nOu use nosso código de acesso manual no app: *${generatedInviteCode}*`;
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div id="leader_onboarding_wizard_card" className="bg-slate-900 border-2 border-brand/35 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl transition-all">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand/10 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20"></div>

      {/* Header section with step badges */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand/20 text-brand rounded-xl border border-brand/35">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider text-white">Configuração do Líder</h2>
            <p className="text-xs text-text-muted">Configure o LiLouPro para sua igreja em 3 passos simples</p>
          </div>
        </div>
        
        {/* Progress indicators */}
        <div className="flex gap-1.5 items-center bg-slate-950/40 p-1.5 rounded-full border border-white/5">
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                s === step 
                  ? 'bg-brand text-white shadow-md scale-110' 
                  : s < step 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-white/5 text-white/50'
              }`}
            >
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 relative z-10"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-bold flex items-center gap-2">
                1. Qual o nome da sua igreja?
              </h3>
              <p className="text-sm text-white/75 leading-relaxed">
                Este nome será exibido para todos os músicos e voluntários ao abrirem o aplicativo. Você pode usar o padrão do seu bairro.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand block">Nome da Igreja / Congregação</label>
              <input 
                id="church_name_input"
                type="text"
                placeholder="Ex: Igreja Presbiteriana do Bairro, Comunidade Reencontro, etc."
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-brand/50 focus:border-brand text-sm outline-none transition-all placeholder:text-white/30 text-white font-medium"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-white/5">
              <button 
                onClick={onDismiss}
                className="text-xs uppercase tracking-widest font-bold text-white/60 hover:text-white transition-colors cursor-pointer py-2 px-1"
              >
                Continuar na versão teste
              </button>
              <button
                disabled={!churchName.trim() || churchName.trim().length < 3}
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-6 py-3.5 bg-brand text-white disabled:opacity-40 disabled:pointer-events-none rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-brand/20 cursor-pointer"
              >
                Definir Ministérios <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 relative z-10"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-bold">2. Quais instrumentos ou ministérios vocês usam?</h3>
              <p className="text-sm text-white/75 leading-relaxed">
                Selecione os instrumentos padrões abaixo que serão escalados nos cultos. Seus músicos poderão escolher essas funções ao se cadastrarem.
              </p>
            </div>

            {/* Quick selectors chips */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand block">Ministérios padrões</span>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_ROLES.map((role) => {
                  const isSelected = selectedRoles.includes(role.id);
                  return (
                    <button
                      key={role.id}
                      onClick={() => handleToggleRole(role.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-1.5 ${
                        isSelected 
                          ? 'bg-brand/20 text-brand border-brand/50 shadow-md' 
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {role.label}
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom role builder */}
            <form onSubmit={handleAddCustomRole} className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand block">Outros Instrumentos / Ministérios</span>
              <div className="flex gap-2">
                <input 
                  id="custom_role_input"
                  type="text"
                  placeholder="Ex: Guitarra Solo, Violoncelo, Projeção"
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-brand hover:border-white/25 transition-all text-white placeholder:text-white/30"
                />
                <button
                  type="submit"
                  disabled={!customRoleInput.trim()}
                  className="px-4 bg-white/15 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer border border-white/10"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Custom roles collection display */}
              {customRoles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {customRoles.map(role => (
                    <span key={role} className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 text-white pl-2.5 pr-1.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {role}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveCustomRole(role)}
                        className="p-0.5 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </form>

            <div className="flex justify-between items-center gap-4 pt-4 border-t border-white/5">
              <button 
                onClick={() => setStep(1)}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/15 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Nome
              </button>
              <button
                disabled={selectedRoles.length === 0 || isSubmitting}
                onClick={handleCreateChurch}
                className="px-6 py-3.5 bg-gradient-to-r from-teal-500 to-brand text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-xl transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                {isSubmitting ? 'Configurando...' : 'Concluir Congregação 🚀'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 relative z-10 text-center py-4"
          >
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 mb-2">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white">{churchName} criada com sucesso!</h3>
              <p className="text-sm text-text-muted">Seu espaço está configurado e pronto para uso.</p>
            </div>

            {/* Invite Action Panel */}
            <div className="bg-slate-950/60 rounded-2xl p-5 border border-white/5 text-left max-w-lg mx-auto space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-brand tracking-widest block">Código de Ingresso da Igreja</span>
                <div className="flex items-center justify-between gap-4 bg-slate-900 border border-white/10 rounded-xl p-3.5">
                  <span className="font-mono text-base font-black tracking-wider text-white">{generatedInviteCode}</span>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 bg-brand/10 hover:bg-brand/20 text-brand rounded-lg transition-all active:scale-90 border border-brand/20 flex items-center gap-1.5 text-xs font-bold leading-none cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copiar Link
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-white/80 leading-relaxed font-semibold">
                  WhatsApp Rápido: Seus músicos podem clicar diretamente no link para entrar na sua igreja logo após o cadastro de forma 100% automatizada!
                </p>
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full py-4.5 bg-[#25D366] hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-lg shadow-[#25D366]/20 cursor-pointer"
                >
                  <Phone className="w-4 h-4 fill-slate-950 stroke-none" /> Chamar Músicos via WhatsApp
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 max-w-lg mx-auto">
              <button
                onClick={onComplete}
                className="w-full py-4 bg-brand text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all hover:brightness-110 active:scale-95 shadow-xl shadow-brand/10 cursor-pointer"
              >
                Concluir Onboarding ✨
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
