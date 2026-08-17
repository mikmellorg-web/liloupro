import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Bluetooth, Radio, Zap, Check, X, Play, Pause, 
  ChevronsDown, ChevronRight, ChevronLeft, Plus, Minus, HelpCircle, 
  Sparkles, RefreshCw, Smartphone, CheckCircle2, AlertCircle, Laptop
} from 'lucide-react';
import { BossPedalIcon } from './BossPedalIcon';

export interface FootswitchConfig {
  enabled: boolean;
  preset: 'arrows' | 'page_up_down' | 'space_enter' | 'custom' | 'midi' | 'mvave_chocolate';
  autoNextSongAtBottom: boolean;
  mappings: {
    nextPage: string[];       // e.g. ['ArrowDown', 'PageDown', ' ']
    prevPage: string[];       // e.g. ['ArrowUp', 'PageUp']
    toggleAutoScroll: string[]; // e.g. [' ', 'Enter']
    nextSong: string[];       // e.g. ['ArrowRight', 'n', 'N']
    prevSong: string[];       // e.g. ['ArrowLeft', 'p', 'P']
    speedUp: string[];        // e.g. ['+', '=']
    speedDown: string[];      // e.g. ['-', '_']
  };
}

export const MVAVE_CHOCOLATE_DEFAULT_MAPPINGS: FootswitchConfig['mappings'] = {
  nextPage: ['ArrowDown', 'PageDown', '2', 'Digit2', 'b', 'B', 'KeyB', 's', 'S', 'KeyS', 'j', 'J', 'KeyJ', 'MediaTrackNext', 'MIDI:192:1', 'MIDI:176:49', 'MIDI:176:2', 'MIDI:176:65', 'MIDI:144:1', 'MIDI:144:49', 'MIDI:144:62'],
  prevPage: ['ArrowUp', 'PageUp', '1', 'Digit1', 'a', 'A', 'KeyA', 'w', 'W', 'KeyW', 'k', 'K', 'KeyK', 'MediaTrackPrevious', 'MIDI:192:0', 'MIDI:176:48', 'MIDI:176:1', 'MIDI:176:64', 'MIDI:144:0', 'MIDI:144:48', 'MIDI:144:60'],
  toggleAutoScroll: [' ', 'Space', '3', 'Digit3', 'c', 'C', 'KeyC', 'e', 'E', 'KeyE', 'l', 'L', 'KeyL', 'MediaPlayPause', 'MIDI:192:2', 'MIDI:176:50', 'MIDI:176:3', 'MIDI:176:66', 'MIDI:144:2', 'MIDI:144:50', 'MIDI:144:64'],
  nextSong: ['Enter', 'ArrowRight', 'n', 'N', 'KeyN', '4', 'Digit4', 'd', 'D', 'KeyD', 'r', 'R', 'KeyR', ';', 'MIDI:192:3', 'MIDI:176:51', 'MIDI:176:4', 'MIDI:176:67', 'MIDI:144:3', 'MIDI:144:51', 'MIDI:144:65'],
  prevSong: ['ArrowLeft', 'p', 'P', 'KeyP'],
  speedUp: ['+', '='],
  speedDown: ['-', '_'],
};

export const DEFAULT_FOOTSWITCH_CONFIG: FootswitchConfig = {
  enabled: true,
  preset: 'mvave_chocolate',
  autoNextSongAtBottom: true,
  mappings: MVAVE_CHOCOLATE_DEFAULT_MAPPINGS
};

interface FootswitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FootswitchConfig;
  onUpdateConfig: (newConfig: FootswitchConfig) => void;
  onTestTrigger?: (actionName: string) => void;
  activePedalButton?: 'A' | 'B' | 'C' | 'D' | null;
}

export function FootswitchModal({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onTestTrigger,
  activePedalButton
}: FootswitchModalProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'presets' | 'guide'>('config');
  const [learningAction, setLearningAction] = useState<keyof FootswitchConfig['mappings'] | null>(null);
  const [lastDetectedKey, setLastDetectedKey] = useState<string | null>(null);
  const [midiStatus, setMidiStatus] = useState<'unsupported' | 'disconnected' | 'connected'>('unsupported');
  const [midiDeviceName, setMidiDeviceName] = useState<string>('');

  // Save changes to localStorage automatically
  const handleSave = (updated: FootswitchConfig) => {
    onUpdateConfig(updated);
    try {
      localStorage.setItem('lilo-footswitch-config', JSON.stringify(updated));
    } catch (e) {
      console.error('Erro ao salvar configuração do footswitch:', e);
    }
  };

  // Check Web MIDI support
  useEffect(() => {
    if (typeof navigator !== 'undefined' && (navigator as any).requestMIDIAccess) {
      setMidiStatus('disconnected');
    }
  }, []);

  const handleConnectMidi = async () => {
    if (typeof navigator === 'undefined' || !(navigator as any).requestMIDIAccess) {
      alert('O seu navegador não possui suporte à API Web MIDI. Para pedais MIDI via Bluetooth, recomendamos usar o modo Teclado Bluetooth (HID), compatível com 100% dos navegadores.');
      return;
    }

    try {
      const midiAccess = await (navigator as any).requestMIDIAccess({ sysex: false });
      let foundDevice = false;
      const inputs = midiAccess.inputs.values();
      for (const input of inputs) {
        foundDevice = true;
        setMidiDeviceName(input.name || 'Pedal MIDI Bluetooth');
        setMidiStatus('connected');
        
        input.onmidimessage = (message: any) => {
          const [status, data1, data2] = message.data;
          // CC (Control Change) or PC (Program Change) or Note On
          if ((status >= 176 && status <= 191) || (status >= 192 && status <= 207) || (status >= 144 && status <= 159)) {
            if (data2 > 0 || status >= 192) { // Button press
              const keyName = `MIDI:${status}:${data1}`;
              setLastDetectedKey(keyName);
              if (learningAction) {
                const currentList = config.mappings[learningAction];
                if (!currentList.includes(keyName)) {
                  handleSave({
                    ...config,
                    preset: 'custom',
                    mappings: {
                      ...config.mappings,
                      [learningAction]: [keyName, ...currentList.slice(0, 3)]
                    }
                  });
                }
                setLearningAction(null);
              }
            }
          }
        };
      }

      if (!foundDevice) {
        alert('Nenhum pedal MIDI conectado encontrado. Verifique se o pedal está ligado e pareado com o Bluetooth do seu dispositivo.');
      }
    } catch (err) {
      console.error('Erro ao conectar Web MIDI:', err);
      alert('Não foi possível acessar dispositivos MIDI. Verifique as permissões do navegador.');
    }
  };

  // Keyboard learning listener
  useEffect(() => {
    if (!isOpen) {
      setLearningAction(null);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !learningAction) {
        return;
      }

      const keyName = e.key === ' ' ? 'Space' : e.key;
      setLastDetectedKey(keyName);

      if (learningAction) {
        e.preventDefault();
        e.stopPropagation();

        const currentList = config.mappings[learningAction];
        if (!currentList.includes(keyName)) {
          handleSave({
            ...config,
            preset: 'custom',
            mappings: {
              ...config.mappings,
              [learningAction]: [keyName, ...currentList.filter(k => k !== keyName).slice(0, 5)]
            }
          });
        }
        setLearningAction(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, learningAction, config]);

  const findMappedActionForSignal = (sig: string | null): string | null => {
    if (!sig) return null;
    const s = sig.toLowerCase();
    for (const [actionKey, keys] of Object.entries(config.mappings)) {
      if ((keys as string[]).some(k => k.toLowerCase() === s)) {
        return actionKey;
      }
    }
    return null;
  };

  const handleQuickBind = (actionKey: keyof FootswitchConfig['mappings'], keyToBind: string) => {
    const currentList = config.mappings[actionKey] || [];
    if (!currentList.includes(keyToBind)) {
      handleSave({
        ...config,
        preset: 'custom',
        mappings: {
          ...config.mappings,
          [actionKey]: [keyToBind, ...currentList.slice(0, 5)]
        }
      });
    }
  };

  if (!isOpen) return null;

  const applyPreset = (presetName: FootswitchConfig['preset']) => {
    let newMappings = { ...DEFAULT_FOOTSWITCH_CONFIG.mappings };

    if (presetName === 'arrows') {
      newMappings = {
        nextPage: ['ArrowDown', 'PageDown'],
        prevPage: ['ArrowUp', 'PageUp'],
        toggleAutoScroll: [' ', 'Enter'],
        nextSong: ['ArrowRight', 'n', 'N'],
        prevSong: ['ArrowLeft', 'p', 'P'],
        speedUp: ['+', '='],
        speedDown: ['-', '_'],
      };
    } else if (presetName === 'page_up_down') {
      newMappings = {
        nextPage: ['PageDown', 'ArrowDown', ' '],
        prevPage: ['PageUp', 'ArrowUp'],
        toggleAutoScroll: ['Enter', 'b'],
        nextSong: ['ArrowRight', 'n'],
        prevSong: ['ArrowLeft', 'p'],
        speedUp: ['+'],
        speedDown: ['-'],
      };
    } else if (presetName === 'space_enter') {
      newMappings = {
        nextPage: [' ', 'PageDown', 'ArrowDown'],
        prevPage: ['ArrowUp', 'PageUp'],
        toggleAutoScroll: ['Enter'],
        nextSong: ['ArrowRight', 'n'],
        prevSong: ['ArrowLeft', 'p'],
        speedUp: ['+'],
        speedDown: ['-'],
      };
    } else if (presetName === 'mvave_chocolate') {
      newMappings = { ...MVAVE_CHOCOLATE_DEFAULT_MAPPINGS };
    }

    handleSave({
      ...config,
      preset: presetName,
      mappings: newMappings
    });
  };

  const actionLabels: Record<keyof FootswitchConfig['mappings'], { title: string; desc: string; icon: any }> = {
    nextPage: {
      title: 'Avançar Página / Rolar Baixo',
      desc: 'Pise no pedal direito para rolar a cifra para baixo de forma suave no altar.',
      icon: ChevronsDown
    },
    prevPage: {
      title: 'Voltar Página / Rolar Cima',
      desc: 'Pise no pedal esquerdo para rolar a cifra de volta para o início.',
      icon: ChevronUpIcon
    },
    toggleAutoScroll: {
      title: 'Ligar / Pausar Auto-Scroll',
      desc: 'Aciona ou pausa a rolagem automática inteligente com um toque de pedal.',
      icon: Play
    },
    nextSong: {
      title: 'Próxima Música do Roteiro',
      desc: 'Avança direto para a próxima canção na lista do culto ou ensaio.',
      icon: ChevronRight
    },
    prevSong: {
      title: 'Música Anterior do Roteiro',
      desc: 'Retorna imediatamente para a canção anterior da lista.',
      icon: ChevronLeft
    },
    speedUp: {
      title: 'Aumentar Velocidade (BPM +)',
      desc: 'Acelera ligeiramente a rolagem automática em tempo real.',
      icon: Plus
    },
    speedDown: {
      title: 'Diminuir Velocidade (BPM -)',
      desc: 'Desacelera a rolagem automática em canções mais cadenciadas.',
      icon: Minus
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-3 sm:p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 border border-brand/40 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-white">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand via-blue-500 to-sky-400 flex items-center justify-center shadow-lg shadow-brand/20">
              <BossPedalIcon size={22} className="text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg tracking-tight">Pedal & Footswitch Bluetooth</h2>
                <span className="bg-brand/20 text-brand-light text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-brand/30">
                  LiLouPro Smart
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Controle cifras, rolagem e páginas com pedais AirTurn, PageFlip, iRig, M-VAVE ou MIDI
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status bar */}
        <div className="px-5 py-3 bg-brand/10 border-b border-brand/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.enabled ? 'bg-emerald-400' : 'bg-rose-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.enabled ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="font-extrabold">
              {config.enabled ? 'Footswitch Ativado (Pronto para o Altar)' : 'Footswitch Desativado'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {lastDetectedKey && (
              <span className="bg-black/40 px-2.5 py-1 rounded-lg border border-white/10 font-mono text-[11px] text-amber-300">
                Último sinal: <strong>{lastDetectedKey}</strong>
              </span>
            )}
            <button
              onClick={() => handleSave({ ...config, enabled: !config.enabled })}
              className={`px-3 py-1 rounded-lg font-black text-xs uppercase tracking-wider transition-all ${
                config.enabled
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              {config.enabled ? 'Desativar' : 'Ativar Pedal'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-black/20 px-5">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'config'
                ? 'text-brand-light border-brand'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Radio size={14} /> Mapeamento de Pedais
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'presets'
                ? 'text-brand-light border-brand'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Zap size={14} /> Modelos & Presets
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'text-brand-light border-brand'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <HelpCircle size={14} /> Como Conectar no Culto
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          
          {/* TAB 1: Config & Mapping */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              
              {/* Opção Inteligente de Transição de Música */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-sm text-white">
                    Avançar para a Próxima Música no fim da Página
                  </h4>
                  <p className="text-xs text-slate-400">
                    Ao pisar em "Avançar" quando a cifra já estiver no final, o LiLouPro muda automaticamente para a próxima canção do roteiro do culto.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSave({ ...config, autoNextSongAtBottom: !config.autoNextSongAtBottom })}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    config.autoNextSongAtBottom ? 'bg-brand' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    config.autoNextSongAtBottom ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Monitor Ao Vivo de Pedal & Auto-Mapeamento Rápido */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-emerald-950/60 border-2 border-amber-500/40 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                      📡 Teste e Diagnóstico do Pedal
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Pise em qualquer botão para testar
                  </span>
                </div>

                {!lastDetectedKey ? (
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
                    <p className="text-xs text-slate-300 font-medium">
                      Pressione/pise em um dos botões do seu pedal M-VAVE ou teclado agora para identificar o sinal.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-black/60 border border-amber-500/40 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Sinal Recebido:</span>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/50 font-mono font-bold text-amber-300 text-sm">
                          {lastDetectedKey}
                        </span>
                      </div>
                      {findMappedActionForSignal(lastDetectedKey) ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          ✅ Já cadastrado no{' '}
                          {findMappedActionForSignal(lastDetectedKey) === 'prevPage' && 'Botão A (Voltar Página)'}
                          {findMappedActionForSignal(lastDetectedKey) === 'nextPage' && 'Botão B (Avançar Página)'}
                          {findMappedActionForSignal(lastDetectedKey) === 'toggleAutoScroll' && 'Botão C (Auto-Scroll)'}
                          {findMappedActionForSignal(lastDetectedKey) === 'nextSong' && 'Botão D (Próxima Música)'}
                          {findMappedActionForSignal(lastDetectedKey) === 'prevSong' && 'Música Anterior'}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-400">
                          ⚠️ Código novo detectado! Onde deseja salvá-lo?
                        </span>
                      )}
                    </div>

                    {!findMappedActionForSignal(lastDetectedKey) && (
                      <div className="pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickBind('prevPage', lastDetectedKey)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/40 text-[11px] font-extrabold text-emerald-300 transition-all"
                        >
                          + Cadastrar no Botão A (Voltar Página)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickBind('nextPage', lastDetectedKey)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/40 text-[11px] font-extrabold text-blue-300 transition-all"
                        >
                          + Cadastrar no Botão B (Avançar Página)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickBind('toggleAutoScroll', lastDetectedKey)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/40 text-[11px] font-extrabold text-amber-300 transition-all"
                        >
                          + Cadastrar no Botão C (Auto-Scroll)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickBind('nextSong', lastDetectedKey)}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/40 text-[11px] font-extrabold text-purple-300 transition-all"
                        >
                          + Cadastrar no Botão D (Próxima Música)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botão de Conectar MIDI caso tenha pedal MIDI */}
              {midiStatus !== 'unsupported' && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-blue-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Bluetooth size={18} className="text-blue-400" />
                    <div>
                      <h4 className="font-extrabold text-sm text-white">
                        {midiStatus === 'connected' ? `Pedal MIDI Conectado: ${midiDeviceName}` : 'Conexão MIDI Bluetooth / USB (Opcional)'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {midiStatus === 'connected' 
                          ? 'Sinal MIDI recebido e ativo. Pode mapear seus switches normalmente abaixo.' 
                          : 'Além do modo Teclado/HID (que já está ativo por padrão), você pode conectar pedais MIDI de palco.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleConnectMidi}
                    className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider shrink-0 shadow-md transition-all"
                  >
                    {midiStatus === 'connected' ? 'Reconectar MIDI' : 'Conectar MIDI'}
                  </button>
                </div>
              )}

              {/* M-VAVE Chocolate 4-Foots Exclusive Stage Display */}
              {config.preset === 'mvave_chocolate' && (
                <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-black border-2 border-emerald-500/50 shadow-2xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> M-VAVE CHOCOLATE • 4 FOOTS
                      </span>
                      <span className="text-xs font-extrabold text-slate-200">Modo Exclusivo LiLouPro</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">HID / MIDI Inteligente</span>
                  </div>

                  {/* 4 Footswitches Visual Pedal Chassis */}
                  <div className="bg-gradient-to-b from-slate-800 via-slate-900 to-black p-3.5 sm:p-4 rounded-xl border border-slate-700 shadow-inner grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                    {/* FOOTSWITCH A / 1 */}
                    <button
                      type="button"
                      onClick={() => onTestTrigger && onTestTrigger('prevPage')}
                      className={`group relative flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center min-h-[95px] cursor-pointer ${
                        activePedalButton === 'A'
                          ? "bg-gradient-to-b from-emerald-900/90 via-slate-900 to-black border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.95)] scale-105 ring-2 ring-emerald-300"
                          : "bg-gradient-to-b from-slate-800 to-slate-950 border-slate-700 hover:border-emerald-500/80 hover:shadow-lg hover:shadow-emerald-500/15"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full border-2 shadow-md flex items-center justify-center text-xs font-black text-white transition-all duration-300 ${
                          activePedalButton === 'A'
                            ? "bg-gradient-to-b from-emerald-400 via-emerald-500 to-teal-600 border-emerald-200 scale-125 shadow-[0_0_20px_rgba(16,185,129,1)] ring-2 ring-emerald-300"
                            : "bg-gradient-to-b from-slate-600 to-slate-800 border-slate-400 group-hover:border-emerald-400"
                        }`}
                      >
                        A
                      </div>
                      <div className="mt-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Botão 1</span>
                        <span className="text-xs font-extrabold text-emerald-300 block">Voltar Página ▲</span>
                      </div>
                    </button>

                    {/* FOOTSWITCH B / 2 */}
                    <button
                      type="button"
                      onClick={() => onTestTrigger && onTestTrigger('nextPage')}
                      className={`group relative flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center min-h-[95px] cursor-pointer ${
                        activePedalButton === 'B'
                          ? "bg-gradient-to-b from-emerald-900/90 via-slate-900 to-black border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.95)] scale-105 ring-2 ring-emerald-300"
                          : "bg-gradient-to-b from-slate-800 to-slate-950 border-slate-700 hover:border-emerald-500/80 hover:shadow-lg hover:shadow-emerald-500/15"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full border-2 shadow-md flex items-center justify-center text-xs font-black text-white transition-all duration-300 ${
                          activePedalButton === 'B'
                            ? "bg-gradient-to-b from-emerald-400 via-emerald-500 to-teal-600 border-emerald-200 scale-125 shadow-[0_0_20px_rgba(16,185,129,1)] ring-2 ring-emerald-300"
                            : "bg-gradient-to-b from-slate-600 to-slate-800 border-slate-400 group-hover:border-emerald-400"
                        }`}
                      >
                        B
                      </div>
                      <div className="mt-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Botão 2</span>
                        <span className="text-xs font-extrabold text-emerald-300 block">Avançar Página ▼</span>
                      </div>
                    </button>

                    {/* FOOTSWITCH C / 3 */}
                    <button
                      type="button"
                      onClick={() => onTestTrigger && onTestTrigger('toggleAutoScroll')}
                      className={`group relative flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center min-h-[95px] cursor-pointer ${
                        activePedalButton === 'C'
                          ? "bg-gradient-to-b from-emerald-900/90 via-slate-900 to-black border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.95)] scale-105 ring-2 ring-emerald-300"
                          : "bg-gradient-to-b from-slate-800 to-slate-950 border-slate-700 hover:border-emerald-500/80 hover:shadow-lg hover:shadow-emerald-500/15"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full border-2 shadow-md flex items-center justify-center text-xs font-black text-white transition-all duration-300 ${
                          activePedalButton === 'C'
                            ? "bg-gradient-to-b from-emerald-400 via-emerald-500 to-teal-600 border-emerald-200 scale-125 shadow-[0_0_20px_rgba(16,185,129,1)] ring-2 ring-emerald-300"
                            : "bg-gradient-to-b from-slate-600 to-slate-800 border-slate-400 group-hover:border-emerald-400"
                        }`}
                      >
                        C
                      </div>
                      <div className="mt-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Botão 3</span>
                        <span className="text-xs font-extrabold text-amber-300 block">Auto-Scroll ▶️/⏸️</span>
                      </div>
                    </button>

                    {/* FOOTSWITCH D / 4 */}
                    <button
                      type="button"
                      onClick={() => onTestTrigger && onTestTrigger('nextSong')}
                      className={`group relative flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center min-h-[95px] cursor-pointer ${
                        activePedalButton === 'D'
                          ? "bg-gradient-to-b from-emerald-900/90 via-slate-900 to-black border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.95)] scale-105 ring-2 ring-emerald-300"
                          : "bg-gradient-to-b from-slate-800 to-slate-950 border-slate-700 hover:border-emerald-500/80 hover:shadow-lg hover:shadow-emerald-500/15"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full border-2 shadow-md flex items-center justify-center text-xs font-black text-white transition-all duration-300 ${
                          activePedalButton === 'D'
                            ? "bg-gradient-to-b from-emerald-400 via-emerald-500 to-teal-600 border-emerald-200 scale-125 shadow-[0_0_20px_rgba(16,185,129,1)] ring-2 ring-emerald-300"
                            : "bg-gradient-to-b from-slate-600 to-slate-800 border-slate-400 group-hover:border-emerald-400"
                        }`}
                      >
                        D
                      </div>
                      <div className="mt-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Botão 4</span>
                        <span className="text-xs font-extrabold text-sky-300 block">Próxima Música ⏭️</span>
                      </div>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center">
                    💡 <strong className="text-slate-200">Altar inteligente:</strong> No Botão B (Avançar Página), ao chegar no final de uma música, o próximo clique carrega a próxima canção do roteiro automaticamente!
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <div className="font-extrabold text-emerald-400 flex items-center gap-1">
                      <span>⚠️ Testando no Preview do AI Studio?</span>
                    </div>
                    <p className="text-slate-400 text-[10px] leading-relaxed">
                      • <strong>Modo Teclado/HID (Bluetooth):</strong> Clique dentro da tela do app antes de pisar no pedal para que o iframe receba o foco das teclas.<br/>
                      • <strong>Modo MIDI / PWA:</strong> Para detecção MIDI sem restrições do navegador, abra o app em uma <strong>Nova Aba</strong> ou utilize o <strong>App Publicado</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Lista de Ações e Botão "Aprender" */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black uppercase text-slate-400 tracking-wider px-1">
                  <span>Ação do LiLouPro</span>
                  <span>Teclas / Sinais do Pedal Mapeados</span>
                </div>

                {(Object.keys(actionLabels) as (keyof FootswitchConfig['mappings'])[]).map((actionKey) => {
                  const info = actionLabels[actionKey];
                  const IconComp = info.icon;
                  const isLearningThis = learningAction === actionKey;
                  const assignedKeys = config.mappings[actionKey] || [];

                  return (
                    <div
                      key={actionKey}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isLearningThis
                          ? 'bg-brand/20 border-brand shadow-lg ring-2 ring-brand/50 animate-pulse'
                          : 'bg-black/30 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-brand-light shrink-0 mt-0.5">
                          <IconComp size={16} />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-sm text-white flex items-center gap-2">
                            {info.title}
                          </h5>
                          <p className="text-xs text-slate-400">{info.desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end shrink-0">
                        {/* Keys Badge */}
                        <div className="flex flex-wrap gap-1 items-center">
                          {assignedKeys.length === 0 ? (
                            <span className="text-[11px] text-slate-500 italic">Não mapeado</span>
                          ) : (
                            assignedKeys.map((k, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 rounded-md bg-white/10 border border-white/15 font-mono text-xs font-bold text-amber-300"
                              >
                                {k === ' ' ? 'Space' : k}
                              </span>
                            ))
                          )}
                        </div>

                        {/* Learn Button */}
                        <button
                          type="button"
                          onClick={() => setLearningAction(isLearningThis ? null : actionKey)}
                          className={`px-3 py-1.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all ${
                            isLearningThis
                              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                              : 'bg-brand hover:bg-brand-dark text-white border border-brand-light/30'
                          }`}
                        >
                          {isLearningThis ? 'Pise no Pedal...' : 'Mapear (Aprender)'}
                        </button>

                        {/* Test Button */}
                        {onTestTrigger && (
                          <button
                            type="button"
                            onClick={() => onTestTrigger(actionKey)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-all"
                            title="Testar ação agora"
                          >
                            <Play size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-brand/10 to-blue-500/10 border border-brand/30">
                <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" /> Presets de Pedais Populares
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Selecione o modelo do seu footswitch ou virador de página para configurar todos os botões instantaneamente.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* M-VAVE Chocolate Exclusive Card */}
                <button
                  type="button"
                  onClick={() => applyPreset('mvave_chocolate')}
                  className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                    config.preset === 'mvave_chocolate'
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10'
                      : 'bg-gradient-to-br from-emerald-950/20 to-slate-900/60 border-emerald-500/30 hover:border-emerald-500/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-sm text-emerald-300 flex items-center gap-1.5">
                      <BossPedalIcon size={15} className="text-emerald-400" />
                      M-VAVE Chocolate (4 Foots)
                    </span>
                    {config.preset === 'mvave_chocolate' && <CheckCircle2 size={16} className="text-emerald-400" />}
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Modo Exclusivo com 4 footswitches: A (Voltar), B (Avançar/Altar Inteligente), C (Auto-Scroll), D (Próxima Música).
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 font-mono text-[10px] font-black text-emerald-300">
                      ★ MODO EXCLUSIVO
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/40 font-mono text-[10px] text-slate-300">
                      HID + MIDI
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('arrows')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    config.preset === 'arrows'
                      ? 'bg-brand/20 border-brand shadow-lg'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-sm text-white">AirTurn / PageFlip / Donner</span>
                    {config.preset === 'arrows' && <CheckCircle2 size={16} className="text-emerald-400" />}
                  </div>
                  <p className="text-xs text-slate-400">
                    Padrão de setas direcional (ArrowDown, ArrowUp, ArrowRight, ArrowLeft) + Espaço para Auto-Scroll.
                  </p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded bg-black/40 font-mono text-[10px] text-amber-300">
                    Recomendado para 90% dos pedais
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('page_up_down')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    config.preset === 'page_up_down'
                      ? 'bg-brand/20 border-brand shadow-lg'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-sm text-white">IK iRig BlueTurn / M-VAVE</span>
                    {config.preset === 'page_up_down' && <CheckCircle2 size={16} className="text-emerald-400" />}
                  </div>
                  <p className="text-xs text-slate-400">
                    Modo PageDown / PageUp nos switches principais e Enter para controle do Auto-Scroll.
                  </p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded bg-black/40 font-mono text-[10px] text-amber-300">
                    Modo Page Up / Down
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('space_enter')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    config.preset === 'space_enter'
                      ? 'bg-brand/20 border-brand shadow-lg'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-sm text-white">Pedal Simples (2 Botões)</span>
                    {config.preset === 'space_enter' && <CheckCircle2 size={16} className="text-emerald-400" />}
                  </div>
                  <p className="text-xs text-slate-400">
                    Botão 1: Espaço (Avançar / Auto-Scroll). Botão 2: Enter ou Seta para Cima (Voltar).
                  </p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded bg-black/40 font-mono text-[10px] text-amber-300">
                    Pedais compactos
                  </span>
                </button>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-sm text-white">Mapeamento Personalizado</span>
                    {config.preset === 'custom' && <CheckCircle2 size={16} className="text-brand-light" />}
                  </div>
                  <p className="text-xs text-slate-400">
                    Use o botão "Mapear (Aprender)" na aba anterior para gravar exatamente as teclas que seu pedal envia.
                  </p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded bg-black/40 font-mono text-[10px] text-sky-300">
                    100% Customizável
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Smartphone size={16} className="text-brand-light" /> Como Conectar o Pedal ao Smartphone ou Tablet
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-300">
                  <li>
                    <strong>Ligue o Bluetooth do seu celular/tablet</strong> (iOS, Android, Windows ou iPad).
                  </li>
                  <li>
                    <strong>Ligue o seu Pedal / Footswitch</strong> e coloque no modo de pareamento (geralmente piscando o LED).
                  </li>
                  <li>
                    Nas configurações Bluetooth do seu dispositivo, selecione o pedal (ex: <em className="text-white font-mono">AirTurn</em>, <em className="text-white font-mono">PageFlip</em>, <em className="text-white font-mono">BlueTurn</em>, <em className="text-white font-mono">Donner</em>).
                  </li>
                  <li>
                    <strong>Pronto!</strong> O LiLouPro reconhece automaticamente os comandos HID do pedal no altar. Você não precisa instalar nenhum app de terceiros!
                  </li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <h4 className="font-extrabold text-sm text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Dicas para Ensaio e Altar
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-emerald-100/90">
                  <li>
                    <strong>Transição Sem Mãos:</strong> Ao chegar ao final de uma canção, pise mais uma vez no pedal de Avançar e o LiLouPro carregará a próxima música do roteiro automaticamente!
                  </li>
                  <li>
                    <strong>Feedback Visual:</strong> Sempre que você pisa no pedal, o LiLouPro exibe uma notificação suave no topo da tela confirmando a ação.
                  </li>
                  <li>
                    <strong>Modo Foco / Palco:</strong> O footswitch funciona perfeitamente em modo de Tela Cheia e em Modo Palco Escuro!
                  </li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <button
            onClick={() => handleSave(DEFAULT_FOOTSWITCH_CONFIG)}
            className="text-xs text-slate-400 hover:text-white underline transition-colors"
          >
            Restaurar Configuração Padrão
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand via-blue-500 to-sky-400 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-brand/30 transition-all"
          >
            Concluir & Voltar ao Altar
          </button>
        </div>

      </div>
    </div>
  );
}

// Helper component for chevron up icon inside label dictionary
function ChevronUpIcon({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m18 15-6-6-6 6"/>
    </svg>
  );
}
