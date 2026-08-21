import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Tv, ChevronLeft, ChevronRight, Eye, EyeOff, Image as ImageIcon,
  Check, Copy, QrCode, Sparkles, RefreshCw, Volume2, Shield, Flame, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, onSnapshot, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

interface ProjectionRemoteViewProps {
  churchId?: string;
  onBackToApp?: () => void;
}

export function ProjectionRemoteView({ churchId: propChurchId, onBackToApp }: ProjectionRemoteViewProps) {
  const { memberData, churchData, user } = useAuth();
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const urlChurchId = urlParams?.get('churchId');
  const targetChurchId = propChurchId || urlChurchId || memberData?.churchId || 'semente';

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [quickAlertInput, setQuickAlertInput] = useState('');
  const [showQuickAlertModal, setShowQuickAlertModal] = useState(false);

  // Subscribe to real-time projection session in Firestore
  useEffect(() => {
    if (!targetChurchId) return;

    const sessionDocRef = doc(db, 'projection_sessions', targetChurchId);
    const unsub = onSnapshot(sessionDocRef, (snap) => {
      setLoading(false);
      if (snap.exists()) {
        setSession(snap.data());
      } else {
        setSession(null);
      }
    }, (err) => {
      console.warn("Error listening to projection session:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [targetChurchId]);

  const triggerFeedback = (msg: string) => {
    setActionFeedback(msg);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch (e) {}
    }
    setTimeout(() => {
      setActionFeedback(null);
    }, 1500);
  };

  const updateRemoteState = async (updates: Record<string, any>, feedbackMsg: string) => {
    if (!targetChurchId) return;
    try {
      const sessionDocRef = doc(db, 'projection_sessions', targetChurchId);
      await updateDoc(sessionDocRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        lastUpdatedBy: memberData?.name || user?.displayName || 'Celular Remoto'
      });
      triggerFeedback(feedbackMsg);
    } catch (e) {
      console.error("Erro ao atualizar controle remoto:", e);
    }
  };

  const handleSelectSlide = (idx: number) => {
    if (!session || !session.slides || idx < 0 || idx >= session.slides.length) return;
    const selectedSlide = session.slides[idx];
    const isImage = typeof selectedSlide === 'object' && selectedSlide !== null && selectedSlide.type === 'image';
    const textToShow = isImage ? '' : (typeof selectedSlide === 'string' ? selectedSlide : '');
    const slideImageUrl = isImage ? selectedSlide.imageUrl : null;

    updateRemoteState({
      activeSlideIdx: idx,
      text: textToShow,
      slideImageUrl: slideImageUrl,
      blackout: false,
      clearText: false,
      showLogo: false
    }, `Slide ${idx + 1}`);
  };

  const handleNext = () => {
    if (!session || !session.slides || session.slides.length === 0) return;
    const currentIdx = typeof session.activeSlideIdx === 'number' ? session.activeSlideIdx : -1;
    const nextIdx = currentIdx + 1;
    if (nextIdx < session.slides.length) {
      handleSelectSlide(nextIdx);
    }
  };

  const handlePrev = () => {
    if (!session || !session.slides || session.slides.length === 0) return;
    const currentIdx = typeof session.activeSlideIdx === 'number' ? session.activeSlideIdx : 0;
    const prevIdx = currentIdx - 1;
    if (prevIdx >= 0) {
      handleSelectSlide(prevIdx);
    }
  };

  const handleToggleBlackout = () => {
    if (!session) return;
    const nextVal = !session.blackout;
    updateRemoteState({
      blackout: nextVal
    }, nextVal ? 'Tela Escurecida (Blackout)' : 'Tela Restaurada');
  };

  const handleToggleClearText = () => {
    if (!session) return;
    const nextVal = !session.clearText;
    updateRemoteState({
      clearText: nextVal,
      showLogo: false
    }, nextVal ? 'Texto Ocultado (Fundo Limpo)' : 'Texto Visível');
  };

  const handleToggleShowLogo = () => {
    if (!session) return;
    const nextVal = !session.showLogo;
    updateRemoteState({
      showLogo: nextVal,
      clearText: false
    }, nextVal ? 'Logo em Destaque' : 'Logo Ocultado');
  };

  const handleSendQuickAlert = () => {
    const txt = quickAlertInput.trim();
    if (!txt) return;
    updateRemoteState({
      scrollingAlert: txt
    }, 'Alerta exibido no telão');
    setShowQuickAlertModal(false);
    setQuickAlertInput('');
  };

  const handleClearAlert = () => {
    updateRemoteState({
      scrollingAlert: null
    }, 'Alerta removido');
  };

  const slides: any[] = session?.slides || [];
  const activeIdx: number = typeof session?.activeSlideIdx === 'number' ? session.activeSlideIdx : -1;
  const isBlackout = !!session?.blackout;
  const isClearText = !!session?.clearText;
  const isShowLogo = !!session?.showLogo;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col antialiased select-none">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand shrink-0">
            <Smartphone size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-black uppercase tracking-wider text-slate-100 truncate">
                Controle Remoto
              </h1>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" /> Ao Vivo
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate">
              {churchData?.name || session?.churchName || 'LiLouPro Data Show'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-wider border border-slate-700 transition-colors"
            >
              Voltar ao App
            </button>
          )}
        </div>
      </header>

      {/* Action Feedback Toast */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-brand text-white text-xs font-black uppercase tracking-wider rounded-full shadow-2xl shadow-brand/40 flex items-center gap-2 pointer-events-none"
          >
            <Check size={14} className="stroke-[3]" />
            <span>{actionFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col max-w-md w-full mx-auto p-4 space-y-4 pb-28">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-3">
            <RefreshCw className="animate-spin text-brand" size={32} />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Conectando ao Telão...</p>
          </div>
        ) : !session ? (
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4 my-auto">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Tv size={28} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-100">Nenhuma Projeção Ativa</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Abra o menu <strong className="text-slate-200">"Projeção"</strong> no computador ou notebook e selecione uma música para começar a controlar os slides remotamente por aqui!
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Active Song Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand">
                  {session.activeSongArtist || 'Ministério de Louvor'}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {slides.length > 0 ? `Slide ${activeIdx >= 0 ? activeIdx + 1 : 0} de ${slides.length}` : 'Sem slides'}
                </span>
              </div>
              <h2 className="text-base font-black text-white tracking-tight truncate">
                {session.activeSongTitle || 'Música / Leitura'}
              </h2>
            </div>

            {/* Quick Master Controls (Holyrics Style) */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleToggleBlackout}
                className={`py-3.5 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-center border font-black uppercase text-[10px] tracking-wider active:scale-95 ${
                  isBlackout
                    ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-lg shadow-red-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className={`p-1.5 rounded-xl ${isBlackout ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {isBlackout ? <EyeOff size={16} /> : <Eye size={16} />}
                </div>
                <span>{isBlackout ? 'Blackout ON' : 'Blackout'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleClearText}
                className={`py-3.5 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-center border font-black uppercase text-[10px] tracking-wider active:scale-95 ${
                  isClearText
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className={`p-1.5 rounded-xl ${isClearText ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Shield size={16} />
                </div>
                <span>{isClearText ? 'Fundo Limpo' : 'Limpar Texto'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleShowLogo}
                className={`py-3.5 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-center border font-black uppercase text-[10px] tracking-wider active:scale-95 ${
                  isShowLogo
                    ? 'bg-brand/20 border-brand/50 text-brand shadow-lg shadow-brand/20'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className={`p-1.5 rounded-xl ${isShowLogo ? 'bg-brand text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Flame size={16} />
                </div>
                <span>{isShowLogo ? 'Logo ON' : 'Logo Telão'}</span>
              </button>
            </div>

            {/* Scrolling Alert Bar if Active */}
            {session.scrollingAlert && (
              <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-2 text-xs text-amber-300 font-bold">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">📢</span>
                  <p className="truncate"><strong className="uppercase">Alerta:</strong> {session.scrollingAlert}</p>
                </div>
                <button
                  type="button"
                  onClick={handleClearAlert}
                  className="p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 text-[10px] font-black uppercase px-2 shrink-0"
                >
                  Limpar
                </button>
              </div>
            )}

            {/* Slide List (Tap to Project) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Estrofes & Slides ({slides.length})
                </span>
                <span className="text-[10px] text-slate-500">Toque para projetar</span>
              </div>

              <div className="space-y-2">
                {slides.map((slide: any, idx: number) => {
                  const isCurrent = idx === activeIdx;
                  const isImage = typeof slide === 'object' && slide !== null && slide.type === 'image';
                  const slideText = typeof slide === 'string' ? slide : (slide?.title || 'Slide de Imagem');

                  return (
                    <motion.button
                      key={idx}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectSlide(idx)}
                      className={`w-full p-4 rounded-2xl text-left border transition-all relative overflow-hidden flex items-start gap-3 ${
                        isCurrent
                          ? 'bg-brand/20 border-brand text-white shadow-xl shadow-brand/10 ring-1 ring-brand'
                          : 'bg-slate-900/80 border-slate-800/80 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        isCurrent ? 'bg-brand text-white shadow-md' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        {isImage ? (
                          <div className="flex items-center gap-2">
                            <ImageIcon size={16} className="text-brand shrink-0" />
                            <span className="text-xs font-bold text-slate-200">{slide.title || 'Slide com Imagem'}</span>
                          </div>
                        ) : (
                          <p className={`text-xs font-medium leading-relaxed whitespace-pre-line ${
                            isCurrent ? 'text-white font-bold' : 'text-slate-300'
                          }`}>
                            {slideText}
                          </p>
                        )}
                      </div>

                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-brand text-white shrink-0 self-center animate-pulse">
                          Projetando
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Bottom Quick Slide Navigation (Holyrics Style) */}
      {session && slides.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 p-3 max-w-md mx-auto shadow-2xl">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={activeIdx <= 0}
              onClick={handlePrev}
              className="py-4 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-30 disabled:pointer-events-none text-white font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition-all shadow-lg active:scale-95"
            >
              <ChevronLeft size={20} className="stroke-[3]" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              disabled={activeIdx >= slides.length - 1}
              onClick={handleNext}
              className="py-4 px-4 rounded-2xl bg-brand hover:brightness-110 active:brightness-90 disabled:opacity-30 disabled:pointer-events-none text-white font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand/25 active:scale-95"
            >
              <span>Próximo</span>
              <ChevronRight size={20} className="stroke-[3]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
