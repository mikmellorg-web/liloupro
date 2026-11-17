import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { getChurchEffectivePlan, isVitalicioPlan, EffectivePlanResult } from '../services/planService';
import { requestFcmToken, setupForegroundMessageListener } from '../services/fcmService';
import { notifyChurchLeadersOfNewMember } from '../services/memberJoinNotificationService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  memberData: any | null;
  isAdmin: boolean;
  churchData: any | null;
  effectivePlan: EffectivePlanResult | null;
  isVitalicio: boolean;
  isPaidActive: boolean;
  isSandboxMode: boolean;
  switchChurchContext: (targetChurchId: 'semente' | 'demo_sandbox') => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  memberData: null,
  isAdmin: false,
  churchData: null,
  effectivePlan: null,
  isVitalicio: false,
  isPaidActive: false,
  isSandboxMode: false,
  switchChurchContext: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [rawMemberData, setRawMemberData] = useState<any | null>(null);
  const [rawIsAdmin, setRawIsAdmin] = useState(false);
  const [churchData, setChurchData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [masterChurchOverride, setMasterChurchOverride] = useState<'semente' | 'demo_sandbox' | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('liloupro_master_sandbox_active') === 'true' ? 'demo_sandbox' : null;
    } catch {
      return null;
    }
  });

  const isMasterUser = Boolean(user && (user.email || '').toLowerCase().trim() === 'mikmellorg@gmail.com');
  const isSandboxMode = Boolean(isMasterUser && masterChurchOverride === 'demo_sandbox');
  const effectiveChurchId = isSandboxMode
    ? 'demo_sandbox'
    : (rawMemberData?.churchId || (isMasterUser ? 'semente' : ''));

  const memberData = rawMemberData
    ? (isSandboxMode
        ? {
            ...rawMemberData,
            churchId: 'demo_sandbox',
            isAdmin: true,
            dismissedOnboarding: Boolean(churchData?.onboardingDismissed)
          }
        : rawMemberData)
    : null;

  const isAdmin = isSandboxMode ? true : rawIsAdmin;

  const effectivePlan = churchData ? getChurchEffectivePlan(churchData) : null;
  const isVitalicio = churchData ? isVitalicioPlan(churchData) : false;
  const isPaidActive = effectivePlan
    ? (!effectivePlan.isTrial && !effectivePlan.isExpiredTrial && effectivePlan.planId !== 'semeadora')
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

  const switchChurchContext = async (targetChurchId: 'semente' | 'demo_sandbox') => {
    if (!isMasterUser || !user) return;
    try {
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
      const nextUid = currentUser?.uid || null;
      if (previousUid !== nextUid) {
        previousUid = nextUid;
        setRawMemberData(null);
        setRawIsAdmin(false);
        setChurchData(null);
        if (nextUid) {
          setLoading(true);
        } else {
          setMasterChurchOverride(null);
          try {
            localStorage.removeItem('liloupro_master_sandbox_active');
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
                    targetChurchId = snap.docs[0].id;
                    resolvedChurchDocData = { id: snap.docs[0].id, ...snap.docs[0].data() };
                    isUserAdmin = false;
                    initialRoles = [];
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
                name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Líder',
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
            setRawIsAdmin(
              isMaster ||
              adminSnap.exists() ||
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
      return;
    }

    if (!rawMemberData) {
      return;
    }

    if (!effectiveChurchId) {
      purgeCrossTenantLocalCaches();
      setChurchData(null);
      setLoading(false);
      return;
    }

    purgeCrossTenantLocalCaches(effectiveChurchId);
    const churchRef = doc(db, 'churches', effectiveChurchId);

    const unsubscribeChurch = onSnapshot(churchRef, async (churchSnap) => {
      if (!churchSnap.exists() && effectiveChurchId === 'semente') {
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
        } catch (err) {
          console.error("Erro ao inicializar igreja de semente:", err);
          setChurchData({ id: 'semente', ...defaultChurch });
        }
      } else if (!churchSnap.exists() && effectiveChurchId === 'demo_sandbox' && isMasterUser) {
        try {
          const created = await ensureDemoSandboxChurch(user.uid);
          setChurchData(created);
        } catch (err) {
          console.error("Erro ao inicializar igreja sandbox:", err);
          setChurchData(null);
        }
      } else if (churchSnap.exists()) {
        const data = churchSnap.data();
        const isSeed = effectiveChurchId === 'semente';
        if (
          isSeed &&
          isMasterUser &&
          (
            data.name !== 'Graça Soberana' ||
            data.isSeedChurch !== true ||
            data.isVitalicio !== true ||
            data.planStatus !== 'active' ||
            data.planName !== 'PRO (Vitalício)' ||
            data.planExpiresAt !== null
          )
        ) {
          try {
            await setDoc(churchRef, {
              name: 'Graça Soberana',
              isSeedChurch: true,
              isVitalicio: true,
              planStatus: 'active',
              planName: 'PRO (Vitalício)',
              planExpiresAt: null
            }, { merge: true });
          } catch (restoreErr) {
            console.warn("Não foi possível auto-restaurar os metadados oficiais da igreja Graça Soberana:", restoreErr);
          }
        }
        setChurchData({
          id: churchSnap.id,
          ...data,
          name: isSeed ? 'Graça Soberana' : data.name,
          isSeedChurch: isSeed,
          isVitalicio: isSeed ? true : data.isVitalicio
        });
      } else {
        setChurchData(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Erro ao assinar canal da igreja:", err);
      setLoading(false);
      handleFirestoreError(err, OperationType.GET, 'churches/' + effectiveChurchId);
    });

    return () => {
      unsubscribeChurch();
    };
  }, [user?.uid, rawMemberData?.churchId, effectiveChurchId, isMasterUser]);

  // Firebase Cloud Messaging (FCM) token registration and foreground message listener
  const fcmRegisteredUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      fcmRegisteredUidRef.current = null;
      return;
    }

    let unsubscribeForeground: (() => void) | null = null;

    // Register token once per user session
    if (fcmRegisteredUidRef.current !== user.uid) {
      fcmRegisteredUidRef.current = user.uid;
      requestFcmToken().catch((err) => {
        console.warn('[FCM] Token registration skipped or deferred:', err);
      });
    }

    // Attach foreground listener for active app sessions
    setupForegroundMessageListener((payload) => {
      console.log('[FCM] Notificação em primeiro plano recebida:', payload);
    }).then((unsub) => {
      if (unsub) {
        unsubscribeForeground = unsub;
      }
    });

    return () => {
      if (unsubscribeForeground) {
        unsubscribeForeground();
      }
    };
  }, [user?.uid]);

  return (
    <AuthContext.Provider value={{ user, loading, memberData, isAdmin, churchData, effectivePlan, isVitalicio, isPaidActive, isSandboxMode, switchChurchContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
