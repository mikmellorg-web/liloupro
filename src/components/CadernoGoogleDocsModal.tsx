import React, { useState } from 'react';
import { X, Download, Check, ExternalLink, FileText, Music, BookOpen, Users, Sparkles } from 'lucide-react';
import { GoogleDocsIcon } from './GoogleDocsIcon';
import { copyCadernoAndOpenGoogleDocs, downloadCadernoWordDoc, downloadCifrasCultoPDF, generateCadernoHtml, getCadernoSongs, type CadernoOptions } from '../utils/googleDocsCadernoUtils';

interface CadernoGoogleDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: any;
  options: CadernoOptions;
}

export function CadernoGoogleDocsModal({
  isOpen,
  onClose,
  service,
  options
}: CadernoGoogleDocsModalProps) {
  const [copied, setCopied] = useState(false);
  const [openedDocs, setOpenedDocs] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!isOpen || !service) return null;

  const songs = getCadernoSongs(service, options.allSongs || []);
  const liturgyCount: number = Array.isArray(service.liturgy) ? service.liturgy.length : 0;
  
  let scaleCount = 0;
  if (service.scales && typeof service.scales === 'object') {
    Object.values(service.scales).forEach((val: any) => {
      const arr = Array.isArray(val) ? val : [val].filter(Boolean);
      scaleCount += arr.length;
    });
  }

  const handleOpenDocs = async () => {
    setOpenedDocs(true);
    await copyCadernoAndOpenGoogleDocs(service, {
      ...options,
      targetEmail: 'miqueiasmellopro@gmail.com'
    });
    setTimeout(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 5000);
    }, 400);
  };

  const handleDownloadDoc = () => {
    downloadCadernoWordDoc(service, options);
  };

  const handleDownloadCifrasPDF = () => {
    setDownloadingPdf(true);
    try {
      downloadCifrasCultoPDF(service, options);
    } catch (e) {
      console.error('Erro ao gerar PDF de cifras:', e);
    } finally {
      setTimeout(() => setDownloadingPdf(false), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-card text-card-foreground border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com branding oficial do Google Docs */}
        <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-blue-500/10 via-transparent to-transparent flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/15 text-blue-500 rounded-xl border border-blue-500/20 shadow-sm">
              <GoogleDocsIcon size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text-main">Caderno no Google Docs</h2>
                <span className="text-[10px] uppercase font-black tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                  Oficial
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Liturgia oficial, equipe escalada e repertório do culto.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Card Resumo do Culto */}
          <div className="bg-background-secondary border border-border/70 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <div>
                <h3 className="text-base font-extrabold text-text-main">{service.title || 'Culto de Celebração'}</h3>
                <p className="text-xs text-text-muted">
                  {options.churchData?.name || 'Ministério de Louvor'}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-brand/10 text-brand rounded-lg border border-brand/20">
                {service.date ? new Date(service.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Data'}
              </span>
            </div>

            {/* Estatísticas do Caderno */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-card p-2.5 rounded-lg border border-border/50">
                <div className="flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
                  <BookOpen size={14} />
                  <span className="text-xs font-bold">Liturgia</span>
                </div>
                <div className="text-base font-black text-text-main">{liturgyCount} momentos</div>
              </div>
              <div className="bg-card p-2.5 rounded-lg border border-border/50">
                <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                  <Music size={14} />
                  <span className="text-xs font-bold">Cifras</span>
                </div>
                <div className="text-base font-black text-text-main">{songs.length} músicas</div>
              </div>
              <div className="bg-card p-2.5 rounded-lg border border-border/50">
                <div className="flex items-center justify-center gap-1.5 text-purple-600 dark:text-purple-400 mb-1">
                  <Users size={14} />
                  <span className="text-xs font-bold">Escala</span>
                </div>
                <div className="text-base font-black text-text-main">{scaleCount} voluntários</div>
              </div>
            </div>
          </div>

          {/* Indicação da Conta Google Destino */}
          <div className="flex items-center justify-between text-xs px-3.5 py-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/50 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="text-[11px] font-semibold text-text-muted">Conta Google destino:</span>
            </div>
            <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 truncate max-w-[240px]">
              miqueiasmellopro@gmail.com
            </span>
          </div>

          {/* Banner de instrução de 1 clique quando abre */}
          {openedDocs && (
            <div className="bg-blue-600 dark:bg-blue-600 border border-blue-400/40 rounded-xl p-4 flex items-start gap-3.5 animate-fade-in shadow-lg text-white">
              <div className="p-1.5 bg-white/20 text-white rounded-md shrink-0 mt-0.5">
                <Check size={16} className="text-white" />
              </div>
              <div className="text-xs text-white space-y-1.5">
                <p className="font-bold text-white text-[13px]">
                  Caderno copiado para a área de transferência!
                </p>
                <p className="text-white text-xs leading-relaxed">
                  Abrindo Google Docs na conta <b className="text-white font-semibold">miqueiasmellopro@gmail.com</b>. Pressione <kbd className="px-1.5 py-0.5 bg-white/25 text-white rounded font-mono font-bold text-[11px] border border-white/30">Ctrl + V</kbd> para colar a liturgia, escala e lista de repertório.
                </p>
                <div className="pt-1.5 mt-1 border-t border-white/20 flex items-start gap-1.5 text-xs text-white">
                  <span className="shrink-0">💡</span>
                  <span className="text-white leading-relaxed">
                    Para ter todas as cifras completas diagramadas em 2 colunas, use o botão <b className="text-white font-semibold">Baixar (.doc)</b> ou <b className="text-white font-semibold">Cifras do Culto (PDF)</b> abaixo.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="space-y-2.5">
            {/* Ação Primária: Google Docs com 1 clique */}
            <button
              onClick={handleOpenDocs}
              className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-black py-3.5 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-wide group active:scale-[0.98]"
            >
              <GoogleDocsIcon size={20} className="group-hover:scale-110 transition-transform" />
              <span>Abrir no Google Docs</span>
              <ExternalLink size={15} className="opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            {/* Ações Secundárias */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleDownloadDoc}
                className="bg-background-secondary hover:bg-border/60 text-text-main border border-border font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
                title="Baixar arquivo compatível com Word e Google Drive"
              >
                <Download size={14} className="text-blue-500 shrink-0" />
                <span>Baixar (.doc)</span>
              </button>

              <button
                onClick={handleDownloadCifrasPDF}
                disabled={downloadingPdf}
                className="bg-background-secondary hover:bg-border/60 text-text-main border border-border font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                title="Baixar todas as cifras do culto em PDF (duas colunas, tamanho 10 em negrito)"
              >
                <FileText size={14} className="text-rose-500 shrink-0" />
                <span>{downloadingPdf ? 'Gerando...' : 'Cifras do Culto'}</span>
              </button>
            </div>
          </div>

          {/* Toggle de Pré-visualização */}
          <div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-text-muted hover:text-text-main font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileText size={13} />
              <span>{showPreview ? 'Ocultar Prévia do Caderno' : 'Ver Prévia do Caderno'}</span>
            </button>

            {showPreview && (
              <div className="mt-2.5 p-3.5 bg-background border border-border rounded-xl max-h-64 overflow-y-auto text-[11px] font-mono whitespace-pre-wrap text-text-muted leading-relaxed select-text">
                {(() => {
                  const html = generateCadernoHtml(service, options);
                  if (typeof document !== 'undefined') {
                    const temp = document.createElement('div');
                    temp.innerHTML = html;
                    return (temp.innerText || temp.textContent || '').slice(0, 2500);
                  }
                  return html.replace(/<[^>]*>?/gm, '\n').slice(0, 2500);
                })()}...
              </div>
            )}
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-3.5 border-t border-border bg-background-secondary/50 flex items-center justify-between text-[11px] text-text-muted">
          <span className="flex items-center gap-1">
            <Sparkles size={12} className="text-blue-500" />
            Compatível com Google Workspace & Word
          </span>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main font-bold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
