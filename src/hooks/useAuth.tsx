import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { getChurchEffectivePlan, isVitalicioPlan, EffectivePlanResult } from '../services/planService';
import { requestFcmToken, setupForegroundMessageListener } from '../services/fcmService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  memberData: any | null;
  isAdmin: boolean;
  churchData: any | null;
  effectivePlan: EffectivePlanResult | null;
  isVitalicio: boolean;
  isPaidActive: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  memberData: null,
  isAdmin: false,
  churchData: null,
  effectivePlan: null,
  isVitalicio: false,
  isPaidActive: false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [memberData, setMemberData] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [churchData, setChurchData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const effectivePlan = churchData ? getChurchEffectivePlan(churchData) : null;
  const isVitalicio = churchData ? isVitalicioPlan(churchData) : false;
  const isPaidActive = effectivePlan
    ? (!effectivePlan.isTrial && !effectivePlan.isExpiredTrial && effectivePlan.planId !== 'semeadora')
    : false;

  useEffect(() => {
    let unsubscribeMember: (() => void) | null = null;
    let unsubscribeChurch: (() => void) | null = null;
    let activeChurchId: string | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      // Clean up previous listeners
      if (unsubscribeMember) {
        unsubscribeMember();
        unsubscribeMember = null;
      }
      if (unsubscribeChurch) {
        unsubscribeChurch();
        unsubscribeChurch = null;
      }
      activeChurchId = null;

      if (currentUser) {
        const memberRef = doc(db, 'members', currentUser.uid);
        
        // Listen to member changes dynamically
        unsubscribeMember = onSnapshot(memberRef, async (memberSnap) => {
          const userEmailLower = (currentUser.email || '').toLowerCase().trim();
          const isMaster = userEmailLower === 'mikmellorg@gmail.com' || userEmailLower === 'miqueiasmellopro@gmail.com';
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
              // For any new non-master user: check if there's an invite code, otherwise create an isolated new church tenant
              const pendingInvite = typeof window !== 'undefined' ? localStorage.getItem('pending_invite_code') : null;
              const pendingChurchName = typeof window !== 'undefined' ? localStorage.getItem('pending_church_name_for_signup') : null;
              
              let targetChurchId = '';
              let isUserAdmin = true;
              let initialRoles = ['Coordenador/Líder'];

              if (pendingInvite) {
                try {
                  const { collection: col, query: qQuery, where: wWhere, getDocs: gDocs } = await import('firebase/firestore');
                  const snap = await gDocs(qQuery(col(db, 'churches'), wWhere('inviteCode', '==', pendingInvite.trim().toUpperCase())));
                  if (!snap.empty) {
                    targetChurchId = snap.docs[0].id;
                    isUserAdmin = false;
                    initialRoles = [];
                    localStorage.removeItem('pending_invite_code');
                  }
                } catch (inviteErr) {
                  console.warn("Erro ao buscar convite pendente:", inviteErr);
                }
              }

              if (!targetChurchId) {
                // Provision a brand new isolated church tenant with 30-day trial
                const newChurchId = `igreja_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                const newInvite = `IGREJA-${Math.floor(100000 + Math.random() * 900000)}`;
                const churchDisplayName = pendingChurchName?.trim() || `Igreja de ${currentUser.displayName || currentUser.email?.split('@')[0] || 'Louvor'}`;

                try {
                  await setDoc(doc(db, 'churches', newChurchId), {
                    name: churchDisplayName,
                    inviteCode: newInvite,
                    createdAt: new Date().toISOString(),
                    createdBy: currentUser.uid,
                    planStatus: 'trial',
                    planId: 'completo',
                    isTrial: true,
                    trialStartDate: new Date().toISOString(),
                    contactEmail: currentUser.email || '',
                    maxMembers: 50,
                    maxSongs: 9999,
                    roles: ['Teclado', 'Violão', 'Voz', 'Guitarra', 'Baixo', 'Bateria', 'Mesa de Som']
                  });
                  targetChurchId = newChurchId;
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('pending_church_name_for_signup');
                    localStorage.setItem('lilo_active_church_id', newChurchId);
                  }
                } catch (chErr) {
                  console.error("Erro ao provisionar nova igreja para usuário:", chErr);
                  targetChurchId = newChurchId;
                }
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

            // Auto-assign church ONLY if missing: master gets semente, normal user gets new church
            if (!currentMember.churchId) {
              if (isMaster) {
                currentMember.churchId = 'semente';
                try {
                  await setDoc(memberRef, { churchId: 'semente' }, { merge: true });
                } catch (err) {
                  console.error("Erro ao migrar igreja master:", err);
                }
              } else {
                const newChurchId = `igreja_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                const newInvite = `IGREJA-${Math.floor(100000 + Math.random() * 900000)}`;
                try {
                  await setDoc(doc(db, 'churches', newChurchId), {
                    name: `Igreja de ${currentMember.name || 'Louvor'}`,
                    inviteCode: newInvite,
                    createdAt: new Date().toISOString(),
                    createdBy: currentUser.uid,
                    planStatus: 'trial',
                    planId: 'completo',
                    isTrial: true,
                    trialStartDate: new Date().toISOString()
                  });
                  currentMember.churchId = newChurchId;
                  currentMember.isAdmin = true;
                  await setDoc(memberRef, { churchId: newChurchId, isAdmin: true }, { merge: true });
                } catch (e) {
                  console.error("Erro ao criar igreja para membro sem igreja:", e);
                }
              }
            }
          }
          
          setMemberData(currentMember);

          // Check admin status (Google account or custom admin setting or in profile)
          const hasLeaderRole = Array.isArray(currentMember.roles) && (
            currentMember.roles.includes('Coordenador/Líder') ||
            currentMember.roles.includes('Líder') ||
            currentMember.roles.includes('Pastor/Ministro')
          );

          try {
            const adminRef = doc(db, 'admins', currentUser.uid);
            const adminSnap = await getDoc(adminRef);
            setIsAdmin(
              isMaster || 
              adminSnap.exists() || 
              !!currentMember.isAdmin ||
              hasLeaderRole
            );
          } catch (adminErr) {
            setIsAdmin(isMaster || !!currentMember.isAdmin || hasLeaderRole);
          }

          // Fetch the church config and listen to its changes (only re-subscribe if churchId changed)
          const churchId = currentMember.churchId || 'semente';

          if (activeChurchId !== churchId || !unsubscribeChurch) {
            if (unsubscribeChurch) {
              unsubscribeChurch();
              unsubscribeChurch = null;
            }
            activeChurchId = churchId;
            const churchRef = doc(db, 'churches', churchId);

            unsubscribeChurch = onSnapshot(churchRef, async (churchSnap) => {
              if (!churchSnap.exists() && churchId === 'semente') {
                // Ensure default semente church is created with lifetime seed protection
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
              } else if (churchSnap.exists()) {
                const data = churchSnap.data();
                const isSeed = churchId === 'semente' || data.isSeedChurch === true || (data.name && data.name.toLowerCase().includes('graça soberana'));
                setChurchData({ 
                  id: churchSnap.id, 
                  ...data,
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
              handleFirestoreError(err, OperationType.GET, 'churches/' + churchId);
            });
          }

        }, (err) => {
          console.error("Erro ao assinar dados do membro:", err);
          setLoading(false);
          handleFirestoreError(err, OperationType.GET, 'members/' + currentUser.uid);
        });
      } else {
        setMemberData(null);
        setIsAdmin(false);
        setChurchData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeMember) unsubscribeMember();
      if (unsubscribeChurch) unsubscribeChurch();
    };
  }, []);

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
    <AuthContext.Provider value={{ user, loading, memberData, isAdmin, churchData, effectivePlan, isVitalicio, isPaidActive }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
