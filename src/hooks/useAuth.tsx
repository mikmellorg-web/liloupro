import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getChurchEffectivePlan, isVitalicioPlan, EffectivePlanResult } from '../services/planService';
import { requestFcmToken, setupForegroundMessageListener } from '../services/fcmService';
import { notifyChurchLeadersOfNewMember } from '../services/memberJoinNotificationService';

export type ChurchAccessBlockReason = 'missing' | 'deleted' | 'suspended' | 'cancelled' | null;
export type ChurchResolutionState = 'idle' | 'loading' | 'valid' | 'missing' | 'blocked';
export type RemoteSupportPolicy = 'all' | 'premium_only';

export interface RemoteSupportSession {
  churchId: string;
  churchName: string;
  grantedByName: string;
  expiresAtMs: number;
  startedAtIso: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  memberData: any | null;
  isAdmin: boolean;
  churchData: any | null;
  churchResolutionState: ChurchResolutionState;
  churchAccessBlockReason: ChurchAccessBlockReason;
  effectivePlan: EffectivePlanResult | null;
  isVitalicio: boolean;
  isPaidActive: boolean;
  isSandboxMode: boolean;
  switchChurchContext: (targetChurchId: 'semente' | 'demo_sandbox') => Promise<void>;
  isRemoteSupportMode: boolean;
  remoteSupportSession: RemoteSupportSession | null;
  remoteSupportPolicy: RemoteSupportPolicy;
  startRemoteSupportSession: (churchId: string, pin: string) => Promise<{ ok: boolean; error?: string }>;
  endRemoteSupportSession: (reason?: 'master' | 'revoked' | 'expired') => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  memberData: null,
  isAdmin: false,
  churchData: null,
  churchResolutionState: 'idle',
  churchAccessBlockReason: null,
  effectivePlan: null,
  isVitalicio: false,
  isPaidActive: false,
  isSandboxMode: false,
  switchChurchContext: async () => {},
  isRemoteSupportMode: false,
  remoteSupportSession: null,
  remoteSupportPolicy: 'all',
  startRemoteSupportSession: async () => ({ ok: false, error: 'Não inicializado.' }),
  endRemoteSupportSession: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [rawMemberData, setRawMemberData] = useState<any | null>(null);
  const [rawIsAdmin, setRawIsAdmin] = useState(false);
  const [churchData, setChurchData] = useState<any | null>(null);
  const [churchResolutionState, setChurchResolutionState] = useState<ChurchResolutionState>('idle');
  const [churchAccessBlockReason, setChurchAccessBlockReason] = useState<ChurchAccessBlockReason>(null);
  const [loading, setLoading] = useState(true);
  const [masterChurchOverride, setMasterChurchOverride] = useState<'semente' | 'demo_sandbox' | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('liloupro_master_sandbox_active') === 'true' ? 'demo_sandbox' : null;
    } catch {
      return null;
    }
  });

  const [remoteSupportSession, setRemoteSupportSession] = useState<RemoteSupportSession | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('liloupro_remote_support_session');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as RemoteSupportSession;
      if (parsed?.churchId && parsed?.expiresAtMs && parsed.expiresAtMs > Date.now()) {
        return parsed;
      }
      sessionStorage.removeItem('liloupro_remote_support_session');
    } catch {}
    return null;
  });
  const [remoteSupportPolicy, setRemoteSupportPolicy] = useState<RemoteSupportPolicy>('all');

  const isMasterUser = Boolean(user && (user.email || '').toLowerCase().trim() === 'mikmellorg@gmail.com');
  const isRemoteSupportMode = Boolean(isMasterUser && remoteSupportSession?.churchId);
  const isSandboxMode = Boolean(isMasterUser && !isRemoteSupportMode && masterChurchOverride === 'demo_sandbox');
  const effectiveChurchId = isRemoteSupportMode
    ? remoteSupportSession!.churchId
    : isSandboxMode
      ? 'demo_sandbox'
      : (rawMemberData?.churchId || (isMasterUser ? 'semente' : ''));

  const memberData = rawMemberData
    ? (isRemoteSupportMode
        ? {
            ...rawMemberData,
            churchId: remoteSupportSession!.churchId,
            isAdmin: true,
            dismissedOnboarding: true
          }
        : isSandboxMode
          ? {
              ...rawMemberData,
              churchId: 'demo_sandbox',
              isAdmin: true,
              dismissedOnboarding: Boolean(churchData?.onboardingDismissed)
            }
          : rawMemberData)
    : null;

  // HARD GUARD: Non-master users NEVER receive isAdmin ("MODO ADM") unless their church exists and is active/valid
  const hasValidChurchAccess = Boolean(
    churchData &&
    churchResolutionState === 'valid' &&
    !churchAccessBlockReason
  );
  const isAdmin = isMasterUser
    ? (isSandboxMode || isRemoteSupportMode ? true : rawIsAdmin)
    : (hasValidChurchAccess ? rawIsAdmin : false);

  const effectivePlan = hasValidChurchAccess && churchData ? getChurchEffectivePlan(churchData) : null;
  const isVitalicio = hasValidChurchAccess && churchData ? isVitalicioPlan(churchData) : false;
  const isPaidActive = effectivePlan
    ? (!effectivePlan.isTrial && !effectivePlan.isExpiredTrial && effectivePlan.planId !== 'semeadora' && effectivePlan.planId !== 'none' && effectivePlan.planId !== 'suspended')
    : false;

  const purgeCrossTenantLocalCaches = (allowedChurchId?: string) => {
    if (typeof window === 'undefined') return;
    try {
      const normalizedAllowed = (allowedChurchId || '').trim();
      const prevChurchId = localStorage.getItem('lilo_active_church_id');

      if (!normalizedAllowed) {
        localStorage.removeItem('lilo_active_church_id');
        localStorage.removeItem('lilo-projection-state');
        localStorage.removeItem('liloupro_offline_sync_time');
        localStorage.removeItem('liloupro_favorite_songs');
      } else {
        if (prevChurchId && prevChurchId !== normalizedAllowed) {
          localStorage.removeItem('lilo-projection-state');
        }
        localStorage.setItem('lilo_active_church_id', normalizedAllowed);
        localStorage.removeItem('liloupro_offline_sync_time');
        localStorage.removeItem('liloupro_favorite_songs');
      }

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        const isTenantScopedKey =
          k.startsWith('liloupro_offline_') ||
          k.startsWith('liloupro_favorite_songs_') ||
          k.startsWith('liloupro_mural_cleanup_date');
        if (!isTenantScopedKey) continue;

        if (!normalizedAllowed) {
          keysToRemove.push(k);
        } else {
          const belongsToAllowed =
            k.endsWith(`_${normalizedAllowed}`) ||
            k.startsWith(`liloupro_favorite_songs_${normalizedAllowed}_`);
          if (!belongsToAllowed) {
            keysToRemove.push(k);
          }
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      if (!normalizedAllowed) {
        try {
          sessionStorage.removeItem('liloupro_pending_join_welcome');
        } catch {}
      }
    } catch (e) {
      // Ignore storage access errors in restricted contexts
    }
  };

  const ensureDemoSandboxChurch = async (creatorUid?: string) => {
    const sandboxRef = doc(db, 'churches', 'demo_sandbox');
    const snap = await getDoc(sandboxRef);
    if (!snap.exists()) {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const nextYearIso = nextYear.toISOString();
      const defaultSandbox = {
        name: 'Igreja Demonstração (Sandbox)',
        inviteCode: 'DEMO123',
        createdAt: new Date().toISOString(),
        createdBy: creatorUid || user?.uid || 'master',
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
        masterNotes: 'Ambiente isolado de demonstração, gravação de tutoriais e onboarding.'
      };
      await setDoc(sandboxRef, defaultSandbox);
      return { id: 'demo_sandbox', ...defaultSandbox };
    }
    return { id: snap.id, ...snap.data() };
  };

  const extractSupportExpiresMs = (remoteSupport: any): number => {
    if (!remoteSupport) return 0;
    const rawExp = remoteSupport.expiresAt;
    if (rawExp && typeof rawExp.toMillis === 'function') return rawExp.toMillis();
    if (rawExp && typeof rawExp.seconds === 'number') return rawExp.seconds * 1000;
    if (typeof remoteSupport.expiresAtIso === 'string') {
      const parsed = Date.parse(remoteSupport.expiresAtIso);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    if (typeof rawExp === 'string') {
      const parsed = Date.parse(rawExp);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const endRemoteSupportSession = async (reason: 'master' | 'revoked' | 'expired' = 'master') => {
    const activeSession = remoteSupportSession;
    try {
      sessionStorage.removeItem('liloupro_remote_support_session');
    } catch {}
    setRemoteSupportSession(null);
    purgeCrossTenantLocalCaches('semente');

    if (activeSession?.churchId && isMasterUser && (reason === 'master' || reason === 'expired')) {
      try {
        const churchRef = doc(db, 'churches', activeSession.churchId);
        const snap = await getDoc(churchRef);
        if (snap.exists()) {
          const prevSupport = snap.data()?.remoteSupport || {};
          const endedAtIso = new Date().toISOString();
          const endedByLabel = reason === 'expired' ? 'Expiração automática (2h)' : 'Master (Suporte)';
          await updateDoc(churchRef, {
            remoteSupport: {
              ...prevSupport,
              active: false,
              pin: null,
              sessionEndedAt: endedAtIso,
              sessionEndedBy: endedByLabel,
              lastSession: {
                grantedByName: prevSupport.grantedByName || activeSession.grantedByName || 'Líder',
                grantedByUid: prevSupport.grantedByUid || null,
                startedAt: prevSupport.sessionStartedAt || activeSession.startedAtIso || prevSupport.grantedAt || endedAtIso,
                endedAt: endedAtIso,
                endedBy: endedByLabel
              }
            }
          });
        }
      } catch (err) {
        console.warn('[RemoteSupport] Falha ao registrar encerramento da sessão:', err);
      }
    }
  };

  const startRemoteSupportSession = async (churchId: string, pin: string): Promise<{ ok: boolean; error?: string }> => {
    if (!isMasterUser || !user) {
      return { ok: false, error: 'Apenas o Master Admin pode iniciar sessões de suporte remoto.' };
    }
    if (!churchId || churchId === 'semente' || churchId === 'demo_sandbox') {
      return { ok: false, error: 'Igreja alvo inválida para suporte remoto.' };
    }
    const cleanPin = pin.replace(/\D/g, '').trim();
    if (cleanPin.length !== 6) {
      return { ok: false, error: 'Informe o PIN temporário de 6 dígitos gerado pelo líder.' };
    }

    try {
      const churchRef = doc(db, 'churches', churchId);
      const snap = await getDoc(churchRef);
      if (!snap.exists()) {
        return { ok: false, error: 'Igreja não encontrada.' };
      }
      const data = snap.data() as any;
      const rs = data?.remoteSupport;
      const expiresAtMs = extractSupportExpiresMs(rs);

      if (!rs || rs.active !== true || !expiresAtMs || expiresAtMs <= Date.now()) {
        return { ok: false, error: 'Autorização de suporte inativa ou expirada. Peça ao líder para gerar um novo PIN.' };
      }
      if (String(rs.pin || '').trim() !== cleanPin) {
        return { ok: false, error: 'PIN incorreto. Confira os 6 dígitos com o líder da igreja.' };
      }

      const startedAtIso = new Date().toISOString();
      const grantedByName = rs.grantedByName || 'Líder da Igreja';

      await updateDoc(churchRef, {
        remoteSupport: {
          ...rs,
          sessionStartedAt: startedAtIso,
          sessionStartedByEmail: user.email || 'mikmellorg@gmail.com',
          sessionEndedAt: null,
          sessionEndedBy: null,
          lastSession: {
            grantedByName,
            grantedByUid: rs.grantedByUid || null,
            startedAt: startedAtIso,
            endedAt: null,
            endedBy: null
          }
        }
      });

      try {
        localStorage.removeItem('liloupro_master_sandbox_active');
      } catch {}
      setMasterChurchOverride(null);
      purgeCrossTenantLocalCaches(churchId);

      const nextSession: RemoteSupportSession = {
        churchId,
        churchName: data.name || 'Igreja Cliente',
        grantedByName,
        expiresAtMs,
        startedAtIso
      };
      try {
        sessionStorage.setItem('liloupro_remote_support_session', JSON.stringify(nextSession));
      } catch {}
      setRemoteSupportSession(nextSession);

      return { ok: true };
    } catch (err: any) {
      console.error('[RemoteSupport] Erro ao iniciar suporte remoto:', err);
      return { ok: false, error: err?.message || 'Não foi possível iniciar o suporte remoto.' };
    }
  };

  const switchChurchContext = async (targetChurchId: 'semente' | 'demo_sandbox') => {
    if (!isMasterUser || !user) return;
    try {
      if (remoteSupportSession) {
        try { sessionStorage.removeItem('liloupro_remote_support_session'); } catch {}
        setRemoteSupportSession(null);
      }
      if (targetChurchId === 'demo_sandbox') {
        await ensureDemoSandboxChurch(user.uid);
        try {
          localStorage.setItem('liloupro_master_sandbox_active', 'true');
        } catch {}
        purgeCrossTenantLocalCaches('demo_sandbox');
        setMasterChurchOverride('demo_sandbox');
      } else {
        try {
          localStorage.removeItem('liloupro_master_sandbox_active');
        } catch {}
        purgeCrossTenantLocalCaches('semente');
        setMasterChurchOverride('semente');
      }
    } catch (err) {
      console.error('Erro ao alternar contexto de igreja master:', err);
    }
  };

  useEffect(() => {
    let unsubscribeMember: (() => void) | null = null;
    let previousUid: string | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Guard: tentativa de login via Google na tela "Área do Membro" sem cadastro prévio no Firestore
      if (currentUser && typeof window !== 'undefined') {
        let isGoogleLoginOnlyCheck = false;
        try {
          isGoogleLoginOnlyCheck = sessionStorage.getItem('liloupro_google_login_only_check') === 'true';
        } catch {}

        if (isGoogleLoginOnlyCheck) {
          const userEmailLower = (currentUser.email || '').toLowerCase().trim();
          const isMaster = userEmailLower === 'mikmellorg@gmail.com';
          if (isMaster) {
            try { sessionStorage.removeItem('liloupro_google_login_only_check'); } catch {}
          } else {
            try {
              const memberSnap = await getDoc(doc(db, 'members', currentUser.uid));
              const memberChurchId = memberSnap.exists() ? String(memberSnap.data()?.churchId || '').trim() : '';
              const isRegisteredWithChurch = memberSnap.exists() && memberChurchId.length > 0;
              try { sessionStorage.removeItem('liloupro_google_login_only_check'); } catch {}

              if (!isRegisteredWithChurch) {
                const payload = { email: currentUser.email || '' };
                try {
                  sessionStorage.setItem('liloupro_google_unregistered_alert', JSON.stringify(payload));
                } catch {}
                window.dispatchEvent(new CustomEvent('liloupro:google-unregistered', { detail: payload }));
                try {
                  await auth.signOut();
                } catch (signOutErr) {
                  console.warn('[Auth] Falha ao encerrar sessão de conta Google sem cadastro:', signOutErr);
                }
                previousUid = null;
                setUser(null);
                setRawMemberData(null);
                setRawIsAdmin(false);
                setChurchData(null);
                setChurchResolutionState('idle');
                setChurchAccessBlockReason(null);
                setLoading(false);
                return;
              }
            } catch (checkErr) {
              try { sessionStorage.removeItem('liloupro_google_login_only_check'); } catch {}
              console.warn('[Auth] Erro ao verificar cadastro da conta Google:', checkErr);
              window.dispatchEvent(new CustomEvent('liloupro:google-check-error'));
              try {
                await auth.signOut();
              } catch {}
              previousUid = null;
              setUser(null);
              setLoading(false);
              return;
            }
          }
        }

        // Guard: tentativa de cadastro via Google quando a conta já possui igreja vinculada no Firestore
        let isGoogleSignupCheck = false;
        try {
          isGoogleSignupCheck = sessionStorage.getItem('liloupro_google_signup_check') === 'true';
        } catch {}

        if (isGoogleSignupCheck) {
          try { sessionStorage.removeItem('liloupro_google_signup_check'); } catch {}
          try {
            const memberSnap = await getDoc(doc(db, 'members', currentUser.uid));
            const memberChurchId = memberSnap.exists() ? String(memberSnap.data()?.churchId || '').trim() : '';
            if (memberSnap.exists() && memberChurchId.length > 0) {
              const payload = { email: currentUser.email || '' };
              try {
                sessionStorage.setItem('liloupro_google_already_registered_alert', JSON.stringify(payload));
              } catch {}
              window.dispatchEvent(new CustomEvent('liloupro:google-already-registered', { detail: payload }));
              try {
                await auth.signOut();
              } catch (signOutErr) {
                console.warn('[Auth] Falha ao encerrar sessão de conta Google já cadastrada:', signOutErr);
              }
              previousUid = null;
              setUser(null);
              setRawMemberData(null);
              setRawIsAdmin(false);
              setChurchData(null);
              setChurchResolutionState('idle');
              setChurchAccessBlockReason(null);
              setLoading(false);
              return;
            }
          } catch (signupCheckErr) {
            console.warn('[Auth] Erro ao verificar conta Google existente no cadastro:', signupCheckErr);
          }
        }
      }

      const nextUid = currentUser?.uid || null;
      if (previousUid !== nextUid) {
        previousUid = nextUid;
        setRawMemberData(null);
        setRawIsAdmin(false);
        setChurchData(null);
        setChurchResolutionState('idle');
        setChurchAccessBlockReason(null);
        if (nextUid) {
          setLoading(true);
        } else {
          setMasterChurchOverride(null);
          setRemoteSupportSession(null);
          try {
            localStorage.removeItem('liloupro_master_sandbox_active');
            sessionStorage.removeItem('liloupro_remote_support_session');
          } catch {}
          purgeCrossTenantLocalCaches();
        }
      }

      setUser(currentUser);

      // Clean up previous member listener
      if (unsubscribeMember) {
        unsubscribeMember();
        unsubscribeMember = null;
      }

      if (currentUser) {
        const memberRef = doc(db, 'members', currentUser.uid);

        // Listen to member changes dynamically
        unsubscribeMember = onSnapshot(memberRef, async (memberSnap) => {
          const userEmailLower = (currentUser.email || '').toLowerCase().trim();
          const isMaster = userEmailLower === 'mikmellorg@gmail.com';
          let currentMember: any = null;

          if (!memberSnap.exists()) {
            if (isMaster) {
              currentMember = {
                uid: currentUser.uid,
                name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Master Admin',
                email: currentUser.email || '',
                photoUrl: currentUser.photoURL || '',
                roles: ['Coordenador/Líder'],
                isAdmin: true,
                availability: {},
                churchId: 'semente', // Graça Soberana (Seed Church)
                defaultBibleVersion: 'BLIVRE'
              };
              try {
                await setDoc(memberRef, currentMember);
              } catch (err) {
                console.error("Erro ao criar perfil master:", err);
              }
            } else {
              // For any new non-master user: check if there's an invite code, otherwise require code linking
              const pendingInvite = typeof window !== 'undefined' ? localStorage.getItem('pending_invite_code') : null;
              let targetChurchId = '';
              let resolvedChurchDocData: Record<string, any> | null = null;
              let isUserAdmin = false;
              let initialRoles: string[] = [];

              if (pendingInvite) {
                try {
                  const { collection: col, query: qQuery, where: wWhere, getDocs: gDocs } = await import('firebase/firestore');
                  const snap = await gDocs(qQuery(col(db, 'churches'), wWhere('inviteCode', '==', pendingInvite.trim().toUpperCase())));
                  if (!snap.empty) {
                    const candidateData = snap.docs[0].data() as any;
                    const candidateStatus = String(candidateData?.planStatus || '').toLowerCase().trim();
                    const isCandidateBlocked =
                      candidateData?.deleted === true ||
                      candidateStatus === 'deleted' ||
                      candidateStatus === 'suspended' ||
                      candidateStatus === 'cancelled';
                    if (!isCandidateBlocked) {
                      targetChurchId = snap.docs[0].id;
                      resolvedChurchDocData = { id: snap.docs[0].id, ...candidateData };
                      isUserAdmin = false;
                      initialRoles = [];
                    }
                    localStorage.removeItem('pending_invite_code');
                  }
                } catch (inviteErr) {
                  console.warn("Erro ao buscar convite pendente:", inviteErr);
                }
              }

              if (typeof window !== 'undefined') {
                localStorage.removeItem('pending_church_name_for_signup');
              }

              currentMember = {
                uid: currentUser.uid,
                name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Membro',
                email: currentUser.email || '',
                photoUrl: currentUser.photoURL || '',
                roles: initialRoles,
                isAdmin: isUserAdmin,
                availability: {},
                churchId: targetChurchId,
                defaultBibleVersion: 'BLIVRE',
                dismissedOnboarding: true,
                createdAt: new Date().toISOString()
              };

              try {
                await setDoc(memberRef, currentMember);
                if (targetChurchId) {
                  notifyChurchLeadersOfNewMember({
                    memberUid: currentUser.uid,
                    memberName: currentMember.name,
                    memberEmail: currentMember.email,
                    churchId: targetChurchId,
                    churchData: resolvedChurchDocData
                  }).catch(() => {});
                }
              } catch (err) {
                console.error("Erro ao criar perfil de membro inicial:", err);
              }
            }
          } else {
            currentMember = { id: memberSnap.id, ...memberSnap.data() };

            // Auto-sync master admin flag if logging in with master email
            if (isMaster && !currentMember.isAdmin) {
              currentMember.isAdmin = true;
              try {
                await setDoc(memberRef, { isAdmin: true }, { merge: true });
              } catch (err) {
                console.error("Erro ao sincronizar status master admin no membro:", err);
              }
            }

            // Auto-sync profile photo from Google Auth if they don't have one in Firestore
            if (!currentMember.photoUrl && currentUser.photoURL) {
              currentMember.photoUrl = currentUser.photoURL;
              try {
                await setDoc(memberRef, { photoUrl: currentUser.photoURL }, { merge: true });
              } catch (err) {
                console.error("Erro ao sincronizar foto de perfil do Google:", err);
              }
            }

            // Auto-assign default Bible version if they don't have one or migrate legacy NAA to BLIVRE
            if (!currentMember.defaultBibleVersion || currentMember.defaultBibleVersion === 'NAA') {
              currentMember.defaultBibleVersion = 'BLIVRE';
              try {
                await setDoc(memberRef, { defaultBibleVersion: 'BLIVRE' }, { merge: true });
              } catch (err) {
                console.error("Erro ao definir tradução padrão da bíblia:", err);
              }
            }

            // Auto-assign church ONLY for master developer if missing; normal users choose via onboarding selector
            if (!currentMember.churchId && isMaster) {
              currentMember.churchId = 'semente';
              try {
                await setDoc(memberRef, { churchId: 'semente' }, { merge: true });
              } catch (err) {
                console.error("Erro ao migrar igreja master:", err);
              }
            }
          }

          setRawMemberData(currentMember);

          // Check admin status (Google account or custom admin setting or in profile)
          const hasLeaderRole = Array.isArray(currentMember.roles) && (
            currentMember.roles.includes('Coordenador/Líder') ||
            currentMember.roles.includes('Líder') ||
            currentMember.roles.includes('Pastor/Ministro')
          );

          try {
            const adminRef = doc(db, 'admins', currentUser.uid);
            const adminSnap = await getDoc(adminRef);
            const adminData = adminSnap.exists() ? adminSnap.data() : null;
            const memberCid = typeof currentMember.churchId === 'string' ? currentMember.churchId.trim() : '';
            const adminMatchesChurch = Boolean(
              adminSnap.exists() &&
              memberCid &&
              (
                adminData?.churchId === memberCid ||
                (memberCid === 'semente' && !adminData?.churchId)
              )
            );
            setRawIsAdmin(
              isMaster ||
              adminMatchesChurch ||
              !!currentMember.isAdmin ||
              hasLeaderRole
            );
          } catch (adminErr) {
            setRawIsAdmin(isMaster || !!currentMember.isAdmin || hasLeaderRole);
          }
        }, (err) => {
          console.error("Erro ao assinar dados do membro:", err);
          setLoading(false);
          handleFirestoreError(err, OperationType.GET, 'members/' + currentUser.uid);
        });
      } else {
        setRawMemberData(null);
        setRawIsAdmin(false);
        setChurchData(null);
        setChurchResolutionState('idle');
        setChurchAccessBlockReason(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeMember) unsubscribeMember();
    };
  }, []);

  // Dedicated Church Config Subscription (supports Master Developer switching semente <-> demo_sandbox cleanly)
  useEffect(() => {
    if (!user) {
      setChurchData(null);
      setChurchResolutionState('idle');
      setChurchAccessBlockReason(null);
      return;
    }

    if (!rawMemberData) {
      return;
    }

    if (!effectiveChurchId) {
      purgeCrossTenantLocalCaches();
      setChurchData(null);
      setChurchResolutionState('missing');
      setChurchAccessBlockReason(null);
      setLoading(false);
      return;
    }

    setChurchResolutionState('loading');
    setChurchAccessBlockReason(null);
    purgeCrossTenantLocalCaches(effectiveChurchId);
    const churchRef = doc(db, 'churches', effectiveChurchId);

    const unsubscribeChurch = onSnapshot(churchRef, async (churchSnap) => {
      if (!churchSnap.exists() && effectiveChurchId === 'semente' && isMasterUser) {
        const defaultChurch = {
          name: 'Graça Soberana',
          inviteCode: 'SEMENTE123',
          createdAt: '2024-01-01T00:00:00.000Z',
          createdBy: 'system',
          isSeedChurch: true,
          isVitalicio: true,
          planStatus: 'active',
          planName: 'PRO (Vitalício)',
          planExpiresAt: null,
          masterNotes: 'Igreja Pioneira e Matriz (Graça Soberana) - Acesso Vitalício Permanente.'
        };
        try {
          await setDoc(churchRef, defaultChurch);
          setChurchData({ id: 'semente', ...defaultChurch });
          setChurchResolutionState('valid');
          setChurchAccessBlockReason(null);
        } catch (err) {
          console.error("Erro ao inicializar igreja de semente:", err);
          setChurchData({ id: 'semente', ...defaultChurch });
          setChurchResolutionState('valid');
          setChurchAccessBlockReason(null);
        }
      } else if (!churchSnap.exists() && effectiveChurchId === 'demo_sandbox' && isMasterUser) {
        try {
          const created = await ensureDemoSandboxChurch(user.uid);
          setChurchData(created);
          setChurchResolutionState('valid');
          setChurchAccessBlockReason(null);
        } catch (err) {
          console.error("Erro ao inicializar igreja sandbox:", err);
          setChurchData(null);
          setChurchResolutionState('missing');
          setChurchAccessBlockReason('missing');
        }
      } else if (churchSnap.exists()) {
        const data = churchSnap.data();
        const isSeed = effectiveChurchId === 'semente';
        const rawStatus = String(data.planStatus || '').toLowerCase().trim();
        const isDeletedOrBlocked =
          !isSeed &&
          !isMasterUser &&
          (
            data.deleted === true ||
            rawStatus === 'deleted' ||
            rawStatus === 'suspended' ||
            rawStatus === 'cancelled'
          );

        if (isDeletedOrBlocked) {
          purgeCrossTenantLocalCaches();
          setChurchData(null);
          setChurchResolutionState('blocked');
          setChurchAccessBlockReason(
            rawStatus === 'suspended'
              ? 'suspended'
              : rawStatus === 'cancelled'
              ? 'cancelled'
              : 'deleted'
          );
          setLoading(false);
          return;
        }

        if (
          isSeed &&
          isMasterUser &&
          (
            data.isSeedChurch !== true ||
            data.isVitalicio !== true ||
            data.planStatus !== 'active' ||
            data.planName !== 'PRO (Vitalício)' ||
            data.planExpiresAt !== null
          )
        ) {
          try {
            await setDoc(churchRef, {
              ...(!data.name ? { name: 'Graça Soberana' } : {}),
              isSeedChurch: true,
              isVitalicio: true,
              planStatus: 'active',
              planName: 'PRO (Vitalício)',
              planExpiresAt: null
            }, { merge: true });
          } catch (restoreErr) {
            console.warn("Não foi possível auto-restaurar os metadados oficiais da igreja semente:", restoreErr);
          }
        }
        // Real-time revocation / expiration guard during active Master Remote Support session
        if (isRemoteSupportMode && remoteSupportSession && churchSnap.id === remoteSupportSession.churchId) {
          const rs = data?.remoteSupport;
          const liveExpiresMs = extractSupportExpiresMs(rs);
          if (!rs || rs.active !== true || !liveExpiresMs || liveExpiresMs <= Date.now()) {
            try { sessionStorage.removeItem('liloupro_remote_support_session'); } catch {}
            purgeCrossTenantLocalCaches('semente');
            setRemoteSupportSession(null);
            setLoading(false);
            return;
          }
        }

        setChurchData({
          id: churchSnap.id,
          ...data,
          name: data.name || (isSeed ? 'Graça Soberana' : ''),
          isSeedChurch: isSeed,
          isVitalicio: isSeed ? true : data.isVitalicio
        });
        setChurchResolutionState('valid');
        setChurchAccessBlockReason(null);
      } else {
        if (isRemoteSupportMode) {
          try { sessionStorage.removeItem('liloupro_remote_support_session'); } catch {}
          purgeCrossTenantLocalCaches('semente');
          setRemoteSupportSession(null);
          setLoading(false);
          return;
        }
        // HARD GUARD: Church document does NOT exist in Firestore (deleted/ghost tenant)
        purgeCrossTenantLocalCaches();
        setChurchData(null);
        setChurchResolutionState('missing');
        setChurchAccessBlockReason('missing');
      }
      setLoading(false);
    }, (err) => {
      console.error("Erro ao assinar canal da igreja:", err);
      purgeCrossTenantLocalCaches();
      setChurchData(null);
      setChurchResolutionState('missing');
      setChurchAccessBlockReason('missing');
      setLoading(false);
      handleFirestoreError(err, OperationType.GET, 'churches/' + effectiveChurchId);
    });

    return () => {
      unsubscribeChurch();
    };
  }, [user?.uid, rawMemberData?.churchId, effectiveChurchId, isMasterUser]);

  // Immediate optimistic sync for church theme/branding updates so exiting Settings never reverts color
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleThemeUpdated = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail || !detail.churchId) return;
      setChurchData((prev: any) => {
        if (!prev || prev.id !== detail.churchId) return prev;
        return {
          ...prev,
          ...detail.updates
        };
      });
    };
    window.addEventListener('liloupro:theme-updated', handleThemeUpdated);
    return () => window.removeEventListener('liloupro:theme-updated', handleThemeUpdated);
  }, []);

  // Firebase Cloud Messaging (FCM) token registration and foreground message listener
  const fcmRegisteredUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      fcmRegisteredUidRef.current = null;
      return;
    }

    let isActive = true;
    let unsubscribeForeground: (() => void) | null = null;
    const contextKey = `${user.uid}:${effectiveChurchId || ''}`;

    // Register token once per user/church session when permission is granted
    if (fcmRegisteredUidRef.current !== contextKey) {
      fcmRegisteredUidRef.current = contextKey;
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        requestFcmToken().catch((err) => {
          console.warn('[FCM] Token registration skipped or deferred:', err);
        });
      }
    }

    // Attach single foreground listener for active app sessions
    setupForegroundMessageListener((payload) => {
      console.log('[FCM] Notificação em primeiro plano recebida:', payload);
    }).then((unsub) => {
      if (!isActive) {
        if (unsub) unsub();
        return;
      }
      if (unsub) {
        unsubscribeForeground = unsub;
      }
    });

    return () => {
      isActive = false;
      if (unsubscribeForeground) {
        unsubscribeForeground();
      }
    };
  }, [user?.uid, effectiveChurchId]);

  // Global Remote Support Policy subscription ('all' by default, or 'premium_only')
  useEffect(() => {
    if (!user?.uid) {
      setRemoteSupportPolicy('all');
      return;
    }
    const policyRef = doc(db, 'settings', 'remote_support_policy');
    const unsub = onSnapshot(policyRef, (snap) => {
      const val = snap.exists() ? snap.data()?.policy : 'all';
      setRemoteSupportPolicy(val === 'premium_only' ? 'premium_only' : 'all');
    }, () => {
      setRemoteSupportPolicy('all');
    });
    return () => unsub();
  }, [user?.uid]);

  // Automatic local expiration watcher for active Remote Support session
  useEffect(() => {
    if (!isRemoteSupportMode || !remoteSupportSession?.expiresAtMs) return;
    const checkExpiry = () => {
      if (Date.now() >= remoteSupportSession.expiresAtMs) {
        endRemoteSupportSession('expired');
      }
    };
    checkExpiry();
    const timer = window.setInterval(checkExpiry, 5000);
    return () => window.clearInterval(timer);
  }, [isRemoteSupportMode, remoteSupportSession?.churchId, remoteSupportSession?.expiresAtMs]);

  const effectiveLoading = loading || Boolean(user && rawMemberData && effectiveChurchId && churchResolutionState === 'loading');

  return (
    <AuthContext.Provider value={{
      user,
      loading: effectiveLoading,
      memberData,
      isAdmin,
      churchData,
      churchResolutionState,
      churchAccessBlockReason,
      effectivePlan,
      isVitalicio,
      isPaidActive,
      isSandboxMode,
      switchChurchContext,
      isRemoteSupportMode,
      remoteSupportSession,
      remoteSupportPolicy,
      startRemoteSupportSession,
      endRemoteSupportSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
