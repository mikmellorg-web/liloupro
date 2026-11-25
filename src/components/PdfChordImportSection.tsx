import React, { useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  AlertTriangle,
  Sparkles,
  FileWarning,
  RotateCcw,
  RefreshCw,
  Save
} from 'lucide-react';
import { PdfIcon } from './PdfIcon';
import {
  ExtractedPdfSong,
  FailedPdfChunkInfo,
  PdfExtractionProgress,
  RawExtractedPdfSong,
  classifyExtractedPdfSongs,
  extractSongsFromPdfFile,
  mergeChunkSongsIntoAccumulated,
  normalizeTitleForDuplicateCheck,
  retryFailedPdfChunk,
  sanitizeRawApiErrorMessage,
  validatePdfFileSize
} from '../utils/pdfChordImportUtils';

interface PdfChordImportSectionProps {
  isLight: boolean;
  existingSongs: any[];
  disabled?: boolean;
  onReviewActiveChange?: (active: boolean) => void;
  onPopulateSingleFields?: (title: string, artist: string) => void;
  onSaveExtractedSongs: (songsToSave: ExtractedPdfSong[]) => Promise<void>;
}

const COMMON_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bbm', 'Bm'
];

export function PdfChordImportSection({
  isLight,
  existingSongs,
  disabled = false,
  onReviewActiveChange,
  onPopulateSingleFields,
  onSaveExtractedSongs
}: PdfChordImportSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);

  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressState, setProgressState] = useState<{
    fileIndex: number;
    totalFiles: number;
    fileName: string;
    chunkIndex: number;
    totalChunks: number;
    pageStart: number;
    pageEnd: number;
    totalPages: number;
    songsFoundTotal: number;
    percent: number;
  } | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [partialWarnings, setPartialWarnings] = useState<string[]>([]);
  const [failedChunks, setFailedChunks] = useState<FailedPdfChunkInfo[]>([]);
  const [isRetryingFailedChunks, setIsRetryingFailedChunks] = useState(false);
  const [extractedSongs, setExtractedSongs] = useState<ExtractedPdfSong[]>([]);
  const [expandedSongIds, setExpandedSongIds] = useState<Record<string, boolean>>({});
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  const updateReviewActive = (nextSongs: ExtractedPdfSong[]) => {
    onReviewActiveChange?.(nextSongs.length > 0);
  };

  const handleTriggerFilePicker = () => {
    if (disabled || isExtracting || isSavingBatch) return;
    setExtractError(null);
    fileInputRef.current?.click();
  };

  const handleResetPdfImport = () => {
    setExtractedSongs([]);
    setExpandedSongIds({});
    setExtractError(null);
    setPartialWarnings([]);
    setFailedChunks([]);
    setIsRetryingFailedChunks(false);
    setProgressText('');
    setProgressState(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onReviewActiveChange?.(false);
  };

  const processPdfFiles = async (rawFiles: File[]) => {
    if (!rawFiles || rawFiles.length === 0) return;

    const files = rawFiles.filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    const ignoredCount = rawFiles.length - files.length;

    if (files.length === 0) {
      setExtractError('Apenas arquivos no formato PDF (.pdf) são aceitos.');
      return;
    }

    setIsExtracting(true);
    setExtractError(null);
    setPartialWarnings([]);
    setFailedChunks([]);
    setExtractedSongs([]);
    setExpandedSongIds({});
    onReviewActiveChange?.(false);

    const collectedRaw: Array<{
      titulo: string;
      artista: string;
      tom: string;
      bpm: number | null;
      cifra: string;
      sourceFileName: string;
    }> = [];
    const warnings: string[] = [];
    const collectedFailedChunks: FailedPdfChunkInfo[] = [];

    if (ignoredCount > 0) {
      warnings.push(
        ignoredCount === 1
          ? '1 arquivo ignorado: apenas arquivos PDF (.pdf) são aceitos.'
          : `${ignoredCount} arquivos ignorados: apenas arquivos PDF (.pdf) são aceitos.`
      );
    }

    // Validação prévia do limite de segurança de 25 MB por arquivo
    const validSizedFiles: File[] = [];
    for (const file of files) {
      const sizeError = validatePdfFileSize(file);
      if (sizeError) {
        warnings.push(sizeError);
      } else {
        validSizedFiles.push(file);
      }
    }

    if (validSizedFiles.length === 0) {
      setIsExtracting(false);
      setProgressState(null);
      setExtractError(
        warnings[0] ||
          'Os arquivos selecionados ultrapassam o limite máximo de 25 MB por PDF.'
      );
      return;
    }

    try {
      for (let i = 0; i < validSizedFiles.length; i += 1) {
        const file = validSizedFiles[i];
        const songsBeforeCurrentFile = collectedRaw.length;
        const failedCountBeforeFile = collectedFailedChunks.length;

        setProgressText(
          validSizedFiles.length === 1
            ? `Preparando "${file.name}"...`
            : `Preparando arquivo ${i + 1} de ${validSizedFiles.length}: "${file.name}"...`
        );
        setProgressState({
          fileIndex: i + 1,
          totalFiles: validSizedFiles.length,
          fileName: file.name,
          chunkIndex: 1,
          totalChunks: 1,
          pageStart: 1,
          pageEnd: 1,
          totalPages: 1,
          songsFoundTotal: songsBeforeCurrentFile,
          percent: Math.round((i / validSizedFiles.length) * 100)
        });

        try {
          const foundInFile = await extractSongsFromPdfFile(file, {
            totalFiles: validSizedFiles.length,
            onProgress: (p: PdfExtractionProgress) => {
              const songsFoundTotal = songsBeforeCurrentFile + p.songsFoundInFile;
              const overallPercent = Math.min(
                100,
                Math.round(((i + p.chunkPercent / 100) / validSizedFiles.length) * 100)
              );
              const songsLabel =
                songsFoundTotal === 1
                  ? '1 música encontrada'
                  : `${songsFoundTotal} músicas encontradas`;
              const detailedText =
                p.statusMessage ||
                `Processando bloco ${p.chunkIndex} de ${p.totalChunks} (páginas ${p.pageStart}–${p.pageEnd} de ${p.totalPages})... ${songsLabel}`;

              setProgressText(detailedText);
              setProgressState({
                fileIndex: i + 1,
                totalFiles: validSizedFiles.length,
                fileName: p.fileName,
                chunkIndex: p.chunkIndex,
                totalChunks: p.totalChunks,
                pageStart: p.pageStart,
                pageEnd: p.pageEnd,
                totalPages: p.totalPages,
                songsFoundTotal,
                percent: overallPercent
              });
            },
            onChunkWarning: (chunkWarning: string) => {
              warnings.push(chunkWarning);
            },
            onChunkFailed: (failedChunk: FailedPdfChunkInfo) => {
              collectedFailedChunks.push(failedChunk);
            }
          });

          const fileHadFailedChunks =
            collectedFailedChunks.length > failedCountBeforeFile;

          if (foundInFile.length === 0 && !fileHadFailedChunks) {
            warnings.push(`Nenhuma cifra identificável encontrada em "${file.name}".`);
          } else {
            for (const song of foundInFile) {
              collectedRaw.push({
                ...song,
                sourceFileName: file.name
              });
            }
          }
        } catch (fileErr: any) {
          const friendlyMsg = sanitizeRawApiErrorMessage(
            fileErr,
            `Não foi possível ler "${file.name}" devido à instabilidade temporária do servidor.`
          );
          if (!warnings.includes(friendlyMsg)) {
            warnings.push(friendlyMsg);
          }
        }
      }

      setFailedChunks(collectedFailedChunks);

      if (collectedRaw.length === 0) {
        setExtractError(
          warnings[0] ||
            'Não encontramos cifras legíveis nos PDFs selecionados. Verifique se o arquivo contém letras/acordes visíveis e tente novamente.'
        );
        return;
      }

      const classified = classifyExtractedPdfSongs(collectedRaw, existingSongs);
      setExtractedSongs(classified);
      setPartialWarnings(warnings);
      updateReviewActive(classified);

      // Se encontrou apenas 1 música nova, preenche automaticamente os campos do topo do modal e abre revisão completa
      if (classified.length === 1 && classified[0].status === 'new') {
        onPopulateSingleFields?.(classified[0].titulo, classified[0].artista);
        setExpandedSongIds({ [classified[0].id]: true });
      }
    } catch (err: any) {
      setExtractError(
        sanitizeRawApiErrorMessage(
          err,
          'Erro inesperado ao processar os PDFs devido à instabilidade temporária do servidor. Tente novamente.'
        )
      );
    } finally {
      setIsExtracting(false);
      setProgressText('');
      setProgressState(null);
    }
  };

  /**
   * Reprocessa exclusivamente os blocos de páginas que falharam e mescla as músicas
   * recuperadas com a lista já extraída sem perder nenhuma música ou edição já feita.
   */
  const handleRetryFailedChunks = async () => {
    if (failedChunks.length === 0 || isExtracting || isRetryingFailedChunks || isSavingBatch) {
      return;
    }

    const chunksToRetry = [...failedChunks];
    setIsRetryingFailedChunks(true);
    setIsExtracting(true);
    setExtractError(null);

    const stillFailed: FailedPdfChunkInfo[] = [];
    const recoveredByFile = new Map<string, RawExtractedPdfSong[]>();
    const previousSelectionByNormTitle = new Map<string, boolean>();
    extractedSongs.forEach((s) => {
      const nt = normalizeTitleForDuplicateCheck(s.titulo);
      if (nt) previousSelectionByNormTitle.set(nt, s.selected);
    });

    try {
      for (let i = 0; i < chunksToRetry.length; i += 1) {
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }

        const chunk = chunksToRetry[i];
        const basePercent = Math.round((i / chunksToRetry.length) * 100);
        const pageLabel =
          chunk.pageStart === chunk.pageEnd
            ? `página ${chunk.pageStart}`
            : `páginas ${chunk.pageStart}–${chunk.pageEnd}`;

        setProgressText(
          `Reprocessando bloco ${i + 1} de ${chunksToRetry.length} (${pageLabel} de ${chunk.totalPages})...`
        );
        setProgressState({
          fileIndex: 1,
          totalFiles: 1,
          fileName: chunk.fileName,
          chunkIndex: chunk.chunkIndex,
          totalChunks: chunk.totalChunks,
          pageStart: chunk.pageStart,
          pageEnd: chunk.pageEnd,
          totalPages: chunk.totalPages,
          songsFoundTotal: extractedSongs.length,
          percent: basePercent
        });

        try {
          const recoveredSongs = await retryFailedPdfChunk(chunk, (p) => {
            if (p.statusMessage) {
              setProgressText(p.statusMessage);
            }
          });

          if (recoveredSongs.length > 0) {
            const currentFileSongs = recoveredByFile.get(chunk.fileName) || [];
            recoveredByFile.set(
              chunk.fileName,
              mergeChunkSongsIntoAccumulated(currentFileSongs, recoveredSongs, true)
            );
          }
        } catch {
          stillFailed.push(chunk);
        }

        setProgressState({
          fileIndex: 1,
          totalFiles: 1,
          fileName: chunk.fileName,
          chunkIndex: chunk.chunkIndex,
          totalChunks: chunk.totalChunks,
          pageStart: chunk.pageStart,
          pageEnd: chunk.pageEnd,
          totalPages: chunk.totalPages,
          songsFoundTotal: extractedSongs.length,
          percent: Math.round(((i + 1) / chunksToRetry.length) * 100)
        });
      }

      // Mescla as músicas já existentes na tela com as recém-recuperadas por arquivo
      const fileOrder: string[] = [];
      const songsByFile = new Map<string, RawExtractedPdfSong[]>();

      for (const existing of extractedSongs) {
        const fName = existing.sourceFileName || 'arquivo.pdf';
        if (!songsByFile.has(fName)) {
          fileOrder.push(fName);
          songsByFile.set(fName, []);
        }
        songsByFile.get(fName)!.push({
          titulo: existing.titulo,
          artista: existing.artista,
          tom: existing.tom,
          bpm: existing.bpm,
          cifra: existing.cifra
        });
      }

      recoveredByFile.forEach((recoveredList, fName) => {
        if (!songsByFile.has(fName)) {
          fileOrder.push(fName);
          songsByFile.set(fName, []);
        }
        const mergedForFile = mergeChunkSongsIntoAccumulated(
          songsByFile.get(fName)!,
          recoveredList,
          true
        );
        songsByFile.set(fName, mergedForFile);
      });

      const mergedAllRaw: Array<RawExtractedPdfSong & { sourceFileName: string }> = [];
      for (const fName of fileOrder) {
        const list = songsByFile.get(fName) || [];
        for (const item of list) {
          mergedAllRaw.push({
            ...item,
            sourceFileName: fName
          });
        }
      }

      const reclassified = classifyExtractedPdfSongs(mergedAllRaw, existingSongs).map(
        (song) => {
          const nt = normalizeTitleForDuplicateCheck(song.titulo);
          if (nt && previousSelectionByNormTitle.has(nt)) {
            return { ...song, selected: previousSelectionByNormTitle.get(nt)! };
          }
          return song;
        }
      );

      // Atualiza avisos removendo os blocos que foram recuperados com sucesso
      const retriedMessages = new Set(chunksToRetry.map((c) => c.friendlyMessage));
      const nonChunkWarnings = partialWarnings.filter((w) => !retriedMessages.has(w));
      const updatedWarnings = [
        ...nonChunkWarnings,
        ...stillFailed.map((c) => c.friendlyMessage)
      ];

      setFailedChunks(stillFailed);
      setPartialWarnings(updatedWarnings);

      if (reclassified.length > 0) {
        setExtractedSongs(reclassified);
        updateReviewActive(reclassified);
        if (reclassified.length === 1 && reclassified[0].status === 'new') {
          onPopulateSingleFields?.(reclassified[0].titulo, reclassified[0].artista);
          setExpandedSongIds({ [reclassified[0].id]: true });
        }
      } else if (stillFailed.length > 0) {
        setExtractError(stillFailed[0].friendlyMessage);
      }
    } finally {
      setIsRetryingFailedChunks(false);
      setIsExtracting(false);
      setProgressText('');
      setProgressState(null);
    }
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const rawFiles = Array.from(fileList);

    // Limpa o input para permitir selecionar o mesmo arquivo novamente se desejar
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    await processPdfFiles(rawFiles);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isExtracting || isSavingBatch) return;
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isExtracting || isSavingBatch) return;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (disabled || isExtracting || isSavingBatch) return;

    const droppedFiles = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
    if (droppedFiles.length === 0) return;

    await processPdfFiles(droppedFiles);
  };

  const toggleSongSelected = (id: string) => {
    setExtractedSongs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const toggleSongExpanded = (id: string) => {
    setExpandedSongIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateSongField = (
    id: string,
    field: 'titulo' | 'artista' | 'tom' | 'bpm' | 'cifra',
    value: string
  ) => {
    setExtractedSongs((prev) =>
      prev.map((song) => {
        if (song.id !== id) return song;
        if (field === 'bpm') {
          const digits = value.replace(/\D/g, '');
          const parsed = digits ? Math.min(300, Number(digits)) : null;
          return { ...song, bpm: parsed };
        }
        const updated = { ...song, [field]: value };
        if (prev.length === 1 && prev[0].status === 'new' && (field === 'titulo' || field === 'artista')) {
          onPopulateSingleFields?.(updated.titulo, updated.artista);
        }
        return updated;
      })
    );
  };

  const handleSelectOnlyNew = () => {
    setExtractedSongs((prev) =>
      prev.map((s) => ({ ...s, selected: s.status === 'new' }))
    );
  };

  const handleConfirmImport = async () => {
    const selectedSongs = extractedSongs.filter((s) => s.selected && s.titulo.trim());
    if (selectedSongs.length === 0) return;

    setIsSavingBatch(true);
    setExtractError(null);
    try {
      await onSaveExtractedSongs(selectedSongs);
    } catch (err: any) {
      setExtractError(err?.message || 'Não foi possível salvar as músicas importadas.');
    } finally {
      setIsSavingBatch(false);
    }
  };

  const isSingleNewSong =
    extractedSongs.length === 1 && extractedSongs[0].status === 'new';

  const newCount = extractedSongs.filter((s) => s.status === 'new').length;
  const duplicateCount = extractedSongs.filter((s) => s.status === 'duplicate').length;
  const versionCount = extractedSongs.filter((s) => s.status === 'version').length;
  const selectedSongsList = extractedSongs.filter((s) => s.selected && s.titulo.trim());
  const selectedCount = selectedSongsList.length;
  const onlyNewSelected =
    selectedCount > 0 && selectedSongsList.every((s) => s.status === 'new');

  const importButtonLabel = (() => {
    if (isSavingBatch) {
      return selectedCount === 1
        ? 'Salvando música no repertório...'
        : `Importando ${selectedCount} músicas...`;
    }
    if (isSingleNewSong) {
      return 'Salvar Música no Repertório';
    }
    if (selectedCount === 0) {
      return 'Selecione ao menos 1 música para importar';
    }
    if (onlyNewSelected) {
      return selectedCount === 1
        ? 'Importar 1 Música Nova'
        : `Importar ${selectedCount} Músicas Novas`;
    }
    return selectedCount === 1
      ? 'Importar 1 Música Selecionada'
      : `Importar ${selectedCount} Músicas Selecionadas`;
  })();

  return (
    <div className="space-y-3">
      {/* Input oculto para seleção de 1 ou múltiplos PDFs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="application/pdf,.pdf"
        onChange={handleFilesSelected}
        className="hidden"
      />

      {/* Separador discreto */}
      <div className="flex items-center gap-2.5 pt-0.5">
        <div className={`h-px flex-1 ${isLight ? 'bg-slate-200' : 'bg-slate-700/80'}`} />
        <span
          className={`text-[10px] font-extrabold uppercase tracking-widest ${
            isLight ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          OU IMPORTE SEUS ARQUIVOS
        </span>
        <div className={`h-px flex-1 ${isLight ? 'bg-slate-200' : 'bg-slate-700/80'}`} />
      </div>

      {/* Área de Dropzone Interativa (Clique ou Arraste e Solte PDFs) */}
      <button
        type="button"
        onClick={handleTriggerFilePicker}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        disabled={disabled || isExtracting || isSavingBatch}
        className={`w-full py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 active:scale-98 min-h-[54px] ${
          isDragging
            ? 'border-dashed border-2 border-blue-400 bg-blue-500/15 text-blue-300 shadow-lg shadow-blue-500/20 scale-[1.01]'
            : isLight
            ? 'border bg-red-50/80 hover:bg-red-100/80 border-red-200 text-slate-900 shadow-xs'
            : 'border bg-slate-900/90 hover:bg-slate-800/95 border-red-500/35 hover:border-red-400/60 text-white shadow-md shadow-black/25'
        }`}
      >
        <PdfIcon className="w-5 h-5 shrink-0 pointer-events-none" />
        <div className="text-left min-w-0 pointer-events-none">
          {isDragging ? (
            <div className={`text-xs font-extrabold leading-tight ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>
              Solte os PDFs aqui para importar
            </div>
          ) : (
            <>
              <div className="text-xs font-extrabold leading-tight">
                Importar Cifras de PDF (Individual ou Lote)
              </div>
              <div
                className={`text-[10px] font-medium mt-0.5 leading-tight ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Clique para escolher ou arraste 1 ou vários PDFs para cá
              </div>
            </>
          )}
        </div>
      </button>

      {/* Estado de carregamento com barra de progresso real por bloco/páginas */}
      {isExtracting && (
        <div
          className={`p-3.5 rounded-xl border space-y-2.5 animate-in fade-in duration-150 ${
            isLight
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-blue-950/35 border-blue-500/35 text-blue-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold flex items-center gap-1.5 min-w-0">
                  <Sparkles size={13} className="text-blue-400 shrink-0" />
                  <span className="truncate">Lendo PDFs e extraindo cifras com IA...</span>
                </div>
                {progressState && (
                  <span
                    className={`text-[11px] font-black tabular-nums shrink-0 ${
                      isLight ? 'text-blue-700' : 'text-blue-300'
                    }`}
                  >
                    {progressState.percent}%
                  </span>
                )}
              </div>
              {progressState && progressState.totalFiles > 1 && (
                <p
                  className={`text-[10px] font-semibold truncate mt-0.5 ${
                    isLight ? 'text-blue-600' : 'text-blue-300/75'
                  }`}
                >
                  Arquivo {progressState.fileIndex} de {progressState.totalFiles}: &ldquo;{progressState.fileName}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Barra de progresso real */}
          <progress
            value={progressState?.percent ?? 5}
            max={100}
            className="w-full h-2 rounded-full overflow-hidden block [&::-webkit-progress-bar]:bg-blue-500/20 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-blue-500 [&::-webkit-progress-value]:to-emerald-500 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-300 [&::-moz-progress-bar]:bg-blue-500"
          />

          {progressText && (
            <p
              className={`text-[11px] font-medium leading-snug ${
                isLight ? 'text-blue-800' : 'text-blue-200/90'
              }`}
            >
              {progressText}
            </p>
          )}
        </div>
      )}

      {/* Erro na extração */}
      {extractError && !isExtracting && (
        <div
          className={`p-3 rounded-xl border text-xs leading-relaxed space-y-2.5 animate-in fade-in duration-150 ${
            isLight
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-red-950/35 border-red-500/40 text-red-200'
          }`}
        >
          <div className="flex items-start gap-2">
            <FileWarning size={15} className="shrink-0 mt-0.5 text-red-500" />
            <span>{extractError}</span>
          </div>
          {failedChunks.length > 0 && (
            <button
              type="button"
              onClick={handleRetryFailedChunks}
              disabled={isExtracting || isRetryingFailedChunks || isSavingBatch}
              className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                isLight
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                  : 'bg-red-600/90 hover:bg-red-500 text-white shadow-md shadow-red-950/40'
              }`}
            >
              <RefreshCw size={13} className="shrink-0" />
              <span>Tentar novamente páginas com falha</span>
            </button>
          )}
        </div>
      )}

      {/* Avisos parciais em lote (quando alguns blocos/PDFs falharam mas outros deram certo) */}
      {partialWarnings.length > 0 && extractedSongs.length > 0 && !isExtracting && (
        <div
          className={`p-3 rounded-xl border text-[11px] space-y-2 animate-in fade-in duration-150 ${
            isLight
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-amber-950/30 border-amber-500/35 text-amber-200'
          }`}
        >
          <div className="space-y-1">
            {partialWarnings.map((w, idx) => (
              <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
                <AlertTriangle size={13} className="shrink-0 mt-0.5 text-amber-500" />
                <span>{w}</span>
              </div>
            ))}
          </div>

          {failedChunks.length > 0 && (
            <button
              type="button"
              onClick={handleRetryFailedChunks}
              disabled={isExtracting || isRetryingFailedChunks || isSavingBatch}
              className={`w-full py-2 px-3 rounded-lg font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                isLight
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                  : 'bg-amber-500/25 hover:bg-amber-500/35 border border-amber-400/40 text-amber-200'
              }`}
            >
              <RefreshCw size={13} className="shrink-0" />
              <span>
                Tentar novamente páginas com falha ({failedChunks.length}{' '}
                {failedChunks.length === 1 ? 'bloco' : 'blocos'})
              </span>
            </button>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* REVISÃO DE 1 MÚSICA NOVA EXTRAÍDA DO PDF                           */}
      {/* ================================================================== */}
      {isSingleNewSong && (() => {
        const song = extractedSongs[0];
        return (
          <div
            className={`rounded-xl border p-3.5 space-y-3 animate-in fade-in duration-200 ${
              isLight
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-slate-900/95 border-emerald-500/35'
            }`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                    isLight
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  NOVA
                </span>
                <span
                  className={`text-xs font-bold truncate ${
                    isLight ? 'text-slate-800' : 'text-white'
                  }`}
                >
                  Cifra extraída pronta para revisão
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetPdfImport}
                disabled={isSavingBatch}
                className={`text-[11px] font-semibold flex items-center gap-1 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  isLight
                    ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/70'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <RotateCcw size={12} />
                Limpar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label
                  className={`block text-[11px] font-semibold mb-1 ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}
                >
                  Título
                </label>
                <input
                  type="text"
                  value={song.titulo}
                  onChange={(e) => updateSongField(song.id, 'titulo', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-semibold focus:outline-none focus:border-emerald-500 ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-[11px] font-semibold mb-1 ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}
                >
                  Artista / Ministério
                </label>
                <input
                  type="text"
                  value={song.artista}
                  onChange={(e) => updateSongField(song.id, 'artista', e.target.value)}
                  placeholder="Ministério de Louvor"
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-emerald-500 ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  className={`block text-[11px] font-semibold mb-1 ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}
                >
                  Tom
                </label>
                <select
                  value={COMMON_KEYS.includes(song.tom) ? song.tom : 'C'}
                  onChange={(e) => updateSongField(song.id, 'tom', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-bold focus:outline-none focus:border-emerald-500 ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                >
                  {COMMON_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className={`block text-[11px] font-semibold mb-1 ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}
                >
                  BPM (opcional)
                </label>
                <input
                  type="number"
                  min={40}
                  max={220}
                  value={song.bpm ?? ''}
                  onChange={(e) => updateSongField(song.id, 'bpm', e.target.value)}
                  placeholder="Ex: 72"
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-emerald-500 ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>

            <div>
              <label
                className={`block text-[11px] font-semibold mb-1 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                Cifra Alinhada (Revise se desejar)
              </label>
              <textarea
                value={song.cifra}
                onChange={(e) => updateSongField(song.id, 'cifra', e.target.value)}
                rows={10}
                spellCheck={false}
                className={`w-full p-3 rounded-lg border font-mono text-[11px] leading-relaxed whitespace-pre overflow-x-auto focus:outline-none focus:border-emerald-500 scrollbar-thin ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-700 text-slate-100'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isSavingBatch || !song.titulo.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-950/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              {isSavingBatch ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
              ) : (
                <Save size={15} className="shrink-0" />
              )}
              <span>{importButtonLabel}</span>
            </button>
          </div>
        );
      })()}

      {/* ================================================================== */}
      {/* REVISÃO DE LOTE / CADERNO MULTI-MÚSICAS / DUPLICATA DETECTADA      */}
      {/* ================================================================== */}
      {extractedSongs.length > 0 && !isSingleNewSong && (
        <div
          className={`rounded-xl border p-3.5 space-y-3 animate-in fade-in duration-200 ${
            isLight
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-900/95 border-slate-700/80'
          }`}
        >
          {/* Cabeçalho resumo */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h4
                className={`text-xs font-extrabold ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Encontramos {extractedSongs.length}{' '}
                {extractedSongs.length === 1 ? 'música' : 'músicas'} ({newCount}{' '}
                {newCount === 1 ? 'nova' : 'novas'}, {duplicateCount}{' '}
                {duplicateCount === 1 ? 'já cadastrada' : 'já cadastradas'}
                {versionCount > 0
                  ? `, ${versionCount} ${
                      versionCount === 1 ? 'possível versão' : 'possíveis versões'
                    }`
                  : ''}
                )
              </h4>
              <p
                className={`text-[11px] mt-0.5 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Revise a seleção abaixo ou clique em editar antes de importar para o repertório.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {newCount > 0 && (
                <button
                  type="button"
                  onClick={handleSelectOnlyNew}
                  disabled={isSavingBatch}
                  className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Apenas novas
                </button>
              )}
              <button
                type="button"
                onClick={handleResetPdfImport}
                disabled={isSavingBatch}
                className={`text-[11px] font-semibold flex items-center gap-1 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  isLight
                    ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/70'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <RotateCcw size={12} />
                Limpar
              </button>
            </div>
          </div>

          {/* Lista de músicas encontradas */}
          <div className="max-h-[42vh] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {extractedSongs.map((song) => {
              const isExpanded = Boolean(expandedSongIds[song.id]);
              const statusBadge =
                song.status === 'new'
                  ? {
                      label: 'NOVA',
                      subBadge: null,
                      cls: isLight
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }
                  : song.status === 'version'
                  ? {
                      label: 'POSSÍVEL VERSÃO DIFERENTE',
                      subBadge: null,
                      cls: isLight
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }
                  : {
                      label: 'JÁ CADASTRADA',
                      subBadge: 'Já existe no app',
                      cls: isLight
                        ? 'bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-slate-700/70 text-slate-300 border-slate-600'
                    };

              return (
                <div
                  key={song.id}
                  className={`rounded-xl border transition-all ${
                    song.selected
                      ? isLight
                        ? 'bg-white border-emerald-300 shadow-xs'
                        : 'bg-slate-950/90 border-emerald-500/40'
                      : isLight
                      ? 'bg-white/70 border-slate-200 opacity-90'
                      : 'bg-slate-950/50 border-slate-800 opacity-90'
                  }`}
                >
                  <div className="p-2.5 sm:p-3 flex items-start gap-2.5">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSongSelected(song.id)}
                      disabled={isSavingBatch}
                      aria-label={`Selecionar ${song.titulo}`}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        song.selected
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : isLight
                          ? 'bg-white border-slate-300 hover:border-slate-400'
                          : 'bg-slate-900 border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      {song.selected && <Check size={13} strokeWidth={3} />}
                    </button>

                    {/* Dados resumidos */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-xs font-bold ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}
                        >
                          {song.titulo}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${statusBadge.cls}`}
                        >
                          {statusBadge.label}
                        </span>
                        {statusBadge.subBadge && (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              isLight
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {statusBadge.subBadge}
                          </span>
                        )}
                      </div>

                      <div
                        className={`text-[11px] flex items-center gap-1.5 flex-wrap mt-0.5 ${
                          isLight ? 'text-slate-600' : 'text-slate-400'
                        }`}
                      >
                        <span>{song.artista || 'Ministério de Louvor'}</span>
                        <span>•</span>
                        <span
                          className={`font-bold ${
                            isLight ? 'text-amber-700' : 'text-amber-300'
                          }`}
                        >
                          Tom: {song.tom || 'C'}
                        </span>
                        {song.bpm ? (
                          <>
                            <span>•</span>
                            <span>{song.bpm} BPM</span>
                          </>
                        ) : null}
                      </div>

                      {song.matchReason && song.status !== 'new' && (
                        <p
                          className={`text-[10px] mt-1 leading-snug ${
                            song.status === 'version'
                              ? isLight
                                ? 'text-amber-700'
                                : 'text-amber-300/90'
                              : isLight
                              ? 'text-slate-500'
                              : 'text-slate-400'
                          }`}
                        >
                          {song.matchReason}
                        </p>
                      )}
                    </div>

                    {/* Botão expandir edição */}
                    <button
                      type="button"
                      onClick={() => toggleSongExpanded(song.id)}
                      className={`shrink-0 px-2 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Edit3 size={12} />
                      <span className="hidden sm:inline">Revisar</span>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>

                  {/* Editor inline expansível */}
                  {isExpanded && (
                    <div
                      className={`px-3 pb-3 pt-2.5 border-t space-y-2.5 ${
                        isLight ? 'border-slate-200 bg-slate-50/70' : 'border-slate-800 bg-slate-900/50'
                      }`}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label
                            className={`block text-[10px] font-semibold mb-1 ${
                              isLight ? 'text-slate-600' : 'text-slate-400'
                            }`}
                          >
                            Título
                          </label>
                          <input
                            type="text"
                            value={song.titulo}
                            onChange={(e) =>
                              updateSongField(song.id, 'titulo', e.target.value)
                            }
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none focus:border-blue-500 ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-900'
                                : 'bg-slate-950 border-slate-700 text-white'
                            }`}
                          />
                        </div>
                        <div>
                          <label
                            className={`block text-[10px] font-semibold mb-1 ${
                              isLight ? 'text-slate-600' : 'text-slate-400'
                            }`}
                          >
                            Artista / Ministério
                          </label>
                          <input
                            type="text"
                            value={song.artista}
                            onChange={(e) =>
                              updateSongField(song.id, 'artista', e.target.value)
                            }
                            placeholder="Ministério de Louvor"
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-blue-500 ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-900'
                                : 'bg-slate-950 border-slate-700 text-white'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label
                            className={`block text-[10px] font-semibold mb-1 ${
                              isLight ? 'text-slate-600' : 'text-slate-400'
                            }`}
                          >
                            Tom
                          </label>
                          <select
                            value={COMMON_KEYS.includes(song.tom) ? song.tom : 'C'}
                            onChange={(e) =>
                              updateSongField(song.id, 'tom', e.target.value)
                            }
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold focus:outline-none focus:border-blue-500 ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-900'
                                : 'bg-slate-950 border-slate-700 text-white'
                            }`}
                          >
                            {COMMON_KEYS.map((k) => (
                              <option key={k} value={k}>
                                {k}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label
                            className={`block text-[10px] font-semibold mb-1 ${
                              isLight ? 'text-slate-600' : 'text-slate-400'
                            }`}
                          >
                            BPM (opcional)
                          </label>
                          <input
                            type="number"
                            min={40}
                            max={220}
                            value={song.bpm ?? ''}
                            onChange={(e) =>
                              updateSongField(song.id, 'bpm', e.target.value)
                            }
                            placeholder="Ex: 72"
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-blue-500 ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-900'
                                : 'bg-slate-950 border-slate-700 text-white'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          className={`block text-[10px] font-semibold mb-1 ${
                            isLight ? 'text-slate-600' : 'text-slate-400'
                          }`}
                        >
                          Cifra Alinhada
                        </label>
                        <textarea
                          value={song.cifra}
                          onChange={(e) =>
                            updateSongField(song.id, 'cifra', e.target.value)
                          }
                          rows={8}
                          spellCheck={false}
                          className={`w-full p-2.5 rounded-lg border font-mono text-[11px] leading-relaxed whitespace-pre overflow-x-auto focus:outline-none focus:border-blue-500 scrollbar-thin ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900'
                              : 'bg-slate-950 border-slate-700 text-slate-100'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Botão principal de confirmação do lote */}
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={isSavingBatch || selectedCount === 0}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-950/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {isSavingBatch ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
            ) : (
              <Save size={15} className="shrink-0" />
            )}
            <span>{importButtonLabel}</span>
          </button>
        </div>
      )}
    </div>
  );
}
