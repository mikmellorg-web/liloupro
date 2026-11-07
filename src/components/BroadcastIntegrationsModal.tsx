import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Radio, Tv, Smartphone, Download, Upload, Copy, Check, ExternalLink, 
  Layers, Music, FileText, Sparkles, AlertCircle, HelpCircle, QrCode, Monitor,
  Zap, Code, Terminal, ChevronRight, CheckCircle2, Info, BookOpen
} from 'lucide-react';
import QRCode from 'qrcode';
import { 
  formatSongForHolyrics, 
  generateHolyricsZipForService, 
  downloadBlob, 
  parseHolyricsTextFile,
  ParsedHolyricsSong,
  HOLYRICS_JAVASCRIPT_SCRIPT
} from '../utils/holyricsUtils';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface BroadcastIntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userChurchId: string;
  allSongs: any[];
  allServices: any[];
  currentServiceId?: string;
}

export function BroadcastIntegrationsModal({
  isOpen,
  onClose,
  userChurchId,
  allSongs,
  allServices,
  currentServiceId
}: BroadcastIntegrationsModalProps) {
  const [activeTab, setActiveTab] = useState<'obs' | 'stage' | 'holyrics'>('obs');
  const [copiedObsUrl, setCopiedObsUrl] = useState(false);
  const [copiedStageUrl, setCopiedStageUrl] = useState(false);

  // QR Code para o Retorno de Palco
  const [stageQrDataUrl, setStageQrDataUrl] = useState<string>('');

  // Configurações de estilo do Lower Thirds no OBS
  const [obsStyle, setObsStyle] = useState<'bar' | 'clean'>('bar');
  const [obsPosition, setObsPosition] = useState<'bottom' | 'center'>('bottom');

  // Seleção de culto para exportação Holyrics
  const [selectedServiceId, setSelectedServiceId] = useState<string>(() => {
    return currentServiceId || (allServices.length > 0 ? allServices[0].id : '');
  });

  const [isExportingZip, setIsExportingZip] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Importação do Holyrics
  const [importedSongsPreview, setImportedSongsPreview] = useState<ParsedHolyricsSong[]>([]);
  const [isSavingImport, setIsSavingImport] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  // Holyrics Sub-Tabs & Script States
  const [holyricsSubTab, setHolyricsSubTab] = useState<'script' | 'zip' | 'import' | 'official'>('script');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedSongList, setCopiedSongList] = useState(false);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(HOLYRICS_JAVASCRIPT_SCRIPT);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleCopySongList = () => {
    if (serviceSongs.length === 0) return;
    const text = serviceSongs.map(s => s.title).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedSongList(true);
    setTimeout(() => setCopiedSongList(false), 3500);
  };

  // URLs completas
  const obsUrl = `${window.location.origin}?obs=true&church=${userChurchId}&session=${userChurchId}&style=${obsStyle}&pos=${obsPosition}`;
  const stageUrl = `${window.location.origin}?stage=true&church=${userChurchId}&session=${userChurchId}`;

  // Gera QR Code do Stage Display ao abrir a aba
  React.useEffect(() => {
    if (activeTab === 'stage') {
      QRCode.toDataURL(stageUrl, {
        width: 260,
        margin: 2,
        color: { dark: '#09090b', light: '#ffffff' }
      }).then(url => setStageQrDataUrl(url)).catch(() => {});
    }
  }, [activeTab, stageUrl]);

  // Culto selecionado e suas músicas
  const selectedService = useMemo(() => {
    return allServices.find(s => s.id === selectedServiceId) || allServices[0] || null;
  }, [allServices, selectedServiceId]);

  const serviceSongs = useMemo(() => {
    if (!selectedService) return [];
    
    // Suporte aos formatos de liturgia ou setlist do LiLouPro
    const items = selectedService.liturgy || selectedService.songs || selectedService.setlist || [];
    const songsList: any[] = [];

    items.forEach((item: any) => {
      // Se for um item de liturgia com songId
      if (item.songId) {
        const found = allSongs.find(s => s.id === item.songId);
        if (found) {
          songsList.push(found);
          return;
        }
      }
      // Se for música avulsa com dados embutidos (ignora leituras bíblicas e orações litúrgicas)
      const isReadingOrBible = 
        item.type === 'reading' || 
        item.type === 'bible' || 
        item.type === 'text' || 
        item.type === 'prayer' ||
        (item.title && (item.title.includes('(BLIVRE)') || item.title.includes('(TB)') || item.title.includes('(NAA)')));

      if (item.title && !isReadingOrBible) {
        songsList.push({
          title: item.title,
          artist: item.artist || '',
          key: item.baseKey || item.key || '',
          bpm: item.bpm || 80,
          lyrics: item.lyrics || item.chords || '',
          chords: item.chords || ''
        });
      }
    });

    return songsList;
  }, [selectedService, allSongs]);

  // Download do pacote Holyrics (.zip)
  const handleDownloadHolyricsZip = async () => {
    if (!selectedService || serviceSongs.length === 0) return;
    setIsExportingZip(true);
    try {
      const blob = await generateHolyricsZipForService(selectedService, serviceSongs);
      const safeName = (selectedService.title || selectedService.name || 'Culto').replace(/\s+/g, '_');
      downloadBlob(blob, `Holyrics_${safeName}.zip`);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    } catch (err) {
      console.error('Erro ao gerar pacote Holyrics:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  // Upload e parsing de arquivos .txt do Holyrics
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const parsedList: ParsedHolyricsSong[] = [];
    const fileList = Array.from(files);
    let readCount = 0;

    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        if (content) {
          const parsed = parseHolyricsTextFile(content, file.name);
          parsedList.push(parsed);
        }
        readCount++;
        if (readCount === fileList.length) {
          setImportedSongsPreview(prev => [...prev, ...parsedList]);
        }
      };
      reader.readAsText(file);
    });

    e.target.value = '';
  };

  // Salva músicas importadas no Firestore
  const handleSaveImportedSongs = async () => {
    if (importedSongsPreview.length === 0) return;
    setIsSavingImport(true);
    let count = 0;
    try {
      for (const song of importedSongsPreview) {
        await addDoc(collection(db, 'songs'), {
          title: song.title.trim(),
          artist: song.artist.trim(),
          baseKey: song.baseKey || '',
          bpm: song.bpm || 80,
          lyrics: song.lyrics,
          chords: song.chords,
          timeSignature: '4/4',
          createdAt: serverTimestamp(),
          churchId: userChurchId || 'semente'
        });
        count++;
      }
      setImportSuccessCount(count);
      setImportedSongsPreview([]);
      setTimeout(() => setImportSuccessCount(null), 4000);
    } catch (err) {
      console.error('Erro ao salvar músicas importadas:', err);
    } finally {
      setIsSavingImport(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-zinc-900 border border-zinc-700/80 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-left"
      >
        {/* CABEÇALHO */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white">
              <Radio size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                Integrações & Transmissão
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  OBS & Holyrics
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Lower Thirds para lives no OBS Studio, Retorno de Palco e interoperabilidade com Holyrics.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-5 pt-3 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('obs')}
            className={`pb-3 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'obs'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Tv size={15} />
            <span>OBS Studio (Lower Thirds)</span>
          </button>

          <button
            onClick={() => setActiveTab('stage')}
            className={`pb-3 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'stage'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Monitor size={15} />
            <span>Retorno de Palco (Stage)</span>
          </button>

          <button
            onClick={() => setActiveTab('holyrics')}
            className={`pb-3 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'holyrics'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers size={15} />
            <span>Holyrics (Exportar / Importar)</span>
          </button>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* ABA 1: OBS STUDIO */}
          {activeTab === 'obs' && (
            <div className="space-y-6">
              {/* Banner Descritivo */}
              <div className="bg-gradient-to-r from-indigo-950/50 via-zinc-900 to-indigo-950/30 p-4 rounded-2xl border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-wider">
                    <Sparkles size={14} />
                    <span>Transmissão Profissional no YouTube / Facebook</span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    O LiLouPro gera uma camada transparente (Lower Thirds) que sincroniza em tempo real com a passagem de slides do operador da igreja!
                  </p>
                </div>

                <a
                  href={`${obsUrl}&demo=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 border border-zinc-700 shrink-0 transition-all"
                >
                  <ExternalLink size={14} />
                  <span>Testar em Nova Aba</span>
                </a>
              </div>

              {/* Prévia do Lower Thirds */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  Pré-visualização do Lower Thirds (Simulação sobre a Câmera)
                </label>
                <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-zinc-700/80 bg-slate-900 shadow-inner flex flex-col justify-end p-4">
                  {/* Fundo simulando câmera da igreja */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-40 filter blur-[1px]"
                    style={{
                      backgroundImage: 'url("https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000&auto=format&fit=crop")'
                    }}
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-mono text-zinc-400 border border-white/10">
                    CANVAS OBS: 1920x1080 (Fundo Transparente)
                  </div>

                  {/* Elemento do Lower Thirds na prévia */}
                  <div className="relative z-10 w-full max-w-lg mx-auto text-center space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white shadow-md">
                      <Music size={11} className="text-blue-400" />
                      <span>Porque Ele Vive • Harpa Cristã</span>
                    </div>

                    <div className={`py-2 px-4 rounded-xl ${obsStyle === 'bar' ? 'bg-black/80 backdrop-blur-md border border-white/15 shadow-xl' : ''}`}>
                      <p 
                        className="text-white font-extrabold text-sm sm:text-base leading-tight"
                        style={{
                          textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.8)'
                        }}
                      >
                        Deus enviou Seu Filho amado<br />Pra perdoar, pra me salvar
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opções de Estilo para a Live */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Estilo Visual da Legenda</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setObsStyle('bar')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase transition-all ${
                        obsStyle === 'bar'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Tarja Fosca (TV)
                    </button>
                    <button
                      onClick={() => setObsStyle('clean')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase transition-all ${
                        obsStyle === 'clean'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Texto Puro + Sombra
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Posicionamento na Tela</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setObsPosition('bottom')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase transition-all ${
                        obsPosition === 'bottom'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Rodapé (Padrão)
                    </button>
                    <button
                      onClick={() => setObsPosition('center')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase transition-all ${
                        obsPosition === 'center'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Centro da Tela
                    </button>
                  </div>
                </div>
              </div>

              {/* Link Copiável para o OBS */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>URL para Adicionar no OBS Studio</span>
                  {copiedObsUrl && <span className="text-emerald-400 text-xs font-black">Copiado para a área de transferência! ✓</span>}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    type="text"
                    value={obsUrl}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(obsUrl);
                      setCopiedObsUrl(true);
                      setTimeout(() => setCopiedObsUrl(false), 2500);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 active:scale-95 transition-all shadow-md"
                  >
                    {copiedObsUrl ? <Check size={15} /> : <Copy size={15} />}
                    Copiar
                  </button>
                </div>
              </div>

              {/* Guia Rápido Passo a Passo */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <HelpCircle size={15} className="text-indigo-400" />
                  Como Configurar no OBS Studio em 3 Passos:
                </h4>
                <ol className="text-xs text-zinc-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>No OBS, no painel <strong>Fontes</strong>, clique em <strong>+</strong> e escolha <strong>Navegador</strong> (Browser).</li>
                  <li>Cole o link copiado no campo <strong>URL</strong>, defina Largura: <code className="text-indigo-300 font-bold">1920</code> e Altura: <code className="text-indigo-300 font-bold">1080</code>.</li>
                  <li>Marque a opção <em>"Atualizar o navegador quando a cena se tornar ativa"</em> e clique em <strong>OK</strong>. Pronto!</li>
                </ol>
              </div>
            </div>
          )}

          {/* ABA 2: RETORNO DE PALCO (STAGE DISPLAY) */}
          {activeTab === 'stage' && (
            <div className="space-y-6">
              {/* Banner Descritivo */}
              <div className="bg-gradient-to-r from-amber-950/50 via-zinc-900 to-amber-950/30 p-4 rounded-2xl border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                    <Monitor size={14} />
                    <span>TV do Púlpito & Monitores dos Músicos</span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    Exibe em alta visibilidade o <strong>verso atual em letras gigantes</strong>, o <strong>próximo verso</strong> para os cantores não errarem a entrada, e o relógio em tempo real.
                  </p>
                </div>

                <a
                  href={stageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black flex items-center gap-1.5 shrink-0 transition-all shadow-md"
                >
                  <ExternalLink size={14} />
                  <span>Abrir Tela de Retorno</span>
                </a>
              </div>

              {/* QR Code e Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* QR Code para abrir no celular/tablet no púlpito */}
                <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center text-center">
                  {stageQrDataUrl ? (
                    <div className="p-2 bg-white rounded-xl shadow-lg">
                      <img src={stageQrDataUrl} alt="QR Code Retorno de Palco" className="w-44 h-44 object-contain" />
                    </div>
                  ) : (
                    <div className="w-44 h-44 bg-zinc-900 rounded-xl flex items-center justify-center animate-pulse">
                      <QrCode size={36} className="text-zinc-600" />
                    </div>
                  )}
                  <p className="text-xs font-bold text-zinc-300 mt-3">
                    Aponte a câmera do Celular / Tablet
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Ideal para colocar no suporte de partitura ou teclado
                  </p>
                </div>

                {/* Vantagens e link direto */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">Recursos do Stage Display:</h4>
                    <ul className="text-xs text-zinc-400 space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span><strong>Verso Atual:</strong> Fonte gigante antirreflexo</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span><strong>Próximo Verso:</strong> Alerta antecipado da estrofe</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span><strong>Relógio de Culto:</strong> Horário preciso com segundos</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span><strong>Timer Regressivo:</strong> Countdown do início ou sermão</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                      <span>Link Direto para o Retorno</span>
                      {copiedStageUrl && <span className="text-emerald-400 text-xs font-black">Copiado! ✓</span>}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        type="text"
                        value={stageUrl}
                        className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-mono select-all focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(stageUrl);
                          setCopiedStageUrl(true);
                          setTimeout(() => setCopiedStageUrl(false), 2500);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs shrink-0 active:scale-95 transition-all border border-zinc-700"
                      >
                        {copiedStageUrl ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: HOLYRICS (INTEGRAÇÃO COMPLETA) */}
          {activeTab === 'holyrics' && (
            <div className="space-y-5">
              {/* SUB-TABS DO HOLYRICS */}
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto custom-scrollbar">
                <button
                  type="button"
                  onClick={() => setHolyricsSubTab('script')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    holyricsSubTab === 'script'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Zap size={14} /> ⚡ Script Instantâneo (1 Clique)
                </button>

                <button
                  type="button"
                  onClick={() => setHolyricsSubTab('zip')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    holyricsSubTab === 'zip'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Download size={14} /> 📁 Pacote .ZIP (Músicas)
                </button>

                <button
                  type="button"
                  onClick={() => setHolyricsSubTab('import')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    holyricsSubTab === 'import'
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Upload size={14} /> 📥 Importar do Holyrics
                </button>

                <button
                  type="button"
                  onClick={() => setHolyricsSubTab('official')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    holyricsSubTab === 'official'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sparkles size={14} /> ⭐ Menu Oficial Holyrics
                </button>
              </div>

              {/* SUB-ABA 1: SCRIPT INSTANTÂNEO 1 CLIQUE */}
              {holyricsSubTab === 'script' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Hero Card */}
                  <div className="bg-gradient-to-r from-amber-950/40 via-zinc-950 to-zinc-950 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                      <Zap size={12} /> Automação Nativa Holyrics JSLib
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
                      Sincronização em 1 Clique para a Playlist do Holyrics
                    </h3>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Crie um botão inteligente dentro do Holyrics. Com apenas um clique, o Holyrics pesquisa as músicas do repertório do LiLouPro no seu acervo e as insere na ordem exata do culto!
                    </p>
                  </div>

                  {/* Ação 1: No LiLouPro (Copiar Lista) */}
                  <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <CheckCircle2 size={14} /> Passo 1: No LiLouPro
                        </span>
                        <p className="text-[11px] text-zinc-400">
                          Escolha o culto e copie a lista das músicas:
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-1 rounded-lg">
                        {serviceSongs.length} música(s) no culto
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <select
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs focus:outline-none"
                      >
                        {allServices.map((svc: any) => (
                          <option key={svc.id} value={svc.id}>
                            {svc.title || svc.name || 'Culto sem título'} {svc.date ? `(${svc.date})` : ''}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={handleCopySongList}
                        disabled={serviceSongs.length === 0}
                        className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer shadow-md active:scale-95 ${
                          copiedSongList 
                            ? 'bg-emerald-500 text-slate-950 scale-105' 
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        }`}
                      >
                        {copiedSongList ? (
                          <>
                            <Check size={16} strokeWidth={3} />
                            <span>✓ Lista Copiada! Agora execute no Holyrics</span>
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            <span>Copiar Lista do Culto para o Holyrics</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Prévia das Músicas */}
                    <div className="pt-2 border-t border-zinc-900">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                        Ordem do Culto Selecionado:
                      </p>
                      {serviceSongs.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {serviceSongs.map((s, idx) => (
                            <div key={idx} className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-amber-400 font-bold">{idx + 1}º</span>
                              <span className="font-semibold">{s.title}</span>
                              {s.key && <span className="text-[10px] text-zinc-500">[{s.key}]</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 italic">
                          Nenhuma música vinculada a este culto ainda.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ação 2: Código do Script para Colar no Holyrics */}
                  <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Code size={14} /> Passo 2: Código do Script do Holyrics (Fazer apenas uma vez)
                        </span>
                        <p className="text-[11px] text-zinc-400">
                          Cole este código no menu <strong>Ferramentas &gt; Script</strong> do Holyrics:
                        </p>
                      </div>

                      <button
                        onClick={handleCopyScript}
                        className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                          copiedScript
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                        }`}
                      >
                        {copiedScript ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
                        {copiedScript ? 'Código Copiado!' : 'Copiar Código'}
                      </button>
                    </div>

                    <div className="relative">
                      <pre className="p-4 rounded-xl bg-black/80 border border-zinc-800 font-mono text-[11px] text-zinc-300 leading-relaxed overflow-x-auto max-h-52 custom-scrollbar select-all">
                        {HOLYRICS_JAVASCRIPT_SCRIPT}
                      </pre>
                    </div>
                  </div>

                  {/* Guia Didático Passo a Passo (4 Etapas Ilustradas) */}
                  <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-200">
                      <BookOpen size={16} className="text-amber-400" />
                      <span>Guia Didático: Como Configurar no Holyrics em 30 Segundos</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Etapa 1 */}
                      <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">1</span>
                          <span className="font-bold text-zinc-100">Abrir o Editor de Scripts</span>
                        </div>
                        <p className="text-zinc-400 text-[11px] leading-relaxed pl-7">
                          No Holyrics, clique no menu superior <strong>Ferramentas &gt; Script</strong> (ou <em>Ferramentas &gt; Diversos &gt; Script</em>).
                        </p>
                      </div>

                      {/* Etapa 2 */}
                      <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">2</span>
                          <span className="font-bold text-zinc-100">Criar Novo Script</span>
                        </div>
                        <p className="text-zinc-400 text-[11px] leading-relaxed pl-7">
                          Clique em <strong>Novo (+)</strong>, informe o nome: <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded">Importar LiLouPro</code> e cole o código acima.
                        </p>
                      </div>

                      {/* Etapa 3 */}
                      <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">3</span>
                          <span className="font-bold text-zinc-100">Salvar e Fixar nos Favoritos</span>
                        </div>
                        <p className="text-zinc-400 text-[11px] leading-relaxed pl-7">
                          Clique em <strong>Salvar</strong>. Clique com o botão direito sobre o script e selecione <em>Adicionar aos Favoritos</em> para ter um botão de 1 clique na tela principal!
                        </p>
                      </div>

                      {/* Etapa 4 */}
                      <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">4</span>
                          <span className="font-bold text-zinc-100">Pronto! Usar no Culto</span>
                        </div>
                        <p className="text-zinc-400 text-[11px] leading-relaxed pl-7">
                          No LiLouPro, clique em <strong>"Copiar Lista do Culto"</strong>. No Holyrics, clique no seu novo botão. As músicas entram direto na playlist!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-ABA 2: EXPORTAR PACOTE .ZIP */}
              {holyricsSubTab === 'zip' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
                        <Download size={15} />
                        <span>Exportar Repertório Completo (.zip)</span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Gera um arquivo <strong>.zip</strong> com todas as músicas do culto formatadas em arquivos <code>.txt</code> compatíveis com o padrão do Holyrics (com tags de estrofes <code>[v1]</code>, refrão <code>[c]</code>, tom e andamento).
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <label className="text-xs font-bold text-zinc-300 shrink-0">Culto:</label>
                      <select
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs focus:outline-none"
                      >
                        {allServices.map((svc: any) => (
                          <option key={svc.id} value={svc.id}>
                            {svc.title || svc.name || 'Culto sem título'} {svc.date ? `(${svc.date})` : ''}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={handleDownloadHolyricsZip}
                        disabled={isExportingZip || serviceSongs.length === 0}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 active:scale-95 transition-all shadow-md cursor-pointer"
                      >
                        {isExportingZip ? (
                          <span>Gerando .ZIP...</span>
                        ) : exportSuccess ? (
                          <>
                            <Check size={15} />
                            <span>Baixado com Sucesso!</span>
                          </>
                        ) : (
                          <>
                            <Download size={15} />
                            <span>Baixar Pacote Holyrics (.zip)</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80">
                      <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                        Músicas neste Culto ({serviceSongs.length}):
                      </p>
                      {serviceSongs.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {serviceSongs.map((s, idx) => (
                            <div key={idx} className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-1.5">
                              <Music size={11} className="text-emerald-400" />
                              <span className="font-semibold">{s.title}</span>
                              {s.key && <span className="text-[10px] text-zinc-500">[{s.key}]</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 italic">
                          Nenhuma música vinculada a este culto ainda.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-ABA 3: IMPORTAR DO HOLYRICS */}
              {holyricsSubTab === 'import' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-violet-400 text-xs font-black uppercase tracking-wider">
                        <Upload size={15} />
                        <span>Importar Músicas do Holyrics para o LiLouPro</span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Selecione um ou vários arquivos <code>.txt</code> de músicas exportados do Holyrics. O LiLouPro extrairá o título, autor, tom e estrofes automaticamente para o repertório da sua congregação!
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex-1 border-2 border-dashed border-zinc-700 hover:border-violet-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-zinc-900/40 group">
                        <input
                          type="file"
                          accept=".txt"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <FileText size={24} className="text-zinc-500 group-hover:text-violet-400 transition-colors" />
                          <span className="text-xs font-bold text-zinc-300 group-hover:text-white">
                            Clique para escolher arquivos .txt do Holyrics
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            Você pode selecionar múltiplos arquivos de uma vez
                          </span>
                        </div>
                      </label>
                    </div>

                    {importSuccessCount !== null && (
                      <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
                        <Check size={16} />
                        <span>{importSuccessCount} música(s) importada(s) com sucesso para o repertório da igreja!</span>
                      </div>
                    )}

                    {importedSongsPreview.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-zinc-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-300">
                            {importedSongsPreview.length} música(s) identificada(s):
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setImportedSongsPreview([])}
                              className="text-xs text-zinc-500 hover:text-zinc-300 font-bold px-2 py-1 cursor-pointer"
                            >
                              Limpar
                            </button>
                            <button
                              onClick={handleSaveImportedSongs}
                              disabled={isSavingImport}
                              className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                            >
                              {isSavingImport ? <span>Salvando...</span> : <span>Salvar no Repertório</span>}
                            </button>
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                          {importedSongsPreview.map((s, idx) => (
                            <div key={idx} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-xs flex items-center justify-between">
                              <div>
                                <p className="font-bold text-zinc-100">{s.title}</p>
                                <p className="text-[11px] text-zinc-400">
                                  {s.artist || 'Desconhecido'} {s.baseKey ? `• Tom: ${s.baseKey}` : ''}
                                </p>
                              </div>
                              <button
                                onClick={() => setImportedSongsPreview(prev => prev.filter((_, i) => i !== idx))}
                                className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-ABA 4: HOMOLOGAÇÃO OFICIAL NO MENU DO HOLYRICS */}
              {holyricsSubTab === 'official' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="bg-gradient-to-br from-blue-950/40 via-zinc-950 to-zinc-950 border border-blue-500/30 rounded-2xl p-5 space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-500/30">
                      <Sparkles size={12} /> Integração Nativa no Menu Oficial
                    </div>
                    <h3 className="text-base font-black text-white tracking-tight">
                      Inclusão do LiLouPro em "Arquivo &gt; Importar lista externa"
                    </h3>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Assim como o <strong>LouveApp</strong>, <strong>Asaph</strong>, <strong>LouviO</strong> e <strong>Voluts</strong> foram adicionados na lista nativa pelo desenvolvedor do Holyrics, o LiLouPro possui uma estrutura de API padronizada pronta para ser homologada oficialmente.
                    </p>
                  </div>

                  <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4">
                    <h4 className="text-xs font-black text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                      <Info size={15} className="text-blue-400" />
                      Como Funciona a Homologação Técnica:
                    </h4>

                    <div className="space-y-2.5 text-xs text-zinc-300">
                      <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex items-start gap-2.5">
                        <span className="font-black text-blue-400 shrink-0">1.</span>
                        <p>O Holyrics é um software desktop mantido pelo desenvolvedor Felipe e sua equipe. O menu "Importar lista externa" é embutido no código-fonte do executável do programa.</p>
                      </div>

                      <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex items-start gap-2.5">
                        <span className="font-black text-blue-400 shrink-0">2.</span>
                        <p>O LiLouPro já disponibiliza as escalas e os cultos com dados completos (títulos, estrofes, tom, andamento e ordem das músicas).</p>
                      </div>

                      <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex items-start gap-2.5">
                        <span className="font-black text-blue-400 shrink-0">3.</span>
                        <p>Você pode solicitar a homologação enviando um e-mail para <strong className="text-white">contato@holyrics.com.br</strong> ou pelo grupo oficial de suporte e desenvolvedores do Holyrics. A equipe costuma acolher novas plataformas de ministérios de louvor do Brasil com grande satisfação!</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RODAPÉ */}
        <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-6 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-all"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
