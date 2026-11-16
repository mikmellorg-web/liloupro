import React from 'react';
import {
  BookOpen,
  Smartphone,
  Play,
  FileText,
  Music,
  Mic,
  ChevronDown,
  ChevronUp,
  Clock,
  GripVertical,
  X
} from 'lucide-react';

interface LiturgyReadyPreviewProps {
  variant?: 'compact' | 'expanded';
}

const LITURGY_ITEMS = [
  {
    num: 1,
    category: 'CHAMADO À ADORAÇÃO',
    title: 'Salmos 98:1-9 (BLIVRE)',
    isReading: true
  },
  {
    num: 2,
    category: 'PRIMEIRA MÚSICA',
    title: 'Grande é o Senhor',
    singer: 'FRANCIANE PEDRA',
    keySignature: 'Tom: A',
    isReading: false
  },
  {
    num: 3,
    category: 'SEGUNDA MÚSICA',
    title: 'Perdão e Graça',
    singer: 'FRANCIANE PEDRA',
    keySignature: 'Tom: A',
    isReading: false
  },
  {
    num: 4,
    category: 'EXPLICAÇÃO DO EVANGELHO',
    title: '1 João 3:1-3 (BLIVRE)',
    isReading: true
  },
  {
    num: 5,
    category: 'TERCEIRA MÚSICA',
    title: 'Tudo pra tua gloria',
    singer: 'FRANCINE MELLO',
    keySignature: 'Tom: C',
    isReading: false
  }
];

export function LiturgyReadyPreview({ variant = 'compact' }: LiturgyReadyPreviewProps) {
  const isCompact = variant === 'compact';

  if (isCompact) {
    return (
      <div className="w-full h-full bg-[#0B1120] text-white p-1.5 sm:p-2.5 pb-4 sm:pb-5 flex flex-col gap-1.5 overflow-hidden select-none">
        {/* Barra superior com seletor segmentado */}
        <div className="mx-auto flex items-center bg-[#0F172A] border border-white/10 rounded-lg p-[2px] w-full max-w-[260px] sm:max-w-[330px] shrink-0">
          <div className="flex-1 flex items-center justify-center gap-1 py-[2px] sm:py-1 px-1.5 text-[5.5px] sm:text-[7.5px] font-extrabold uppercase tracking-wider text-slate-400 truncate">
            <BookOpen className="w-2 h-2 sm:w-2.5 sm:h-2.5 shrink-0" />
            <span className="truncate">MODO EDIÇÃO / PADRÃO</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-1 py-[2px] sm:py-1 px-1.5 rounded-md bg-[#3B82F6] text-white text-[5.5px] sm:text-[7.5px] font-extrabold uppercase tracking-wider shadow-sm truncate">
            <Smartphone className="w-2 h-2 sm:w-2.5 sm:h-2.5 shrink-0" />
            <span className="truncate">MODO MOBILE (CIFRAS E KIDS)</span>
          </div>
        </div>

        {/* Card de cabeçalho centralizado */}
        <div className="w-full bg-[#111827]/90 border border-white/10 rounded-xl py-1 sm:py-1.5 px-2 flex flex-col items-center justify-center text-center shrink-0">
          <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-md bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] mb-[2px] sm:mb-0.5">
            <BookOpen className="w-2 h-2 sm:w-3 sm:h-3" />
          </div>
          <div className="text-[8.5px] sm:text-[12px] font-black tracking-tight uppercase leading-none text-white">
            CULTO DOMINGO
          </div>
          <div className="text-[5px] sm:text-[7px] font-bold uppercase tracking-wider text-slate-400 mt-[2px]">
            DOMINGO, 15 DE NOVEMBRO ÀS 10:30
          </div>
        </div>

        {/* Linha de 3 botões de ação rápida */}
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 shrink-0">
          <div className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-[2px] sm:py-1 rounded-full bg-red-600 text-white text-[5.5px] sm:text-[7.5px] font-extrabold shadow-sm">
            <Play className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-white" />
            <span>Tocar Setlist (5)</span>
          </div>
          <div className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-[2px] sm:py-1 rounded-full bg-amber-500 text-slate-950 text-[5.5px] sm:text-[7.5px] font-extrabold shadow-sm">
            <FileText className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
            <span>Cifras do Culto</span>
          </div>
          <div className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-[2px] sm:py-1 rounded-full bg-[#1a73e8] text-white text-[5.5px] sm:text-[7.5px] font-extrabold shadow-sm">
            <FileText className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
            <span>Google Docs</span>
          </div>
        </div>

        {/* Lista sequencial numerada de 5 cards escuros */}
        <div className="flex flex-col gap-1.5">
          {LITURGY_ITEMS.map((item) => (
            <div
              key={item.num}
              className="flex items-center justify-between gap-1.5 px-1.5 sm:px-2.5 py-[2px] sm:py-1 rounded-lg bg-[#111827] border border-white/10 min-h-0"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#3B82F6] text-white text-[5.5px] sm:text-[7.5px] font-black flex items-center justify-center shrink-0">
                  {item.num}
                </span>
                <div className="min-w-0 leading-tight">
                  <div className="text-[4.8px] sm:text-[6.5px] font-extrabold uppercase tracking-wider text-[#3B82F6] truncate">
                    {item.category}
                  </div>
                  <div className="flex items-center gap-1 min-w-0">
                    {item.isReading && (
                      <BookOpen className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-emerald-400 shrink-0" />
                    )}
                    <span className="text-[6.5px] sm:text-[9px] font-extrabold text-white truncate">
                      {item.title}
                    </span>
                    {!item.isReading && (
                      <span className="hidden sm:inline-flex items-center gap-1 ml-1 shrink-0">
                        <span className="inline-flex items-center gap-0.5 text-[6px] font-bold text-[#60A5FA] uppercase">
                          <Music className="w-2 h-2" />
                          MÚSICA
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-1 py-[1px] rounded bg-[#1E293B] border border-blue-400/20 text-[5.5px] font-extrabold text-sky-300 uppercase">
                          <Mic className="w-1.5 h-1.5 text-pink-400" />
                          {item.singer}
                        </span>
                      </span>
                    )}
                  </div>
                  {!item.isReading && (
                    <div className="flex sm:hidden items-center gap-1 leading-none mt-[1px]">
                      <span className="inline-flex items-center gap-0.5 text-[4.8px] font-bold text-[#60A5FA] uppercase">
                        <Music className="w-1.5 h-1.5" />
                        MÚSICA
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-1 rounded bg-[#1E293B] text-[4.8px] font-extrabold text-sky-300 uppercase truncate">
                        <Mic className="w-1.5 h-1.5 text-pink-400" />
                        {item.singer}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {item.keySignature && (
                  <span className="px-1 sm:px-1.5 py-[1px] rounded bg-[#0F172A] border border-blue-400/30 text-[5.5px] sm:text-[7px] font-extrabold text-sky-300">
                    {item.keySignature}
                  </span>
                )}
                <ChevronDown className="w-2 h-2 sm:w-3 sm:h-3 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Variant: expanded (dentro do modal em alta definição)
  return (
    <div className="w-full bg-[#0B1120] text-white p-3 sm:p-6 rounded-xl space-y-4 select-none">
      {/* Barra superior com seletor segmentado */}
      <div className="mx-auto flex items-center bg-[#0F172A] border border-white/10 rounded-2xl p-1 max-w-md w-full shadow-inner">
        <div className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">MODO EDIÇÃO / PADRÃO</span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#3B82F6] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-md">
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">MODO MOBILE (CIFRAS E KIDS)</span>
        </div>
      </div>

      {/* Card de cabeçalho centralizado */}
      <div className="w-full bg-[#111827]/95 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center shadow-lg">
        <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] mb-2">
          <BookOpen className="w-5 h-5" />
        </div>
        <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
          CULTO DOMINGO
        </h4>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
          DOMINGO, 15 DE NOVEMBRO ÀS 10:30
        </p>
      </div>

      {/* Linha de 3 botões de ação rápida */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-600 text-white text-xs font-extrabold shadow-md">
          <Play className="w-3.5 h-3.5 fill-white" />
          Tocar Setlist (5)
        </span>
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500 text-slate-950 text-xs font-extrabold shadow-md">
          <FileText className="w-3.5 h-3.5" />
          Cifras do Culto
        </span>
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1a73e8] text-white text-xs font-extrabold shadow-md">
          <FileText className="w-3.5 h-3.5" />
          Google Docs
        </span>
      </div>

      {/* Lista sequencial numerada */}
      <div className="flex flex-col gap-1.5">
        {LITURGY_ITEMS.map((item) => (
          <div
            key={item.num}
            className="flex items-center justify-between gap-3 p-3 sm:px-4 rounded-2xl bg-[#111827] border border-white/10 shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-7 h-7 rounded-full bg-[#3B82F6] text-white text-xs font-black flex items-center justify-center shrink-0 shadow">
                {item.num}
              </span>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#3B82F6]">
                  {item.category}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.isReading && (
                    <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span className="text-sm sm:text-base font-extrabold text-white truncate">
                    {item.title}
                  </span>
                </div>
                {!item.isReading && (
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#60A5FA] uppercase">
                      <Music className="w-3 h-3" />
                      MÚSICA
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1E293B] border border-blue-400/25 text-[10px] font-extrabold text-sky-300 uppercase">
                      <Mic className="w-2.5 h-2.5 text-pink-400" />
                      {item.singer}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {item.keySignature && (
                <span className="px-2.5 py-1 rounded-lg bg-[#0F172A] border border-blue-400/30 text-xs font-extrabold text-sky-300">
                  {item.keySignature}
                </span>
              )}
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LiturgyEditorPreview() {
  return (
    <div className="w-full bg-[#0B1120] text-white p-3 sm:p-5 rounded-xl space-y-4 select-none">
      {/* Bloco 1: Palavra Inicial (borda lateral esquerda laranja/âmbar) */}
      <div className="rounded-2xl bg-[#111827] border border-white/10 border-l-4 border-l-amber-500 p-3.5 sm:p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              PALAVRA INICIAL
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-lg bg-[#0F172A] border border-white/10 flex items-center justify-center text-slate-400">
              <ChevronUp className="w-3.5 h-3.5" />
            </span>
            <span className="w-6 h-6 rounded-lg bg-[#0F172A] border border-white/10 flex items-center justify-center text-slate-300">
              <ChevronDown className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-[#0F172A]/80 border border-white/10 p-3 space-y-3">
          {/* Linha de atividade, referência, categoria e salvar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
            <div className="sm:col-span-3 space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                ATIVIDADE DO CULTO
              </span>
              <div className="flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg bg-[#111827] border border-white/10 text-xs font-semibold text-white">
                <span className="flex items-center gap-1.5 truncate">
                  <BookOpen className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  Leitura
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </div>
            </div>

            <div className="sm:col-span-4 space-y-1">
              <div className="px-2.5 py-2 rounded-lg bg-[#111827] border border-white/10 text-xs font-semibold text-slate-200 truncate">
                Salmos 98:1-9 (BLIVRE)
              </div>
            </div>

            <div className="sm:col-span-3 space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                CATEGORIA
              </span>
              <div className="px-2.5 py-2 rounded-lg bg-[#111827] border border-white/10 text-xs font-semibold text-slate-200 truncate">
                Chamado à adoração
              </div>
            </div>

            <div className="sm:col-span-2 flex items-center gap-1.5">
              <span className="flex-1 py-2 px-2.5 rounded-lg bg-[#3B82F6] text-white text-[11px] font-extrabold text-center shadow">
                SALVAR
              </span>
              <span className="w-8 h-8 rounded-lg bg-[#111827] border border-white/10 flex items-center justify-center text-slate-400 shrink-0">
                <X className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Linha de momento do culto e tempo */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
            <div className="sm:col-span-6 space-y-1">
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-sky-400">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                MOMENTO DO CULTO (AGRUPADOR)
              </span>
              <div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-[#111827] border border-white/10 text-xs font-semibold text-white">
                <span>Palavra Inicial</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            <div className="sm:col-span-3">
              <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#111827] border border-white/10 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Tempo (min)...</span>
              </div>
            </div>
          </div>

          {/* Caixa de texto bíblico com versão */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                CONTEÚDO / DETALHES (OPCIONAL)
              </span>
              <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-slate-400">
                <span>VERSÃO DO TEXTO:</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#111827] border border-white/15 text-white font-extrabold">
                  BÍBLIA LIVRE (BLIVRE)
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-[#0B1120] border border-white/10 p-2.5 text-[11px] leading-relaxed text-slate-200 space-y-1">
              <p>
                1. Cantai ao SENHOR uma canção nova, porque ele fez maravilhas; sua mão direita e seu santo braço lhe fez ter a salvação.
              </p>
              <p className="text-slate-400 truncate">
                2. O SENHOR fez ser conhecida sua salvação; perante os olhos das nações ele mostrou sua justiça.
              </p>
            </div>
          </div>

          {/* Botão Assistente Bíblico */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-400/25 text-[11px] font-extrabold text-sky-300 uppercase tracking-wide">
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              ABRIR ASSISTENTE BÍBLICO
            </span>
          </div>
        </div>
      </div>

      {/* Bloco 2: Louvor / Adoração (borda lateral esquerda azul) */}
      <div className="rounded-2xl bg-[#111827] border border-white/10 border-l-4 border-l-[#3B82F6] p-3.5 sm:p-4 space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            <span className="text-xs font-black uppercase tracking-wider text-[#3B82F6]">
              LOUVOR / ADORAÇÃO
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-lg bg-[#0F172A] border border-white/10 flex items-center justify-center text-slate-400">
              <ChevronUp className="w-3.5 h-3.5" />
            </span>
            <span className="w-6 h-6 rounded-lg bg-[#0F172A] border border-white/10 flex items-center justify-center text-slate-300">
              <ChevronDown className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-[#0F172A]/80 border border-white/10 p-2.5 sm:p-3 flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-7 h-10 rounded-lg bg-[#111827] border border-white/10 flex items-center justify-center text-slate-400">
              <GripVertical className="w-3.5 h-3.5" />
            </span>
            <div className="flex flex-col gap-1">
              <span className="w-5 h-5 rounded-full bg-[#111827] border border-white/10 flex items-center justify-center text-slate-300">
                <ChevronUp className="w-3 h-3" />
              </span>
              <span className="w-5 h-5 rounded-full bg-[#111827] border border-white/10 flex items-center justify-center text-slate-300">
                <ChevronDown className="w-3 h-3" />
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <span className="w-6 h-6 rounded-full bg-[#3B82F6] text-white text-[11px] font-black flex items-center justify-center">
              2
            </span>
            <span className="text-[8px] font-bold text-sky-400 bg-sky-500/10 border border-sky-400/25 rounded px-1">
              10:30
            </span>
          </div>

          <span className="px-3 py-1.5 rounded-lg bg-[#3B82F6] text-white text-[10px] font-black uppercase tracking-wider shadow">
            CRIAÇÃO/ADORAÇÃO
          </span>

          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-wider text-sky-400">
              PRIMEIRA MÚSICA
            </div>
            <div className="flex items-center gap-1.5 text-sm font-extrabold text-white">
              <Music className="w-3.5 h-3.5 text-sky-400" />
              <span>Grande é o Senhor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bloco 3: Segundo bloco de Louvor / Adoração */}
      <div className="rounded-2xl bg-[#111827] border border-white/10 border-l-4 border-l-[#3B82F6] p-3.5 sm:p-4 space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            <span className="text-xs font-black uppercase tracking-wider text-[#3B82F6]">
              LOUVOR / ADORAÇÃO
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-lg bg-[#0F172A] border border-white/10 flex items-center justify-center text-slate-400">
              <ChevronUp className="w-3.5 h-3.5" />
            </span>
            <span className="w-6 h-6 rounded-lg bg-[#0F172A] border border-white/10 flex items-center justify-center text-slate-300">
              <ChevronDown className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-[#0F172A]/80 border border-white/10 p-2.5 sm:p-3 flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-7 h-10 rounded-lg bg-[#111827] border border-white/10 flex items-center justify-center text-slate-400">
              <GripVertical className="w-3.5 h-3.5" />
            </span>
            <div className="flex flex-col gap-1">
              <span className="w-5 h-5 rounded-full bg-[#111827] border border-white/10 flex items-center justify-center text-slate-300">
                <ChevronUp className="w-3 h-3" />
              </span>
              <span className="w-5 h-5 rounded-full bg-[#111827] border border-white/10 flex items-center justify-center text-slate-300">
                <ChevronDown className="w-3 h-3" />
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <span className="w-6 h-6 rounded-full bg-[#3B82F6] text-white text-[11px] font-black flex items-center justify-center">
              3
            </span>
            <span className="text-[8px] font-bold text-sky-400 bg-sky-500/10 border border-sky-400/25 rounded px-1">
              10:30
            </span>
          </div>

          <span className="px-3 py-1.5 rounded-lg bg-[#3B82F6] text-white text-[10px] font-black uppercase tracking-wider shadow">
            QUEDA/CONFISSÃO
          </span>

          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-wider text-sky-400">
              SEGUNDA MÚSICA
            </div>
            <div className="flex items-center gap-1.5 text-sm font-extrabold text-white">
              <Music className="w-3.5 h-3.5 text-sky-400" />
              <span>Perdão e Graça</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
