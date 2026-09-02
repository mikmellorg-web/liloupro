// LiLouPro SongsView - clean build
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import { toPng } from 'html-to-image';
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Music, Calendar, Users, Home, Search, Plus, Minus, Download, Image as ImageIcon, Upload,
  Trash2, Edit, Save, ArrowLeft, Volume2, Volume1, FileText, ExternalLink, Bell,
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown, LogOut, Check, X, Sparkles, CloudOff, Wifi, WifiOff, Database,
  Clock, Activity, Maximize2, Minimize2, ThumbsUp, Menu, MoreHorizontal,
  Play, Pause, BookOpen, Book, Quote, GripVertical, Timer, ChevronsDown, RefreshCcw,
  Settings, FileDown, Youtube, MessageSquare, Share2, Zap, BarChart2, Copy,
  Send, Star, Lock, Unlock, CornerDownRight, Bold, Italic, Underline, Tv,
  AlertTriangle, Smartphone, Columns, Mic, MicOff, Loader2, GraduationCap, Camera, Gift, Baby, HelpCircle,
  Flame, TrendingUp, TrendingDown, Sliders, Layers, Bluetooth, Radio, Mail
} from 'lucide-react';
import { Music2 } from './MusicIcon';
import { BossPedalIcon } from './BossPedalIcon';
import { ChromaticTunerModal } from './ChromaticTunerModal';
import { StudyMetronomeModal } from './StudyMetronomeModal';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { 
  loginWithGoogle, logout, db, handleFirestoreError, OperationType,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
  updateProfile, auth 
} from '../lib/firebase';
import { 
  collection, query, onSnapshot, addDoc, deleteDoc, getDocs,
  doc, updateDoc, setDoc, getDoc, orderBy, Timestamp, where, serverTimestamp, deleteField 
} from 'firebase/firestore';
import { 
  transposeLyricsAndChords, transposeChord, isChordLine, detectKey, isChordWord, 
  isAnnotationOrHeaderWord, parseChordLineIntoTokens, getCleanChordName, cleanTablatures, 
  cleanCifraHtml, HarmonicDisplayMode, convertLyricsAndChordsToHarmonicMode, 
  convertSingleChordToHarmonicMode, convertHarmonicToChordName, ChordToken, 
  areChordsInCapoShape, getCapoSemitonesFromText, cleanLyricsForDisplay, 
  extractLyricsFromChords, getEffectiveLyrics, stripDynamicsFromText 
} from '../services/chordService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportJsonToExcel } from '../utils/excelExport';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BibleSearch } from './BibleSearch';
import { ProjectorDisplay } from './ProjectorDisplay';
import { ProjectionView } from './ProjectionView';
import { ChatView } from './ChatView';
import { ChordDictionaryModal, ChordDictionaryCard, QuickChordPopover } from './ChordDictionary';
import CommercialLandingPage from './CommercialLandingPage';
import TheoryStudyView from './TheoryStudyView';
import { LeaderOnboardingWizard } from './LeaderOnboardingWizard';
import { CachedAvatar } from './CachedAvatar';
import BibleReaderView from './BibleReaderView';
import { QuickBibleSearch } from './QuickBibleSearch';
import { OfflineView } from './OfflineView';
import { SplashIntro } from './SplashIntro';
import { BibleVersionProvider } from '../contexts/BibleVersionContext';
import HelpCenter from './HelpCenter';
import ContextualHelp from './ContextualHelp';
import { FootswitchModal, FootswitchConfig, MVAVE_CHOCOLATE_DEFAULT_MAPPINGS } from './FootswitchModal';
import { getServicePlaylistSongs, getServiceSongs, getServiceSongIds, updateServicePlaylistUrl } from '../utils/servicePlaylistUtils';




import {
  cn, getArtistImage, getArtistInitials, getArtistGradient, artistImageCache, cleanChordText, ArtistAvatar,
  formatBirthDate, EasyBirthDatePicker, getStyledChars, getStyledTextRuns, ChordButton, PairedChordLyricsRow,
  isDynamicTerm, getDynamicType, formatDynamicLabel, triggerDynamicExplanation, triggerDynamicsGuideModal,
  getDynamicExplanationDetails, DynamicExplanationModal, isSectionHeaderContent, parseBracketSubContent,
  parseLineSectionAndDynamics, RenderTextWithInlineBadges, RenderSectionOrDynamicsLine, SingleLineRow,
  compressAndResizeImage, ConfirmButton, formatDate, formatTime, NotificationCenter, getLocalDateTimeString,
  getLocalDateString, getFormatNameForPdf, Button, Card, Input, normalizeSongTitle, calculateSongMatchScore,
  findBestSongMatch, parseYoutubeVideoId, SERVICE_THEMES, getContrastColor, type LiturgyItem, type MomentGroup
} from './songsShared';

function getMomentGroups(liturgy: LiturgyItem[]): MomentGroup[] {
  const groups: MomentGroup[] = [];
  if (!liturgy || liturgy.length === 0) return groups;

  let currentGroup: MomentGroup | null = null;

  liturgy.forEach((item, index) => {
    const itemMoment = item.moment?.trim() || "";
    const displayMoment = itemMoment || "Sem Momento";

    if (!currentGroup || currentGroup.moment !== displayMoment) {
      currentGroup = {
        moment: displayMoment,
        items: []
      };
      groups.push(currentGroup);
    }

    currentGroup.items.push({ item, originalIndex: index });
  });

  return groups;
}

function getMomentStyles(momentName: string) {
  const name = (momentName || "").toLowerCase().trim();
  
  if (name === "ofertório" || name === "ofertorio" || name.includes("ofertório") || name.includes("ofertorio")) {
    return {
      bg: "bg-emerald-500/5 dark:bg-emerald-500/10",
      border: "border-emerald-500/30 dark:border-emerald-500/40 border-l-[6px] border-l-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      dot: "bg-emerald-500",
      label: "OFERTÓRIO"
    };
  }
  if (name === "palavra auxiliar" || name.includes("palavra auxiliar")) {
    return {
      bg: "bg-amber-500/5 dark:bg-amber-500/10",
      border: "border-amber-500/30 dark:border-amber-500/40 border-l-[6px] border-l-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
      label: "PALAVRA AUXILIAR"
    };
  }
  if (name === "palavra inicial" || name.includes("palavra inicial")) {
    return {
      bg: "bg-amber-500/5 dark:bg-amber-500/10",
      border: "border-amber-500/30 dark:border-amber-500/40 border-l-[6px] border-l-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
      label: "PALAVRA INICIAL"
    };
  }
  if (name === "palavra final" || name.includes("palavra final")) {
    return {
      bg: "bg-amber-500/5 dark:bg-amber-500/10",
      border: "border-amber-500/30 dark:border-amber-500/40 border-l-[6px] border-l-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
      label: "PALAVRA FINAL"
    };
  }
  if (name.includes("pregação") || name.includes("palavra") || name.includes("sermão") || name.includes("mensagem") || name.includes("ministração")) {
    return {
      bg: "bg-amber-500/5 dark:bg-amber-500/10",
      border: "border-amber-500/30 dark:border-amber-500/40 border-l-[6px] border-l-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
      label: "MENSAGEM / PALAVRA"
    };
  }
  if (name.includes("oração") || name.includes("clamor") || name.includes("intercessão") || name.includes("confissão")) {
    return {
      bg: "bg-emerald-500/5 dark:bg-emerald-500/10",
      border: "border-emerald-500/30 dark:border-emerald-500/40 border-l-[6px] border-l-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      dot: "bg-emerald-500",
      label: "ORAÇÃO / INTERCESSÃO"
    };
  }
  if (name.includes("aviso") || name.includes("comunhão") || name.includes("oferta") || name.includes("dízimo")) {
    return {
      bg: "bg-purple-500/5 dark:bg-purple-500/10",
      border: "border-purple-500/30 dark:border-purple-500/40 border-l-[6px] border-l-purple-500",
      text: "text-purple-600 dark:text-purple-400",
      dot: "bg-purple-500",
      label: "AVISOS / COMUNHÃO"
    };
  }
  if (name.includes("louvor") || name.includes("inicial") || name.includes("música") || name.includes("canto") || name.includes("adoração")) {
    return {
      bg: "bg-blue-500/5 dark:bg-blue-500/10",
      border: "border-blue-500/30 dark:border-blue-500/40 border-l-[6px] border-l-blue-500",
      text: "text-blue-600 dark:text-blue-400",
      dot: "bg-blue-500",
      label: "LOUVOR / ADORAÇÃO"
    };
  }
  if (name.includes("encerramento") || name.includes("bênção") || name.includes("final") || name.includes("despedida")) {
    return {
      bg: "bg-rose-500/5 dark:bg-rose-500/10",
      border: "border-rose-500/30 dark:border-rose-500/40 border-l-[6px] border-l-rose-500",
      text: "text-rose-600 dark:text-rose-400",
      dot: "bg-rose-500",
      label: "ENCERRAMENTO"
    };
  }
  if (name === "sem momento" || name === "") {
    return {
      bg: "bg-black/5 dark:bg-white/5",
      border: "border-border border-l-[6px] border-l-muted-foreground/40",
      text: "text-text-muted",
      dot: "bg-muted-foreground",
      label: "MOMENTO AUXILIAR"
    };
  }
  
  return {
    bg: "bg-cyan-500/5 dark:bg-cyan-500/10",
    border: "border-cyan-500/30 dark:border-cyan-500/40 border-l-[6px] border-l-cyan-500",
    text: "text-cyan-600 dark:text-cyan-400",
    dot: "bg-cyan-500",
    label: momentName.toUpperCase()
  };
}

function LiturgyItemCard({
  item,
  idx,
  isAdmin,
  onOpenSong,
  startEditing,
  handleMove,
  handleRemoveItem,
  serviceLiturgyLength,
  dragControlsEnabled = true,
  calculatedTime
}: {
  item: any;
  idx: number;
  isAdmin: boolean;
  onOpenSong?: (songId: string) => void;
  startEditing: (item: any, idx?: number) => void;
  handleMove: (idx: number, direction: 'up' | 'down') => void;
  handleRemoveItem: (itemId: string, index: number) => void;
  serviceLiturgyLength: number;
  dragControlsEnabled?: boolean;
  calculatedTime?: string;
}) {
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const dragControls = useDragControls();

  const Card = (isAdmin && dragControlsEnabled) ? Reorder.Item : motion.div;
  
  const cardProps: any = {
    layout: true,
    initial: { opacity: 0, x: -24 },
    animate: { opacity: 1, x: 0 },
    whileDrag: {
      scale: 1.025,
      rotate: 0.5,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
      filter: "brightness(1.05)",
    },
    transition: {
      type: "spring",
      stiffness: 320,
      damping: 26,
      mass: 0.6,
      opacity: { duration: 0.3, delay: Math.min(idx * 0.04, 0.25) },
      x: { type: "spring", stiffness: 280, damping: 22, delay: Math.min(idx * 0.04, 0.25) }
    },
    onClick: () => {
      if (item.type === 'song' && onOpenSong) {
        onOpenSong(item.songId || '');
      } else if (isAdmin) {
        startEditing(item, idx);
      }
    },
    className: cn(
      "flex items-start sm:items-center gap-2 sm:gap-4 bg-black/5 dark:bg-white/5 p-2.5 sm:p-5 rounded-xl border border-black/10 dark:border-white/10 group hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all shadow-sm w-full select-none",
      (isAdmin || (item.type === 'song' && onOpenSong)) && "cursor-pointer"
    )
  };

  if (isAdmin && dragControlsEnabled) {
    cardProps.value = item;
    cardProps.dragListener = false;
    cardProps.dragControls = dragControls;
  }

  return (
    <Card {...cardProps}>
       <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          {isAdmin && dragControlsEnabled && (
            <div 
              onPointerDown={(e) => {
                e.preventDefault();
                dragControls.start(e);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              className="self-stretch flex items-center justify-center px-1.5 sm:px-2.5 text-text-muted hover:text-brand bg-black/10 dark:bg-white/5 hover:bg-black/15 dark:hover:bg-white/10 rounded-xl border border-black/5 dark:border-white/10 cursor-grab active:cursor-grabbing transition-colors touch-none"
              title="Arrastar para reordenar"
            >
              <GripVertical size={16} />
            </div>
          )}
          {isAdmin && (
            <div className="flex flex-col gap-1.5">
               <button 
                 onClick={(e) => { e.stopPropagation(); handleMove(idx, 'up'); }} 
                 className={cn(
                   "w-[38px] h-[38px] sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-800 border border-white/10 text-white hover:bg-slate-700 active:scale-95 transition-all shadow-sm",
                   idx === 0 && "opacity-0 pointer-events-none"
                 )}
               >
                 <ChevronUp size={16} />
               </button>
               <button 
                 onClick={(e) => { e.stopPropagation(); handleMove(idx, 'down'); }} 
                 className={cn(
                   "w-[38px] h-[38px] sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-800 border border-white/10 text-white hover:bg-slate-700 active:scale-95 transition-all shadow-sm",
                   idx === (serviceLiturgyLength - 1) && "opacity-0 pointer-events-none"
                 )}
               >
                 <ChevronDown size={16} />
               </button>
            </div>
          )}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-brand flex items-center justify-center text-[11px] sm:text-[11px] font-black text-white shrink-0 border border-brand/30 shadow-sm">
                {idx + 1}
            </div>
            {calculatedTime && (
              <span className="text-[8px] font-mono font-black tracking-tighter text-brand bg-brand/10 dark:bg-brand/20 border border-brand/25 px-1.5 py-0.5 rounded leading-none shrink-0" title="Início estimado">
                {calculatedTime}
              </span>
            )}
          </div>
       </div>
       <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-6 min-w-0 py-0.5">
         {item.content && (
           <div className="shrink-0 w-fit">
              <p className="text-[11px] sm:text-xs text-white font-black uppercase tracking-widest bg-brand px-2 sm:px-4 py-1.5 sm:py-2.5 rounded sm:rounded-xl border border-white/20 shadow-md leading-none text-center">
                {item.content}
              </p>
           </div>
         )}
         
         <div className="min-w-0 flex-1 notranslate" translate="no">
            {item.moment && (
              <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-brand uppercase block mb-0.5">
                {item.moment}
              </span>
            )}
            <p className="text-text-main text-base sm:text-lg font-bold flex items-center flex-wrap gap-1.5 sm:gap-3 leading-tight tracking-tight">
              {item.type === 'reading' && <BookOpen size={14} className="text-text-main shrink-0"/>}
              {item.type === 'song' && <Music2 size={14} className="text-brand shrink-0"/>}
              {item.type === 'speech' && <Quote size={14} className="text-purple-600 shrink-0"/>}
              {item.type === 'prayer' && <Check size={14} className="text-teal-600 shrink-0"/>}
              {item.type === 'announcements' && <Volume2 size={14} className="text-red-500 shrink-0"/>}
              {item.type === 'offering' && <Gift size={14} className="text-emerald-500 shrink-0"/>}
              {item.type === 'other' && <Activity size={14} className="text-green-600 shrink-0"/>}
              <span className="truncate">{item.title}</span>
              {item.duration && (
                <span className="text-[8px] font-black uppercase tracking-widest bg-[#E60000]/10 border border-[#E60000]/25 text-[#E60000] dark:text-red-400 px-1.5 py-0.5 rounded leading-none shrink-0 flex items-center gap-1 self-center">
                  <Clock size={9} /> {item.duration}m
                </span>
              )}
            </p>
            {item.details && (
              <div className="mt-2 space-y-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTextExpanded(!isTextExpanded);
                  }}
                  className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-text-muted hover:text-brand bg-black/10 dark:bg-white/5 hover:bg-black/15 dark:hover:bg-white/10 px-2.5 py-1 rounded-lg border border-black/10 dark:border-white/10 transition-all cursor-pointer select-none"
                  title={isTextExpanded ? "Recolher texto" : "Ver texto completo"}
                >
                  <FileText size={11} className="text-brand" />
                  <span>{isTextExpanded ? 'Recolher Texto' : 'Ver Texto'}</span>
                  {isTextExpanded ? <ChevronUp size={12} className="text-brand" /> : <ChevronDown size={12} className="text-brand" />}
                </button>
                <AnimatePresence initial={false}>
                  {isTextExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-1 pl-3 py-2 border-l-[3px] border-brand/60 text-[11px] sm:text-xs text-text-main italic whitespace-pre-line leading-relaxed max-w-2xl bg-black/5 dark:bg-black/30 p-3 rounded-r-xl border border-black/5 dark:border-white/5">
                        "{item.details}"
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
         </div>
       </div>
       <div className="button-container flex items-center gap-0.5 sm:opacity-0 group-hover:opacity-100 transition-opacity self-center">
          {isAdmin && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); startEditing(item, idx); }} 
                className="p-1 sm:p-2 hover:bg-white/5 rounded-lg text-white transition-colors" 
                title="Editar"
              >
                <Edit size={12}/>
              </button>
              <ConfirmButton 
                onConfirm={() => handleRemoveItem(item.id, idx)}
                className="p-1 sm:p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors" 
                title="Excluir"
              >
                <Trash2 size={12}/>
              </ConfirmButton>
            </>
          )}
       </div>
    </Card>
  );
}

function MultiVocalistSelector({
  value,
  onChange,
  vocalists,
  members
}: {
  value: string;
  onChange: (newValue: string) => void;
  vocalists: any[];
  members: any[];
}) {
  const [customInput, setCustomInput] = useState('');

  const selectedList = useMemo(() => {
    if (!value) return [];
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }, [value]);

  const handleToggleMember = (memberName: string) => {
    let updated: string[];
    if (selectedList.includes(memberName)) {
      updated = selectedList.filter(name => name !== memberName);
    } else {
      updated = [...selectedList, memberName];
    }
    onChange(updated.join(', '));
  };

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selectedList.includes(trimmed)) {
      const updated = [...selectedList, trimmed];
      onChange(updated.join(', '));
      setCustomInput('');
    }
  };

  const handleSelectDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected && !selectedList.includes(selected)) {
      const updated = [...selectedList, selected];
      onChange(updated.join(', '));
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-2.5 bg-black/10 dark:bg-white/5 p-3.5 rounded-xl border border-border/70 text-left">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-text-main uppercase tracking-wider flex items-center gap-1.5 opacity-90">
          <Mic size={13} className="text-brand" />
          Cantor(es) / Vocais ({selectedList.length})
        </label>
        {selectedList.length > 0 && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[10px] text-red-400 hover:text-red-300 font-bold underline transition-colors"
          >
            Limpar todos
          </button>
        )}
      </div>

      {/* Badges of selected vocalists */}
      <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-black/20 dark:bg-black/40 rounded-lg border border-border/40 items-center">
        {selectedList.length === 0 ? (
          <span className="text-[11px] text-text-muted/70 italic px-1">
            Nenhum cantor selecionado. Toque nas sugestões abaixo ou escolha no menu.
          </span>
        ) : (
          selectedList.map((name, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-brand/20 border border-brand/40 text-brand shadow-xs animate-in fade-in zoom-in-95 duration-150"
            >
              🎤 {name}
              <button
                type="button"
                onClick={() => handleToggleMember(name)}
                className="hover:bg-brand/30 rounded-full p-0.5 text-brand/80 hover:text-brand transition-colors cursor-pointer"
                title={`Remover ${name}`}
              >
                <X size={12} />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Quick Select Chips from Team Vocalists */}
      {vocalists.length > 0 && (
        <div className="space-y-1 pt-1">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">
            Toque para adicionar/remover cantores da equipe:
          </span>
          <div className="flex flex-wrap gap-1">
            {vocalists.map((m) => {
              const isSelected = selectedList.includes(m.name);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleToggleMember(m.name)}
                  className={cn(
                    "text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer select-none",
                    isSelected
                      ? "bg-brand text-slate-950 border-brand shadow-sm font-black"
                      : "bg-black/20 border-border text-text-muted hover:text-text-main hover:border-brand/40"
                  )}
                >
                  {isSelected ? <Check size={11} /> : <Plus size={11} />}
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dropdown for all members + Custom Input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {/* Select Dropdown */}
        <select
          onChange={handleSelectDropdown}
          className="w-full bg-black/20 border border-border rounded-lg text-text-main text-xs p-2 h-9 outline-none focus:ring-2 focus:ring-brand/35 cursor-pointer"
          defaultValue=""
        >
          <option value="" disabled>+ Adicionar cantor da lista...</option>
          <optgroup label="Vocais Cadastrados">
            {vocalists.map(m => (
              <option key={m.id} value={m.name} disabled={selectedList.includes(m.name)}>
                {selectedList.includes(m.name) ? `✓ ${m.name} (já selecionado)` : m.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Outros Integrantes">
            {members.filter(m => !vocalists.some(v => v.id === m.id)).map(m => (
              <option key={m.id} value={m.name} disabled={selectedList.includes(m.name)}>
                {selectedList.includes(m.name) ? `✓ ${m.name} (já selecionado)` : m.name}
              </option>
            ))}
          </optgroup>
        </select>

        {/* Custom Input */}
        <div className="flex items-center gap-1.5">
          <Input
            placeholder="Ou digite cantor convidado..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustom();
              }
            }}
            className="bg-black/20 border-border text-text-main h-9 text-xs py-0"
          />
          <Button
            onClick={handleAddCustom}
            disabled={!customInput.trim()}
            className="h-9 px-3 bg-brand/20 hover:bg-brand/30 border border-brand/40 text-brand text-xs font-bold rounded-lg shrink-0 flex items-center gap-1"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

const LITURGY_SONG_MOMENTS = [
  "PRIMEIRA MÚSICA",
  "SEGUNDA MÚSICA",
  "TERCEIRA MÚSICA",
  "QUARTA MÚSICA",
  "QUINTA MÚSICA",
  "SEXTA MÚSICA",
  "SÉTIMA MÚSICA",
  "OITAVA MÚSICA",
  "NONA MÚSICA",
  "DÉCIMA MÚSICA"
];

const LITURGY_GENERAL_MOMENTS = [
  "Palavra Inicial",
  "Louvor Inicial",
  "Oração",
  "Pregação",
  "Palavra Auxiliar",
  "Avisos",
  "Ofertório",
  "Louvor Final",
  "Palavra Final"
];

const LITURGY_SONG_CATEGORIES = [
  "ABERTURA",
  "CRIAÇÃO/ADORAÇÃO",
  "QUEDA/CONFISSÃO",
  "REDENÇÃO/AÇÃO DE GRAÇAS",
  "CONSUMAÇÃO/RESPOSTA",
  "DÍZIMOS/OFERTAS",
  "ORAÇÃO/INTERCESSÃO",
  "APELO/DECISÃO",
  "JÚBILO/CELEBRAÇÃO",
  "CEIA/COMUNHÃO",
  "ADORAÇÃO",
  "ENCERRAMENTO",
  "PERSONALIZAR"
];

const LITURGY_NON_SONG_CATEGORIES = [
  "CHAMADO À ADORAÇÃO",
  "EXPLICAÇÃO DO EVANGELHO",
  "ORAÇÃO PASTORAL",
  "DÍZIMOS/OFERTAS",
  "AVISOS DO CULTO",
  "PREGAÇÃO",
  "BÊNÇÃO FINAL",
  "OUTRO"
];

export function LiturgyEditor({ 
  service, 
  onOpenSong, 
  playlistOnly = false,
  createNotifications
}: { 
  service: any, 
  onOpenSong?: (songId: string) => void, 
  playlistOnly?: boolean,
  createNotifications?: (title: string, content: string, type: 'announcement' | 'mural' | 'service' | 'general', excludeUserId?: string, preferenceKey?: 'notifyNewSongs' | 'notifyScheduleChanges' | 'notifyDayBeforeReminder' | 'notifyNewLiturgy') => Promise<any>
}) {
  const { user, isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState((service?.liturgy || []).length === 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [songs, setSongs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [pastServices, setPastServices] = useState<any[]>([]);
  const [confirmDeleteLiturgy, setConfirmDeleteLiturgy] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveFeedbackMessage, setSaveFeedbackMessage] = useState<string | null>(null);
  const [itemEditStatus, setItemEditStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [addItemStatus, setAddItemStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const handleSaveLiturgy = async () => {
    setSaveStatus("saving");
    setSaveFeedbackMessage("Salvando alterações no Firebase...");
    const servicePath = `services/${service.id}`;
    try {
      const liturgy = service.liturgy || [];
      await updateDoc(doc(db, "services", service.id), { 
        liturgy,
        updatedAt: new Date().toISOString()
      });
      setSaveStatus("success");
      setSaveFeedbackMessage("Liturgia salva com sucesso no Firebase!");
      setTimeout(() => {
        setIsEditing(false);
        setSaveStatus("idle");
        setSaveFeedbackMessage(null);
      }, 1200);
    } catch (error) {
      console.error("Erro ao salvar liturgia:", error);
      setSaveStatus("error");
      setSaveFeedbackMessage("Falha ao salvar no banco de dados. Tente novamente.");
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
      setTimeout(() => {
        setSaveStatus("idle");
        setSaveFeedbackMessage(null);
      }, 3500);
    }
  };

  useEffect(() => {
    if (confirmDeleteLiturgy) {
      const timer = setTimeout(() => {
        setConfirmDeleteLiturgy(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmDeleteLiturgy]);

  const handleClearLiturgy = async () => {
    setIsSaving(true);
    const servicePath = `services/${service.id}`;
    try {
      await updateDoc(doc(db, 'services', service.id), { liturgy: [] });
      setConfirmDeleteLiturgy(false);
      setIsEditing(true); // Go back to editing/adding mode when cleared
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
    } finally {
      setIsSaving(false);
    }
  };
  const [newItem, setNewItem] = useState({ type: 'reading', title: '', content: '', details: '', songId: '', moment: '', bibleVersion: 'NAA', vocalist: '', duration: '' });
  const [editItem, setEditItem] = useState({ type: 'reading', title: '', content: '', details: '', songId: '', moment: '', bibleVersion: 'NAA', vocalist: '', duration: '' });

  useEffect(() => {
    if (!user) return;
    const memberPath = 'members';
    const unsub = onSnapshot(collection(db, memberPath), (snap) => {
      setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching members inside LiturgyEditor:", error);
    });
    return unsub;
  }, [user]);

  const vocalists = useMemo(() => {
    return (members || []).filter(m => 
      m.roles?.some((role: string) => 
        role.toLowerCase().includes('vocal')
      )
    );
  }, [members]);

  const normalizedLiturgy = useMemo(() => {
    if (!service?.liturgy || !Array.isArray(service.liturgy)) return [];
    const seenIds = new Set<string>();
    return service.liturgy.map((item: any, index: number) => {
      let itemId = item?.id && typeof item.id === 'string' && item.id.trim() !== ''
        ? item.id
        : (item?.songId ? `song-${item.songId}-${index}` : `liturgy-item-${index}-${item?.type || 'item'}`);
      
      if (seenIds.has(itemId)) {
        itemId = `${itemId}-dup-${index}`;
      }
      seenIds.add(itemId);

      return {
        ...item,
        id: itemId
      };
    });
  }, [service?.liturgy]);

  const timelineTimes = useMemo(() => {
    if (!service || !normalizedLiturgy) return {} as Record<string, string>;
    let currentTime = new Date(service.date);
    if (isNaN(currentTime.getTime())) {
      currentTime = new Date();
    }
    const timeline: Record<string, string> = {};
    normalizedLiturgy.forEach((item: any) => {
      const hrs = String(currentTime.getHours()).padStart(2, '0');
      const mins = String(currentTime.getMinutes()).padStart(2, '0');
      timeline[item.id] = `${hrs}:${mins}`;
      
      const durationVal = parseInt(item.duration);
      if (!isNaN(durationVal) && durationVal > 0) {
        currentTime.setMinutes(currentTime.getMinutes() + durationVal);
      }
    });
    return timeline;
  }, [service?.date, normalizedLiturgy]);
  const [showBibleSearch, setShowBibleSearch] = useState(false);
  const [showEditBibleSearch, setShowEditBibleSearch] = useState(false);
  const [isGroupedByMoments, setIsGroupedByMoments] = useState(true);
  const [showCustomMomentInput, setShowCustomMomentInput] = useState(false);
  const [showCustomMomentInputEdit, setShowCustomMomentInputEdit] = useState(false);
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [showCustomCategoryInputEdit, setShowCustomCategoryInputEdit] = useState(false);

  useEffect(() => {
    if (!service) return;
    setIsEditing((service.liturgy || []).length === 0);
    setEditingId(null);
  }, [service?.id]);

  useEffect(() => {
    if (!user) return;
    if (!isEditing && !editingId) return;
    const songPath = 'songs';
    const q = query(collection(db, songPath), orderBy('title', 'asc'));
    return onSnapshot(q, (snap) => {
      setSongs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching songs:", error);
    });
  }, [isEditing, editingId, user]);

  useEffect(() => {
    if (!isCloning || !user) return;
    const servicePath = 'services';
    const q = query(collection(db, servicePath), orderBy('date', 'desc'));
    return onSnapshot(q, (snap) => {
      // Filtra cultos que já possuem liturgia
      setPastServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)).filter(s => s.id !== service.id && s.liturgy?.length > 0));
    }, (error) => {
       console.error("Error fetching past services:", error);
    });
  }, [isCloning, user, service.id]);

  const handleCloneLiturgy = async (sourceId: string) => {
    const source = pastServices.find(s => s.id === sourceId);
    if (!source || !source.liturgy) return;

    setIsSaving(true);
    try {
      // Deep copy and generate new IDs
      const clonedLiturgy = source.liturgy.map((item: any) => ({
        ...item,
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)
      }));
      await updateDoc(doc(db, 'services', service.id), { liturgy: clonedLiturgy });
      setIsCloning(false);

      if (createNotifications) {
        const dateStr = new Date(service.date).toLocaleDateString('pt-BR');
        await createNotifications(
          '📖 Nova Liturgia Disponível',
          `A liturgia para o culto "${service.title}" em ${dateStr} foi definida. Venha conferir!`,
          'service',
          user?.uid,
          'notifyNewLiturgy'
        );
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `services/${service.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.title) return;
    setIsSaving(true);
    setAddItemStatus("saving");
    const servicePath = `services/${service.id}`;
    try {
      const liturgy = service.liturgy || [];
      const updatedLiturgy = [...liturgy, { ...newItem, id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() }];
      const songIds = updatedLiturgy
        .filter((item: any) => item && (item.type === 'song' || item.songId))
        .map((item: any) => item.songId || item.id)
        .filter(Boolean);

      await updateDoc(doc(db, "services", service.id), { 
        liturgy: updatedLiturgy,
        setlist: songIds,
        updatedAt: new Date().toISOString()
      });
      setAddItemStatus("success");
      setNewItem({ type: "reading", title: "", content: "", details: "", songId: "", moment: "", bibleVersion: "NAA", vocalist: "", duration: "" });
      setShowCustomMomentInput(false);
      setShowBibleSearch(false);

      if (liturgy.length === 0 && createNotifications) {
        const dateStr = new Date(service.date).toLocaleDateString("pt-BR");
        await createNotifications(
          "📖 Nova Liturgia Disponível",
          `A liturgia para o culto "${service.title}" em ${dateStr} foi definida. Venha conferir!`,
          "service",
          user?.uid,
          "notifyNewLiturgy"
        );
      }
      setTimeout(() => {
        setAddItemStatus("idle");
      }, 1500);
    } catch (error) {
      setAddItemStatus("error");
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
      setTimeout(() => {
        setAddItemStatus("idle");
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualNotifyLiturgy = async () => {
    if (!createNotifications) return;
    setIsSaving(true);
    try {
      const dateStr = new Date(service.date).toLocaleDateString('pt-BR');
      const result = await createNotifications(
        '📖 Nova Liturgia Disponível',
        `A liturgia para o culto "${service.title}" em ${dateStr} foi definida. Venha conferir!`,
        'service',
        user?.uid,
        'notifyNewLiturgy'
      );
      if (result && result.pushSentCount > 0) {
        alert(`🚀 Notificação enviada para ${result.pushSentCount} aparelho(s) e registrada no mural do aplicativo!`);
      } else if (result && result.pushTokensCount > 0 && result.pushSentCount === 0) {
        alert(`🔔 Notificação registrada com sucesso no aplicativo para todos os membros!\n\nℹ️ Para que a notificação remota acorde o celular com o aplicativo totalmente fechado no Vercel, certifique-se de cadastrar a chave FIREBASE_SERVICE_ACCOUNT nas variáveis de ambiente da Vercel.`);
      } else {
        alert(`🔔 Notificação registrada no mural do aplicativo!\n\n💡 Dica: Para que o celular toque com tela apagada, peça aos membros para entrarem em Ajustes > Notificações e ativarem as notificações.`);
      }
    } catch (e) {
      console.error("Erro ao notificar liturgia:", e);
      alert("Não foi possível enviar a notificação.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareLiturgyWhatsApp = () => {
    if (!service || !service.liturgy) return;

    const dateStr = new Date(service.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeStr = new Date(service.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let message = `*ORDEM DO CULTO* 📖
`;
    message += `*${service.title}*
`;
    message += `📅 ${dateStr}
`;
    message += `⏰ ${timeStr}

`;

    const smartCapitalize = (str: string) => {
      if (!str) return '';
      const s = str.trim();
      if (s.length === 0) return '';
      let result = s;
      if (s === s.toUpperCase() && s !== s.toLowerCase()) {
        result = s.toLowerCase();
      }
      result = result.charAt(0).toUpperCase() + result.slice(1);
      const holyNames = [
        'Deus', 'Jesus', 'Cristo', 'Senhor', 'Espírito', 'Espirito', 'Santo', 'Pai', 'Filho', 
        'Maria', 'Bíblia', 'Biblia', 'Evangelho', 'Salmo', 'Amém', 'Amem'
      ];
      holyNames.forEach(name => {
        const regex = new RegExp(`\b${name}\b`, 'gi');
        result = result.replace(regex, () => name);
      });
      return result;
    };

    const typeEmojiMap: Record<string, string> = {
      reading: '📖',
      song: '🎵',
      speech: '🗣️',
      prayer: '🙏',
      announcements: '📢',
      offering: '💸',
      other: '✨'
    };

    const typeLabelMap: Record<string, string> = {
      reading: 'Leitura Bíblica',
      song: 'Música',
      speech: 'Palavra',
      prayer: 'Oração',
      announcements: 'Avisos',
      offering: 'Ofertas',
      other: 'Momento'
    };

    service.liturgy.forEach((item: any, idx: number) => {
      let titleStr = smartCapitalize(item.title || '');
      if (item.type === 'song' && item.vocalist) {
        titleStr += ` (🎤 ${item.vocalist})`;
      }

      const emoji = typeEmojiMap[item.type] || (item.type === 'reading' ? '📖' : item.type === 'song' ? '🎵' : '✨');
      const label = typeLabelMap[item.type] || smartCapitalize(item.type);

      // 1. Linha do cabeçalho da atividade (Emoji + Número + Tipo + Momento)
      let itemHeader = `${idx + 1}. ${emoji} *${label}*`;
      if (item.moment && item.moment.trim()) {
        itemHeader += ` - _${smartCapitalize(item.moment)}_`;
      }
      message += `${itemHeader}\n`;

      // 2. Título / Referência Bíblica (apenas Livro Capítulo:Versículo)
      if (titleStr) {
        message += `${titleStr}\n`;
      }

      // 3. Subtítulo/Conteúdo curto (apenas se for um rótulo curto e não for texto bíblico corrido)
      if (item.content && item.content.trim()) {
        const cleanContent = item.content.trim();
        const isLongText = cleanContent.length > 70 || cleanContent.includes('\n');
        const isDuplicate = cleanContent.toLowerCase() === (item.title || '').toLowerCase() || 
                            cleanContent.toLowerCase() === (item.moment || '').toLowerCase();
        
        if (!isLongText && !isDuplicate) {
          message += `_${smartCapitalize(cleanContent)}_\n`;
        }
      }

      // 4. Detalhes adicionais apenas se for nota curta (ex: nome do pregador), NUNCA texto bíblico completo
      if (item.details && item.type !== 'reading' && !item.bibleVersion) {
        const cleanDetails = item.details.trim();
        const isLongScripture = cleanDetails.length > 60 || cleanDetails.includes('\n');
        if (!isLongScripture) {
          message += `_"${cleanDetails}"_\n`;
        }
      }

      message += `\n`;
    });

    message += `_Gerado por LiLouPro_`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encodedMessage}`, '_blank');
  };

  const handleUpdateItem = async (itemId: string, itemIdx?: number) => {
    setIsSaving(true);
    setItemEditStatus("saving");
    const servicePath = `services/${service.id}`;
    try {
      const liturgy = [...(service.liturgy || [])];
      let index = -1;
      if (itemId) {
        index = liturgy.findIndex(i => i.id === itemId);
      }
      if (index === -1 && typeof itemIdx === "number" && itemIdx >= 0 && itemIdx < liturgy.length) {
        index = itemIdx;
      }
      if (index === -1 && itemId) {
        index = liturgy.findIndex(i => i.songId === itemId || (i.title && i.title === editItem.title));
      }
      if (index !== -1) {
        const existingItem = liturgy[index];
        const finalId = existingItem.id || itemId || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());
        liturgy[index] = { 
          ...existingItem,
          ...editItem, 
          id: finalId 
        };
        
        const updateData: any = { 
          liturgy,
          updatedAt: new Date().toISOString()
        };
        
        if (editItem.type === "song" && editItem.songId) {
          const setlist = [...(service.setlist || [])];
          const oldSongId = existingItem.songId;
          if (oldSongId && oldSongId !== editItem.songId) {
            const setlistIdx = setlist.indexOf(oldSongId);
            if (setlistIdx !== -1) {
              setlist[setlistIdx] = editItem.songId;
            } else if (!setlist.includes(editItem.songId)) {
              setlist.push(editItem.songId);
            }
          } else if (!setlist.includes(editItem.songId)) {
            setlist.push(editItem.songId);
          }
          updateData.setlist = setlist;
        }

        await updateDoc(doc(db, "services", service.id), updateData);
        setItemEditStatus("success");
        setTimeout(() => {
          setEditingId(null);
          setItemEditStatus("idle");
        }, 700);
      } else {
        console.warn("Item não encontrado para atualização:", { itemId, itemIdx });
        setItemEditStatus("error");
        setTimeout(() => {
          setItemEditStatus("idle");
        }, 2000);
      }
    } catch (error) {
      setItemEditStatus("error");
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
      setTimeout(() => {
        setItemEditStatus("idle");
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (item: any, itemIdx?: number) => {
    const editKey = item.id || (typeof itemIdx === 'number' ? `item-${itemIdx}` : Date.now().toString());
    setEditingId(editKey);
    setEditItem({ 
      type: item.type, 
      title: item.title, 
      content: item.content, 
      details: item.details || '', 
      songId: item.songId || '',
      moment: item.moment || '',
      bibleVersion: item.bibleVersion || 'NAA',
      vocalist: item.vocalist || '',
      duration: item.duration || ''
    });
    const standardMoments = ["", ...LITURGY_GENERAL_MOMENTS, ...LITURGY_SONG_MOMENTS];
    const isCustom = item.moment && !standardMoments.includes(item.moment);
    setShowCustomMomentInputEdit(!!isCustom);
    const isCustomCat = item.type === 'song' && item.content && !LITURGY_SONG_CATEGORIES.includes(item.content);
    setShowCustomCategoryInputEdit(!!isCustomCat);
    setShowEditBibleSearch(false);
  };

  const handleRemoveItem = async (itemId: string, index: number) => {
    const servicePath = `services/${service.id}`;
    try {
      const liturgy = service.liturgy || [];
      const updatedLiturgy = liturgy.filter((_: any, i: number) => i !== index);
      const songIds = updatedLiturgy
        .filter((item: any) => item && (item.type === 'song' || item.songId))
        .map((item: any) => item.songId || item.id)
        .filter(Boolean);

      const updateData: any = { 
        liturgy: updatedLiturgy,
        setlist: songIds,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(doc(db, 'services', service.id), updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
    }
  };

  const handleReorder = async (newOrder: any[]) => {
    const servicePath = `services/${service.id}`;
    try {
      const songIds = newOrder
        .filter((item: any) => item && (item.type === 'song' || item.songId))
        .map((item: any) => item.songId || item.id)
        .filter(Boolean);

      await updateDoc(doc(db, 'services', service.id), { 
        liturgy: newOrder,
        setlist: songIds,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
    }
  };

  const handlePlaylistUpdate = async (url: string) => {
    const servicePath = `services/${service.id}`;
    try {
      await updateServicePlaylistUrl(service.id, url);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const liturgy = [...(service.liturgy || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= liturgy.length) return;

    if (!window.confirm('Deseja alterar a ordem da música no culto?')) return;

    const temp = liturgy[index];
    liturgy[index] = liturgy[newIndex];
    liturgy[newIndex] = temp;
    
    const songIds = liturgy
      .filter((item: any) => item && (item.type === 'song' || item.songId))
      .map((item: any) => item.songId || item.id)
      .filter(Boolean);

    const servicePath = `services/${service.id}`;
    try {
      await updateDoc(doc(db, 'services', service.id), { 
        liturgy,
        setlist: songIds,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
    }
  };

  const handleMoveMomentGroup = async (groupIndex: number, direction: 'up' | 'down') => {
    const groups = getMomentGroups(service.liturgy || []);
    if (direction === 'up' && groupIndex === 0) return;
    if (direction === 'down' && groupIndex === groups.length - 1) return;

    if (!window.confirm('Deseja alterar a ordem deste momento no culto?')) return;

    const targetGroupIndex = direction === 'up' ? groupIndex - 1 : groupIndex + 1;
    
    const reorderedGroups = [...groups];
    const temp = reorderedGroups[groupIndex];
    reorderedGroups[groupIndex] = reorderedGroups[targetGroupIndex];
    reorderedGroups[targetGroupIndex] = temp;

    const updatedLiturgy = reorderedGroups.flatMap(g => g.items.map(gi => gi.item));
    const songIds = updatedLiturgy
      .filter((item: any) => item && (item.type === 'song' || item.songId))
      .map((item: any) => item.songId || item.id)
      .filter(Boolean);
    
    const servicePath = `services/${service.id}`;
    try {
      await updateDoc(doc(db, 'services', service.id), { 
        liturgy: updatedLiturgy,
        setlist: songIds,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
    }
  };

  if (playlistOnly) {
    return (
      <div className="mt-8 space-y-4 pt-8 border-t border-white/10">
          <div className="flex flex-col items-center justify-center gap-2 mb-4">
             <h4 className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-8 sm:12 h-[1px] bg-brand/50"></span> 
                Playlist do Culto
                <span className="w-8 sm:12 h-[1px] bg-brand/50"></span>
             </h4>
          </div>

          <div className="bg-brand/10 p-5 rounded-2xl border border-brand/20 shadow-lg shadow-brand/5 max-w-2xl mx-auto w-full">
             <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-brand/20 flex items-center justify-center text-brand shrink-0 shadow-inner">
                  <Youtube size={24} />
                </div>
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-[10px] font-black text-text-main uppercase tracking-[0.15em] pl-1 flex items-center gap-2 opacity-80">
                     Link da Playlist no YouTube
                  </label>
                  <Input 
                    placeholder="https://youtube.com/playlist?list=..." 
                    value={service.playlistUrl || ''} 
                    onChange={e => handlePlaylistUpdate(e.target.value)}
                    className="bg-black/20 dark:bg-white/5 border border-white/10 text-text-main h-11 text-xs py-0 w-full focus:ring-brand/30 transition-all rounded-xl"
                  />
                </div>
                {service.playlistUrl && (
                  <div className="shrink-0 self-end pb-0.5">
                    <Button 
                      onClick={() => { window.open(service.playlistUrl, '_blank'); }}
                      className="h-11 px-4 bg-white hover:bg-white/90 text-[#E60000] border border-[#E60000]/20 font-bold rounded-xl shadow-lg shadow-red-500/5 flex items-center gap-2"
                    >
                      <Youtube size={16} fill="#E60000" />
                      Playlist do Culto
                    </Button>
                  </div>
                )}
             </div>
          </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4 pt-8 border-t border-black/10 dark:border-white/10">
        <div className="flex flex-col items-center justify-center gap-4 mb-6">
           <h4 className="text-[10px] sm:text-[11px] font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-8 sm:12 h-[1px] bg-brand/50"></span> 
              Liturgia e Louvor
              <span className="w-8 sm:12 h-[1px] bg-brand/50"></span>
           </h4>
           {isAdmin && (
             <div className="flex flex-wrap items-center justify-center gap-3">
               {isEditing ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleSaveLiturgy} 
                    disabled={saveStatus === "saving"}
                    className={cn(
                      "text-[10px] sm:text-[11px] font-black uppercase tracking-widest flex items-center gap-2 px-5 py-2 rounded-full border shadow-lg active:scale-95 cursor-pointer transition-all",
                      saveStatus === "saving" && "bg-amber-600 text-white border-amber-600 cursor-wait",
                      saveStatus === "success" && "bg-emerald-600 text-white border-emerald-600",
                      saveStatus === "error" && "bg-red-600 text-white border-red-600",
                      saveStatus === "idle" && "text-white bg-emerald-600 hover:bg-emerald-700 border-emerald-600/30 shadow-emerald-600/20"
                    )}
                  >
                    {saveStatus === "saving" ? (
                      <>
                        <Loader2 size={14} className="animate-spin"/>
                        Salvando...
                      </>
                    ) : saveStatus === "success" ? (
                      <>
                        <Check size={14} strokeWidth={3}/>
                        Salvo no Firebase!
                      </>
                    ) : (
                      <>
                        <Save size={14}/>
                        Salvar Liturgia
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)} 
                    className="text-[10px] sm:text-[11px] font-black text-text-muted hover:text-text-main transition-all uppercase tracking-widest flex items-center gap-1.5 bg-black/10 hover:bg-black/20 px-3.5 py-2 rounded-full border border-border shadow cursor-pointer"
                    title="Fechar modo de edição"
                  >
                    <X size={14}/>
                    Sair
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="text-[10px] sm:text-[11px] font-black text-brand dark:text-white transition-all uppercase tracking-widest flex items-center gap-2 bg-brand/10 dark:bg-brand/30 hover:bg-brand/20 dark:hover:bg-brand/40 px-5 py-2 rounded-full border border-brand/20 dark:border-brand/40 shadow-lg shadow-brand/10 active:scale-95 cursor-pointer"
                >
                  <Plus size={14}/>
                  Configurar Liturgia
                </button>
              )}
               <button 
                 onClick={() => setIsCloning(!isCloning)} 
                 className="text-[10px] sm:text-[11px] font-black text-text-main transition-all uppercase tracking-widest flex items-center gap-2 bg-black/10 hover:bg-black/20 px-5 py-2 rounded-full border border-border shadow-lg active:scale-95 cursor-pointer"
               >
                 <Copy size={14}/>
                 Clonar Anterior
               </button>
               {(service.liturgy || []).length > 0 && (
                 <>
                   <button 
                     onClick={handleManualNotifyLiturgy} 
                     disabled={isSaving}
                     className="text-[10px] sm:text-[11px] font-black text-emerald-700 dark:text-white transition-all uppercase tracking-widest flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-600/30 hover:bg-emerald-500/20 dark:hover:bg-emerald-600/50 px-5 py-2 rounded-full border border-emerald-500/20 dark:border-emerald-500/40 shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-50 cursor-pointer"
                   >
                     <Bell size={14}/>
                     Notificar Membros (Push & In-App)
                   </button>
                   <button 
                     onClick={handleShareLiturgyWhatsApp} 
                     disabled={isSaving}
                     className="text-[10px] sm:text-[11px] font-black text-white transition-all uppercase tracking-widest flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-5 py-2 rounded-full border border-emerald-600/30 shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
                   >
                     <Share2 size={14}/>
                     Compartilhar no WhatsApp
                   </button>
                   <button 
                     onClick={() => {
                       if (confirmDeleteLiturgy) {
                         handleClearLiturgy();
                       } else {
                         setConfirmDeleteLiturgy(true);
                       }
                     }}
                     disabled={isSaving}
                     className={`text-[10px] sm:text-[11px] font-black transition-all uppercase tracking-widest flex items-center gap-2 px-5 py-2 rounded-full border active:scale-95 disabled:opacity-50 cursor-pointer ${
                       confirmDeleteLiturgy 
                         ? 'bg-red-600 text-white border-red-600 animate-pulse' 
                         : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                     }`}
                   >
                     <Trash2 size={14}/>
                     {confirmDeleteLiturgy ? 'Confirmar Excluir?' : 'Excluir Liturgia'}
                   </button>
                 </>
               )}
             </div>
           )}

           {/* Agrupar por Momentos Toggle */}
           {(service.liturgy || []).length > 0 && (
             <div className="flex items-center justify-center gap-3 mt-2 bg-black/5 dark:bg-white/5 py-2 px-5 rounded-full border border-black/5 dark:border-white/5 shadow-sm">
               <span className="text-[10px] font-black uppercase tracking-widest text-[#E60000]/80 dark:text-zinc-400">Listar Sequencial</span>
               <button
                 type="button"
                 onClick={() => setIsGroupedByMoments(!isGroupedByMoments)}
                 className={cn(
                   "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                   isGroupedByMoments ? "bg-brand" : "bg-zinc-400 dark:bg-zinc-600"
                 )}
               >
                 <span
                   className={cn(
                     "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                     isGroupedByMoments ? "translate-x-5" : "translate-x-0"
                   )}
                 />
               </button>
               <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", isGroupedByMoments ? "text-brand" : "text-zinc-500")}>Agrupar por Momentos 🧩</span>
             </div>
           )}
        </div>

       {isCloning && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }}
            className="mb-8 bg-brand/5 border border-brand/20 rounded-2xl p-6 overflow-hidden max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-between mb-4 px-1">
               <div>
                 <h4 className="text-[11px] font-black text-brand uppercase tracking-widest leading-none">Clonar Liturgia</h4>
                 <p className="text-[10px] text-text-muted font-bold mt-1 uppercase tracking-tight">Escolha um culto para copiar os itens</p>
               </div>
               <button onClick={() => setIsCloning(false)} className="text-brand hover:scale-110 transition-transform p-2 cursor-pointer"><X size={20}/></button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {pastServices.length > 0 ? (
                pastServices.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleCloneLiturgy(s.id)}
                    className="bg-black/5 dark:bg-black/10 border border-black/10 dark:border-white/5 hover:bg-brand hover:border-brand px-5 py-4 rounded-2xl transition-all text-left min-w-[220px] group cursor-pointer"
                  >
                    <span className="text-[10px] font-black text-brand group-hover:text-white uppercase tracking-widest block mb-1.5 opacity-80">
                      {new Date(s.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                    </span>
                    <p className="text-sm font-black text-text-main group-hover:text-white leading-tight line-clamp-1 uppercase tracking-tight">{s.title}</p>
                    <div className="flex items-center gap-2 mt-2 opacity-60">
                       <BookOpen size={10} className="text-text-main group-hover:text-white"/>
                       <p className="text-[10px] text-text-main group-hover:text-white font-black uppercase tracking-widest">{s.liturgy.length} itens</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="w-full text-center py-6">
                  <p className="text-xs text-brand/60 font-bold italic">Nenhum culto anterior com liturgia encontrado no sistema.</p>
                </div>
              )}
            </div>
          </motion.div>
       )}

        {/* Visualização limpa da Liturgia sem campo redundante de playlist */}

       {isEditing && (
          <div className="space-y-4 mb-6 animate-in slide-in-from-top duration-300">
             <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl space-y-4 border border-border mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                   <div className="sm:col-span-3 space-y-1.5">
                      <label className="text-[9px] font-black text-text-main uppercase pl-1 opacity-70">Atividade do Culto</label>
                      <select 
                        className="w-full bg-black/20 border border-border rounded-lg text-text-main text-xs p-2.5 h-10 outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand cursor-pointer"
                        value={newItem.type}
                        onChange={e => setNewItem({...newItem, type: e.target.value})}
                      >
                        <option value="reading">📖 Leitura Bíblica</option>
                        <option value="song">🎵 Música/Louvor</option>
                        <option value="speech">🎤 Palavra</option>
                        <option value="prayer">🙏 Oração Pastoral</option>
                        <option value="announcements">📢 Avisos</option>
                        <option value="offering">💸 Ofertas</option>
                        <option value="other">✨ Outro</option>
                      </select>
                   </div>
                   <div className={cn(newItem.type === 'song' ? "sm:col-span-3" : "sm:col-span-4", "space-y-1.5")}>
                      <label className="text-[9px] font-black text-text-main uppercase pl-1 opacity-70">Título</label>
                      {newItem.type === 'song' ? (
                        <div className="relative">
                           <input
                             list="song-list-new"
                             placeholder="Pesquisar música..."
                             value={newItem.title}
                             onChange={e => {
                               const selectedSong = songs.find(s => s.title === e.target.value);
                               setNewItem({
                                 ...newItem, 
                                 title: e.target.value,
                                 songId: selectedSong ? selectedSong.id : ''
                               });
                             }}
                             className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand bg-black/25 text-text-main h-10 text-xs py-0 transition-all placeholder:text-text-muted/50"
                           />
                           <datalist id="song-list-new">
                             {songs.map(s => <option key={s.id} value={s.title}>{s.artist}</option>)}
                           </datalist>
                        </div>
                      ) : (
                        <Input 
                          placeholder="Ex: Salmo 23" 
                          value={newItem.title} 
                          onChange={e => setNewItem({...newItem, title: e.target.value, songId: ''})}
                          className="bg-black/5 dark:bg-white/5 border border-border text-text-main h-10 text-xs py-0"
                        />
                      )}
                   </div>

                   {newItem.type === 'song' && (
                     <div className="sm:col-span-12">
                       <MultiVocalistSelector
                         value={newItem.vocalist || ''}
                         onChange={(val) => setNewItem({ ...newItem, vocalist: val })}
                         vocalists={vocalists}
                         members={members}
                       />
                     </div>
                   )}

                   <div className={cn(newItem.type === 'song' ? "sm:col-span-2" : "sm:col-span-3", "space-y-1.5")}>
                      <label className="text-[9px] font-black text-text-main uppercase pl-1 opacity-70">
                        {newItem.type === 'song' ? 'CATEGORIA DA MÚSICA' : 'CATEGORIA'}
                      </label>
                      {newItem.type === 'song' ? (
                        <div className="space-y-2">
                          <select 
                            className="w-full bg-black/20 border border-border rounded-lg text-text-main text-xs p-2.5 h-10 outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand cursor-pointer"
                            value={showCustomCategoryInput ? 'custom' : (newItem.content || '')}
                            onChange={e => {
                              if (e.target.value === 'custom') {
                                setShowCustomCategoryInput(true);
                                setNewItem({ ...newItem, content: '' });
                              } else {
                                setShowCustomCategoryInput(false);
                                setNewItem({ ...newItem, content: e.target.value });
                              }
                            }}
                          >
                            <option value="">Opcional</option>
                            {LITURGY_SONG_CATEGORIES.map((opt, oIdx) => (
                              <option key={opt} value={opt === 'PERSONALIZAR' ? 'custom' : opt}>
                                {`${oIdx + 1} - ${opt}`}
                              </option>
                            ))}
                          </select>
                          {showCustomCategoryInput && (
                            <Input 
                              placeholder="Digite a categoria personalizada..."
                              value={newItem.content}
                              onChange={e => setNewItem({ ...newItem, content: e.target.value })}
                              className="bg-black/5 dark:bg-white/5 border border-border text-text-main h-10 text-xs py-0"
                            />
                          )}
                        </div>
                      ) : (
                        <select 
                          className="w-full bg-black/20 border border-border rounded-lg text-text-main text-xs p-2.5 h-10 outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand cursor-pointer"
                          value={newItem.content}
                          onChange={e => setNewItem({...newItem, content: e.target.value})}
                        >
                          <option value="">Opcional</option>
                          {LITURGY_NON_SONG_CATEGORIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}
                   </div>
                   <div className="sm:col-span-2">
                      <Button 
                        onClick={handleAddItem} 
                        disabled={addItemStatus === "saving" || isSaving || !newItem.title}
                        className={cn(
                          "w-full h-10 text-[10px] uppercase font-black tracking-widest transition-all",
                          addItemStatus === "saving" && "bg-amber-600 hover:bg-amber-600 text-white cursor-wait",
                          addItemStatus === "success" && "bg-emerald-600 hover:bg-emerald-600 text-white",
                          addItemStatus === "error" && "bg-red-600 hover:bg-red-600 text-white",
                          addItemStatus === "idle" && "bg-brand hover:brightness-110 text-white"
                        )}
                      >
                        {addItemStatus === "saving" ? (
                          <span className="flex items-center gap-1.5 justify-center">
                            <Loader2 size={14} className="animate-spin" />
                            Salvando...
                          </span>
                        ) : addItemStatus === "success" ? (
                          <span className="flex items-center gap-1.5 justify-center">
                            <Check size={14} strokeWidth={3} />
                            Adicionado!
                          </span>
                        ) : addItemStatus === "error" ? (
                          <span className="flex items-center gap-1.5 justify-center">
                            <AlertTriangle size={14} />
                            Erro ao Salvar
                          </span>
                        ) : (
                          "Adicionar"
                        )}
                      </Button>
                   </div>

                    {/* Momento do Culto */}
                    <div className="sm:col-span-12 space-y-1.5 pt-3 border-t border-border/20">
                       <label className="text-[9px] font-black text-text-main/80 uppercase pl-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                          {newItem.type === 'song' ? 'Ordem / Momento da Música' : 'Agrupar em qual Momento?'}
                       </label>
                       <div className="flex flex-col sm:flex-row gap-2">
                          <select 
                             className="w-full sm:w-1/2 bg-black/20 border border-border rounded-lg text-text-main text-xs p-2.5 h-10 outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand cursor-pointer"
                             value={showCustomMomentInput ? 'custom' : (newItem.moment || '')}
                             onChange={e => {
                                if (e.target.value === 'custom') {
                                   setShowCustomMomentInput(true);
                                   setNewItem(prev => ({ ...prev, moment: '' }));
                                } else {
                                   setShowCustomMomentInput(false);
                                   setNewItem(prev => ({ ...prev, moment: e.target.value }));
                                }
                             }}
                          >
                             <option value="">Nenhum (Sem Momento)</option>
                             {newItem.type === 'song' ? (
                               <>
                                 <optgroup label="Ordem das Músicas">
                                   {LITURGY_SONG_MOMENTS.map(moment => (
                                     <option key={moment} value={moment}>🎵 {moment}</option>
                                   ))}
                                 </optgroup>
                                 <optgroup label="Momentos Gerais">
                                   {LITURGY_GENERAL_MOMENTS.map(moment => (
                                     <option key={moment} value={moment}>{moment}</option>
                                   ))}
                                 </optgroup>
                               </>
                             ) : (
                               LITURGY_GENERAL_MOMENTS.map(moment => (
                                 <option key={moment} value={moment}>{moment}</option>
                               ))
                             )}
                             <option value="custom">⚙️ Personalizado (Digitar)...</option>
                          </select>
                          {showCustomMomentInput && (
                             <Input 
                                placeholder="Digite um nome para o momento personalizado (Ex: Doxologia)..."
                                value={newItem.moment}
                                onChange={e => setNewItem(prev => ({ ...prev, moment: e.target.value }))}
                                className="flex-1 bg-black/5 dark:bg-white/5 border border-border text-text-main h-10 text-xs py-0"
                             />
                          )}
                          <div className="w-full sm:w-1/4 shrink-0 flex items-center gap-2 bg-black/25 border border-border rounded-lg px-3 h-10 group focus-within:ring-2 focus-within:ring-brand/35 focus-within:border-brand">
                            <Clock size={13} className="text-brand shrink-0" />
                            <input 
                              type="number"
                              min="0"
                              placeholder="Tempo (min)..."
                              className="w-full bg-transparent border-none text-text-main text-xs p-0 outline-none focus:ring-0 focus:outline-none"
                              value={newItem.duration || ''}
                              onChange={e => setNewItem(prev => ({ ...prev, duration: e.target.value }))}
                            />
                          </div>
                       </div>
                    </div>

                    {/* Optional details (verses or texts) for the liturgy item */}
                    <div className="sm:col-span-12 space-y-1.5 pt-3">
                       <div className="flex items-center justify-between pl-1">
                          <label className="text-[9px] font-black text-text-main/80 uppercase">
                            Conteúdo / Detalhes (Opcional)
                          </label>
                          {newItem.type !== 'song' && (
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-text-main/60 uppercase">
                              <span>Versão do Texto:</span>
                              <select
                                value={newItem.bibleVersion || 'NAA'}
                                onChange={e => setNewItem(prev => ({ ...prev, bibleVersion: e.target.value }))}
                                className="bg-black/20 border border-border rounded px-1.5 py-0.5 text-[9px] font-black uppercase text-text-main outline-none focus:ring-1 focus:ring-brand cursor-pointer"
                              >
                                <option value="NAA">NAA 2017 (Nova Almeida Atualizada)</option>
                                <option value="ARA">ARA (Revista & Atu.)</option>
                                <option value="ARC">ARC (Revista & Corr.)</option>
                                <option value="NVI">NVI (Internacional)</option>
                                <option value="NTLH">NTLH (Linguagem Hoje)</option>
                                <option value="ACF">ACF (Almeida Fiel)</option>
                              </select>
                            </div>
                          )}
                       </div>
                       <textarea 
                         placeholder="Insira o texto bíblico, versículo ou anotações..."
                         value={newItem.details}
                         onChange={e => setNewItem(prev => ({ ...prev, details: e.target.value }))}
                         className="w-full min-h-[85px] bg-black/20 border border-border text-xs text-text-main p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand resize-y leading-relaxed"
                       />
                    </div>

                    {/* Bible search component trigger */}
                    {newItem.type !== 'song' && (
                      <div className="pt-2 border-t border-white/5 col-span-1 sm:col-span-12 space-y-3">
                        <button
                          type="button"
                          onClick={() => setShowBibleSearch(!showBibleSearch)}
                          className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-2 bg-brand/10 hover:bg-brand/20 border border-brand/20 px-4 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center"
                        >
                          <BookOpen size={13} />
                          {showBibleSearch ? 'Fechar Assistente Bíblico' : 'Abrir Assistente Bíblico'}
                        </button>
                        
                        {showBibleSearch && (
                          <div className="mt-2">
                            <BibleSearch 
                              onInsert={({ title, text, version }) => {
                                setNewItem(prev => ({
                                  ...prev,
                                  title: title || prev.title,
                                  details: text || prev.details,
                                  bibleVersion: version || prev.bibleVersion || 'NAA'
                                }));
                              }}
                              onInsertDirect={async ({ title, text, version }) => {
                                setIsSaving(true);
                                try {
                                  const liturgy = service.liturgy || [];
                                  const newLiturgyItem = {
                                    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
                                    type: newItem.type || 'reading',
                                    title,
                                    content: newItem.content || 'CHAMADO À ADORAÇÃO',
                                    details: text,
                                    songId: '',
                                    moment: newItem.moment || '',
                                    bibleVersion: version
                                  };
                                  const updatedLiturgy = [...liturgy, newLiturgyItem];
                                  await updateDoc(doc(db, 'services', service.id), { liturgy: updatedLiturgy });
                                  setNewItem({ type: 'reading', title: '', content: '', details: '', songId: '', moment: '', bibleVersion: 'NAA', vocalist: '', duration: '' });
                                  setShowBibleSearch(false);
                                } catch (error) {
                                  console.error("Error inserting directly:", error);
                                } finally {
                                  setIsSaving(false);
                                }
                              }}
                              onClose={() => setShowBibleSearch(false)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                </div>
             </div>
          </div>
       )}

       <div className="space-y-4 sm:space-y-5">
          {(service.liturgy || []).length > 0 ? (
            (() => {
              const renderItem = (item: any, idx: number) => {
                const isItemEditing = editingId === item.id;
                
                if (isItemEditing) {
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={`${item.id}-${idx}`} 
                      className="bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-brand/30 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                          <div className="sm:col-span-3 space-y-1.5">
                            <label className="text-[9px] font-black text-text-main uppercase pl-1 opacity-70">Atividade do Culto</label>
                            <select 
                              className="w-full bg-black/20 border border-border rounded-lg text-text-main text-xs p-2.5 h-10 outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand cursor-pointer"
                              value={editItem.type}
                              onChange={e => setEditItem({...editItem, type: e.target.value})}
                            >
                              <option value="reading">📖 Leitura</option>
                              <option value="song">🎵 Música</option>
                              <option value="speech">🎤 Palavra</option>
                              <option value="prayer">🙏 Oração</option>
                              <option value="announcements">📢 Avisos</option>
                              <option value="offering">💸 Ofertas</option>
                              <option value="other">✨ Outro</option>
                            </select>
                          </div>
                          <div className={cn(editItem.type === 'song' ? "sm:col-span-3" : "sm:col-span-4", "space-y-1.5")}>
                            {editItem.type === 'song' ? (
                              <div className="relative">
                                 <input
                                   list="song-list-edit"
                                   placeholder="Selecione uma música..."
                                   value={editItem.title}
                                   onChange={e => {
                                     const selectedSong = songs.find(s => s.title === e.target.value);
                                     setEditItem({
                                       ...editItem, 
                                       title: e.target.value,
                                       songId: selectedSong ? selectedSong.id : ''
                                     });
                                   }}
                                   className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand bg-black/25 text-text-main h-10 text-xs py-0 transition-all placeholder:text-text-muted/50"
                                 />
                                 <datalist id="song-list-edit">
                                   {songs.map(s => <option key={s.id} value={s.title}>{s.artist}</option>)}
                                 </datalist>
                              </div>
                            ) : (
                              <Input 
                                value={editItem.title} 
                                onChange={e => setEditItem({...editItem, title: e.target.value, songId: ''})}
                                className="bg-black/5 dark:bg-white/5 border border-border text-text-main h-10 text-xs py-0"
                              />
                            )}
                          </div>

                          {editItem.type === 'song' && (
                            <div className="sm:col-span-12">
                              <MultiVocalistSelector
                                value={editItem.vocalist || ''}
                                onChange={(val) => setEditItem({ ...editItem, vocalist: val })}
                                vocalists={vocalists}
                                members={members}
                              />
                            </div>
                          )}

                          <div className={cn(editItem.type === 'song' ? "sm:col-span-2" : "sm:col-span-3", "space-y-1.5")}>
                            <label className="text-[9px] font-black text-text-main uppercase pl-1 opacity-70">
                              {editItem.type === 'song' ? 'CATEGORIA DA MÚSICA' : 'CATEGORIA'}
                            </label>
                            {editItem.type === 'song' ? (
                              <div className="space-y-2">
                                <select 
                                  className="w-full bg-black/20 border border-border rounded-lg text-text-main text-xs p-2.5 h-10 outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand appearance-none cursor-pointer"
                                  value={showCustomCategoryInputEdit ? 'custom' : (editItem.content || '')}
                                  onChange={e => {
                                    if (e.target.value === 'custom') {
                                      setShowCustomCategoryInputEdit(true);
                                      setEditItem({ ...editItem, content: '' });
                                    } else {
                                      setShowCustomCategoryInputEdit(false);
                                      setEditItem({ ...editItem, content: e.target.value });
                                    }
                                  }}
                                >
                                  <option value="">Opcional</option>
                                  {LITURGY_SONG_CATEGORIES.map((opt, oIdx) => (
                                    <option key={opt} value={opt === 'PERSONALIZAR' ? 'custom' : opt}>
                                      {`${oIdx + 1} - ${opt}`}
                                    </option>
                                  ))}
                                  {editItem.content && !LITURGY_SONG_CATEGORIES.includes(editItem.content) && !showCustomCategoryInputEdit && (
                                    <option value={editItem.content}>{editItem.content}</option>
                                  )}
                                </select>
                                {showCustomCategoryInputEdit && (
                                  <Input 
                                    placeholder="Digite a categoria personalizada..."
                                    value={editItem.content}
                                    onChange={e => setEditItem({ ...editItem, content: e.target.value })}
                                    className="bg-black/5 dark:bg-white/5 border border-border text-text-main h-10 text-xs py-0"
                                  />
                                )}
                              </div>
                            ) : (
                              <select 
                                className="w-full bg-black/20 border border-border rounded-lg text-text-main text-xs p-2.5 h-10 outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand appearance-none cursor-pointer"
                                value={editItem.content}
                                onChange={e => setEditItem({...editItem, content: e.target.value})}
                              >
                                <option value="">Opcional</option>
                                {LITURGY_NON_SONG_CATEGORIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                {editItem.content && !LITURGY_NON_SONG_CATEGORIES.includes(editItem.content) && (
                                  <option value={editItem.content}>{editItem.content}</option>
                                )}
                              </select>
                            )}
                          </div>
                          <div className="sm:col-span-2 flex gap-2">
                            <Button 
                              onClick={() => handleUpdateItem(item.id, idx)} 
                              disabled={itemEditStatus === "saving" || isSaving}
                              className={cn(
                                "flex-1 h-10 text-[10px] uppercase font-black tracking-widest transition-all",
                                itemEditStatus === "saving" && "bg-amber-600 hover:bg-amber-600 text-white cursor-wait",
                                itemEditStatus === "success" && "bg-emerald-600 hover:bg-emerald-600 text-white",
                                itemEditStatus === "error" && "bg-red-600 hover:bg-red-600 text-white",
                                itemEditStatus === "idle" && "bg-brand hover:brightness-110 text-white"
                              )}
                            >
                              {itemEditStatus === "saving" ? (
                                <span className="flex items-center gap-1.5 justify-center">
                                  <Loader2 size={14} className="animate-spin" />
                                  Salvando...
                                </span>
                              ) : itemEditStatus === "success" ? (
                                <span className="flex items-center gap-1.5 justify-center">
                                  <Check size={14} strokeWidth={3} />
                                  Salvo!
                                </span>
                              ) : itemEditStatus === "error" ? (
                                <span className="flex items-center gap-1.5 justify-center">
                                  <AlertTriangle size={14} />
                                  Erro!
                                </span>
                              ) : (
                                "Salvar"
                              )}
                            </Button>
                            <Button onClick={() => setEditingId(null)} variant="secondary" className="h-10 px-3 bg-black/5 border border-border text-text-main"><X size={14}/></Button>
                          </div>
                        </div>

                        {/* Momento do Culto */}
                        <div className="space-y-1.5 pt-3 border-t border-white/5">
                           <label className="text-[9px] font-black text-text-main/80 uppercase pl-1 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                              {editItem.type === 'song' ? 'Ordem / Momento da Música' : 'Momento do Culto (Agrupador)'}
                           </label>
                           <div className="flex flex-col sm:flex-row gap-2">
                              <select 
                                 className="w-full sm:w-1/2 bg-black/20 border border-border rounded-lg text-text-main text-xs p-2.5 h-10 outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand cursor-pointer"
                                 value={showCustomMomentInputEdit ? 'custom' : (editItem.moment || '')}
                                 onChange={e => {
                                    if (e.target.value === 'custom') {
                                       setShowCustomMomentInputEdit(true);
                                       setEditItem(prev => ({ ...prev, moment: '' }));
                                    } else {
                                       setShowCustomMomentInputEdit(false);
                                       setEditItem(prev => ({ ...prev, moment: e.target.value }));
                                    }
                                 }}
                              >
                                 <option value="">Nenhum (Sem Momento)</option>
                                 {editItem.type === 'song' ? (
                                   <>
                                     <optgroup label="Ordem das Músicas">
                                       {LITURGY_SONG_MOMENTS.map(moment => (
                                         <option key={moment} value={moment}>🎵 {moment}</option>
                                       ))}
                                     </optgroup>
                                     <optgroup label="Momentos Gerais">
                                       {LITURGY_GENERAL_MOMENTS.map(moment => (
                                         <option key={moment} value={moment}>{moment}</option>
                                       ))}
                                     </optgroup>
                                   </>
                                 ) : (
                                   LITURGY_GENERAL_MOMENTS.map(moment => (
                                     <option key={moment} value={moment}>{moment}</option>
                                   ))
                                 )}
                                 <option value="custom">⚙️ Personalizado (Digitar)...</option>
                              </select>
                              {showCustomMomentInputEdit && (
                                 <Input 
                                    placeholder="Digite um nome para o momento personalizado (Ex: Doxologia)..."
                                    value={editItem.moment || ''}
                                    onChange={e => setEditItem(prev => ({ ...prev, moment: e.target.value }))}
                                    className="flex-1 bg-black/5 dark:bg-white/5 border border-border text-text-main h-10 text-xs py-0"
                                 />
                              )}
                              <div className="w-full sm:w-1/4 shrink-0 flex items-center gap-2 bg-black/25 border border-border rounded-lg px-3 h-10 group focus-within:ring-2 focus-within:ring-brand/35 focus-within:border-brand">
                                <Clock size={13} className="text-brand shrink-0" />
                                <input 
                                  type="number"
                                  min="0"
                                  placeholder="Tempo (min)..."
                                  className="w-full bg-transparent border-none text-text-main text-xs p-0 outline-none focus:ring-0 focus:outline-none"
                                  value={editItem.duration || ''}
                                  onChange={e => setEditItem(prev => ({ ...prev, duration: e.target.value }))}
                                />
                              </div>
                           </div>
                        </div>

                        {/* Optional edit details (verses or texts) */}
                        <div className="space-y-1.5 pt-3 border-t border-white/5">
                           <div className="flex items-center justify-between pl-1">
                              <label className="text-[9px] font-black text-text-main/80 uppercase">
                                Conteúdo / Detalhes (Opcional)
                              </label>
                              {editItem.type !== 'song' && (
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-text-main/60 uppercase">
                                  <span>Versão do Texto:</span>
                                  <select
                                    value={editItem.bibleVersion || 'NAA'}
                                    onChange={e => setEditItem(prev => ({ ...prev, bibleVersion: e.target.value }))}
                                    className="bg-black/20 border border-border rounded px-1.5 py-0.5 text-[9px] font-black uppercase text-text-main outline-none focus:ring-1 focus:ring-brand cursor-pointer"
                                  >
                                    <option value="NAA">NAA 2017 (Nova Almeida Atualizada)</option>
                                    <option value="ARA">ARA (Revista & Atu.)</option>
                                    <option value="ARC">ARC (Revista & Corr.)</option>
                                    <option value="NVI">NVI (Internacional)</option>
                                    <option value="NTLH">NTLH (Linguagem Hoje)</option>
                                    <option value="ACF">ACF (Almeida Fiel)</option>
                                  </select>
                                </div>
                              )}
                           </div>
                           <textarea 
                             placeholder="Insira o texto bíblico, versículo ou anotações..."
                             value={editItem.details || ''}
                             onChange={e => setEditItem(prev => ({ ...prev, details: e.target.value }))}
                             className="w-full min-h-[85px] bg-black/20 border border-border text-xs text-text-main p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand resize-y leading-relaxed"
                           />
                        </div>

                        {/* Bible search component trigger */}
                        {editItem.type !== 'song' && (
                          <div className="pt-2 border-t border-white/5 space-y-3">
                            <button
                              type="button"
                              onClick={() => setShowEditBibleSearch(!showEditBibleSearch)}
                              className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-2 bg-brand/10 hover:bg-brand/20 border border-brand/20 px-4 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center"
                            >
                              <BookOpen size={13} />
                              {showEditBibleSearch ? 'Fechar Assistente Bíblico' : 'Abrir Assistente Bíblico'}
                            </button>
                            
                            {showEditBibleSearch && (
                              <div className="mt-2">
                                <BibleSearch 
                                  onInsert={({ title, text, version }) => {
                                    setEditItem(prev => ({
                                      ...prev,
                                      title: title || prev.title,
                                      details: text || prev.details,
                                      bibleVersion: version || prev.bibleVersion || 'NAA'
                                    }));
                                  }}
                                  onInsertDirect={async ({ title, text, version }) => {
                                    setIsSaving(true);
                                    try {
                                      const liturgy = service.liturgy || [];
                                      const updatedLiturgy = liturgy.map((li: any) => {
                                        if (li.id === item.id) {
                                          return {
                                            ...li,
                                            title,
                                            details: text,
                                            bibleVersion: version
                                          };
                                        }
                                        return li;
                                      });
                                      await updateDoc(doc(db, 'services', service.id), { liturgy: updatedLiturgy });
                                      setEditingId(null);
                                      setShowEditBibleSearch(false);
                                    } catch (error) {
                                      console.error("Error updating directly:", error);
                                    } finally {
                                      setIsSaving(false);
                                    }
                                  }}
                                  onClose={() => setShowEditBibleSearch(false)}
                                />
                              </div>
                            )}
                          </div>
                        )}
                    </motion.div>
                  );
                }

                return (
                  <LiturgyItemCard
                    key={`${item.id}-${idx}`}
                    item={item}
                    idx={idx}
                    isAdmin={isAdmin}
                    onOpenSong={onOpenSong}
                    startEditing={startEditing}
                    handleMove={handleMove}
                    handleRemoveItem={handleRemoveItem}
                    serviceLiturgyLength={normalizedLiturgy.length}
                    dragControlsEnabled={false}
                    calculatedTime={timelineTimes[item.id]}
                  />
                );
              };

              if (isGroupedByMoments) {
                const groups = getMomentGroups(normalizedLiturgy);
                return (
                  <div className="space-y-6">
                    {groups.map((group, gIdx) => {
                      const style = getMomentStyles(group.moment);
                      return (
                        <div key={`moment-group-${group.moment}-${gIdx}`} className={cn("rounded-2xl border p-4 sm:p-5 transition-all space-y-3", style.bg, style.border)}>
                          <div className="flex items-center justify-between mb-2 pb-2 border-b border-black/10 dark:border-white/10 gap-2">
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", style.dot)} />
                              <h4 className={cn("text-xs font-black uppercase tracking-widest", style.text)}>
                                {style.label}
                              </h4>
                            </div>
                            {isAdmin && (
                              <div className="flex items-center gap-1 sm:gap-1.5 no-export shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleMoveMomentGroup(gIdx, 'up'); }}
                                  disabled={gIdx === 0}
                                  className={cn(
                                    "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/15 text-text-main dark:text-zinc-300 hover:bg-black/20 dark:hover:bg-white/10 active:scale-95 transition-all disabled:opacity-20",
                                    gIdx === 0 && "cursor-not-allowed"
                                  )}
                                  title="Subir momento completo"
                                >
                                  <ChevronUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleMoveMomentGroup(gIdx, 'down'); }}
                                  disabled={gIdx === groups.length - 1}
                                  className={cn(
                                    "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/15 text-text-main dark:text-zinc-300 hover:bg-black/20 dark:hover:bg-white/10 active:scale-95 transition-all disabled:opacity-20",
                                    gIdx === groups.length - 1 && "cursor-not-allowed"
                                  )}
                                  title="Descer momento completo"
                                >
                                  <ChevronDown size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                          {isAdmin ? (
                            <Reorder.Group
                              values={group.items.map(gi => gi.item)}
                              onReorder={(newItemsOrder) => {
                                const updatedLiturgy = [...normalizedLiturgy];
                                const originalIndices = group.items.map(gi => gi.originalIndex);
                                originalIndices.forEach((origIdx, oIdx) => {
                                  updatedLiturgy[origIdx] = newItemsOrder[oIdx];
                                });
                                handleReorder(updatedLiturgy);
                              }}
                              axis="y"
                              className="space-y-3"
                            >
                              {group.items.map(({ item, originalIndex }) => {
                                const isItemEditing = editingId === item.id;
                                if (isItemEditing) {
                                  return (
                                    <Reorder.Item
                                      key={item.id}
                                      value={item}
                                      dragListener={false}
                                      className="w-full"
                                    >
                                      {renderItem(item, originalIndex)}
                                    </Reorder.Item>
                                  );
                                }
                                return (
                                  <LiturgyItemCard
                                    key={item.id}
                                    item={item}
                                    idx={originalIndex}
                                    isAdmin={isAdmin}
                                    onOpenSong={onOpenSong}
                                    startEditing={startEditing}
                                    handleMove={handleMove}
                                    handleRemoveItem={handleRemoveItem}
                                    serviceLiturgyLength={normalizedLiturgy.length}
                                    dragControlsEnabled={isAdmin}
                                    calculatedTime={timelineTimes[item.id]}
                                  />
                                );
                              })}
                            </Reorder.Group>
                          ) : (
                            <div className="space-y-3">
                              {group.items.map(({ item, originalIndex }) => (
                                <LiturgyItemCard
                                  key={item.id}
                                  item={item}
                                  idx={originalIndex}
                                  isAdmin={false}
                                  onOpenSong={onOpenSong}
                                  startEditing={startEditing}
                                  handleMove={handleMove}
                                  handleRemoveItem={handleRemoveItem}
                                  serviceLiturgyLength={normalizedLiturgy.length}
                                  dragControlsEnabled={false}
                                  calculatedTime={timelineTimes[item.id]}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }

              return isAdmin ? (
                <Reorder.Group 
                  values={normalizedLiturgy} 
                  onReorder={handleReorder} 
                  axis="y" 
                  className="space-y-4"
                >
                  {normalizedLiturgy.map((item: any, idx: number) => {
                    const isItemEditing = editingId === item.id;
                    if (isItemEditing) {
                      return (
                        <Reorder.Item
                          key={item.id}
                          value={item}
                          dragListener={false}
                          className="w-full"
                        >
                          {renderItem(item, idx)}
                        </Reorder.Item>
                      );
                    }
                    return (
                      <LiturgyItemCard
                        key={item.id}
                        item={item}
                        idx={idx}
                        isAdmin={isAdmin}
                        onOpenSong={onOpenSong}
                        startEditing={startEditing}
                        handleMove={handleMove}
                        handleRemoveItem={handleRemoveItem}
                        serviceLiturgyLength={normalizedLiturgy.length}
                        dragControlsEnabled={isAdmin}
                        calculatedTime={timelineTimes[item.id]}
                      />
                    );
                  })}
                </Reorder.Group>
              ) : (
                <div className="space-y-4">
                  {normalizedLiturgy.map((item: any, idx: number) => (
                    <LiturgyItemCard
                      key={item.id}
                      item={item}
                      idx={idx}
                      isAdmin={false}
                      onOpenSong={onOpenSong}
                      startEditing={startEditing}
                      handleMove={handleMove}
                      handleRemoveItem={handleRemoveItem}
                      serviceLiturgyLength={normalizedLiturgy.length}
                      dragControlsEnabled={false}
                      calculatedTime={timelineTimes[item.id]}
                    />
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="p-10 text-center border border-dashed border-border rounded-2xl bg-black/5 dark:bg-white/5">
               <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-4 text-text-main/20">
                  <Calendar size={24} />
               </div>
               <p className="text-sm sm:text-xs text-text-muted font-medium italic tracking-wide mb-6">Liturgia não configurada. Clique no botão abaixo para começar.</p>
               {isAdmin && (
                 <Button 
                   onClick={() => setIsEditing(true)}
                   className="bg-brand text-white font-black uppercase text-[10px] tracking-widest px-8 py-3 rounded-xl shadow-xl shadow-brand/20"
                 >
                   Configurar Liturgia
                 </Button>
               )}
            </div>
          )}
       </div>
        {isAdmin && (service.liturgy?.length > 0) && (
          <div className="pt-8 flex flex-col justify-center items-center gap-3">
            <AnimatePresence>
              {saveFeedbackMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg border",
                    saveStatus === "saving" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                    saveStatus === "success" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                    saveStatus === "error" && "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                  )}
                >
                  {saveStatus === "saving" && <Loader2 size={15} className="animate-spin shrink-0" />}
                  {saveStatus === "success" && <Check size={15} strokeWidth={3} className="shrink-0" />}
                  {saveStatus === "error" && <AlertTriangle size={15} className="shrink-0" />}
                  <span>{saveFeedbackMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full sm:w-auto">
              <Button 
                onClick={handleSaveLiturgy}
                disabled={saveStatus === "saving"}
                className={cn(
                  "w-full sm:w-auto font-black uppercase text-xs tracking-widest px-10 py-4 rounded-xl shadow-xl flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-95 cursor-pointer",
                  saveStatus === "saving" && "bg-amber-600 text-white shadow-amber-600/20 cursor-wait opacity-90",
                  saveStatus === "success" && "bg-emerald-600 hover:bg-emerald-600 text-white shadow-emerald-600/30 scale-[1.02]",
                  saveStatus === "error" && "bg-red-600 hover:bg-red-600 text-white shadow-red-600/30",
                  saveStatus === "idle" && "bg-brand hover:bg-blue-700 text-white shadow-brand/20 hover:scale-[1.02]"
                )}
              >
                {saveStatus === "saving" && (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Salvando...</span>
                  </>
                )}
                {saveStatus === "success" && (
                  <>
                    <Check size={18} strokeWidth={3} className="text-white animate-bounce" />
                    <span>Liturgia Salva com Sucesso!</span>
                  </>
                )}
                {saveStatus === "error" && (
                  <>
                    <AlertTriangle size={18} className="text-white" />
                    <span>Erro ao Salvar! Tentar Novamente</span>
                  </>
                )}
                {saveStatus === "idle" && (
                  <>
                    <Check size={18} strokeWidth={3} />
                    <span>Concluir e Salvar Liturgia</span>
                  </>
                )}
              </Button>
              <button 
                type="button"
                onClick={() => {
                  if (confirmDeleteLiturgy) {
                    handleClearLiturgy();
                  } else {
                    setConfirmDeleteLiturgy(true);
                  }
                }}
                disabled={isSaving || saveStatus === "saving"}
                className={`w-full sm:w-auto font-black uppercase text-xs tracking-widest px-10 py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 border cursor-pointer active:scale-95 disabled:opacity-50 ${
                  confirmDeleteLiturgy 
                    ? "bg-red-600 border-red-600 text-white animate-pulse" 
                    : "bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-500"
                }`}
              >
                <Trash2 size={18} />
                {confirmDeleteLiturgy ? "Confirmar Excluir?" : "Excluir Liturgia"}
              </button>
            </div>
          </div>
        )}
    </div>
  );
}