import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Flame, Sparkles, Music, X } from 'lucide-react';

export function DynamicsGuideModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[260] flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-surface border border-border rounded-3xl w-full max-w-2xl p-5 sm:p-6 shadow-2xl flex flex-col space-y-5 relative max-h-[90vh] overflow-y-auto custom-scrollbar notranslate"
          translate="no"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-r from-rose-500/20 via-orange-500/20 to-brand/20 text-rose-500 border border-rose-500/30">
                <Flame size={22} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-text-main">
                  Guia Rápido: Seções, Dinâmicas & Expressão Musical
                </h3>
                <p className="text-[11px] text-text-muted font-bold mt-0.5">
                  Marcadores visuais automáticos e botões interativos para cifras e letras
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-text-muted hover:text-text-main transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Novidade: Botões de Atalho no Editor & Clique Interativo */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-brand/15 via-cyan-500/10 to-indigo-500/10 border border-brand/30 space-y-2">
            <div className="flex items-center gap-2 text-brand font-black text-xs uppercase tracking-wider">
              <Sparkles size={16} />
              <span>Recursos do Leitor e Editor Liloupro</span>
            </div>
            <ul className="text-[11px] text-text-muted space-y-1.5 leading-relaxed font-medium">
              <li className="flex items-start gap-1.5">
                <span className="text-brand font-bold shrink-0">✦</span>
                <span><strong>Inserção em 1 Clique no Editor:</strong> Na tela de edição da música, clique nos botões rápidos de seções (<code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">+ Refrão</code>, <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">+ Primeira Parte</code>, <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">+ Segunda Parte</code>, <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">+ Verso 1</code>) ou de dinâmicas para colar a tag direto onde o cursor estiver.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-brand font-bold shrink-0">✦</span>
                <span><strong>Badges Interativos:</strong> Ao ler a cifra, clique em qualquer etiqueta de dinâmica ou pausa para abrir o modal explicativo com a orientação exata para vocal e instrumentistas.</span>
              </li>
            </ul>
          </div>

          {/* Seções de Estrutura da Música */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-brand flex items-center gap-1.5">
              <Music size={14} /> Seções e Partes da Música
            </h4>
            <p className="text-[11px] text-text-muted">
              Ao colocar o nome da seção entre colchetes como <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">[Refrão]</code>, <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">[Primeira Parte]</code>, <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">[Segunda Parte]</code> ou <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">[Verso 1]</code>, o aplicativo estiliza automaticamente com o mesmo padrão visual de destaque:
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Music size={12} /> REFRÃO
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Music size={12} /> INTRO
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Music size={12} /> PRIMEIRA PARTE
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Music size={12} /> SEGUNDA PARTE
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Music size={12} /> VERSO 1
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Music size={12} /> VERSO 2
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Music size={12} /> PONTE
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Music size={12} /> FINAL
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Music size={12} /> INTERLÚDIO
              </span>
            </div>
          </div>

          {/* Dicas de Dinâmica e Expressão */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-brand flex items-center gap-1.5">
              <Sparkles size={14} /> Dinâmicas de Execução & Expressão
            </h4>
            <p className="text-[11px] text-text-muted">
              Use colchetes como <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">[Crescendo]</code>, <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">[Suave]</code>, <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">[Forte]</code> ou <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">[Pausa]</code> para guiar toda a banda em tempo real.
            </p>
          </div>

          {/* Botão Fechar */}
          <div className="pt-3 border-t border-border flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-brand text-white font-black text-xs uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-brand/20"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
