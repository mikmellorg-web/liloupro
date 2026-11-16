import React from 'react';
import {
  Tv,
  Smartphone,
  BookOpen,
  ExternalLink,
  Layers,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Trash2,
  Clock,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Palette,
  Sliders,
  Send
} from 'lucide-react';

interface ProjectionDashboardPreviewProps {
  variant?: 'compact' | 'expanded';
}

const LITURGY_SCRIPT_ITEMS = [
  { label: 'Salmos 117:1-2 (BLIVRE)', active: false, tag: 'LEITURA' },
  { label: 'Teu Povo', active: true, tag: 'MÚSICA' },
  { label: 'Depois do Jardim', active: false, tag: 'MÚSICA' }
];

const QUICK_NOTICE_PILLS = [
  'CULTO INICIA EM BREVE',
  'BOAS-VINDAS!',
  'CELULAR SILENCIOSO',
  'DÍZIMOS E OFERTAS'
];

const TIMER_PILLS = ['+1m', '+3m', '+5m', '+10m', '+15m'];

const MARQUEE_PILLS = [
  'Chamar Berçário',
  'Placa do Carro',
  'Reunião de Obreiros'
];

const SLIDE_CARDS = [
  {
    num: 1,
    text: 'Somos teu povo, a tua igreja...',
    active: false
  },
  {
    num: 2,
    text: 'Faça tua vontade através de nós...',
    active: false
  },
  {
    num: 3,
    text: 'Tú és a paz que acalma...',
    active: false
  },
  {
    num: 4,
    text: 'E nós somos teus pés e tuas mãos / Tua verdade sempre permanecerá',
    active: true
  },
  {
    num: 5,
    text: 'Do teu amor quem poderá nos separar...',
    active: false
  },
  {
    num: 6,
    text: 'E então o mundo inteiro verá...',
    active: false
  }
];

const OPERATOR_GUIDE_COLUMNS = [
  {
    num: 1,
    title: 'A TRANSMISSÃO (TELAS)',
    icon: Monitor,
    accent: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
    bullets: [
      'Clique em Abrir Janela do Projetor.',
      'Arraste a janela para a segunda tela (telão/TV).',
      'Pressione F11 para tela cheia.',
      'Dica: Use Win + P e escolha Estender.'
    ]
  },
  {
    num: 2,
    title: 'LITURGIA & LETRAS',
    icon: Layers,
    accent: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    bullets: [
      'Sincronize o culto ativo no painel esquerdo.',
      'Navegue nos slides pelas Setas do Teclado ◀ / ▶.',
      'Vincule músicas do repertório com 1 clique.'
    ]
  },
  {
    num: 3,
    title: 'TROCA DE FUNDO',
    icon: Palette,
    accent: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    bullets: [
      'Alterne entre cores sólidas de alto contraste.',
      'Use Sugestões Curadas prontas para culto.',
      'Envie imagens JPG/PNG da igreja.',
      'Ajustes Finos de brilho para projetor VGA antigo.'
    ]
  },
  {
    num: 4,
    title: 'CONTROLES & ALERTAS',
    icon: Sliders,
    accent: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    bullets: [
      'Blackout / Tela Encoberta para pausas rápidas.',
      'Limpar Texto nos momentos instrumentais.',
      'Alertas Rolantes na base da tela sem cortar a letra.'
    ]
  }
];

export function ProjectionDashboardPreview({ variant = 'compact' }: ProjectionDashboardPreviewProps) {
  if (variant === 'compact') {
    return (
      <div className="w-full h-full bg-[#0B1120] text-white p-1.5 sm:p-2.5 pb-6 sm:pb-8 flex flex-col gap-1 sm:gap-1.5 overflow-hidden select-none">
        {/* Cabeçalho + botões superiores coloridos */}
        <div className="bg-[#111827] border border-white/10 rounded-lg px-1.5 sm:px-2 py-1 flex flex-col gap-1 shrink-0">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0">
              <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-[#3B82F6]/20 border border-[#3B82F6]/40 flex items-center justify-center text-[#3B82F6] shrink-0">
                <Tv className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              </span>
              <span className="text-[7px] sm:text-[9.5px] font-black tracking-tight text-white truncate">
                Projeção Data Show
              </span>
            </div>
            <span className="text-[4.5px] sm:text-[6px] font-extrabold uppercase px-1 py-[1px] rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
              AO VIVO
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-[2px] sm:gap-1">
            <span className="px-1 sm:px-1.5 py-[1.5px] rounded bg-purple-600 text-white text-[4px] sm:text-[5.5px] font-extrabold uppercase">
              OBS STUDIO & HOLYRICS
            </span>
            <span className="px-1 sm:px-1.5 py-[1.5px] rounded bg-orange-500 text-white text-[4px] sm:text-[5.5px] font-extrabold uppercase">
              CONTROLE PELO CELULAR
            </span>
            <span className="px-1 sm:px-1.5 py-[1.5px] rounded bg-slate-700 text-slate-200 text-[4px] sm:text-[5.5px] font-extrabold uppercase">
              MANUAL DO OPERADOR
            </span>
            <span className="px-1 sm:px-1.5 py-[1.5px] rounded bg-[#3B82F6] text-white text-[4px] sm:text-[5.5px] font-extrabold uppercase">
              ABRIR JANELA DO PROJETOR
            </span>
            <span className="px-1 sm:px-1.5 py-[1.5px] rounded bg-emerald-600 text-white text-[4px] sm:text-[5.5px] font-extrabold uppercase">
              NOVA ABA (LINK SEGURO)
            </span>
          </div>
        </div>

        {/* Corpo em 2 colunas compactas */}
        <div className="grid grid-cols-12 gap-1 sm:gap-1.5 flex-1 min-h-0">
          {/* Coluna Esquerda */}
          <div className="col-span-4 flex flex-col gap-1 min-h-0">
            <div className="bg-[#111827] border border-white/10 rounded-lg p-1 sm:p-1.5 shrink-0">
              <div className="text-[4.2px] sm:text-[5.5px] font-black uppercase tracking-wider text-slate-400">
                SINCRONIZAR COM CULTO
              </div>
              <div className="mt-0.5 px-1 py-[2px] rounded bg-[#0F172A] border border-white/10 text-[5px] sm:text-[6.5px] font-bold text-sky-300 truncate">
                08/11 - Culto Domingo
              </div>
            </div>

            <div className="bg-[#111827] border border-white/10 rounded-lg p-1 sm:p-1.5 flex-1 flex flex-col gap-[3px] min-h-0 overflow-hidden">
              <div className="text-[4.2px] sm:text-[5.5px] font-black uppercase tracking-wider text-slate-400 truncate">
                ROTEIRO DA LITURGIA (12 ITENS)
              </div>
              <div className="flex flex-col gap-[2px] sm:gap-1">
                {LITURGY_SCRIPT_ITEMS.map((it) => (
                  <div
                    key={it.label}
                    className={`px-1 sm:px-1.5 py-[2px] sm:py-1 rounded border text-[4.8px] sm:text-[6.5px] font-bold truncate ${
                      it.active
                        ? 'bg-[#3B82F6] border-[#3B82F6] text-white shadow-sm'
                        : 'bg-[#0F172A] border-white/10 text-slate-300'
                    }`}
                  >
                    {it.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="col-span-8 bg-[#111827] border border-white/10 rounded-lg p-1 sm:p-1.5 flex flex-col gap-1 min-h-0 overflow-hidden">
            <div className="text-[4.5px] sm:text-[6px] font-black uppercase tracking-wider text-sky-400">
              PAINEL DE CONTROLE EM TEMPO REAL
            </div>

            {/* Botões de tela */}
            <div className="grid grid-cols-4 gap-[2px] sm:gap-1">
              <span className="py-[2px] px-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-[4px] sm:text-[5.5px] font-extrabold text-emerald-300 text-center truncate">
                TELA ATIVA
              </span>
              <span className="py-[2px] px-1 rounded bg-slate-800 border border-white/10 text-[4px] sm:text-[5.5px] font-extrabold text-slate-200 text-center truncate">
                LIMPAR TEXTO
              </span>
              <span className="py-[2px] px-1 rounded bg-slate-800 border border-white/10 text-[4px] sm:text-[5.5px] font-extrabold text-slate-200 text-center truncate">
                PROJETAR LOGO
              </span>
              <span className="py-[2px] px-1 rounded bg-red-500/20 border border-red-500/40 text-[4px] sm:text-[5.5px] font-extrabold text-red-300 text-center truncate">
                LIMPAR TUDO [C]
              </span>
            </div>

            {/* Atalhos de avisos rápidos */}
            <div className="bg-[#0F172A]/80 border border-white/5 rounded p-1 space-y-[3px]">
              <div className="text-[4px] sm:text-[5.5px] font-black uppercase text-slate-400">
                ATALHOS DE AVISOS RÁPIDOS
              </div>
              <div className="flex flex-wrap gap-[2px]">
                {QUICK_NOTICE_PILLS.map((pill) => (
                  <span
                    key={pill}
                    className="px-1 py-[1px] rounded bg-[#1E293B] border border-white/10 text-[3.8px] sm:text-[5px] font-bold text-slate-200"
                  >
                    {pill}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <div className="flex-1 px-1 py-[1.5px] rounded bg-[#0B1120] border border-white/10 text-[4px] sm:text-[5.2px] text-slate-400 truncate">
                  Digite outro aviso personalizado...
                </div>
                <span className="px-1.5 py-[1.5px] rounded bg-[#3B82F6] text-white text-[4px] sm:text-[5.2px] font-extrabold shrink-0">
                  PROJETAR
                </span>
              </div>
            </div>

            {/* Cronômetro no telão */}
            <div className="bg-[#0F172A]/80 border border-white/5 rounded p-1 flex flex-wrap items-center justify-between gap-1">
              <span className="text-[4px] sm:text-[5.2px] font-black uppercase text-slate-300">
                CRONÔMETRO NO TELÃO: <span className="text-slate-400">INATIVO</span>
              </span>
              <div className="flex items-center gap-[2px]">
                {TIMER_PILLS.map((t) => (
                  <span
                    key={t}
                    className="px-1 py-[1px] rounded bg-[#1E293B] border border-white/10 text-[4px] sm:text-[5px] font-extrabold text-sky-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Letreiro de alertas (marquee) */}
            <div className="bg-[#0F172A]/80 border border-white/5 rounded p-1 space-y-[3px]">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[4px] sm:text-[5.2px] font-black uppercase text-rose-300 truncate">
                  LETREIRO DE ALERTAS (MARQUEE)
                </span>
                <span className="px-1.5 py-[1px] rounded bg-red-600 text-white text-[4px] sm:text-[5px] font-extrabold shrink-0">
                  EXIBIR ALERTA
                </span>
              </div>
              <div className="flex flex-wrap gap-[2px]">
                {MARQUEE_PILLS.map((m) => (
                  <span
                    key={m}
                    className="px-1 py-[1px] rounded bg-[#1E293B] border border-rose-500/20 text-[3.8px] sm:text-[5px] font-bold text-slate-200"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Variant: expanded (Aba 1 do Modal)
  return (
    <div className="w-full bg-[#0B1120] text-white p-3 sm:p-5 rounded-xl space-y-3 select-none">
      {/* Cabeçalho e botões superiores */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-3 sm:p-4 space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/35 flex items-center justify-center text-[#3B82F6]">
              <Tv className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-base sm:text-lg font-black text-white leading-tight">
                Projeção Data Show
              </h4>
              <p className="text-[11px] text-slate-400">
                Sincronização ao vivo com telão, OBS Studio e controle remoto
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600 text-white text-[10px] font-extrabold uppercase shadow">
            OBS STUDIO & HOLYRICS
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-500 text-white text-[10px] font-extrabold uppercase shadow">
            <Smartphone className="w-3 h-3" />
            CONTROLE PELO CELULAR
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700 text-slate-100 text-[10px] font-extrabold uppercase">
            <BookOpen className="w-3 h-3" />
            MANUAL DO OPERADOR
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#3B82F6] text-white text-[10px] font-extrabold uppercase shadow">
            <Tv className="w-3 h-3" />
            ABRIR JANELA DO PROJETOR
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-extrabold uppercase shadow">
            <ExternalLink className="w-3 h-3" />
            NOVA ABA (LINK SEGURO)
          </span>
        </div>
      </div>

      {/* Coluna esquerda + Coluna direita */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Coluna Esquerda */}
        <div className="md:col-span-4 space-y-3">
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-3 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              SINCRONIZAR COM CULTO
            </span>
            <div className="px-3 py-2 rounded-xl bg-[#0F172A] border border-white/10 text-xs font-bold text-sky-300 flex items-center justify-between">
              <span>08/11 - Culto Domingo</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
          </div>

          <div className="bg-[#111827] border border-white/10 rounded-2xl p-3 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              ROTEIRO DA LITURGIA (12 ITENS)
            </span>
            <div className="space-y-1.5">
              {LITURGY_SCRIPT_ITEMS.map((it) => (
                <div
                  key={it.label}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
                    it.active
                      ? 'bg-[#3B82F6] border-[#3B82F6] text-white shadow-md'
                      : 'bg-[#0F172A] border-white/10 text-slate-300'
                  }`}
                >
                  <span className="truncate">{it.label}</span>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                      it.active ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {it.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna Direita */}
        <div className="md:col-span-8 bg-[#111827] border border-white/10 rounded-2xl p-3.5 space-y-3">
          <span className="text-[11px] font-black uppercase tracking-wider text-sky-400 block">
            PAINEL DE CONTROLE EM TEMPO REAL
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <span className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-extrabold text-emerald-300">
              <Eye className="w-3.5 h-3.5" />
              TELA ATIVA
            </span>
            <span className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-800 border border-white/10 text-[10px] font-extrabold text-slate-200">
              <EyeOff className="w-3.5 h-3.5" />
              LIMPAR TEXTO
            </span>
            <span className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-800 border border-white/10 text-[10px] font-extrabold text-slate-200">
              <ImageIcon className="w-3.5 h-3.5" />
              PROJETAR LOGO
            </span>
            <span className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-red-500/20 border border-red-500/40 text-[10px] font-extrabold text-red-300">
              <Trash2 className="w-3.5 h-3.5" />
              LIMPAR TUDO [C]
            </span>
          </div>

          <div className="bg-[#0F172A]/90 border border-white/10 rounded-xl p-3 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              ATALHOS DE AVISOS RÁPIDOS
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_NOTICE_PILLS.map((pill) => (
                <span
                  key={pill}
                  className="px-2.5 py-1 rounded-lg bg-[#1E293B] border border-white/10 text-[10px] font-bold text-slate-200"
                >
                  {pill}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex-1 px-3 py-1.5 rounded-lg bg-[#0B1120] border border-white/10 text-xs text-slate-400">
                Digite outro aviso personalizado...
              </div>
              <span className="px-3.5 py-1.5 rounded-lg bg-[#3B82F6] text-white text-xs font-extrabold">
                PROJETAR
              </span>
            </div>
          </div>

          <div className="bg-[#0F172A]/90 border border-white/10 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-300">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              CRONÔMETRO NO TELÃO: <span className="text-slate-400">INATIVO</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {TIMER_PILLS.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-lg bg-[#1E293B] border border-white/10 text-[10px] font-extrabold text-sky-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-[#0F172A]/90 border border-white/10 rounded-xl p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-rose-300">
                <Megaphone className="w-3.5 h-3.5 text-rose-400" />
                LETREIRO DE ALERTAS (MARQUEE)
              </span>
              <span className="px-3 py-1 rounded-lg bg-red-600 text-white text-[10px] font-extrabold uppercase">
                EXIBIR ALERTA
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MARQUEE_PILLS.map((m) => (
                <span
                  key={m}
                  className="px-2.5 py-1 rounded-lg bg-[#1E293B] border border-rose-500/20 text-[10px] font-bold text-slate-200"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectionSlidesPreview() {
  return (
    <div className="w-full bg-[#0B1120] text-white p-3 sm:p-5 rounded-xl space-y-4 select-none">
      {/* Cabeçalho da música selecionada */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#111827] border border-white/10 rounded-xl px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-[10px] font-black text-sky-300 uppercase">
            MÚSICA ATIVA
          </span>
          <span className="text-sm font-black text-white">Teu Povo</span>
        </div>
        <span className="text-[11px] font-bold text-emerald-400">
          Slide 4 de 6 em exibição
        </span>
      </div>

      {/* Grade 3x2 de cards de estrofes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {SLIDE_CARDS.map((slide) => (
          <div
            key={slide.num}
            className={`rounded-xl p-3 border transition-all space-y-1.5 ${
              slide.active
                ? 'bg-[#3B82F6]/20 border-[#3B82F6] shadow-lg shadow-blue-500/15 ring-1 ring-[#3B82F6]/50'
                : 'bg-[#111827] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[10px] font-black uppercase tracking-wider ${
                  slide.active ? 'text-sky-300' : 'text-slate-400'
                }`}
              >
                SLIDE {slide.num}
              </span>
              {slide.active && (
                <span className="px-1.5 py-0.5 rounded bg-[#3B82F6] text-white text-[9px] font-black uppercase">
                  NO TELÃO
                </span>
              )}
            </div>
            <p className="text-xs font-semibold leading-snug text-slate-100">
              {slide.text}
            </p>
          </div>
        ))}
      </div>

      {/* Simulador do Projetor + Digitação Livre ao Vivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">
              SIMULADOR DO PROJETOR (PREVIEW AO VIVO)
            </span>
          </div>
          <div className="bg-black border border-white/15 rounded-xl py-7 px-4 flex flex-col items-center justify-center text-center min-h-[120px]">
            <p className="text-sm sm:text-base font-extrabold text-white leading-relaxed">
              E nós somos teus pés e tuas mãos
              <br />
              Tua verdade sempre permanecerá
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-300">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0F172A] border border-white/10">
              <ChevronLeft className="w-3 h-3" />
            </span>
            <span>Use as setas do teclado ◀ / ▶</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0F172A] border border-white/10">
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        <div className="bg-[#111827] border border-white/10 rounded-2xl p-3 space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
              DIGITAÇÃO LIVRE AO VIVO
            </span>
            <div className="bg-[#0B1120] border border-white/10 rounded-xl p-3 min-h-[92px] text-xs text-slate-400">
              Digite um texto, referência bíblica ou frase espontânea para projetar imediatamente no telão...
            </div>
          </div>
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-xs font-extrabold shadow">
              <Send className="w-3.5 h-3.5" />
              PROJETAR TEXTO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectionOperatorGuidePreview() {
  return (
    <div className="w-full bg-[#0B1120] text-white p-3 sm:p-5 rounded-xl space-y-4 select-none">
      <div className="text-center space-y-1">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400">
          REFERÊNCIA RÁPIDA DE MÍDIA
        </span>
        <h4 className="text-sm sm:text-base font-black uppercase tracking-wide text-white">
          GUIA PRÁTICO DO OPERADOR DE PROJEÇÃO
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {OPERATOR_GUIDE_COLUMNS.map((col) => {
          const IconComp = col.icon;
          return (
            <div
              key={col.num}
              className="bg-[#111827] border border-white/10 rounded-2xl p-3.5 space-y-2.5 flex flex-col"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${col.accent}`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-slate-400 block leading-none">
                    PASSO {col.num}
                  </span>
                  <h5 className="text-xs font-black text-white leading-tight mt-0.5">
                    {col.num}. {col.title}
                  </h5>
                </div>
              </div>

              <ul className="space-y-1.5 text-[11px] text-slate-300 leading-relaxed pt-1 border-t border-white/5">
                {col.bullets.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-sky-400 font-bold shrink-0">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
