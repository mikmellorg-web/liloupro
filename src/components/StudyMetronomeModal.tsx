import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Pause, Volume2, VolumeX, Plus, Minus, Music, Activity } from 'lucide-react';

interface StudyMetronomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  bpm: number;
  timeSignature?: string;
  onUpdateBpm: (newBpm: number | ((prev: number) => number)) => void;
  isMetronomeActive: boolean;
  onToggleMetronome: () => void;
  metronomeVolume?: number;
  onUpdateVolume?: (vol: number) => void;
  onTapTempo?: (e?: any) => void;
  originalBpm?: number;
  originalTimeSignature?: string;
}

export const StudyMetronomeModal: React.FC<StudyMetronomeModalProps> = ({
  isOpen,
  onClose,
  bpm,
  timeSignature = '4/4',
  onUpdateBpm,
  isMetronomeActive,
  onToggleMetronome,
  metronomeVolume = 0.8
}) => {
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(metronomeVolume);
  const [isMuted, setIsMuted] = useState(false);
  const tapTimesRef = useRef<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const beatCountRef = useRef<number>(0);

  // Parse time signature (e.g., '4/4', '3/4', '6/8')
  const beatsPerMeasure = (() => {
    const parts = timeSignature.split('/');
    const numerator = parseInt(parts[0], 10);
    return isNaN(numerator) || numerator <= 0 ? 4 : numerator;
  })();

  const playClick = (isFirstBeat: boolean, time: number) => {
    if (!audioContextRef.current || isMuted) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Primeiro tempo (downbeat) mais agudo e destacado
    osc.frequency.setValueAtTime(isFirstBeat ? 1200 : 800, time);
    osc.type = 'sine';

    const currentVol = isMuted ? 0 : volume;
    gain.gain.setValueAtTime(currentVol * 0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.06);
  };

  useEffect(() => {
    if (!isMetronomeActive) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCurrentBeat(0);
      beatCountRef.current = 0;
      return;
    }

    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
    }

    const ctx = audioContextRef.current;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }

    const intervalSeconds = 60.0 / Math.max(20, Math.min(300, bpm));
    nextNoteTimeRef.current = ctx ? ctx.currentTime + 0.05 : 0;
    beatCountRef.current = 0;

    const scheduler = () => {
      if (!ctx) return;
      while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
        const beatIndex = beatCountRef.current % beatsPerMeasure;
        playClick(beatIndex === 0, nextNoteTimeRef.current);
        
        const scheduledBeat = beatIndex;
        setTimeout(() => {
          setCurrentBeat(scheduledBeat);
        }, Math.max(0, (nextNoteTimeRef.current - ctx.currentTime) * 1000));

        nextNoteTimeRef.current += intervalSeconds;
        beatCountRef.current++;
      }
    };

    timerRef.current = window.setInterval(scheduler, 25);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isMetronomeActive, bpm, beatsPerMeasure, volume, isMuted]);

  // Tap Tempo Logic
  const handleTapTempo = () => {
    const now = performance.now();
    tapTimesRef.current.push(now);
    if (tapTimesRef.current.length > 5) {
      tapTimesRef.current.shift();
    }
    if (tapTimesRef.current.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        const diff = tapTimesRef.current[i] - tapTimesRef.current[i - 1];
        if (diff > 2000) {
          // Reset se o intervalo for maior que 2 segundos
          tapTimesRef.current = [now];
          return;
        }
        intervals.push(diff);
      }
      if (intervals.length > 0) {
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const calculatedBpm = Math.round(60000 / avgInterval);
        if (calculatedBpm >= 30 && calculatedBpm <= 260) {
          onUpdateBpm(calculatedBpm);
        }
      }
    }
  };

  const adjustBpm = (delta: number) => {
    const newBpm = Math.max(30, Math.min(260, bpm + delta));
    onUpdateBpm(newBpm);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl text-slate-100 relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Metrônomo de Estudo</h3>
                <span className="text-xs text-slate-400">Compasso {timeSignature}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Beat Indicator Dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {Array.from({ length: beatsPerMeasure }).map((_, idx) => {
              const isCurrent = isMetronomeActive && currentBeat === idx;
              const isFirst = idx === 0;
              return (
                <motion.div
                  key={idx}
                  animate={{
                    scale: isCurrent ? 1.3 : 1,
                    opacity: isCurrent ? 1 : 0.4
                  }}
                  transition={{ duration: 0.08 }}
                  className={`h-3 rounded-full transition-colors ${
                    isCurrent
                      ? isFirst
                        ? 'w-6 bg-amber-400 shadow-lg shadow-amber-400/50'
                        : 'w-4 bg-emerald-400 shadow-md shadow-emerald-400/50'
                      : 'w-3 bg-slate-700'
                  }`}
                />
              );
            })}
          </div>

          {/* BPM Display and Adjust */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 mb-5 text-center">
            <div className="flex items-center justify-center gap-4 mb-2">
              <button
                onClick={() => adjustBpm(-1)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-lg active:scale-95 transition-all"
                title="-1 BPM"
              >
                <Minus size={16} />
              </button>

              <div className="flex flex-col items-center min-w-[110px]">
                <span className="text-4xl font-black text-amber-400 tracking-tight font-mono">
                  {bpm}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  BPM
                </span>
              </div>

              <button
                onClick={() => adjustBpm(1)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-lg active:scale-95 transition-all"
                title="+1 BPM"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-800/60">
              {[-5, -10, 10, 5].map((delta) => (
                <button
                  key={delta}
                  onClick={() => adjustBpm(delta)}
                  className="px-2.5 py-1 rounded-md bg-slate-800/60 hover:bg-slate-800 text-[11px] font-medium text-slate-300 transition-colors"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons: Play/Stop & Tap Tempo */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={onToggleMetronome}
              className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                isMetronomeActive
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-amber-500/25'
              }`}
            >
              {isMetronomeActive ? (
                <>
                  <Pause size={18} />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  <span>Iniciar</span>
                </>
              )}
            </button>

            <button
              onClick={handleTapTempo}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-white font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Music size={16} className="text-amber-400" />
              <span>Tap Tempo</span>
            </button>
          </div>

          {/* Volume Slider */}
          <div className="flex items-center gap-3 px-1">
            <button
              onClick={() => setIsMuted(prev => !prev)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-slate-400 w-8 text-right">
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StudyMetronomeModal;
