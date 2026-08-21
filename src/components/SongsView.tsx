import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit, Save, Check, X, GripVertical, 
  Music, BookOpen, Quote, Volume2, Gift, Activity, Search, ChevronDown, ChevronUp, Sparkles, User, Mic, Copy, FileText, RotateCcw,
  ArrowUp, ArrowDown
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { Music2 } from './MusicIcon';
import { BibleSearch } from './BibleSearch';
import { ConfirmButton } from './ConfirmButton';

export const MUSIC_CATEGORIES = [
  'ABERTURA',
  'CRIAÇÃO/ADORAÇÃO',
  'QUEDA/CONFISSÃO',
  'REDENÇÃO/AÇÃO DE GRAÇAS',
  'CONSUMAÇÃO/RESPOSTA',
  'DÍZIMOS/OFERTAS',
  'ORAÇÃO/INTERCESSÃO',
  'APELO/DECISÃO',
  'JÚBILO/CELEBRAÇÃO',
  'CEIA/COMUNHÃO',
  'ADORAÇÃO',
  'ENCERRAMENTO',
  'PERSONALIZE'
] as const;

export const READING_CATEGORIES = [
  'PALAVRA DE ABERTURA',
  'TEXTO DE OFERTAS',
  'PREGAÇÃO DO EVANGELHO',
  'CHAMADO À ADORAÇÃO',
  'EXPLICAÇÃO DO EVANGELHO',
  'TEXTO DE BENÇÃO FINAL'
] as const;

export const SONG_ORDERS = [
  'PRIMEIRA MÚSICA',
  'SEGUNDA MÚSICA',
  'TERCEIRA MÚSICA',
  'QUARTA MÚSICA',
  'QUINTA MÚSICA',
  'SEXTA MÚSICA',
  'SÉTIMA MÚSICA',
  'OITAVA MÚSICA',
  'NONA MÚSICA',
  'DÉCIMA MÚSICA'
] as const;

export function isVocalMember(member: any): boolean {
  if (!member) return false;
  const rolesList: string[] = [];
  if (Array.isArray(member.roles)) {
    rolesList.push(...member.roles);
  }
  if (member.role && typeof member.role === 'string') {
    rolesList.push(member.role);
  }
  if (Array.isArray(member.assignedRoles)) {
    rolesList.push(...member.assignedRoles);
  }

  return rolesList.some((r: string) => {
    if (typeof r !== 'string') return false;
    const clean = r.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    return clean === 'vocal principal' || 
           clean === 'backing vocal' ||
           clean.includes('vocal principal') ||
           clean.includes('backing vocal');
  });
}

export function getMemberVocalRoleLabel(member: any): string {
  const rolesList: string[] = [];
  if (Array.isArray(member.roles)) rolesList.push(...member.roles);
  if (member.role && typeof member.role === 'string') rolesList.push(member.role);
  if (Array.isArray(member.assignedRoles)) rolesList.push(...member.assignedRoles);

  for (const r of rolesList) {
    if (typeof r !== 'string') continue;
    const clean = r.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (clean.includes('vocal principal')) return 'Vocal Principal';
    if (clean.includes('backing vocal')) return 'Backing Vocal';
  }
  return 'Vocal';
}

export function LiturgyEditor({ 
  service, 
  onOpenSong, 
  playlistOnly = false, 
  createNotifications 
}: { 
  service: any; 
  onOpenSong?: (songId: string) => void; 
  playlistOnly?: boolean; 
  createNotifications?: any;
}) {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<any[]>(service?.liturgy || []);
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [songSearch, setSongSearch] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [customVocalistInput, setCustomVocalistInput] = useState('');

  // New / editing item state
  const [newItemType, setNewItemType] = useState<'song' | 'reading' | 'speech' | 'prayer' | 'announcements' | 'offering' | 'other'>('song');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([MUSIC_CATEGORIES[0]]);
  const [songOrder, setSongOrder] = useState<string>('');
  const [selectedVocalists, setSelectedVocalists] = useState<string[]>([]);
  const [newReadingCategory, setNewReadingCategory] = useState<string>(READING_CATEGORIES[0]);
  const [newBibleVersion, setNewBibleVersion] = useState<string>('BLIVRE');
  const [showBibleAssistant, setShowBibleAssistant] = useState(false);
  const [justInsertedBible, setJustInsertedBible] = useState(false);
  const [newItemDetails, setNewItemDetails] = useState('');
  const [selectedSongId, setSelectedSongId] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setItems(service?.liturgy || []);
  }, [service?.liturgy]);

  // Load songs
  useEffect(() => {
    const q = query(collection(db, 'songs'), orderBy('title', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const songsData: any[] = [];
      snapshot.forEach((docSnap) => {
        songsData.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAllSongs(songsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'songs');
    });

    return () => unsubscribe();
  }, []);

  // Load members for vocalists
  useEffect(() => {
    const q = query(collection(db, 'members'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const membersData: any[] = [];
      snapshot.forEach((docSnap) => {
        membersData.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAllMembers(membersData);
    }, (error) => {
      console.warn("Could not load members in LiturgyEditor", error);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveLiturgy = async (updatedItems: any[]) => {
    if (!service?.id) return;
    try {
      const serviceRef = doc(db, 'services', service.id);
      await updateDoc(serviceRef, {
        liturgy: updatedItems
      });
      setItems(updatedItems);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `services/${service.id}`);
    }
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex || 
      fromIndex < 0 || 
      toIndex < 0 || 
      fromIndex >= items.length || 
      toIndex >= items.length
    ) {
      return;
    }

    const updated = [...items];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);

    // Keep expanded states aligned with moved items
    const nextExpanded: Record<number, boolean> = {};
    Object.keys(expandedItems).forEach(key => {
      const k = Number(key);
      if (k === fromIndex) {
        nextExpanded[toIndex] = expandedItems[k];
      } else if (fromIndex < toIndex && k > fromIndex && k <= toIndex) {
        nextExpanded[k - 1] = expandedItems[k];
      } else if (fromIndex > toIndex && k >= toIndex && k < fromIndex) {
        nextExpanded[k + 1] = expandedItems[k];
      } else {
        nextExpanded[k] = expandedItems[k];
      }
    });
    setExpandedItems(nextExpanded);

    await handleSaveLiturgy(updated);
  };

  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    await handleReorder(index, targetIndex);
  };

  const handleRestorePreaching = async () => {
    const preachingItem = {
      type: 'speech',
      title: 'Pregação do Evangelho',
      content: 'PREGAÇÃO DO EVANGELHO',
      details: 'Momento de ministração e exposição das Sagradas Escrituras.',
      bibleVersion: 'BLIVRE'
    };

    const updated = [...items];
    const offeringOrEndIndex = updated.findIndex(i => 
      i.type === 'offering' || 
      i.content?.includes('BENÇÃO') || 
      i.content?.includes('ENCERRAMENTO')
    );

    if (offeringOrEndIndex !== -1) {
      updated.splice(offeringOrEndIndex, 0, preachingItem);
    } else {
      updated.push(preachingItem);
    }

    await handleSaveLiturgy(updated);
  };

  const hasPreaching = items.some(i => i.type === 'speech');

  const handleToggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(prev => prev.filter(c => c !== cat));
    } else {
      setSelectedCategories(prev => [...prev, cat]);
    }
  };

  const handleToggleVocalist = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (selectedVocalists.includes(trimmed)) {
      setSelectedVocalists(prev => prev.filter(v => v !== trimmed));
    } else {
      setSelectedVocalists(prev => [...prev, trimmed]);
    }
  };

  const handleAddCustomVocalist = () => {
    const trimmed = customVocalistInput.trim();
    if (trimmed && !selectedVocalists.includes(trimmed)) {
      setSelectedVocalists(prev => [...prev, trimmed]);
      setCustomVocalistInput('');
    }
  };

  const handleAddItem = async () => {
    let finalTitle = newItemTitle.trim();
    let finalContent = '';
    let finalCategories: string[] = [];

    if (newItemType === 'song') {
      if (selectedSongId) {
        const matched = allSongs.find(s => s.id === selectedSongId);
        if (matched && !finalTitle) {
          finalTitle = matched.title;
        }
      }
      
      finalCategories = selectedCategories.map(c => {
        if (c === 'PERSONALIZE' && customCategory.trim()) {
          return customCategory.trim().toUpperCase();
        }
        return c;
      }).filter(Boolean);

      if (finalCategories.length === 0 && customCategory.trim()) {
        finalCategories = [customCategory.trim().toUpperCase()];
      }

      finalContent = finalCategories.join(' • ');
    } else if (newItemType === 'reading' || newItemType === 'speech') {
      finalContent = newReadingCategory;
    }

    if (!finalTitle && newItemType !== 'song') return;

    const newItem: any = {
      type: newItemType,
      title: finalTitle || 'Sem Título',
      content: finalContent,
      details: newItemDetails.trim(),
      ...((newItemType === 'reading' || newItemType === 'speech') && {
        bibleVersion: newBibleVersion || 'BLIVRE'
      }),
      ...(newItemType === 'song' && {
        songId: selectedSongId || '',
        songOrder: songOrder || '',
        categories: finalCategories,
        vocalist: selectedVocalists.join(', '),
        vocalists: selectedVocalists
      })
    };

    let updated: any[];
    if (editingIndex !== null) {
      updated = [...items];
      updated[editingIndex] = newItem;
      setEditingIndex(null);
    } else {
      updated = [...items, newItem];
    }

    await handleSaveLiturgy(updated);
    resetForm();
  };

  const handleDeleteItem = async (index: number) => {
    const updated = items.filter((_, idx) => idx !== index);
    await handleSaveLiturgy(updated);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingIndex(null);
    setNewItemType('song');
    setNewItemTitle('');
    setSelectedCategories([MUSIC_CATEGORIES[0]]);
    setSongOrder('');
    setSelectedVocalists([]);
    setCustomVocalistInput('');
    setNewReadingCategory(READING_CATEGORIES[0]);
    setNewBibleVersion('BLIVRE');
    setShowBibleAssistant(false);
    setCustomCategory('');
    setNewItemDetails('');
    setSelectedSongId('');
    setSongSearch('');
  };

  const handleStartEdit = (index: number) => {
    const item = items[index];
    setEditingIndex(index);
    const itemType = item.type || 'song';
    setNewItemType(itemType);
    setNewItemTitle(item.title || '');

    if (itemType === 'song') {
      setSongOrder(item.songOrder || '');

      // Parse categories
      if (Array.isArray(item.categories) && item.categories.length > 0) {
        setSelectedCategories(item.categories);
      } else if (item.content) {
        const split = item.content.split(/[•,]/).map((c: string) => c.trim()).filter(Boolean);
        const recognized: string[] = [];
        let customVal = '';
        split.forEach((c: string) => {
          if ((MUSIC_CATEGORIES as readonly string[]).includes(c)) {
            recognized.push(c);
          } else {
            recognized.push('PERSONALIZE');
            customVal = c;
          }
        });
        setSelectedCategories(recognized.length > 0 ? recognized : [MUSIC_CATEGORIES[0]]);
        if (customVal) setCustomCategory(customVal);
      } else {
        setSelectedCategories([MUSIC_CATEGORIES[0]]);
      }

      // Parse vocalists
      if (Array.isArray(item.vocalists) && item.vocalists.length > 0) {
        setSelectedVocalists(item.vocalists);
      } else if (item.vocalist) {
        const splitVocals = item.vocalist.split(',').map((v: string) => v.trim()).filter(Boolean);
        setSelectedVocalists(splitVocals);
      } else {
        setSelectedVocalists([]);
      }
    } else if (itemType === 'reading' || itemType === 'speech') {
      if (item.content && (READING_CATEGORIES as readonly string[]).includes(item.content)) {
        setNewReadingCategory(item.content);
      } else {
        setNewReadingCategory(READING_CATEGORIES[0]);
      }
      setNewBibleVersion(item.bibleVersion || 'BLIVRE');
      setShowBibleAssistant(false);
    }

    setNewItemDetails(item.details || '');
    setSelectedSongId(item.songId || '');
    setIsAdding(true);
  };

  const filteredSongs = allSongs.filter(s => {
    if (!songSearch) return true;
    const q = songSearch.toLowerCase();
    return (s.title || '').toLowerCase().includes(q) || (s.artist || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4 text-left">
      {/* Header with actions */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-black text-text-main uppercase tracking-wider">
            {playlistOnly ? 'Músicas do Culto' : 'Estrutura da Liturgia'}
          </h3>
          <p className="text-[11px] text-text-muted">
            {playlistOnly ? 'Gerencie as músicas escaladas para este culto' : 'Defina os momentos, leituras e músicas do culto'}
          </p>
        </div>

        {isAdmin && !isAdding && (
          <div className="flex items-center gap-2">
            {!playlistOnly && !hasPreaching && items.length > 0 && (
              <button
                type="button"
                onClick={handleRestorePreaching}
                className="px-3 py-1.5 bg-purple-600/15 hover:bg-purple-600/25 text-purple-400 border border-purple-500/30 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Restaurar o momento da Pregação excluído"
              >
                <RotateCcw size={13} /> Restaurar Pregação
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsAdding(true);
              }}
              className="px-3 py-1.5 bg-brand hover:brightness-110 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer border-none"
            >
              <Plus size={14} /> Adicionar
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Form Modal or Inline Card */}
      {isAdding && (
        <div className="p-4 sm:p-5 bg-card border border-brand/40 rounded-2xl space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-black uppercase tracking-wider text-brand">
              {editingIndex !== null ? 'Editar Item da Liturgia' : 'Novo Item na Liturgia'}
            </span>
            <button
              type="button"
              onClick={resetForm}
              className="text-text-muted hover:text-text-main p-1 rounded-lg hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          {!playlistOnly && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1.5">
                MOMENTO DO CULTO
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { type: 'song', label: 'Música', icon: Music2 },
                  { type: 'reading', label: 'Leitura', icon: BookOpen },
                  { type: 'speech', label: 'Pregação', icon: Quote },
                  { type: 'prayer', label: 'Oração', icon: Check },
                  { type: 'announcements', label: 'Avisos', icon: Volume2 },
                  { type: 'offering', label: 'Ofertas', icon: Gift },
                  { type: 'other', label: 'Outro', icon: Activity }
                ].map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewItemType(type as any)}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      newItemType === type 
                        ? 'bg-brand text-white border-brand shadow-sm' 
                        : 'bg-black/20 dark:bg-white/5 border-border text-text-muted hover:text-text-main'
                    }`}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* If Song is selected */}
          {newItemType === 'song' && (
            <div className="space-y-4">
              
              {/* ORDEM DA MÚSICA */}
              <div className="p-3 bg-black/10 dark:bg-white/5 rounded-xl border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-brand flex items-center gap-1.5">
                    <Sparkles size={12} /> ORDEM DA MÚSICA
                  </label>
                  {songOrder && (
                    <button
                      type="button"
                      onClick={() => setSongOrder('')}
                      className="text-[10px] font-bold text-text-muted hover:text-red-400 cursor-pointer"
                    >
                      Limpar ordem
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {SONG_ORDERS.map((ord, idx) => {
                    const isSelected = songOrder === ord;
                    return (
                      <button
                        key={ord}
                        type="button"
                        onClick={() => setSongOrder(isSelected ? '' : ord)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'bg-brand text-white border-brand shadow-sm scale-[1.02]'
                            : 'bg-surface border-border text-text-muted hover:text-text-main hover:border-brand/40'
                        }`}
                      >
                        {idx + 1}ª MÚSICA
                      </button>
                    );
                  })}
                </div>
                {songOrder && (
                  <p className="text-[10px] font-bold text-brand mt-1">
                    Selecionado: <span className="underline">{songOrder}</span>
                  </p>
                )}
              </div>

              {/* Múltiplas Categorias da Música */}
              <div className="p-3 bg-black/10 dark:bg-white/5 rounded-xl border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-brand block">
                    CATEGORIA DA MÚSICA (SELECIONE UMA OU MAIS)
                  </label>
                  <span className="text-[10px] font-black text-brand bg-brand/15 px-2 py-0.5 rounded-full">
                    {selectedCategories.length} selecionada(s)
                  </span>
                </div>

                <p className="text-[10px] text-text-muted">
                  Toque para marcar/desmarcar várias categorias para a mesma música:
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {MUSIC_CATEGORIES.map((cat, idx) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleToggleCategory(cat)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-brand text-white border-brand shadow-sm scale-[1.02]'
                            : 'bg-surface border-border text-text-muted hover:text-text-main hover:border-brand/40'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] ${
                          isSelected ? 'bg-white text-brand font-black' : 'border border-border'
                        }`}>
                          {isSelected ? '✓' : idx + 1}
                        </span>
                        {cat}
                      </button>
                    );
                  })}
                </div>

                {selectedCategories.includes('PERSONALIZE') && (
                  <div className="mt-2 pt-2 border-t border-border/60 animate-in fade-in duration-200">
                    <label className="text-[10px] font-bold text-text-muted block mb-1">
                      Categoria Personalizada:
                    </label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Digite sua categoria personalizada (ex: Doxologia, Entrada)..."
                      className="w-full bg-surface border border-border rounded-xl p-2.5 text-xs text-text-main placeholder:text-text-muted focus:ring-1 focus:ring-brand font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Song Selection from Catalog */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1">
                  Selecionar Música do Catálogo
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      value={songSearch}
                      onChange={(e) => setSongSearch(e.target.value)}
                      placeholder="Buscar música por título ou artista..."
                      className="w-full bg-black/20 dark:bg-white/5 border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text-main placeholder:text-text-muted focus:ring-1 focus:ring-brand"
                    />
                  </div>

                  <select
                    value={selectedSongId}
                    onChange={(e) => {
                      setSelectedSongId(e.target.value);
                      const song = allSongs.find(s => s.id === e.target.value);
                      if (song) {
                        setNewItemTitle(song.title);
                      }
                    }}
                    className="w-full bg-black/20 dark:bg-white/5 border border-border rounded-xl p-2.5 text-xs text-text-main focus:ring-1 focus:ring-brand font-bold"
                  >
                    <option value="" className="bg-surface text-text-muted">-- Selecione uma música --</option>
                    {filteredSongs.map((song) => (
                      <option key={song.id} value={song.id} className="bg-surface text-text-main">
                        {song.title} {song.artist ? `(${song.artist})` : ''} {song.key ? `[Tom: ${song.key}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title (or Custom Song Title) */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1">
                  Título da Música
                </label>
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="Ex: Santo Pra Sempre"
                  className="w-full bg-black/20 dark:bg-white/5 border border-border rounded-xl p-2.5 text-xs text-text-main focus:ring-1 focus:ring-brand font-bold"
                />
              </div>

              {/* Ministro / Vocalista Principal (Múltipla Seleção e Cantores Cadastrados) */}
              <div className="p-3 bg-black/10 dark:bg-white/5 rounded-xl border border-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-brand flex items-center gap-1.5">
                    <Mic size={12} /> MINISTRO / VOCALISTAS (SELEÇÃO MÚLTIPLA)
                  </label>
                  {selectedVocalists.length > 0 && (
                    <span className="text-[10px] font-black text-brand bg-brand/15 px-2 py-0.5 rounded-full">
                      {selectedVocalists.length} cantor(es)
                    </span>
                  )}
                </div>

                {/* Selected Vocalists Badges */}
                {selectedVocalists.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-surface rounded-xl border border-brand/20">
                    {selectedVocalists.map((vocalist, vIdx) => (
                      <span
                        key={vIdx}
                        className="text-[10px] font-black uppercase tracking-wider bg-brand text-white px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-sm"
                      >
                        🎤 {vocalist}
                        <button
                          type="button"
                          onClick={() => handleToggleVocalist(vocalist)}
                          className="hover:bg-black/20 rounded p-0.5 ml-0.5 cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Team Members Chips - Filtered to ONLY Vocal Principal and Backing Vocal */}
                {(() => {
                  const vocalMembers = allMembers.filter((m) => {
                    if (service?.churchId && m.churchId && m.churchId !== service.churchId) {
                      return false;
                    }
                    return isVocalMember(m);
                  });

                  return vocalMembers.length > 0 ? (
                    <div>
                      <span className="text-[10px] font-bold text-text-muted block mb-1.5">
                        Cantores Cadastrados (Vocal Principal e Backing Vocal):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {vocalMembers.map((member) => {
                          const isSelected = selectedVocalists.includes(member.name);
                          const roleLabel = getMemberVocalRoleLabel(member);
                          return (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => handleToggleVocalist(member.name)}
                              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-brand text-white border-brand font-black shadow-sm scale-[1.02]'
                                  : 'bg-surface border-border text-text-muted hover:text-text-main hover:border-brand/40'
                              }`}
                            >
                              <User size={11} className={isSelected ? 'text-white' : 'text-brand'} />
                              <span>{member.name}</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full ${
                                isSelected 
                                  ? 'bg-white/20 text-white' 
                                  : 'bg-brand/10 text-brand'
                              }`}>
                                {roleLabel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-surface rounded-xl border border-border text-[11px] text-text-muted">
                      Nenhum integrante cadastrado com função de <strong>Vocal Principal</strong> ou <strong>Backing Vocal</strong>. Você pode digitar o nome no campo abaixo:
                    </div>
                  );
                })()}

                {/* Custom Vocalist input */}
                <div className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={customVocalistInput}
                    onChange={(e) => setCustomVocalistInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomVocalist();
                      }
                    }}
                    placeholder="Outro cantor / convidado..."
                    className="flex-1 bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-text-main placeholder:text-text-muted focus:ring-1 focus:ring-brand font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomVocalist}
                    disabled={!customVocalistInput.trim()}
                    className="px-3 py-1.5 bg-brand hover:brightness-110 text-white text-xs font-bold rounded-xl disabled:opacity-40 cursor-pointer border-none"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* If NOT a Song */}
          {newItemType !== 'song' && (
            <div className="space-y-3.5">
              {/* Category for Reading / Pregação */}
              {(newItemType === 'reading' || newItemType === 'speech') && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-brand block mb-1">
                    {newItemType === 'reading' ? 'CATEGORIA DA LEITURA' : 'CATEGORIA DA PREGAÇÃO / MENSAGEM'}
                  </label>
                  <select
                    value={newReadingCategory}
                    onChange={(e) => setNewReadingCategory(e.target.value)}
                    className="w-full bg-black/20 dark:bg-white/5 border border-border rounded-xl p-2.5 text-xs text-text-main focus:ring-1 focus:ring-brand font-bold"
                  >
                    {READING_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-surface text-text-main font-bold">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* BIBLE ASSISTANT - EXCLUSIVELY FOR LEITURA AND PREGAÇÃO */}
              {(newItemType === 'reading' || newItemType === 'speech') && (
                <div className="bg-brand/5 border border-brand/25 rounded-2xl p-3 sm:p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand shrink-0">
                        <BookOpen size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-text-main">
                            Assistente Bíblico
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-widest bg-brand text-white px-1.5 py-0.2 rounded">
                            {newBibleVersion === 'BLIVRE' ? 'Bíblia Livre' : newBibleVersion}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-muted">
                          Pesquise livros, capítulos e versículos na Bíblia Livre para preencher o título e o texto automaticamente.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowBibleAssistant(!showBibleAssistant)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border shrink-0 ${
                        showBibleAssistant
                          ? 'bg-black/20 dark:bg-white/10 text-text-main border-border hover:bg-black/30'
                          : 'bg-brand text-white border-brand hover:brightness-110 shadow-sm'
                      }`}
                    >
                      <BookOpen size={13} />
                      <span>{showBibleAssistant ? 'Ocultar Assistente' : 'Abrir Assistente Bíblico'}</span>
                    </button>
                  </div>

                  {/* Bible Search component container */}
                  {showBibleAssistant && (
                    <div className="pt-2 border-t border-brand/20 animate-in fade-in zoom-in-95 duration-150">
                      <BibleSearch
                        onInsert={(data) => {
                          if (data.title && !data.text) {
                            setNewItemTitle(data.title);
                          } else if (!data.title && data.text) {
                            setNewItemDetails(prev => prev.trim() ? `${prev.trim()}\n\n${data.text.trim()}` : data.text.trim());
                          } else if (data.title && data.text) {
                            setNewItemTitle(data.title);
                            setNewItemDetails(data.text.trim());
                          }
                          if (data.version) {
                            setNewBibleVersion(data.version);
                          }
                          setJustInsertedBible(true);
                          setTimeout(() => setJustInsertedBible(false), 3500);
                        }}
                        onClose={() => setShowBibleAssistant(false)}
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <span>Título / Identificador</span>
                    {justInsertedBible && (
                      <span className="text-[9px] text-emerald-500 font-black animate-pulse">
                        ✓ Atualizado pelo Assistente
                      </span>
                    )}
                  </label>
                  {(newItemType === 'reading' || newItemType === 'speech') && newBibleVersion && (
                    <span className="text-[9px] font-bold text-text-muted">
                      Versão: <strong className="text-brand">{newBibleVersion === 'BLIVRE' ? 'Bíblia Livre' : newBibleVersion}</strong>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder={
                    newItemType === 'reading' 
                      ? 'Ex: Salmo 23:1-6 (Bíblia Livre), Efésios 2:1-10...' 
                      : (newItemType === 'speech' ? 'Ex: Mateus 5:1-12 - Sermão do Monte...' : 'Ex: Oração pelos Enfermos, Avisos da Semana...')
                  }
                  className={`w-full bg-black/20 dark:bg-white/5 border rounded-xl p-2.5 text-xs text-text-main focus:ring-1 focus:ring-brand font-bold transition-all ${
                    justInsertedBible 
                      ? 'border-emerald-500/80 ring-2 ring-emerald-500/20 bg-emerald-500/5' 
                      : 'border-border'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <span>Detalhes / Texto / Notas</span>
                    {justInsertedBible && newItemDetails.trim() && (
                      <span className="text-[9px] text-emerald-500 font-black animate-pulse">
                        ✓ Versículos inseridos
                      </span>
                    )}
                  </label>
                  {newItemDetails.trim() && (
                    <button
                      type="button"
                      onClick={() => setNewItemDetails('')}
                      className="text-[9px] font-bold text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                    >
                      Limpar texto
                    </button>
                  )}
                </div>
                <textarea
                  value={newItemDetails}
                  onChange={(e) => setNewItemDetails(e.target.value)}
                  placeholder={
                    newItemType === 'reading' || newItemType === 'speech'
                      ? 'Texto bíblico selecionado ou anotações/esboço do sermão...'
                      : 'Digite aqui anotações ou roteiro...'
                  }
                  rows={4}
                  className={`w-full bg-black/20 dark:bg-white/5 border rounded-xl p-2.5 text-xs text-text-main focus:ring-1 focus:ring-brand leading-relaxed font-sans transition-all ${
                    justInsertedBible 
                      ? 'border-emerald-500/80 ring-2 ring-emerald-500/20 bg-emerald-500/5' 
                      : 'border-border'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-text-main bg-black/10 dark:bg-white/5 rounded-xl border border-border cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddItem}
              disabled={!newItemTitle.trim() && !selectedSongId}
              className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-brand hover:brightness-110 rounded-xl flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer border-none shadow-sm"
            >
              <Save size={14} /> {editingIndex !== null ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* Liturgy Items List */}
      <div className="space-y-2">
        {items.length > 1 && isAdmin && (
          <div className="flex items-center justify-between text-[11px] text-text-muted px-1.5 py-1 bg-black/5 dark:bg-white/2 border border-dashed border-border/70 rounded-xl">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-text-muted">
              <GripVertical size={13} className="text-brand" /> Arraste para reordenar a sequência
            </span>
            <span className="text-[10px] font-bold text-text-muted/70">
              {items.length} {items.length === 1 ? 'etapa' : 'etapas'}
            </span>
          </div>
        )}

        {items.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-2xl bg-black/5 dark:bg-white/2">
            <p className="text-xs text-text-muted italic">Nenhum momento cadastrado na liturgia ainda.</p>
          </div>
        ) : (
          items.map((item, index) => {
            const isSong = item.type === 'song';
            const isReadingOrSpeech = item.type === 'reading' || item.type === 'speech';
            const hasDetails = !!item.details?.trim();
            const isExpandable = isReadingOrSpeech || hasDetails;
            const isExpanded = !!expandedItems[index];
            const songDetails = isSong && item.songId ? allSongs.find(s => s.id === item.songId) : null;
            const vocalistsList = item.vocalists || (item.vocalist ? item.vocalist.split(',').map((v: string) => v.trim()).filter(Boolean) : []);
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index && draggedIndex !== index;

            return (
              <div
                key={index}
                draggable={isAdmin}
                onDragStart={(e) => {
                  if (!isAdmin) return;
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', String(index));
                  setDraggedIndex(index);
                }}
                onDragOver={(e) => {
                  if (!isAdmin) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverIndex !== index) {
                    setDragOverIndex(index);
                  }
                }}
                onDragEnter={(e) => {
                  if (!isAdmin) return;
                  e.preventDefault();
                  setDragOverIndex(index);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  if (dragOverIndex === index) {
                    setDragOverIndex(null);
                  }
                }}
                onDrop={(e) => {
                  if (!isAdmin) return;
                  e.preventDefault();
                  const from = draggedIndex !== null ? draggedIndex : Number(e.dataTransfer.getData('text/plain'));
                  if (!isNaN(from) && from !== index) {
                    handleReorder(from, index);
                  }
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                className={`bg-card border rounded-xl transition-all duration-150 overflow-hidden ${
                  isDragging 
                    ? 'opacity-40 scale-[0.99] border-dashed border-brand ring-2 ring-brand/40 bg-brand/5 shadow-inner' 
                    : isDragOver
                      ? 'border-brand ring-2 ring-brand bg-brand/10 shadow-lg translate-y-0.5'
                      : isExpanded 
                        ? 'border-brand/60 shadow-md ring-1 ring-brand/20' 
                        : 'border-border hover:border-brand/30'
                }`}
              >
                {/* Main item row */}
                <div className="flex items-center justify-between gap-2 sm:gap-3 p-3 group">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    {isAdmin && (
                      <div 
                        className="cursor-grab active:cursor-grabbing text-text-muted/60 hover:text-brand p-1 -ml-1 rounded-lg hover:bg-brand/10 transition-colors shrink-0 flex items-center justify-center select-none"
                        title="Arraste para mudar a posição"
                      >
                        <GripVertical size={16} />
                      </div>
                    )}

                    <span className="text-xs font-black text-text-muted w-5 text-center shrink-0">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      {/* Song Order Badge or Categories */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {item.songOrder && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-brand text-white px-2 py-0.5 rounded-md shadow-xs">
                            {item.songOrder}
                          </span>
                        )}
                        {item.content && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-brand block truncate">
                            {item.content}
                          </span>
                        )}
                        {item.type && !isSong && (
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                            item.type === 'reading' 
                              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20' 
                              : item.type === 'speech' 
                                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' 
                                : 'bg-black/10 dark:bg-white/5 text-text-muted'
                          }`}>
                            {item.type === 'reading' ? 'Leitura Bíblica' : item.type === 'speech' ? 'Pregação' : item.type}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <p 
                          onClick={() => {
                            if (isSong && item.songId && onOpenSong) {
                              onOpenSong(item.songId);
                            } else if (isExpandable) {
                              setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }));
                            }
                          }}
                          className={`text-xs sm:text-sm font-black text-text-main truncate ${
                            isSong && item.songId ? 'hover:text-brand cursor-pointer' : (isExpandable ? 'cursor-pointer hover:text-brand' : '')
                          }`}
                        >
                          {item.title || songDetails?.title || 'Sem título'}
                        </p>

                        {vocalistsList.map((voc: string, vIdx: number) => (
                          <span key={vIdx} className="text-[9px] font-bold text-text-muted uppercase px-1.5 py-0.5 bg-black/20 dark:bg-white/5 rounded-full shrink-0 flex items-center gap-1">
                            🎤 {voc}
                          </span>
                        ))}

                        {songDetails?.key && (
                          <span className="text-[9px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded-full shrink-0">
                            Tom: {songDetails.key}
                          </span>
                        )}

                        {item.bibleVersion && (
                          <span className="text-[9px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.5 rounded-full shrink-0 uppercase">
                            {item.bibleVersion}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Arrow / Setinha to expand and read Bible text or Preaching details */}
                    {isExpandable && (
                      <button
                        type="button"
                        onClick={() => setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }))}
                        className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                          isExpanded 
                            ? 'bg-brand text-white border-brand shadow-sm' 
                            : 'bg-black/10 dark:bg-white/5 border-border text-text-muted hover:text-text-main hover:border-brand/40'
                        }`}
                        title={isExpanded ? "Recolher texto" : "Abrir texto da leitura / pregação"}
                      >
                        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider">
                          {isExpanded ? 'Fechar' : 'Ler Palavra'}
                        </span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}

                    {isAdmin && (
                      <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        {items.length > 1 && (
                          <>
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveItem(index, 'up')}
                              className="p-1.5 hover:bg-white/10 rounded-lg text-text-muted hover:text-text-main disabled:opacity-20 disabled:pointer-events-none cursor-pointer transition-colors"
                              title="Mover para cima"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={index === items.length - 1}
                              onClick={() => handleMoveItem(index, 'down')}
                              className="p-1.5 hover:bg-white/10 rounded-lg text-text-muted hover:text-text-main disabled:opacity-20 disabled:pointer-events-none cursor-pointer transition-colors"
                              title="Mover para baixo"
                            >
                              <ArrowDown size={13} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(index)}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-text-muted hover:text-text-main cursor-pointer"
                          title="Editar"
                        >
                          <Edit size={13} />
                        </button>
                        <ConfirmButton
                          onConfirm={() => handleDeleteItem(index)}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg text-text-muted hover:text-red-400 cursor-pointer"
                          title="Excluir da Liturgia"
                          confirmText="Tem certeza?"
                        >
                          <Trash2 size={13} />
                        </ConfirmButton>
                      </div>
                    )}
                  </div>
                </div>

                {/* Collapsible Word / Preaching Reading Area */}
                {isExpandable && isExpanded && (
                  <div className="border-t border-border bg-black/10 dark:bg-black/30 p-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand flex items-center gap-1.5">
                          <BookOpen size={13} className="text-brand" />
                          {item.type === 'reading' ? 'Texto da Leitura Bíblica' : item.type === 'speech' ? 'Mensagem / Esboço da Pregação' : 'Texto / Detalhes do Momento'}
                          {item.bibleVersion && ` (${item.bibleVersion})`}
                        </span>
                        
                        {item.details && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(item.details);
                            }}
                            className="text-[10px] font-bold text-text-muted hover:text-text-main flex items-center gap-1 bg-black/20 dark:bg-white/5 px-2 py-1 rounded-lg border border-border transition-colors cursor-pointer"
                            title="Copiar texto"
                          >
                            <Copy size={11} /> Copiar
                          </button>
                        )}
                      </div>

                      {item.details ? (
                        <div className="bg-surface/80 p-3.5 rounded-xl border border-border/80 text-text-main">
                          <p className="text-xs sm:text-sm font-serif leading-relaxed whitespace-pre-line select-text text-left">
                            {item.details}
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 text-center border border-dashed border-border rounded-xl bg-black/5 dark:bg-white/2">
                          <p className="text-xs text-text-muted italic">
                            Nenhum versículo ou texto inserido para este momento ainda. Você pode editar e usar o Assistente Bíblico.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function SongDetailView({ song, onBack }: any) {
  return null;
}

export function AvailabilityView(props?: any) {
  return null;
}

export default function SongsView({ allSongs, onOpenSong }: any) {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h2 className="text-xl font-black text-text-main">Repertório de Músicas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(allSongs || []).map((song: any) => (
          <div
            key={song.id}
            onClick={() => onOpenSong?.(song.id)}
            className="p-4 bg-card border border-border rounded-xl cursor-pointer hover:border-brand/40 transition-all"
          >
            <p className="font-black text-text-main text-sm">{song.title}</p>
            <p className="text-xs text-text-muted">{song.artist || 'Artista'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
