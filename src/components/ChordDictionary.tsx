import React, { useState, useEffect } from 'react';
import { motion, useDragControls } from 'motion/react';
import { X, Search, BookOpen, Music, RotateCcw, Check, Plus, Minus, Info, ChevronLeft, ChevronRight, RotateCw, Repeat, Layers, Sparkles, GripHorizontal, Move } from 'lucide-react';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { convertSingleChordToHarmonicMode } from '../services/chordService';

// NOTES definition
const NOTES_DICT = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ALIASES: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
  'C9': 'Cadd9', 'D9': 'Dadd9', 'F9': 'Fadd9', 'G2': 'Gadd9', 'C2': 'Cadd9'
};

// Interface for guitar chords shapes
export interface GuitarChordShape {
  frets: number[]; // E A D G B E frets: -1 for mute, 0 for open, 1.. for fret pos
  fingers?: number[]; // corresponding fingers 1 to 4 (0 for open/mute)
  barre?: { fret: number; start: number; end: number }; // absolute fret position
  baseFret?: number; // top displayed fret (defaults to 1)
}

export function getFirestoreDocId(normalized: string): string {
  return normalized.replace(/\//g, '_slash_');
}

export function getChordFromDocId(docId: string): string {
  return docId.replace(/_slash_/g, '/');
}

export function getSavedChordShape(chordName: string): GuitarChordShape | null {
  try {
    const saved = localStorage.getItem('lilo_chord_overrides');
    if (saved) {
      const overrides = JSON.parse(saved);
      const normalized = chordName.trim().replace(/\(\/([A-G][#b]?)\)/g, '/$1');
      if (overrides[normalized]) {
        return overrides[normalized];
      }
    }
  } catch (e) {
    console.error('Error fetching chord overrides', e);
  }
  return null;
}

export function saveChordShape(chordName: string, shape: GuitarChordShape) {
  try {
    const saved = localStorage.getItem('lilo_chord_overrides');
    const overrides = saved ? JSON.parse(saved) : {};
    const normalized = chordName.trim().replace(/\(\/([A-G][#b]?)\)/g, '/$1');
    
    // Clean undefined values so Firestore doesn't complain
    const cleanedShape = JSON.parse(JSON.stringify(shape));
    overrides[normalized] = cleanedShape;
    localStorage.setItem('lilo_chord_overrides', JSON.stringify(overrides));
    
    // Dispatch local custom event for instant responsiveness
    window.dispatchEvent(new CustomEvent('chord-overrides-updated'));

    // Persist globally under a safe document ID to avoid slashes being parsed as subcollections
    const docId = getFirestoreDocId(normalized);
    setDoc(doc(db, 'chord_overrides', docId), cleanedShape)
      .catch(e => handleFirestoreError(e, OperationType.WRITE, `chord_overrides/${docId}`));
  } catch (e) {
    console.error('Error saving chord override', e);
  }
}

export function deleteChordShape(chordName: string) {
  try {
    const saved = localStorage.getItem('lilo_chord_overrides');
    if (saved) {
      const overrides = JSON.parse(saved);
      const normalized = chordName.trim().replace(/\(\/([A-G][#b]?)\)/g, '/$1');
      delete overrides[normalized];
      localStorage.setItem('lilo_chord_overrides', JSON.stringify(overrides));
    }

    // Dispatch local custom event for instant responsiveness
    window.dispatchEvent(new CustomEvent('chord-overrides-updated'));

    const normalized = chordName.trim().replace(/\(\/([A-G][#b]?)\)/g, '/$1');
    const docId = getFirestoreDocId(normalized);
    deleteDoc(doc(db, 'chord_overrides', docId))
      .catch(e => handleFirestoreError(e, OperationType.DELETE, `chord_overrides/${docId}`));
  } catch (e) {
    console.error('Error deleting chord override', e);
  }
}

export interface PianoChordShape {
  keys: number[];
}

export function getSavedPianoChordShape(chordName: string): PianoChordShape | null {
  try {
    const saved = localStorage.getItem('lilo_piano_chord_overrides');
    if (saved) {
      const overrides = JSON.parse(saved);
      const normalized = chordName.trim().replace(/\(\/([A-G][#b]?)\)/g, '/$1');
      if (overrides[normalized]) {
        return overrides[normalized];
      }
    }
  } catch (e) {
    console.error('Error fetching piano overrides', e);
  }
  return null;
}

export function savePianoChordShape(chordName: string, shape: PianoChordShape) {
  try {
    const saved = localStorage.getItem('lilo_piano_chord_overrides');
    const overrides = saved ? JSON.parse(saved) : {};
    const normalized = chordName.trim().replace(/\(\/([A-G][#b]?)\)/g, '/$1');
    
    const cleanedShape = JSON.parse(JSON.stringify(shape));
    overrides[normalized] = cleanedShape;
    localStorage.setItem('lilo_piano_chord_overrides', JSON.stringify(overrides));
    
    // Dispatch local custom event for instant responsiveness
    window.dispatchEvent(new CustomEvent('chord-overrides-updated'));

    const docId = getFirestoreDocId(normalized);
    setDoc(doc(db, 'piano_chord_overrides', docId), cleanedShape)
      .catch(e => handleFirestoreError(e, OperationType.WRITE, `piano_chord_overrides/${docId}`));
  } catch (e) {
    console.error('Error saving piano chord override', e);
  }
}

export function deletePianoChordShape(chordName: string) {
  try {
    const saved = localStorage.getItem('lilo_piano_chord_overrides');
    if (saved) {
      const overrides = JSON.parse(saved);
      const normalized = chordName.trim().replace(/\(\/([A-G][#b]?)\)/g, '/$1');
      delete overrides[normalized];
      localStorage.setItem('lilo_piano_chord_overrides', JSON.stringify(overrides));
    }

    // Dispatch local custom event for instant responsiveness
    window.dispatchEvent(new CustomEvent('chord-overrides-updated'));

    const normalized = chordName.trim().replace(/\(\/([A-G][#b]?)\)/g, '/$1');
    const docId = getFirestoreDocId(normalized);
    deleteDoc(doc(db, 'piano_chord_overrides', docId))
      .catch(e => handleFirestoreError(e, OperationType.DELETE, `piano_chord_overrides/${docId}`));
  } catch (e) {
    console.error('Error deleting piano chord override', e);
  }
}

export function useChordOverridesSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const unsubGuitar = onSnapshot(
      collection(db, 'chord_overrides'),
      (snapshot) => {
        try {
          const overrides: Record<string, GuitarChordShape> = {};
          snapshot.forEach((doc) => {
            const originalChord = getChordFromDocId(doc.id);
            overrides[originalChord] = doc.data() as GuitarChordShape;
          });
          localStorage.setItem('lilo_chord_overrides', JSON.stringify(overrides));
          window.dispatchEvent(new CustomEvent('chord-overrides-updated'));
        } catch (e) {
          console.error('Error processing guitar chord overrides snapshot', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'chord_overrides');
      }
    );

    const unsubPiano = onSnapshot(
      collection(db, 'piano_chord_overrides'),
      (snapshot) => {
        try {
          const overrides: Record<string, PianoChordShape> = {};
          snapshot.forEach((doc) => {
            const originalChord = getChordFromDocId(doc.id);
            overrides[originalChord] = doc.data() as PianoChordShape;
          });
          localStorage.setItem('lilo_piano_chord_overrides', JSON.stringify(overrides));
          window.dispatchEvent(new CustomEvent('chord-overrides-updated'));
        } catch (e) {
          console.error('Error processing piano chord overrides snapshot', e);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'piano_chord_overrides');
      }
    );

    return () => {
      unsubGuitar();
      unsubPiano();
    };
  }, [user]);
}

interface GuitarChordEditorProps {
  chordName: string;
  onClose: () => void;
  onSave: () => void;
}

export function GuitarChordEditor({ chordName, onClose, onSave }: GuitarChordEditorProps) {
  const [frets, setFrets] = useState<number[]>([-1, 0, 0, 0, 0, 0]);
  const [fingers, setFingers] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [baseFret, setBaseFret] = useState<number>(1);
  const [activeFinger, setActiveFinger] = useState<number>(1);
  
  const [hasBarre, setHasBarre] = useState<boolean>(false);
  const [barreFret, setBarreFret] = useState<number>(1);
  const [barreStart, setBarreStart] = useState<number>(1);
  const [barreEnd, setBarreEnd] = useState<number>(6);

  const getGuitarStringName = (val: number) => {
    const mapping: { [key: number]: string } = {
      1: '6ª',
      2: '5ª',
      3: '4ª',
      4: '3ª',
      5: '2ª',
      6: '1ª',
    };
    return mapping[val] || `${val}ª`;
  };

  useEffect(() => {
    let initialShape: GuitarChordShape | undefined;
    const normalized = chordName.trim().replace(/\(\/([A-G][#b]?)\)/g, '/$1');
    
    const saved = getSavedChordShape(chordName);
    if (saved) {
      initialShape = saved;
    } else if (GUITAR_DATABASE[normalized]?.['']) {
      initialShape = GUITAR_DATABASE[normalized][''];
    } else {
      const { root, suffix } = resolveChordSuffix(chordName);
      initialShape = GUITAR_DATABASE[root]?.[suffix] || GUITAR_DATABASE[root]?.[''];
    }

    if (initialShape) {
      setFrets([...initialShape.frets]);
      setFingers(initialShape.fingers ? [...initialShape.fingers] : [0, 0, 0, 0, 0, 0]);
      setBaseFret(initialShape.baseFret || 1);
      if (initialShape.barre) {
        setHasBarre(true);
        setBarreFret(initialShape.barre.fret);
        setBarreStart(initialShape.barre.start);
        setBarreEnd(initialShape.barre.end);
      } else {
        setHasBarre(false);
        setBarreFret(initialShape.baseFret || 1);
        setBarreStart(1);
        setBarreEnd(6);
      }
    } else {
      setFrets([-1, 0, 0, 0, 0, 0]);
      setFingers([0, 0, 0, 0, 0, 0]);
      setBaseFret(1);
      setHasBarre(false);
      setBarreFret(1);
      setBarreStart(1);
      setBarreEnd(6);
    }
  }, [chordName]);

  const handleSaveClick = () => {
    const newShape: GuitarChordShape = {
      frets,
      fingers,
      baseFret,
      barre: hasBarre ? { fret: barreFret, start: barreStart, end: barreEnd } : undefined
    };
    saveChordShape(chordName, newShape);
    onSave();
  };

  const handleRestoreClick = () => {
    deleteChordShape(chordName);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10001] flex items-center justify-center p-4 antialiased overflow-hidden select-none">
      <div className="bg-surface border border-border rounded-3xl w-full max-w-sm sm:max-w-md shadow-2xl flex flex-col h-full max-h-[92vh] text-text-main notranslate animate-in fade-in zoom-in duration-200" translate="no" id="guitar-chord-editor-modal">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛠️</span>
            <div>
              <h3 className="text-base font-black text-text-main uppercase tracking-widest leading-none">Editor de Shapes</h3>
              <p className="text-[10px] text-text-muted mt-1 leading-none font-bold">Personalize o acorde <strong className="text-brand">{chordName}</strong> para seu estilo</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 px-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-muted hover:text-text-main rounded-lg border border-border cursor-pointer transition-all"
            id="close-editor-header-btn"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable Container Wrapper */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">

          {/* Info advice */}
          <div className="flex gap-2 p-2.5 bg-blue-500/15 border border-blue-500/20 text-[10px] text-blue-400 font-medium rounded-xl select-none" id="editor-info-banner">
            <Info size={14} className="shrink-0 text-blue-500 mt-0.5" />
            <p className="leading-tight">
              Clique no braço para colocar notas. Clique no topo (<strong>X / O</strong>) para alternar entre corda solta e abafada. Use os botões <strong>+ Pest / Pestana</strong> à esquerda para criar pestanas facilmente!
            </p>
          </div>

          {/* Base Fret offset config */}
          <div className="flex items-center justify-between px-2 bg-black/10 dark:bg-white/5 border border-border p-2 rounded-2xl" id="editor-base-fret-config">
            <span className="text-[10px] font-black uppercase text-text-muted tracking-wider">
              Casas aparecendo no braço:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBaseFret(prev => Math.max(1, prev - 1))}
                className="w-7 h-7 bg-black/25 dark:bg-white/5 border border-border rounded-xl flex items-center justify-center font-bold text-xs hover:bg-black/35 cursor-pointer"
                id="btn-editor-base-fret-dec"
              >
                <Minus size={11} />
              </button>
              <span className="text-xs font-black font-mono leading-none bg-brand/10 text-brand px-2 py-1 rounded border border-brand/20">
                {baseFret}ª - {baseFret + 4}ª
              </span>
              <button
                type="button"
                onClick={() => setBaseFret(prev => Math.min(20, prev + 1))}
                className="w-7 h-7 bg-black/25 dark:bg-white/5 border border-border rounded-xl flex items-center justify-center font-bold text-xs hover:bg-black/35 cursor-pointer"
                id="btn-editor-base-fret-inc"
              >
                <Plus size={11} />
              </button>
            </div>
          </div>

          {/* Dedo Ativo Palette selector */}
          <div className="space-y-1.5 w-full select-none" id="editor-finger-palette">
            <span className="text-[9px] font-black uppercase text-text-muted tracking-wider block text-center">
              Dedo ativo para as notas:
            </span>
            <div className="flex justify-between gap-1 p-1 bg-black/15 dark:bg-white/5 rounded-2xl border border-border">
              {[
                { val: 1, label: 'D1', desc: 'Dedo 1 (Indicador)' },
                { val: 2, label: 'D2', desc: 'Dedo 2 (Médio)' },
                { val: 3, label: 'D3', desc: 'Dedo 3 (Anelar)' },
                { val: 4, label: 'D4', desc: 'Dedo 4 (Mínimo)' },
                { val: 5, label: 'T', desc: 'Polegar (T)' },
                { val: 0, label: 'Ø', desc: 'Sem Dedo' }
              ].map((f) => (
                <button
                  key={`finger-pick-${f.val}`}
                  type="button"
                  onClick={() => setActiveFinger(f.val)}
                  className={`px-1 py-1.5 text-[10px] font-black rounded-xl border transition-all cursor-pointer select-none grow flex flex-col items-center justify-center relative ${
                    activeFinger === f.val
                      ? 'bg-brand border-brand text-white shadow-md scale-[1.03] font-black'
                      : 'bg-black/5 dark:bg-white/5 border-border text-text-muted hover:text-text-main hover:bg-black/10 dark:hover:bg-white/10'
                  }`}
                  title={f.desc}
                >
                  <span className="text-xs font-black leading-none">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fretboard Neck Graphical layout */}
          <div className="relative flex flex-col items-center bg-zinc-100 dark:bg-zinc-950 rounded-3xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-inner w-full">
            
            {/* Open / Mute circles at the top nut */}
            <div className="flex justify-between w-full max-w-[260px] mb-2 px-1 text-center select-none" id="editor-open-mute-triggers">
              {Array.from({ length: 6 }).map((_, sIdx) => {
                const fret = frets[sIdx];
                return (
                  <div key={`head-container-${sIdx}`} className="flex flex-col items-center gap-0.5 grow">
                    <button
                      type="button"
                      onClick={() => {
                        const nextFrets = [...frets];
                        const nextFingers = [...fingers];
                        if (fret > 0) {
                          nextFrets[sIdx] = -1;
                          nextFingers[sIdx] = 0;
                        } else if (fret === 0) {
                          nextFrets[sIdx] = -1;
                          nextFingers[sIdx] = 0;
                        } else {
                          nextFrets[sIdx] = 0;
                          nextFingers[sIdx] = 0;
                        }
                        setFrets(nextFrets);
                        setFingers(nextFingers);
                      }}
                      className={`w-7 h-7 rounded-full flex flex-col items-center justify-center text-[10px] font-black border transition-all cursor-pointer shadow-sm ${
                        fret === -1
                          ? 'bg-red-500/20 text-red-500 border-red-500/40 hover:bg-red-500/30'
                          : fret === 0
                          ? 'bg-green-500/20 text-green-500 border-green-500/40 hover:bg-green-500/30'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                      }`}
                      title={fret === -1 ? "Mudo (X)" : fret === 0 ? "Solto (O)" : "Traste Preso"}
                    >
                      {fret === -1 ? 'X' : fret === 0 ? 'O' : '•'}
                    </button>
                    <span className="text-[7.5px] text-zinc-600 dark:text-zinc-400 font-mono font-bold leading-none uppercase">
                      {sIdx === 0 ? '6ª' : sIdx === 1 ? '5ª' : sIdx === 2 ? '4ª' : sIdx === 3 ? '3ª' : sIdx === 4 ? '2ª' : '1ª'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Neck board background and frets */}
            <div 
              className="relative w-full max-w-[260px] border-t-2 border-b-2 border-l border-r rounded-2xl py-1 shadow-xl overflow-visible"
              style={{
                background: 'linear-gradient(90deg, #eedcb3 0%, #f5e6c4 20%, #faebd7 50%, #f5e6c4 80%, #e3cf9f 100%)',
                borderColor: '#dec897',
              }}
              id="editor-virtual-neck-board"
            >
              
              {/* Optional nut line */}
              {baseFret === 1 && (
                <div className="absolute top-0 left-0 right-0 h-2 bg-[#d6cbaf] border-b border-[#a89d84]" />
              )}

              {/* Fret rows (0 to 4) */}
              <div className="flex flex-col">
                {Array.from({ length: 5 }).map((_, fIdx) => {
                  const absoluteFret = baseFret + fIdx;
                  return (
                    <div 
                      key={`fret-row-${fIdx}`} 
                      className="relative border-b-2 border-[#b5a788]/60 h-14 flex items-center justify-between px-1 select-none"
                    >
                      {/* Interactive Inlay dots in the background of the maple fretboard row */}
                      {((absoluteFret === 3 || absoluteFret === 5 || absoluteFret === 7 || absoluteFret === 9 || absoluteFret === 15 || absoluteFret === 17) && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-70">
                          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/80 border border-amber-900/25 shadow-sm" />
                        </div>
                      ))}
                      {(absoluteFret === 12 && (
                        <div className="absolute inset-0 flex items-center justify-center gap-12 pointer-events-none opacity-70">
                          <div className="w-2 h-2 rounded-full bg-zinc-700/80 border border-amber-900/25 shadow-sm" />
                          <div className="w-2 h-2 rounded-full bg-zinc-700/80 border border-amber-900/25 shadow-sm" />
                        </div>
                      ))}

                      {/* Left side level with interactive indicator shortcut */}
                      <button
                        type="button"
                        onClick={() => {
                          if (hasBarre && barreFret === absoluteFret) {
                            // Turn off if already on this fret
                            setHasBarre(false);
                          } else {
                            setHasBarre(true);
                            setBarreFret(absoluteFret);
                            // Auto-set the strings covered by the barre to this fret!
                            const nextFrets = [...frets];
                            const nextFingers = [...fingers];
                            for (let s = barreStart - 1; s < barreEnd; s++) {
                              if (nextFrets[s] <= 0 || nextFrets[s] === barreFret) {
                                nextFrets[s] = absoluteFret;
                                nextFingers[s] = 1; // Finger 1 representation
                              }
                            }
                            setFrets(nextFrets);
                            setFingers(nextFingers);
                          }
                        }}
                        className={`absolute left-[-45px] w-[41px] py-1 text-[8px] font-mono border rounded-lg transition-all flex flex-col items-center justify-center leading-none cursor-pointer hover:scale-105 select-none ${
                          hasBarre && barreFret === absoluteFret
                            ? 'bg-rose-600 text-white border-rose-500 shadow-sm font-black'
                            : 'bg-white dark:bg-zinc-900 border-[#dec897]/60 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 font-bold hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30'
                        }`}
                        title="Atalho: Clique para colocar ou remover a pestanas nesta casa"
                        id={`btn-pestana-shortcut-${fIdx}`}
                      >
                        <span className="font-bold">{absoluteFret}ª c.</span>
                        <span className="text-[6.5px] font-sans font-black tracking-tighter uppercase mt-0.5 leading-none">
                          {hasBarre && barreFret === absoluteFret ? 'Pest' : '+ Pest'}
                        </span>
                      </button>

                      {/* Vertically intersecting string lines: Real bronze wound bass strings & silver-nickel treble strings */}
                      <div className="absolute inset-0 pointer-events-none flex justify-between px-[14px]">
                        {/* 6ª string (Thicker Bronze) */}
                        <div className="w-[3.2px] bg-[#a16207] h-full shadow-[0.5px_0_1.5px_rgba(0,0,0,0.35)]" />
                        {/* 5ª string (Bronze) */}
                        <div className="w-[2.6px] bg-[#a16207] h-full shadow-[0.5px_0_1.5px_rgba(0,0,0,0.35)]" />
                        {/* 4ª string (Bronze) */}
                        <div className="w-[2px] bg-[#b45309] h-full shadow-[0.5px_0_1.2px_rgba(0,0,0,0.3)]" />
                        {/* 3ª string (Thicker Steel/Slate) */}
                        <div className="w-[1.6px] bg-[#64748b] h-full shadow-[0.5px_0_1px_rgba(0,0,0,0.25)]" />
                        {/* 2ª string (Steel) */}
                        <div className="w-[1.2px] bg-[#64748b] h-full shadow-[0.5px_0_1px_rgba(0,0,0,0.2)]" />
                        {/* 1ª string (Thin Steel) */}
                        <div className="w-[0.9px] bg-[#7888a0] h-full shadow-[0.5px_0_1px_rgba(0,0,0,0.2)]" />
                      </div>

                      {/* Visual Pestana overlay bar on this fret, background level z-5 */}
                      {hasBarre && barreFret === absoluteFret && (
                        <div className="absolute inset-x-0 inset-y-0 pointer-events-none flex items-center px-[10px] z-[5]" id={`pestana-fret-overlay-${absoluteFret}`}>
                          <div 
                            className="h-6 bg-rose-600/90 border border-rose-500 rounded-full flex items-center justify-center shadow-lg relative"
                            style={{
                              marginLeft: `${((barreStart - 1) / 5) * 100}%`,
                              width: `${((barreEnd - barreStart) / 5) * 100}%`,
                              flexGrow: 1,
                              maxWidth: '100%',
                              paddingLeft: '11px',
                              paddingRight: '11px',
                              minWidth: '22px'
                            }}
                          >
                            <span className="text-[7.5px] text-white font-mono font-extrabold uppercase tracking-widest leading-none select-none drop-shadow">
                              PESTANA
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Click triggers on strings at this fret, foreground level z-10 */}
                      <div className="relative z-10 w-full flex justify-between px-1">
                        {Array.from({ length: 6 }).map((_, sIdx) => {
                          const isFrettedHere = frets[sIdx] === absoluteFret;
                          const finger = fingers[sIdx];
                          return (
                            <button
                              key={`cell-${fIdx}-${sIdx}`}
                              type="button"
                              onClick={() => {
                                const nextFrets = [...frets];
                                const nextFingers = [...fingers];
                                if (isFrettedHere) {
                                  nextFrets[sIdx] = 0;
                                  nextFingers[sIdx] = 0;
                                } else {
                                  nextFrets[sIdx] = absoluteFret;
                                  nextFingers[sIdx] = activeFinger;
                                }
                                setFrets(nextFrets);
                                setFingers(nextFingers);
                              }}
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                                isFrettedHere
                                  ? 'bg-brand text-white border-2 border-white scale-110 shadow-md shadow-brand/50 font-black'
                                  : 'bg-transparent border border-transparent hover:border-black/30 hover:bg-black/10'
                              }`}
                            >
                              {isFrettedHere && (
                                <span className="text-[11px] font-black leading-none">
                                  {finger === 5 ? 'T' : finger > 0 ? finger : ''}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Pestana (Barre) Manual controls */}
          <div className="border border-border rounded-2xl p-3 space-y-2 bg-black/10 dark:bg-white/5" id="editor-barre-controls">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasBarre}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setHasBarre(checked);
                  if (checked) {
                    const nextFrets = [...frets];
                    const nextFingers = [...fingers];
                    for (let s = barreStart - 1; s < barreEnd; s++) {
                      if (nextFrets[s] <= 0) {
                        nextFrets[s] = barreFret;
                        nextFingers[s] = 1;
                      }
                    }
                    setFrets(nextFrets);
                    setFingers(nextFingers);
                  }
                }}
                className="rounded text-brand border-border focus:ring-brand cursor-pointer"
                id="checkbox-has-barre"
              />
              <span className="text-[10px] font-black uppercase text-text-main tracking-wider">
                Adicionar Pestana (Barre)
              </span>
            </label>

            {hasBarre && (
              <div className="grid grid-cols-3 gap-2 p-2 bg-black/15 dark:bg-black/30 rounded-xl select-none">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[8px] font-black uppercase text-text-muted">Casa</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const nextF = Math.max(1, barreFret - 1);
                        setBarreFret(nextF);
                        const nextFrets = [...frets];
                        const nextFingers = [...fingers];
                        for (let s = barreStart - 1; s < barreEnd; s++) {
                          if (nextFrets[s] === barreFret) {
                            nextFrets[s] = nextF;
                            nextFingers[s] = 1;
                          }
                        }
                        setFrets(nextFrets);
                        setFingers(nextFingers);
                      }}
                      className="w-5 h-5 bg-black/20 dark:bg-white/5 border border-border rounded flex items-center justify-center font-bold text-xs hover:bg-black/30 cursor-pointer"
                      id="btn-barre-fret-dec"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-bold leading-none">{barreFret}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextF = Math.min(24, barreFret + 1);
                        setBarreFret(nextF);
                        const nextFrets = [...frets];
                        const nextFingers = [...fingers];
                        for (let s = barreStart - 1; s < barreEnd; s++) {
                          if (nextFrets[s] === barreFret || nextFrets[s] <= 0) {
                            nextFrets[s] = nextF;
                            nextFingers[s] = 1;
                          }
                        }
                        setFrets(nextFrets);
                        setFingers(nextFingers);
                      }}
                      className="w-5 h-5 bg-black/20 dark:bg-white/5 border border-border rounded flex items-center justify-center font-bold text-xs hover:bg-black/30 cursor-pointer"
                      id="btn-barre-fret-inc"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <span className="text-[8px] font-black uppercase text-text-muted">Da corda</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBarreStart(prev => Math.max(1, prev - 1))}
                      className="w-5 h-5 bg-black/20 dark:bg-white/5 border border-border rounded flex items-center justify-center font-bold text-xs hover:bg-black/30 cursor-pointer"
                      id="btn-barre-start-dec"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-bold leading-none">{getGuitarStringName(barreStart)}</span>
                    <button
                      type="button"
                      onClick={() => setBarreStart(prev => Math.min(barreEnd, prev + 1))}
                      className="w-5 h-5 bg-black/20 dark:bg-white/5 border border-border rounded flex items-center justify-center font-bold text-xs hover:bg-black/30 cursor-pointer"
                      id="btn-barre-start-inc"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <span className="text-[8px] font-black uppercase text-text-muted">Até corda</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBarreEnd(prev => Math.max(barreStart, prev - 1))}
                      className="w-5 h-5 bg-black/20 dark:bg-white/5 border border-border rounded flex items-center justify-center font-bold text-xs hover:bg-black/30 cursor-pointer"
                      id="btn-barre-end-dec"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-bold leading-none">{getGuitarStringName(barreEnd)}</span>
                    <button
                      type="button"
                      onClick={() => setBarreEnd(prev => Math.min(6, prev + 1))}
                      className="w-5 h-5 bg-black/20 dark:bg-white/5 border border-border rounded flex items-center justify-center font-bold text-xs hover:bg-black/30 cursor-pointer"
                      id="btn-barre-end-inc"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Fixed footer toolbar (always visible and prominent at the bottom) */}
        <div className="p-5 bg-black/15 dark:bg-black/30 border-t border-border shrink-0 flex flex-col gap-2 rounded-b-3xl" id="editor-fixed-footer">
          <button
            type="button"
            onClick={handleSaveClick}
            className="w-full py-3 bg-brand text-white text-xs font-black uppercase tracking-wider rounded-xl hover:brightness-110 active:scale-98 flex items-center justify-center gap-1.5 shadow-md shadow-brand/20 border-none cursor-pointer transition-all hover:shadow-brand/35"
            id="editor-primary-save-btn"
          >
            <Check size={14} /> Salvar Shape Customizado
          </button>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRestoreClick}
              className="grow py-2 bg-black/5 dark:bg-white/5 border border-border text-zinc-500 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 text-[10px] font-black uppercase tracking-wide rounded-xl active:scale-98 flex items-center justify-center gap-1 cursor-pointer transition-all"
              title="Apagar customização e restaurar padrão do dicionário"
              id="editor-restore-defaults-btn"
            >
              <RotateCcw size={12} /> Restaurar Padrão
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grow py-2 bg-black/5 dark:bg-white/5 border border-border text-text-muted hover:text-text-main text-[10px] font-black uppercase tracking-wide rounded-xl active:scale-98 cursor-pointer transition-all"
              id="editor-back-dismiss-btn"
            >
              Voltar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export interface PianoChordEditorProps {
  chordName: string;
  onClose: () => void;
  onSave: () => void;
}

export function PianoChordEditor({ chordName, onClose, onSave }: PianoChordEditorProps) {
  const [keys, setKeys] = useState<number[]>([]);
  const [octaveShift, setOctaveShift] = useState<number>(0);

  useEffect(() => {
    const activeKeys = getPianoKeys(chordName);
    const minKey = activeKeys.length > 0 ? Math.min(...activeKeys) : 0;
    const shift = -Math.floor(minKey / 12) * 12;
    setOctaveShift(shift);
    const shifted = activeKeys.map(k => k + shift);
    setKeys(shifted);
  }, [chordName]);

  const handleSaveClick = () => {
    const originalKeys = keys.map(s => s - octaveShift).sort((a, b) => a - b);
    savePianoChordShape(chordName, { keys: originalKeys });
    onSave();
  };

  const handleRestoreClick = () => {
    deletePianoChordShape(chordName);
    onSave();
  };

  const toggleKey = (s: number) => {
    setKeys(prev => {
      if (prev.includes(s)) {
        return prev.filter(k => k !== s).sort((a, b) => a - b);
      } else {
        return [...prev, s].sort((a, b) => a - b);
      }
    });
  };

  const getNoteDetails = (semitoneFromC: number) => {
    const noteIndex = semitoneFromC % 12;
    const noteName = NOTES_DICT[noteIndex];
    const isBlack = noteName.includes('#');
    return { noteName, isBlack };
  };

  const whiteKeysSec: any[] = [];
  const blackKeysSec: any[] = [];
  let whiteIndex = 0;

  // Touch-friendly responsive layout widths
  const whiteKeyWidth = 24;
  const whiteKeyHeight = 120;
  const blackKeyWidth = 16;
  const blackKeyHeight = 76;
  const blackKeyOffset = whiteKeyWidth - (blackKeyWidth / 2);

  for (let s = 0; s < 25; s++) {
    const { noteName, isBlack } = getNoteDetails(s);
    const isBass = keys.length > 0 && s === keys[0];
    const isActive = keys.includes(s);

    const originalKeyVal = s - octaveShift;
    const intervalLabelRaw = getIntervalLabel(originalKeyVal, chordName);
    const intervalLabel = intervalLabelRaw ? intervalLabelRaw.replace(/ª/g, '') : '';

    if (isBlack) {
      let wLeftIdx = 0;
      const cycle = Math.floor(s / 12);
      const rem = s % 12;
      if (rem === 1) wLeftIdx = 0;
      else if (rem === 3) wLeftIdx = 1;
      else if (rem === 6) wLeftIdx = 3;
      else if (rem === 8) wLeftIdx = 4;
      else if (rem === 10) wLeftIdx = 5;
      
      const absoluteWhiteIndex = wLeftIdx + (cycle * 7);
      const leftPos = (absoluteWhiteIndex * whiteKeyWidth) + blackKeyOffset;

      blackKeysSec.push(
        <button
          key={`piano-edit-key-${s}`}
          type="button"
          onClick={() => toggleKey(s)}
          style={{ left: `${leftPos}px`, width: `${blackKeyWidth}px`, height: `${blackKeyHeight}px` }}
          className={`absolute z-20 rounded-b transition-all border border-black/80 flex flex-col items-center justify-end pb-1.5 shadow-md cursor-pointer ${
            isBass 
              ? 'bg-indigo-600 border-indigo-700 text-white font-bold scale-y-[1.02] shadow-indigo-500/25' 
              : isActive
              ? 'bg-emerald-500 border-emerald-600 text-white font-bold scale-y-[1.02] shadow-emerald-500/25'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-500 border-zinc-950'
          }`}
        >
          <span className={`text-[7.5px] font-sans font-black select-none tracking-tighter block mb-0.5 leading-none ${
            isActive ? 'text-white' : 'text-zinc-650'
          }`}>{noteName}</span>
          {isActive && <span className="text-[6.5px] font-black text-white leading-none">{intervalLabel || 'N'}</span>}
        </button>
      );
    } else {
      const leftPos = whiteIndex * whiteKeyWidth;

      whiteKeysSec.push(
        <button
          key={`piano-edit-key-${s}`}
          type="button"
          onClick={() => toggleKey(s)}
          style={{ left: `${leftPos}px`, width: `${whiteKeyWidth}px`, height: `${whiteKeyHeight}px` }}
          className={`absolute z-10 border border-zinc-300 rounded-b shadow-sm transition-all flex flex-col items-center justify-end pb-2 cursor-pointer ${
            isBass 
              ? 'bg-indigo-600 border-indigo-700 text-white font-black scale-y-[1.01] shadow-indigo-500/25' 
              : isActive
              ? 'bg-emerald-500 border-emerald-600 text-white font-black scale-y-[1.01] shadow-emerald-500/25'
              : 'bg-white hover:bg-stone-50 border-stone-200 text-zinc-800'
          }`}
        >
          <span className={`text-[8px] font-sans font-black select-none block tracking-tighter leading-none ${
            isActive ? 'text-white' : 'text-zinc-550'
          }`}>{noteName}</span>
          {isActive && <span className="text-[7px] font-black uppercase text-white leading-none mt-1">{intervalLabel || 'N'}</span>}
        </button>
      );
      whiteIndex++;
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10001] flex items-center justify-center p-4 antialiased overflow-hidden select-none">
      <div className="bg-surface border border-border rounded-3xl w-full max-w-sm sm:max-w-md shadow-2xl flex flex-col h-full max-h-[92vh] text-text-main notranslate animate-in fade-in zoom-in duration-200" translate="no" id="piano-chord-editor-modal">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0 bg-surface rounded-t-3xl">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎹</span>
            <div>
              <h3 className="text-base font-black text-text-main uppercase tracking-widest leading-none">Editor de Shapes</h3>
              <p className="text-[10px] text-text-muted mt-1 leading-none font-bold">Ajustador do Teclado</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 px-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-muted hover:text-text-main rounded-lg border border-border transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Target Title badge */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-border rounded-2xl">
            <span className="text-xs font-bold text-text-muted">Acorde Selecionado</span>
            <span className="text-sm font-black text-indigo-600 dark:text-white px-3 py-1 bg-indigo-500/10 dark:bg-indigo-600 rounded-xl border border-indigo-500/20 dark:border-indigo-500 shadow-sm font-mono tracking-widest shrink-0">
              {chordName}
            </span>
          </div>

          <div className="flex gap-2 p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-medium rounded-xl select-none">
            <Info size={14} className="shrink-0 mt-0.5 text-indigo-400" />
            <p className="leading-snug">
              Clique nas teclas para ligar ou desligar as notas. O primeiro tom (mais à esquerda) atuará como o <strong className="text-indigo-400 font-black">Baixo</strong> do acorde.
            </p>
          </div>

          {/* Interactive Keyboard Stage */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1.5 font-mono">Teclado Virtual (2 Oitavas)</span>
            
            <div className="w-full max-w-full overflow-x-auto p-2 bg-zinc-950/40 rounded-2xl border border-border/40 flex justify-center custom-scrollbar">
              <div 
                className="relative bg-zinc-900 border-t border-b border-l border-r border-zinc-950 rounded-lg py-1 shadow-inner overflow-visible"
                style={{ width: `${15 * whiteKeyWidth}px`, height: `${whiteKeyHeight + 8}px` }}
              >
                {/* White keys board level */}
                <div className="absolute inset-0">
                  {whiteKeysSec}
                </div>
                {/* Black keys overlaid on top */}
                <div className="absolute inset-0 pointer-events-none">
                  {blackKeysSec}
                </div>
              </div>
            </div>
          </div>

          {/* Color Indicators Legend */}
          <div className="flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-wider text-text-muted bg-black/5 dark:bg-white/5 border border-border/40 py-2.5 rounded-xl">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-indigo-600" />
              <span>Baixo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span>Acorde (Nota)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-white border border-zinc-300" />
              <span>Inativa</span>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-5 bg-black/15 dark:bg-black/30 border-t border-border shrink-0 flex flex-col gap-2 rounded-b-3xl" id="piano-editor-footer">
          <button
            type="button"
            onClick={handleSaveClick}
            className="w-full py-3 bg-brand text-white text-xs font-black uppercase tracking-wider rounded-xl hover:brightness-110 active:scale-98 flex items-center justify-center gap-1.5 shadow-md shadow-brand/20 border-none cursor-pointer transition-all hover:shadow-brand/35"
          >
            <Check size={14} /> Confirmar & Salvar Shape
          </button>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRestoreClick}
              className="grow py-2 bg-black/5 dark:bg-white/5 border border-border text-zinc-500 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 text-[10px] font-black uppercase tracking-wide rounded-xl active:scale-98 flex items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <RotateCcw size={12} /> Padrão da Fábrica
            </button>
            <button
              type="button"
              onClick={() => { setKeys([]); }}
              className="grow py-2 bg-black/5 dark:bg-white/5 border border-border text-text-muted hover:text-text-main text-[10px] font-black uppercase tracking-wide rounded-xl active:scale-98 cursor-pointer transition-all"
            >
              Limpar Teclas
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Database representing standard chord shapes
// All shapes use a standard chord finger positioning
export const GUITAR_DATABASE: Record<string, Record<string, GuitarChordShape>> = {
  'C': {
    '': { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
    'm': { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 3, barre: { fret: 3, start: 2, end: 6 } },
    '7': { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
    'm7': { frets: [-1, 3, 5, 3, 4, 3], fingers: [0, 1, 3, 1, 2, 1], baseFret: 3, barre: { fret: 3, start: 2, end: 6 } },
    '7M': { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
    'maj7': { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
    'add9': { frets: [-1, 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0] },
    'sus4': { frets: [-1, 3, 3, 0, 1, 1], fingers: [0, 3, 4, 0, 1, 1] },
    '2': { frets: [-1, 3, 0, 0, 1, 0], fingers: [0, 3, 0, 0, 1, 0] },
    '4': { frets: [-1, 3, 3, 0, 1, 1], fingers: [0, 3, 4, 0, 1, 1] },
    '9(#11)': { frets: [-1, 3, 2, 3, 3, 2], fingers: [0, 2, 1, 3, 4, 1], baseFret: 1, barre: { fret: 2, start: 4, end: 6 } },
    'dim': { frets: [-1, 3, 4, 2, 4, -1], fingers: [0, 2, 4, 1, 3, 0], baseFret: 1 },
  },
  'C#': {
    '': { frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], baseFret: 4, barre: { fret: 4, start: 2, end: 6 } },
    'm': { frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4, barre: { fret: 4, start: 2, end: 6 } },
    '7': { frets: [-1, 4, 6, 4, 6, 4], fingers: [0, 1, 3, 1, 4, 1], baseFret: 4, barre: { fret: 4, start: 2, end: 6 } },
    'm7': { frets: [-1, 4, 6, 4, 5, 4], fingers: [0, 1, 3, 1, 2, 1], baseFret: 4, barre: { fret: 4, start: 2, end: 6 } },
    '7M': { frets: [-1, 4, 6, 5, 6, 4], fingers: [0, 1, 3, 2, 4, 1], baseFret: 4, barre: { fret: 4, start: 2, end: 6 } },
    'add9': { frets: [-1, 4, 3, 1, 4, 1], fingers: [0, 3, 2, 1, 4, 1], baseFret: 1 },
    'sus4': { frets: [-1, 4, 6, 6, 7, 4], fingers: [0, 1, 3, 4, 4, 1], baseFret: 4, barre: { fret: 4, start: 2, end: 6 } },
    '9(#11)': { frets: [-1, 4, 3, 4, 4, 3], fingers: [0, 2, 1, 3, 4, 1], baseFret: 3, barre: { fret: 3, start: 4, end: 6 } },
    'dim': { frets: [-1, 4, 5, 3, 5, -1], fingers: [0, 2, 4, 1, 3, 0], baseFret: 3 },
  },
  'D': {
    '': { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
    'm': { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
    '7': { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
    'm7': { frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], barre: { fret: 1, start: 5, end: 6 } },
    '7M': { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1], barre: { fret: 2, start: 4, end: 6 } },
    'maj7': { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1], barre: { fret: 2, start: 4, end: 6 } },
    'add9': { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0] },
    'sus4': { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 3, 4] },
    '2': { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0] },
    '4': { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 3, 4] },
    '9(#11)': { frets: [-1, 5, 4, 5, 5, 4], fingers: [0, 2, 1, 3, 4, 1], baseFret: 4, barre: { fret: 4, start: 4, end: 6 } },
    'dim': { frets: [-1, -1, 0, 1, 0, 1], fingers: [0, 0, 0, 1, 0, 2], baseFret: 1 },
  },
  'D#': {
    '': { frets: [-1, 6, 8, 8, 8, 6], fingers: [0, 1, 2, 3, 4, 1], baseFret: 6, barre: { fret: 6, start: 2, end: 6 } },
    'm': { frets: [-1, 6, 8, 8, 7, 6], fingers: [0, 1, 3, 4, 2, 1], baseFret: 6, barre: { fret: 6, start: 2, end: 6 } },
    '7': { frets: [-1, 6, 8, 6, 8, 6], fingers: [0, 1, 3, 1, 4, 1], baseFret: 6, barre: { fret: 6, start: 2, end: 6 } },
    'm7': { frets: [-1, 6, 8, 6, 7, 6], fingers: [0, 1, 3, 1, 2, 1], baseFret: 6, barre: { fret: 6, start: 2, end: 6 } },
    '7M': { frets: [-1, 6, 8, 7, 8, 6], fingers: [0, 1, 3, 2, 4, 1], baseFret: 6, barre: { fret: 6, start: 2, end: 6 } },
    'sus4': { frets: [-1, 6, 8, 8, 9, 6], fingers: [0, 1, 3, 4, 4, 1], baseFret: 6, barre: { fret: 6, start: 2, end: 6 } },
    '9(#11)': { frets: [-1, 6, 5, 6, 6, 5], fingers: [0, 2, 1, 3, 4, 1], baseFret: 5, barre: { fret: 5, start: 4, end: 6 } },
    'dim': { frets: [-1, -1, 1, 2, 1, 2], fingers: [0, 0, 1, 3, 2, 4], baseFret: 1 },
  },
  'E': {
    '': { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
    'm': { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
    '7': { frets: [0, 2, 0, 1, 3, 0], fingers: [0, 2, 0, 1, 4, 0] },
    'm7': { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0] },
    '7M': { frets: [0, 2, 1, 1, 0, 0], fingers: [0, 3, 1, 2, 0, 0] },
    'maj7': { frets: [0, 2, 1, 1, 0, 0], fingers: [0, 3, 1, 2, 0, 0] },
    'add9': { frets: [0, 2, 4, 1, 0, 0], fingers: [0, 2, 4, 1, 0, 0] },
    'sus4': { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0] },
    '2': { frets: [0, 2, 4, 1, 0, 0], fingers: [0, 2, 4, 1, 0, 0] },
    '4': { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0] },
    '9(#11)': { frets: [-1, 7, 6, 7, 7, 6], fingers: [0, 2, 1, 3, 4, 1], baseFret: 6, barre: { fret: 6, start: 4, end: 6 } },
    'dim': { frets: [-1, -1, 2, 3, 2, 3], fingers: [0, 0, 1, 3, 2, 4], baseFret: 1 },
  },
  'F': {
    '': { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1, barre: { fret: 1, start: 1, end: 6 } },
    'm': { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1, barre: { fret: 1, start: 1, end: 6 } },
    '7': { frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], baseFret: 1, barre: { fret: 1, start: 1, end: 6 } },
    'm7': { frets: [1, 3, 1, 1, 1, 1], fingers: [1, 3, 1, 1, 1, 1], baseFret: 1, barre: { fret: 1, start: 1, end: 6 } },
    '7M': { frets: [-1, 3, 3, 2, 1, 0], fingers: [0, 3, 4, 2, 1, 0] },
    'maj7': { frets: [-1, 3, 3, 2, 1, 0], fingers: [0, 3, 4, 2, 1, 0] },
    'add9': { frets: [1, 3, 3, 2, 1, 3], fingers: [1, 2, 3, 1, 1, 4], baseFret: 1, barre: { fret: 1, start: 1, end: 5 } },
    'sus4': { frets: [1, 3, 3, 3, 1, 1], fingers: [1, 3, 4, 5, 1, 1], baseFret: 1, barre: { fret: 1, start: 1, end: 6 } },
    '9(#11)': { frets: [-1, 8, 7, 8, 8, 7], fingers: [0, 2, 1, 3, 4, 1], baseFret: 7, barre: { fret: 7, start: 4, end: 6 } },
    'dim': { frets: [1, -1, 0, 1, 0, -1], fingers: [1, 0, 0, 2, 0, 0], baseFret: 1 },
  },
  'F#': {
    '': { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barre: { fret: 2, start: 1, end: 6 } },
    'm': { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2, barre: { fret: 2, start: 1, end: 6 } },
    '7': { frets: [2, 4, 2, 3, 2, 2], fingers: [1, 3, 1, 2, 1, 1], baseFret: 2, barre: { fret: 2, start: 1, end: 6 } },
    'm7': { frets: [2, 4, 2, 2, 2, 2], fingers: [1, 3, 1, 1, 1, 1], baseFret: 2, barre: { fret: 2, start: 1, end: 6 } },
    '7M': { frets: [-1, -1, 4, 3, 2, 1], fingers: [0, 0, 4, 3, 2, 1] },
    'sus4': { frets: [2, 4, 4, 4, 2, 2], fingers: [1, 3, 4, 5, 1, 1], baseFret: 2, barre: { fret: 2, start: 1, end: 6 } },
    '9(#11)': { frets: [-1, 9, 8, 9, 9, 8], fingers: [0, 2, 1, 3, 4, 1], baseFret: 8, barre: { fret: 8, start: 4, end: 6 } },
    'dim': { frets: [2, -1, 1, 2, 1, -1], fingers: [3, 0, 1, 4, 2, 0], baseFret: 1 },
  },
  'G': {
    '': { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
    'm': { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3, barre: { fret: 3, start: 1, end: 6 } },
    '7': { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
    'm7': { frets: [3, 5, 3, 3, 3, 3], fingers: [1, 3, 1, 1, 1, 1], baseFret: 3, barre: { fret: 3, start: 1, end: 6 } },
    '7M': { frets: [3, 2, 0, 0, 0, 2], fingers: [3, 1, 0, 0, 0, 2] },
    'maj7': { frets: [3, 2, 0, 0, 0, 2], fingers: [3, 1, 0, 0, 0, 2] },
    'add9': { frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4] },
    'sus4': { frets: [3, -1, 0, 0, 1, 3], fingers: [3, 0, 0, 0, 1, 4] },
    '2': { frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4] },
    '4': { frets: [3, -1, 0, 0, 1, 3], fingers: [3, 0, 0, 0, 1, 4] },
    '9(#11)': { frets: [3, -1, 3, 2, 2, 3], fingers: [2, 0, 3, 1, 1, 4], baseFret: 1, barre: { fret: 2, start: 4, end: 5 } },
    'dim': { frets: [3, -1, 2, 3, 2, -1], fingers: [3, 0, 1, 4, 2, 0], baseFret: 1 },
  },
  'G#': {
    '': { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], baseFret: 4, barre: { fret: 4, start: 1, end: 6 } },
    'm': { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4, barre: { fret: 4, start: 1, end: 6 } },
    '7': { frets: [4, 6, 4, 5, 4, 4], fingers: [1, 3, 1, 2, 1, 1], baseFret: 4, barre: { fret: 4, start: 1, end: 6 } },
    'm7': { frets: [4, 6, 4, 4, 4, 4], fingers: [1, 3, 1, 1, 1, 1], baseFret: 4, barre: { fret: 4, start: 1, end: 6 } },
    '7M': { frets: [-1, -1, 6, 5, 4, 3], fingers: [0, 0, 4, 3, 2, 1], baseFret: 3 },
    'sus4': { frets: [4, 6, 6, 6, 4, 4], fingers: [1, 3, 4, 5, 1, 1], baseFret: 4, barre: { fret: 4, start: 1, end: 6 } },
    '9(#11)': { frets: [-1, 11, 10, 11, 11, 10], fingers: [0, 2, 1, 3, 4, 1], baseFret: 9, barre: { fret: 10, start: 4, end: 6 } },
    'dim': { frets: [4, -1, 3, 4, 3, -1], fingers: [3, 0, 1, 4, 2, 0], baseFret: 2 },
  },
  'A': {
    '': { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
    'm': { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
    '7': { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 1, 0, 2, 0] },
    'm7': { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
    '7M': { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
    'maj7': { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
    'add9': { frets: [-1, 0, 2, 4, 2, 0], fingers: [0, 0, 1, 4, 2, 0] },
    'sus4': { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 4, 0] },
    '2': { frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0] },
    '4': { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 4, 0] },
    '9(#11)': { frets: [5, -1, 5, 4, 4, 5], fingers: [2, 0, 3, 1, 1, 4], baseFret: 4, barre: { fret: 4, start: 4, end: 5 } },
    'dim': { frets: [-1, 0, 1, 2, 1, -1], fingers: [0, 0, 1, 3, 2, 0], baseFret: 1 },
  },
  'A#': {
    '': { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barre: { fret: 1, start: 2, end: 6 } },
    'm': { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barre: { fret: 1, start: 2, end: 6 } },
    '7': { frets: [-1, 1, 3, 1, 3, 1], fingers: [0, 1, 3, 1, 4, 1], baseFret: 1, barre: { fret: 1, start: 2, end: 6 } },
    'm7': { frets: [-1, 1, 3, 1, 2, 1], fingers: [0, 1, 3, 1, 2, 1], baseFret: 1, barre: { fret: 1, start: 2, end: 6 } },
    '7M': { frets: [-1, 1, 3, 2, 3, 1], fingers: [0, 1, 3, 2, 4, 1], baseFret: 1, barre: { fret: 1, start: 2, end: 6 } },
    'sus4': { frets: [-1, 1, 3, 3, 4, 1], fingers: [0, 1, 3, 4, 5, 1], baseFret: 1, barre: { fret: 1, start: 2, end: 6 } },
    '9(#11)': { frets: [6, -1, 6, 5, 5, 6], fingers: [2, 0, 3, 1, 1, 4], baseFret: 5, barre: { fret: 5, start: 4, end: 5 } },
    'dim': { frets: [-1, 1, 2, 0, 2, -1], fingers: [0, 1, 2, 0, 3, 0], baseFret: 1 },
  },
  'B': {
    '': { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barre: { fret: 2, start: 2, end: 6 } },
    'm': { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2, barre: { fret: 2, start: 2, end: 6 } },
    '7': { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
    'm7': { frets: [-1, 2, 4, 2, 3, 2], fingers: [0, 1, 3, 1, 2, 1], baseFret: 2, barre: { fret: 2, start: 2, end: 6 } },
    '7M': { frets: [-1, 2, 4, 3, 4, 2], fingers: [0, 1, 3, 2, 4, 1], baseFret: 2, barre: { fret: 2, start: 2, end: 6 } },
    'maj7': { frets: [-1, 2, 4, 3, 4, 2], fingers: [0, 1, 3, 2, 4, 1], baseFret: 2, barre: { fret: 2, start: 2, end: 6 } },
    'add9': { frets: [-1, 2, 1, 2, 2, 2], fingers: [0, 2, 1, 3, 3, 3], barre: { fret: 2, start: 3, end: 6 } },
    'sus4': { frets: [-1, 2, 4, 4, 5, 2], fingers: [0, 1, 3, 4, 5, 1], baseFret: 2, barre: { fret: 2, start: 2, end: 6 } },
    '9(#11)': { frets: [7, -1, 7, 6, 6, 7], fingers: [2, 0, 3, 1, 1, 4], baseFret: 6, barre: { fret: 6, start: 4, end: 5 } },
    'dim': { frets: [-1, 2, 3, 1, 3, -1], fingers: [0, 2, 4, 1, 3, 0], baseFret: 1 },
  },
  'C/E': {
    '': { frets: [-1, -1, 2, 0, 1, 3], fingers: [0, 0, 2, 0, 1, 3] }
  },
  'C/G': {
    '': { frets: [3, 3, 2, 0, 1, 0], fingers: [3, 4, 2, 0, 1, 0] }
  },
  'C/Bb': {
    '': { frets: [-1, 1, 2, 0, 1, 0], fingers: [0, 1, 2, 0, 3, 0] }
  },
  'C#/F': {
    '': { frets: [-1, -1, 3, 1, 2, 1], fingers: [0, 0, 3, 1, 2, 1], baseFret: 1 }
  },
  'Db/F': {
    '': { frets: [-1, -1, 3, 1, 2, 1], fingers: [0, 0, 3, 1, 2, 1], baseFret: 1 }
  },
  'D/F#': {
    '': { frets: [2, -1, 0, 2, 3, 2], fingers: [1, 0, 0, 2, 4, 3] }
  },
  'D/A': {
    '': { frets: [-1, 0, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] }
  },
  'D/C': {
    '': { frets: [-1, 3, 0, 2, 3, 2], fingers: [0, 2, 0, 1, 4, 3] }
  },
  'Dm/C': {
    '': { frets: [-1, 3, 0, 2, 3, 1], fingers: [0, 3, 0, 2, 4, 1] }
  },
  'Dm/F': {
    '': { frets: [1, -1, 0, 2, 3, 1], fingers: [1, 0, 0, 2, 4, 1] }
  },
  'E/G#': {
    '': { frets: [4, -1, 2, 1, 0, 0], fingers: [4, 0, 2, 1, 0, 0] }
  },
  'E/B': {
    '': { frets: [-1, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] }
  },
  'E/D': {
    '': { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] }
  },
  'Em/D': {
    '': { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0] }
  },
  'Em/G': {
    '': { frets: [3, 2, 2, 0, 0, 0], fingers: [3, 1, 2, 0, 0, 0] }
  },
  'F/A': {
    '': { frets: [-1, 0, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1], barre: { fret: 1, start: 5, end: 6 } }
  },
  'F/C': {
    '': { frets: [-1, 3, 3, 2, 1, 1], fingers: [0, 3, 4, 2, 1, 1], baseFret: 1, barre: { fret: 1, start: 5, end: 6 } }
  },
  'F#/A#': {
    '': { frets: [-1, 1, 4, 3, 2, 2], fingers: [0, 1, 4, 3, 2, 2], baseFret: 1, barre: { fret: 2, start: 5, end: 6 } }
  },
  'G/B': {
    '': { frets: [-1, 2, 0, 0, 0, 3], fingers: [0, 1, 0, 0, 0, 4] }
  },
  'G/D': {
    '': { frets: [-1, -1, 0, 0, 0, 3], fingers: [0, 0, 0, 0, 0, 3] }
  },
  'G/F': {
    '': { frets: [1, 2, 0, 0, 0, 3], fingers: [1, 2, 0, 0, 0, 4] }
  },
  'Gm/F': {
    '': { frets: [1, -1, 0, 3, 3, 3], fingers: [1, 0, 0, 3, 4, 2] }
  },
  'Gm7/C': {
    '': { frets: [-1, 3, 3, 3, 3, 3], fingers: [0, 1, 1, 1, 1, 1], baseFret: 3, barre: { fret: 3, start: 2, end: 6 } }
  },
  'A/C#': {
    '': { frets: [-1, 4, 2, 2, 2, 0], fingers: [0, 4, 1, 1, 1, 0], baseFret: 2, barre: { fret: 2, start: 3, end: 5 } }
  },
  'A/E': {
    '': { frets: [0, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] }
  },
  'A/G': {
    '': { frets: [3, 0, 2, 2, 2, 0], fingers: [3, 0, 1, 2, 3, 0] }
  },
  'Am/G': {
    '': { frets: [3, 0, 2, 2, 1, 0], fingers: [3, 0, 2, 3, 1, 0] }
  },
  'B/D#': {
    '': { frets: [-1, 6, 4, 4, 4, -1], fingers: [0, 3, 1, 1, 1, 0], baseFret: 4, barre: { fret: 4, start: 3, end: 5 } }
  },
  'B/F#': {
    '': { frets: [2, 2, 4, 4, 4, 2], fingers: [1, 1, 3, 3, 3, 1], baseFret: 2, barre: { fret: 2, start: 1, end: 6 } }
  },
  'B/A': {
    '': { frets: [-1, 0, 4, 4, 4, -1], fingers: [0, 0, 1, 1, 1, 0], baseFret: 4, barre: { fret: 4, start: 3, end: 5 } }
  },
  'B/E': {
    '': { frets: [0, 2, 4, 4, 4, 2], fingers: [0, 1, 3, 3, 3, 1], baseFret: 2, barre: { fret: 2, start: 2, end: 6 } }
  },
  'C#m/B': {
    '': { frets: [-1, 2, 4, 6, 5, 4], fingers: [0, 1, 2, 4, 3, 1], baseFret: 2, barre: { fret: 2, start: 2, end: 6 } }
  },
  'F#m/E': {
    '': { frets: [0, 4, 4, 2, 2, 2], fingers: [0, 3, 4, 1, 1, 1], baseFret: 2, barre: { fret: 2, start: 4, end: 6 } }
  },
  'G#m/F#': {
    '': { frets: [2, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4, barre: { fret: 4, start: 4, end: 6 } }
  },
  'F/G': {
    '': { frets: [3, -1, 3, 0, 1, 1], fingers: [3, 0, 4, 0, 1, 2] }
  },
  'G/A': {
    '': { frets: [5, -1, 5, 0, 3, 3], fingers: [3, 0, 4, 0, 1, 2], baseFret: 3 }
  },
  'A/B': {
    '': { frets: [7, -1, 7, 0, 5, 5], fingers: [3, 0, 4, 0, 1, 2], baseFret: 5 }
  },
  'Bb/C': {
    '': { frets: [8, -1, 8, 0, 6, 6], fingers: [3, 0, 4, 0, 1, 2], baseFret: 6 }
  },
  'A#/C': {
    '': { frets: [8, -1, 8, 0, 6, 6], fingers: [3, 0, 4, 0, 1, 2], baseFret: 6 }
  },
  'C/D': {
    '': { frets: [-1, 3, 0, 0, 1, 0], fingers: [0, 3, 0, 0, 1, 0] }
  },
  'D/E': {
    '': { frets: [0, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] }
  },
  'Eb/G': {
    '': { frets: [-1, -1, 5, 3, 4, 3], fingers: [0, 0, 3, 1, 2, 1], baseFret: 3, barre: { fret: 3, start: 4, end: 6 } }
  },
  'D#/G': {
    '': { frets: [-1, -1, 5, 3, 4, 3], fingers: [0, 0, 3, 1, 2, 1], baseFret: 3, barre: { fret: 3, start: 4, end: 6 } }
  }
};

// Helper to dynamically construct a guitar shape for an inverted (slash) chord
export function getSlashGuitarShape(baseShape: GuitarChordShape, bassNote: string): GuitarChordShape {
  const frets = [...baseShape.frets];
  const fingers = baseShape.fingers ? [...baseShape.fingers] : [0, 0, 0, 0, 0, 0];
  
  let cleanedBass = bassNote.trim();
  if (ALIASES[cleanedBass]) {
    cleanedBass = ALIASES[cleanedBass];
  } else if (cleanedBass === 'Db') { cleanedBass = 'C#'; }
  else if (cleanedBass === 'Eb') { cleanedBass = 'D#'; }
  else if (cleanedBass === 'Gb') { cleanedBass = 'F#'; }
  else if (cleanedBass === 'Ab') { cleanedBass = 'G#'; }
  else if (cleanedBass === 'Bb') { cleanedBass = 'A#'; }

  const bassIdx = NOTES_DICT.indexOf(cleanedBass);
  if (bassIdx === -1) return baseShape;

  const openNotes = ['E', 'A', 'D', 'G', 'B', 'E'];
  const baseFret = baseShape.baseFret || 1;

  // We want to find the best string (among string 6, 5, 4 - indices 0, 1, 2) to play the bass note on.
  let bestString = -1;
  let bestFret = -1;
  let bestScore = -1;

  for (let s = 0; s <= 2; s++) {
    const openNoteIdx = NOTES_DICT.indexOf(openNotes[s]);
    let fret = (bassIdx - openNoteIdx + 12) % 12;
    
    // Adjust fret based on baseFret of the chord (finding acceptable octave)
    if (baseFret > 1) {
      while (fret < baseFret) {
        fret += 12;
      }
    }

    // Measure proximity to active frets of the base shape
    const activeFrets = baseShape.frets.filter(f => f > 0);
    const minFret = activeFrets.length > 0 ? Math.min(...activeFrets) : baseFret;
    const maxFret = activeFrets.length > 0 ? Math.max(...activeFrets) : baseFret + 2;

    const lowerBound = Math.max(0, minFret - 1);
    const upperBound = maxFret + 1;

    // Check if fret is in playable range
    if (fret === 0 || (fret >= lowerBound && fret <= upperBound && fret <= 12)) {
      // Open string bass is always preferred over fretted
      const openBonus = fret === 0 ? 50 : 0;
      // Prefer string 6 (index 0) over string 5 (index 1) over string 4 (index 2)
      const score = (openNotes.length - s) * 10 - Math.abs(fret - minFret) + openBonus;
      if (score > bestScore) {
        bestScore = score;
        bestString = s;
        bestFret = fret;
      }
    }
  }

  // Fallback: If no comfortable fret is within the normal hand range, find the absolute lowest available fret on any bass string (6, 5, or 4) that corresponds to the note.
  if (bestString === -1) {
    for (let s = 0; s <= 2; s++) {
      const openNoteIdx = NOTES_DICT.indexOf(openNotes[s]);
      let fret = (bassIdx - openNoteIdx + 12) % 12;
      const score = 100 - fret - s * 10; // Prefer lower frets and lower strings
      if (score > bestScore) {
        bestScore = score;
        bestString = s;
        bestFret = fret;
      }
    }
  }

  if (bestString !== -1) {
    // Mute strings below the bass note string to make sure it's the lowest note
    for (let s = 0; s < bestString; s++) {
      frets[s] = -1;
      fingers[s] = 0;
    }
    
    // Assign fret
    frets[bestString] = bestFret;
    
    // Assign finger intelligently to avoid impossible shapes
    if (bestFret === 0) {
      fingers[bestString] = 0;
    } else {
      // General rule: if we're adding a fretted bass note on string 6 (index 0), 
      // we MUST mute string 5 (index 1) if it was fretted, to make it playable and avoid crowded fingers.
      if (bestString === 0 && frets[1] > 0) {
        const savedFinger = fingers[1] || 3;
        frets[1] = -1;
        fingers[1] = 0;
        fingers[0] = savedFinger;
      } else {
        // Fallback: use finger 1 or 3
        fingers[bestString] = bestFret === 1 ? 1 : 3;
      }
    }

    // Adjust/Remove barre if it crosses the new bass note and conflicts with it
    let barre = baseShape.barre;
    if (barre && (barre.start <= bestString + 1)) {
      if (bestString >= barre.start - 1) {
        if (bestString < 5) {
          barre = {
            ...barre,
            start: Math.max(barre.start, bestString + 2)
          };
        } else {
          barre = undefined;
        }
      }
    }

    // Guard: Count how many fingers are used, and cap at 4 unique fingers.
    // Barre strings don't add to finger count if they are played by finger 1.
    let uniqueFingerNumbers = Array.from(new Set(fingers.filter(f => f > 0)));
    let frettedStringsCount = frets.filter(f => f > 0).length;

    // If there is too many fingers or the shape is uncomfortable, simplify:
    if (uniqueFingerNumbers.length > 4 || frettedStringsCount > 4) {
      // First, let's mute high E (string 1, index 5) if it is fretted and not part of a barre
      if (frets[5] > 0 && (!barre || 6 < barre.start || 6 > barre.end)) {
        frets[5] = -1;
        fingers[5] = 0;
      }
      
      uniqueFingerNumbers = Array.from(new Set(fingers.filter(f => f > 0)));
      // If still too complex, mute B string (string 2, index 4) if it is fretted and not part of a barre
      if ((uniqueFingerNumbers.length > 4 || frets.filter(f => f > 0).length > 4) && frets[4] > 0 && (!barre || 5 < barre.start || 5 > barre.end)) {
        frets[4] = -1;
        fingers[4] = 0;
      }
    }

    // Ensure all muted/open strings have finger 0, and valid frets have valid fingers
    for (let s = 0; s < 6; s++) {
      if (frets[s] <= 0) {
        fingers[s] = 0;
      } else if (fingers[s] === 0) {
        fingers[s] = 1; // Default fallback to finger 1
      }
    }

    return {
      frets,
      fingers,
      baseFret: Math.max(1, baseShape.baseFret || 1, ...frets.filter(f => f > 0).map(f => f - 3)),
      barre
    };
  }

  return baseShape;
}

// Suffix helper translates any chord name suffixes to database keys
export function resolveChordSuffix(chordName: string): { root: string; suffix: string } {
  let normalized = chordName.trim().replace(/\(\/([A-G][#b]?)\)/g, '/$1'); // e.g. Gm7(/C) -> Gm7/C

  // If we have an exact match in GUITAR_DATABASE, return it directly
  if (GUITAR_DATABASE[normalized]) {
    return { root: normalized, suffix: '' };
  }

  // Handle slashes - e.g. B/E -> if not in DB, fallback to B
  if (normalized.includes('/')) {
    const parts = normalized.split('/');
    const preSlash = parts[0].trim();
    if (GUITAR_DATABASE[preSlash]) {
      return { root: preSlash, suffix: '' };
    }
    // Deep lookup with suffix
    const parsedPre = resolveChordSuffix(preSlash);
    if (GUITAR_DATABASE[parsedPre.root]) {
      return parsedPre;
    }
  }

  // Extract root note
  const match = normalized.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return { root: 'C', suffix: '' };

  let root = match[1];
  let rawSuffix = match[2];

  // Map alias flats/simplifications
  if (ALIASES[root + rawSuffix]) {
    const aliasResolved = ALIASES[root + rawSuffix];
    const secondMatch = aliasResolved.match(/^([A-G][#b]?)(.*)$/);
    if (secondMatch) {
      root = secondMatch[1];
      rawSuffix = secondMatch[2];
    }
  } else if (root === 'Db') { root = 'C#'; }
  else if (root === 'Eb') { root = 'D#'; }
  else if (root === 'Gb') { root = 'F#'; }
  else if (root === 'Ab') { root = 'G#'; }
  else if (root === 'Bb') { root = 'A#'; }

  // Clean rawSuffix to match our dictionary
  let suffix = '';
  if (rawSuffix.includes('dim') || rawSuffix.includes('º') || rawSuffix.includes('°') || rawSuffix.includes('diminuto') || rawSuffix === 'o' || rawSuffix === 'o7') {
    suffix = 'dim';
  } else if (rawSuffix.includes('4+') || rawSuffix.includes('#4') || rawSuffix.includes('(#4)') || rawSuffix.includes('#11') || rawSuffix.includes('(#11)')) {
    suffix = '9(#11)';
  } else if (rawSuffix.includes('maj7') || rawSuffix.includes('7M') || rawSuffix.includes('M7') || rawSuffix.includes('7+') || rawSuffix.includes('+7') || rawSuffix.includes('Δ') || rawSuffix.includes('7maj')) {
    suffix = '7M';
  } else if (rawSuffix.includes('m7b5') || rawSuffix.includes('m7(b5)')) {
    suffix = 'm7'; // Approximated
  } else if (rawSuffix.includes('alt')) {
    suffix = '7'; // Approximated
  } else if (rawSuffix.includes('add9') || rawSuffix.includes('9')) {
    suffix = 'add9';
  } else if (rawSuffix.includes('11')) {
    suffix = 'sus4'; // A 11 is/contains the 4th interval (octave shifted)
  } else if (rawSuffix.includes('13')) {
    suffix = rawSuffix.includes('m') ? 'm7' : '7';
  } else if (rawSuffix.includes('7')) {
    // If it has 'm' and starts or contains 'm' indicating minor triad, it is m7
    // Avoid classifying 'D7m' or 'D7' (without a minor 'm' prefix) as minor. 
    // Usually '7m' represents a dominant seventh (major triad with minor 7th), so standard major 7.
    // However, 'm7' or 'm7m' has the 'm' before 7, e.g. Am7, Am7m, Abm7.
    const isMinor = /^[a-g]?m(?!aj)|m7|min7/.test(rawSuffix) || (rawSuffix.startsWith('m') && !rawSuffix.startsWith('maj'));
    suffix = isMinor ? 'm7' : '7';
  } else if (rawSuffix.startsWith('m') || rawSuffix.startsWith('min') || rawSuffix === 'm') {
    suffix = 'm';
  } else if (rawSuffix.includes('add4') || rawSuffix.includes('sus4') || rawSuffix.includes('4') || rawSuffix.includes('sus')) {
    suffix = 'sus4';
  } else if (rawSuffix.includes('add2') || rawSuffix.includes('sus2') || rawSuffix.includes('2')) {
    suffix = '2';
  }

  return { root, suffix };
}

// Generate piano key positions relative to root semitone
export function getPianoKeys(chordName: string): number[] {
  const saved = getSavedPianoChordShape(chordName);
  if (saved && saved.keys && saved.keys.length > 0) {
    return saved.keys;
  }

  let normalized = chordName.trim().replace(/\(\/([A-G][#b]?)\)/g, '/$1');

  if (normalized.includes('/')) {
    const parts = normalized.split('/');
    const preSlash = parts[0].trim();
    const postSlash = parts[1].trim();

    const baseKeys = getPianoKeys(preSlash);

    let bassRoot = postSlash;
    if (ALIASES[bassRoot]) {
      bassRoot = ALIASES[bassRoot];
    } else if (bassRoot === 'Db') { bassRoot = 'C#'; }
    else if (bassRoot === 'Eb') { bassRoot = 'D#'; }
    else if (bassRoot === 'Gb') { bassRoot = 'F#'; }
    else if (bassRoot === 'Ab') { bassRoot = 'G#'; }
    else if (bassRoot === 'Bb') { bassRoot = 'A#'; }

    const bassIndex = NOTES_DICT.indexOf(bassRoot);
    if (bassIndex !== -1) {
      const firstKey = baseKeys[0] !== undefined ? baseKeys[0] : 12;
      let bassKey = bassIndex;
      while (bassKey >= firstKey) {
        bassKey -= 12;
      }
      if (bassKey < firstKey - 12) {
        bassKey += 12;
      }
      return Array.from(new Set([bassKey, ...baseKeys])).sort((a, b) => a - b);
    }
  }

  const { root, suffix } = resolveChordSuffix(chordName);
  const rootIndex = NOTES_DICT.indexOf(root);
  if (rootIndex === -1) return [0, 4, 7]; // Fallback to C major

  let relativeSemitones = [0, 4, 7]; // Major
  if (suffix === 'dim') {
    relativeSemitones = [0, 3, 6, 9];
  } else if (suffix === 'm') {
    relativeSemitones = [0, 3, 7];
  } else if (suffix === '7') {
    relativeSemitones = [0, 4, 7, 10];
  } else if (suffix === 'm7') {
    relativeSemitones = [0, 3, 7, 10];
  } else if (suffix === '7M') {
    relativeSemitones = [0, 4, 7, 11];
  } else if (suffix === 'add9') {
    relativeSemitones = [0, 4, 7, 14];
  } else if (suffix === 'sus4') {
    relativeSemitones = [0, 5, 7];
  } else if (suffix === '2') {
    relativeSemitones = [0, 2, 7];
  } else if (suffix === '9(#11)') {
    relativeSemitones = [0, 4, 7, 10, 14, 18];
  }

  // Multiply to C4 scale anchor (let's say C4 is index 0)
  return relativeSemitones.map(semi => rootIndex + semi);
}

export function getIntervalLabel(val: number, chordName: string): string {
  const baseChord = chordName.split('/')[0].trim();
  const { root } = resolveChordSuffix(baseChord);
  let r = root;
  if (ALIASES[r]) r = ALIASES[r];
  else if (r === 'Db') r = 'C#';
  else if (r === 'Eb') r = 'D#';
  else if (r === 'Gb') r = 'F#';
  else if (r === 'Ab') r = 'G#';
  else if (r === 'Bb') r = 'A#';
  
  const rootIndex = NOTES_DICT.indexOf(r);
  if (rootIndex === -1) return '';
  const noteIdx = ((val % 12) + 12) % 12;
  const diff = (noteIdx - rootIndex + 12) % 12;
  
  const SEMITONE_TO_INTERVAL: { [key: number]: string } = {
    0: 'T',
    1: '2b',
    2: '2ª',
    3: '3m',
    4: '3M',
    5: '4J',
    6: 'b5',
    7: '5J',
    8: '5#',
    9: '6ª',
    10: '7m',
    11: '7M'
  };
  return SEMITONE_TO_INTERVAL[diff] ?? '';
}

export function getGuitarInterval(sIdx: number, fret: number, chordName: string): string {
  const GUITAR_TUNING = [4, 9, 2, 7, 11, 4]; // E, A, D, G, B, e
  const stringBase = GUITAR_TUNING[sIdx];
  const noteVal = stringBase + fret;
  return getIntervalLabel(noteVal, chordName);
}

// Guitar Chord SVG Renderer
function getRootNoteIndex(rootStr: string): number {
  let norm = rootStr.trim();
  if (ALIASES[norm]) norm = ALIASES[norm];
  const idx = NOTES_DICT.indexOf(norm);
  return idx !== -1 ? idx : 0;
}

export interface CagedShapeOption {
  cagedLetter: 'C' | 'A' | 'G' | 'E' | 'D';
  shape: GuitarChordShape;
  description: string;
}

export function getCagedShapesForChord(chordName: string): CagedShapeOption[] {
  const { root, suffix } = resolveChordSuffix(chordName);
  const rIdx = getRootNoteIndex(root);

  // Root frets on strings: 6th (E)=4, 5th (A)=9, 4th (D)=2
  const fretE = (rIdx - 4 + 12) % 12;
  const fretA = (rIdx - 9 + 12) % 12;
  const fretD = (rIdx - 2 + 12) % 12;

  // CAGED offsets (shifts from open template)
  const sC = (fretA - 3 + 12) % 12;
  const sA = fretA;
  const sG = (fretE - 3 + 12) % 12;
  const sE = fretE;
  const sD = fretD;

  const cleanSuffix = suffix.trim();

  const buildShape = (
    cagedLetter: 'C' | 'A' | 'G' | 'E' | 'D',
    shift: number,
    openFrets: number[],
    openFingers: number[],
    barreRange?: [number, number],
    bOffset: number = 0
  ): GuitarChordShape => {
    if (shift === 0) {
      const sh: GuitarChordShape = {
        frets: openFrets,
        fingers: openFingers,
        baseFret: 1
      };
      if (barreRange && bOffset > 0) {
        sh.barre = { fret: bOffset, start: barreRange[0], end: barreRange[1] };
      }
      return sh;
    }

    const frets = openFrets.map(f => (f === -1 ? -1 : f + shift));
    const playedFrets = frets.filter(f => f > 0);
    const baseFret = playedFrets.length > 0 ? Math.min(...playedFrets) : (shift || 1);

    let barre: { fret: number; start: number; end: number } | undefined;
    if (barreRange) {
      barre = { fret: shift + bOffset, start: barreRange[0], end: barreRange[1] };
    } else {
      const minFret = Math.min(...playedFrets);
      const strIndices = frets
        .map((f, i) => (f === minFret ? i + 1 : -1))
        .filter(i => i !== -1);
      if (strIndices.length >= 2) {
        const start = Math.min(...strIndices);
        const end = Math.max(...strIndices);
        if (end - start >= 2) {
          barre = { fret: minFret, start, end };
        }
      }
    }

    return {
      frets,
      fingers: openFingers,
      baseFret,
      barre
    };
  };

  let raw: { letter: 'C' | 'A' | 'G' | 'E' | 'D'; shift: number; frets: number[]; fingers: number[]; barre?: [number, number]; bOffset?: number }[] = [];

  if (cleanSuffix === 'm' || cleanSuffix === 'min') {
    raw = [
      { letter: 'C', shift: sC, frets: [-1, 3, 1, 0, 1, 3], fingers: [0, 3, 1, 0, 2, 4], barre: [3, 5], bOffset: 1 },
      { letter: 'A', shift: sA, frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 1, 3, 4, 2, 1], barre: [2, 6], bOffset: 0 },
      { letter: 'G', shift: sG, frets: [3, 1, 0, 0, 3, 3], fingers: [4, 1, 0, 0, 3, 3], barre: [3, 4], bOffset: 0 },
      { letter: 'E', shift: sE, frets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1], barre: [1, 6], bOffset: 0 },
      { letter: 'D', shift: sD, frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 1, 3, 4, 2] }
    ];
  } else if (cleanSuffix === '7') {
    raw = [
      { letter: 'C', shift: sC, frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], barre: [4, 6], bOffset: 0 },
      { letter: 'A', shift: sA, frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 1, 3, 1, 4, 1], barre: [2, 6], bOffset: 0 },
      { letter: 'G', shift: sG, frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
      { letter: 'E', shift: sE, frets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1], barre: [1, 6], bOffset: 0 },
      { letter: 'D', shift: sD, frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 1, 3, 2, 4] }
    ];
  } else if (cleanSuffix === 'm7') {
    raw = [
      { letter: 'C', shift: sC, frets: [-1, 3, 1, 3, 1, 1], fingers: [0, 3, 1, 4, 1, 1], barre: [3, 6], bOffset: 1 },
      { letter: 'A', shift: sA, frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 1, 3, 1, 2, 1], barre: [2, 6], bOffset: 0 },
      { letter: 'G', shift: sG, frets: [3, 1, 0, 0, 3, 1], fingers: [4, 1, 0, 0, 3, 1] },
      { letter: 'E', shift: sE, frets: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1], barre: [1, 6], bOffset: 0 },
      { letter: 'D', shift: sD, frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 1, 3, 2, 2], barre: [5, 6], bOffset: 1 }
    ];
  } else if (cleanSuffix === '7M' || cleanSuffix === 'maj7' || cleanSuffix === 'M7') {
    raw = [
      { letter: 'C', shift: sC, frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
      { letter: 'A', shift: sA, frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 1, 3, 2, 4, 1], barre: [2, 6], bOffset: 0 },
      { letter: 'G', shift: sG, frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1] },
      { letter: 'E', shift: sE, frets: [0, 2, 1, 1, 0, 0], fingers: [1, 3, 2, 2, 1, 1], barre: [1, 6], bOffset: 0 },
      { letter: 'D', shift: sD, frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 1, 2, 2, 2], barre: [4, 6], bOffset: 2 }
    ];
  } else if (cleanSuffix === 'sus4' || cleanSuffix === '4') {
    raw = [
      { letter: 'C', shift: sC, frets: [-1, 3, 3, 0, 1, 1], fingers: [0, 3, 4, 0, 1, 1], barre: [5, 6], bOffset: 1 },
      { letter: 'A', shift: sA, frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 1, 2, 3, 4, 1], barre: [2, 6], bOffset: 0 },
      { letter: 'G', shift: sG, frets: [3, 3, 0, 0, 1, 3], fingers: [3, 4, 0, 0, 1, 3] },
      { letter: 'E', shift: sE, frets: [0, 2, 2, 2, 0, 0], fingers: [1, 3, 4, 4, 1, 1], barre: [1, 6], bOffset: 0 },
      { letter: 'D', shift: sD, frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 1, 2, 3, 4] }
    ];
  } else if (cleanSuffix === 'add9' || cleanSuffix === '2') {
    raw = [
      { letter: 'C', shift: sC, frets: [-1, 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0] },
      { letter: 'A', shift: sA, frets: [-1, 0, 2, 4, 2, 0], fingers: [0, 1, 2, 4, 3, 1], barre: [2, 6], bOffset: 0 },
      { letter: 'G', shift: sG, frets: [3, 2, 0, 2, 0, 3], fingers: [3, 2, 0, 1, 0, 4] },
      { letter: 'E', shift: sE, frets: [0, 2, 4, 1, 0, 0], fingers: [1, 2, 4, 3, 1, 1], barre: [1, 6], bOffset: 0 },
      { letter: 'D', shift: sD, frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0] }
    ];
  } else {
    // Default Major
    raw = [
      { letter: 'C', shift: sC, frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
      { letter: 'A', shift: sA, frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 1, 2, 3, 4, 1], barre: [2, 6], bOffset: 0 },
      { letter: 'G', shift: sG, frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4] },
      { letter: 'E', shift: sE, frets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1], barre: [1, 6], bOffset: 0 },
      { letter: 'D', shift: sD, frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 1, 3, 4, 2] }
    ];
  }

  const list: CagedShapeOption[] = raw.map(item => {
    const sh = buildShape(item.letter, item.shift, item.frets, item.fingers, item.barre, item.bOffset);
    return {
      cagedLetter: item.letter,
      shape: sh,
      description: `Formato ${item.letter} (${root}${suffix})`
    };
  });

  // Sort by baseFret so shapes ascend the fretboard logically
  list.sort((a, b) => (a.shape.baseFret || 1) - (b.shape.baseFret || 1));

  return list;
}

// Guitar Chord SVG Renderer
export function GuitarChordDiagram({ chordName, className = "", preferShowIntervals = false, songKey }: { chordName: string; className?: string; preferShowIntervals?: boolean; songKey?: string }) {
  const [localRevision, setLocalRevision] = useState(0);
  const [showIntervals, setShowIntervals] = useState(preferShowIntervals);
  const [shapeIndex, setShapeIndex] = useState(0);

  useEffect(() => {
    setShowIntervals(preferShowIntervals);
  }, [preferShowIntervals]);

  useEffect(() => {
    setShapeIndex(0);
  }, [chordName]);

  useEffect(() => {
    const handleUpdate = () => {
      setLocalRevision(prev => prev + 1);
    };
    window.addEventListener('chord-overrides-updated', handleUpdate);
    return () => window.removeEventListener('chord-overrides-updated', handleUpdate);
  }, []);

  const effectiveKey = songKey || (chordName.match(/^([A-G][#b]?)/)?.[1] || 'C');
  const degree = convertSingleChordToHarmonicMode(chordName, effectiveKey, 'roman');
  const func = convertSingleChordToHarmonicMode(chordName, effectiveKey, 'functions');

  const cifraVal = chordName;
  const grauVal = (degree && degree !== chordName) ? degree : 'I';
  const funcVal = (func && func !== chordName) ? func : 'Tôn';

  let normalized = chordName.trim().replace(/\(\/([A-G][#b]?)\)/g, '/$1');

  const cagedOptions = React.useMemo(() => getCagedShapesForChord(chordName), [chordName]);

  let shape: GuitarChordShape | undefined;
  let cagedLabel: 'C' | 'A' | 'G' | 'E' | 'D' = 'C';
  let isFallback = false;

  // 0. On default shapeIndex 0, check for custom saved shape or slash chord shape first
  if (shapeIndex === 0) {
    const savedShape = getSavedChordShape(chordName);
    if (savedShape) {
      shape = savedShape;
    }
  }

  if (!shape && shapeIndex === 0 && GUITAR_DATABASE[normalized]?.['']) {
    shape = GUITAR_DATABASE[normalized][''];
  }

  if (!shape && shapeIndex === 0 && normalized.includes('/')) {
    const parts = normalized.split('/');
    const preSlash = parts[0].trim();
    const bassNote = parts[1].trim();

    const { root: preRoot, suffix: preSuffix } = resolveChordSuffix(preSlash);
    let baseShape = GUITAR_DATABASE[preRoot]?.[preSuffix];
    if (!baseShape) {
      baseShape = GUITAR_DATABASE[preRoot]?.[''];
    }

    if (baseShape) {
      shape = getSlashGuitarShape(baseShape, bassNote);
    }
  }

  if (!shape && shapeIndex === 0) {
    const { root, suffix } = resolveChordSuffix(chordName);
    shape = GUITAR_DATABASE[root]?.[suffix];
  }

  // Use CAGED option for current shapeIndex if no shape set yet or shapeIndex > 0
  if (!shape || shapeIndex > 0) {
    const activeOption = cagedOptions[shapeIndex % cagedOptions.length] || cagedOptions[0];
    shape = activeOption.shape;
    cagedLabel = activeOption.cagedLetter;
  } else {
    cagedLabel = cagedOptions[0]?.cagedLetter || 'C';
  }

  if (!shape) {
    shape = { frets: [-1, 0, 0, 0, 0, 0], fingers: [0, 0, 0, 0, 0, 0] };
    isFallback = true;
  }

  const baseFret = shape.baseFret || 1;
  const fretsToDraw = 5; // Show 5 frets
  const stringsCount = 6;
  
  // Grid layout sizes scaled up for beautiful high fidelity desktop and responsive visibility
  const width = 220;
  const height = 230;
  const topPadding = 40;
  const leftPadding = 35;
  const spacingX = 30;
  const spacingY = 32;

  // The center of the symmetrical neck is 35 + 75 = 110
  const centerX = leftPadding + ((stringsCount - 1) * spacingX) / 2;

  // Compute tapered X coordinates based on y position
  const getX = (sIdx: number, y: number) => {
    const progress = (y - topPadding) / (fretsToDraw * spacingY);
    const factor = 0.84 + progress * 0.22;
    const offsetFromCenter = (sIdx - 2.5) * spacingX;
    return centerX + offsetFromCenter * factor;
  };

  return (
    <div className={`flex flex-col items-center justify-center p-4 bg-surface border border-border rounded-xl w-full max-w-[240px] relative shadow-md ${className}`} id={`chord-diag-${chordName.replace('#', 's')}`}>
      {/* Cifra / Grau / Função Header */}
      <div className="flex flex-col items-center justify-center w-full mb-1.5 bg-black/5 dark:bg-white/5 py-1.5 px-2 rounded-xl border border-border/60 select-none">
        <div className="grid grid-cols-5 items-center w-full text-center text-[10px] font-black uppercase tracking-wider text-text-muted">
          <span>Cifra</span>
          <span className="text-text-muted/40 font-normal">-</span>
          <span>Grau</span>
          <span className="text-text-muted/40 font-normal">-</span>
          <span>Função</span>
        </div>
        <div className="grid grid-cols-5 items-center w-full text-center font-mono font-black text-xs sm:text-sm text-text-main mt-0.5">
          <span className="text-brand font-black truncate">{cifraVal}</span>
          <span className="text-text-muted/40 font-normal text-xs">-</span>
          <span className="font-black truncate">{grauVal}</span>
          <span className="text-text-muted/40 font-normal text-xs">-</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-black truncate">{funcVal}</span>
        </div>
      </div>

      {/* CAGED Badge Indicator */}
      <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1 mb-2 font-sans">
        <Layers size={11} className="text-emerald-500" /> Shape {shapeIndex + 1}/5 • Formato {cagedLabel}
      </span>
      
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          {/* Beautiful natural maple wood fretboard texture gradient */}
          <linearGradient id="maple" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#eedcb3" />
            <stop offset="20%" stopColor="#f5e6c4" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#faebd7" />
            <stop offset="80%" stopColor="#f5e6c4" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#e3cf9f" />
          </linearGradient>
          
          {/* Metallic silver-nickel look fret wires gradient */}
          <linearGradient id="fret-wire" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="35%" stopColor="#cbd5e1" />
            <stop offset="65%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          {/* Ivory bone nut gradient */}
          <linearGradient id="bone-nut-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fafaf9" />
            <stop offset="60%" stopColor="#e7e5e4" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>

          {/* Natural dark clay inlay dots (standard for maple fretboards) */}
          <radialGradient id="clay-dot" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#4b5563" />
            <stop offset="65%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#111827" />
          </radialGradient>

          {/* Bronze wound bass strings (E, A, D) */}
          <linearGradient id="bronze-wound" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Silver nickel steel treble strings (G, B, e) */}
          <linearGradient id="steel-wound" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="50%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Glossy radial gradient for blue finger indicators */}
          <radialGradient id="glossy-indicator" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </radialGradient>

          {/* Glossy radial gradient for red barre finger indicator */}
          <radialGradient id="glossy-barre" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="50%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#9f1239" />
          </radialGradient>

          {/* Glossy radial gradient for green open/interval indicators */}
          <radialGradient id="glossy-open" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="55%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </radialGradient>
        </defs>

        {/* Elegant Minimalist Guitar Headstock (Only active when baseFret === 1) */}
        {baseFret === 1 && (
          <g>
            {/* Left headstock accent line */}
            <line
              x1={getX(0, topPadding) - 7}
              y1={topPadding}
              x2={getX(0, topPadding) - 16}
              y2={topPadding - 18}
              stroke="#dec897"
              strokeWidth={3.5}
              strokeLinecap="round"
              opacity={0.9}
            />
            {/* Right headstock accent line */}
            <line
              x1={getX(stringsCount - 1, topPadding) + 7}
              y1={topPadding}
              x2={getX(stringsCount - 1, topPadding) + 16}
              y2={topPadding - 18}
              stroke="#dec897"
              strokeWidth={3.5}
              strokeLinecap="round"
              opacity={0.9}
            />
          </g>
        )}

        {/* Tapered Fretboard Wood Background Plate (Polygon) */}
        <polygon
          points={`
            ${getX(0, topPadding) - 8},${topPadding}
            ${getX(stringsCount - 1, topPadding) + 8},${topPadding}
            ${getX(stringsCount - 1, topPadding + fretsToDraw * spacingY) + 8},${topPadding + fretsToDraw * spacingY}
            ${getX(0, topPadding + fretsToDraw * spacingY) - 8},${topPadding + fretsToDraw * spacingY}
          `}
          fill="url(#maple)"
          stroke="#dec897"
          strokeWidth={0.5}
          className="shadow-inner"
        />

        {/* Dynamic Fretboard Positions Inlays (Dark Clay Dots on standard absolute frets 3, 5, 7, 9, 12, 15, 17) */}
        {Array.from({ length: fretsToDraw }).map((_, rfIdx) => {
          const rf = rfIdx + 1;
          const absFret = baseFret + rf - 1;
          const yCenter = topPadding + (rf - 1) * spacingY + spacingY / 2;
          const progress = (yCenter - topPadding) / (fretsToDraw * spacingY);
          const localFactor = 0.84 + progress * 0.22;

          if (absFret === 3 || absFret === 5 || absFret === 7 || absFret === 9 || absFret === 15 || absFret === 17) {
            return (
              <circle
                key={`dot-${rf}`}
                cx={centerX}
                cy={yCenter}
                r={5.5}
                fill="url(#clay-dot)"
                stroke="#edd09a"
                strokeWidth={1}
                className="filter drop-shadow-sm"
              />
            );
          }
          if (absFret === 12) {
            return (
              <g key={`double-dot-${rf}`}>
                <circle cx={centerX - 17 * localFactor} cy={yCenter} r={4.5} fill="url(#clay-dot)" stroke="#edd09a" strokeWidth={1} />
                <circle cx={centerX + 17 * localFactor} cy={yCenter} r={4.5} fill="url(#clay-dot)" stroke="#edd09a" strokeWidth={1} />
              </g>
            );
          }
          return null;
        })}

        {/* Draw Tapered Fretboard Grid Lines (Realistic rounded metal fretwires and top-nut) */}
        {Array.from({ length: fretsToDraw + 1 }).map((_, fIdx) => {
          const y = topPadding + fIdx * spacingY;
          const isTopNut = fIdx === 0 && baseFret === 1;

          if (isTopNut) {
            // Symmetrically tapered bone nut
            return (
              <polygon
                key={`nut-${fIdx}`}
                points={`
                  ${getX(0, y) - 8},${y - 5}
                  ${getX(stringsCount - 1, y) + 8},${y - 5}
                  ${getX(stringsCount - 1, y) + 8},${y + 1}
                  ${getX(0, y) - 8},${y + 1}
                `}
                fill="url(#bone-nut-grad)"
                stroke="#78716c"
                strokeWidth={0.5}
                className="shadow-sm"
              />
            );
          }

          const xLeft = getX(0, y) - 8;
          const xRight = getX(stringsCount - 1, y) + 8;

          return (
            <g key={`fret-${fIdx}`}>
              {/* Back dark bevel shadow for physical height/depth */}
              <line
                x1={xLeft}
                y1={y + 1}
                x2={xRight}
                y2={y + 1}
                stroke="#000000"
                strokeWidth={1.5}
                opacity={0.55}
              />
              {/* Silver crowned fret crown */}
              <line
                x1={xLeft}
                y1={y}
                x2={xRight}
                y2={y}
                stroke="url(#fret-wire)"
                strokeWidth={2}
              />
            </g>
          );
        })}

        {/* Draw Tapered Strings with real Wood shadow casting and unique material appearance */}
        {Array.from({ length: stringsCount }).map((_, sIdx) => {
          const x1 = getX(sIdx, topPadding);
          const y1 = topPadding;
          const x2 = getX(sIdx, topPadding + fretsToDraw * spacingY);

          const isBass = sIdx < 3; // E, A, D are bronze wound (left side)
          const stringColor = isBass ? "url(#bronze-wound)" : "url(#steel-wound)";
          const baseWidth = 1 + (stringsCount - 1 - sIdx) * 0.4; // Low E on the left is thickest, high e on the right is thinnest

          return (
            <g key={`string-${sIdx}`}>
              {/* Casted wood shadow */}
              <line
                x1={x1 + 1}
                y1={y1}
                x2={x2 + 1}
                y2={topPadding + fretsToDraw * spacingY}
                stroke="#000000"
                strokeWidth={baseWidth + 1}
                opacity={0.35}
              />
              {/* Physical metal string */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={topPadding + fretsToDraw * spacingY}
                stroke={stringColor}
                strokeWidth={baseWidth}
              />
            </g>
          );
        })}

        {/* Base Fret Label */}
        {baseFret > 1 && (
          <text
            x={8}
            y={topPadding + spacingY / 2 + 5}
            className="fill-text-muted font-mono font-black"
            fontSize="13"
          >
            {baseFret}ª
          </text>
        )}

        {/* Barre Draw */}
        {shape.barre && (() => {
          const yBarre = topPadding + (shape.barre.fret - baseFret) * spacingY + spacingY / 2;
          const xStart = getX(shape.barre.start - 1, yBarre);
          const xEnd = getX(shape.barre.end - 1, yBarre);

          return (
            <g>
              {/* Barre shadow */}
              <rect
                x={xStart - 8}
                y={yBarre - 7}
                width={xEnd - xStart + 16}
                height={14}
                rx={7}
                fill="#000000"
                opacity={0.4}
              />
              {/* Glossy barre cap */}
              <rect
                x={xStart - 8}
                y={yBarre - 8}
                width={xEnd - xStart + 16}
                height={14}
                rx={7}
                fill="url(#glossy-barre)"
                stroke="#9f1239"
                strokeWidth={1}
              />
            </g>
          );
        })()}

        {/* Markers Draw */}
        {shape.frets.map((fret, sIdx) => {
          const xNut = getX(sIdx, topPadding);

          if (fret === -1) {
            // Unplayed string 'X' with physical glossy appearance
            return (
              <g key={`mute-${sIdx}`}>
                <line x1={xNut - 6} y1={topPadding - 16} x2={xNut + 6} y2={topPadding - 4} stroke="#ef4444" strokeWidth={3} strokeLinecap="round" />
                <line x1={xNut + 6} y1={topPadding - 16} x2={xNut - 6} y2={topPadding - 4} stroke="#ef4444" strokeWidth={3} strokeLinecap="round" />
              </g>
            );
          }

          if (fret === 0) {
            // Open string 'O'
            if (showIntervals) {
              const interval = getGuitarInterval(sIdx, 0, chordName);
              return (
                <g key={`open-${sIdx}`}>
                  <circle
                    cx={xNut}
                    cy={topPadding - 11}
                    r={11.5}
                    fill="url(#glossy-open)"
                    stroke="#047857"
                    strokeWidth={1}
                  />
                  <text
                    x={xNut}
                    y={topPadding - 7.5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="black"
                  >
                    {interval}
                  </text>
                </g>
              );
            }
            return (
              <circle
                key={`open-${sIdx}`}
                cx={xNut}
                cy={topPadding - 11}
                r={6}
                fill="none"
                stroke="#10b981"
                strokeWidth={2.5}
              />
            );
          }

          // Active Fret Marker Dot (skip if barre already covers it to avoid overlaps unless showing intervals)
          const isBarreCovered = shape?.barre && 
                                 shape.barre.fret === fret && 
                                 sIdx + 1 >= shape.barre.start && 
                                 sIdx + 1 <= shape.barre.end;

          if (isBarreCovered && !showIntervals) return null;

          // Compute y position relative to baseFret
          const relFret = fret - baseFret + 1;
          if (relFret < 1 || relFret > fretsToDraw) return null; // out of bounds

          const y = topPadding + (relFret - 1) * spacingY + spacingY / 2;
          const x = getX(sIdx, y);
          const finger = shape.fingers ? shape.fingers[sIdx] : null;
          const interval = getGuitarInterval(sIdx, fret, chordName);

          return (
            <g key={`marker-${sIdx}`} className="filter drop-shadow-md">
              <circle
                cx={x}
                cy={y}
                r={11.5}
                fill="url(#glossy-indicator)"
                stroke="#1e40af"
                strokeWidth={1}
              />
              {showIntervals ? (
                <text
                  x={x}
                  y={y + 3.5}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="black"
                >
                  {interval}
                </text>
              ) : finger && finger > 0 ? (
                <text
                  x={x}
                  y={y + 4.5}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="13"
                  fontWeight="black"
                >
                  {finger}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* Interactive Control Bar: Fingerings vs Intervals + CAGED Shapes Loop Button */}
      <div className="flex items-center gap-1.5 w-full max-w-[210px] select-none mb-1 text-xs">
        <div className="flex bg-black/5 dark:bg-white/15 p-0.5 rounded-lg border border-border/30 flex-1">
          <button
            type="button"
            onClick={() => setShowIntervals(false)}
            className={`flex-1 py-1 rounded-md text-center text-[10px] font-black transition-all outline-none cursor-pointer ${
              !showIntervals
                ? "bg-brand text-white shadow-sm"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            Dedos
          </button>
          <button
            type="button"
            onClick={() => setShowIntervals(true)}
            className={`flex-1 py-1 rounded-md text-center text-[10px] font-black transition-all outline-none cursor-pointer ${
              showIntervals
                ? "bg-brand text-white shadow-sm"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            Intervalos
          </button>
        </div>

        {/* CAGED Loop Button */}
        <button
          type="button"
          onClick={() => setShapeIndex(prev => (prev + 1) % cagedOptions.length)}
          title="Alternar entre os 5 Shapes do CAGED (Sistema 5)"
          className="py-1 px-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 active:scale-95 shadow-xs"
        >
          <RotateCw size={12} className="text-emerald-500" />
          <span>Shape {shapeIndex + 1}/5</span>
        </button>
      </div>

      {isFallback && (
        <span className="text-[10px] text-text-muted italic text-center leading-none mt-1 select-none">
          Diagrama aproximado
        </span>
      )}
      <span className="text-[10px] text-text-muted/80 font-mono text-center uppercase tracking-widest mt-1.5 select-none">
        ← E A D G B e →
      </span>
    </div>
  );
}

// Piano Keyboard Display (Upgraded to match the beautiful 2-octave scroll-free layout)
export function PianoChordDiagram({ 
  chordName, 
  className = "", 
  preferShowIntervals = false,
  compact = false,
  songKey
}: { 
  chordName: string; 
  className?: string; 
  preferShowIntervals?: boolean;
  compact?: boolean;
  songKey?: string;
}) {
  const effectiveKey = songKey || (chordName.match(/^([A-G][#b]?)/)?.[1] || 'C');
  const degree = convertSingleChordToHarmonicMode(chordName, effectiveKey, 'roman');
  const func = convertSingleChordToHarmonicMode(chordName, effectiveKey, 'functions');

  const cifraVal = chordName;
  const grauVal = (degree && degree !== chordName) ? degree : 'I';
  const funcVal = (func && func !== chordName) ? func : 'Tôn';

  const activeKeys = getPianoKeys(chordName);

  // We find active keys, sort them, and center them on our 2-octave (25 semitones) keyboard
  const minKey = activeKeys.length > 0 ? Math.min(...activeKeys) : 0;
  // Center it mathematically such that minKey starts in the first octave [0, 11]
  const octaveShift = -Math.floor(minKey / 12) * 12;
  const shiftedActiveKeys = activeKeys.map(k => k + octaveShift);

  // Function to determine note details
  const getNoteDetails = (semitoneFromC: number) => {
    const noteIndex = semitoneFromC % 12;
    const noteName = NOTES_DICT[noteIndex];
    const isBlack = noteName.includes('#');
    return { noteName, isBlack };
  };

  const whiteKeysSec: any[] = [];
  const blackKeysSec: any[] = [];
  let whiteIndex = 0;

  // Render exactly 2 full octaves (0 to 24 semitones)
  // Expanded visual proportions: White keys are 30px wide (was 27), 130px tall (was 120)
  // Compact proportions: White keys are 21px wide (was 19), 85px tall (was 80)
  const whiteKeyWidth = compact ? 21 : 30;
  const whiteKeyHeight = compact ? 85 : 130;
  const blackKeyWidth = compact ? 13 : 19;
  const blackKeyHeight = compact ? 54 : 80;
  const blackKeyOffset = whiteKeyWidth - (blackKeyWidth / 2);

  for (let s = 0; s < 25; s++) {
    const { noteName, isBlack } = getNoteDetails(s);
    const isBass = s === shiftedActiveKeys[0];
    const isActive = shiftedActiveKeys.includes(s);

    if (isBlack) {
      let wLeftIdx = 0;
      const cycle = Math.floor(s / 12);
      const rem = s % 12;
      if (rem === 1) wLeftIdx = 0;
      else if (rem === 3) wLeftIdx = 1;
      else if (rem === 6) wLeftIdx = 3;
      else if (rem === 8) wLeftIdx = 4;
      else if (rem === 10) wLeftIdx = 5;
      
      const absoluteWhiteIndex = wLeftIdx + (cycle * 7);
      const leftPos = (absoluteWhiteIndex * whiteKeyWidth) + blackKeyOffset;

      const originalKeyVal = s - octaveShift;
      const intervalLabelRaw = getIntervalLabel(originalKeyVal, chordName);
      const intervalLabel = intervalLabelRaw ? intervalLabelRaw.replace(/ª/g, '') : '';

      blackKeysSec.push(
        <div
          key={`piano-chord-key-${s}`}
          style={{ left: `${leftPos}px`, width: `${blackKeyWidth}px`, height: `${blackKeyHeight}px` }}
          className={`absolute z-20 rounded-b transition-all border border-black/80 flex flex-col items-center justify-end pb-1.5 shadow-md ${
            isBass 
              ? 'bg-indigo-600 border-indigo-700 text-white font-bold animate-none' 
              : isActive
              ? 'bg-emerald-500 border-emerald-600 text-white font-bold animate-none'
              : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-400 border-zinc-950'
          }`}
        >
          <span className={`text-[9px] font-sans font-black select-none tracking-tighter block mb-0.5 leading-none ${
            isActive ? 'text-white' : 'text-zinc-500'
          }`}>{noteName}</span>
          {isActive && <span className="text-[8px] font-black text-white leading-none">{intervalLabel || 'N'}</span>}
        </div>
      );
    } else {
      const leftPos = whiteIndex * whiteKeyWidth;
      const originalKeyVal = s - octaveShift;
      const intervalLabelRaw = getIntervalLabel(originalKeyVal, chordName);
      const intervalLabel = intervalLabelRaw ? intervalLabelRaw.replace(/ª/g, '') : '';

      whiteKeysSec.push(
        <div
          key={`piano-chord-key-${s}`}
          style={{ left: `${leftPos}px`, width: `${whiteKeyWidth}px`, height: `${whiteKeyHeight}px` }}
          className={`absolute z-10 border border-zinc-300 rounded-b shadow-sm transition-all flex flex-col items-center justify-end pb-2 ${
            isBass 
              ? 'bg-indigo-600 border-indigo-700 text-white font-black' 
              : isActive
              ? 'bg-emerald-500 border-emerald-600 text-white font-black'
              : 'bg-white hover:bg-stone-50 border-stone-200 text-zinc-800'
          }`}
        >
          <span className={`text-[11px] font-sans font-black select-none block tracking-tighter leading-none ${
            isActive ? 'text-white' : 'text-zinc-500'
          }`}>{noteName}</span>
          {isActive && <span className="text-[9.5px] font-black uppercase text-white leading-none mt-1">{intervalLabel || 'N'}</span>}
        </div>
      );
      whiteIndex++;
    }
  }

  const isTransparent = className.includes('bg-transparent');
  const baseBg = isTransparent ? '' : 'bg-stone-50 dark:bg-zinc-950';
  const baseBorder = isTransparent ? '' : 'border border-stone-200 dark:border-zinc-850';
  const baseShadow = isTransparent ? '' : 'shadow-xl';
  const baseRounded = isTransparent ? '' : 'rounded-2xl';

  return (
    <div className={`flex flex-col items-center ${baseBg} ${baseBorder} ${baseRounded} ${baseShadow} ${
      compact ? 'p-3 w-full max-w-full' : 'p-4 w-full max-w-[500px]'
    } ${className}`}>
      {/* Target Chord Header name */}
      {/* Cifra / Grau / Função Header */}
      <div className="flex flex-col items-center justify-center w-full max-w-[220px] mb-2 bg-black/5 dark:bg-white/5 py-1.5 px-2 rounded-xl border border-border/60 select-none">
        <div className="grid grid-cols-5 items-center w-full text-center text-[10px] font-black uppercase tracking-wider text-text-muted">
          <span>Cifra</span>
          <span className="text-text-muted/40 font-normal">-</span>
          <span>Grau</span>
          <span className="text-text-muted/40 font-normal">-</span>
          <span>Função</span>
        </div>
        <div className="grid grid-cols-5 items-center w-full text-center font-mono font-black text-xs sm:text-sm text-text-main mt-0.5">
          <span className="text-brand font-black truncate">{cifraVal}</span>
          <span className="text-text-muted/40 font-normal text-xs">-</span>
          <span className="font-black truncate">{grauVal}</span>
          <span className="text-text-muted/40 font-normal text-xs">-</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-black truncate">{funcVal}</span>
        </div>
      </div>
      
      {/* Help Note instructions */}
      <div className="w-full flex justify-between items-center px-1 mb-2 select-none">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-650 dark:text-zinc-400">Teclado Didático Centrado</span>
      </div>

      {/* Piano Outer Container */}
      <div 
        className={`w-full bg-zinc-950 rounded-2xl border border-zinc-900 flex items-center justify-start overflow-x-auto select-none scrollbar-none ${
          compact ? 'p-2.5' : 'p-4'
        }`}
      >
        <div className="flex relative shrink-0 mx-auto" style={{ height: `${whiteKeyHeight + 15}px`, width: `${whiteIndex * whiteKeyWidth}px` }}>
          {whiteKeysSec}
          {blackKeysSec}
        </div>
      </div>

      {/* Legend showing what Colors mean */}
      <div className="mt-3 flex items-center justify-center gap-4 flex-wrap text-[10px] font-bold uppercase tracking-wider text-zinc-650 dark:text-zinc-400 select-none font-sans">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-indigo-600 border border-indigo-700" />
          <span className="text-zinc-600 dark:text-zinc-400">Baixo (B)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-500 border border-emerald-600" />
          <span className="text-zinc-600 dark:text-zinc-400">Nota (N)</span>
        </div>
      </div>
    </div>
  );
}

// Main dictionary popover/drawer modal for chords lookup
interface ChordDictionaryModalProps {
  onClose: () => void;
  initialChord?: string;
  availableChords?: string[];
  songKey?: string;
}

export function ChordDictionaryModal({ onClose, initialChord, availableChords = [], songKey }: ChordDictionaryModalProps) {
  useChordOverridesSync();
  const { isAdmin } = useAuth();
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  const [instrument, setInstrument] = useState<'guitar' | 'piano'>('guitar');
  const [selectedChord, setSelectedChord] = useState<string>(initialChord || 'C');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [revision, setRevision] = useState(0);

  // Sift list of songs chords or list common default keys
  const defaultSearchChords = [
    'C', 'Cm', 'C7', 'C7M', 'D', 'Dm', 'D7', 'D7M', 'D9', 
    'E', 'Em', 'E7', 'E7M', 'F', 'Fm', 'F7', 'G', 'Gm', 'G7', 'G7M', 
    'A', 'Am', 'A7', 'A7M', 'B', 'Bm', 'B7', 'B7M'
  ];

  // Merge, sanitize and order chords
  const filteredChords = Array.from(new Set([
    ...availableChords.filter(c => c && c.length <= 10 && !c.includes('[') && !c.includes('<b>')), 
    ...defaultSearchChords
  ])).filter(chord => {
    if (!searchQuery) return true;
    return chord.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 antialiased overflow-hidden">
      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0.05}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        className={`bg-surface border border-border rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] text-text-main transition-shadow ${
          isDragging ? 'shadow-2xl ring-2 ring-brand scale-[1.01]' : ''
        }`}
      >
        {/* Drag handle top header strip */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="flex items-center justify-center gap-1.5 py-1.5 px-4 bg-brand/15 dark:bg-brand/25 border-b border-brand/20 rounded-t-3xl cursor-grab active:cursor-grabbing text-brand font-black text-[9px] uppercase tracking-wider select-none touch-none hover:bg-brand/20 transition-colors"
          title="Segure e arraste para mover a janela"
        >
          <GripHorizontal size={14} className="text-brand shrink-0" />
          <span>Pressione e arraste para mover a janela</span>
        </div>

        {/* Header toolbar */}
        <div 
          onPointerDown={(e) => {
            if (!(e.target as HTMLElement).closest('button, input, select, a')) {
              dragControls.start(e);
            }
          }}
          className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-surface shrink-0 cursor-grab active:cursor-grabbing select-none touch-none"
        >
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-brand shrink-0 animate-pulse" />
            <div>
              <h3 className="text-base font-black text-text-main uppercase tracking-wider leading-none">Dicionário de Acordes</h3>
              <p className="text-[10px] text-text-muted mt-1 leading-none font-bold">Mova a janela livremente para visualizar a cifra ao fundo</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 px-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-muted hover:text-text-main rounded-lg border border-border transition-all cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Action picker tools */}
        <div className="flex justify-between items-center sm:gap-2 px-5 py-3 border-b border-border bg-black/5 dark:bg-white/5 shrink-0 gap-1.5 overflow-x-auto">
          {/* Instrument switcher buttons */}
          <div className="flex bg-black/15 dark:bg-white/5 p-1 rounded-xl border border-border gap-1 shrink-0">
            <button
              onClick={() => setInstrument('guitar')}
              className={`px-2.5 py-1.5 text-[9.5px] font-black uppercase rounded-lg transition-all flex items-center gap-1 leading-none cursor-pointer ${
                instrument === 'guitar' 
                  ? 'bg-brand text-white shadow-md font-extrabold' 
                  : 'text-text-muted hover:text-text-main hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              🎸 Violão
            </button>
            <button
              onClick={() => setInstrument('piano')}
              className={`px-2.5 py-1.5 text-[9.5px] font-black uppercase rounded-lg transition-all flex items-center gap-1 leading-none cursor-pointer ${
                instrument === 'piano' 
                  ? 'bg-indigo-600 text-white shadow-md font-extrabold' 
                  : 'text-text-muted hover:text-text-main hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              🎹 Teclado
            </button>
          </div>

          <div className="text-[10px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1 leading-none shrink-0 px-2 select-none">
            {instrument === 'guitar' ? 'Exibe Desenho Fretboard' : 'Exibe Desenho Piano'}
          </div>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-5 min-h-[300px]">
          {/* Left search chord list */}
          <div className="md:col-span-2 border-r border-border flex flex-col h-full overflow-hidden bg-black/5 dark:bg-white/5">
            <div className="p-3 border-b border-border shrink-0 flex items-center relative gap-1.5">
              <Search size={14} className="absolute left-6 text-text-muted/60 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar acorde (ex: D9)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl pr-3 pl-9 py-2 text-xs text-text-main placeholder-text-muted/50 focus:outline-none focus:ring-1 focus:ring-brand hover:border-border/85 transition-all font-mono"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2 grid grid-cols-4 sm:grid-cols-4 md:grid-cols-2 gap-1 content-start custom-scrollbar">
              {filteredChords.map(chord => (
                <button
                  key={chord}
                  onClick={() => setSelectedChord(chord)}
                  className={`px-2 py-2 text-xs font-mono font-black border rounded-xl transition-all flex items-center justify-between truncate cursor-pointer ${
                    selectedChord === chord
                      ? 'bg-brand text-white border-brand scale-[1.02] shadow-md font-extrabold'
                      : 'bg-black/10 dark:bg-white/5 border-border text-text-muted hover:text-text-main hover:bg-black/20 dark:hover:bg-white/10'
                  }`}
                >
                  <span className="truncate">{chord}</span>
                  {selectedChord === chord && <Music size={11} className="text-white shrink-0 select-none animate-bounce" />}
                </button>
              ))}
              {filteredChords.length === 0 && (
                <div className="col-span-full py-10 text-center text-[11px] text-text-muted font-bold select-none uppercase tracking-wider">
                  Nenhum acorde encontrado
                </div>
              )}
            </div>
          </div>

          {/* Right graphics viewport */}
          <div className="md:col-span-3 p-6 flex flex-col justify-center items-center overflow-y-auto bg-black/10 dark:bg-black/30 gap-3">
            <p className="text-[11px] font-black uppercase text-text-muted tracking-widest leading-none mb-1">
              Como tocar este acorde:
            </p>

            <div className="w-full max-w-full overflow-hidden my-4 flex items-center justify-center">
              {instrument === 'guitar' ? (
                <div className="scale-110 md:scale-120">
                  <GuitarChordDiagram chordName={selectedChord} key={`${selectedChord}-${revision}`} songKey={songKey} />
                </div>
              ) : (
                <PianoChordDiagram chordName={selectedChord} compact={true} songKey={songKey} className="bg-transparent border-0 shadow-none p-0 max-w-full w-full" />
              )}
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-[9.5px] font-black uppercase bg-brand/15 hover:bg-brand/25 text-brand border border-brand/25 rounded-xl cursor-pointer transition-all active:scale-95 shrink-0"
              >
                ✏️ Personalizar Shape
              </button>
            )}

            <div className="bg-brand/5 dark:bg-brand/10 border border-brand/20 p-3 rounded-2xl w-full text-center max-w-[240px]">
              <p className="text-[10px] leading-relaxed text-text-muted">
                ⭐ <strong>Tip:</strong> Clique em qualquer acorde da música para abrir este assistente na cifra imediatamente!
              </p>
            </div>
          </div>
        </div>

        {/* Footer info strip */}
        <div className="p-4 bg-black/15 dark:bg-black/40 border-t border-border shrink-0 text-center rounded-b-3xl">
          <p className="text-[8.5px] font-mono tracking-widest text-text-muted/50 uppercase select-none leading-none">
            Modulo LiLouPro Chord Dictionary • Versão 2.1 • Smart Engine
          </p>
        </div>

        {isEditing && (
          instrument === 'guitar' ? (
            <GuitarChordEditor
              chordName={selectedChord}
              onClose={() => setIsEditing(false)}
              onSave={() => {
                setIsEditing(false);
                setRevision(prev => prev + 1);
              }}
            />
          ) : (
            <PianoChordEditor
              chordName={selectedChord}
              onClose={() => setIsEditing(false)}
              onSave={() => {
                setIsEditing(false);
                setRevision(prev => prev + 1);
              }}
            />
          )
        )}

      </motion.div>
    </div>
  );
}

interface ChordDictionaryCardProps {
  activeChord?: string;
  setActiveChord: (chord: string | undefined) => void;
  availableChords?: string[];
  songKey?: string;
}

export function ChordDictionaryCard({ activeChord, setActiveChord, availableChords = [], songKey }: ChordDictionaryCardProps) {
  useChordOverridesSync();
  const { isAdmin } = useAuth();
  const [instrument, setInstrument] = useState<'guitar' | 'piano'>('guitar');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [revision, setRevision] = useState(0);

  // Sift list of songs chords or list common default keys
  const defaultSearchChords = [
    'C', 'Cm', 'C7', 'C7M', 'D', 'Dm', 'D7', 'D7M', 'D9', 
    'E', 'Em', 'E7', 'E7M', 'F', 'Fm', 'F7', 'G', 'Gm', 'G7', 'G7M', 
    'A', 'Am', 'A7', 'A7M', 'B', 'Bm', 'B7', 'B7M'
  ];

  // Merge, sanitize and order chords
  const filteredChords = Array.from(new Set([
    ...availableChords.filter(c => c && c.length <= 10 && !c.includes('[') && !c.includes('<b>')), 
    ...defaultSearchChords
  ])).filter(chord => {
    if (!searchQuery) return true;
    return chord.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedChord = activeChord || availableChords[0] || 'C';

  return (
    <div className="p-4 sm:p-5 bg-card/50 backdrop-blur-md border border-border rounded-xl shadow-lg space-y-4 text-text-main notranslate" translate="no">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-brand animate-pulse shrink-0" />
          <h3 className="text-xs font-black uppercase tracking-wider text-text-main">Desenho de Acordes</h3>
        </div>
        
        {/* Instrument switcher */}
        <div className="flex bg-black/15 dark:bg-white/5 p-0.5 rounded-lg border border-border gap-0.5 shrink-0">
          <button
            onClick={() => setInstrument('guitar')}
            className={`px-2 py-1 text-[8.5px] font-black uppercase rounded-md transition-all cursor-pointer ${
              instrument === 'guitar' 
                ? 'bg-brand text-white shadow-sm' 
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            🎸 Violão
          </button>
          <button
            onClick={() => setInstrument('piano')}
            className={`px-2 py-1 text-[8.5px] font-black uppercase rounded-md transition-all cursor-pointer ${
              instrument === 'piano' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            🎹 Teclado
          </button>
        </div>
      </div>

      {/* Main interactive grid/split */}
      <div className="flex flex-col gap-3">
        {/* Chord Selector & Search */}
        <div className="space-y-2">
          {/* Quick Select scroll list (of song chords) */}
          {availableChords.length > 0 && (
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase text-text-muted tracking-wider">Clique para ver o desenho:</span>
              <div className="flex flex-wrap gap-1 max-h-[105px] overflow-y-auto custom-scrollbar p-1">
                {availableChords.filter(c => c && c.length <= 10 && !c.includes('[') && !c.includes('<b>')).map(chord => (
                  <button
                    key={chord}
                    onClick={() => setActiveChord(chord)}
                    className={`px-2 py-0.5 text-xs font-mono font-bold border rounded-lg transition-all cursor-pointer ${
                      selectedChord === chord
                        ? 'bg-brand text-white border-brand font-extrabold shadow-sm scale-102'
                        : 'bg-black/5 dark:bg-white/5 border-border text-text-muted hover:text-text-main hover:bg-black/15 dark:hover:bg-white/10'
                    }`}
                  >
                    {chord}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search other chords */}
          <div className="space-y-1">
            <div className="relative flex items-center">
              <Search size={12} className="absolute left-2.5 text-text-muted/60 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar outros (ex: D9, C#m)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-lg pr-2.5 pl-7.5 py-1 text-[10px] text-text-main placeholder-text-muted/50 focus:outline-none focus:ring-1 focus:ring-brand hover:border-border/85 transition-all font-mono"
              />
            </div>

            {searchQuery && (
              <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto custom-scrollbar p-1 bg-black/10 dark:bg-black/20 rounded-lg">
                {filteredChords.slice(0, 15).map(chord => (
                  <button
                    key={chord}
                    onClick={() => {
                      setActiveChord(chord);
                      setSearchQuery('');
                    }}
                    className={`px-1.5 py-0.5 text-[10px] font-mono border rounded transition-all cursor-pointer ${
                      selectedChord === chord
                        ? 'bg-brand text-white border-brand'
                        : 'bg-black/5 dark:bg-white/5 border-border text-text-muted hover:text-text-main'
                    }`}
                  >
                    {chord}
                  </button>
                ))}
                {filteredChords.length === 0 && (
                  <div className="text-[9px] text-text-muted p-1 italic">Nenhum encontrado</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Big Graphic Display */}
        <div className="py-2.5 bg-black/10 dark:bg-black/35 rounded-xl flex flex-col justify-center items-center gap-1.5 border border-border/40 relative">
          <div className="absolute top-2 left-3 bg-brand/10 text-brand text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full select-none tracking-wider font-mono">
            {selectedChord}
          </div>
          
          <div className="w-full max-w-full overflow-hidden flex items-center justify-center min-h-[140px] select-none">
            {instrument === 'guitar' ? (
              <div className="scale-95 flex items-center justify-center">
                <GuitarChordDiagram chordName={selectedChord} key={`${selectedChord}-${revision}`} songKey={songKey} />
              </div>
            ) : (
              <PianoChordDiagram chordName={selectedChord} compact={true} songKey={songKey} className="bg-transparent border-0 shadow-none p-0 max-w-full w-full" />
            )}
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-black uppercase bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 rounded-lg cursor-pointer transition-all active:scale-95 shrink-0 select-none mb-1 shadow-sm"
            >
              ✏️ Editar Shape
            </button>
          )}

          <span className="text-[8px] text-text-muted font-bold select-none uppercase tracking-widest mt-1">
            {instrument === 'guitar' ? 'Violão • Graus & Casas' : 'Teclado • Graus & Teclas'}
          </span>
        </div>
      </div>

      {isEditing && (
        instrument === 'guitar' ? (
          <GuitarChordEditor
            chordName={selectedChord}
            onClose={() => setIsEditing(false)}
            onSave={() => {
              setIsEditing(false);
              setRevision(prev => prev + 1);
            }}
          />
        ) : (
          <PianoChordEditor
            chordName={selectedChord}
            onClose={() => setIsEditing(false)}
            onSave={() => {
              setIsEditing(false);
              setRevision(prev => prev + 1);
            }}
          />
        )
      )}
    </div>
  );
}

export interface QuickChordPopoverProps {
  chord: string | null | undefined;
  onClose: () => void;
  availableChords?: string[];
  onSelectChord?: (chord: string) => void;
  songKey?: string;
}

export function QuickChordPopover({
  chord,
  onClose,
  availableChords = [],
  onSelectChord,
  songKey
}: QuickChordPopoverProps) {
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  const [instrument, setInstrument] = useState<'guitar' | 'piano'>('guitar');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!chord) return null;

  const degree = songKey ? convertSingleChordToHarmonicMode(chord, songKey, 'roman') : null;
  const func = songKey ? convertSingleChordToHarmonicMode(chord, songKey, 'functions') : null;
  const hasAnalysis = Boolean(degree && func && degree !== chord && func !== chord);
  const fullAnalysisStr = hasAnalysis ? `${chord} - ${degree} - ${func}` : chord;

  const currentIndex = availableChords.indexOf(chord);
  const hasMultiple = availableChords.length > 1;

  const handlePrev = () => {
    if (!hasMultiple || !onSelectChord) return;
    const prevIndex = (currentIndex - 1 + availableChords.length) % availableChords.length;
    onSelectChord(availableChords[prevIndex]);
  };

  const handleNext = () => {
    if (!hasMultiple || !onSelectChord) return;
    const nextIndex = (currentIndex + 1) % availableChords.length;
    onSelectChord(availableChords[nextIndex]);
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.05}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] w-[calc(100vw-2rem)] max-w-xs sm:w-80 antialiased notranslate ${
        isDragging ? 'shadow-2xl ring-2 ring-brand cursor-grabbing scale-[1.02]' : ''
      }`}
      translate="no"
    >
      <div className="bg-surface/95 dark:bg-neutral-900/95 backdrop-blur-xl border-2 border-brand/40 dark:border-brand/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-text-main ring-1 ring-black/10">
        
        {/* Drag Handle Top Bar */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="flex items-center justify-center gap-1.5 py-1 px-3 bg-brand/15 dark:bg-brand/25 border-b border-brand/20 cursor-grab active:cursor-grabbing text-brand font-black text-[9px] uppercase tracking-wider select-none touch-none hover:bg-brand/20 transition-colors"
          title="Pressione/Segure e arraste para mover o diagrama pela tela"
        >
          <GripHorizontal size={14} className="text-brand shrink-0" />
          <span>Pressione e arraste para mover</span>
        </div>

        {/* Header */}
        <div 
          onPointerDown={(e) => {
            if (!(e.target as HTMLElement).closest('button, input, select, a')) {
              dragControls.start(e);
            }
          }}
          className="flex items-center justify-between px-4 py-2.5 bg-brand/10 border-b border-border/60 cursor-grab active:cursor-grabbing select-none touch-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 rounded-lg bg-brand text-white shadow-xs shrink-0">
              <Music size={15} />
            </span>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-black text-text-main tracking-tight font-mono">
                  {chord}
                </span>
                {songKey && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand/15 text-brand uppercase shrink-0">
                    Tom {songKey}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-text-muted hover:text-text-main transition-colors cursor-pointer shrink-0"
            title="Fechar (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Instrument Toggle */}
        <div className="flex items-center justify-center px-3 py-2 bg-black/5 dark:bg-white/5 border-b border-border/40 gap-2">
          {/* Instrument Toggle */}
          <div className="flex bg-surface dark:bg-neutral-800 p-0.5 rounded-lg border border-border/80 gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setInstrument('guitar')}
              className={`px-2 py-1 text-[10px] font-black uppercase rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                instrument === 'guitar' ? "bg-brand text-white shadow-xs" : "text-text-muted hover:text-text-main"
              }`}
            >
              🎸 Violão
            </button>
            <button
              type="button"
              onClick={() => setInstrument('piano')}
              className={`px-2 py-1 text-[10px] font-black uppercase rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                instrument === 'piano' ? "bg-brand text-white shadow-xs" : "text-text-muted hover:text-text-main"
              }`}
            >
              🎹 Teclado
            </button>
          </div>
        </div>

        {/* Diagram Body */}
        <div className="p-4 flex flex-col items-center justify-center bg-surface/50 dark:bg-neutral-900/50 min-h-[160px]">
          {instrument === 'guitar' ? (
            <GuitarChordDiagram
              chordName={chord}
              songKey={songKey}
              className="bg-transparent border-0 shadow-none p-0 max-w-[190px] w-full"
            />
          ) : (
            <PianoChordDiagram
              chordName={chord}
              compact={true}
              songKey={songKey}
              className="bg-transparent border-0 shadow-none p-0 max-w-[240px] w-full"
            />
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-3 py-2 bg-black/5 dark:bg-white/5 border-t border-border/60">
          {hasMultiple && onSelectChord ? (
            <div className="flex items-center justify-between w-full gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase text-text-muted hover:text-brand hover:bg-brand/10 rounded-lg transition-all cursor-pointer active:scale-95"
                title="Acorde Anterior"
              >
                <ChevronLeft size={14} />
                <span>Anterior</span>
              </button>

              <span className="text-[10px] font-bold text-text-muted font-mono">
                {currentIndex >= 0 ? `${currentIndex + 1}/${availableChords.length}` : ''}
              </span>

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase text-text-muted hover:text-brand hover:bg-brand/10 rounded-lg transition-all cursor-pointer active:scale-95"
                title="Próximo Acorde"
              >
                <span>Próximo</span>
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <div className="w-full text-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  document.getElementById('chord-dictionary-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="text-[10px] font-black text-brand hover:underline cursor-pointer uppercase tracking-wider"
              >
                Ver no Dicionário Completo
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

