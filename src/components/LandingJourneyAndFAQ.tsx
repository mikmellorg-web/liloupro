import React, { useState, useRef, useEffect } from 'react';
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
import luxuryAppIcon from '../assets/images/liloupro_luxury_logo_1787753536902.jpg';

interface LandingJourneyAndFAQProps {
  onEnterApp: (mode: 'login' | 'signup') => void;
}

export default function LandingJourneyAndFAQ({ onEnterApp }: LandingJourneyAndFAQProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const adoptionCarouselRef = useRef<HTMLDivElement>(null);
  const [activeAdoptionStep, setActiveAdoptionStep] = useState<number>(0);

  useEffect(() => {
    if (adoptionCarouselRef.current) {
      adoptionCarouselRef.current.scrollLeft = 0;
    }
  }, []);

  const handleAdoptionScroll = () => {
    const el = adoptionCarouselRef.current;
    if (!el) return;
    if (el.scrollLeft <= 10) {
      setActiveAdoptionStep(0);
      return;
    }
    const children = Array.from(el.children) as HTMLElement[];
    if (children.length === 0) return;
    const containerCenter = el.scrollLeft + el.clientWidth / 2;
    let closestIdx = 0;
    let minDist = Infinity;
    children.forEach((child, idx) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(childCenter - containerCenter);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });
    setActiveAdoptionStep(closestIdx);
  };

  const scrollToAdoptionStep = (idx: number) => {
    setActiveAdoptionStep(idx);
    const el = adoptionCarouselRef.current;
    if (!el) return;
    if (idx === 0) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }
    const target = el.children[idx] as HTMLElement | undefined;
    if (!target) return;
    const targetLeft = target.offsetLeft - (el.clientWidth - target.offsetWidth) / 2;
    el.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
  };

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
      day: "Primeiros minutos",
      title: "Conta criada, igreja configurada",
      description: "Cadastro em 2 minutos, sem cartão de crédito. Defina os horários de culto do seu jeito — um ou vários por semana."
    },
    {
      day: "Primeira semana",
      title: "Escala montada e equipe confirmando",
      description: "O líder monta a primeira escala, a equipe recebe o convite no celular e confirma presença com 1 toque — chega de cobrança no grupo do WhatsApp."
    },
    {
      day: "Primeiro culto no app",
      title: "Ensaio, liturgia e projeção juntos",
      description: "Repertório no tom certo, ordem litúrgica alinhada com o pastor e projeção direto do navegador — tudo já em uso no seu primeiro culto com o LiLouPro."
    },
    {
      day: "Até o dia 30",
      title: "Uso natural, sem esforço",
      description: "Sua equipe já incorporou o app na rotina. Os 30 dias servem pra você confirmar com calma que faz sentido continuar — sem nenhuma obrigação."
    }
  ];

  const faqs = [
    {
      q: "Preciso de cartão de crédito para iniciar o teste de 30 dias?",
      a: "Não, absolutamente nenhum cartão de crédito ou dado de pagamento é solicitado para criar a conta da sua igreja. O teste de 30 dias oferece acesso gratuito ao Plano Completo (com limite de até 50 membros ativos, projeção OBS Studio & Holyrics, Assistente IA e exportação Google Docs), sem compromisso financeiro. Você só decide sobre a assinatura se e quando a plataforma fizer sentido real para o seu ministério."
    },
    {
      q: "O que acontece quando os 30 dias de teste terminarem?",
      a: "Como não pedimos cartão de crédito, você nunca será cobrado de forma automática ou inesperada. Ao final dos 30 dias, todas as suas músicas, cifras cadastradas, voluntários e histórico de escalas continuam 100% salvos e protegidos na nuvem — nenhum dado é apagado. Sem uma assinatura ativa, o cadastro de novos membros, novos cultos e os recursos completos ficam pausados até que a igreja escolha assinar o Plano Completo (até 50 membros) ou fazer upgrade para o Plano Premium (membros ilimitados e multi-campus)."
    },
    {
      q: "Existe algum contrato de fidelidade ou multa se decidirmos cancelar?",
      a: "Não existe qualquer tipo de contrato de fidelidade, carência ou multa. As assinaturas funcionam mês a mês (ou anual com 20% de desconto), e você pode pausar ou cancelar a renovação a qualquer momento sem burocracia."
    },
    {
      q: "Como o sistema funciona no smartphone dos voluntários e músicos?",
      a: "O LiLouPro foi construído com arquitetura Mobile-First via Progressive Web App (PWA). Os voluntários não precisam ocupar memória baixando aplicativos pesados da loja: basta abrir o link da igreja no navegador do iPhone ou Android e, se preferirem, fixar o ícone na tela inicial em 2 segundos. Pelo celular, eles confirmam escalas, visualizam cifras com transposição de tom e ouvem os áudios de ensaio."
    },
    {
      q: "Quantos voluntários posso convidar no Plano Completo?",
      a: "O Plano Completo — assim como o período de teste gratuito de 30 dias — comporta até 50 membros ativos na equipe (entre músicos, vocais, pastores e operadores de mídia), atendendo com folga igrejas e ministérios locais. Se a sua equipe atingir 50 membros ou a sua igreja atuar em rede e múltiplos polos, basta fazer o upgrade para o Plano Premium para liberar membros 100% ilimitados."
    },
    {
      q: "Qual a diferença entre o Plano Completo e o Plano Premium?",
      a: "O Plano Completo (R$ 49/mês ou R$ 39,20/mês no anual) é ideal para igrejas e ministérios locais e já inclui até 50 membros ativos, repertório, cifras e liturgias ilimitadas, escalas e confirmação via WhatsApp, projeção integrada para OBS Studio & Holyrics, Assistente IA e exportação para Google Docs. Já o Plano Premium (R$ 99/mês ou R$ 79,20/mês no anual) é voltado para igrejas em crescimento, redes e múltiplos polos, liberando membros ILIMITADOS na equipe, Gestão Multi-Campus / Múltiplas Congregações, relatórios gerenciais consolidados de participação e suporte prioritário via WhatsApp / VIP."
    },
    {
      q: "Posso importar cifras e repertórios que nossa igreja já utiliza?",
      a: "Sim! Você pode cadastrar facilmente suas canções colando letras e cifras no formato tradicional, definir o tom ideal da igreja, indicar o andamento (BPM) e anexar links de áudio de referência (YouTube, Spotify ou gravações do ensaio). As cifras contam com transposição instantânea para qualquer tom e diagramas automáticos para violão e teclado."
    },
    {
      q: "Como funciona o suporte para a nossa liderança e equipe?",
      a: "Nosso suporte é 100% humanizado e em português, realizado pelo WhatsApp e por e-mail por pessoas que conhecem de perto a rotina de ministérios de louvor e igrejas. Ajudamos na configuração inicial, cadastro de membros e qualquer alinhamento técnico ou litúrgico — sendo que assinantes do Plano Premium contam com atendimento prioritário VIP via WhatsApp."
    },
    {
      q: "Como funciona a garantia caso decidamos assinar após o teste?",
      a: "Além de experimentar livremente durante os 30 dias de teste sem cartão, caso sua igreja decida contratar um plano pago via Kiwify, você conta com 7 dias de garantia incondicional assegurada por lei. Se por qualquer motivo achar que a plataforma não atendeu às necessidades da sua equipe, basta solicitar o reembolso na Kiwify para receber 100% do valor de volta."
    }
  ];

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* SEÇÃO 7: COMO COMEÇAR EM SUA IGREJA (Adoção em 3 etapas) */}
      <section id="como-funciona" className="max-w-7xl mx-auto px-6 py-4 sm:py-6">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand/10 border border-brand/25 text-brand text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Adoção Natural
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Como começar em sua igreja
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Uma implantação simples para que todos os voluntários acompanhem com tranquilidade.
          </p>
        </div>

        <div
          ref={adoptionCarouselRef}
          onScroll={handleAdoptionScroll}
          className="flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory gap-4 px-4 -mx-4 pb-3 scroll-smooth md:gap-8 md:px-0 md:mx-0 md:pb-0 no-scrollbar"
        >
          <div className="w-[85vw] max-w-[320px] md:w-auto md:max-w-none shrink-0 snap-center p-6 rounded-2xl bg-[#0F172A] border border-slate-800/80 flex flex-col justify-start text-left space-y-4 shadow-lg shadow-black/30">
            <div className="w-12 h-12 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center text-brand font-black text-xl">
              1
            </div>
            <h3 className="text-xl font-bold text-white whitespace-normal break-words">
              Cadastre sua igreja
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-normal break-words">
              Crie a conta em 2 minutos sem cartão de crédito. Insira o nome do ministério e defina seus horários de culto.
            </p>
          </div>

          <div className="w-[85vw] max-w-[320px] md:w-auto md:max-w-none shrink-0 snap-center p-6 rounded-2xl bg-[#0F172A] border border-slate-800/80 flex flex-col justify-start text-left space-y-4 shadow-lg shadow-black/30">
            <div className="w-12 h-12 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center text-brand font-black text-xl">
              2
            </div>
            <h3 className="text-xl font-bold text-white whitespace-normal break-words">
              Convide os voluntários
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-normal break-words">
              Compartilhe o link da equipe com músicos e técnicos. Cada membro entra com seu nome e escolhe seus instrumentos.
            </p>
          </div>

          <div className="w-[85vw] max-w-[320px] md:w-auto md:max-w-none shrink-0 snap-center p-6 rounded-2xl bg-[#0F172A] border border-slate-800/80 flex flex-col justify-start text-left space-y-4 shadow-lg shadow-black/30">
            <div className="w-12 h-12 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center text-brand font-black text-xl">
              3
            </div>
            <h3 className="text-xl font-bold text-white whitespace-normal break-words">
              Monte sua primeira escala
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-normal break-words">
              Organize a escala do culto e o repertório. A equipe é notificada no celular e confirma presença em instantes.
            </p>
          </div>
        </div>

        <div className="flex md:hidden justify-center items-center gap-2 mt-3">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Ir para passo ${idx + 1}`}
              onClick={() => scrollToAdoptionStep(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeAdoptionStep === idx
                  ? 'w-6 bg-[#3B82F6]'
                  : 'w-2 bg-slate-600'
              }`}
            />
          ))}
        </div>
      </section>

      {/* SEÇÃO 8: Por que o LiLouPro é a solução ideal para sua igreja */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Especializado no Reino
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Por que o LiLouPro é a solução ideal para sua igreja?
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Feito especificamente para a realidade de igrejas e equipes cristãs, sem improvisos de ferramentas genéricas.
          </p>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:mx-0 md:px-0 md:pb-0">
          {differentials.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="shrink-0 w-[84%] sm:w-[70%] snap-center md:w-auto md:shrink bg-[#111827] hover:bg-[#161F33] border border-blue-400/20 hover:border-brand/40 rounded-3xl p-6 sm:p-8 space-y-4 transition-all duration-300 shadow-lg shadow-black/30"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/15 flex items-center justify-center text-brand">
                  <IconComp className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {item.title}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex md:hidden items-center justify-center gap-2 mt-2 text-xs text-slate-300">
          <span>← Deslize para ver todos os diferenciais →</span>
        </div>
      </section>

      {/* SEÇÃO 10: DEPOIMENTOS DE LIDERANÇA */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand/10 border border-brand/25 text-brand text-xs font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            DE LÍDER PARA LÍDER • HISTÓRIA REAL
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Como o LiLouPro nasceu na prática do nosso ministério
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Criado dentro da igreja local para substituir o improviso pela organização e excelência.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-[#111827] border border-blue-400/20 rounded-3xl p-6 sm:p-8 space-y-5 flex flex-col justify-between shadow-xl shadow-black/30 hover:border-brand/30 transition-all">
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed italic">
              "Quando cheguei na minha igreja, o ministério de louvor dependia de um PDF antigo: muitas cifras e letras estavam erradas, os tons não batiam com a extensão vocal dos cantores e não tínhamos referência de áudio para ouvir a versão certa da música. Somado às escalas feitas pelo WhatsApp, todo ensaio virava um retrabalho. Hoje, como líder do ministério de louvor, desenvolvi o LiLouPro na prática com a nossa própria equipe para resolver exatamente essa rotina. Agora, da escala à projeção ao vivo, nosso culto flui em um só lugar."
            </p>
            <div className="pt-4 border-t border-white/10 flex items-center gap-3.5">
              <img
                src="/miqueias.png"
                alt="Miquéias Mello"
                className="w-14 h-14 rounded-full object-cover border border-blue-500/30 shrink-0"
              />
              <div className="space-y-0.5">
                <h4 className="font-bold text-white text-sm">Miquéias Mello</h4>
                <p className="text-xs text-slate-300">Líder de Louvor &amp; Criador do LiLouPro</p>
                <p className="text-[11px] text-sky-300 font-medium">Igreja Graça Soberana • Rio Grande, RS</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO INTEGRADA DE PLANOS / PREÇOS (Transparente e com Teste Grátis de 30 Dias) */}
      <section id="planos" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand/10 border border-brand/25 text-brand text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Planos Transparentes
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Escolha o plano ideal para a sua igreja
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Comece grátis por 30 dias com acesso ao Plano Completo. Após o período de testes, escolha assinar o Plano Completo ou fazer upgrade para o Premium.
          </p>

          {/* Seletor Mensal / Anual */}
          <div className="pt-2 flex items-center justify-center">
            <div className="bg-[#111827] border border-blue-400/20 p-1 rounded-2xl flex items-center gap-1 shadow-lg">
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

        {/* Grid de 2 Planos (Completo e Premium) */}
        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-6 sm:gap-8 items-stretch mb-10">
          
          {/* 1. PLANO COMPLETO */}
          <div className="bg-[#111827] border border-blue-400/20 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl shadow-black/30 hover:border-blue-400/35 transition-all">
            <div className="space-y-4">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                {billingCycle === 'annual' ? 'Assinatura Anual' : 'Assinatura Mensal'}
              </span>
              <h3 className="text-2xl font-bold text-white">Plano Completo</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Ideal para igrejas e ministérios locais.
              </p>
              
              <div className="py-3 border-y border-white/10">
                {billingCycle === 'annual' ? (
                  <div>
                    <span className="text-3xl sm:text-4xl font-black text-white">R$ 470,40</span>
                    <span className="text-xs text-slate-300"> / ano</span>
                    <div className="text-[11px] text-emerald-400 font-semibold mt-1">Equivale a R$ 39,20/mês cobrados anualmente</div>
                  </div>
                ) : (
                  <div>
                    <span className="text-3xl sm:text-4xl font-black text-white">R$ 49,00</span>
                    <span className="text-xs text-slate-300"> / mês</span>
                    <div className="text-[11px] text-slate-300 mt-1">Sem fidelidade, cancele quando quiser</div>
                  </div>
                )}
              </div>

              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Até 50 membros ativos na equipe</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Repertório, cifras e liturgias ilimitadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Escalas e confirmação de presença via WhatsApp</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Projeção LiLouPro + integração com OBS &amp; Holyrics</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Assistente IA e exportação Google Docs</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5 pt-2 text-center">
              <button
                type="button"
                onClick={() => onEnterApp('signup')}
                className="w-full py-4 rounded-xl bg-brand hover:bg-brand/90 text-slate-950 font-black text-xs uppercase tracking-wider text-center shadow-lg shadow-brand/20 transition-all cursor-pointer block"
              >
                Testar grátis por 30 dias
              </button>
              <a
                href={billingCycle === 'annual' ? 'https://pay.kiwify.com.br/xrEKt4N' : 'https://pay.kiwify.com.br/3qXHMCe'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-block text-xs font-medium text-slate-300 hover:text-white underline underline-offset-4 transition-colors cursor-pointer pt-1"
              >
                ou assinar agora ({billingCycle === 'annual' ? 'R$ 470,40/ano' : 'R$ 49,00/mês'})
              </a>
            </div>
          </div>

          {/* 2. PLANO PREMIUM */}
          <div className="relative bg-[#131C31] border-2 border-brand/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-2xl shadow-brand/10 hover:border-brand transition-all">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-brand uppercase tracking-wider">
                  {billingCycle === 'annual' ? 'Assinatura Anual' : 'Assinatura Mensal'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                  <Sparkles className="w-3 h-3" />
                  Mais Popular / Redes &amp; Multi-campus
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white">Plano Premium</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Para igrejas em crescimento, redes e múltiplos polos.
              </p>
              
              <div className="py-3 border-y border-white/10">
                {billingCycle === 'annual' ? (
                  <div>
                    <span className="text-3xl sm:text-4xl font-black text-brand">R$ 950,40</span>
                    <span className="text-xs text-slate-300"> / ano</span>
                    <div className="text-[11px] text-emerald-400 font-semibold mt-1">Equivale a R$ 79,20/mês cobrados anualmente</div>
                  </div>
                ) : (
                  <div>
                    <span className="text-3xl sm:text-4xl font-black text-brand">R$ 99,00</span>
                    <span className="text-xs text-slate-300"> / mês</span>
                    <div className="text-[11px] text-slate-300 mt-1">Sem fidelidade, cancele quando quiser</div>
                  </div>
                )}
              </div>

              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span><strong>Membros ILIMITADOS</strong> na equipe</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>Gestão Multi-Campus / Múltiplas Congregações</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>Relatórios gerenciais consolidados de participação</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>Suporte prioritário via WhatsApp / VIP</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>Tudo do Plano Completo sem restrições</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5 pt-2 text-center">
              <button
                type="button"
                onClick={() => onEnterApp('signup')}
                className="w-full py-4 rounded-xl bg-brand hover:bg-brand/90 text-slate-950 font-black text-xs uppercase tracking-wider text-center shadow-lg shadow-brand/25 transition-all cursor-pointer block"
              >
                Testar grátis por 30 dias
              </button>
              <a
                href={billingCycle === 'annual' ? 'https://pay.kiwify.com.br/xlsUZKY' : 'https://pay.kiwify.com.br/BlF0RJs'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-block text-xs font-medium text-slate-300 hover:text-white underline underline-offset-4 transition-colors cursor-pointer pt-1"
              >
                ou assinar agora ({billingCycle === 'annual' ? 'R$ 950,40/ano' : 'R$ 99,00/mês'})
              </a>
            </div>
          </div>

        </div>

        {/* Rodapé da Seção de Preços com Selos de Confiança Sóbrios */}
        <div className="max-w-4xl mx-auto p-6 rounded-2xl bg-[#111827] border border-white/10 flex flex-wrap items-center justify-around gap-4 text-xs text-slate-300 text-center shadow-lg">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>30 dias gratuitos sem cartão de crédito</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand" />
            <span>Cancele quando quiser, sem fidelidade</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Seus dados e músicas ficam salvos na nuvem</span>
          </div>
        </div>
      </section>

      {/* SEÇÃO 11: PERGUNTAS FREQUENTES (FAQ) */}
      <section id="faq" className="max-w-4xl mx-auto px-6">
        <div className="text-center space-y-3 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/15 text-slate-200 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            Dúvidas Frequentes
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Perguntas Frequentes
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Respostas claras sobre o funcionamento, testes e planos da plataforma.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                className="bg-[#111827] border border-blue-400/20 rounded-2xl overflow-hidden transition-all shadow-md shadow-black/25"
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
      <section className="max-w-7xl mx-auto px-6 pb-6">
        <div className="relative rounded-3xl bg-gradient-to-br from-[#111827] via-[#0F172A] to-[#111827] border border-blue-400/20 p-8 sm:p-12 lg:p-14 text-center space-y-6 shadow-2xl shadow-black/40 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-[#2563EB]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              A organização que a sua equipe de louvor merece.
            </h2>

            <p className="text-slate-300 text-base sm:text-lg lg:text-xl leading-relaxed">
              Experimente o LiLouPro em sua igreja por 30 dias gratuitos. 
              Mais clareza para preparar cada culto e cuidar da sua equipe.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onEnterApp('signup')}
                className="w-full sm:w-auto px-10 py-5 bg-brand hover:bg-brand/90 text-slate-950 font-black rounded-2xl text-lg shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>Testar grátis por 30 dias</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => onEnterApp('login')}
                className="w-full sm:w-auto px-8 py-5 bg-slate-800/80 hover:bg-slate-800 border border-slate-600/60 text-white font-semibold rounded-2xl text-base transition-all text-center cursor-pointer"
              >
                Já tenho conta • Entrar
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-200 pt-4">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#3B82F6]" /> Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#3B82F6]" /> 30 dias ilimitados
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#3B82F6]" /> Suporte em português
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER INSTITUCIONAL */}
      <footer className="border-t border-white/10 pt-10 pb-24 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <img
                src={luxuryAppIcon}
                alt="LiLouPro"
                className="w-8 h-8 rounded-xl object-cover border border-amber-400/60 shadow-md shadow-black/60 brightness-105 contrast-105"
              />
              <span className="text-lg font-black text-white tracking-tight">LiLouPro</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
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
              <li><a href="https://pay.kiwify.com.br/xrEKt4N" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Assinatura Oficial</a></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-sm">Suporte & Contato</h4>
            <p className="text-slate-300">
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
