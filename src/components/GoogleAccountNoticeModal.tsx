import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, UserPlus, ArrowRight, Download, FileText, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { GoogleCalendarIcon } from './GoogleCalendarIcon';
import { GoogleDocsIcon } from './GoogleDocsIcon';

export interface GoogleAccountNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: 'calendar' | 'docs';
  userEmail?: string;
  onContinue: () => void;
  onDownloadDoc?: () => void;
  onDownloadPdf?: () => void;
}

export function GoogleAccountNoticeModal({
  isOpen,
  onClose,
  serviceType,
  userEmail = '',
  onContinue,
  onDownloadDoc,
  onDownloadPdf,
}: GoogleAccountNoticeModalProps) {
  if (!isOpen) return null;

  const isCalendar = serviceType === 'calendar';
  const cleanEmail = userEmail?.trim() || 'seu e-mail atual';

  const handleCreateGoogleAccount = () => {
    if (typeof window !== 'undefined') {
      window.open('https://accounts.google.com/signup', '_blank', 'noopener,noreferrer');
    }
  };

  const handleProceed = () => {
    onClose();
    onContinue();
  };

  return (
    <AnimatePresence>
      <div 
        id="google-account-notice-backdrop"
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          id="google-account-notice-modal"
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="bg-card text-card-foreground border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header com destaque do serviço Google */}
          <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-amber-500/10 via-blue-500/5 to-transparent flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-card border border-border shadow-sm rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                {isCalendar ? <GoogleCalendarIcon size={26} /> : <GoogleDocsIcon size={26} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-text-main">
                    {isCalendar ? 'Google Agenda' : 'Google Docs'}
                  </h2>
                  <span className="text-[10px] uppercase font-black tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    Conta Google
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {isCalendar ? 'Sincronização de cultos e escalas' : 'Caderno oficial com liturgia e cifras'}
                </p>
              </div>
            </div>

            <button
              id="btn-close-google-notice"
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all shrink-0"
              aria-label="Fechar aviso"
            >
              <X size={18} />
            </button>
          </div>

          {/* Conteúdo Explicativo */}
          <div className="p-6 overflow-y-auto space-y-4">
            {/* Bloco de Alerta Amigável */}
            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs">
                <AlertCircle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Conta Google (@gmail.com) recomendada</span>
              </div>
              <p className="text-xs text-amber-950/80 dark:text-amber-200/90 leading-relaxed">
                Este recurso é integrado diretamente ao ecossistema do <b>Google Workspace</b>. Para salvar eventos ou criar documentos na nuvem, o Google exige que você esteja conectado a uma <b>Conta Google</b>.
              </p>
              <div className="pt-1.5 flex items-center justify-between text-[11px] text-text-muted border-t border-amber-200/50 dark:border-amber-800/40">
                <span>Seu e-mail no Liloupro:</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-300 bg-card px-2 py-0.5 rounded border border-border">
                  {cleanEmail}
                </span>
              </div>
            </div>

            {/* Explicação de como proceder */}
            <div className="space-y-2.5 text-xs text-text-muted leading-relaxed">
              <p className="font-semibold text-text-main">Como você deseja prosseguir?</p>
              <ul className="space-y-2 text-[12px]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <b>Criar uma Conta Google:</b> Leva menos de 1 minuto e é 100% gratuita para sempre sincronizar suas escalas e cultos.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    <b>Já tem outra conta Google no celular/PC:</b> Se você já possui um Gmail conectado no seu navegador, pode continuar direto.
                  </span>
                </li>
                {!isCalendar && (
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-purple-500 shrink-0 mt-0.5" />
                    <span>
                      <b>Não quer usar Google:</b> Você pode baixar o caderno no formato <b>Word (.doc)</b> ou em <b>PDF</b> sem precisar de conta alguma!
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* Ações / Botões */}
            <div className="space-y-2.5 pt-2">
              {/* Botão Primário: Criar Conta Google */}
              <button
                id="btn-create-google-account"
                onClick={handleCreateGoogleAccount}
                className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2.5 text-xs sm:text-sm uppercase tracking-wider group active:scale-[0.98]"
              >
                <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
                <span>Criar Conta Google Gratuita</span>
                <ExternalLink size={15} className="opacity-80 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Botão Secundário: Continuar para o recurso */}
              <button
                id="btn-continue-to-google-service"
                onClick={handleProceed}
                className="w-full bg-background-secondary hover:bg-border/60 text-text-main border border-border font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-98"
              >
                <span>{isCalendar ? 'Já tenho conta Google • Abrir Agenda' : 'Já tenho conta Google • Abrir no Docs'}</span>
                <ArrowRight size={14} className="text-text-muted" />
              </button>

              {/* Ações Alternativas para Google Docs */}
              {!isCalendar && (onDownloadDoc || onDownloadPdf) && (
                <div className="pt-2 border-t border-border/60">
                  <p className="text-[11px] font-semibold text-text-muted mb-2 text-center">
                    Ou acesse sem Conta Google:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {onDownloadDoc && (
                      <button
                        id="btn-notice-download-doc"
                        onClick={() => {
                          onClose();
                          onDownloadDoc();
                        }}
                        className="bg-card hover:bg-background-secondary text-text-main border border-border font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Download size={13} className="text-blue-500 shrink-0" />
                        <span>Baixar (.doc)</span>
                      </button>
                    )}
                    {onDownloadPdf && (
                      <button
                        id="btn-notice-download-pdf"
                        onClick={() => {
                          onClose();
                          onDownloadPdf();
                        }}
                        className="bg-card hover:bg-background-secondary text-text-main border border-border font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <FileText size={13} className="text-rose-500 shrink-0" />
                        <span>Cifras (PDF)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-border bg-background-secondary/50 flex items-center justify-between text-[11px] text-text-muted">
            <span className="flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500" />
              Dica rápida do Liloupro
            </span>
            <button
              id="btn-dismiss-google-notice"
              onClick={onClose}
              className="text-text-muted hover:text-text-main font-semibold"
            >
              Voltar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
