import React, { useState, useEffect } from 'react';
import { X, Download, Check, ExternalLink, FileText, Music, BookOpen, Users, Sparkles, Copy, ArrowLeft } from 'lucide-react';
import { GoogleDocsIcon } from './GoogleDocsIcon';
import { PdfIcon } from './PdfIcon';
import { copyCadernoAndOpenGoogleDocs, downloadCadernoWordDoc, downloadCifrasCultoPDF, generateCadernoGoogleDocsHtml, generateCadernoHtml, getCadernoSongs, isGoogleEmail, type CadernoOptions } from '../utils/googleDocsCadernoUtils';
import { GoogleAccountNoticeModal } from './GoogleAccountNoticeModal';

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
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setOpenedDocs(false);
      setCopied(false);
      setIsNoticeOpen(false);
    }
  }, [isOpen]);

  if (!isOpen || !service) return null;

  const songs = getCadernoSongs(service, options.allSongs || []);
  const liturgyCount: number = Array.isArray(service.liturgy) ? service.liturgy.length : 0;
  
  const uniqueVolunteers = new Set<string>();
  if (service.scales && typeof service.scales === 'object') {
    const membersList = Array.isArray(options.members) ? options.members : [];
    Object.values(service.scales).forEach((val: any) => {
      const arr = Array.isArray(val) ? val : [val].filter(Boolean);
      arr.forEach((item: any) => {
        if (item === null || item === undefined) return;
        if (typeof item === 'object') {
          const rawId = item.id ?? item.uid ?? item.memberId ?? item.userId;
          if (rawId !== undefined && rawId !== null && String(rawId).trim()) {
            const idStr = String(rawId).trim();
            const matched = membersList.find((m: any) => m.id === idStr || m.uid === idStr);
            uniqueVolunteers.add(`id:${matched?.id || matched?.uid || idStr}`);
          } else if (typeof item.name === 'string' && item.name.trim()) {
            const normalizedName = item.name.trim().replace(/\s+/g, ' ').toLowerCase();
            const matched = membersList.find(
              (m: any) => typeof m?.name === 'string' && m.name.trim().replace(/\s+/g, ' ').toLowerCase() === normalizedName
            );
            uniqueVolunteers.add(matched?.id || matched?.uid ? `id:${matched.id || matched.uid}` : `name:${normalizedName}`);
          }
          return;
        }
        const rawStr = String(item).trim();
        if (!rawStr) return;
        const matchedById = membersList.find((m: any) => m.id === rawStr || m.uid === rawStr);
        if (matchedById) {
          uniqueVolunteers.add(`id:${matchedById.id || matchedById.uid}`);
          return;
        }
        const normalizedName = rawStr.replace(/\s+/g, ' ').toLowerCase();
        const matchedByName = membersList.find(
          (m: any) => typeof m?.name === 'string' && m.name.trim().replace(/\s+/g, ' ').toLowerCase() === normalizedName
        );
        if (matchedByName && (matchedByName.id || matchedByName.uid)) {
          uniqueVolunteers.add(`id:${matchedByName.id || matchedByName.uid}`);
        } else {
          uniqueVolunteers.add(`name:${normalizedName}`);
        }
      });
    });
  }
  const scaleCount = uniqueVolunteers.size;

  const userEmail = (options.user?.email || (typeof options.user === 'string' ? options.user : '') || options.targetEmail || '').trim();
  const displayAccount = userEmail && userEmail.includes('@') ? userEmail : 'Sua Conta Google Padrão';

  const copyCadernoToClipboard = async () => {
    const htmlContent = generateCadernoGoogleDocsHtml(service, {
      ...options,
      targetEmail: userEmail || undefined
    });
    if (!htmlContent) return false;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const plainText = tempDiv.innerText || tempDiv.textContent || '';

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([htmlContent], { type: 'text/html' });
        const blobText = new Blob([plainText], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText,
          })
        ]);
      } else {
        await navigator.clipboard.writeText(plainText);
      }
    } catch (err) {
      console.warn('Falha na Clipboard API avançada, tentando fallback text:', err);
      try {
        await navigator.clipboard.writeText(plainText);
      } catch (e2) {
        console.error('Falha ao copiar:', e2);
      }
    }
    return true;
  };

  const proceedWithOpenDocs = async () => {
    await copyCadernoToClipboard();
    setOpenedDocs(true);
  };

  const handleConfirmOpenGoogleDocs = () => {
    const memberEmail = userEmail || '';
    const isGoogle = isGoogleEmail(memberEmail);
    const targetEmail = memberEmail && memberEmail.includes('@') && isGoogle ? memberEmail.trim() : '';
    const googleDocsUrl = targetEmail
      ? `https://docs.google.com/document/create?authuser=${encodeURIComponent(targetEmail)}`
      : 'https://docs.new';

    if (typeof window !== 'undefined') {
      window.open(googleDocsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyAgain = async () => {
    await copyCadernoToClipboard();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenDocs = async () => {
    if (userEmail && !isGoogleEmail(userEmail)) {
      setIsNoticeOpen(true);
      return;
    }
    proceedWithOpenDocs();
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
                <div className="text-base font-black text-text-main">{scaleCount} {scaleCount === 1 ? 'voluntário' : 'voluntários'}</div>
              </div>
            </div>
          </div>

          {/* Indicação da Conta Google Destino */}
          <div className="flex items-center justify-between text-xs px-3.5 py-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/50 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">Conta Google destino:</span>
            </div>
            <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 truncate max-w-[240px]" title={displayAccount}>
              {displayAccount}
            </span>
          </div>

          {/* Fluxo em 2 passos: Instruções após copiar vs. Botões iniciais */}
          {openedDocs ? (
            <div className="bg-slate-900/95 border border-blue-500/40 rounded-xl p-4 space-y-3.5 animate-fade-in shadow-lg text-slate-100">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/30 shrink-0 mt-0.5">
                  <Check size={16} />
                </div>
                <div className="space-y-2.5 flex-1">
                  <p className="font-bold text-white text-[13px] leading-snug">
                    Caderno copiado! Como finalizar no Google Docs:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-200 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold shrink-0">•</span>
                      <span>
                        <strong className="text-white">No computador:</strong> Na página em branco que vai abrir, pressione{' '}
                        <kbd className="px-1.5 py-0.5 bg-slate-800 text-blue-200 rounded font-mono font-bold text-[11px] border border-blue-400/30">
                          Ctrl + V
                        </kbd>{' '}
                        (ou clique com o botão direito &gt; Colar).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold shrink-0">•</span>
                      <span>
                        <strong className="text-white">No celular:</strong> Toque na folha em branco e selecione{' '}
                        <strong className="text-white">Colar</strong>.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={handleConfirmOpenGoogleDocs}
                  className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-black py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm tracking-wide active:scale-[0.98]"
                >
                  <span>Entendi, abrir Google Docs ↗</span>
                </button>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <button
                    onClick={handleCopyAgain}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copied ? 'Copiado novamente!' : 'Copiar novamente'}</span>
                  </button>

                  <button
                    onClick={() => setOpenedDocs(false)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <ArrowLeft size={13} />
                    <span>Voltar</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Ação Primária: Google Docs */}
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
                  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
                    <path d="M6 2h9l5 5v14a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 21V3.5A1.5 1.5 0 0 1 6 2z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="0.9" />
                    <path d="M15 2v4a1 1 0 0 0 1 1h4L15 2z" fill="#93C5FD" />
                    <path d="M13.8 10h3.7M13.8 13h3.7M13.8 16h3.7" stroke="#93C5FD" strokeWidth="1.2" strokeLinecap="round" />
                    <rect x="1.5" y="7" width="11.5" height="10" rx="2" fill="#185ABD" />
                    <path d="M3.8 9.3L5.05 14.6L7.25 10.6L9.45 14.6L10.7 9.3" stroke="#FFFFFF" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                  <span>Baixar Caderno (.doc)</span>
                </button>

                <button
                  onClick={handleDownloadCifrasPDF}
                  disabled={downloadingPdf}
                  className="bg-background-secondary hover:bg-border/60 text-text-main border border-border font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                  title="Baixar todas as cifras do culto em PDF (duas colunas, tamanho 10 em negrito)"
                >
                  <PdfIcon className="w-5 h-5" />
                  <span>{downloadingPdf ? 'Gerando...' : 'Cifras do Culto'}</span>
                </button>
              </div>
            </div>
          )}
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

      <GoogleAccountNoticeModal
        isOpen={isNoticeOpen}
        onClose={() => setIsNoticeOpen(false)}
        serviceType="docs"
        userEmail={userEmail}
        onContinue={() => {
          proceedWithOpenDocs();
        }}
      />
    </div>
  );
}
