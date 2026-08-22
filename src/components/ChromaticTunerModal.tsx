import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Radio,
  Sun,
  Moon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChromaticTunerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NoteInfo {
  name: string;
  octave: number;
  frequency: number;
  cents: number;
}

type TunerMode = 'chromatic' | 'guitar_standard' | 'guitar_drop_d' | 'guitar_dadgad' | 'bass_4';

interface PresetString {
  noteName: string;
  octave: number;
  frequency: number;
  label: string;
}

const PRESET_TUNINGS: Record<TunerMode, { name: string; strings: PresetString[] }> = {
  chromatic: {
    name: 'Cromático Livre',
    strings: []
  },
  guitar_standard: {
    name: 'Violão Padrão (E A D G B E)',
    strings: [
      { noteName: 'E', octave: 2, frequency: 82.41, label: '6ª - E (Mi grave)' },
      { noteName: 'A', octave: 2, frequency: 110.00, label: '5ª - A (Lá)' },
      { noteName: 'D', octave: 3, frequency: 146.83, label: '4ª - D (Ré)' },
      { noteName: 'G', octave: 3, frequency: 196.00, label: '3ª - G (Sol)' },
      { noteName: 'B', octave: 3, frequency: 246.94, label: '2ª - B (Si)' },
      { noteName: 'E', octave: 4, frequency: 329.63, label: '1ª - e (Mi agudo)' },
    ]
  },
  guitar_drop_d: {
    name: 'Violão Drop D (D A D G B E)',
    strings: [
      { noteName: 'D', octave: 2, frequency: 73.42, label: '6ª - D (Ré grave)' },
      { noteName: 'A', octave: 2, frequency: 110.00, label: '5ª - A (Lá)' },
      { noteName: 'D', octave: 3, frequency: 146.83, label: '4ª - D (Ré)' },
      { noteName: 'G', octave: 3, frequency: 196.00, label: '3ª - G (Sol)' },
      { noteName: 'B', octave: 3, frequency: 246.94, label: '2ª - B (Si)' },
      { noteName: 'E', octave: 4, frequency: 329.63, label: '1ª - e (Mi agudo)' },
    ]
  },
  guitar_dadgad: {
    name: 'Violão DADGAD (D A D G A D - Worship)',
    strings: [
      { noteName: 'D', octave: 2, frequency: 73.42, label: '6ª - D (Ré grave)' },
      { noteName: 'A', octave: 2, frequency: 110.00, label: '5ª - A (Lá)' },
      { noteName: 'D', octave: 3, frequency: 146.83, label: '4ª - D (Ré)' },
      { noteName: 'G', octave: 3, frequency: 196.00, label: '3ª - G (Sol)' },
      { noteName: 'A', octave: 3, frequency: 220.00, label: '2ª - A (Lá)' },
      { noteName: 'D', octave: 4, frequency: 293.66, label: '1ª - d (Ré agudo)' },
    ]
  },
  bass_4: {
    name: 'Contrabaixo 4 Cordas (E A D G)',
    strings: [
      { noteName: 'E', octave: 1, frequency: 41.20, label: '4ª - E (Mi grave)' },
      { noteName: 'A', octave: 1, frequency: 55.00, label: '3ª - A (Lá)' },
      { noteName: 'D', octave: 2, frequency: 73.42, label: '2ª - D (Ré)' },
      { noteName: 'G', octave: 2, frequency: 98.00, label: '1ª - G (Sol)' },
    ]
  }
};

const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const ChromaticTunerModal: React.FC<ChromaticTunerModalProps> = ({
  isOpen,
  onClose
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [tunerMode, setTunerMode] = useState<TunerMode>('guitar_standard');
  const [detectedNote, setDetectedNote] = useState<NoteInfo | null>(null);
  const [rawFreq, setRawFreq] = useState<number | null>(null);
  const [signalLevel, setSignalLevel] = useState<number>(0);
  const [activeStringIndex, setActiveStringIndex] = useState<number | null>(null);
  const [isPlayingReference, setIsPlayingReference] = useState<boolean>(false);
  const [refFrequency, setRefFrequency] = useState<number>(440);
  const [tunerTheme, setTunerTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('liloupro_tuner_theme') as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = useCallback(() => {
    setTunerTheme((prev) => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('liloupro_tuner_theme', nextTheme);
      return nextTheme;
    });
  }, []);

  // Audio Context refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Circular Audio Buffer for microphone stream
  const circularBufferRef = useRef<Float32Array>(new Float32Array(8192));
  const circularWritePointerRef = useRef<number>(0);

  // Simple Moving Average (SMA) buffers for frequency and cents stability
  const freqSmaBufferRef = useRef<number[]>([]);
  const centsSmaBufferRef = useRef<number[]>([]);

  // Smoothing and stability refs
  const smoothedCentsRef = useRef<number>(0);
  const silenceCounterRef = useRef<number>(0);
  const lastNoteNameRef = useRef<string | null>(null);
  const lastSignalLevelRef = useRef<number>(0);

  // Helper: Convert frequency to closest chromatic note
  const getNoteFromFrequency = useCallback((frequency: number): NoteInfo => {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    const midiNumber = Math.round(noteNum) + 69;
    const cents = Math.floor((noteNum - Math.round(noteNum)) * 100);
    const noteIndex = ((midiNumber % 12) + 12) % 12;
    const octave = Math.floor(midiNumber / 12) - 1;
    const targetFrequency = 440 * Math.pow(2, (midiNumber - 69) / 12);

    return {
      name: NOTE_STRINGS[noteIndex],
      octave,
      frequency: Number(targetFrequency.toFixed(2)),
      cents
    };
  }, []);

  // High-Precision YIN Pitch Detection Algorithm (Standard for Musical Instrument Tuning)
  const detectPitchYin = (buffer: Float32Array, sampleRate: number): number => {
    const bufferSize = buffer.length;
    const halfBuffer = Math.floor(bufferSize / 2);

    // 1. Calculate RMS energy
    let sumSq = 0;
    for (let i = 0; i < bufferSize; i++) {
      const v = buffer[i];
      sumSq += v * v;
    }
    const rms = Math.sqrt(sumSq / bufferSize);

    // Ultra-sensitive RMS threshold for acoustic guitar sustain (0.003)
    if (rms < 0.003) {
      return -1;
    }

    // 2. Difference function
    const yinBuffer = new Float32Array(halfBuffer);
    for (let tau = 0; tau < halfBuffer; tau++) {
      let sum = 0;
      for (let i = 0; i < halfBuffer; i++) {
        const delta = buffer[i] - buffer[i + tau];
        sum += delta * delta;
      }
      yinBuffer[tau] = sum;
    }

    // 3. Cumulative mean normalized difference function
    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < halfBuffer; tau++) {
      runningSum += yinBuffer[tau];
      yinBuffer[tau] = runningSum === 0 ? 1 : (yinBuffer[tau] * tau) / runningSum;
    }

    // 4. Thresholding - find first local minimum below threshold (avoids octave errors)
    const threshold = 0.20;
    const minTau = Math.max(2, Math.floor(sampleRate / 1400));
    const maxTau = Math.min(halfBuffer - 1, Math.floor(sampleRate / 35));
    let foundTau = -1;

    for (let tau = minTau; tau <= maxTau; tau++) {
      if (yinBuffer[tau] < threshold) {
        while (tau + 1 < maxTau && yinBuffer[tau + 1] < yinBuffer[tau]) {
          tau++;
        }
        foundTau = tau;
        break;
      }
    }

    // Fallback to global minimum if no valley below threshold (relaxed to 0.65 for guitar harmonics)
    if (foundTau === -1) {
      let minVal = 100;
      for (let tau = minTau; tau <= maxTau; tau++) {
        if (yinBuffer[tau] < minVal) {
          minVal = yinBuffer[tau];
          foundTau = tau;
        }
      }
      if (minVal > 0.65) {
        return -1; // Unclear pitch / background noise
      }
    }

    // 5. Parabolic interpolation for sub-sample accuracy
    let betterTau = foundTau;
    if (foundTau > 0 && foundTau < halfBuffer - 1) {
      const x1 = yinBuffer[foundTau - 1];
      const x2 = yinBuffer[foundTau];
      const x3 = yinBuffer[foundTau + 1];
      const denominator = x1 + x3 - 2 * x2;
      if (denominator !== 0) {
        betterTau = foundTau + (x1 - x3) / (2 * denominator);
      }
    }

    return sampleRate / betterTau;
  };

  const stopAudioCapture = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    circularBufferRef.current.fill(0);
    circularWritePointerRef.current = 0;
    freqSmaBufferRef.current = [];
    centsSmaBufferRef.current = [];
    smoothedCentsRef.current = 0;
    lastNoteNameRef.current = null;
    silenceCounterRef.current = 0;

    setIsListening(false);
    setDetectedNote(null);
    setRawFreq(null);
    setSignalLevel(0);
  }, []);

  const startAudioCapture = useCallback(async () => {
    setPermissionError(null);
    stopAudioCapture();

    try {
      // Must disable echoCancellation and noiseSuppression so browser audio pipeline
      // does not treat guitar sustain as background noise and gate the mic!
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      mediaStreamRef.current = stream;
      setIsListening(true);

      const chunkBuffer = new Float32Array(analyser.fftSize);
      const yinWindowBuffer = new Float32Array(analyser.fftSize);

      const FREQ_SMA_SIZE = 6;
      const CENTS_SMA_SIZE = 6;

      const detectLoop = () => {
        if (!analyserRef.current || !audioContextRef.current) return;

        // 1. Capture chunk and push into Circular Audio Buffer
        analyserRef.current.getFloatTimeDomainData(chunkBuffer);
        const circBuf = circularBufferRef.current;
        const circCap = circBuf.length;
        let wPtr = circularWritePointerRef.current;

        let sumSq = 0;
        for (let i = 0; i < chunkBuffer.length; i++) {
          const sample = chunkBuffer[i];
          sumSq += sample * sample;
          circBuf[wPtr] = sample;
          wPtr = (wPtr + 1) % circCap;
        }
        circularWritePointerRef.current = wPtr;

        // Calculate RMS Signal Level (0 to 100%)
        const rms = Math.sqrt(sumSq / chunkBuffer.length);
        const currentVol = Math.min(100, Math.max(0, Math.round((rms / 0.08) * 100)));
        if (Math.abs(currentVol - lastSignalLevelRef.current) >= 2 || (currentVol === 0 && lastSignalLevelRef.current !== 0)) {
          lastSignalLevelRef.current = currentVol;
          setSignalLevel(currentVol);
        }

        // Extract continuous window from circular buffer for YIN pitch detection
        let rPtr = (wPtr - analyser.fftSize + circCap) % circCap;
        for (let i = 0; i < analyser.fftSize; i++) {
          yinWindowBuffer[i] = circBuf[rPtr];
          rPtr = (rPtr + 1) % circCap;
        }

        const rawPitch = detectPitchYin(yinWindowBuffer, audioContextRef.current.sampleRate);

        if (rawPitch > 35 && rawPitch < 1400) {
          silenceCounterRef.current = 0;

          // 2. Simple Moving Average (SMA - Média Móvel Simples) for Frequency
          const fBuf = freqSmaBufferRef.current;
          fBuf.push(rawPitch);
          if (fBuf.length > FREQ_SMA_SIZE) {
            fBuf.shift();
          }
          const smaFreq = fBuf.reduce((sum, val) => sum + val, 0) / fBuf.length;

          setRawFreq(Number(smaFreq.toFixed(1)));
          const rawNote = getNoteFromFrequency(smaFreq);
          const fullNoteName = `${rawNote.name}${rawNote.octave}`;

          // 3. Simple Moving Average (SMA) for Cents / Needle Position
          const cBuf = centsSmaBufferRef.current;

          // Reset cents buffer on note change to maintain instantaneous note transition
          if (lastNoteNameRef.current && lastNoteNameRef.current !== fullNoteName) {
            cBuf.length = 0;
          }
          lastNoteNameRef.current = fullNoteName;

          cBuf.push(rawNote.cents);
          if (cBuf.length > CENTS_SMA_SIZE) {
            cBuf.shift();
          }
          const smaCents = cBuf.reduce((sum, val) => sum + val, 0) / cBuf.length;
          smoothedCentsRef.current = smaCents;

          setDetectedNote({
            ...rawNote,
            cents: Number(smaCents.toFixed(1))
          });
        } else {
          silenceCounterRef.current += 1;

          // Smooth hold and decay during silent intervals / string ringing out
          // Keep display stable for ~3 seconds (180 frames at 60fps) before clearing note
          if (silenceCounterRef.current > 90 && silenceCounterRef.current <= 180) {
            smoothedCentsRef.current *= 0.96; // slow, gentle decay to center zero
            setDetectedNote(prev => prev ? { ...prev, cents: Number(smoothedCentsRef.current.toFixed(1)) } : null);
          } else if (silenceCounterRef.current > 180) {
            freqSmaBufferRef.current = [];
            centsSmaBufferRef.current = [];
            lastNoteNameRef.current = null;
            setDetectedNote(null);
            setRawFreq(null);
          }
        }

        rafIdRef.current = requestAnimationFrame(detectLoop);
      };

      detectLoop();
    } catch (err) {
      console.error('Falha ao acessar microfone:', err);
      setPermissionError('Permissão para uso de microfone negada. Verifique as permissões de áudio no seu navegador.');
      setIsListening(false);
    }
  }, [getNoteFromFrequency, stopAudioCapture]);

  // Handle reference tone audio generator
  const stopReferenceTone = useCallback(() => {
    if (oscRef.current) {
      try {
        oscRef.current.stop();
        oscRef.current.disconnect();
      } catch (e) {}
      oscRef.current = null;
    }
    if (gainRef.current) {
      try {
        gainRef.current.disconnect();
      } catch (e) {}
      gainRef.current = null;
    }
    setIsPlayingReference(false);
  }, []);

  const playReferenceTone = useCallback((frequency: number) => {
    stopReferenceTone();
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioContextRef.current || new AudioCtx();
      if (!audioContextRef.current) audioContextRef.current = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      oscRef.current = osc;
      gainRef.current = gain;
      setRefFrequency(frequency);
      setIsPlayingReference(true);
    } catch (err) {
      console.error('Erro ao emitir tom de referência:', err);
    }
  }, [stopReferenceTone]);

  // Auto-start audio capture when modal opens, clean up on close
  useEffect(() => {
    if (isOpen) {
      startAudioCapture();
    } else {
      stopAudioCapture();
      stopReferenceTone();
    }
  }, [isOpen, startAudioCapture, stopAudioCapture, stopReferenceTone]);

  if (!isOpen) return null;

  // Calculate tuning status
  const getTuningStatus = () => {
    if (!detectedNote) {
      return {
        text: isListening ? 'OUVINDO... TOQUE UMA CORDA' : 'MODO BYPASS / MUTE',
        color: isListening ? 'text-amber-400' : 'text-slate-400',
        bg: 'bg-slate-950',
        border: isListening ? 'border-amber-500/40' : 'border-slate-800'
      };
    }
    const cents = detectedNote.cents;
    if (Math.abs(cents) <= 4) {
      return { text: 'AFINADO! PERFEITO', color: 'text-emerald-400', bg: 'bg-emerald-950/80', border: 'border-emerald-500' };
    }
    if (cents < -4) {
      return { text: 'MUITO BAIXO (APERTAR)', color: 'text-amber-400', bg: 'bg-amber-950/80', border: 'border-amber-500' };
    }
    return { text: 'MUITO ALTO (SOLTAR)', color: 'text-rose-400', bg: 'bg-rose-950/80', border: 'border-rose-500' };
  };

  const status = getTuningStatus();
  const currentPreset = PRESET_TUNINGS[tunerMode];
  const isTuned = !!detectedNote && Math.abs(detectedNote.cents) <= 4;
  const isLight = tunerTheme === 'light';

  return (
    <div className={cn(
      "fixed inset-0 z-[320] flex items-center justify-center p-3 sm:p-6 overflow-y-auto transition-colors duration-300",
      isLight ? "bg-slate-900/60 backdrop-blur-md" : "bg-black/85 backdrop-blur-md"
    )}>
      {/* 3D Boutique Guitar Pedal Enclosure Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="w-full max-w-[440px] relative my-auto select-none"
      >
        {/* Outer Metallic Enclosure Shell */}
        <div className={cn(
          "relative border-2 rounded-[36px] p-5 sm:p-7 overflow-hidden flex flex-col items-center transition-all duration-300",
          isLight
            ? "bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 border-slate-300/90 shadow-[0_20px_60px_rgba(0,0,0,0.25),_inset_0_2px_4px_rgba(255,255,255,0.9),_inset_0_-4px_8px_rgba(0,0,0,0.1)] text-slate-900"
            : "bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border-slate-500/90 shadow-[0_25px_60px_rgba(0,0,0,0.6),_inset_0_2px_4px_rgba(255,255,255,0.4),_inset_0_-4px_8px_rgba(0,0,0,0.4)] text-white"
        )}>
          
          {/* Subtle Brushed Metal Texture Lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.04] pointer-events-none" />

          {/* Top Edge Metallic Bevel Accent */}
          <div className={cn(
            "absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-slate-300/60 to-transparent",
            isLight && "via-white/80"
          )} />

          {/* 4 Corner Screws (3D Chrome Philips (+) Screws in Chassis Corners) */}
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

          {/* Top Center 9V DC Barrel Jack Socket */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center">
            <div className={cn(
              "px-3 py-1 rounded-full border shadow-inner flex items-center gap-1.5 transition-colors",
              isLight
                ? "bg-slate-200/90 border-slate-300 text-slate-700 shadow-sm"
                : "bg-slate-900 border-slate-600 text-slate-100 shadow-sm"
            )}>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.9)]" />
              </div>
              <span className={cn(
                "text-[9px] font-mono font-black tracking-widest uppercase",
                isLight ? "text-slate-700" : "text-slate-100"
              )}>
                9V DC ⚡
              </span>
            </div>
          </div>

          {/* Side Jack Sockets - Left (OUT) and Right (IN) */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 hidden sm:flex flex-col items-center">
            <div className="w-3.5 h-8 bg-gradient-to-r from-slate-400 to-slate-700 rounded-l-md border border-slate-900 shadow-md flex items-center justify-center">
              <div className="w-1.5 h-5 bg-slate-950 rounded-sm" />
            </div>
            <span className={cn("text-[8px] font-mono font-black mt-1 tracking-tighter", isLight ? "text-slate-600" : "text-slate-100")}>OUT</span>
          </div>
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 hidden sm:flex flex-col items-center">
            <div className="w-3.5 h-8 bg-gradient-to-l from-slate-400 to-slate-700 rounded-r-md border border-slate-900 shadow-md flex items-center justify-center">
              <div className="w-1.5 h-5 bg-slate-950 rounded-sm" />
            </div>
            <span className={cn("text-[8px] font-mono font-black mt-1 tracking-tighter", isLight ? "text-slate-600" : "text-slate-100")}>IN</span>
          </div>

          {/* Top Section Header: Theme Switcher & Close Button */}
          <div className="w-full flex items-center justify-between mb-2 z-10 pt-5 sm:pt-6 px-1">
            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border transition-all shadow-sm active:scale-95",
                isLight
                  ? "bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-800"
                  : "bg-slate-800 hover:bg-slate-700 border-slate-500 text-amber-300 font-black"
              )}
              title={isLight ? "Mudar para Modo Escuro" : "Mudar para Modo Claro"}
            >
              {isLight ? <Moon size={13} className="text-amber-700" /> : <Sun size={13} className="text-amber-300" />}
              <span>{isLight ? 'Modo Escuro' : 'Modo Claro'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-md active:scale-95 border",
                isLight
                  ? "bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-700 hover:text-slate-900"
                  : "bg-slate-800 hover:bg-slate-700 border-slate-500 text-slate-100 hover:text-white"
              )}
              title="Fechar Afinador"
            >
              <X size={16} />
            </button>
          </div>

          {/* Pedal Branding Banner */}
          <div className="text-center mb-4 z-10">
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
                  ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                  : "bg-emerald-500/30 text-emerald-300 border-emerald-400/50 shadow-sm"
              )}>
                TUNER
              </span>
            </div>
            <p className={cn(
              "text-[10px] font-mono font-bold tracking-widest uppercase mt-0.5",
              isLight ? "text-slate-600" : "text-slate-100"
            )}>
              BOUTIQUE STOMPBOX CHROMATIC TUNER
            </p>
          </div>

          {/* Status LED Ring Indicator */}
          <div className="flex items-center justify-center gap-2 mb-4 z-10">
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-inner transition-colors",
              isLight ? "bg-white border-slate-300/90 text-slate-800 shadow-sm" : "bg-slate-900/90 border-slate-700 text-slate-200"
            )}>
              <div className={cn(
                "w-3 h-3 rounded-full transition-all duration-300 shadow-lg",
                !isListening
                  ? "bg-slate-400 shadow-none"
                  : detectedNote && Math.abs(detectedNote.cents) <= 4
                  ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,1)] animate-pulse"
                  : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)]"
              )} />
              <span className={cn(
                "text-[10px] font-mono font-extrabold uppercase tracking-wide",
                isLight ? "text-slate-700" : "text-slate-200"
              )}>
                {!isListening ? 'MUTE / BYPASS' : detectedNote && Math.abs(detectedNote.cents) <= 4 ? 'PITCH LOCK' : 'CHECKING'}
              </span>
            </div>
          </div>

          {/* Tuning Mode Selector - Pedal Top Switcher */}
          <div className={cn(
            "w-full flex flex-wrap gap-1 p-1 rounded-2xl border shadow-inner mb-4 z-10 transition-colors",
            isLight ? "bg-slate-200/90 border-slate-300/90" : "bg-slate-900/90 border-slate-700/80"
          )}>
            {(Object.keys(PRESET_TUNINGS) as TunerMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setTunerMode(mode);
                  setActiveStringIndex(null);
                }}
                className={cn(
                  "flex-1 min-w-[70px] sm:min-w-[80px] px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all text-center tracking-tight",
                  tunerMode === mode
                    ? "bg-gradient-to-b from-emerald-500 to-emerald-600 text-slate-950 shadow-md font-black shadow-emerald-500/30"
                    : isLight
                    ? "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                    : "text-slate-200 hover:text-white hover:bg-slate-800/90"
                )}
              >
                {mode === 'guitar_standard' && 'Violão'}
                {mode === 'guitar_drop_d' && 'Drop D'}
                {mode === 'guitar_dadgad' && 'DADGAD'}
                {mode === 'chromatic' && 'Cromático'}
                {mode === 'bass_4' && 'Baixo'}
              </button>
            ))}
          </div>

          {/* Error Notice */}
          {permissionError && (
            <div className="w-full mb-4 p-3 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-start gap-2.5 text-rose-200 z-10">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-snug font-medium">
                {permissionError}
              </div>
            </div>
          )}

          {/* High Definition LCD Screen Display Box */}
          <div className={cn(
            "w-full border-[3px] rounded-3xl p-5 sm:p-6 relative flex flex-col items-center justify-center text-center overflow-hidden mb-5 min-h-[210px] z-10 transition-all duration-300",
            isTuned
              ? isLight
                ? "bg-gradient-to-b from-emerald-100 via-emerald-50 to-white border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.35),_inset_0_0_20px_rgba(16,185,129,0.2)]"
                : "bg-gradient-to-b from-emerald-950 via-emerald-900/95 to-slate-950 border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.55),_inset_0_0_35px_rgba(52,211,153,0.35)]"
              : isLight
              ? "bg-white border-slate-300 shadow-[inset_0_2px_8px_rgba(0,0,0,0.06),_0_2px_6px_rgba(0,0,0,0.04)]"
              : "bg-slate-950 border-slate-800/90 shadow-[inset_0_6px_20px_rgba(0,0,0,0.95),_0_0_1px_rgba(255,255,255,0.1)]"
          )}>
            {/* Screen Inner Glass Shimmer Effect */}
            <div className={cn(
              "absolute top-0 left-0 right-0 h-16 pointer-events-none",
              isLight ? "bg-gradient-to-b from-slate-200/30 to-transparent" : "bg-gradient-to-b from-white/[0.04] to-transparent"
            )} />

            {/* Tuned Green Ambient Pulse Overlay */}
            {isTuned && (
              <div className={cn("absolute inset-0 pointer-events-none animate-pulse", isLight ? "bg-emerald-500/10" : "bg-emerald-500/15")} />
            )}

            {/* Note Name Big HD OLED Display */}
            <div className="flex items-baseline justify-center gap-1.5 z-10">
              <span className={cn(
                "text-6xl sm:text-7xl font-black tracking-tight font-mono transition-all duration-300",
                isTuned
                  ? isLight
                    ? "text-emerald-700 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105"
                    : "text-emerald-100 drop-shadow-[0_0_30px_rgba(52,211,153,1)] scale-105"
                  : detectedNote
                  ? isLight
                    ? "text-slate-900 drop-shadow-sm"
                    : "text-white drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                  : isLight
                  ? "text-slate-400"
                  : "text-slate-600"
              )}>
                {detectedNote ? detectedNote.name : "--"}
              </span>
              <span className={cn(
                "text-2xl sm:text-3xl font-extrabold font-mono transition-colors duration-300",
                isTuned
                  ? isLight
                    ? "text-emerald-700"
                    : "text-emerald-300"
                  : detectedNote
                  ? isLight
                    ? "text-emerald-700 font-bold"
                    : "text-emerald-400/80"
                  : isLight
                  ? "text-slate-400"
                  : "text-slate-700"
              )}>
                {detectedNote ? detectedNote.octave : ""}
              </span>
            </div>

            {/* Target vs Detected Frequency */}
            <div className="mt-1 text-[11px] font-mono font-bold flex items-center gap-2.5 z-10">
              <span className={isTuned ? (isLight ? "text-emerald-800" : "text-emerald-200/90") : (isLight ? "text-slate-600" : "text-slate-400")}>
                Alvo: {detectedNote ? `${detectedNote.frequency} Hz` : '-- Hz'}
              </span>
              <span className={isTuned ? "text-emerald-500" : (isLight ? "text-slate-400" : "text-slate-600")}>•</span>
              <span className={isTuned ? (isLight ? "text-emerald-800 font-black" : "text-emerald-100 font-black drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]") : (isLight ? "text-emerald-700 font-extrabold" : "text-emerald-300 font-extrabold")}>
                In: {rawFreq && rawFreq > 0 ? `${rawFreq} Hz` : '-- Hz'}
              </span>
            </div>

            {/* Analog Needle Arc Gauge */}
            <div className="w-full max-w-[260px] sm:max-w-[290px] mt-3 mb-1 relative flex flex-col items-center">
              <svg viewBox="0 0 260 135" className="w-full h-auto overflow-visible">
                {/* Background Arc Line */}
                <path
                  d="M 43.4 70 A 100 100 0 0 1 216.6 70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  className={isLight ? "text-slate-300" : "text-slate-800"}
                />

                {/* Ticks and Labels */}
                {[-50, -40, -30, -25, -20, -10, 0, 10, 20, 25, 30, 40, 50].map((val) => {
                  const angleDeg = val * 1.2;
                  const rad = (angleDeg - 90) * (Math.PI / 180);
                  const isMajor = val === -50 || val === -25 || val === 0 || val === 25 || val === 50;
                  const isZero = val === 0;
                  const rOuter = 100;
                  const rInner = isMajor ? 82 : 88;
                  const rText = 66;
                  const x1 = 130 + rOuter * Math.cos(rad);
                  const y1 = 120 + rOuter * Math.sin(rad);
                  const x2 = 130 + rInner * Math.cos(rad);
                  const y2 = 120 + rInner * Math.sin(rad);
                  const tx = 130 + rText * Math.cos(rad);
                  const ty = 120 + rText * Math.sin(rad);

                  return (
                    <g key={val}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isZero ? (isLight ? '#059669' : '#34d399') : isMajor ? (isLight ? '#64748b' : '#94a3b8') : (isLight ? '#cbd5e1' : '#334155')}
                        strokeWidth={isZero ? '4' : isMajor ? '2.5' : '1.5'}
                        strokeLinecap="round"
                      />
                      {isMajor && (
                        <text
                          x={tx}
                          y={ty}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className={cn(
                            "text-[9px] font-mono font-extrabold fill-current",
                            isZero
                              ? (isLight ? "text-emerald-700 font-black" : "text-emerald-400 font-black")
                              : (isLight ? "text-slate-600" : "text-slate-300 font-bold")
                          )}
                        >
                          {val > 0 ? `+${val}` : val}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Center Zero Glowing Triangle Marker */}
                <polygon
                  points="130,16 124,24 136,24"
                  className={isLight ? "fill-emerald-600" : "fill-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,1)]"}
                />

                {/* Animated Needle Group - Fixed pivot at SVG coordinate (130, 120) */}
                <g
                  id="tuner-needle"
                  transform={`translate(130, 120) rotate(${detectedNote ? Math.max(-60, Math.min(60, detectedNote.cents * 1.2)) : 0})`}
                  style={{
                    transition: 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    willChange: 'transform'
                  }}
                >
                  {/* 3D Soft Drop Shadow for Needle */}
                  <line
                    x1="2"
                    y1="8"
                    x2="2"
                    y2="-92"
                    stroke={isLight ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.65)"}
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  {/* Main Needle Line with Counterweight Tail extending below pivot */}
                  <line
                    x1="0"
                    y1="14"
                    x2="0"
                    y2="-94"
                    stroke={
                      !detectedNote
                        ? (isLight ? "#94a3b8" : "#475569")
                        : Math.abs(detectedNote.cents) <= 4
                        ? (isLight ? "#059669" : "#34d399")
                        : Math.abs(detectedNote.cents) <= 15
                        ? (isLight ? "#d97706" : "#fbbf24")
                        : (isLight ? "#e11d48" : "#f43f5e")
                    }
                    strokeWidth="3"
                    strokeLinecap="round"
                    className={cn(
                      detectedNote && Math.abs(detectedNote.cents) <= 4 && (isLight ? "drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "drop-shadow-[0_0_14px_rgba(52,211,153,1)]")
                    )}
                  />
                  {/* Needle Tip Highlight Dot */}
                  <circle
                    cx="0"
                    cy="-94"
                    r="2.5"
                    fill={
                      !detectedNote
                        ? (isLight ? "#64748b" : "#94a3b8")
                        : Math.abs(detectedNote.cents) <= 4
                        ? (isLight ? "#047857" : "#a7f3d0")
                        : Math.abs(detectedNote.cents) <= 15
                        ? (isLight ? "#b45309" : "#fde68a")
                        : (isLight ? "#be123c" : "#fecdd3")
                    }
                  />
                </g>

                {/* 3D Metallic Center Pivot Hub - Locked at (130, 120) */}
                <g transform="translate(130, 120)">
                  <circle cx="1" cy="2" r="11" fill={isLight ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.7)"} />
                  <circle cx="0" cy="0" r="10" className={isLight ? "fill-slate-200 stroke-slate-400" : "fill-slate-900 stroke-slate-700"} strokeWidth="2" />
                  <circle
                    cx="0"
                    cy="0"
                    r="7"
                    className={cn(
                      "stroke-2 transition-colors duration-300",
                      isLight ? "fill-white" : "fill-slate-950",
                      !detectedNote
                        ? (isLight ? "stroke-slate-400" : "stroke-slate-700")
                        : Math.abs(detectedNote.cents) <= 4
                        ? (isLight ? "stroke-emerald-600" : "stroke-emerald-400")
                        : Math.abs(detectedNote.cents) <= 15
                        ? (isLight ? "stroke-amber-500" : "stroke-amber-400")
                        : (isLight ? "stroke-rose-600" : "stroke-rose-500")
                    )}
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="3.5"
                    fill={
                      !detectedNote
                        ? (isLight ? "#94a3b8" : "#64748b")
                        : Math.abs(detectedNote.cents) <= 4
                        ? (isLight ? "#059669" : "#34d399")
                        : Math.abs(detectedNote.cents) <= 15
                        ? (isLight ? "#d97706" : "#fbbf24")
                        : (isLight ? "#e11d48" : "#f43f5e")
                    }
                  />
                </g>
              </svg>
            </div>

            {/* Status Badges */}
            <div className="mt-2 flex items-center justify-center z-10">
              <span className={cn(
                "text-xs font-black px-3.5 py-1 rounded-full border tracking-wider uppercase shadow-md flex items-center gap-2 transition-all duration-300",
                isTuned
                  ? isLight
                    ? "bg-emerald-600 text-white border-emerald-700 font-black shadow-lg animate-pulse"
                    : "bg-emerald-400 text-slate-950 border-white font-black shadow-[0_0_20px_rgba(52,211,153,0.9)] animate-pulse"
                  : cn(status.color, status.border, isLight ? "bg-white" : "bg-slate-900")
              )}>
                {isTuned && (
                  <span className={cn("w-2 h-2 rounded-full animate-ping", isLight ? "bg-white" : "bg-slate-950")} />
                )}
                {!detectedNote && isListening && (
                  <Mic className={cn("w-3.5 h-3.5 animate-pulse", isLight ? "text-emerald-600" : "text-emerald-400")} />
                )}
                {!detectedNote && !isListening && (
                  <MicOff className={cn("w-3.5 h-3.5", isLight ? "text-slate-400" : "text-slate-400")} />
                )}
                {status.text} {detectedNote ? (detectedNote.cents > 0 ? `(+${detectedNote.cents})` : `(${detectedNote.cents})`) : ''}
              </span>
            </div>

            {/* Real-time Input Signal Level VU Meter */}
            <div className={cn(
              "w-full max-w-[280px] sm:max-w-[310px] mt-3.5 pt-2.5 border-t flex flex-col items-center gap-1.5 z-10 transition-colors",
              isLight ? "border-slate-200" : "border-slate-700/80"
            )}>
              <div className="w-full flex items-center justify-between text-[10px] font-mono font-bold px-0.5">
                <span className={cn("flex items-center gap-1", isLight ? "text-slate-600" : "text-slate-200")}>
                  <Radio className={cn("w-3 h-3", isListening && signalLevel > 5 ? (isLight ? "text-emerald-600 animate-pulse" : "text-emerald-400 animate-pulse") : (isLight ? "text-slate-400" : "text-slate-400"))} />
                  ENTRADA MIC:
                </span>
                <span className={cn(
                  "font-mono font-extrabold transition-colors duration-200",
                  !isListening
                    ? (isLight ? "text-slate-400" : "text-slate-400")
                    : signalLevel > 80
                    ? (isLight ? "text-rose-600 font-black animate-pulse" : "text-rose-400 font-black animate-pulse")
                    : signalLevel > 5
                    ? (isLight ? "text-emerald-700 font-extrabold" : "text-emerald-400 font-extrabold")
                    : (isLight ? "text-amber-700 font-extrabold" : "text-amber-400/90")
                )}>
                  {!isListening
                    ? 'DESLIGADO'
                    : signalLevel < 5
                    ? 'SINAL FRACO (Toque corda)'
                    : signalLevel > 80
                    ? 'ALTO / CLIP'
                    : `SINAL IDEAL (${signalLevel}%)`}
                </span>
              </div>

              {/* 12-Segment LED VU Meter */}
              <div className={cn(
                "w-full flex items-center gap-1 p-1.5 rounded-xl border shadow-inner transition-colors",
                isLight ? "bg-slate-100 border-slate-300" : "bg-slate-900 border-slate-700/90"
              )}>
                {Array.from({ length: 12 }).map((_, idx) => {
                  const threshold = ((idx + 1) / 12) * 100;
                  const isActive = isListening && signalLevel >= threshold;
                  const isRed = idx >= 10;
                  const isAmber = idx >= 7 && idx < 10;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex-1 h-2 rounded-sm transition-all duration-150",
                        isActive
                          ? isRed
                            ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]"
                            : isAmber
                            ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                            : isLight
                            ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                            : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                          : isLight
                          ? "bg-slate-200 border border-slate-300/60 opacity-60"
                          : "bg-slate-800 border border-slate-700/50 opacity-60"
                      )}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Instrument Preset Strings & Reference Audio Tone Generator */}
          {currentPreset.strings.length > 0 && (
            <div className="w-full space-y-2 mb-4 z-10">
              <div className="flex items-center justify-between px-1">
                <span className={cn("text-[10px] font-black uppercase tracking-widest", isLight ? "text-slate-700" : "text-slate-200")}>
                  Cordas ({currentPreset.name})
                </span>
                <span className={cn("text-[9px] font-mono", isLight ? "text-slate-500" : "text-slate-300")}>
                  Toque para som de diapasão
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {currentPreset.strings.map((str, idx) => {
                  const isSelected = activeStringIndex === idx;
                  const isDetectedString = isListening && !!detectedNote && (
                    (str.noteName === detectedNote.name && (str.octave === undefined || str.octave === detectedNote.octave)) ||
                    (rawFreq !== null && Math.abs(str.frequency - rawFreq) / str.frequency < 0.06)
                  );
                  const isStringTuned = isDetectedString && Math.abs(detectedNote?.cents || 99) <= 4;

                  return (
                    <button
                      key={`${str.noteName}-${idx}`}
                      onClick={() => {
                        setActiveStringIndex(idx);
                        playReferenceTone(str.frequency);
                      }}
                      className={cn(
                        "relative flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all text-center shadow-md overflow-hidden",
                        isStringTuned
                          ? (isLight
                            ? "bg-emerald-500 text-white border-emerald-600 ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-105 z-10"
                            : "bg-emerald-500 text-slate-950 border-emerald-300 ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)] scale-105 z-10 font-black")
                          : isDetectedString
                          ? (isLight
                            ? "bg-amber-100 border-amber-500 text-amber-950 ring-2 ring-amber-400/80 shadow-md scale-105 z-10"
                            : "bg-amber-500/30 border-amber-400 text-amber-200 ring-2 ring-amber-400/70 shadow-[0_0_15px_rgba(251,191,36,0.4)] scale-105 z-10 font-black")
                          : isSelected && isPlayingReference
                          ? (isLight ? "bg-emerald-100 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/40 scale-105 z-10" : "bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/50 scale-105 z-10")
                          : isLight
                          ? "bg-white border-slate-300 hover:border-slate-400 text-slate-800 active:scale-95 shadow-sm"
                          : "bg-slate-900/90 border-slate-700 hover:border-slate-600 text-slate-200 active:scale-95"
                      )}
                    >
                      {/* Top Corner Live Dot Indicator */}
                      {isDetectedString && (
                        <div className="absolute top-1 right-1 flex items-center justify-center">
                          <div className={cn(
                            "w-2 h-2 rounded-full animate-ping absolute opacity-75",
                            isStringTuned ? (isLight ? "bg-white" : "bg-slate-950") : "bg-amber-400"
                          )} />
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full relative z-10",
                            isStringTuned ? (isLight ? "bg-white" : "bg-slate-950") : "bg-amber-400"
                          )} />
                        </div>
                      )}

                      <span className={cn(
                        "text-base font-black font-mono transition-colors",
                        isStringTuned
                          ? (isLight ? "text-white" : "text-slate-950")
                          : isDetectedString
                          ? (isLight ? "text-amber-950" : "text-amber-300")
                          : isLight ? "text-slate-900" : "text-white"
                      )}>
                        {str.noteName}
                      </span>
                      <span className={cn(
                        "text-[9px] font-mono transition-colors",
                        isStringTuned
                          ? (isLight ? "text-emerald-100" : "text-slate-900 font-bold")
                          : isDetectedString
                          ? (isLight ? "text-amber-800 font-bold" : "text-amber-200/90")
                          : isLight ? "text-slate-600" : "text-slate-300"
                      )}>
                        {str.frequency}Hz
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reference Tone Audio Player feedback bar */}
          {isPlayingReference && (
            <div className={cn(
              "w-full mb-4 p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold z-10 shadow-lg transition-colors",
              isLight ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-emerald-950/80 border border-emerald-500/50 text-emerald-300"
            )}>
              <div className="flex items-center gap-2">
                <Volume2 className={cn("w-4 h-4 animate-bounce", isLight ? "text-emerald-700" : "text-emerald-400")} />
                <span className="text-[11px] font-mono">Diapasão ({refFrequency} Hz)</span>
              </div>
              <button
                onClick={stopReferenceTone}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-black transition-colors text-[10px] uppercase",
                  isLight ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                )}
              >
                Parar
              </button>
            </div>
          )}

          {/* Bottom Section: Diapasão Toggle + Heavy Metallic 3D Stomp Switch */}
          <div className={cn(
            "w-full flex flex-col items-center pt-2 border-t z-10 transition-colors",
            isLight ? "border-slate-300/80" : "border-slate-700/80"
          )}>
            {/* Diapasão 440Hz quick toggle */}
            <div className="w-full flex items-center justify-between mb-4">
              <span className={cn("text-[10px] font-mono font-bold uppercase tracking-widest", isLight ? "text-slate-600" : "text-slate-300")}>
                REFERÊNCIA A440
              </span>
              <button
                onClick={() => {
                  if (isPlayingReference) {
                    stopReferenceTone();
                  } else {
                    playReferenceTone(440);
                  }
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 border transition-all shadow-md",
                  isPlayingReference
                    ? (isLight ? "bg-rose-100 border-rose-300 text-rose-800" : "bg-rose-500/20 border-rose-500/50 text-rose-300")
                    : isLight
                    ? "bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                    : "bg-slate-900 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800"
                )}
              >
                {isPlayingReference ? <VolumeX size={12} /> : <Volume2 size={12} />}
                <span>{isPlayingReference ? "Silenciar 440Hz" : "Ouvir Lá 440Hz"}</span>
              </button>
            </div>

            {/* 3D Chrome Stomp Footswitch Button */}
            <div className="flex flex-col items-center">
              <button
                onClick={isListening ? stopAudioCapture : startAudioCapture}
                className="relative group focus:outline-none"
                title={isListening ? "Desativar Afinador (Bypass)" : "Ativar Afinador"}
              >
                {/* Outer Screw Ring Nut */}
                <div className={cn(
                  "w-20 h-20 sm:w-24 sm:h-24 rounded-full p-2 flex items-center justify-center border transition-all",
                  isLight
                    ? "bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 border-slate-400 shadow-[0_10px_20px_rgba(0,0,0,0.25),_inset_0_2px_4px_rgba(255,255,255,0.8)]"
                    : "bg-gradient-to-b from-slate-500 via-slate-700 to-slate-900 border-slate-600 shadow-[0_12px_25px_rgba(0,0,0,0.7),_inset_0_2px_4px_rgba(255,255,255,0.4)]"
                )}>
                  {/* Inner Stomp Plunger */}
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 p-1 shadow-[0_4px_8px_rgba(0,0,0,0.8),_inset_0_2px_3px_rgba(255,255,255,0.9)] group-active:scale-95 transition-transform flex items-center justify-center">
                    {/* Metal Cap Center */}
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-slate-400 via-slate-200 to-slate-500 border border-slate-300/80 flex flex-col items-center justify-center text-slate-900 shadow-inner">
                      {isListening ? (
                        <Mic className="w-6 h-6 text-emerald-600 drop-shadow-sm animate-pulse" />
                      ) : (
                        <MicOff className="w-6 h-6 text-slate-700 drop-shadow-sm" />
                      )}
                    </div>
                  </div>
                </div>
              </button>

              <span className={cn(
                "text-[10px] font-mono font-black tracking-widest uppercase mt-2",
                isLight ? "text-slate-700" : "text-slate-200"
              )}>
                {isListening ? 'BYPASS / DESLIGAR' : 'STOMP TO TUNE'}
              </span>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
