import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Music2 } from './MusicIcon';
import LandingHeroAndChallenges from './LandingHeroAndChallenges';
import LandingBenefitsAndFeatures from './LandingBenefitsAndFeatures';
import LandingJourneyAndFAQ from './LandingJourneyAndFAQ';

interface CommercialLandingPageProps {
  onEnterApp: (mode: 'login' | 'signup') => void;
}

export default function CommercialLandingPage({ onEnterApp }: CommercialLandingPageProps) {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-brand selection:text-slate-950 overflow-x-hidden relative">
      {/* Background Decorativo Superior */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-brand/10 via-sky-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Botão Flutuante de WhatsApp Oficial */}
      <a
        id="btn-floating-whatsapp-landing"
        href="https://wa.me/5551926361240?text=Ol%C3%A1!%20Gostaria%20de%20tirar%20d%C3%BAvidas%20sobre%20o%20Liloupro."
        target="_blank"
        rel="noopener noreferrer"
        title="Fale conosco no WhatsApp: (51) 92636-1240"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-full shadow-2xl shadow-emerald-500/40 transition-all hover:scale-105 active:scale-95 group border border-emerald-300/30"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-950"></span>
        </span>
        <MessageCircle className="w-5 h-5 fill-slate-950 stroke-none" />
        <span className="text-xs sm:text-sm font-extrabold tracking-wide hidden sm:inline">WhatsApp (51) 92636-1240</span>
      </a>

      {/* Header Institucional Fixo */}
      <header className="sticky top-0 z-40 bg-[#070b14]/80 backdrop-blur-md border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
              <Music2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tight leading-none">
                LiLouPro
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                IGREJAS CONECTADAS
              </span>
            </div>
          </div>

          {/* Nav de Acesso Rápido */}
          <nav className="hidden md:flex items-center gap-8 text-xs sm:text-sm font-semibold text-slate-300">
            <a href="#funcionalidades" className="hover:text-white transition-colors">
              Módulos
            </a>
            <a href="#como-funciona" className="hover:text-white transition-colors">
              Como Funciona
            </a>
            <a href="#planos" className="hover:text-white transition-colors">
              Preços
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              Dúvidas
            </a>
          </nav>

          {/* Ações de Conta & WhatsApp */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <a
              id="btn-header-whatsapp"
              href="https://wa.me/5551926361240?text=Ol%C3%A1!%20Gostaria%20de%20mais%20informa%C3%A7%C3%B5es%20sobre%20o%20Liloupro."
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/25 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>(51) 92636-1240</span>
            </a>
            <button
              onClick={() => onEnterApp('login')}
              className="px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Área do Membro
            </button>
            <button
              onClick={() => onEnterApp('signup')}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-brand hover:bg-brand/90 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-brand/20 transition-all active:scale-95 cursor-pointer"
            >
              Testar Grátis
            </button>
          </div>
        </div>
      </header>

      {/* Corpo Principal da Landing Page - As 12 Seções Reformuladas com Padrão Apple / Stripe / Linear */}
      <main className="relative z-10 pt-6 pb-12">
        {/* Seção 1 (Hero), Seção 2 (Desafios), Seção 3 (A Solução) */}
        <LandingHeroAndChallenges onEnterApp={onEnterApp} />

        {/* Seção 4 (Benefícios / Resultados), Seção 5 (9 Módulos), Seção 6 (Veja Funcionando 20s) */}
        <LandingBenefitsAndFeatures onEnterApp={onEnterApp} />

        {/* Seção 7 (Como Funciona 3 Etapas), Seção 8 (Por que o LiLouPro), Seção 9 (Timeline 30 Dias), Seção 10 (Depoimentos), Preços (#planos), Seção 11 (FAQ), Seção 12 (Chamada Final) + Rodapé */}
        <LandingJourneyAndFAQ onEnterApp={onEnterApp} />
      </main>
    </div>
  );
}
