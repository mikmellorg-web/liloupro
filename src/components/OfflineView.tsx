import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, WifiOff, RefreshCw, Music, Calendar, Search, 
  ChevronRight, ArrowLeft, Plus, Minus, Info, 
  Users, BookOpen, Clock, Heart, DownloadCloud, Database,
  Settings, ChevronUp, ChevronDown
} from 'lucide-react';
import { transposeLyricsAndChords } from '../services/chordService';

interface OfflineViewProps {
  isOnline: boolean;
  offlineSyncTime: string | null;
  isSyncing: boolean;
  onSync: () => void;
  onlineSongs: any[];
  onlineServices: any[];
  onlineMembers: any[];
}

export function OfflineView({
  isOnline,
  offlineSyncTime,
  isSyncing,
  onSync,
  onlineSongs,
  onlineServices,
  onlineMembers
}: OfflineViewProps) {
  // Offline State loads directly from localStorage to guarantee functionality without server connections
  const [cachedSongs, setCachedSongs] = useState<any[]>([]);
  const [cachedServices, setCachedServices] = useState<any[]>([]);
  const [cachedMembers, setCachedMembers] = useState<any[]>([]);
  
  const [activeSubTab, setActiveSubTab] = useState<'escalas' | 'cifras' | 'info'>('info');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected detail states
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [songTranspose, setSongTranspose] = useState(0);
  const [fontSize, setFontSize] = useState(14);

  // Load cached items from localStorage
  const loadCache = () => {
    try {
      const storedSongs = localStorage.getItem('liloupro_offline_songs');
      const storedServices = localStorage.getItem('liloupro_offline_services');
      const storedMembers = localStorage.getItem('liloupro_offline_members');

      if (storedSongs) setCachedSongs(JSON.parse(storedSongs));
      if (storedServices) setCachedServices(JSON.parse(storedServices));
      if (storedMembers) setCachedMembers(JSON.parse(storedMembers));
    } catch (e) {
      console.error("Error reading localStorage offline cache:", e);
    }
  };

  useEffect(() => {
    loadCache();
    // Default to the most useful offline tabs if we already have cached data
    const storedSongs = localStorage.getItem('liloupro_offline_songs');
    const storedServices = localStorage.getItem('liloupro_offline_services');
    if (storedSongs || storedServices) {
      setActiveSubTab('escalas');
    }
  }, [offlineSyncTime]);

  // Filter cached services
  const filteredServices = useMemo(() => {
    if (!searchQuery) return cachedServices;
    const q = searchQuery.toLowerCase();
    return cachedServices.filter(s => 
      s.title?.toLowerCase().includes(q) || 
      s.date?.toLowerCase().includes(q) ||
      s.theme?.toLowerCase().includes(q)
    );
  }, [cachedServices, searchQuery]);

  // Filter cached songs
  const filteredSongs = useMemo(() => {
    if (!searchQuery) return cachedSongs;
    const q = searchQuery.toLowerCase();
    return cachedSongs.filter(s => 
      s.title?.toLowerCase().includes(q) || 
      s.artist?.toLowerCase().includes(q) ||
      s.baseKey?.toLowerCase().includes(q) ||
      s.tags?.some((t: string) => t.toLowerCase().includes(q))
    );
  }, [cachedSongs, searchQuery]);

  const handleSongSelect = (song: any) => {
    setSelectedSong(song);
    setSongTranspose(0);
    setFontSize(14);
  };

  // Helper to format Date string gracefully
  const formatLocalDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 py-6 notranslate" translate="no">
      
      {/* Header com Conexão */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <span className="text-[10px] font-black tracking-widest text-brand uppercase block">MODO OFFLINE</span>
          <h1 className="text-3xl font-black text-text-main tracking-tight mt-1 flex items-center gap-2">
            Acesso Offline 💾
          </h1>
          <p className="text-xs text-text-muted mt-1 max-w-lg">
            Sincronize as cifras e escalas do seu ministério de louvor e acesse tudo mesmo sem internet no altar ou ensaio!
          </p>
        </div>

        {/* Status de Conexão */}
        <div className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2.5 transition-all self-start sm:self-center ${
          isOnline 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
            : 'bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse'
        }`}>
          {isOnline ? (
            <>
              <Wifi size={18} />
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-wider block leading-none">Online</span>
                <span className="text-[9px] font-mono opacity-80 mt-0.5 block">Pronto para sincronizar</span>
              </div>
            </>
          ) : (
            <>
              <WifiOff size={18} />
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-wider block leading-none">Modo Local</span>
                <span className="text-[9px] font-mono opacity-80 mt-0.5 block">Acessando cache local</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Caixa de Sincronização */}
      <div className="bg-card/40 backdrop-blur border border-border/60 rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand">Status de Sincronização</span>
            <div className="flex items-center gap-2">
              <Database size={16} className="text-text-muted" />
              <span className="text-sm font-semibold text-text-main">
                {offlineSyncTime ? `Última Sincronização: ${offlineSyncTime}` : 'Nenhum dado sincronizado localmente'}
              </span>
            </div>
            <p className="text-xs text-text-muted font-mono">
              Contém: {cachedSongs.length} músicas • {cachedServices.length} escalas/cultos • {cachedMembers.length} membros salvos
            </p>
          </div>

          <button
            onClick={onSync}
            disabled={!isOnline || isSyncing}
            className={`w-full md:w-auto px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isSyncing
                ? 'bg-brand text-white'
                : isOnline
                  ? 'bg-brand text-white hover:scale-[1.02] shadow-brand/10'
                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
            }`}
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
          </button>
        </div>

        {!isOnline && (
          <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2.5">
            <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-500/90 leading-normal">
              Você está desconectado. Não é possível baixar novas atualizações até reestabelecer a conexão. Porém, todo o conteúdo já salvo abaixo está totalmente funcional.
            </p>
          </div>
        )}
      </div>

      {/* Navegação entre Sub-Abas do Modo Offline */}
      <div className="flex border-b border-border/60 p-1 bg-card/20 rounded-2xl">
        <button
          onClick={() => { setActiveSubTab('escalas'); setSelectedSong(null); setSelectedService(null); }}
          className={`flex-1 py-3 text-center rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'escalas' 
              ? 'bg-brand text-white shadow-md' 
              : 'text-text-muted hover:text-text-main hover:bg-white/5'
          }`}
        >
          <Calendar size={14} />
          Escalas ({cachedServices.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('cifras'); setSelectedSong(null); setSelectedService(null); }}
          className={`flex-1 py-3 text-center rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'cifras' 
              ? 'bg-brand text-white shadow-md' 
              : 'text-text-muted hover:text-text-main hover:bg-white/5'
          }`}
        >
          <Music size={14} />
          Cifras ({cachedSongs.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('info'); setSelectedSong(null); setSelectedService(null); }}
          className={`flex-1 py-3 text-center rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'info' 
              ? 'bg-brand text-white shadow-md' 
              : 'text-text-muted hover:text-text-main hover:bg-white/5'
          }`}
        >
          <Info size={14} />
          Instruções
        </button>
      </div>

      {/* Conteúdo Principal */}
      <div className="min-h-[300px]">
        {/* Caso não tenha cache salvo */}
        {cachedSongs.length === 0 && cachedServices.length === 0 && activeSubTab !== 'info' ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-card/20 border border-dashed border-border/80 rounded-3xl space-y-4">
            <DownloadCloud size={40} className="text-zinc-500 opacity-40 animate-bounce" />
            <div className="space-y-1">
              <h3 className="font-bold text-text-main">Seu cache local está vazio</h3>
              <p className="text-xs text-text-muted max-w-sm">
                Conecte-se à internet e clique em <span className="font-bold text-brand">"Sincronizar Agora"</span> para salvar as informações de cultos, equipes e cifras neste navegador.
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* INFORMAÇÕES E INSTRUÇÕES */}
            {activeSubTab === 'info' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card/30 border border-border/50 rounded-3xl p-5 sm:p-6 space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-text-main uppercase tracking-tight">Como funciona o Modo Offline? ⚡</h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Muitas igrejas têm problemas crônicos de sinal de celular ou redes de Wi-Fi lentas e instáveis. O <strong>Liloupro</strong> resolve isso permitindo que você baixe todas as músicas e escalas importantes do seu ministério diretamente no armazenamento interno do seu navegador (localStorage/IndexedDB).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                    <span className="text-xl">🎸</span>
                    <h4 className="font-black text-xs uppercase tracking-wider text-text-main">Cifras Offline Completas</h4>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      Acesse as letras, blocos de cifras completos e mude o tom (transposição de semitones) instantaneamente no altar sem carregar uma única folha de papel!
                    </p>
                  </div>

                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                    <span className="text-xl">📅</span>
                    <h4 className="font-black text-xs uppercase tracking-wider text-text-main">Escalas e Ministros</h4>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      Visualize a escala do culto de domingo, quem está escalado em cada instrumento (vocal, violão, bateria, teclado, técnica), os horários e a liturgia completa do culto.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-brand/5 border border-brand/10 rounded-2xl space-y-2">
                  <h4 className="font-black text-xs uppercase tracking-wider text-brand flex items-center gap-1">
                    <Info size={14} /> Dica de Ouro
                  </h4>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Sempre faça uma rápida sincronização antes de sair de casa para os ensaios ou cultos. Assim você garante que terá a versão mais recente dos arranjos, músicas e escalas de ministério alteradas de última hora!
                  </p>
                </div>
              </motion.div>
            )}

            {/* ESCALAS OFFLINE */}
            {activeSubTab === 'escalas' && !selectedService && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 text-text-muted" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar cultos, datas ou temas no cache..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-card/50 hover:bg-card/75 focus:bg-card border border-border/80 focus:border-brand/50 rounded-2xl text-xs text-text-main placeholder-text-muted outline-none transition-all shadow-inner"
                  />
                </div>

                {/* Lista de Cultos */}
                <div className="grid grid-cols-1 gap-3">
                  {filteredServices.length === 0 ? (
                    <div className="text-center py-12 text-xs text-text-muted">
                      Nenhum culto encontrado correspondente à busca.
                    </div>
                  ) : (
                    filteredServices.map((srv: any) => (
                      <div
                        key={srv.id}
                        onClick={() => setSelectedService(srv)}
                        className="bg-card/40 hover:bg-card/60 border border-border/60 hover:border-brand/20 p-4 rounded-2xl flex items-center justify-between gap-4 cursor-pointer transition-all select-none group"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono bg-brand/10 text-brand px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {formatLocalDate(srv.date)}
                            </span>
                            {srv.time && (
                              <span className="text-[9px] text-text-muted font-mono flex items-center gap-1">
                                <Clock size={10} />
                                {srv.time}
                              </span>
                            )}
                          </div>
                          <h3 className="font-black text-sm text-text-main truncate group-hover:text-brand transition-colors">
                            {srv.title || 'Culto de Adoração'}
                          </h3>
                          {srv.theme && (
                            <p className="text-xs text-text-muted truncate">
                              Tema: <span className="italic">{srv.theme}</span>
                            </p>
                          )}
                        </div>
                        <ChevronRight size={18} className="text-text-muted group-hover:text-brand transition-colors transform group-hover:translate-x-0.5" />
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* DETALHE DA ESCALA SELECIONADA */}
            {activeSubTab === 'escalas' && selectedService && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Back Button */}
                <button
                  onClick={() => setSelectedService(null)}
                  className="px-4 py-2 bg-card/60 hover:bg-card border border-border/80 text-text-main font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 select-none cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  Voltar para lista
                </button>

                {/* Card de Informações Principais */}
                <div className="bg-card/40 border border-border/60 rounded-3xl p-5 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono bg-brand/15 text-brand px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                      {formatLocalDate(selectedService.date)}
                    </span>
                    {selectedService.time && (
                      <span className="text-xs text-text-muted font-mono flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                        <Clock size={11} /> {selectedService.time}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-text-main tracking-tight">{selectedService.title || 'Culto de Adoração'}</h2>
                  {selectedService.theme && (
                    <p className="text-sm text-brand italic">
                      Tema do Culto: {selectedService.theme}
                    </p>
                  )}
                  {selectedService.description && (
                    <p className="text-xs text-text-muted leading-relaxed pt-2 border-t border-border/40">
                      {selectedService.description}
                    </p>
                  )}
                </div>

                {/* Grid Equipe & Liturgia */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Equipe / Escala */}
                  <div className="bg-card/30 border border-border/40 rounded-3xl p-5 space-y-4">
                    <h3 className="font-black text-xs uppercase tracking-widest text-text-muted flex items-center gap-1.5 pb-2 border-b border-border/40">
                      <Users size={14} className="text-brand" />
                      Equipe Escalada
                    </h3>

                    {(!selectedService.team || Object.keys(selectedService.team).length === 0) ? (
                      <p className="text-xs text-text-muted italic py-4">Nenhum músico escalado neste culto.</p>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(selectedService.team).map(([role, musicianNames]: [string, any]) => {
                          const namesArray = Array.isArray(musicianNames) 
                            ? musicianNames 
                            : (typeof musicianNames === 'string' ? [musicianNames] : []);
                          
                          if (namesArray.length === 0) return null;

                          return (
                            <div key={role} className="flex items-start gap-3 py-1 border-b border-border/10 last:border-0 pb-2 last:pb-0">
                              <div className="min-w-[80px] text-[10px] font-black uppercase text-brand tracking-wider mt-0.5">
                                {role}
                              </div>
                              <div className="flex-1 text-xs font-semibold text-text-main space-y-1">
                                {namesArray.map((name: string, i: number) => (
                                  <div key={i}>{name}</div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Liturgia / Músicas */}
                  <div className="bg-card/30 border border-border/40 rounded-3xl p-5 space-y-4">
                    <h3 className="font-black text-xs uppercase tracking-widest text-text-muted flex items-center gap-1.5 pb-2 border-b border-border/40">
                      <Music size={14} className="text-brand" />
                      Repertório e Liturgia
                    </h3>

                    {(!selectedService.liturgy || selectedService.liturgy.length === 0) ? (
                      <p className="text-xs text-text-muted italic py-4">Nenhuma música ou liturgia cadastrada neste culto.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedService.liturgy.map((item: any, i: number) => {
                          // Try to match song with our cached songs for chord viewing
                          const matchedSong = cachedSongs.find(s => s.id === item.songId || s.title?.toLowerCase() === item.title?.toLowerCase());

                          return (
                            <div
                              key={i}
                              onClick={() => matchedSong && handleSongSelect(matchedSong)}
                              className={`p-3 rounded-2xl border text-left transition-all ${
                                matchedSong 
                                  ? 'bg-brand/5 hover:bg-brand/10 border-brand/20 cursor-pointer hover:scale-[1.01]' 
                                  : 'bg-white/5 border-white/5'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[9px] font-mono uppercase bg-black/10 dark:bg-white/5 px-2 py-0.5 rounded text-text-muted">
                                  {item.moment || item.type || 'Momento'}
                                </span>
                                {matchedSong && (
                                  <span className="text-[9px] font-mono text-brand font-black flex items-center gap-0.5">
                                    Ver Cifra 🎸
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-xs text-text-main mt-1.5">
                                {item.title || item.songTitle || 'Item de Liturgia'}
                              </h4>
                              {item.vocalist && (
                                <p className="text-[10px] text-text-muted mt-0.5">
                                  Vocal(is): <span className="font-semibold text-text-main">{item.vocalist}</span>
                                </p>
                              )}
                              {item.details && (
                                <p className="text-[10px] text-text-muted font-mono italic mt-1 line-clamp-2">
                                  {item.details}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* CIFRAS OFFLINE */}
            {activeSubTab === 'cifras' && !selectedSong && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 text-text-muted" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar cifras salvas, artistas ou tons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-card/50 hover:bg-card/75 focus:bg-card border border-border/80 focus:border-brand/50 rounded-2xl text-xs text-text-main placeholder-text-muted outline-none transition-all shadow-inner"
                  />
                </div>

                {/* Lista de Músicas */}
                <div className="grid grid-cols-1 gap-3">
                  {filteredSongs.length === 0 ? (
                    <div className="text-center py-12 text-xs text-text-muted">
                      Nenhuma música encontrada no cache local.
                    </div>
                  ) : (
                    filteredSongs.map((song: any) => (
                      <div
                        key={song.id}
                        onClick={() => handleSongSelect(song)}
                        className="bg-card/40 hover:bg-card/60 border border-border/60 hover:border-brand/20 p-4 rounded-2xl flex items-center justify-between gap-4 cursor-pointer transition-all select-none group"
                      >
                        <div className="min-w-0">
                          <h3 className="font-black text-sm text-text-main truncate group-hover:text-brand transition-colors">
                            {song.title}
                          </h3>
                          <p className="text-xs text-text-muted truncate">
                            {song.artist || 'Artista desconhecido'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 select-none font-mono">
                          {song.baseKey && (
                            <span className="text-[10px] font-black bg-brand/10 text-brand px-2 py-1 rounded-lg">
                              {song.baseKey}
                            </span>
                          )}
                          {song.bpm && (
                            <span className="text-[9px] text-text-muted">
                              {song.bpm} BPM
                            </span>
                          )}
                          <ChevronRight size={18} className="text-text-muted group-hover:text-brand transition-colors transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* LEITOR DE CIFRA SELECIONADA */}
            {activeSubTab === 'cifras' && selectedSong && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Control Panel Superior */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-card/20 p-2.5 rounded-2xl border border-border/40 select-none">
                  <button
                    onClick={() => setSelectedSong(null)}
                    className="px-4 py-2 bg-card/60 hover:bg-card border border-border/80 text-text-main font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    Voltar
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Transpose Controls */}
                    <div className="flex items-center bg-black/10 dark:bg-white/5 border border-border/80 rounded-xl overflow-hidden h-9">
                      <button
                        onClick={() => setSongTranspose(prev => prev - 1)}
                        className="w-9 h-full flex items-center justify-center hover:bg-white/10 text-text-main active:scale-95 transition-all"
                        title="Diminuir Meio Tom (-1)"
                      >
                        <Minus size={12} strokeWidth={3} />
                      </button>
                      <div className="px-3 text-xs font-black text-brand text-center min-w-[70px]">
                        Tom: {songTranspose === 0 ? 'Original' : `${songTranspose > 0 ? '+' : ''}${songTranspose}`}
                      </div>
                      <button
                        onClick={() => setSongTranspose(prev => prev + 1)}
                        className="w-9 h-full flex items-center justify-center hover:bg-white/10 text-text-main active:scale-95 transition-all"
                        title="Aumentar Meio Tom (+1)"
                      >
                        <Plus size={12} strokeWidth={3} />
                      </button>
                    </div>

                    {/* Font Size Controls */}
                    <div className="flex items-center bg-black/10 dark:bg-white/5 border border-border/80 rounded-xl overflow-hidden h-9">
                      <button
                        onClick={() => setFontSize(prev => Math.max(10, prev - 1))}
                        className="w-9 h-full flex items-center justify-center hover:bg-white/10 text-text-main active:scale-95 transition-all"
                        title="Diminuir Fonte"
                      >
                        <span className="text-[10px] font-bold">A-</span>
                      </button>
                      <div className="px-2 text-[10px] font-mono text-text-muted min-w-[30px] text-center">
                        {fontSize}px
                      </div>
                      <button
                        onClick={() => setFontSize(prev => Math.min(24, prev + 1))}
                        className="w-9 h-full flex items-center justify-center hover:bg-white/10 text-text-main active:scale-95 transition-all"
                        title="Aumentar Fonte"
                      >
                        <span className="text-xs font-bold">A+</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Título e Info */}
                <div className="space-y-1 bg-card/10 p-4 border border-border/30 rounded-2xl select-none">
                  <h2 className="text-xl font-black text-text-main tracking-tight">{selectedSong.title}</h2>
                  <p className="text-xs text-text-muted">
                    {selectedSong.artist || 'Artista desconhecido'} • Tom Original: <span className="text-brand font-bold">{selectedSong.baseKey || 'N/D'}</span>
                    {selectedSong.bpm && ` • BPM: ${selectedSong.bpm}`}
                    {selectedSong.capo && ` • Capotraste: ${selectedSong.capo}`}
                  </p>
                </div>

                {/* Exibição da Cifra Pré-formatada */}
                <div className="bg-card/40 border border-border/60 rounded-3xl p-5 sm:p-6 overflow-x-auto shadow-inner">
                  {selectedSong.chords ? (
                    <pre 
                      className="font-mono text-text-main leading-relaxed select-text" 
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {transposeLyricsAndChords(selectedSong.chords, songTranspose)}
                    </pre>
                  ) : selectedSong.lyrics ? (
                    <pre 
                      className="font-mono text-text-main leading-relaxed select-text whitespace-pre-wrap" 
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {selectedSong.lyrics}
                    </pre>
                  ) : (
                    <div className="text-center py-12 text-xs text-text-muted italic">
                      Esta música não possui cifra ou letra cadastrada.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>

    </div>
  );
}
