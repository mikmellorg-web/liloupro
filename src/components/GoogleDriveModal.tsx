import React, { useState } from 'react';
import { X, ExternalLink, Link2, Save, Check, Copy, FolderPlus, Info } from 'lucide-react';
import { GoogleDriveIcon } from './GoogleDriveIcon';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  churchData: any;
  isAdmin: boolean;
}

export function GoogleDriveModal({ isOpen, onClose, churchData, isAdmin }: GoogleDriveModalProps) {
  const currentDriveUrl = churchData?.teamDriveUrl || '';
  const [driveUrlInput, setDriveUrlInput] = useState(currentDriveUrl);
  const [isEditingUrl, setIsEditingUrl] = useState(!currentDriveUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchData?.id) return;
    setIsSaving(true);
    try {
      const cleanUrl = driveUrlInput.trim();
      await updateDoc(doc(db, 'churches', churchData.id), {
        teamDriveUrl: cleanUrl
      });
      setSaveSuccess(true);
      setIsEditingUrl(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar URL do Google Drive:', err);
      alert('Não foi possível salvar o link do Google Drive. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (!currentDriveUrl) return;
    navigator.clipboard.writeText(currentDriveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border/60 flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-md">
              <GoogleDriveIcon size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-text-main tracking-tight">
                  Google Drive da Equipe
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-500 border border-blue-500/30">
                  Drive Oficial
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {churchData?.name || 'Ministério de Louvor'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {saveSuccess && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check size={16} /> Link do Google Drive atualizado com sucesso para toda a equipe!
            </div>
          )}

          {currentDriveUrl && !isEditingUrl ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Link2 size={13} /> Pasta Conectada
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setDriveUrlInput(currentDriveUrl);
                        setIsEditingUrl(true);
                      }}
                      className="text-[10px] font-bold text-text-muted hover:text-blue-400 underline transition-colors"
                    >
                      Alterar pasta
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-black/20 dark:bg-black/40 rounded-xl border border-border/60">
                  <p className="text-xs text-text-muted truncate flex-1 font-mono">
                    {currentDriveUrl}
                  </p>
                  <button
                    onClick={handleCopyLink}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-main transition-colors shrink-0"
                    title="Copiar link"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Ação Primária: Abrir no Google Drive */}
              <a
                href={currentDriveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-black py-3.5 px-5 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-wide group active:scale-[0.98]"
              >
                <GoogleDriveIcon size={20} className="group-hover:scale-110 transition-transform" />
                <span>Abrir Pasta no Google Drive</span>
                <ExternalLink size={15} className="opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <div className="p-3 rounded-xl bg-card border border-border/60 text-center space-y-1">
                  <span className="text-lg">🎵</span>
                  <p className="text-[11px] font-bold text-text-main">Áudios & VS</p>
                  <p className="text-[9px] text-text-muted">Multitracks e ensaios</p>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/60 text-center space-y-1">
                  <span className="text-lg">📄</span>
                  <p className="text-[11px] font-bold text-text-main">Partituras & PDFs</p>
                  <p className="text-[9px] text-text-muted">Arranjos e cifras</p>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/60 text-center space-y-1">
                  <span className="text-lg">🎬</span>
                  <p className="text-[11px] font-bold text-text-main">Vídeos & Telão</p>
                  <p className="text-[9px] text-text-muted">Materiais de mídia</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-text-main space-y-2">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
                  <FolderPlus size={16} /> Conecte a pasta oficial da sua congregação
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Cole o link da pasta do Google Drive onde ficam os áudios (MP3), partituras e materiais do ministério. Todos os músicos escalados terão acesso direto com 1 clique!
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-main block">
                  Link da Pasta no Google Drive:
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    value={driveUrlInput}
                    onChange={(e) => setDriveUrlInput(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-text-main text-xs sm:text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-text-muted flex items-center gap-1 mt-1">
                  <Info size={11} /> No Google Drive, clique com botão direito na pasta &gt; Compartilhar &gt; Copiar link.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {currentDriveUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setDriveUrlInput(currentDriveUrl);
                      setIsEditingUrl(false);
                    }}
                    className="flex-1 py-3 rounded-xl bg-background border border-border hover:bg-black/5 dark:hover:bg-white/5 text-text-muted font-bold text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSaving || !driveUrlInput.trim()}
                  className="flex-1 py-3 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <Save size={15} />
                  <span>{isSaving ? 'Salvando...' : 'Salvar Pasta do Drive'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
