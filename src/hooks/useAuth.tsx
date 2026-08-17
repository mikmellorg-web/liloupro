import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { getChurchEffectivePlan, isVitalicioPlan, EffectivePlanResult } from '../services/planService';

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

      if (currentUser) {
        const memberRef = doc(db, 'members', currentUser.uid);
        
        // Listen to member changes dynamically
        unsubscribeMember = onSnapshot(memberRef, async (memberSnap) => {
          let currentMember: any = null;
          
          if (!memberSnap.exists()) {
            currentMember = {
              uid: currentUser.uid,
              name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Membro',
              email: currentUser.email || '',
              photoUrl: currentUser.photoURL || '',
              roles: [],
              isAdmin: currentUser.email === 'mikmellorg@gmail.com',
              availability: {},
              churchId: 'semente', // Default to semente
              defaultBibleVersion: 'NAA' // Initial default saved in Firestore for each member!
            };
            try {
              await setDoc(memberRef, currentMember);
            } catch (err) {
              console.error("Erro ao criar perfil de membro inicial:", err);
            }
          } else {
            currentMember = { id: memberSnap.id, ...memberSnap.data() };
            
            // Auto-sync profile photo from Google Auth if they don't have one in Firestore
            if (!currentMember.photoUrl && currentUser.photoURL) {
              currentMember.photoUrl = currentUser.photoURL;
              try {
                await setDoc(memberRef, { photoUrl: currentUser.photoURL }, { merge: true });
              } catch (err) {
                console.error("Erro ao sincronizar foto de perfil do Google:", err);
              }
            }

            // Auto-assign default Bible version if they don't have one
            if (!currentMember.defaultBibleVersion) {
              currentMember.defaultBibleVersion = 'NAA';
              try {
                await setDoc(memberRef, { defaultBibleVersion: 'NAA' }, { merge: true });
              } catch (err) {
                console.error("Erro ao definir tradução padrão da bíblia:", err);
              }
            }

            // Auto-assign default church if they don't have one
            if (!currentMember.churchId) {
              currentMember.churchId = 'semente';
              try {
                await setDoc(memberRef, { churchId: 'semente' }, { merge: true });
              } catch (err) {
                console.error("Erro ao migrar igreja padrão do membro:", err);
              }
            }
          }
          
          setMemberData(currentMember);

          // Check admin status (Google account or custom admin setting or in profile)
          try {
            const adminRef = doc(db, 'admins', currentUser.uid);
            const adminSnap = await getDoc(adminRef);
            setIsAdmin(
              currentUser.email === 'mikmellorg@gmail.com' || 
              adminSnap.exists() || 
              !!currentMember.isAdmin
            );
          } catch (adminErr) {
            setIsAdmin(currentUser.email === 'mikmellorg@gmail.com' || !!currentMember.isAdmin);
          }

          // Fetch the church config and listen to its changes
          const churchId = currentMember.churchId || 'semente';
          const churchRef = doc(db, 'churches', churchId);

          if (unsubscribeChurch) {
            unsubscribeChurch();
          }

          unsubscribeChurch = onSnapshot(churchRef, async (churchSnap) => {
            if (!churchSnap.exists() && churchId === 'semente') {
              // Ensure default semente church is created
              const defaultChurch = {
                name: 'Igreja Principal (Semente)',
                inviteCode: 'SEMENTE123',
                createdAt: new Date().toISOString(),
                createdBy: 'system'
              };
              try {
                await setDoc(churchRef, defaultChurch);
                setChurchData({ id: 'semente', ...defaultChurch });
              } catch (err) {
                console.error("Erro ao inicializar igreja de semente:", err);
                setChurchData({ id: 'semente', ...defaultChurch });
              }
            } else if (churchSnap.exists()) {
              setChurchData({ id: churchSnap.id, ...churchSnap.data() });
            } else {
              setChurchData(null);
            }
            setLoading(false);
          }, (err) => {
            console.error("Erro ao assinar canal da igreja:", err);
            setLoading(false);
            handleFirestoreError(err, OperationType.GET, 'churches/' + churchId);
          });

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

  return (
    <AuthContext.Provider value={{ user, loading, memberData, isAdmin, churchData, effectivePlan, isVitalicio, isPaidActive }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
