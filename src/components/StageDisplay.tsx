import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cleanLyricsForProjection } from '../services/chordService';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Clock, Music, AlertCircle, ChevronRight, Wifi } from 'lucide-react';

interface StageState {
  text: string;
  nextSlideText?: string | null;
  activeSongTitle?: string | null;
  activeSongArtist?: string | null;
  countdownUntil?: number | null;
  clearText?: boolean;
  blackout?: boolean;
  scrollingAlert?: string | null;
  currentSlideIdx?: number;
  totalSlides?: number;
}

export function StageDisplay() {
  const searchParams = new URLSearchParams(window.location.search);
  const churchId = searchParams.get('church') || localStorage.getItem('lilo_active_church_id') || 'semente';
  const sessionId = searchParams.get('session') || churchId;

  const [state, setState] = useState<StageState>(() => {
    let storedState: any = {};
    try {
      const raw = localStorage.getItem('lilo-projection-state');
      if (raw) storedState = JSON.parse(raw);
    } catch (e) {
      console.warn('Erro ao carregar estado local do retorno de palco:', e);
    }

    return {
      text: storedState.text || '',
      nextSlideText: storedState.nextSlideText || null,
      activeSongTitle: storedState.activeSongTitle || null,
      activeSongArtist: storedState.activeSongArtist || null,
      countdownUntil: storedState.countdownUntil || null,
      clearText: storedState.clearText || false,
      blackout: storedState.blackout || false,
      scrollingAlert: storedState.scrollingAlert || null,
      currentSlideIdx: storedState.currentSlideIdx || 0,
      totalSlides: storedState.totalSlides || 0
    };
  });

  // Relógio em tempo real (HH:MM:SS)
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${h}:${m}:${s}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer de contagem regressiva
  const [countdownFormatted, setCountdownFormatted] = useState<string | null>(null);
  useEffect(() => {
    if (!state.countdownUntil) {
      setCountdownFormatted(null);
      return;
    }

    const updateTimer = () => {
      const diff = state.countdownUntil! - Date.now();
      if (diff <= 0) {
        setCountdownFormatted('00:00');
        return false;
      }
      const totalSecs = Math.floor(diff / 1000);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      setCountdownFormatted(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      return true;
    };

    updateTimer();
    const interval = setInterval(() => {
      const active = updateTimer();
      if (!active) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [state.countdownUntil]);

  // Sincronização via Storage, Broadcast e Firestore
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lilo-projection-state' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setState(prev => ({ ...prev, ...parsed }));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('lilo-projection-sync');
      channel.onmessage = (event) => {
        if (event.data) setState(prev => ({ ...prev, ...event.data }));
      };
    } catch (e) {}

    let unsubFirestore: (() => void) | null = null;
    try {
      const docRef = doc(db, 'projection_sessions', sessionId);
      unsubFirestore = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setState(prev => ({ ...prev, ...data }));
        }
      });
    } catch (err) {}

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (channel) channel.close();
      if (unsubFirestore) unsubFirestore();
    };
  }, [sessionId]);

  const currentClean = cleanLyricsForProjection(state.text || '');
  const currentLines = currentClean ? currentClean.split('\n').filter(l => l.trim() !== '') : [];

  const nextClean = cleanLyricsForProjection(state.nextSlideText || '');
  const nextLines = nextClean ? nextClean.split('\n').filter(l => l.trim() !== '') : [];

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black text-white flex flex-col justify-between p-6 sm:p-8 select-none font-sans overflow-hidden">
      {/* BARRA SUPERIOR: Relógio, Música Ativa, Countdown e Status */}
      <header className="flex items-center justify-between border-b border-zinc-800/80 pb-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Retorno de Palco</span>
          </div>

          {state.activeSongTitle && (
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-sm sm:text-base">
              <Music size={18} className="text-amber-400 shrink-0" />
              <span className="text-white font-extrabold">{state.activeSongTitle}</span>
              {state.activeSongArtist && (
                <span className="text-zinc-400 text-xs font-medium">({state.activeSongArtist})</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-5">
          {countdownFormatted && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-400 font-mono font-black text-lg sm:text-xl animate-pulse">
              <span>⏱️ {countdownFormatted}</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 font-mono font-black text-xl sm:text-2xl tracking-wider">
            <Clock size={18} className="text-zinc-500" />
            <span>{currentTime}</span>
          </div>
        </div>
      </header>

      {/* ALERTA DA CABINE DE SOM / MESA */}
      <AnimatePresence>
        {state.scrollingAlert && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="my-2 bg-red-600/90 text-white font-black px-6 py-2.5 rounded-2xl shadow-xl flex items-center justify-center gap-3 text-base uppercase tracking-wider border border-red-400 animate-pulse"
          >
            <AlertCircle size={22} />
            <span>AVISO DO MINISTÉRIO: {state.scrollingAlert}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ÁREA CENTRAL: VERSO ATUAL (GIGANTE PARA VISÃO À DISTÂNCIA) */}
      <main className="flex-1 flex flex-col justify-center items-center text-center px-4 py-6">
        <AnimatePresence mode="wait">
          {state.blackout ? (
            <motion.div
              key="blackout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-zinc-600 font-bold uppercase tracking-widest text-xl"
            >
              [ TELÃO APAGADO - BLACKOUT ]
            </motion.div>
          ) : state.clearText ? (
            <motion.div
              key="clear"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-zinc-600 font-bold uppercase tracking-widest text-xl"
            >
              [ TELÃO LIMPO ]
            </motion.div>
          ) : currentLines.length > 0 ? (
            <motion.div
              key={currentLines.join('-')}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 sm:space-y-4 max-w-6xl w-full"
            >
              {currentLines.map((line, idx) => (
                <p 
                  key={idx} 
                  className="font-black text-3xl sm:text-5xl md:text-6xl lg:text-[68px] leading-tight text-white tracking-tight"
                >
                  {line}
                </p>
              ))}
            </motion.div>
          ) : (
            <div className="text-zinc-700 font-semibold text-lg">
              Aguardando projeção...
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* BARRA INFERIOR: PRÓXIMO VERSO (PREVIEW PARA VOCALISTAS E BANDA) */}
      <footer className="shrink-0 pt-3 border-t border-zinc-800/80">
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 flex items-start sm:items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 font-black text-xs uppercase tracking-wider rounded-lg shrink-0">
            <span>PRÓXIMO</span>
            <ChevronRight size={14} />
          </div>

          <div className="flex-1 overflow-hidden">
            {nextLines.length > 0 ? (
              <p className="text-zinc-300 font-bold text-base sm:text-lg md:text-xl truncate leading-tight">
                {nextLines.join('  /  ')}
              </p>
            ) : (
              <p className="text-zinc-600 font-medium text-sm italic">
                {currentLines.length > 0 ? 'Fim da música ou próximo slide vazio' : 'Nenhum slide subsequente'}
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
