import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Calendar, Check, X, Clock, HelpCircle, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export function AvailabilityView({
  createNotifications,
  theme
}: {
  createNotifications?: (
    title: string,
    content: string,
    type: 'announcement' | 'mural' | 'service' | 'general',
    excludeUserId?: string,
    preferenceKey?: 'notifyNewSongs' | 'notifyScheduleChanges' | 'notifyDayBeforeReminder' | 'notifyNewLiturgy'
  ) => Promise<void>;
  theme?: 'light' | 'dark';
}) {
  const { user, memberData, isAdmin } = useAuth();
  const userChurchId = memberData?.churchId || 'semente';
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'services'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s: any) => !s.churchId || s.churchId === userChurchId);
        list.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setServices(list);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'services');
        setLoading(false);
      }
    );
    return () => unsub();
  }, [userChurchId]);

  const setAvailability = async (serviceId: string, status: 'available' | 'unavailable' | 'maybe') => {
    if (!user) return;
    try {
      const targetService = services.find((s) => s.id === serviceId);
      const currentAvailability = targetService?.availability || {};
      const updated = {
        ...currentAvailability,
        [user.uid]: {
          status,
          updatedAt: new Date().toISOString(),
          userName: memberData?.name || user.displayName || user.email || 'Membro'
        }
      };
      await updateDoc(doc(db, 'services', serviceId), {
        availability: updated
      });
    } catch (err) {
      console.error('Erro ao atualizar disponibilidade:', err);
    }
  };

  const upcomingServices = services.filter((s) => {
    const d = new Date(s.date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return d >= now;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 px-2 sm:px-4">
      {/* Header */}
      <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-brand/10 text-brand border border-brand/20">
              <UserCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-text-main tracking-tight">
                Minha Disponibilidade
              </h2>
              <p className="text-xs sm:text-sm text-text-muted font-medium mt-0.5">
                Informe sua disponibilidade para os próximos cultos e escalas de louvor
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-text-muted flex flex-col items-center justify-center gap-3">
          <RefreshCw size={28} className="animate-spin text-brand" />
          <p className="text-xs font-bold uppercase tracking-wider">Carregando cultos...</p>
        </div>
      ) : upcomingServices.length === 0 ? (
        <div className="bg-surface border border-border rounded-3xl p-10 text-center text-text-muted">
          <Calendar size={40} className="mx-auto mb-3 opacity-30 text-brand" />
          <p className="text-sm font-black uppercase tracking-wider text-text-main">
            Nenhum culto futuro agendado
          </p>
          <p className="text-xs text-text-muted mt-1">
            Quando novos cultos forem cadastrados no calendário, eles aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {upcomingServices.map((service) => {
            const userAvail = service.availability?.[user?.uid || '']?.status;
            const serviceDate = new Date(service.date);
            const dateFormatted = serviceDate.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            });
            const timeFormatted = serviceDate.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface border border-border hover:border-brand/40 rounded-3xl p-5 sm:p-6 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand/10 text-brand border border-brand/20">
                      {service.type || 'Culto'}
                    </span>
                    <span className="text-xs font-bold text-text-muted flex items-center gap-1">
                      <Clock size={12} /> {timeFormatted}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-text-main">{service.title}</h3>
                  <p className="text-xs text-text-muted capitalize">{dateFormatted}</p>
                </div>

                {/* Status selector */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAvailability(service.id, 'available')}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      userAvail === 'available'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 scale-105'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                    }`}
                  >
                    <Check size={14} /> Disponível
                  </button>

                  <button
                    type="button"
                    onClick={() => setAvailability(service.id, 'unavailable')}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      userAvail === 'unavailable'
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25 scale-105'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                    }`}
                  >
                    <X size={14} /> Indisponível
                  </button>

                  <button
                    type="button"
                    onClick={() => setAvailability(service.id, 'maybe')}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      userAvail === 'maybe'
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25 scale-105'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                    }`}
                  >
                    <HelpCircle size={14} /> Talvez
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LiturgyEditor({
  service,
  onOpenSong,
  playlistOnly = false,
  createNotifications
}: {
  service: any;
  onOpenSong?: (songId: string) => void;
  playlistOnly?: boolean;
  createNotifications?: any;
}) {
  const { user } = useAuth();
  const liturgyItems = service?.liturgy || [];

  return (
    <div className="space-y-4">
      {liturgyItems.length === 0 ? (
        <p className="text-xs text-text-muted italic">Nenhuma atividade litúrgica cadastrada.</p>
      ) : (
        <div className="space-y-2">
          {liturgyItems.map((item: any, idx: number) => {
            const isSong = item.type === 'song';
            return (
              <div
                key={item.id || idx}
                className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-border flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <span className="font-bold text-text-main truncate block">
                      {item.title || item.name || 'Sem título'}
                    </span>
                    {item.moment && (
                      <span className="text-[10px] text-text-muted block truncate">
                        {item.moment}
                      </span>
                    )}
                  </div>
                </div>

                {isSong && item.songId && onOpenSong && (
                  <button
                    type="button"
                    onClick={() => onOpenSong(item.songId)}
                    className="px-3 py-1.5 rounded-xl bg-brand text-white text-[11px] font-bold shrink-0 hover:opacity-90 transition-opacity"
                  >
                    Abrir Cifra
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
