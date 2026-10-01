import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize, Minimize, AlertCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface ProjectorState {
  text: string;
  theme?: string;
  activeSongTitle?: string | null;
  activeSongArtist?: string | null;
  clearText?: boolean;
  blackout?: boolean;
  scrollingAlert?: string | null;
  textUppercase?: boolean;
  fontFamily?: string;
  fontSizeMultiplier?: number;
  lineHeightMultiplier?: number;
  customBgUrl?: string;
}

export function ProjectorDisplay() {
  const searchParams = new URLSearchParams(window.location.search);
  const churchId = searchParams.get('church') || localStorage.getItem('lilo_active_church_id') || 'semente';
  const sessionId = searchParams.get('session') || churchId;

  const [state, setState] = useState<ProjectorState>(() => {
    let storedState: any = {};
    try {
      const raw = localStorage.getItem('lilo-projection-state');
      if (raw) storedState = JSON.parse(raw);
    } catch (e) {
      console.warn('[ProjectorDisplay] Erro ao carregar estado local de projeção:', e);
    }

    return {
      text: storedState.text || '',
      theme: storedState.theme || 'black',
      activeSongTitle: storedState.activeSongTitle || null,
      activeSongArtist: storedState.activeSongArtist || null,
      clearText: storedState.clearText || false,
      blackout: storedState.blackout || false,
      scrollingAlert: storedState.scrollingAlert || null,
      textUppercase: storedState.textUppercase || false,
      fontFamily: storedState.fontFamily || 'sans',
      fontSizeMultiplier: storedState.fontSizeMultiplier || 1,
      lineHeightMultiplier: storedState.lineHeightMultiplier || 1.3,
      customBgUrl: storedState.customBgUrl || undefined
    };
  });

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Escuta BroadcastChannel para sincronização instantânea na mesma máquina
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('lilo-projection-channel');
      channel.onmessage = (event) => {
        if (event.data && typeof event.data === 'object') {
          setState((prev) => ({ ...prev, ...event.data }));
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel não suportado neste navegador:', e);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'lilo-projection-state' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setState((prev) => ({ ...prev, ...parsed }));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      channel?.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Escuta Firestore para projeção remota em tempo real
  useEffect(() => {
    if (!db || !sessionId) return;
    try {
      const sessionDocRef = doc(db, 'projection_sessions', sessionId);
      const unsubscribe = onSnapshot(sessionDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setState((prev) => ({ ...prev, ...data }));
        }
      }, (err) => {
        console.warn('[ProjectorDisplay] Firestore listener:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('[ProjectorDisplay] Erro ao iniciar listener Firestore:', e);
    }
  }, [sessionId]);

  // Atalhos de teclado (F para fullscreen, B para blackout, C para clearText)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          setIsFullscreen(true);
        } else {
          document.exitFullscreen().catch(() => {});
          setIsFullscreen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const getThemeBackground = () => {
    if (state.blackout) return 'bg-black';
    if (state.customBgUrl) {
      return 'bg-cover bg-center';
    }
    switch (state.theme) {
      case 'blue':
        return 'bg-gradient-to-b from-blue-950 via-slate-950 to-black';
      case 'purple':
        return 'bg-gradient-to-b from-purple-950 via-slate-950 to-black';
      case 'worship':
        return 'bg-gradient-to-b from-indigo-950 via-slate-950 to-black';
      case 'white':
        return 'bg-slate-100 text-slate-900';
      case 'black':
      default:
        return 'bg-black text-white';
    }
  };

  const isLight = state.theme === 'white';
  const textColorClass = isLight ? 'text-slate-900' : 'text-white';
  const subTextColorClass = isLight ? 'text-slate-600' : 'text-slate-400';

  return (
    <div 
      className={`relative w-screen h-screen overflow-hidden flex flex-col justify-between select-none ${getThemeBackground()}`}
      style={state.customBgUrl && !state.blackout ? { backgroundImage: `url(${state.customBgUrl})` } : undefined}
    >
      {/* Botão sutil de Fullscreen no canto superior direito (oculto no telão ao mover o mouse) */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-40 p-2.5 rounded-full bg-black/40 hover:bg-black/80 text-white/60 hover:text-white backdrop-blur-sm transition-all opacity-0 hover:opacity-100"
        title="Alternar Tela Cheia (F)"
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>

      {/* Alerta de rodapé / aviso com rolagem */}
      {state.scrollingAlert && !state.blackout && (
        <div className="absolute top-0 left-0 right-0 z-30 bg-amber-500 text-slate-950 font-bold px-6 py-2.5 flex items-center gap-3 shadow-lg overflow-hidden">
          <AlertCircle size={20} className="shrink-0 animate-pulse" />
          <div className="text-base tracking-wide uppercase font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
            {state.scrollingAlert}
          </div>
        </div>
      )}

      {/* Header com título da música / referência bíblica */}
      <div className="p-8 sm:p-12 z-10 flex items-center justify-between">
        {state.activeSongTitle && !state.blackout && !state.clearText ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className={`w-2 h-2 rounded-full ${isLight ? 'bg-amber-600' : 'bg-amber-400'}`} />
            <span className={`text-base sm:text-lg font-bold tracking-wider uppercase ${textColorClass}`}>
              {state.activeSongTitle}
            </span>
            {state.activeSongArtist && (
              <span className={`text-sm sm:text-base font-medium ${subTextColorClass}`}>
                • {state.activeSongArtist}
              </span>
            )}
          </motion.div>
        ) : <div />}
      </div>

      {/* Área central principal: Letra / Versículo */}
      <div className="flex-1 flex items-center justify-center px-8 sm:px-16 md:px-24 text-center z-10">
        <AnimatePresence mode="wait">
          {!state.blackout && !state.clearText && state.text ? (
            <motion.div
              key={state.text}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className={`max-w-6xl whitespace-pre-line font-bold tracking-tight ${textColorClass} ${
                state.textUppercase ? 'uppercase' : ''
              }`}
              style={{
                fontSize: `clamp(2.2rem, 5.2vw * ${state.fontSizeMultiplier || 1}, 5.5rem)`,
                lineHeight: state.lineHeightMultiplier || 1.3,
                textShadow: isLight ? 'none' : '0 2px 20px rgba(0,0,0,0.85)'
              }}
            >
              {state.text}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Footer com logo discreto */}
      <div className="p-6 sm:p-8 flex items-center justify-end z-10 opacity-30 hover:opacity-80 transition-opacity">
        <span className={`text-xs tracking-widest font-mono font-semibold uppercase ${subTextColorClass}`}>
          LiLouPro Projection
        </span>
      </div>
    </div>
  );
}

export default ProjectorDisplay;
