import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface LilouVoiceAssistantProps {
  onCommand?: (command: string) => void;
  onWake?: () => void;
  showButton?: boolean;
}

const FRIENDLY_GREETINGS = [
  "Oi! Como posso te ajudar?",
  "Opa, na escuta! Em que posso ajudar?",
  "Oi! Pronto pro som, o que você precisa?",
  "Olá! O que manda hoje?",
  "Opa! Na escuta da equipe, pode falar!"
];

// Helper to normalize strings for comparison (removes accents, punctuation)
function cleanText(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Check if transcript contains wake phrases with phonetic variations of "Lilou" / "Liou"
function checkWakeWord(rawText: string): boolean {
  const text = cleanText(rawText);
  if (!text) return false;

  const wakePrefixes = ['oi', 'ok', 'ola', 'ei', 'e ai', 'hey', 'ou'];
  const nameVariants = [
    'lilou', 'liou', 'leilou', 'lilu', 'leilu', 'lilo', 'liloo', 'nilou', 'milou', 'lelo', 'lylou', 'lyou', 'lili'
  ];

  if (text === 'lilou' || text === 'liou' || text === 'lilu') {
    return true;
  }

  for (const prefix of wakePrefixes) {
    for (const name of nameVariants) {
      if (text.includes(`${prefix} ${name}`)) {
        return true;
      }
    }
  }

  const fuzzyRegex = /\b(oi|ok|ola|ei|hey)\s+(li|lei|le|ly)[a-z]{1,4}(u|o|ou)\b/i;
  if (fuzzyRegex.test(text)) {
    return true;
  }

  return false;
}

export const LilouVoiceAssistant: React.FC<LilouVoiceAssistantProps> = ({ 
  onCommand, 
  onWake, 
  showButton = true 
}) => {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isAwake, setIsAwake] = useState(false);
  const [isHearingVoice, setIsHearingVoice] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const isAwakeRef = useRef<boolean>(false);
  const awakeTimeoutRef = useRef<any>(null);
  const hearingVoiceTimeoutRef = useRef<any>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isAwakeRef.current = isAwake;
  }, [isAwake]);

  // Speech Synthesis helper with high-fidelity Gemini TTS & natural Brazilian Portuguese MALE voice selection
  const speakNatural = useCallback((text: string) => {
    if (typeof window === 'undefined') return;

    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch {}
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const clean = text
      .replace(/\*\*/g, '')
      .replace(/[#_*~`]/g, '')
      .replace(/🎙️|🎵|📖|🗓️|➕|📺|✓/g, '')
      .trim();
    if (!clean) return;

    const fallbackSpeak = () => {
      if (!('speechSynthesis' in window)) return;
      try {
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.02;
        utterance.pitch = 1.06; // Timbre jovem, claro e articulado

        const voices = window.speechSynthesis.getVoices();
        const ptVoices = voices.filter(v => 
          v.lang === 'pt-BR' || v.lang === 'pt_BR' || v.lang.toLowerCase().startsWith('pt')
        );

        // Desqualifica vozes femininas e vozes robóticas antigas/roucas (Daniel, etc.)
        const femaleKeywords = ['maria', 'francisca', 'luciana', 'helena', 'leticia', 'letícia', 'fernanda', 'vitória', 'vitoria', 'camila', 'zira', 'female', 'mulher', 'google português', 'google portugues', '#female', '-female'];
        const oldRoboticKeywords = ['daniel', 'carlos', 'ricardo', 'david', 'george', 'alvaro', 'álvaro', 'bernardo'];
        const maleKeywords = ['antonio', 'antônio', 'thiago', 'tiago', 'felipe', 'arthur', 'jorge', 'rodrigo', 'fabio', 'fábio', 'lucas', '#male', '-male'];

        const maleOnlyVoices = ptVoices.filter(v => {
          const name = `${v.name} ${v.voiceURI || ''}`.toLowerCase();
          return !femaleKeywords.some(k => name.includes(k)) && !oldRoboticKeywords.some(k => name.includes(k));
        });

        const pool = maleOnlyVoices.length > 0 ? maleOnlyVoices : ptVoices;
        const bestVoice = 
          pool.find(v => (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('neural') || v.name.toLowerCase().includes('online')) && maleKeywords.some(k => v.name.toLowerCase().includes(k))) ||
          pool.find(v => maleKeywords.some(k => v.name.toLowerCase().includes(k))) ||
          pool.find(v => (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('neural'))) ||
          pool[0];

        if (bestVoice) {
          utterance.voice = bestVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("SpeechSynthesis error:", e);
      }
    };

    const cacheKey = clean.toLowerCase();
    const cached = ttsCacheRef.current.get(cacheKey);
    if (cached) {
      try {
        const audio = new Audio(`data:audio/wav;base64,${cached}`);
        currentAudioRef.current = audio;
        audio.play().catch(() => fallbackSpeak());
        return;
      } catch {
        fallbackSpeak();
        return;
      }
    }

    fetch('/api/assistant/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('TTS server error');
        const data = await res.json();
        if (data?.audioBase64) {
          ttsCacheRef.current.set(cacheKey, data.audioBase64);
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          currentAudioRef.current = audio;
          audio.play().catch(() => fallbackSpeak());
        } else {
          fallbackSpeak();
        }
      })
      .catch(() => {
        fallbackSpeak();
      });
  }, []);

  // Pre-load voices on mount as browsers load voices asynchronously
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      };
    }
  }, []);

  // Handle hotword trigger
  const triggerAwake = useCallback(() => {
    setIsAwake(true);
    isAwakeRef.current = true;
    setIsHearingVoice(false);

    const greeting = FRIENDLY_GREETINGS[Math.floor(Math.random() * FRIENDLY_GREETINGS.length)];
    speakNatural(greeting);

    // Open main assistant panel directly and start live listening with transcription
    if (onWake) {
      onWake();
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('liloupro:open-assistant-voice'));
    }

    if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current);
    awakeTimeoutRef.current = setTimeout(() => {
      setIsAwake(false);
      isAwakeRef.current = false;
    }, 8000);
  }, [speakNatural, onWake]);

  // Stop audio stream and analyser
  const stopAudioAnalyser = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    setAudioLevel(0);
    setIsHearingVoice(false);
  }, []);

  // Start real-time audio level monitoring
  const startAudioAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      });
      mediaStreamRef.current = stream;
      setPermissionError(null);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!isListeningRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((average / 90) * 100));
        setAudioLevel(normalized);

        if (normalized > 12) {
          setIsHearingVoice(true);
          if (hearingVoiceTimeoutRef.current) clearTimeout(hearingVoiceTimeoutRef.current);
          hearingVoiceTimeoutRef.current = setTimeout(() => {
            setIsHearingVoice(false);
          }, 800);
        }

        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
      return true;
    } catch (err: any) {
      console.warn("Microphone access error:", err);
      setPermissionError("Permissão de microfone necessária");
      return false;
    }
  }, []);

  // Initialize Speech Recognition instance
  const initSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: any) => {
      setIsHearingVoice(true);
      if (hearingVoiceTimeoutRef.current) clearTimeout(hearingVoiceTimeoutRef.current);
      hearingVoiceTimeoutRef.current = setTimeout(() => {
        setIsHearingVoice(false);
      }, 900);

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const text = item[0].transcript;

        let foundWakeWord = checkWakeWord(text);
        if (!foundWakeWord && item.length > 1) {
          for (let a = 1; a < item.length; a++) {
            if (checkWakeWord(item[a].transcript)) {
              foundWakeWord = true;
              break;
            }
          }
        }

        if (item.isFinal) {
          if (foundWakeWord) {
            triggerAwake();
            return;
          }

          if (isAwakeRef.current) {
            if (onCommand) {
              onCommand(text);
            }
            if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current);
            awakeTimeoutRef.current = setTimeout(() => {
              setIsAwake(false);
              isAwakeRef.current = false;
            }, 6000);
          }
        } else {
          if (foundWakeWord) {
            triggerAwake();
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setPermissionError('Microfone bloqueado no navegador');
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {
          setTimeout(() => {
            if (isListeningRef.current) {
              try { recognition.start(); } catch (err) {}
            }
          }, 250);
        }
      }
    };

    return recognition;
  }, [triggerAwake, onCommand]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      stopAudioAnalyser();
      if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current);
      if (hearingVoiceTimeoutRef.current) clearTimeout(hearingVoiceTimeoutRef.current);
    };
  }, [stopAudioAnalyser]);

  // Toggle listening ON/OFF directly on 1-click
  const handleToggle = async () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('liloupro:open-assistant-voice'));
    }
    if (isListening) {
      setIsListening(false);
      isListeningRef.current = false;
      setIsAwake(false);
      isAwakeRef.current = false;
      setIsHearingVoice(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      stopAudioAnalyser();
      if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current);
      if (hearingVoiceTimeoutRef.current) clearTimeout(hearingVoiceTimeoutRef.current);
    } else {
      setPermissionError(null);
      const audioSuccess = await startAudioAnalyser();
      if (!audioSuccess) {
        return;
      }

      let recog = recognitionRef.current;
      if (!recog) {
        recog = initSpeechRecognition();
        recognitionRef.current = recog;
      }

      if (recog) {
        try {
          recog.start();
          setIsListening(true);
          isListeningRef.current = true;
        } catch (e) {
          console.error("Speech recognition start failed:", e);
        }
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  // If we should not show the visual button, run in background voice mode
  if (!showButton) {
    return null;
  }

  const buttonBgColor = !isListening
    ? 'bg-slate-800 text-white/70 hover:text-white hover:bg-slate-700 border border-white/10'
    : isAwake
    ? 'bg-emerald-500 text-white shadow-emerald-500/60 ring-4 ring-emerald-400/40'
    : isHearingVoice
    ? 'bg-amber-500 text-slate-950 font-black shadow-amber-500/70 ring-4 ring-amber-400/50 scale-105'
    : 'bg-brand text-white shadow-brand/50';

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end pointer-events-auto">
      {/* Permission Error Tooltip if blocked */}
      {permissionError && (
        <div className="mb-2 bg-red-950/90 text-red-200 border border-red-500/40 text-xs px-3 py-1.5 rounded-xl shadow-lg">
          {permissionError}
        </div>
      )}

      {/* Button with Instant Color-Shifting Feedback */}
      <button
        type="button"
        onClick={handleToggle}
        className={`relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full shadow-2xl transition-all duration-200 transform active:scale-95 cursor-pointer ${buttonBgColor}`}
        title={
          isListening 
            ? isHearingVoice 
              ? "Lilou ouvindo sua voz agora!" 
              : "Lilou em modo de escuta. Clique para desligar."
            : "Ativar comando de voz da Lilou ('Oi Lilou')"
        }
      >
        {/* Dynamic audio waves / glow */}
        {isListening && (
          <span 
            className={`absolute inset-0 rounded-full pointer-events-none transition-all duration-75 ${
              isAwake 
                ? 'border-2 border-emerald-400 animate-ping' 
                : isHearingVoice 
                ? 'border-2 border-amber-300 animate-ping' 
                : 'border border-brand'
            }`}
            style={{
              transform: `scale(${1 + (audioLevel / 180)})`,
              opacity: audioLevel > 10 ? 0.8 : 0.2
            }}
          />
        )}

        {isListening ? (
          <Mic size={22} className={isHearingVoice ? 'scale-115 transition-transform text-slate-950' : ''} />
        ) : (
          <MicOff size={20} />
        )}

        {/* Small top-right status dot */}
        <span
          className={`absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 transition-colors duration-150 ${
            isListening 
              ? isAwake 
                ? 'bg-emerald-400' 
                : isHearingVoice 
                ? 'bg-amber-400' 
                : 'bg-green-500' 
              : 'bg-slate-500'
          }`}
        />
      </button>
    </div>
  );
};
