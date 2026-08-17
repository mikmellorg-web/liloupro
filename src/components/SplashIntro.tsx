import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BookOpen, Tv } from 'lucide-react';
import { Music2 } from './MusicIcon';

interface SplashIntroProps {
  onComplete: () => void;
}

export function SplashIntro({ onComplete }: SplashIntroProps) {
  const [step, setStep] = useState(1);

  const onCompleteRef = React.useRef(onComplete);
  
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Stage-by-stage progression for precise timing, starting directly at step 1 (LI pulsing)
    const timers: { delay: number; nextStep: number }[] = [
      { delay: 500, nextStep: 2 },    // "turgia" completes "LIturgia" (perfectly uniform 500ms rhythm)
      { delay: 500, nextStep: 3 },    // LOU starts pulsing
      { delay: 500, nextStep: 4 },    // "vor" completes "LOUvor"
      { delay: 500, nextStep: 5 },    // PRO starts pulsing
      { delay: 500, nextStep: 6 },    // "jeção" completes "PROjeção"
      { delay: 800, nextStep: 7 },    // Transition into the unified "LILOUPRO" brand explosion
      { delay: 4500, nextStep: 8 },   // Complete splash screen and open the app
    ];

    let currentTimeout: NodeJS.Timeout;

    const runStep = (index: number) => {
      if (index >= timers.length) {
        onCompleteRef.current();
        return;
      }

      currentTimeout = setTimeout(() => {
        setStep(timers[index].nextStep);
        runStep(index + 1);
      }, timers[index].delay);
    };

    runStep(0);

    return () => {
      clearTimeout(currentTimeout);
    };
  }, []);

  // Handle skip for direct app access
  const handleSkip = () => {
    onCompleteRef.current();
  };

  return (
    <div className="fixed inset-0 bg-[#070b13] flex flex-col items-center justify-center overflow-hidden z-[9999] select-none font-sans">
      {/* Background ambient lighting/glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/10 rounded-full filter blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full filter blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-lg px-6 flex flex-col justify-center min-h-[360px] relative">
        <AnimatePresence mode="wait">
          {step < 7 ? (
            <motion.div 
              key="words-stack"
              className="flex flex-col space-y-8 relative w-full"
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              {/* Line 1: LIturgia (Left-aligned) */}
              <div className="flex items-center text-left self-start pl-4 sm:pl-16 gap-3 sm:gap-4 h-16 sm:h-20">
                <div className="flex items-center">
                  {step >= 1 && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ 
                        opacity: 1, 
                        scale: step === 1 ? [0.6, 1.15, 1, 1.05, 1] : 1,
                      }}
                      transition={{ 
                        duration: step === 1 ? 0.38 : 0.25,
                        ease: "easeInOut",
                      }}
                      className="text-4xl sm:text-5xl md:text-6xl font-black text-brand tracking-wide font-sans drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                    >
                      LI
                    </motion.span>
                  )}
                  
                  {step >= 2 && (
                    <motion.span
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 0.85, x: 0 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="text-4xl sm:text-5xl md:text-6xl font-black text-white/90 tracking-wide font-sans pl-1"
                    >
                      turgia
                    </motion.span>
                  )}
                </div>

                {step >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0, rotate: -20 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 250, damping: 15, delay: 0.1 }}
                    className="text-brand p-2 bg-brand/10 rounded-xl border border-brand/20 shadow-lg shadow-brand/10 shrink-0 flex items-center justify-center"
                  >
                    <BookOpen size={24} className="sm:w-8 sm:h-8" />
                  </motion.div>
                )}
              </div>

              {/* Line 2: LOUvor (Staggered to center but left-anchored to prevent jump) */}
              <div className="flex items-center text-left self-start pl-16 sm:pl-36 gap-3 sm:gap-4 h-16 sm:h-20">
                <div className="flex items-center">
                  {step >= 3 && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ 
                        opacity: 1, 
                        scale: step === 3 ? [0.6, 1.15, 1, 1.05, 1] : 1,
                      }}
                      transition={{ 
                        duration: step === 3 ? 0.38 : 0.25,
                        ease: "easeInOut",
                      }}
                      className="text-4xl sm:text-5xl md:text-6xl font-black text-amber-400 tracking-wide font-sans drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                    >
                      LOU
                    </motion.span>
                  )}
                  
                  {step >= 4 && (
                    <motion.span
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 0.85, x: 0 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="text-4xl sm:text-5xl md:text-6xl font-black text-white/90 tracking-wide font-sans pl-1"
                    >
                      vor
                    </motion.span>
                  )}
                </div>

                {step >= 4 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0, rotate: 20 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 250, damping: 15, delay: 0.1 }}
                    className="text-amber-400 p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-lg shadow-amber-500/10 shrink-0 flex items-center justify-center relative"
                  >
                    <Music2 size={24} className="sm:w-8 sm:h-8" />
                    {/* Animated floating musical eighth notes representing praise/music */}
                    <motion.div
                      initial={{ y: 0, x: 0, opacity: 0, scale: 0.4, rotate: -15 }}
                      animate={{ y: [-10, -25], x: [-3, 3], opacity: [0, 1, 0], scale: [0.5, 0.9, 0.5], rotate: [-15, 10] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
                      className="absolute -top-3 left-0.5 text-amber-300"
                    >
                      <Music2 size={11} />
                    </motion.div>
                    <motion.div
                      initial={{ y: 0, x: 0, opacity: 0, scale: 0.4, rotate: 15 }}
                      animate={{ y: [-6, -20], x: [3, -3], opacity: [0, 1, 0], scale: [0.4, 0.8, 0.4], rotate: [15, -10] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 1.1 }}
                      className="absolute -top-2 right-0.5 text-amber-200"
                    >
                      <Music2 size={9} />
                    </motion.div>
                  </motion.div>
                )}
              </div>

              {/* Line 3: PROjeção (Staggered to right but left-anchored to prevent jump) */}
              <div className="flex items-center text-left self-start pl-28 sm:pl-56 gap-3 sm:gap-4 h-16 sm:h-20">
                <div className="flex items-center">
                  {step >= 5 && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ 
                        opacity: 1, 
                        scale: step === 5 ? [0.6, 1.15, 1, 1.05, 1] : 1,
                      }}
                      transition={{ 
                        duration: step === 5 ? 0.38 : 0.25,
                        ease: "easeInOut",
                      }}
                      className="text-4xl sm:text-5xl md:text-6xl font-black text-emerald-400 tracking-wide font-sans drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]"
                    >
                      PRO
                    </motion.span>
                  )}
                  
                  {step >= 6 && (
                    <motion.span
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 0.85, x: 0 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="text-4xl sm:text-5xl md:text-6xl font-black text-white/90 tracking-wide font-sans pl-1"
                    >
                      jeção
                    </motion.span>
                  )}
                </div>

                {step >= 6 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0, rotate: -20 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 250, damping: 15, delay: 0.1 }}
                    className="text-emerald-400 p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-lg shadow-emerald-500/10 shrink-0 flex items-center justify-center relative"
                  >
                    <Tv size={24} className="sm:w-8 sm:h-8" />
                    {/* Glowing projection beam simulation */}
                    <span className="absolute inset-0 rounded-xl bg-emerald-400/20 filter blur-[8px] animate-pulse pointer-events-none" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="brand-reveal"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center justify-center text-center space-y-4"
            >
              {/* Dynamic brand logo highlight with sparkles */}
              <div className="relative">
                <motion.div 
                  initial={{ rotate: -10, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="absolute -top-8 -right-8 text-brand"
                >
                  <Sparkles size={28} className="animate-pulse" />
                </motion.div>

                {/* Spell-out LILOUPRO */}
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight flex items-center justify-center select-none">
                  <span className="text-brand drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]">LI</span>
                  <span className="text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]">LOU</span>
                  <span className="text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.6)]">PRO</span>
                </h1>
              </div>

              {/* Tagline showing the synthesis of the name */}
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-xs sm:text-sm text-text-muted font-bold tracking-[0.2em] uppercase mb-1"
              >
                Liturgia • Louvor • Projeção
              </motion.p>

              {/* Custom user impact subtitles */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="flex flex-col items-center justify-center space-y-2 mt-2 px-4"
              >
                <p className="text-base sm:text-lg md:text-xl font-medium text-white/95 max-w-sm sm:max-w-xl mx-auto leading-relaxed text-center">
                  Planeje e organize com excelência!
                </p>
                <p className="text-sm sm:text-base md:text-lg font-black text-amber-300 tracking-wide text-center">
                  Cada culto começa aqui.
                </p>
              </motion.div>

              {/* Progress Bar Loader */}
              <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden mt-6">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 4.0, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-brand via-amber-500 to-emerald-400 rounded-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Direct skip button at the bottom for smooth power-user bypass */}
      <button
        onClick={handleSkip}
        className="absolute bottom-8 text-[10px] font-black uppercase tracking-[0.25em] text-text-muted hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-2 rounded-full transition-all active:scale-95 cursor-pointer"
      >
        Pular Intro
      </button>
    </div>
  );
}
