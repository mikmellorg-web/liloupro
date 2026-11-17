import React, { useState, useEffect } from 'react';
import {
  Clapperboard,
  RotateCcw,
  Sparkles,
  Users,
  UserPlus,
  EyeOff,
  ArrowLeft,
  X,
  Check,
  Building2,
  Upload,
  Trash2,
  Calendar,
  Music,
  BookOpen,
  Home,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Copy,
  CheckCircle2
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  deleteField,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

const MASTER_DEVELOPER_EMAIL = 'mikmellorg@gmail.com';
const SANDBOX_CHURCH_ID = 'demo_sandbox';

const DEFAULT_ROLES = [
  'Vocal Principal',
  'Backing Vocal',
  'Violão',
  'Guitarra',
  'Baixo',
  'Bateria',
  'Teclado',
  'Percussão',
  'Operador de áudio',
  'Mídia',
  'Projeção',
  'Professor Kids',
  'Professor Babies'
];

const FAKE_TEAM_PRESETS = [
  { name: 'Lucas Silva', roles: ['Violão', 'Backing Vocal'], email: 'lucas.demo@liloupro.demo' },
  { name: 'Ana Costa', roles: ['Vocal Principal', 'Backing Vocal'], email: 'ana.demo@liloupro.demo' },
  { name: 'Pedro Santos', roles: ['Teclado'], email: 'pedro.demo@liloupro.demo' },
  { name: 'Marcos Oliveira', roles: ['Bateria'], email: 'marcos.demo@liloupro.demo' },
  { name: 'Julia Souza', roles: ['Baixo'], email: 'julia.demo@liloupro.demo' }
];

function getLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getNext31Days(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < 31; i++) {
    const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    dates.push(getLocalDateStr(dt));
  }
  return dates;
}

interface SandboxRecordingControlsProps {
  onNavigateTab: (tab: any) => void;
  isCleanRecordingMode?: boolean;
  onToggleCleanRecordingMode?: (hidden: boolean) => void;
}

export const SandboxRecordingControls: React.FC<SandboxRecordingControlsProps> = ({
  onNavigateTab,
  isCleanRecordingMode,
  onToggleCleanRecordingMode
}) => {
  const { user, churchData, isSandboxMode, switchChurchContext } = useAuth();
  const isMasterDeveloper = Boolean(user && (user.email || '').toLowerCase().trim() === MASTER_DEVELOPER_EMAIL);

  const [internalBarHidden, setInternalBarHidden] = useState(false);
  const isBarHidden = typeof isCleanRecordingMode === 'boolean' ? isCleanRecordingMode : internalBarHidden;
  const setIsBarHidden = (next: boolean) => {
    setInternalBarHidden(next);
    if (onToggleCleanRecordingMode) {
      onToggleCleanRecordingMode(next);
    }
  };
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Onboarding / Welcome Modal state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardChurchName, setWizardChurchName] = useState('');
  const [wizardLogoUrl, setWizardLogoUrl] = useState<string | null>(null);
  const [wizardRoles, setWizardRoles] = useState<string[]>([
    'Vocal Principal',
    'Backing Vocal',
    'Violão',
    'Guitarra',
    'Baixo',
    'Bateria',
    'Teclado'
  ]);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Add 1 Fake Member Modal state
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [singleMemberName, setSingleMemberName] = useState('');
  const [singleMemberRoles, setSingleMemberRoles] = useState<string[]>(['Vocal Principal']);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!isMasterDeveloper || !isSandboxMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setIsBarHidden(!isBarHidden);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMasterDeveloper, isSandboxMode, isBarHidden]);

  if (!isMasterDeveloper || !isSandboxMode) {
    return null;
  }

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
  };

  const commitBatchedWrites = async (
    operations: Array<{ type: 'set' | 'delete'; ref: any; data?: any }>
  ) => {
    const CHUNK_SIZE = 380;
    for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
      const chunk = operations.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const op of chunk) {
        if (op.type === 'delete') {
          batch.delete(op.ref);
        } else {
          batch.set(op.ref, op.data);
        }
      }
      await batch.commit();
    }
  };

  const collectSandboxServiceDates = async (): Promise<string[]> => {
    const baseDates = new Set<string>(getNext31Days());
    try {
      const servicesSnap = await getDocs(
        query(collection(db, 'services'), where('churchId', '==', SANDBOX_CHURCH_ID))
      );
      servicesSnap.docs.forEach((d) => {
        const dt = d.data()?.date;
        if (typeof dt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dt)) {
          baseDates.add(dt);
        }
      });
    } catch {
      // Ignore optional service date enrichment failure
    }
    return Array.from(baseDates);
  };

  // Action A: Reset Sandbox Church completely & open Leader Onboarding
  const handleResetSandbox = async () => {
    if (busyAction || !user) return;
    setBusyAction('reset');
    try {
      const tenantCollections = [
        'songs',
        'services',
        'members',
        'availability',
        'availability_locks',
        'announcements',
        'mural',
        'chat',
        'notifications',
        'projection_presets'
      ];

      const deleteOps: Array<{ type: 'delete'; ref: any }> = [];

      for (const colName of tenantCollections) {
        try {
          const snap = await getDocs(
            query(collection(db, colName), where('churchId', '==', SANDBOX_CHURCH_ID))
          );
          snap.docs.forEach((d) => {
            if (colName === 'members' && d.id === user.uid) return;
            deleteOps.push({ type: 'delete', ref: d.ref });
          });
        } catch (err) {
          console.warn(`Aviso ao limpar coleção ${colName}:`, err);
        }
      }

      if (deleteOps.length > 0) {
        await commitBatchedWrites(deleteOps);
      }

      // Clean singleton docs scoped to demo_sandbox
      await Promise.all([
        deleteDoc(doc(db, 'projection_sessions', SANDBOX_CHURCH_ID)).catch(() => {}),
        deleteDoc(doc(db, 'settings', `notifications_${SANDBOX_CHURCH_ID}`)).catch(() => {})
      ]);

      // Reset sandbox church document to clean blank-slate
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const nextYearIso = nextYear.toISOString();

      await setDoc(
        doc(db, 'churches', SANDBOX_CHURCH_ID),
        {
          name: 'Nova Igreja (Demo)',
          inviteCode: 'DEMO123',
          createdAt: new Date().toISOString(),
          createdBy: user.uid,
          updatedAt: new Date().toISOString(),
          isSandbox: true,
          isSeedChurch: false,
          isVitalicio: false,
          planStatus: 'active',
          planName: 'Plano Premium',
          planId: 'premium',
          planExpiresAt: nextYearIso,
          expiresAt: nextYearIso,
          maxMembers: 9999,
          maxSongs: 9999,
          onboardingDismissed: false,
          onboardingCompleted: false,
          roles: ['Vocal Principal', 'Backing Vocal', 'Violão', 'Guitarra', 'Baixo', 'Bateria', 'Teclado'],
          logoUrl: deleteField(),
          logoFit: deleteField(),
          logoPadding: deleteField(),
          logoBg: deleteField(),
          logoBgCustomColor: deleteField(),
          logoRadius: deleteField(),
          themeColor: deleteField(),
          customBrandColor: deleteField()
        },
        { merge: true }
      );

      // Clear onboarding & demo local caches
      try {
        localStorage.removeItem('dismissed_leader_onboarding');
        localStorage.removeItem('liloupro_sandbox_onboarding_done');
        localStorage.removeItem('lilo-projection-state');
        const keysToClear: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.includes(SANDBOX_CHURCH_ID)) {
            keysToClear.push(k);
          }
        }
        keysToClear.forEach((k) => localStorage.removeItem(k));
      } catch {
        // Ignore storage errors
      }

      // Open onboarding modal cleanly
      setWizardChurchName('');
      setWizardLogoUrl(null);
      setWizardRoles(['Vocal Principal', 'Backing Vocal', 'Violão', 'Guitarra', 'Baixo', 'Bateria', 'Teclado']);
      setWizardStep(1);
      setIsOnboardingOpen(true);
      onNavigateTab('home');
      showToast('success', 'Igreja Demo zerada! Tela de boas-vindas iniciada.');
    } catch (err) {
      console.error('Erro ao zerar Igreja Demo:', err);
      showToast('error', 'Não foi possível zerar a Igreja Demo.');
    } finally {
      setBusyAction(null);
    }
  };

  // Action B: Reopen Welcome / Onboarding without deleting data
  const handleReopenWelcome = () => {
    const existingName = churchData?.name && churchData.name !== 'Nova Igreja (Demo)'
      ? churchData.name
      : '';
    setWizardChurchName(existingName);
    setWizardLogoUrl(churchData?.logoUrl || null);
    setWizardRoles(
      Array.isArray(churchData?.roles) && churchData.roles.length > 0
        ? churchData.roles
        : ['Vocal Principal', 'Backing Vocal', 'Violão', 'Guitarra', 'Baixo', 'Bateria', 'Teclado']
    );
    setWizardStep(1);
    setIsOnboardingOpen(true);
  };

  // Action C: Generate 5 Fake Musicians with confirmed availability
  const handleGenerateFakeTeam = async () => {
    if (busyAction) return;
    setBusyAction('team');
    try {
      const availableDates = await collectSandboxServiceDates();
      const availabilityMap: Record<string, string> = {};
      availableDates.forEach((d) => {
        availabilityMap[d] = 'available';
      });

      const ts = Date.now();
      const writeOps: Array<{ type: 'set'; ref: any; data: any }> = [];

      FAKE_TEAM_PRESETS.forEach((preset, idx) => {
        const fakeId = `sandbox_fake_${ts}_${idx}`;
        writeOps.push({
          type: 'set',
          ref: doc(db, 'members', fakeId),
          data: {
            uid: fakeId,
            name: preset.name,
            email: preset.email,
            photoUrl: '',
            roles: preset.roles,
            isAdmin: false,
            isSandboxFake: true,
            churchId: SANDBOX_CHURCH_ID,
            availability: availabilityMap,
            createdAt: new Date().toISOString()
          }
        });

        availableDates.forEach((dateStr) => {
          writeOps.push({
            type: 'set',
            ref: doc(db, 'availability', `${fakeId}_${dateStr}`),
            data: {
              churchId: SANDBOX_CHURCH_ID,
              userId: fakeId,
              date: dateStr,
              status: 'available',
              updatedAt: serverTimestamp()
            }
          });
        });
      });

      await commitBatchedWrites(writeOps);
      showToast('success', 'Equipe fake (+5 músicos disponíveis) criada na Igreja Demo!');
    } catch (err) {
      console.error('Erro ao gerar equipe fake:', err);
      showToast('error', 'Erro ao gerar equipe fake.');
    } finally {
      setBusyAction(null);
    }
  };

  // Action D: Add 1 Manual Fake Member
  const handleCreateSingleFakeMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = singleMemberName.trim();
    if (!trimmedName || busyAction) return;

    setBusyAction('single');
    try {
      const availableDates = await collectSandboxServiceDates();
      const availabilityMap: Record<string, string> = {};
      availableDates.forEach((d) => {
        availabilityMap[d] = 'available';
      });

      const fakeId = `sandbox_fake_${Date.now()}_single`;
      const rolesToSave = singleMemberRoles.length > 0 ? singleMemberRoles : ['Vocal Principal'];
      const writeOps: Array<{ type: 'set'; ref: any; data: any }> = [
        {
          type: 'set',
          ref: doc(db, 'members', fakeId),
          data: {
            uid: fakeId,
            name: trimmedName,
            email: `${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'musico'}@liloupro.demo`,
            photoUrl: '',
            roles: rolesToSave,
            isAdmin: false,
            isSandboxFake: true,
            churchId: SANDBOX_CHURCH_ID,
            availability: availabilityMap,
            createdAt: new Date().toISOString()
          }
        }
      ];

      availableDates.forEach((dateStr) => {
        writeOps.push({
          type: 'set',
          ref: doc(db, 'availability', `${fakeId}_${dateStr}`),
          data: {
            churchId: SANDBOX_CHURCH_ID,
            userId: fakeId,
            date: dateStr,
            status: 'available',
            updatedAt: serverTimestamp()
          }
        });
      });

      await commitBatchedWrites(writeOps);
      setSingleMemberName('');
      setSingleMemberRoles(['Vocal Principal']);
      setIsAddMemberModalOpen(false);
      showToast('success', `${trimmedName} adicionado(a) à equipe Demo!`);
    } catch (err) {
      console.error('Erro ao adicionar membro fake:', err);
      showToast('error', 'Erro ao adicionar membro fake.');
    } finally {
      setBusyAction(null);
    }
  };

  // Logo compression helper (400x400, matching SettingsView)
  const handleWizardLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'Selecione uma imagem de até 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          setWizardLogoUrl(canvas.toDataURL(mimeType, 0.85));
        } else {
          setWizardLogoUrl(base64);
        }
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveOnboardingSetup = async () => {
    setIsSavingOnboarding(true);
    try {
      const cleanName = wizardChurchName.trim() || 'Ministério Demonstração';
      const payload: Record<string, any> = {
        name: cleanName,
        roles: wizardRoles.length > 0 ? wizardRoles : ['Vocal Principal', 'Violão', 'Teclado'],
        onboardingCompleted: true,
        onboardingDismissed: true,
        updatedAt: new Date().toISOString()
      };
      if (wizardLogoUrl) {
        payload.logoUrl = wizardLogoUrl;
      } else {
        payload.logoUrl = deleteField();
      }
      await updateDoc(doc(db, 'churches', SANDBOX_CHURCH_ID), payload);
      try {
        localStorage.setItem('liloupro_sandbox_onboarding_done', 'true');
      } catch {}
      setWizardStep(3);
    } catch (err) {
      console.error('Erro ao salvar onboarding sandbox:', err);
      showToast('error', 'Erro ao salvar configuração inicial.');
    } finally {
      setIsSavingOnboarding(false);
    }
  };

  const handleToggleWizardRole = (role: string) => {
    setWizardRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleAddCustomRole = () => {
    const trimmed = customRoleInput.trim();
    if (!trimmed) return;
    if (!wizardRoles.includes(trimmed)) {
      setWizardRoles((prev) => [...prev, trimmed]);
    }
    setCustomRoleInput('');
  };

  const handleToggleSingleRole = (role: string) => {
    setSingleMemberRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleCopyInviteCode = () => {
    const code = churchData?.inviteCode || 'DEMO123';
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const availableRoleOptions = Array.from(new Set([...DEFAULT_ROLES, ...wizardRoles]));

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[120] px-4 py-3 rounded-2xl border shadow-2xl flex items-center gap-2.5 text-xs font-bold backdrop-blur-md transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/90 border-red-500/40 text-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          ) : (
            <X size={16} className="text-red-400 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Floating Collapsible Recording Control Bar */}
      {isBarHidden ? (
        <button
          type="button"
          onClick={() => setIsBarHidden(false)}
          title="Reexibir Barra de Gravação e Controles Master (Alt + G)"
          className="fixed bottom-4 right-4 z-[95] w-9 h-9 rounded-full bg-zinc-900/75 border border-amber-500/35 text-amber-300 shadow-lg backdrop-blur-md flex items-center justify-center opacity-20 hover:opacity-100 transition-all cursor-pointer"
        >
          <Clapperboard size={15} />
        </button>
      ) : (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[95] w-[calc(100vw-1.5rem)] max-w-4xl bg-zinc-950/95 border border-amber-500/35 rounded-2xl shadow-2xl backdrop-blur-xl px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider shrink-0">
                <Clapperboard size={12} /> Modo Gravação
              </span>
              <span className="text-[11px] font-bold text-zinc-300 truncate max-w-[160px] sm:max-w-[200px]">
                {churchData?.name || 'Igreja Demo'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                disabled={!!busyAction}
                onClick={handleResetSandbox}
                className="px-2.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {busyAction === 'reset' ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                Zerar Igreja
              </button>

              <button
                type="button"
                disabled={!!busyAction}
                onClick={handleReopenWelcome}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles size={12} />
                Reabrir Boas-Vindas
              </button>

              <button
                type="button"
                disabled={!!busyAction}
                onClick={handleGenerateFakeTeam}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {busyAction === 'team' ? <Loader2 size={12} className="animate-spin" /> : <Users size={12} />}
                Gerar Equipe Fake (+5)
              </button>

              <button
                type="button"
                disabled={!!busyAction}
                onClick={() => setIsAddMemberModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                <UserPlus size={12} />
                +1 Membro Fake
              </button>

              <button
                type="button"
                onClick={async () => {
                  await switchChurchContext('semente');
                  onNavigateTab('home');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                title="Voltar para Graça Soberana (Semente)"
              >
                <ArrowLeft size={12} />
                Graça Soberana
              </button>

              <button
                type="button"
                onClick={() => setIsBarHidden(true)}
                className="px-2 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Ocultar barra e botões Master para gravar a tela limpa (Alt + G)"
              >
                <EyeOff size={12} />
                <span className="hidden sm:inline">Ocultar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add 1 Fake Member */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-sky-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Adicionar 1 Membro Fake (Demo)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMemberModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSingleFakeMember} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Nome do Músico / Ministro
                </label>
                <input
                  type="text"
                  required
                  value={singleMemberName}
                  onChange={(e) => setSingleMemberName(e.target.value)}
                  placeholder="Ex: Gabriel Mendes"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Funções / Instrumentos (Disponível para Auto-Escala)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
                  {DEFAULT_ROLES.map((role) => {
                    const selected = singleMemberRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleToggleSingleRole(role)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                          selected
                            ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {selected && <Check size={11} />}
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!singleMemberName.trim() || busyAction === 'single'}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {busyAction === 'single' ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  Adicionar na Equipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sandbox Leader Onboarding / Welcome Wizard */}
      {isOnboardingOpen && (
        <div className="fixed inset-0 z-[115] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-auto">
            {/* Wizard Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-950 via-zinc-900 to-zinc-950 border-b border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-wider">
                  <Sparkles size={11} /> Boas-Vindas ao Líder • Passo {wizardStep} de 3
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {wizardStep === 1 && 'Configure a Identidade da sua Igreja'}
                  {wizardStep === 2 && 'Defina as Funções do Ministério'}
                  {wizardStep === 3 && 'Tudo Pronto! Comece sua Primeira Escala'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                title="Fechar assistente"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step 1: Church Name & Logo */}
            {wizardStep === 1 && (
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                    <Building2 size={13} className="text-indigo-400" /> Nome da Igreja / Ministério
                  </label>
                  <input
                    type="text"
                    value={wizardChurchName}
                    onChange={(e) => setWizardChurchName(e.target.value)}
                    placeholder="Ex: Igreja Batista Vida Nova"
                    className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 text-base font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                    Logotipo da Igreja (Opcional)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-white/15 flex items-center justify-center overflow-hidden shrink-0">
                      {wizardLogoUrl ? (
                        <img src={wizardLogoUrl} alt="Logo Igreja" className="w-full h-full object-contain p-1" />
                      ) : (
                        <Building2 size={28} className="text-zinc-600" />
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <p className="text-xs text-zinc-300">
                        Envie o logotipo do seu ministério para personalizar o cabeçalho, projeção e escalas.
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <label className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer">
                          <Upload size={13} /> Enviar Logo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleWizardLogoSelect}
                          />
                        </label>
                        {wizardLogoUrl && (
                          <button
                            type="button"
                            onClick={() => setWizardLogoUrl(null)}
                            className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={12} /> Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOnboardingOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                  >
                    Avançar para Funções <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Ministries / Roles */}
            {wizardStep === 2 && (
              <div className="p-6 space-y-5">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Selecione os instrumentos e áreas que atuam nos cultos da sua igreja:
                </p>

                <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">
                  {availableRoleOptions.map((role) => {
                    const selected = wizardRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleToggleWizardRole(role)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                          selected
                            ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {selected && <Check size={13} />}
                        {role}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customRoleInput}
                    onChange={(e) => setCustomRoleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomRole();
                      }
                    }}
                    placeholder="Adicionar outra função (ex: Violino, Dança)"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomRole}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold cursor-pointer"
                  >
                    + Incluir
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft size={14} /> Voltar
                  </button>
                  <button
                    type="button"
                    disabled={isSavingOnboarding}
                    onClick={handleSaveOnboardingSetup}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingOnboarding ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />}
                    Salvar e Concluir
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Ready + Invite Code + Quick Launch Buttons */}
            {wizardStep === 3 && (
              <div className="p-6 space-y-6">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-emerald-300">
                      Código de Convite da Equipe
                    </p>
                    <p className="text-[11px] text-zinc-300 mt-0.5">
                      Compartilhe com seus músicos para entrarem no ministério:
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyInviteCode}
                    className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-emerald-500/40 text-emerald-300 font-mono text-sm font-black flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {churchData?.inviteCode || 'DEMO123'}
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                    Por onde deseja começar agora?
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOnboardingOpen(false);
                        onNavigateTab('calendar');
                      }}
                      className="p-4 rounded-2xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-left space-y-1 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-indigo-300 text-xs font-black uppercase">
                        <Calendar size={15} /> Agendar 1º Culto e Escala
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Crie o culto e escale os músicos da equipe.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOnboardingOpen(false);
                        onNavigateTab('songs');
                      }}
                      className="p-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-left space-y-1 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-emerald-300 text-xs font-black uppercase">
                        <Music size={15} /> Cadastrar Músicas
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Adicione cifras, tons e repertório do ministério.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOnboardingOpen(false);
                        onNavigateTab('liturgy');
                      }}
                      className="p-4 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-left space-y-1 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-amber-300 text-xs font-black uppercase">
                        <BookOpen size={15} /> Montar 1ª Liturgia
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Organize a ordem do culto, leituras e momentos.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOnboardingOpen(false);
                        onNavigateTab('home');
                      }}
                      className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-left space-y-1 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-white text-xs font-black uppercase">
                        <Home size={15} /> Ir para o Início
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Explorar o painel completo do portal de louvor.
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
