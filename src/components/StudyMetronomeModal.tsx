import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Flame, 
  Check, 
  Activity, 
  Clock,
  Layers, 
  Sliders, 
  Music, 
  Zap, 
  Bell,
  Sun,
  Moon,
  Sparkles,
  Plus,
  Minus
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type MetronomeSubdivision = 
  | 'quarter' 
  | 'eighth' 
  | 'triplet' 
  | 'sixteenth' 
  | 'quintuplet' 
  | 'sextuplet' 
  | 'septuplet' 
  | 'thirtysecond' 
  | 'shuffle';
export type MetronomeSound = 'woodblock' | 'digital' | 'hihat' | 'cowbell';

interface StudyMetronomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  bpm: number;
  timeSignature: string;
  onUpdateBpm: (newBpm: number | ((prev: number) => number)) => void;
  originalBpm?: number;
  originalTimeSignature?: string;
  isMetronomeActive: boolean;
  onToggleMetronome: () => void;
  metronomeVolume: number;
  onUpdateVolume: (vol: number | ((prev: number) => number)) => void;
  onTapTempo: (e?: React.MouseEvent | React.TouchEvent) => void;
}

export const StudyMetronomeModal: React.FC<StudyMetronomeModalProps> = ({
  isOpen,
  onClose,
  bpm,
  timeSignature,
  onUpdateBpm,
  originalBpm = 80,
  originalTimeSignature = '4/4',
  isMetronomeActive,
  onToggleMetronome,
  metronomeVolume,
  onUpdateVolume,
  onTapTempo
}) => {
  // Theme state (local to pedal or inherited)
  const [pedalTheme, setPedalTheme] = useState<'dark' | 'light'>('dark');

  // Subdivisions and Sounds
  const [subdivision, setSubdivision] = useState<MetronomeSubdivision>('quarter');
  const [sound, setSound] = useState<MetronomeSound>('woodblock');
  const [activeTab, setActiveTab] = useState<'rhythm' | 'trainer' | 'timer'>('rhythm');

  // Speed Trainer State
  const [trainerEnabled, setTrainerEnabled] = useState(false);
  const [trainerStartBpm, setTrainerStartBpm] = useState(bpm);
  const [trainerTargetBpm, setTrainerTargetBpm] = useState(Math.min(300, bpm + 20));
  const [trainerBpmStep, setTrainerBpmStep] = useState(2);
  const [trainerBarInterval, setTrainerBarInterval] = useState(2);

  // Bar Mute / Accuracy Trainer
  const [barMuteEnabled, setBarMuteEnabled] = useState(false);
  const [barMutePlayBars, setBarMutePlayBars] = useState(3);
  const [barMuteSilentBars, setBarMuteSilentBars] = useState(1);
  const [isCurrentlyMutedBar, setIsCurrentlyMutedBar] = useState(false);

  // Practice Timer
  const [timerMinutes, setTimerMinutes] = useState(10);
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerFinishedToast, setTimerFinishedToast] = useState(false);

  // Beat tracking
  const [currentVisualBeat, setCurrentVisualBeat] = useState(0);
  const [currentVisualSubBeat, setCurrentVisualSubBeat] = useState(0);
  const [currentMeasureCount, setCurrentMeasureCount] = useState(0);

  // Audio Context and Scheduling Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const timerWorkerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const currentBeatIndexRef = useRef<number>(0);
  const currentSubIndexRef = useRef<number>(0);
  const barCounterRef = useRef<number>(0);
  const onUpdateBpmRef = useRef(onUpdateBpm);

  // Live refs for Web Audio thread
  const liveBpmRef = useRef(bpm);
  const liveTimeSigRef = useRef(timeSignature);
  const liveSubdivRef = useRef(subdivision);
  const liveSoundRef = useRef(sound);
  const liveVolumeRef = useRef(metronomeVolume);
  const liveTrainerRef = useRef({ enabled: trainerEnabled, start: trainerStartBpm, target: trainerTargetBpm, step: trainerBpmStep, interval: trainerBarInterval });
  const liveBarMuteRef = useRef({ enabled: barMuteEnabled, playBars: barMutePlayBars, silentBars: barMuteSilentBars });

  useEffect(() => { onUpdateBpmRef.current = onUpdateBpm; }, [onUpdateBpm]);
  useEffect(() => { liveBpmRef.current = bpm; }, [bpm]);
  useEffect(() => { liveTimeSigRef.current = timeSignature; }, [timeSignature]);
  useEffect(() => { liveSubdivRef.current = subdivision; }, [subdivision]);
  useEffect(() => { liveSoundRef.current = sound; }, [sound]);
  useEffect(() => { liveVolumeRef.current = metronomeVolume; }, [metronomeVolume]);
  useEffect(() => { 
    liveTrainerRef.current = { enabled: trainerEnabled, start: trainerStartBpm, target: trainerTargetBpm, step: trainerBpmStep, interval: trainerBarInterval };
  }, [trainerEnabled, trainerStartBpm, trainerTargetBpm, trainerBpmStep, trainerBarInterval]);
  useEffect(() => { 
    liveBarMuteRef.current = { enabled: barMuteEnabled, playBars: barMutePlayBars, silentBars: barMuteSilentBars };
  }, [barMuteEnabled, barMutePlayBars, barMuteSilentBars]);

  // Toggle Theme
  const toggleTheme = useCallback(() => {
    setPedalTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  // Audio synthesis for different sounds
  const playSoundNote = useCallback((time: number, isAccent: boolean, isSubdivision: boolean) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const currentSound = liveSoundRef.current;
    const vol = (liveVolumeRef.current / 100);
    const subVolumeFactor = isSubdivision ? 0.45 : 1.0;
    const gainFactor = (isAccent ? 0.9 : 0.6) * vol * subVolumeFactor;

    if (currentSound === 'woodblock') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isAccent ? 1200 : isSubdivision ? 650 : 850, time);
      filter.Q.setValueAtTime(12, time);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isAccent ? 1200 : isSubdivision ? 650 : 850, time);
      osc.frequency.exponentialRampToValueAtTime(100, time + 0.04);

      gain.gain.setValueAtTime(gainFactor, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.05);
    } else if (currentSound === 'digital') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isAccent ? 1800 : isSubdivision ? 900 : 1200, time);

      gain.gain.setValueAtTime(gainFactor * 0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.04);
    } else if (currentSound === 'hihat') {
      if (!noiseBufferRef.current || noiseBufferRef.current.sampleRate !== ctx.sampleRate) {
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        noiseBufferRef.current = buffer;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBufferRef.current;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(isAccent ? 8000 : isSubdivision ? 5000 : 6500, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(gainFactor * 0.9, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + (isAccent ? 0.06 : 0.03));

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(time);
      whiteNoise.stop(time + 0.07);
    } else if (currentSound === 'cowbell') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'square';
      osc2.type = 'square';
      const baseFreq = isAccent ? 840 : isSubdivision ? 480 : 587;
      osc1.frequency.setValueAtTime(baseFreq, time);
      osc2.frequency.setValueAtTime(baseFreq * 1.5, time);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq * 1.2, time);
      filter.Q.setValueAtTime(5, time);

      gain.gain.setValueAtTime(gainFactor * 0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + 0.07);
      osc2.stop(time + 0.07);
    }
  }, []);

  // Practice Timer Countdown Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerRemainingSeconds !== null && timerRemainingSeconds > 0) {
      interval = setInterval(() => {
        setTimerRemainingSeconds(prev => {
          if (prev === null || prev <= 1) {
            if (isMetronomeActive) {
              onToggleMetronome();
            }
            setIsTimerRunning(false);
            setTimerFinishedToast(true);
            setTimeout(() => setTimerFinishedToast(false), 5000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerRemainingSeconds, isMetronomeActive, onToggleMetronome]);

  // Start / Reset Practice Timer
  const handleStartTimer = (mins: number) => {
    setTimerMinutes(mins);
    setTimerRemainingSeconds(mins * 60);
    setIsTimerRunning(true);
    if (!isMetronomeActive) {
      onToggleMetronome();
    }
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
    setTimerRemainingSeconds(null);
  };

  // Metronome Engine Loop (Lookahead Scheduler)
  useEffect(() => {
    if (!isMetronomeActive) {
      if (timerWorkerRef.current) {
        clearInterval(timerWorkerRef.current);
        timerWorkerRef.current = null;
      }
      setIsCurrentlyMutedBar(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      nextNoteTimeRef.current = ctx.currentTime + 0.05;
      currentBeatIndexRef.current = 0;
      currentSubIndexRef.current = 0;
      barCounterRef.current = 0;

      const lookahead = 20.0;
      const scheduleAheadTime = 0.12;

      const scheduler = () => {
        const curSubdiv = liveSubdivRef.current;
        const curTimeSig = liveTimeSigRef.current;
        const [numStr, denStr] = curTimeSig.split('/');
        const num = Math.max(1, parseInt(numStr, 10) || 4);
        const den = parseInt(denStr, 10) || 4;

        let subDivisionFactor = 1;
        if (curSubdiv === 'eighth') subDivisionFactor = 2;
        else if (curSubdiv === 'triplet') subDivisionFactor = 3;
        else if (curSubdiv === 'sixteenth') subDivisionFactor = 4;
        else if (curSubdiv === 'quintuplet') subDivisionFactor = 5;
        else if (curSubdiv === 'sextuplet') subDivisionFactor = 6;
        else if (curSubdiv === 'septuplet') subDivisionFactor = 7;
        else if (curSubdiv === 'thirtysecond') subDivisionFactor = 8;
        else if (curSubdiv === 'shuffle') subDivisionFactor = 2;

        while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
          const currentBpm = liveBpmRef.current;
          const mainBeatDuration = (60.0 / currentBpm) * (den === 8 ? (3 / 1) : 1);
          const subNoteDuration = mainBeatDuration / subDivisionFactor;

          const beatIndex = currentBeatIndexRef.current;
          const subIndex = currentSubIndexRef.current;
          const currentBar = barCounterRef.current;

          let shouldMute = false;
          if (liveBarMuteRef.current.enabled) {
            const cycleTotal = liveBarMuteRef.current.playBars + liveBarMuteRef.current.silentBars;
            const cycleIndex = currentBar % cycleTotal;
            if (cycleIndex >= liveBarMuteRef.current.playBars) {
              shouldMute = true;
            }
          }

          const isAccent = (beatIndex === 0 && subIndex === 0) || (curTimeSig === '6/8' && beatIndex === 3 && subIndex === 0);
          const isSubBeat = subIndex > 0;

          if (!shouldMute) {
            playSoundNote(nextNoteTimeRef.current, isAccent, isSubBeat);
          }

          const schedTime = nextNoteTimeRef.current;
          const delayMs = Math.max(0, (schedTime - ctx.currentTime) * 1000);
          setTimeout(() => {
            setCurrentVisualBeat(beatIndex);
            setCurrentVisualSubBeat(subIndex);
            setCurrentMeasureCount(currentBar + 1);
            setIsCurrentlyMutedBar(shouldMute);
          }, delayMs);

          let nextStepDuration = subNoteDuration;
          if (curSubdiv === 'shuffle') {
            nextStepDuration = subIndex === 0 ? mainBeatDuration * 0.66 : mainBeatDuration * 0.34;
          }

          nextNoteTimeRef.current += nextStepDuration;
          currentSubIndexRef.current = (currentSubIndexRef.current + 1) % subDivisionFactor;

          if (currentSubIndexRef.current === 0) {
            currentBeatIndexRef.current = (currentBeatIndexRef.current + 1) % num;
            if (currentBeatIndexRef.current === 0) {
              barCounterRef.current += 1;

              if (liveTrainerRef.current.enabled) {
                const tr = liveTrainerRef.current;
                if (barCounterRef.current % tr.interval === 0) {
                  const isAccelerating = tr.target >= tr.start;
                  const activeSpeed = liveBpmRef.current;

                  if (isAccelerating && activeSpeed < tr.target) {
                    const nextBpm = Math.min(tr.target, activeSpeed + tr.step);
                    liveBpmRef.current = nextBpm;
                    onUpdateBpmRef.current(nextBpm);
                  } else if (!isAccelerating && activeSpeed > tr.target) {
                    const nextBpm = Math.max(tr.target, activeSpeed - tr.step);
                    liveBpmRef.current = nextBpm;
                    onUpdateBpmRef.current(nextBpm);
                  }
                }
              }
            }
          }
        }
      };

      timerWorkerRef.current = window.setInterval(scheduler, lookahead);
    } catch {
      // audio error fallback
    }

    return () => {
      if (timerWorkerRef.current) {
        clearInterval(timerWorkerRef.current);
        timerWorkerRef.current = null;
      }
    };
  }, [isMetronomeActive, playSoundNote]);

  if (!isOpen) return null;

  const [numBeats] = (timeSignature || '4/4').split('/').map(Number);
  const totalBeats = numBeats || 4;
  const isLight = pedalTheme === 'light';

  const formatTimerDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[320] flex items-center justify-center p-3 sm:p-6 overflow-y-auto transition-colors duration-300 notranslate",
      isLight ? "bg-slate-900/60 backdrop-blur-md" : "bg-black/85 backdrop-blur-md"
    )} translate="no">
      {/* 3D Boutique Guitar Pedal Enclosure Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="w-full max-w-[450px] relative my-auto select-none"
      >
        {/* Outer Metallic Enclosure Shell */}
        <div className={cn(
          "relative border-2 rounded-[36px] p-5 sm:p-7 overflow-hidden flex flex-col items-center transition-all duration-300",
          isLight
            ? "bg-gradient-to-b from-sky-50 via-slate-100 to-slate-200 border-slate-300/90 shadow-[0_20px_60px_rgba(0,0,0,0.25),_inset_0_2px_4px_rgba(255,255,255,0.9),_inset_0_-4px_8px_rgba(0,0,0,0.1)] text-slate-900"
            : "bg-gradient-to-b from-slate-750 via-slate-800 to-slate-900 border-slate-600/90 shadow-[0_25px_60px_rgba(0,0,0,0.7),_inset_0_2px_4px_rgba(255,255,255,0.3),_inset_0_-4px_8px_rgba(0,0,0,0.5)] text-white"
        )}>
          
          {/* Subtle Brushed Metal Grid Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.04] pointer-events-none" />

          {/* Top Edge Metallic Bevel Accent */}
          <div className={cn(
            "absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent",
            isLight && "via-cyan-600/40"
          )} />

          {/* 4 Corner Screws (3D Chrome Philips Screws) */}
          <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 border border-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.8),_inset_0_1px_1px_rgba(255,255,255,0.8)] flex items-center justify-center">
            <div className="w-2.5 h-0.5 bg-slate-900 absolute rounded-full rotate-12" />
            <div className="w-0.5 h-2.5 bg-slate-900 absolute rounded-full rotate-12" />
          </div>
          <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 border border-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.8),_inset_0_1px_1px_rgba(255,255,255,0.8)] flex items-center justify-center">
            <div className="w-2.5 h-0.5 bg-slate-900 absolute rounded-full -rotate-25" />
            <div className="w-0.5 h-2.5 bg-slate-900 absolute rounded-full -rotate-25" />
          </div>
          <div className="absolute bottom-4 left-4 w-4 h-4 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 border border-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.8),_inset_0_1px_1px_rgba(255,255,255,0.8)] flex items-center justify-center">
            <div className="w-2.5 h-0.5 bg-slate-900 absolute rounded-full rotate-45" />
            <div className="w-0.5 h-2.5 bg-slate-900 absolute rounded-full rotate-45" />
          </div>
          <div className="absolute bottom-4 right-4 w-4 h-4 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 border border-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.8),_inset_0_1px_1px_rgba(255,255,255,0.8)] flex items-center justify-center">
            <div className="w-2.5 h-0.5 bg-slate-900 absolute rounded-full -rotate-15" />
            <div className="w-0.5 h-2.5 bg-slate-900 absolute rounded-full -rotate-15" />
          </div>

          {/* Top Center 9V DC Jack */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center">
            <div className={cn(
              "px-3 py-1 rounded-full border shadow-inner flex items-center gap-1.5 transition-colors",
              isLight
                ? "bg-slate-200/90 border-slate-300 text-slate-700 shadow-sm"
                : "bg-slate-900 border-slate-600 text-slate-100 shadow-sm"
            )}>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.9)]" />
              </div>
              <span className={cn(
                "text-[9px] font-mono font-black tracking-widest uppercase",
                isLight ? "text-slate-700" : "text-slate-100"
              )}>
                9V DC ⚡ SYNC
              </span>
            </div>
          </div>

          {/* Side Jack Sockets - Left (CLICK OUT) and Right (MIDI IN) */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 hidden sm:flex flex-col items-center">
            <div className="w-3.5 h-8 bg-gradient-to-r from-slate-400 to-slate-700 rounded-l-md border border-slate-900 shadow-md flex items-center justify-center">
              <div className="w-1.5 h-5 bg-slate-950 rounded-sm" />
            </div>
            <span className={cn("text-[8px] font-mono font-black mt-1 tracking-tighter", isLight ? "text-slate-600" : "text-slate-100")}>CLICK</span>
          </div>
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 hidden sm:flex flex-col items-center">
            <div className="w-3.5 h-8 bg-gradient-to-l from-slate-400 to-slate-700 rounded-r-md border border-slate-900 shadow-md flex items-center justify-center">
              <div className="w-1.5 h-5 bg-slate-950 rounded-sm" />
            </div>
            <span className={cn("text-[8px] font-mono font-black mt-1 tracking-tighter", isLight ? "text-slate-600" : "text-slate-100")}>MIDI</span>
          </div>

          {/* Top Section Header: Theme Switcher & Close Button */}
          <div className="w-full flex items-center justify-between mb-2 z-10 pt-5 sm:pt-6 px-1">
            <button
              onClick={toggleTheme}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border transition-all shadow-sm active:scale-95 cursor-pointer",
                isLight
                  ? "bg-cyan-100 hover:bg-cyan-200 border-cyan-300 text-cyan-800"
                  : "bg-slate-800 hover:bg-slate-700 border-slate-500 text-cyan-300 font-black"
              )}
              title={isLight ? "Mudar para Modo Escuro" : "Mudar para Modo Claro"}
            >
              {isLight ? <Moon size={13} className="text-cyan-700" /> : <Sun size={13} className="text-cyan-300" />}
              <span>{isLight ? 'Modo Escuro' : 'Modo Claro'}</span>
            </button>

            <button
              onClick={onClose}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-md active:scale-95 border cursor-pointer",
                isLight
                  ? "bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-700 hover:text-slate-900"
                  : "bg-slate-800 hover:bg-slate-700 border-slate-500 text-slate-100 hover:text-white"
              )}
              title="Fechar Metrônomo"
            >
              <X size={16} />
            </button>
          </div>

          {/* Pedal Branding Header */}
          <div className="text-center mb-3 z-10">
            <div className="inline-flex items-center gap-2">
              <h2 className={cn(
                "text-2xl sm:text-3xl font-black tracking-widest uppercase text-transparent bg-clip-text font-sans",
                isLight
                  ? "bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 drop-shadow-sm"
                  : "bg-gradient-to-b from-white via-slate-100 to-slate-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              )}>
                LILOUPRO
              </h2>
              <span className={cn(
                "text-xs font-black px-2 py-0.5 rounded tracking-wider border",
                isLight
                  ? "bg-cyan-600 text-white border-cyan-700 shadow-sm"
                  : "bg-cyan-500/30 text-cyan-300 border-cyan-400/50 shadow-sm"
              )}>
                METRONOME PRO
              </span>
            </div>
            <p className={cn(
              "text-[10px] font-mono font-bold tracking-widest uppercase mt-0.5",
              isLight ? "text-slate-600" : "text-slate-300"
            )}>
              BOUTIQUE RHYTHM & ACCURACY STOMPBOX
            </p>
          </div>

          {/* Status LED Ring Indicator */}
          <div className="flex items-center justify-center gap-2 mb-3 z-10">
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-inner transition-colors",
              isLight ? "bg-white border-slate-300/90 text-slate-800 shadow-sm" : "bg-slate-900/90 border-slate-700 text-slate-200"
            )}>
              <div className={cn(
                "w-3 h-3 rounded-full transition-all duration-200 shadow-lg",
                !isMetronomeActive
                  ? "bg-slate-400 shadow-none"
                  : isCurrentlyMutedBar
                  ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,1)] animate-ping"
                  : currentVisualBeat === 0
                  ? "bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,1)]"
                  : "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
              )} />
              <span className={cn(
                "text-[10px] font-mono font-extrabold uppercase tracking-wide",
                isLight ? "text-slate-700" : "text-slate-200"
              )}>
                {!isMetronomeActive 
                  ? 'STANDBY / BYPASS' 
                  : isCurrentlyMutedBar 
                  ? 'BAR MUTE (SILÊNCIO)' 
                  : 'PULSE LOCKED'}
              </span>
            </div>
          </div>

          {/* Timer Finished Toast inside Pedal */}
          <AnimatePresence>
            {timerFinishedToast && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="w-full mb-3 p-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-emerald-600/30 z-20"
              >
                <div className="flex items-center gap-2">
                  <Bell size={16} className="animate-bounce" />
                  <span>Sessão concluída! Excelente treino.</span>
                </div>
                <button onClick={() => setTimerFinishedToast(false)} className="p-1 hover:bg-white/20 rounded-lg">
                  <Check size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* High Definition OLED LCD Screen Display Box */}
          <div className={cn(
            "w-full border-[3px] rounded-3xl p-4 sm:p-5 relative flex flex-col items-center justify-center text-center overflow-hidden mb-4 z-10 transition-all duration-300",
            isMetronomeActive
              ? isLight
                ? "bg-gradient-to-b from-cyan-100 via-sky-50 to-white border-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.3),_inset_0_0_15px_rgba(6,182,212,0.15)]"
                : "bg-gradient-to-b from-cyan-950 via-slate-900 to-slate-950 border-cyan-400 shadow-[0_0_35px_rgba(34,211,238,0.45),_inset_0_0_25px_rgba(34,211,238,0.25)]"
              : isLight
              ? "bg-white border-slate-300 shadow-[inset_0_2px_8px_rgba(0,0,0,0.06),_0_2px_6px_rgba(0,0,0,0.04)]"
              : "bg-slate-950 border-slate-800/90 shadow-[inset_0_6px_20px_rgba(0,0,0,0.95),_0_0_1px_rgba(255,255,255,0.1)]"
          )}>
            {/* Top Screen Info Bar */}
            <div className="w-full flex items-center justify-between text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="flex items-center gap-1 font-mono">
                <span>COMPASSO:</span>
                <span className="text-cyan-500 font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">{timeSignature || '4/4'}</span>
              </span>
              <span className="flex items-center gap-1 font-mono">
                <span>BAR:</span>
                <span className="text-emerald-500 font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">#{currentMeasureCount || 1}</span>
              </span>
              <span className="flex items-center gap-1 font-mono">
                <span>TIMBRE:</span>
                <span className="text-amber-500 font-bold uppercase">{sound}</span>
              </span>
            </div>

            {/* Live Trainer / Bar Mute Status Banners */}
            {trainerEnabled && (
              <div className="w-full mb-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-between text-[9px] font-mono font-bold text-cyan-400">
                <span className="flex items-center gap-1">
                  <Zap size={11} className="text-cyan-400 animate-pulse" />
                  <span>SPEED: {bpm} → {trainerTargetBpm} BPM (+{trainerBpmStep}/{trainerBarInterval}c)</span>
                </span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded text-[8px] uppercase",
                  bpm >= trainerTargetBpm ? "bg-emerald-500 text-white font-black" : "bg-cyan-500/20 text-cyan-300"
                )}>
                  {bpm >= trainerTargetBpm ? "ALVO ATINGIDO!" : `FALTAM ${Math.max(0, trainerTargetBpm - bpm)} BPM`}
                </span>
              </div>
            )}

            {barMuteEnabled && (
              <div className={cn(
                "w-full mb-1.5 px-2.5 py-1 rounded-xl border flex items-center justify-between text-[9px] font-mono font-bold transition-all",
                isCurrentlyMutedBar
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse"
                  : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              )}>
                <span className="flex items-center gap-1">
                  <Sparkles size={11} />
                  <span>BAR MUTE: {barMutePlayBars} TOCANDO / {barMuteSilentBars} MUDO</span>
                </span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded text-[8px] uppercase font-black",
                  isCurrentlyMutedBar ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                )}>
                  {isCurrentlyMutedBar ? "SILÊNCIO (MUTE)" : "SOM ATIVO"}
                </span>
              </div>
            )}

            {/* Giant HD BPM Readout & Rotary Controls */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 my-1 z-10">
              <button
                type="button"
                onClick={() => onUpdateBpm(prev => Math.max(20, prev - 1))}
                className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center border shadow-md active:scale-95 transition-all cursor-pointer",
                  isLight 
                    ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-800" 
                    : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-cyan-300"
                )}
                title="Diminuir 1 BPM"
              >
                <Minus size={20} className="stroke-[3]" />
              </button>

              <div className="flex flex-col items-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className={cn(
                    "text-6xl sm:text-7xl font-black font-mono tracking-tight transition-all",
                    isMetronomeActive
                      ? isLight
                        ? "text-cyan-800 drop-shadow-sm scale-105"
                        : "text-white drop-shadow-[0_0_25px_rgba(34,211,238,0.9)] scale-105"
                      : isLight ? "text-slate-800" : "text-slate-300"
                  )}>
                    {bpm}
                  </span>
                  <span className="text-sm font-black font-mono uppercase text-cyan-500">
                    BPM
                  </span>
                </div>
                {bpm !== originalBpm && (
                  <button
                    onClick={() => onUpdateBpm(originalBpm)}
                    className="text-[9px] font-black uppercase text-amber-500 hover:text-amber-400 flex items-center gap-1 mt-0.5 cursor-pointer underline"
                  >
                    <RotateCcw size={10} /> Resetar para {originalBpm} BPM
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => onUpdateBpm(prev => Math.min(300, prev + 1))}
                className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center border shadow-md active:scale-95 transition-all cursor-pointer",
                  isLight 
                    ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-800" 
                    : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-cyan-300"
                )}
                title="Aumentar 1 BPM"
              >
                <Plus size={20} className="stroke-[3]" />
              </button>
            </div>

            {/* Dynamic Beat LED Pendulum Bar */}
            <div className="w-full flex items-center justify-center gap-1.5 sm:gap-2 my-2.5 max-w-[340px]">
              {Array.from({ length: totalBeats }).map((_, index) => {
                const isCurrent = isMetronomeActive && currentVisualBeat === index;
                const isFirst = index === 0;

                return (
                  <div
                    key={index}
                    className={cn(
                      "flex-1 h-10 sm:h-12 rounded-xl border flex flex-col items-center justify-center transition-all duration-75",
                      isCurrent
                        ? isFirst
                          ? "bg-amber-400 text-black border-amber-300 scale-110 shadow-lg shadow-amber-400/50 ring-2 ring-amber-300"
                          : "bg-cyan-500 text-white border-cyan-400 scale-105 shadow-md shadow-cyan-500/50"
                        : isLight
                        ? "bg-slate-100 border-slate-200 text-slate-400"
                        : "bg-slate-900/80 border-slate-800 text-slate-500"
                    )}
                  >
                    <span className={cn(
                      "text-sm sm:text-base font-mono font-black",
                      isCurrent ? (isFirst ? "text-black" : "text-white") : (isLight ? "text-slate-600" : "text-slate-400")
                    )}>
                      {index + 1}
                    </span>

                    {/* Sub-beat micro dots */}
                    {subdivision !== 'quarter' && (
                      <div className="flex items-center gap-0.5 mt-0.5 max-w-full overflow-hidden px-0.5">
                        {Array.from({ 
                          length: subdivision === 'eighth' || subdivision === 'shuffle' ? 2 :
                                  subdivision === 'triplet' ? 3 :
                                  subdivision === 'sixteenth' ? 4 :
                                  subdivision === 'quintuplet' ? 5 :
                                  subdivision === 'sextuplet' ? 6 :
                                  subdivision === 'septuplet' ? 7 :
                                  subdivision === 'thirtysecond' ? 8 : 1
                        }).map((_, dot) => (
                          <div 
                            key={dot}
                            className={cn(
                              "rounded-full transition-all shrink-0",
                              subdivision === 'quintuplet' || subdivision === 'sextuplet' || subdivision === 'septuplet' || subdivision === 'thirtysecond'
                                ? "w-1 h-1"
                                : "w-1.5 h-1.5",
                              isCurrent && currentVisualSubBeat === dot
                                ? "bg-white scale-125 ring-1 ring-white/50"
                                : "bg-black/20 dark:bg-white/20"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Module Mode Selector Tabs */}
          <div className={cn(
            "w-full flex gap-1 p-1 rounded-2xl border shadow-inner mb-3 z-10 transition-colors",
            isLight ? "bg-slate-200/90 border-slate-300/90" : "bg-slate-900/90 border-slate-700/80"
          )}>
            <button
              onClick={() => setActiveTab('rhythm')}
              className={cn(
                "flex-1 py-1.5 px-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-all cursor-pointer",
                activeTab === 'rhythm'
                  ? "bg-gradient-to-b from-cyan-500 to-cyan-600 text-slate-950 shadow-md font-black"
                  : isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-300 hover:text-white"
              )}
            >
              <Music size={12} />
              <span>Subdivisões</span>
            </button>

            <button
              onClick={() => setActiveTab('trainer')}
              className={cn(
                "flex-1 py-1.5 px-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-all cursor-pointer",
                activeTab === 'trainer'
                  ? "bg-gradient-to-b from-cyan-500 to-cyan-600 text-slate-950 shadow-md font-black"
                  : isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-300 hover:text-white"
              )}
            >
              <Zap size={12} />
              <span>Speed & Mute</span>
            </button>

            <button
              onClick={() => setActiveTab('timer')}
              className={cn(
                "flex-1 py-1.5 px-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-all cursor-pointer",
                activeTab === 'timer'
                  ? "bg-gradient-to-b from-cyan-500 to-cyan-600 text-slate-950 shadow-md font-black"
                  : isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-300 hover:text-white"
              )}
            >
              <Clock size={12} />
              <span>Timer</span>
            </button>
          </div>

          {/* TAB 1: RHYTHM SUBDIVISIONS & TIMBRE & VOLUME */}
          {activeTab === 'rhythm' && (
            <div className="w-full space-y-3 z-10">
              {/* Subdivisions Grid */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={cn("text-[9px] font-mono font-bold uppercase tracking-widest", isLight ? "text-slate-600" : "text-slate-300")}>
                    SUBDIVISÕES DE NOTAS POR PULSO
                  </span>
                  <span className="text-[8px] font-mono font-bold text-cyan-500 uppercase">
                    GUITAR & STUDY PRO
                  </span>
                </div>
                
                {/* Standard and Tuplets Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: 'quarter', name: '1x', sub: 'Semínima', symbol: '♩', badge: '1' },
                    { id: 'eighth', name: '2x', sub: 'Colcheia', symbol: '♫', badge: '2' },
                    { id: 'triplet', name: '3x', sub: 'Tercina', symbol: '3♩', badge: '3' },
                    { id: 'sixteenth', name: '4x', sub: 'Semicolcheia', symbol: '♬', badge: '4' },
                    { id: 'quintuplet', name: '5x', sub: 'Quiáltera 5', symbol: '5♩', badge: '5' },
                    { id: 'sextuplet', name: '6x', sub: 'Sextina', symbol: '6♩', badge: '6' },
                    { id: 'septuplet', name: '7x', sub: 'Septina 7', symbol: '7♩', badge: '7' },
                    { id: 'thirtysecond', name: '8x', sub: 'Fusa', symbol: '8♩', badge: '8' },
                    { id: 'shuffle', name: 'Swing', sub: 'Shuffle', symbol: '♪≈', badge: '~' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSubdivision(sub.id as MetronomeSubdivision)}
                      className={cn(
                        "py-2 px-1 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 shadow-sm relative group",
                        subdivision === sub.id
                          ? "bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md scale-105 z-10 ring-2 ring-cyan-300/60"
                          : isLight
                          ? "bg-white border-slate-300 hover:border-slate-400 text-slate-800 hover:bg-slate-50"
                          : "bg-slate-900/90 border-slate-700 hover:border-slate-600 text-slate-200 hover:bg-slate-800"
                      )}
                    >
                      <span className="text-base font-mono font-black leading-none">{sub.symbol}</span>
                      <span className="text-[10px] font-black mt-1 leading-tight">{sub.name}</span>
                      <span className="text-[8px] opacity-80 leading-tight font-medium truncate max-w-full px-0.5">{sub.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Timbres Selector */}
              <div className="space-y-1">
                <span className={cn("text-[9px] font-mono font-bold uppercase tracking-widest", isLight ? "text-slate-600" : "text-slate-300")}>
                  TIMBRE DO CLIQUE
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: 'woodblock', label: 'Woodblock' },
                    { id: 'digital', label: 'Digital Beep' },
                    { id: 'hihat', label: 'Hi-Hat (Bateria)' },
                    { id: 'cowbell', label: 'Cowbell 808' },
                  ].map((snd) => (
                    <button
                      key={snd.id}
                      onClick={() => setSound(snd.id as MetronomeSound)}
                      className={cn(
                        "py-1.5 px-1 rounded-xl border text-center transition-all cursor-pointer active:scale-95 text-[10px] font-black",
                        sound === snd.id
                          ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm"
                          : isLight
                          ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                          : "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"
                      )}
                    >
                      {snd.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume Slider */}
              <div className={cn(
                "p-2.5 rounded-2xl border flex items-center gap-3 transition-colors",
                isLight ? "bg-white border-slate-300 shadow-sm" : "bg-slate-900/90 border-slate-700"
              )}>
                <button
                  type="button"
                  onClick={() => onUpdateVolume(v => typeof v === 'number' ? (v === 0 ? 80 : 0) : 80)}
                  className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-cyan-500 hover:bg-black/10 cursor-pointer"
                >
                  {metronomeVolume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                    <span>VOLUME GERAL</span>
                    <span className="font-mono text-cyan-500 font-black">{metronomeVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={metronomeVolume}
                    onChange={(e) => onUpdateVolume(Number(e.target.value))}
                    className="w-full accent-cyan-500 h-1.5 bg-black/10 dark:bg-white/10 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SPEED TRAINER & BAR MUTE */}
          {activeTab === 'trainer' && (
            <div className="w-full space-y-3 z-10">
              {/* Speed Trainer Card */}
              <div className={cn(
                "p-3 rounded-2xl border space-y-2.5",
                isLight ? "bg-white border-slate-300" : "bg-slate-900/90 border-slate-700"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Zap size={14} className="text-cyan-500" />
                    <span className="text-[11px] font-black uppercase">Speed Trainer (Aceleração Progressiva)</span>
                  </div>
                  <button
                    onClick={() => {
                      if (!trainerEnabled) {
                        setTrainerEnabled(true);
                        setTrainerStartBpm(bpm);
                        if (trainerTargetBpm <= bpm) {
                          setTrainerTargetBpm(Math.min(300, bpm + 20));
                        }
                      } else {
                        setTrainerEnabled(false);
                      }
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-xl text-[9px] font-black uppercase transition-all cursor-pointer",
                      trainerEnabled ? "bg-emerald-600 text-white shadow-sm" : "bg-black/10 dark:bg-white/10 text-slate-400 hover:bg-black/20"
                    )}
                  >
                    {trainerEnabled ? "Ativado" : "Desativado"}
                  </button>
                </div>

                {trainerEnabled && (
                  <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      <div>
                        <label className="text-[8px] font-black uppercase text-slate-400">BPM Início</label>
                        <input
                          type="number"
                          value={trainerStartBpm}
                          onChange={(e) => setTrainerStartBpm(Number(e.target.value))}
                          className="w-full h-7 px-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase text-slate-400">BPM Alvo</label>
                        <input
                          type="number"
                          value={trainerTargetBpm}
                          onChange={(e) => setTrainerTargetBpm(Number(e.target.value))}
                          className="w-full h-7 px-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase text-slate-400">Passo (BPM)</label>
                        <select
                          value={trainerBpmStep}
                          onChange={(e) => setTrainerBpmStep(Number(e.target.value))}
                          className="w-full h-7 px-1 rounded-lg bg-black/5 dark:bg-white/5 border border-slate-300 dark:border-slate-700 text-[10px] font-bold text-center"
                        >
                          <option value={1}>+1 BPM</option>
                          <option value={2}>+2 BPM</option>
                          <option value={4}>+4 BPM</option>
                          <option value={5}>+5 BPM</option>
                          <option value={10}>+10 BPM</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase text-slate-400">A Cada (Comp.)</label>
                        <select
                          value={trainerBarInterval}
                          onChange={(e) => setTrainerBarInterval(Number(e.target.value))}
                          className="w-full h-7 px-1 rounded-lg bg-black/5 dark:bg-white/5 border border-slate-300 dark:border-slate-700 text-[10px] font-bold text-center"
                        >
                          <option value={1}>1 comp.</option>
                          <option value={2}>2 comp.</option>
                          <option value={4}>4 comp.</option>
                          <option value={8}>8 comp.</option>
                        </select>
                      </div>
                    </div>

                    {/* Presets & Start from beginning buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateBpm(trainerStartBpm);
                          barCounterRef.current = 0;
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <RotateCcw size={10} /> Iniciar de {trainerStartBpm} BPM
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTrainerBpmStep(2);
                          setTrainerBarInterval(2);
                        }}
                        className="px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 text-slate-400 hover:text-slate-200 text-[8px] font-bold uppercase cursor-pointer"
                      >
                        +2 BPM / 2 comp
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTrainerBpmStep(4);
                          setTrainerBarInterval(4);
                        }}
                        className="px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 text-slate-400 hover:text-slate-200 text-[8px] font-bold uppercase cursor-pointer"
                      >
                        +4 BPM / 4 comp
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTrainerBpmStep(5);
                          setTrainerBarInterval(1);
                        }}
                        className="px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 text-slate-400 hover:text-slate-200 text-[8px] font-bold uppercase cursor-pointer"
                      >
                        Sprint (+5 BPM / 1c)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bar Mute Card */}
              <div className={cn(
                "p-3 rounded-2xl border space-y-2",
                isLight ? "bg-white border-slate-300" : "bg-slate-900/90 border-slate-700"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="text-[11px] font-black uppercase">Bar Mute (Treino de Precisão)</span>
                  </div>
                  <button
                    onClick={() => setBarMuteEnabled(!barMuteEnabled)}
                    className={cn(
                      "px-2.5 py-1 rounded-xl text-[9px] font-black uppercase transition-all cursor-pointer",
                      barMuteEnabled ? "bg-amber-500 text-slate-950 font-black shadow-sm" : "bg-black/10 dark:bg-white/10 text-slate-400"
                    )}
                  >
                    {barMuteEnabled ? "Ativado" : "Desativado"}
                  </button>
                </div>

                {barMuteEnabled && (
                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <label className="text-[8px] font-black uppercase text-slate-400">Tocar com Som</label>
                      <select
                        value={barMutePlayBars}
                        onChange={(e) => setBarMutePlayBars(Number(e.target.value))}
                        className="w-full h-7 px-1 rounded-lg bg-black/5 dark:bg-white/5 border border-slate-300 dark:border-slate-700 text-[10px] font-bold text-center"
                      >
                        <option value={1}>1 Compasso Som</option>
                        <option value={2}>2 Compassos Som</option>
                        <option value={3}>3 Compassos Som</option>
                        <option value={4}>4 Compassos Som</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase text-slate-400">Silenciar (Mute)</label>
                      <select
                        value={barMuteSilentBars}
                        onChange={(e) => setBarMuteSilentBars(Number(e.target.value))}
                        className="w-full h-7 px-1 rounded-lg bg-black/5 dark:bg-white/5 border border-slate-300 dark:border-slate-700 text-[10px] font-bold text-center"
                      >
                        <option value={1}>1 Compasso Mudo</option>
                        <option value={2}>2 Compassos Mudo</option>
                        <option value={4}>4 Compassos Mudo</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PRACTICE TIMER */}
          {activeTab === 'timer' && (
            <div className="w-full space-y-3 z-10">
              <div className={cn(
                "p-3 rounded-2xl border flex flex-col items-center justify-center text-center",
                isLight ? "bg-white border-slate-300" : "bg-slate-900/90 border-slate-700"
              )}>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400">
                  TEMPO RESTANTE DE ESTUDO
                </span>
                <div className="text-4xl font-mono font-black text-cyan-500 tracking-tight my-0.5">
                  {timerRemainingSeconds !== null ? formatTimerDisplay(timerRemainingSeconds) : `${timerMinutes}:00`}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[5, 10, 15, 25].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => handleStartTimer(mins)}
                    className={cn(
                      "py-2 rounded-xl border text-xs font-black transition-all cursor-pointer active:scale-95 text-center",
                      isTimerRunning && timerMinutes === mins
                        ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-black"
                        : isLight
                        ? "bg-white border-slate-300 text-slate-700"
                        : "bg-slate-900 border-slate-700 text-slate-200"
                    )}
                  >
                    {mins} Min
                  </button>
                ))}
              </div>

              {isTimerRunning && (
                <button
                  onClick={handleStopTimer}
                  className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Cancelar Timer</span>
                </button>
              )}
            </div>
          )}

          {/* Bottom Footswitch Chassis Deck */}
          <div className={cn(
            "w-full flex items-center justify-between gap-3 pt-4 mt-3 border-t z-10 transition-colors",
            isLight ? "border-slate-300/80" : "border-slate-700/80"
          )}>
            {/* Secondary TAP TEMPO Stomp Button */}
            <div className="flex flex-col items-center flex-1">
              <button
                type="button"
                onClick={onTapTempo}
                className="relative group focus:outline-none cursor-pointer"
                title="Toque no ritmo para definir o BPM"
              >
                <div className={cn(
                  "w-16 h-16 sm:w-18 sm:h-18 rounded-full p-1.5 flex items-center justify-center border transition-all",
                  isLight
                    ? "bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 border-slate-300 shadow-md"
                    : "bg-gradient-to-b from-slate-600 via-slate-700 to-slate-900 border-slate-600 shadow-md"
                )}>
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-1 shadow-inner group-active:scale-90 transition-transform flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-500 flex flex-col items-center justify-center text-slate-950 font-mono font-black text-xs">
                      <Flame size={18} className="text-slate-950 animate-pulse" />
                      <span className="text-[9px] leading-none">TAP</span>
                    </div>
                  </div>
                </div>
              </button>
              <span className={cn(
                "text-[9px] font-mono font-black tracking-widest uppercase mt-1.5",
                isLight ? "text-slate-700" : "text-slate-300"
              )}>
                TAP TEMPO
              </span>
            </div>

            {/* Primary Heavy Duty 3D Chrome Stomp Switch */}
            <div className="flex flex-col items-center flex-1">
              <button
                type="button"
                onClick={onToggleMetronome}
                className="relative group focus:outline-none cursor-pointer"
                title={isMetronomeActive ? "Parar Metrônomo (Bypass)" : "Ligar Metrônomo"}
              >
                <div className={cn(
                  "w-20 h-20 sm:w-24 sm:h-24 rounded-full p-2 flex items-center justify-center border transition-all",
                  isLight
                    ? "bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 border-slate-400 shadow-[0_10px_20px_rgba(0,0,0,0.25),_inset_0_2px_4px_rgba(255,255,255,0.8)]"
                    : "bg-gradient-to-b from-slate-500 via-slate-700 to-slate-900 border-slate-600 shadow-[0_12px_25px_rgba(0,0,0,0.7),_inset_0_2px_4px_rgba(255,255,255,0.4)]"
                )}>
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 p-1 shadow-[0_4px_8px_rgba(0,0,0,0.8),_inset_0_2px_3px_rgba(255,255,255,0.9)] group-active:scale-95 transition-transform flex items-center justify-center">
                    <div className={cn(
                      "w-full h-full rounded-full flex flex-col items-center justify-center text-slate-900 shadow-inner transition-colors",
                      isMetronomeActive
                        ? "bg-gradient-to-tr from-rose-500 via-rose-400 to-rose-600 border border-rose-300"
                        : "bg-gradient-to-tr from-cyan-400 via-cyan-200 to-cyan-500 border border-cyan-300/80"
                    )}>
                      {isMetronomeActive ? (
                        <Pause className="w-7 h-7 text-white drop-shadow-sm animate-pulse" />
                      ) : (
                        <Play className="w-7 h-7 text-slate-950 drop-shadow-sm ml-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              </button>

              <span className={cn(
                "text-[9px] font-mono font-black tracking-widest uppercase mt-1.5",
                isLight ? "text-slate-700" : "text-slate-200"
              )}>
                {isMetronomeActive ? "STOP (PARAR)" : "START (LIGAR)"}
              </span>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
