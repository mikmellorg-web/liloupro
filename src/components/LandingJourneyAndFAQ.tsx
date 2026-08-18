import React, { useState } from 'react';
import { 
  Check, 
  ArrowRight, 
  HelpCircle, 
  ChevronDown, 
  Sparkles, 
  ShieldCheck, 
  Smartphone, 
  RefreshCw, 
  Headphones, 
  Heart, 
  Clock, 
  CheckCircle2, 
  Lock, 
  Users, 
  Calendar,
  Award,
  Zap,
  UserCheck
} from 'lucide-react';
import { Music2 } from './MusicIcon';

interface LandingJourneyAndFAQProps {
  onEnterApp: (mode: 'login' | 'signup') => void;
}

export default function LandingJourneyAndFAQ({ onEnterApp }: LandingJourneyAndFAQProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const differentials = [
    {
      icon: Heart,
      title: "Exclusivo para igrejas",
      description: "Desenvolvido com profundo respeito pela dinâmica de ensaios, liturgia e voluntariado cristão."
    },
    {
      icon: Smartphone,
      title: "Uso imediato pela equipe",
      description: "Interface intuitiva onde qualquer voluntário aprende a confirmar escalas e abrir cifras no primeiro acesso."
    },
    {
      icon: Zap,
      title: "Ultraleve no celular",
      description: "Carrega na hora mesmo com internet móvel no palco ou na cabine de mídia durante o culto."
    },
    {
      icon: RefreshCw,
      title: "Melhorias contínuas",
      description: "Novos recursos liberados automaticamente sem interrupção de serviço e sem custo extra."
    },
    {
      icon: Headphones,
      title: "Suporte próximo em português",
      description: "Atendimento humano para auxiliar sua liderança na configuração e dúvidas do dia a dia."
    },
    {
      icon: ShieldCheck,
      title: "Em qualquer tela",
      description: "Funciona perfeitamente em computadores, tablets, Android e iPhone com modo escuro nativo."
    }
  ];

  const timelineSteps = [
    {
      day: "Dia 1",
      title: "Cadastro e configuração inicial",
      description: "Sua igreja cria a conta em 2 minutos (sem cartão de crédito) e cadastra os primeiros membros."
    },
    {
      day: "Dia 3",
      title: "Primeira escala montada",
      description: "O líder de louvor monta a primeira escala do domingo e a equipe recebe o convite no smartphone."
    },
    {
      day: "Dia 5",
      title: "Equipe confirmando com 1 toque",
      description: "Os músicos confirmam presença automaticamente, eliminando a cobrança no WhatsApp da liderança."
    },
    {
      day: "Dia 10",
      title: "Repertório na tonalidade correta",
      description: "As músicas são cadastradas no tom ideal da igreja com áudios para o estudo individual em casa."
    },
    {
      day: "Dia 15",
      title: "Primeiro culto integrado",
      description: "A liturgia é montada pelo pastor e líder de louvor, enquanto a mídia acompanha no navegador."
    },
    {
      day: "Dia 20",
      title: "Comunicação sem ruídos",
      description: "Avisos sobre horários de ensaio e trajes chegam aos escalados sem conversas paralelas."
    },
    {
      day: "Dia 30",
      title: "Tranquilidade como hábito",
      description: "O ministério inteiro utiliza o sistema com fluidez, ganhando mais tempo e foco para servir."
    }
  ];

  const faqs = [
    {
      q: "Como funciona o pagamento e liberação de acesso via Kiwify?",
      a: "O pagamento é processado de forma 100% segura através da Kiwify via PIX, Cartão de Crédito (em até 12x) ou Boleto. Assim que o pagamento é confirmado, você recebe o acesso imediato à plataforma com todos os recursos liberados."
    },
    {
      q: "Como funciona a garantia de 7 dias na Kiwify?",
      a: "Você tem 7 dias de garantia incondicional assegurada pela Kiwify. Se por qualquer motivo achar que a plataforma não atendeu as expectativas do seu ministério, basta solicitar o reembolso na Kiwify para receber 100% do seu dinheiro de volta sem burocracia."
    },
    {
      q: "Preciso de cartão de crédito para iniciar o período de teste?",
      a: "Não. Você pode iniciar os 30 dias grátis de avaliação diretamente no app sem preencher nenhum dado bancário ou cartão de crédito. Queremos que você sinta o valor na rotina da igreja primeiro."
    },
    {
      q: "Existe contrato de fidelidade ou multa?",
      a: "Não. O LiLouPro não prende igrejas com contratos ou multas. Caso decida cancelar sua assinatura, basta um único clique no painel de configurações sem burocracia."
    },
    {
      q: "Como funciona no smartphone dos voluntários?",
      a: "O LiLouPro é um Progressive Web App (PWA) construído com filosofia Mobile-First. Pode ser usado pelo navegador de qualquer aparelho ou instalado na tela inicial do iPhone/Android em segundos."
    },
    {
      q: "Quantos voluntários posso convidar no Plano Completo?",
      a: "Membros, músicos, vocais e técnicos de mídia são ilimitados no Plano Completo e no Acesso Vitalício. No Plano Semeadora (gratuito para sempre), você pode gerenciar até 15 membros ativos."
    },
    {
      q: "Posso importar cifras e repertórios já existentes da nossa igreja?",
      a: "Sim. Você pode cadastrar suas cifras, letras, tons originais de referência e links de áudio para que todos os músicos tenham acesso imediato e padronizado."
    },
    {
      q: "Como funciona o suporte para dúvidas da nossa liderança?",
      a: "Oferecemos suporte humanizado em português para auxiliar pastores, ministros e líderes de louvor em qualquer dúvida de uso ou configuração."
    }
  ];

  return (
    <div className="space-y-24 sm:space-y-32">
      {/* SEÇÃO 7: COMO COMEÇAR EM SUA IGREJA (Adoção em 3 etapas) */}
      <section id="como-funciona" className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand/10 border border-brand/25 text-brand text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Adoção Natural
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Como começar em sua igreja
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Uma implantação simples para que todos os voluntários acompanhem com tranquilidade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center text-brand font-black text-xl">
              1
            </div>
            <h3 className="text-xl font-bold text-white">
              Cadastre sua igreja
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Crie a conta em 2 minutos sem cartão de crédito. Insira o nome do ministério e defina seus horários de culto.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center text-brand font-black text-xl">
              2
            </div>
            <h3 className="text-xl font-bold text-white">
              Convide os voluntários
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Compartilhe o link da equipe com músicos e técnicos. Cada membro entra com seu nome e escolhe seus instrumentos.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center text-brand font-black text-xl">
              3
            </div>
            <h3 className="text-xl font-bold text-white">
              Monte sua primeira escala
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Organize a escala do culto e o repertório. A equipe é notificada no celular e confirma presença em instantes.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO 8: POR QUE MINISTÉRIOS ESCOLHEM O LILOUPRO */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Especializado no Reino
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Por que ministérios escolhem o LiLouPro
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Feito especificamente para a realidade de igrejas e equipes cristãs, sem improvisos de ferramentas genéricas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {differentials.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/60 hover:bg-slate-900/90 border border-white/10 hover:border-brand/40 rounded-3xl p-6 sm:p-8 space-y-4 transition-all duration-300 shadow-lg"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-brand">
                  <IconComp className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* SEÇÃO 9: O QUE ACONTECE NOS PRIMEIROS 30 DIAS (Timeline de Adoção) */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            Sem Pressão
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            O que acontece nos seus primeiros 30 dias
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Uma transição suave e respeitosa. Por isso seu teste gratuito dura 30 dias completos para que todos experimentem o valor com tranquilidade.
          </p>
        </div>

        <div className="relative border-l-2 border-brand/40 ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-10">
          {timelineSteps.map((step, idx) => (
            <div key={idx} className="relative group">
              <div className="absolute -left-[31px] sm:-left-[47px] top-1 w-4 h-4 rounded-full bg-brand border-4 border-slate-950 group-hover:scale-125 transition-transform" />
              
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-brand">
                  {step.day}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {step.title}
                </h3>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Citação Inspiradora & Compromisso de Marca */}
        <div className="mt-16 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0e172a] to-slate-900 border border-white/15 text-center space-y-3 shadow-xl">
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-relaxed max-w-3xl mx-auto italic">
            "Quando a organização deixa de ser uma preocupação, sobra mais tempo para aquilo que realmente importa: servir."
          </p>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            O compromisso LiLouPro com a sua igreja
          </div>
        </div>
      </section>

      {/* SEÇÃO 10: DEPOIMENTOS DE LIDERANÇA */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand/10 border border-brand/25 text-brand text-xs font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            Experiências na Prática
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            O que líderes dizem sobre a paz na rotina
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Relatos de quem substituiu planilhas soltas e cobranças no WhatsApp por uma organização harmoniosa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 flex flex-col justify-between shadow-lg">
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed italic">
              "Antes nós gastávamos horas cobrando confirmação de escala no WhatsApp. Agora cada voluntário confirma com 1 toque e sabemos com antecedência quem estará no culto."
            </p>
            <div className="pt-4 border-t border-white/5">
              <h4 className="font-bold text-white text-sm">Pr. Eduardo Martins</h4>
              <span className="text-xs text-slate-400">Líder de Louvor • São Paulo, SP</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 flex flex-col justify-between shadow-lg">
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed italic">
              "Para a banda, a transposição instantânea de cifra foi um divisor de águas. Mudamos o tom no ensaio de acordo com a voz e todo mundo toca na mesma sintonia."
            </p>
            <div className="pt-4 border-t border-white/5">
              <h4 className="font-bold text-white text-sm">Mariana Souza</h4>
              <span className="text-xs text-slate-400">Ministra e Tecladista • Curitiba, PR</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 flex flex-col justify-between shadow-lg">
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed italic">
              "A projeção pelo navegador simplificou o trabalho da equipe de mídia. Sem pen drive nem retrabalho reescrevendo letras antes de o culto começar."
            </p>
            <div className="pt-4 border-t border-white/5">
              <h4 className="font-bold text-white text-sm">Gabriel Andrade</h4>
              <span className="text-xs text-slate-400">Coordenador de Mídia e Projeção • Campinas, SP</span>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO INTEGRADA DE PLANOS / PREÇOS (Kiwify Checkout Integrado) */}
      <section id="planos" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Planos & Assinaturas Oficiais
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Escolha o plano ideal para a sua igreja
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Comece com teste gratuito no app ou assine com desconto especial e garantia total pela Kiwify.
          </p>

          {/* Seletor Mensal / Anual (com desconto) */}
          <div className="pt-2 flex items-center justify-center">
            <div className="bg-slate-900/90 border border-white/10 p-1 rounded-2xl flex items-center gap-1 shadow-lg">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  billingCycle === 'annual'
                    ? 'bg-brand text-slate-950 shadow-md shadow-brand/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Anual</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-slate-950/20 text-slate-950">
                  Economize 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Grid de Planos Principais (Completo, Premium e Vitalício) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch mb-10">
          
          {/* 1. PLANO COMPLETO */}
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl">
            <div className="space-y-4">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                {billingCycle === 'annual' ? 'Assinatura Anual' : 'Assinatura Mensal'}
              </span>
              <h3 className="text-2xl font-bold text-white">Plano Completo</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Ideal para ministérios que precisam de gestão eficiente de escalas, cifras transpostas e cancioneiro.
              </p>
              
              <div className="py-3 border-y border-white/10">
                {billingCycle === 'annual' ? (
                  <div>
                    <div className="text-xs text-slate-400 line-through">De R$ 588,00</div>
                    <span className="text-3xl sm:text-4xl font-black text-white">R$ 470,40</span>
                    <span className="text-xs text-slate-400"> / ano</span>
                    <div className="text-[11px] text-emerald-400 font-semibold mt-1">Equivale a apenas R$ 39,20/mês</div>
                  </div>
                ) : (
                  <div>
                    <span className="text-3xl sm:text-4xl font-black text-white">R$ 49,00</span>
                    <span className="text-xs text-slate-400"> / mês</span>
                  </div>
                )}
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Escalas e repertórios ilimitados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Cifras com transposição de tom e acordes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Confirmação de presença via smartphone</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Suporte via WhatsApp</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={billingCycle === 'annual' ? 'https://pay.kiwify.com.br/xrEKt4N' : 'https://pay.kiwify.com.br/3qXHMCe'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider text-center transition-all shadow-lg shadow-sky-500/20 cursor-pointer block"
              >
                Assinar Completo ({billingCycle === 'annual' ? 'R$ 470,40/ano' : 'R$ 49,00/mês'})
              </a>
              <button
                type="button"
                onClick={() => onEnterApp('signup')}
                className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ou testar 30 dias grátis
              </button>
            </div>
          </div>

          {/* 2. PLANO PREMIUM (Destaque) */}
          <div className="bg-slate-900 border-2 border-brand rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-2xl shadow-brand/20 relative md:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-brand text-slate-950 font-black text-[10px] uppercase tracking-wider shadow">
              Mais Recomendado
            </div>
            
            <div className="space-y-4">
              <span className="text-xs font-bold text-brand uppercase tracking-wider">
                {billingCycle === 'annual' ? 'Assinatura Anual com Desconto' : 'Assinatura Mensal VIP'}
              </span>
              <h3 className="text-2xl font-bold text-white">Plano Premium</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                A experiência definitiva com projeção ao vivo no telão, múltiplos ministérios, relatórios e suporte prioritário.
              </p>
              
              <div className="py-3 border-y border-white/10">
                {billingCycle === 'annual' ? (
                  <div>
                    <div className="text-xs text-slate-400 line-through">De R$ 1.188,00</div>
                    <span className="text-4xl font-black text-brand">R$ 950,40</span>
                    <span className="text-xs text-slate-400"> / ano</span>
                    <div className="text-[11px] text-brand font-semibold mt-1">Equivale a apenas R$ 79,20/mês</div>
                  </div>
                ) : (
                  <div>
                    <span className="text-4xl font-black text-brand">R$ 99,00</span>
                    <span className="text-xs text-slate-400"> / mês</span>
                  </div>
                )}
              </div>

              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span><strong>Tudo do Plano Completo</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>Projeção para telão em tempo real</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>Múltiplos ministérios e congregações</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>Histórico completo, estatísticas e escalas avançadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>Suporte prioritário exclusivo via WhatsApp</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={billingCycle === 'annual' ? 'https://pay.kiwify.com.br/xlsUZKY' : 'https://pay.kiwify.com.br/BlF0RJs'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-xl bg-brand hover:bg-brand/90 text-slate-950 font-black text-xs uppercase tracking-wider text-center shadow-lg shadow-brand/25 transition-all cursor-pointer block"
              >
                Assinar Premium ({billingCycle === 'annual' ? 'R$ 950,40/ano' : 'R$ 99,00/mês'})
              </a>
              <button
                type="button"
                onClick={() => onEnterApp('signup')}
                className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ou testar 30 dias grátis
              </button>
            </div>
          </div>

          {/* 3. CONDIÇÃO DE LANÇAMENTO: VITALÍCIO */}
          <div className="bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl">
            <div className="space-y-4">
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">Oferta de Lançamento</span>
              <h3 className="text-2xl font-bold text-white">Acesso Vitalício</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Pagamento único para acesso permanente a todas as funções completas e futuras atualizações sem mensalidades.
              </p>
              
              <div className="py-3 border-y border-white/10">
                <div className="text-xs text-slate-400 line-through">De R$ 1.490,00</div>
                <span className="text-3xl sm:text-4xl font-black text-amber-400">R$ 697,90</span>
                <span className="text-xs text-slate-400"> pagamento único</span>
                <div className="text-[11px] text-amber-300 font-semibold mt-1">Ou em até 12x no cartão de crédito</div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>Acesso permanente vitalício</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Sem mensalidades ou anuidades</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Todas as funcionalidades ilimitadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Garantia de 7 dias com reembolso total</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href="https://pay.kiwify.com.br/hzdGE1G"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider text-center transition-all shadow-lg shadow-amber-500/20 cursor-pointer block"
              >
                Garantir Vitalício (R$ 697,90)
              </a>
              <p className="text-center text-[11px] text-slate-400">
                Checkout seguro e instantâneo via Kiwify
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé da Seção de Preços com Selos de Confiança */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-wrap items-center justify-around gap-4 text-xs text-slate-400 text-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Pagamento 100% seguro via Kiwify</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand" />
            <span>Liberação imediata de acesso</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Garantia incondicional de 7 dias</span>
          </div>
        </div>
      </section>

      {/* SEÇÃO 11: PERGUNTAS FREQUENTES (FAQ) */}
      <section id="faq" className="max-w-4xl mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            Dúvidas Frequentes
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Perguntas Frequentes
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Respostas claras sobre o funcionamento, testes e planos da plataforma.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                className="bg-slate-900/70 border border-white/10 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-white text-base sm:text-lg">
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-slate-300 text-sm sm:text-base leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SEÇÃO 12: CHAMADA FINAL */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a1829] to-slate-900 border border-white/15 p-10 sm:p-16 lg:p-20 text-center space-y-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-brand/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              A organização que a sua equipe de louvor merece.
            </h2>

            <p className="text-slate-300 text-base sm:text-lg lg:text-xl leading-relaxed">
              Experimente o LiLouPro em sua igreja por 30 dias gratuitos. 
              Menos tempo organizando e mais tranquilidade para liderar a adoração.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onEnterApp('signup')}
                className="w-full sm:w-auto px-10 py-5 bg-brand hover:bg-brand/90 text-slate-950 font-black rounded-2xl text-lg shadow-2xl shadow-brand/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>Começar meu teste gratuito</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => onEnterApp('login')}
                className="w-full sm:w-auto px-8 py-5 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold rounded-2xl text-base transition-all text-center"
              >
                Já tenho conta • Entrar
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400 pt-4">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-brand" /> Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-brand" /> 30 dias ilimitados
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-brand" /> Suporte em português
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER INSTITUCIONAL */}
      <footer className="border-t border-white/10 pt-16 pb-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <Music2 className="w-6 h-6 text-brand" />
              <span className="text-lg font-black text-white tracking-tight">LiLouPro</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              O sistema de gestão de escalas, repertório, cifras e projeção para ministérios de louvor.
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-sm">Plataforma</h4>
            <ul className="space-y-2">
              <li><a href="#funcionalidades" className="hover:text-white transition-colors">Módulos</a></li>
              <li><a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a></li>
              <li><a href="#planos" className="hover:text-white transition-colors">Preços</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Dúvidas Frequentes</a></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-sm">Acesso</h4>
            <ul className="space-y-2">
              <li><button onClick={() => onEnterApp('signup')} className="hover:text-white transition-colors text-left">Teste Gratuito</button></li>
              <li><button onClick={() => onEnterApp('login')} className="hover:text-white transition-colors text-left">Área do Membro</button></li>
              <li><a href="https://pay.kiwify.com.br/hzdGE1G" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Assinatura Kiwify</a></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-sm">Suporte & Contato</h4>
            <p className="text-slate-400">
              Dúvidas na configuração da sua igreja? Fale direto no WhatsApp com nossa equipe:
            </p>
            <a 
              id="link-footer-whatsapp"
              href="https://wa.me/5551926361240?text=Ol%C3%A1!%20Gostaria%20de%20falar%20com%20a%20equipe%20do%20LiLouPro."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold text-sm bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/20 transition-all hover:bg-emerald-500/20"
            >
              <svg 
                className="w-4 h-4 fill-emerald-400" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.301-.15-1.777-.877-2.052-.977-.276-.1-.477-.15-.677.15-.2.301-.777.977-.953 1.177-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.897-.801-1.503-1.791-1.679-2.092-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.201-.301.301-.502.1-.2.05-.376-.025-.526-.075-.15-.677-1.63-.927-2.232-.244-.587-.492-.507-.677-.517-.175-.01-.376-.01-.577-.01-.2 0-.527.075-.802.376-.276.301-1.053 1.028-1.053 2.508 0 1.48 1.078 2.909 1.229 3.11.15.2 2.122 3.24 5.141 4.544 3.02 1.304 3.02.87 3.571.815.552-.055 1.777-.726 2.028-1.43.25-.703.25-1.304.175-1.43-.075-.125-.276-.2-.577-.35zM12.042 21.666a9.585 9.585 0 01-4.887-1.332l-.35-.208-3.633.953.97-3.541-.227-.362a9.58 9.58 0 01-1.469-5.136c0-5.302 4.316-9.617 9.623-9.617 2.569 0 4.985 1.002 6.802 2.82 1.817 1.818 2.818 4.234 2.818 6.804 0 5.304-4.316 9.619-9.647 9.619zm7.98-17.592A11.233 11.233 0 0012.042 1C5.938 1 .97 5.968.97 12.072c0 1.95.508 3.856 1.474 5.534L1 23.364l5.908-1.55a11.206 11.206 0 005.134 1.248h.005c6.104 0 11.072-4.969 11.072-11.074 0-2.959-1.152-5.741-3.249-7.838z" />
              </svg>
              <span>Fale com nossa equipe no WhatsApp</span>
            </a>
            <p className="text-brand font-mono text-xs font-semibold pt-1">suporte@liloupro.com.br</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <div>
            © {new Date().getFullYear()} LiLouPro. Criado para servir ministérios de louvor e adoração.
          </div>
          <div className="flex gap-6">
            <button onClick={() => onEnterApp('login')} className="hover:text-white transition-colors">
              Termos de Uso
            </button>
            <button onClick={() => onEnterApp('login')} className="hover:text-white transition-colors">
              Privacidade
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
