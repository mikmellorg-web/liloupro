import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, Minimize2, Monitor } from 'lucide-react';
import { cleanLyricsForProjection } from '../services/chordService';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface ProjectorState {
  text: string;
  theme: string;
  fontSize: number;
  customBgUrl?: string;
  bgOpacity?: number;
  bgBlur?: number;
  bgBrightness?: number;
  bgContrast?: number;
  bgSaturation?: number;
  textAlign?: 'center' | 'left' | 'right';
  textPosition?: 'top' | 'center' | 'bottom';
  textColor?: string;
  textShadow?: boolean;
  slideImageUrl?: string | null;
  countdownUntil?: number | null;
  clearText?: boolean;
  showLogo?: boolean;
  churchLogoUrl?: string | null;
  churchName?: string;
  scrollingAlert?: string | null;
  blackout?: boolean;
  textUppercase?: boolean;
  fontFamily?: string;
  transitionType?: 'fade' | 'slide' | 'scale' | 'instant';
}

export function ProjectorDisplay() {
  const [state, setState] = useState<ProjectorState>(() => {
    // Initial fetch from localStorage for instant, non-flickering accuracy
    let storedState: any = {};
    try {
      const raw = localStorage.getItem('lilo-projection-state');
      if (raw) {
        storedState = JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Could not load lilo-projection-state:", e);
    }

    const theme = storedState.theme || localStorage.getItem('lilo-projection-theme') || 'black';
    const fontSize = storedState.fontSize || Number(localStorage.getItem('lilo-projection-font-size')) || 64;
    const customBgUrl = storedState.customBgUrl || localStorage.getItem('lilo-projection-custom-bg-url') || '';
    const bgOpacity = storedState.bgOpacity !== undefined 
      ? storedState.bgOpacity 
      : (localStorage.getItem('lilo-projection-bg-opacity') !== null ? Number(localStorage.getItem('lilo-projection-bg-opacity')) : 0.5);
    const bgBlur = storedState.bgBlur !== undefined 
      ? storedState.bgBlur 
      : (localStorage.getItem('lilo-projection-bg-blur') !== null ? Number(localStorage.getItem('lilo-projection-bg-blur')) : 2);
    
    const bgBrightness = storedState.bgBrightness !== undefined
      ? storedState.bgBrightness
      : (localStorage.getItem('lilo-projection-bg-brightness') !== null ? Number(localStorage.getItem('lilo-projection-bg-brightness')) : 40);
    const bgContrast = storedState.bgContrast !== undefined
      ? storedState.bgContrast
      : (localStorage.getItem('lilo-projection-bg-contrast') !== null ? Number(localStorage.getItem('lilo-projection-bg-contrast')) : 100);
    const bgSaturation = storedState.bgSaturation !== undefined
      ? storedState.bgSaturation
      : (localStorage.getItem('lilo-projection-bg-saturation') !== null ? Number(localStorage.getItem('lilo-projection-bg-saturation')) : 100);

    const textAlign = storedState.textAlign || localStorage.getItem('lilo-projection-text-align') || 'center';
    const textPosition = storedState.textPosition || localStorage.getItem('lilo-projection-text-position') || 'center';
    const textColor = storedState.textColor || localStorage.getItem('lilo-projection-text-color') || '#ffffff';
    
    let textShadow = true;
    if (storedState.textShadow !== undefined) {
      textShadow = storedState.textShadow;
    } else {
      const rawShadow = localStorage.getItem('lilo-projection-text-shadow');
      if (rawShadow !== null) {
        textShadow = rawShadow === 'true';
      }
    }

    const textUppercase = storedState.textUppercase !== undefined
      ? storedState.textUppercase
      : localStorage.getItem('lilo-projection-text-uppercase') === 'true';

    const fontFamily = storedState.fontFamily || localStorage.getItem('lilo-projection-font-family') || 'Inter';
    const transitionType = storedState.transitionType || localStorage.getItem('lilo-projection-transition-type') || 'slide';

    return {
      text: storedState.text || '',
      theme,
      fontSize,
      customBgUrl,
      bgOpacity,
      bgBlur,
      bgBrightness,
      bgContrast,
      bgSaturation,
      textAlign,
      textPosition,
      textColor,
      textShadow,
      slideImageUrl: storedState.slideImageUrl || null,
      countdownUntil: storedState.countdownUntil || null,
      clearText: storedState.clearText || false,
      showLogo: storedState.showLogo || false,
      churchLogoUrl: storedState.churchLogoUrl || null,
      churchName: storedState.churchName || 'LiLouPro',
      scrollingAlert: storedState.scrollingAlert || null,
      blackout: storedState.blackout || false,
      textUppercase,
      fontFamily,
      transitionType,
    };
  });

  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [showPingNotice, setShowPingNotice] = useState(false);
  const lastPingRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (!state.countdownUntil) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = state.countdownUntil! - now;
      if (diff <= 0) {
        setTimeLeft('00:00');
        return false;
      }
      const totalSecs = Math.floor(diff / 1000);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      return true;
    };

    const isRunning = updateTimer();
    if (!isRunning) return;

    const interval = setInterval(() => {
      const active = updateTimer();
      if (!active) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.countdownUntil]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Hide controls after 3 seconds of mouse inactivity
  useEffect(() => {
    let timeoutId: number;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    handleMouseMove(); // Initial trigger

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, []);

  // Double click anywhere to toggle fullscreen
  useEffect(() => {
    const handleDoubleClick = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn("Erro ao entrar em tela cheia:", err);
        });
      } else {
        document.exitFullscreen().catch(err => {
          console.warn("Erro ao sair da tela cheia:", err);
        });
      }
    };

    document.addEventListener('dblclick', handleDoubleClick);
    return () => {
      document.removeEventListener('dblclick', handleDoubleClick);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn("Erro ao entrar em tela cheia:", err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.warn("Erro ao sair da tela cheia:", err);
      });
    }
  };

  useEffect(() => {
    // 1. Listen via localStorage for cross-tab updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lilo-projection-state' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setState(prev => ({ ...prev, ...parsed }));
        } catch (err) {
          console.error('Error parsing stored projection state:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Initial load from storage
    const initial = localStorage.getItem('lilo-projection-state');
    if (initial) {
      try {
        const parsed = JSON.parse(initial);
        setState(prev => ({ ...prev, ...parsed }));
      } catch (err) {
        // Safe to ignore
      }
    }

    // 2. Listen via BroadcastChannel for real-time instant syncing
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('lilo-projection-sync');
      channel.onmessage = (event) => {
        if (event.data) {
          setState(prev => ({ ...prev, ...event.data }));
          if (event.data.pingTimestamp && event.data.pingTimestamp !== lastPingRef.current) {
            lastPingRef.current = event.data.pingTimestamp;
            setShowPingNotice(true);
            setTimeout(() => setShowPingNotice(false), 3000);
          }
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported or limited in this context:', e);
    }

    // 3. Listen via Firestore for cross-device / mobile remote control
    let unsubFirestore: (() => void) | null = null;
    let heartbeatInterval: any = null;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const churchId = searchParams.get('church') || localStorage.getItem('lilo_active_church_id') || 'semente';
      const sessionId = searchParams.get('session') || churchId;

      const docRef = doc(db, 'projection_sessions', sessionId);
      
      // Heartbeat updater
      const sendHeartbeat = () => {
        setDoc(docRef, {
          projectorOnlineAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      };
      sendHeartbeat();
      heartbeatInterval = setInterval(sendHeartbeat, 15000);

      unsubFirestore = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setState(prev => ({ ...prev, ...data }));
          if (data.pingTimestamp && data.pingTimestamp !== lastPingRef.current) {
            lastPingRef.current = data.pingTimestamp;
            setShowPingNotice(true);
            setTimeout(() => setShowPingNotice(false), 3000);
          }
        }
      }, (err) => {
        console.warn("ProjectorDisplay Firestore sync notice:", err);
      });
    } catch (err) {
      console.warn("Error setting up Firestore listener in ProjectorDisplay:", err);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (channel) {
        channel.close();
      }
      if (unsubFirestore) {
        unsubFirestore();
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, []);

  // Theme styles background mappings
  const getBackgroundClass = () => {
    switch (state.theme) {
      case 'white':
        return 'bg-white';
      case 'dark-blue':
        return 'bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950';
      case 'burgundy':
        return 'bg-gradient-to-b from-stone-950 via-rose-950 to-purple-950';
      case 'charcoal':
        return 'bg-gradient-to-b from-zinc-900 via-stone-900 to-neutral-950';
      case 'aurora':
        return 'bg-gradient-to-tr from-green-950 via-slate-950 via-teal-950 to-purple-950';
      case 'sunset':
        return 'bg-gradient-to-b from-purple-950 via-orange-950/70 to-slate-950';
      case 'forest':
        return 'bg-gradient-to-tr from-emerald-950 via-teal-950 to-stone-950';
      case 'custom-image':
      case 'custom-video':
        return 'bg-neutral-950';
      case 'black':
      default:
        return 'bg-black';
    }
  };

  const getVerticalAlignClass = () => {
    switch (state.textPosition) {
      case 'top':
        return 'justify-start pt-[10vh] pb-8';
      case 'bottom':
        return 'justify-end pb-[12vh] pt-8';
      case 'center':
      default:
        return 'justify-center py-8';
    }
  };

  const getHorizontalAlignClass = () => {
    switch (state.textAlign) {
      case 'left':
        return 'items-start text-left';
      case 'right':
        return 'items-end text-right';
      case 'center':
      default:
        return 'items-center text-center';
    }
  };

  const getShadowStyle = () => {
    const isDarkText = state.textColor && (
      state.textColor.toLowerCase() === '#000000' || 
      state.textColor.toLowerCase() === '#000' || 
      state.theme === 'white'
    );

    if (isDarkText) {
      return {
        textShadow: '0 0 10px rgba(255, 255, 255, 0.95), 0 0 20px rgba(255, 255, 255, 0.85), 2px 2px 0px rgba(255, 255, 255, 0.95), -2px -2px 0px rgba(255, 255, 255, 0.95)',
        WebkitTextStroke: '1px rgba(255, 255, 255, 0.75)'
      };
    }

    if (state.textShadow !== false || state.theme === 'custom-image' || state.theme === 'custom-video' || state.theme !== 'white') {
      return {
        textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0px 4px 18px rgba(0, 0, 0, 0.98), 0px 0px 25px rgba(0, 0, 0, 0.95)',
        WebkitTextStroke: '1.2px rgba(0, 0, 0, 0.85)'
      };
    }
    return {};
  };

  const getFontStyle = () => {
    const font = state.fontFamily || 'Inter';
    let family = '"Inter", sans-serif';
    if (font === 'Montserrat') {
      family = '"Montserrat", sans-serif';
    } else if (font === 'Space Grotesk') {
      family = '"Space Grotesk", sans-serif';
    } else if (font === 'Playfair Display') {
      family = '"Playfair Display", serif';
    } else if (font === 'Arial Black') {
      family = '"Arial Black", "Arial Bold", sans-serif';
    }
    return { fontFamily: family };
  };

  const getTransitionProps = () => {
    const type = state.transitionType || 'slide';
    switch (type) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.3, ease: 'easeInOut' as const }
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.96 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.96 },
          transition: { duration: 0.25, ease: 'easeOut' as const }
        };
      case 'instant':
        return {
          initial: { opacity: 1 },
          animate: { opacity: 1 },
          exit: { opacity: 1 },
          transition: { duration: 0 }
        };
      case 'slide':
      default:
        return {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
          transition: { duration: 0.35, ease: 'easeOut' as const }
        };
    }
  };

  const formatText = (txt: string) => {
    if (!txt) return '';
    return state.textUppercase ? txt.toUpperCase() : txt;
  };

  // Convert raw lines with safety check and strip HTML formatting tags & dynamics
  const rawCleanText = cleanLyricsForProjection(state.text || '');
  const lines = rawCleanText
    ? rawCleanText.split('\n').filter(line => line.trim() !== '')
    : [];

  if (state.blackout) {
    return (
      <div 
        className="projector-display fixed inset-0 bg-black select-none flex flex-col items-center justify-center p-8 z-50 transition-all duration-1000"
      >
        {/* Dynamic Hover Control Overlay for Fullscreen Setup */}
        <div 
          className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-950/90 backdrop-blur-md border border-white/10 rounded-full px-5 py-2.5 flex items-center gap-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 ${
            showControls ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider uppercase bg-red-500/15 text-red-400 border border-red-500/20 px-3 py-1 rounded-full whitespace-nowrap animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span>Blackout Ativo</span>
          </div>
          
          <p className="text-[10px] text-zinc-300 font-sans hidden md:block whitespace-nowrap">
            A projeção está encoberta (blackout). Dê <strong>dois cliques</strong> ou clique ao lado.
          </p>

          <button
            onClick={toggleFullscreen}
            className="bg-emerald-600 hover:bg-emerald-500 hover:scale-105 active:scale-95 text-white rounded-full px-4 py-1.5 text-[10.5px] font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            {isFullscreen ? (
              <>
                <Minimize2 size={12} strokeWidth={3} />
                <span>Sair de Tela Cheia</span>
              </>
            ) : (
              <>
                <Maximize2 size={12} strokeWidth={3} />
                <span>Ativar Tela Cheia</span>
              </>
            )}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          className="flex flex-col items-center justify-center text-center select-none"
        >
          <div className="w-8 h-8 rounded-lg border-2 border-dashed border-red-500 flex items-center justify-center mb-3 animate-pulse">
            <div className="w-3.5 h-3.5 bg-red-500 rounded-sm" />
          </div>
          <p className="text-xs font-mono font-black text-red-500/80 tracking-widest uppercase">
            TELA ENCOBERTA • BLACKOUT ATIVO
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className={`projector-display fixed inset-0 select-none flex flex-col items-center text-center p-8 transition-all duration-1000 overflow-hidden ${getBackgroundClass()} ${getVerticalAlignClass()}`}
    >
      {/* Dynamic Hover Control Overlay for Fullscreen Setup */}
      <div 
        className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-950/90 backdrop-blur-md border border-white/10 rounded-full px-5 py-2.5 flex items-center gap-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full whitespace-nowrap animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Sincronizado</span>
        </div>
        
        <p className="text-[10px] text-zinc-300 font-sans hidden md:block whitespace-nowrap">
          Arraste esta janela para o projetor/TV e dê <strong>dois cliques</strong> ou clique ao lado.
        </p>

        <button
          onClick={toggleFullscreen}
          className="bg-emerald-600 hover:bg-emerald-500 hover:scale-105 active:scale-95 text-white rounded-full px-4 py-1.5 text-[10.5px] font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
        >
          {isFullscreen ? (
            <>
              <Minimize2 size={12} strokeWidth={3} />
              <span>Sair de Tela Cheia</span>
            </>
          ) : (
            <>
              <Maximize2 size={12} strokeWidth={3} />
              <span>Ativar Tela Cheia</span>
            </>
          )}
        </button>
      </div>

      {/* Background Image Layer */}
      {state.theme === 'custom-image' && state.customBgUrl && (
        <img 
          src={state.customBgUrl} 
          alt="Worship Background"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-1000 animate-slow-motion"
          style={{ 
            opacity: state.bgOpacity ?? 0.4, 
            filter: `blur(${state.bgBlur ?? 2}px) brightness(${state.bgBrightness ?? 40}%) contrast(${state.bgContrast ?? 100}%) saturate(${state.bgSaturation ?? 100}%)` 
          }}
        />
      )}

      {/* Background Video Layer */}
      {state.theme === 'custom-video' && state.customBgUrl && (
        <video 
          key={state.customBgUrl}
          src={state.customBgUrl} 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-1000"
          style={{ 
            opacity: state.bgOpacity ?? 0.4, 
            filter: `blur(${state.bgBlur ?? 0}px) brightness(${state.bgBrightness ?? 40}%) contrast(${state.bgContrast ?? 100}%) saturate(${state.bgSaturation ?? 100}%)` 
          }}
        />
      )}

      {/* Visual background atmospheric lights if custom themes used */}
      {state.theme !== 'black' && state.theme !== 'white' && state.theme !== 'custom-image' && state.theme !== 'custom-video' && (
        <div className="absolute inset-x-0 top-0 h-96 bg-brand/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      )}
      
      <div className={`w-full max-w-[94vw] lg:max-w-[90vw] px-4 md:px-14 flex flex-col z-10 ${getHorizontalAlignClass()}`}>
        <AnimatePresence mode="wait">
          {state.showLogo ? (
            <motion.div
              key="church-logo-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center p-8 select-none"
            >
              {state.churchLogoUrl ? (
                <div className="w-40 h-40 md:w-56 md:h-56 rounded-3xl overflow-hidden bg-white/5 border border-white/10 p-3 shadow-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                  <img 
                    src={state.churchLogoUrl} 
                    alt="Logo da Igreja" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className={`w-32 h-32 md:w-44 md:h-44 rounded-full border-4 ${state.theme === 'white' ? 'border-black/20' : 'border-white/20'} flex items-center justify-center mb-6 shadow-2xl backdrop-blur-md`}>
                  <span className={`${state.theme === 'white' ? 'text-black' : 'text-white'} font-serif font-black text-xl md:text-2xl tracking-widest`}>LiLouPro</span>
                </div>
              )}
              <h1 
                style={{ 
                  fontSize: `${state.fontSize * 1.1}px`, 
                  color: state.textColor || (state.theme === 'white' ? '#000000' : '#ffffff'),
                  ...getShadowStyle(),
                  ...getFontStyle()
                }}
                className="font-black tracking-tight text-center max-w-4xl"
              >
                {state.churchName || 'Ministério de Louvor'}
              </h1>
              <p 
                style={{
                  color: state.textColor ? `${state.textColor}a0` : (state.theme === 'white' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'),
                  ...getShadowStyle()
                }}
                className="text-xs md:text-sm font-black uppercase tracking-widest mt-2 font-mono"
              >
                Culto & Adoração
              </p>
              {timeLeft && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="font-mono font-black tracking-widest mt-6 text-emerald-400 animate-pulse"
                  style={{ 
                    fontSize: `${state.fontSize * 1.1}px`, 
                    textShadow: '0 0 20px rgba(52, 211, 153, 0.45), 2px 2px 8px rgba(0, 0, 0, 0.9)',
                  }}
                >
                  {timeLeft}
                </motion.div>
              )}
            </motion.div>
          ) : state.clearText ? (
            <motion.div
              key="clear-text-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-[50vh] flex flex-col items-center justify-center"
            >
              {timeLeft && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="font-mono font-black tracking-widest text-emerald-400 animate-pulse"
                  style={{ 
                    fontSize: `${state.fontSize * 1.5}px`, 
                    textShadow: '0 0 25px rgba(52, 211, 153, 0.55), 3px 3px 10px rgba(0, 0, 0, 0.95)',
                  }}
                >
                  {timeLeft}
                </motion.div>
              )}
            </motion.div>
          ) : state.slideImageUrl ? (
            <motion.div
              key={state.slideImageUrl}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center w-full h-[80vh] overflow-hidden relative"
            >
              <img 
                src={state.slideImageUrl} 
                alt="Offertory Slide"
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
              />
              {timeLeft && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute bottom-4 right-4 font-mono font-black tracking-widest text-emerald-400 bg-black/70 border border-emerald-500/20 rounded-xl px-4 py-2 animate-pulse shadow-lg"
                  style={{ 
                    fontSize: `${state.fontSize * 0.8}px`, 
                    textShadow: '0 0 15px rgba(52, 211, 153, 0.5)',
                  }}
                >
                  {timeLeft}
                </motion.div>
              )}
            </motion.div>
          ) : (lines.length > 0 || timeLeft) ? (
            <motion.div
              key={state.text + '-' + (timeLeft ? 'timer' : 'notimer')} // Re-animate when text or timer changes
              {...getTransitionProps()}
              className={`flex flex-col gap-4 sm:gap-6 w-full ${getHorizontalAlignClass()}`}
            >
              {lines.map((line, idx) => (
                <p
                  key={idx}
                  style={{ 
                    fontSize: `${state.fontSize}px`, 
                    lineHeight: 1.25, 
                    color: state.textColor || (state.theme === 'white' ? '#000000' : '#ffffff'),
                    ...getShadowStyle(),
                    ...getFontStyle()
                  }}
                  className="font-bold tracking-wide px-2 select-text"
                >
                  {formatText(line)}
                </p>
              ))}

              {timeLeft && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="font-mono font-black tracking-widest mt-4 md:mt-8 text-emerald-400"
                  style={{ 
                    fontSize: `${state.fontSize * 1.5}px`, 
                    textShadow: '0 0 25px rgba(52, 211, 153, 0.55), 3px 3px 10px rgba(0, 0, 0, 0.95)',
                  }}
                >
                  {timeLeft}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="blank"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.25 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-4"
            >
              {/* Elegant church logo outline or empty state indicator */}
              <div className={`w-16 h-16 rounded-full border ${state.theme === 'white' ? 'border-black/20' : 'border-white/20'} flex items-center justify-center mb-4`}>
                <span className={`${state.theme === 'white' ? 'text-black' : 'text-white'} font-serif font-black text-xs tracking-wider`}>LiLouPro</span>
              </div>
              <p className={`text-xs font-mono font-black ${state.theme === 'white' ? 'text-black/60' : 'text-white/60'} tracking-widest uppercase`}>
                Projetor Pronto • Aguardando Verso
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggestion 5: Scrolling Alert Marquee */}
      {state.scrollingAlert && (
        <div className="absolute bottom-12 inset-x-0 h-14 bg-red-600 border-y border-red-500 shadow-2xl z-20 backdrop-blur-md flex items-center overflow-hidden">
          <style>{`
            @keyframes marquee-scroll-effect {
              0% { transform: translate3d(0, 0, 0); }
              100% { transform: translate3d(-50%, 0, 0); }
            }
            .animate-marquee-scroll-effect {
              display: inline-block;
              white-space: nowrap;
              animation: marquee-scroll-effect 16s linear infinite;
            }
          `}</style>
          
          {/* Urgency Icon Prefix */}
          <div className="bg-red-700 px-5 h-full flex items-center justify-center font-black uppercase text-[10px] tracking-widest gap-2 border-r border-red-500/30 z-10 shadow-lg shrink-0 text-white">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>AVISO URGENTE 📢</span>
          </div>
          
          <div className="flex-1 overflow-hidden relative flex items-center text-white">
            <div className="animate-marquee-scroll-effect font-bold text-lg md:text-xl tracking-wide font-sans select-none">
              <span>{state.scrollingAlert} &nbsp;&nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;&nbsp; {state.scrollingAlert} &nbsp;&nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;&nbsp; </span>
              <span>{state.scrollingAlert} &nbsp;&nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;&nbsp; {state.scrollingAlert} &nbsp;&nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;&nbsp; </span>
            </div>
          </div>
        </div>
      )}

      {/* Ping Sync Confirmation Toast */}
      <AnimatePresence>
        {showPingNotice && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-6 right-6 z-50 bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 rounded-full px-4 py-2 flex items-center gap-2 shadow-2xl backdrop-blur-md text-xs font-mono font-bold"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>📱 Controle Remoto Conectado</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating small technical status for setup indicator, hides after some hover-out */}
      <div className={`absolute bottom-5 right-5 pointer-events-none opacity-30 hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[9px] font-mono font-black uppercase ${state.theme === 'white' ? 'text-black/60' : 'text-white/60'} tracking-widest z-10`}>
        <span>LiLouPro.Projection</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
      </div>
    </div>
  );
}
