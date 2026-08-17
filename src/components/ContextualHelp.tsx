import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, ChevronUp, X, Sparkles, CheckCircle2, Info } from 'lucide-react';

interface ContextualHelpProps {
  id: string; // unique identifier to persist collapsed state in localStorage
  title: string;
  description: string;
  steps: string[];
  specialSteps?: string[];
  tip?: string;
  theme?: 'light' | 'dark';
}

export default function ContextualHelp({
  id,
  title,
  description,
  steps,
  specialSteps,
  tip,
  theme = 'dark'
}: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  const isLight = theme === 'light';

  useEffect(() => {
    // Check if user has previously read and closed this help card
    const dismissed = localStorage.getItem(`liloupro_help_dismissed_${id}`);
    if (dismissed === 'true') {
      setHasDismissed(true);
    }
  }, [id]);

  const handleDismiss = () => {
    localStorage.setItem(`liloupro_help_dismissed_${id}`, 'true');
    setHasDismissed(true);
  };

  if (hasDismissed) {
    // Return a tiny pulsing trigger button to re-enable help if needed, placed elegantly
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          localStorage.removeItem(`liloupro_help_dismissed_${id}`);
          setHasDismissed(false);
          setIsOpen(true);
        }}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider border transition-all shadow-md cursor-pointer ${
          isLight
            ? 'bg-gradient-to-r from-brand/15 via-blue-500/15 to-sky-500/15 hover:from-brand/25 hover:to-blue-500/25 text-brand border-brand/40 shadow-brand/10 ring-1 ring-brand/30'
            : 'bg-gradient-to-r from-brand/25 via-blue-500/20 to-sky-500/20 hover:from-brand/35 hover:to-blue-500/35 text-white border-brand/50 shadow-brand/20 ring-1 ring-brand/40'
        }`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
        </span>
        <HelpCircle size={14} className="text-brand dark:text-sky-300 shrink-0" />
        <span className="font-black drop-shadow-xs">Como funciona?</span>
        <Sparkles size={12} className="text-amber-400 animate-pulse shrink-0" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`border rounded-2xl overflow-hidden transition-all shadow-lg ${
        isLight
          ? 'bg-gradient-to-br from-sky-50/80 via-white to-blue-50/60 border-brand/30 text-zinc-900 shadow-brand/10 ring-1 ring-brand/15'
          : 'bg-gradient-to-br from-slate-900/95 via-slate-950 to-blue-950/30 border-brand/40 text-slate-100 shadow-brand/15 ring-1 ring-brand/25'
      }`}
    >
      {/* Header Panel */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="py-2.5 px-4 flex items-center justify-between cursor-pointer select-none border-b border-brand/10 hover:bg-brand/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand/20 border border-brand/30 flex items-center justify-center text-brand dark:text-sky-300 shrink-0 shadow-xs">
            <HelpCircle size={15} className={isOpen ? '' : 'animate-pulse text-brand dark:text-sky-300'} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand dark:text-sky-400 block leading-none">Guia Rápido</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-black bg-brand/20 text-brand dark:text-sky-300 uppercase tracking-tighter">Ajuda</span>
            </div>
            <h4 className="text-xs sm:text-[13px] font-black uppercase tracking-tight text-text-main leading-none mt-1">{title}</h4>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isOpen ? <ChevronUp size={15} className="text-brand dark:text-sky-400" /> : <ChevronDown size={15} className="text-brand dark:text-sky-400" />}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="p-4 sm:p-5 flex flex-col gap-4">
              <p className="text-[13px] sm:text-[14px] text-text-muted leading-relaxed">
                {description}
              </p>

              {/* Steps List */}
              <div className="flex flex-col gap-3">
                {steps.map((step, idx) => {
                  const colonIdx = typeof step === 'string' ? step.indexOf(': ') : -1;
                  const title = colonIdx !== -1 && typeof step === 'string' ? step.substring(0, colonIdx) : null;
                  const desc = colonIdx !== -1 && typeof step === 'string' ? step.substring(colonIdx + 2) : step;

                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-xs sm:text-sm font-black text-brand bg-brand/10 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-[13px] sm:text-[14px] text-text-muted leading-relaxed mt-0.5">
                        {title ? (
                          <>
                            <strong className="text-text-main font-black uppercase tracking-tight">{title}:</strong>{' '}
                            <span>{desc}</span>
                          </>
                        ) : (
                          step
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Special Features List */}
              {specialSteps && specialSteps.length > 0 && (
                <div className="flex flex-col gap-3 mt-1">
                  <div className="flex items-center gap-2 border-t border-white/5 pt-3.5 pb-1">
                    <Sparkles size={14} className="text-brand animate-pulse" />
                    <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-brand">Ferramentas Especiais (Exclusivo Liloupro)</span>
                  </div>
                  {specialSteps.map((sStep, sIdx) => {
                    const colonIdx = typeof sStep === 'string' ? sStep.indexOf(': ') : -1;
                    const title = colonIdx !== -1 && typeof sStep === 'string' ? sStep.substring(0, colonIdx) : null;
                    const desc = colonIdx !== -1 && typeof sStep === 'string' ? sStep.substring(colonIdx + 2) : sStep;

                    return (
                      <div 
                        key={sIdx} 
                        className={`flex items-start gap-3 p-3 rounded-2xl border transition-all hover:translate-x-0.5 ${
                          isLight
                            ? 'bg-indigo-50/60 border-indigo-100/80 text-indigo-950 shadow-sm'
                            : 'bg-indigo-950/20 border-indigo-900/30 text-indigo-100 shadow-sm shadow-indigo-950/10'
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-black text-white bg-indigo-600 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow">
                          {steps.length + sIdx + 1}
                        </span>
                        <p className="text-[13px] sm:text-[14px] leading-relaxed mt-0.5">
                          {title ? (
                            <>
                              <strong className="font-black uppercase tracking-tight">{title}:</strong>{' '}
                              <span>{desc}</span>
                            </>
                          ) : (
                            sStep
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pro Tip */}
              {tip && (
                <div className={`p-3 rounded-2xl text-[12px] sm:text-[13px] leading-relaxed flex gap-2.5 border ${
                  isLight
                    ? 'bg-zinc-100/50 border-zinc-200 text-zinc-700'
                    : 'bg-brand/5 border-brand/10 text-brand-light'
                }`}>
                  <Sparkles size={14} className="shrink-0 text-brand mt-0.5 animate-pulse" />
                  <div>
                    <strong className="uppercase font-extrabold text-[10px] sm:text-[11px] block tracking-wider">Dica do LiLouPro:</strong>
                    <span>{tip}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-3 border-t border-white/5 mt-1">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-xs font-extrabold uppercase tracking-wider text-text-muted hover:text-text-main transition-colors py-1 px-2"
                >
                  Ocultar
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-brand hover:bg-brand-light text-slate-900 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Ok, entendi!
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
