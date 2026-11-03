import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Compass, 
  Music, 
  Layers, 
  ArrowRight, 
  Guitar, 
  Piano, 
  CheckCircle2, 
  Info,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Volume2
} from 'lucide-react';
import { analyzeChordHarmonicContext } from '../utils/chordHarmonicContext';

export interface ChordHarmonicContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  chord: string;
  songKey?: string;
  availableChords?: string[];
  onSelectChord?: (chord: string) => void;
  songTitle?: string;
}

export function ChordHarmonicContextModal({
  isOpen,
  onClose,
  chord,
  songKey,
  availableChords = [],
  onSelectChord,
  songTitle
}: ChordHarmonicContextModalProps) {
  const analysis = useMemo(() => {
    if (!chord) return null;
    return analyzeChordHarmonicContext(chord, songKey, availableChords);
  }, [chord, songKey, availableChords]);

  if (!isOpen || !analysis) return null;
  if (typeof document === 'undefined') return null;

  const currentIndex = availableChords.indexOf(chord);
  const hasMultiple = availableChords.length > 1;

  const handlePrev = () => {
    if (!hasMultiple || !onSelectChord) return;
    const prevIdx = (currentIndex - 1 + availableChords.length) % availableChords.length;
    onSelectChord(availableChords[prevIdx]);
  };

  const handleNext = () => {
    if (!hasMultiple || !onSelectChord) return;
    const nextIdx = (currentIndex + 1) % availableChords.length;
    onSelectChord(availableChords[nextIdx]);
  };

  // Cores por função harmônica
  const functionColors = {
    'Tônica': {
      bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      badge: 'bg-emerald-500 text-white',
      glow: 'shadow-emerald-500/20',
      ring: 'ring-emerald-500/30'
    },
    'Subdominante': {
      bg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      badge: 'bg-sky-500 text-white',
      glow: 'shadow-sky-500/20',
      ring: 'ring-sky-500/30'
    },
    'Dominante': {
      bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      badge: 'bg-amber-500 text-white',
      glow: 'shadow-amber-500/20',
      ring: 'ring-amber-500/30'
    },
    'Especial': {
      bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      badge: 'bg-purple-500 text-white',
      glow: 'shadow-purple-500/20',
      ring: 'ring-purple-500/30'
    }
  }[analysis.functionType] || {
    bg: 'bg-brand/15 text-brand border-brand/30',
    badge: 'bg-brand text-white',
    glow: 'shadow-brand/20',
    ring: 'ring-brand/30'
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-[#0b1324] border-0 sm:border border-slate-700/80 sm:rounded-3xl w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-4xl lg:max-w-5xl shadow-2xl flex flex-col overflow-hidden text-slate-100 notranslate"
          translate="no"
        >
          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-brand/20 text-amber-400 border border-amber-500/30 shrink-0">
                <Compass size={18} className="animate-spin-slow" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                    Raio-X Harmônico do Acorde
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wide border border-amber-500/30">
                    Pro Mentoring
                  </span>
                </div>
                {songTitle && (
                  <p className="text-[11px] text-slate-400 truncate">
                    Música: <span className="text-slate-200 font-semibold">{songTitle}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Close Button with generous touch target (44px) */}
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95 shrink-0"
              title="Fechar (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Chord Carousel / Bar if multiple chords */}
          {hasMultiple && (
            <div className="px-4 sm:px-6 py-2 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0 overflow-x-auto custom-scrollbar">
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="min-h-[36px] px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                  title="Acorde anterior"
                >
                  <ChevronLeft size={14} />
                  <span className="hidden sm:inline">Anterior</span>
                </button>
                <span className="text-[11px] font-mono text-slate-400 px-1">
                  {currentIndex + 1} de {availableChords.length}
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  className="min-h-[36px] px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                  title="Próximo acorde"
                >
                  <span className="hidden sm:inline">Próximo</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Chord chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {availableChords.map((c) => {
                  const isActive = c === chord;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onSelectChord && onSelectChord(c)}
                      className={`min-h-[32px] px-2.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-brand text-white shadow-md shadow-brand/30 scale-105 border border-brand'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scrollable Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar">
            
            {/* 1. HERO SECTION: Big Chord Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-700 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950 border-2 border-brand/40 flex flex-col items-center justify-center shadow-lg shrink-0">
                    <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                      {analysis.chord}
                    </span>
                    <span className="text-[9px] font-black uppercase text-brand tracking-widest mt-0.5">
                      {analysis.degreeRoman}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${functionColors.bg}`}>
                        {analysis.functionBadge}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                        Tom {analysis.songKey}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                      <span>Grau Harmônico:</span>
                      <span className="text-brand font-mono font-black text-base sm:text-lg">
                        {analysis.degreeRoman}
                      </span>
                      {analysis.bassNote && (
                        <span className="text-xs text-amber-400 font-normal">
                          (baixo em {analysis.bassNote})
                        </span>
                      )}
                    </h4>

                    <p className="text-xs text-slate-300">
                      {analysis.fieldPositionText}
                    </p>
                  </div>
                </div>

                {/* Mood Tag */}
                <div className="sm:text-right bg-slate-950/70 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-slate-800 sm:border-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Sensação / Atmosfera
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-amber-300/90 mt-0.5 leading-snug max-w-xs">
                    "{analysis.spiritualMood}"
                  </p>
                </div>
              </div>

              {/* Function explanation card */}
              <div className="mt-4 pt-3.5 border-t border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                <Info size={16} className="text-sky-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white font-bold">Papel na Canção: </strong>
                  {analysis.functionExplanation}
                </p>
              </div>
            </div>

            {/* 2. RÉGUA DO CAMPO HARMÔNICO DA MÚSICA */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Layers size={15} className="text-brand" />
                  <span>Campo Harmônico no Tom {analysis.songKey}</span>
                </h4>
                <span className="text-[10px] font-bold text-slate-400">
                  {analysis.isMinorKey ? 'Escala Menor Natural' : 'Escala Maior Diatônica'}
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
                {analysis.harmonicField.map((deg) => {
                  return (
                    <div
                      key={deg.roman}
                      className={`p-2 sm:p-2.5 rounded-xl border transition-all text-center flex flex-col justify-between ${
                        deg.isCurrent
                          ? 'bg-brand/20 border-brand shadow-lg shadow-brand/20 ring-2 ring-brand/40 scale-105'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div>
                        <span className={`text-[10px] font-mono font-black uppercase block ${deg.isCurrent ? 'text-amber-300' : 'text-slate-400'}`}>
                          {deg.roman}
                        </span>
                        <span className={`text-xs sm:text-sm font-mono font-black block mt-0.5 ${deg.isCurrent ? 'text-white' : 'text-slate-200'}`}>
                          {deg.chord}
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold uppercase mt-1 px-1 py-0.5 rounded ${
                        deg.isCurrent ? 'bg-brand text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {deg.functionShort}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. CADÊNCIA & MOVIMENTO DA CANÇÃO (Sincronizado com o Capítulo 3 do Curso de Harmonia) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-amber-400 shrink-0" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Cadência Harmônica Prática
                  </h4>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    Capítulo 3
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs font-black text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  {analysis.cadenceContext.progressionName}
                </span>
              </div>

              {/* Visual Flow diagram com Acordes e Funções abaixo (estilo simulador do curso) */}
              <div className="p-3 sm:p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                {analysis.cadenceContext.sequence.map((sqChord, sIdx) => {
                  const isCurrent = sqChord === analysis.chord || (analysis.baseChord && sqChord.startsWith(analysis.baseChord));
                  const funcTag = analysis.cadenceContext.functions?.[sIdx];
                  const shortFunc = funcTag ? funcTag.split(' ')[0] : undefined;

                  return (
                    <React.Fragment key={`${sqChord}-${sIdx}`}>
                      <div className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-center transition-all ${
                        isCurrent
                          ? 'bg-brand text-white border-brand shadow-lg shadow-brand/25 ring-2 ring-white/20 scale-105'
                          : 'bg-slate-900/90 text-slate-200 border-slate-700/80 hover:border-slate-600'
                      }`}>
                        <span className="block text-sm sm:text-base font-black font-mono tracking-wide">
                          {sqChord}
                        </span>
                        {shortFunc && (
                          <span className={`block text-[9px] sm:text-[10px] tracking-tight mt-0.5 truncate uppercase font-extrabold ${
                            isCurrent ? 'text-amber-300' : 'text-slate-400'
                          }`}>
                            {shortFunc}
                          </span>
                        )}
                      </div>
                      {sIdx < analysis.cadenceContext.sequence.length - 1 && (
                        <ArrowRight size={16} className="text-slate-500 shrink-0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {analysis.cadenceContext.songFlow && (
                <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/60">
                  <span className="font-bold text-slate-300 shrink-0">Contexto na música:</span>
                  <span className="font-mono font-semibold text-slate-300 truncate">{analysis.cadenceContext.songFlow}</span>
                </div>
              )}

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                {analysis.cadenceContext.description}
              </p>
            </div>

            {/* 4. ANATOMIA INTERVALAR & NOTAS DO ACORDE */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Music size={15} className="text-sky-400" />
                  <span>Anatomia das Notas & Intervalos</span>
                </h4>
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  Fórmula: <strong className="text-white">{analysis.chordFormula}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {analysis.notes.map((nt, nIdx) => (
                  <div
                    key={`${nt.note}-${nIdx}`}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                      nt.isBass
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black font-mono text-white">
                        {nt.note}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-black text-brand">
                        {nt.intervalName}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                      {nt.role}
                    </p>
                  </div>
                ))}
              </div>

              {/* Extensões sugeridas */}
              <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Tensões Disponíveis:
                </span>
                {analysis.extensionsAvailable.map(ext => (
                  <span
                    key={ext}
                    className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold"
                  >
                    +{ext}
                  </span>
                ))}
              </div>
            </div>

            {/* 5. DICAS DE EXECUÇÃO PRÁTICA (VIOLÃO & TECLADO) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Violão / Guitarra */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                  <Guitar size={16} />
                  <span>Dica para Violão & Guitarra</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {analysis.guitarTip}
                </p>
              </div>

              {/* Teclado / Piano */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-sky-400">
                  <Piano size={16} />
                  <span>Dica para Teclado & Piano</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {analysis.pianoTip}
                </p>
              </div>
            </div>

            {/* 6. REARMONIZAÇÕES & SUBSTITUIÇÕES PRO */}
            {analysis.substitutions.length > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-brand/5 to-slate-900 border border-brand/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Rearmonizações & Substituições Sugeridas
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {analysis.substitutions.map(sub => (
                    <div
                      key={sub.chord}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black font-mono text-brand">
                          {sub.chord}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          {sub.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {sub.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Bottom Footer Actions */}
          <div className="px-4 sm:px-6 py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-slate-400 font-medium">
              Liloupro • Ferramentas Avançadas de Ministério
            </span>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none active:scale-95 shadow-md"
            >
              Concluir & Voltar
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
