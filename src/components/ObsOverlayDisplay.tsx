import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cleanLyricsForProjection } from '../services/chordService';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Music, BookOpen, AlertCircle } from 'lucide-react';

interface ObsState {
  text: string;
  theme?: string;
  activeSongTitle?: string | null;
  activeSongArtist?: string | null;
  clearText?: boolean;
  blackout?: boolean;
  scrollingAlert?: string | null;
  textUppercase?: boolean;
  fontFamily?: string;
}

export function ObsOverlayDisplay() {
  const searchParams = new URLSearchParams(window.location.search);
  const churchId = searchParams.get('church') || localStorage.getItem('lilo_active_church_id') || 'semente';
  const sessionId = searchParams.get('session') || churchId;

  // Parâmetros opcionais de customização para o OBS
  const overlayStyle = searchParams.get('style') || 'bar'; // 'bar' (tarja) ou 'clean' (só texto)
  const position = searchParams.get('pos') || 'bottom'; // 'bottom' ou 'center'
  const isDemo = searchParams.get('demo') === 'true';

  const [state, setState] = useState<ObsState>(() => {
    let storedState: any = {};
    try {
      const raw = localStorage.getItem('lilo-projection-state');
      if (raw) {
        storedState = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Erro ao carregar estado local de projeção:', e);
    }

    return {
      text: storedState.text || (isDemo ? 'Porque Deus amou o mundo de tal maneira\nQue deu o Seu Filho unigênito' : ''),
      theme: storedState.theme || 'black',
      activeSongTitle: storedState.activeSongTitle || (isDemo ? 'Porque Ele Vive' : null),
      activeSongArtist: storedState.activeSongArtist || (isDemo ? 'Harpa Cristã' : null),
      clearText: storedState.clearText || false,
      blackout: storedState.blackout || false,
      scrollingAlert: storedState.scrollingAlert || null,
      textUppercase: storedState.textUppercase !== undefined ? storedState.textUppercase : false,
      fontFamily: storedState.fontFamily || 'Inter'
    };
  });

  // Listener para sincronização instantânea
  useEffect(() => {
    // Garante que o body fique 100% transparente para captura correta no OBS Studio
    document.body.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = 'transparent';

    // 1. Storage Event (mesmo navegador)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lilo-projection-state' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setState(prev => ({ ...prev, ...parsed }));
        } catch (err) {
          console.error('Erro no storage:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 2. BroadcastChannel (0 ms latência se o OBS estiver no mesmo computador)
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('lilo-projection-sync');
      channel.onmessage = (event) => {
        if (event.data) {
          setState(prev => ({ ...prev, ...event.data }));
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel não disponível:', e);
    }

    // 3. Firestore (sincronização via nuvem para quando o OBS estiver em outro PC)
    let unsubFirestore: (() => void) | null = null;
    try {
      const docRef = doc(db, 'projection_sessions', sessionId);
      unsubFirestore = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setState(prev => ({ ...prev, ...data }));
        }
      });
    } catch (err) {
      console.warn('Erro ao escutar Firestore no OBS Overlay:', err);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (channel) channel.close();
      if (unsubFirestore) unsubFirestore();
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
    };
  }, [sessionId]);

  // Se blackout estiver ativado ou clearText estiver ativo, não renderiza texto na tela
  const isHidden = state.blackout || state.clearText || !state.text;

  // Tratamento e limpeza do texto
  const rawCleanText = cleanLyricsForProjection(state.text || '');
  const lines = rawCleanText
    ? rawCleanText.split('\n').filter(line => line.trim() !== '')
    : [];

  const displayText = lines.map(line => state.textUppercase ? line.toUpperCase() : line);

  // Detecta se é leitura bíblica (ex: "João 3:16" ou "[Bíblia]")
  const isBible = displayText.some(l => /\b(Gênesis|Êxodo|Levítico|Salmos|Provérbios|Mateus|Marcos|Lucas|João|Atos|Romanos|Coríntios|Apocalipse)\b/i.test(l) || /^\d?\s?[a-záéíóúãõç]+\s\d+:\d+/i.test(l));

  return (
    <div 
      className="fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none select-none flex flex-col justify-end p-8 sm:p-12 z-50 bg-transparent font-sans"
      style={{
        justifyContent: position === 'center' ? 'center' : 'flex-end'
      }}
    >
      {/* Alerta de urgência caso enviado pela mesa */}
      <AnimatePresence>
        {state.scrollingAlert && !state.blackout && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-amber-500/95 text-zinc-950 font-black px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-sm uppercase tracking-wide border border-amber-300 backdrop-blur-md"
          >
            <AlertCircle size={18} className="animate-bounce" />
            <span>{state.scrollingAlert}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Caixa do Lower Thirds */}
      <AnimatePresence mode="wait">
        {!isHidden && displayText.length > 0 && (
          <motion.div
            key={displayText.join('-')}
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.99 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-5xl mx-auto flex flex-col items-center text-center"
          >
            {/* Badge de Título da Música ou Bíblia */}
            {(state.activeSongTitle || isBible) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2.5 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/90 text-[13px] font-bold shadow-lg"
              >
                {isBible ? (
                  <>
                    <BookOpen size={14} className="text-amber-400" />
                    <span className="text-amber-300 font-extrabold uppercase tracking-wider text-[11px]">Leitura Bíblica</span>
                  </>
                ) : (
                  <>
                    <Music size={13} className="text-blue-400" />
                    <span>{state.activeSongTitle}</span>
                    {state.activeSongArtist && (
                      <span className="text-white/60 font-medium text-xs">• {state.activeSongArtist}</span>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* Container das Linhas de Letra */}
            <div
              className={`w-full py-4 px-8 rounded-2xl transition-all ${
                overlayStyle === 'bar'
                  ? 'bg-gradient-to-t from-black/85 via-black/75 to-black/65 backdrop-blur-lg border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]'
                  : 'bg-transparent'
              }`}
            >
              <div className="space-y-1.5 sm:space-y-2">
                {displayText.map((line, idx) => (
                  <p
                    key={idx}
                    className="text-white font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-[40px] leading-tight tracking-tight text-center"
                    style={{
                      textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 4px 14px rgba(0,0,0,0.85), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                      WebkitTextStroke: overlayStyle === 'clean' ? '1.2px rgba(0,0,0,0.85)' : 'none'
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
