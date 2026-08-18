import React from 'react';
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

      {/* Botão Flutuante de WhatsApp Oficial (Circular, com Ícone Oficial e Tooltip "Fale com nossa equipe") */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center group">
        {/* Tooltip elegante "Fale com nossa equipe" */}
        <div 
          role="tooltip"
          className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 px-3.5 py-2 bg-slate-900/95 text-white text-xs font-medium rounded-xl shadow-xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none translate-x-2 group-hover:translate-x-0 hidden sm:flex items-center gap-2 backdrop-blur-md shadow-black/40"
        >
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
          <span>Fale com nossa equipe</span>
          <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-slate-900/95 rotate-45 border-t border-r border-white/10"></div>
        </div>

        {/* Botão Circular Oficial do WhatsApp */}
        <a
          id="btn-floating-whatsapp-official"
          href="https://wa.me/5551926361240?text=Ol%C3%A1!%20Gostaria%20de%20falar%20com%20a%20equipe%20do%20LiLouPro."
          target="_blank"
          rel="noopener noreferrer"
          title="Fale com nossa equipe no WhatsApp"
          aria-label="Fale com nossa equipe no WhatsApp"
          className="relative w-13 h-13 sm:w-14 sm:h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full flex items-center justify-center shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-[#25D366]/30 transition-all duration-300 hover:scale-108 active:scale-95 cursor-pointer"
        >
          {/* Ícone Oficial WhatsApp (Vetor Original) */}
          <svg 
            className="w-7 h-7 sm:w-8 sm:h-8 fill-white drop-shadow-sm" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.301-.15-1.777-.877-2.052-.977-.276-.1-.477-.15-.677.15-.2.301-.777.977-.953 1.177-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.897-.801-1.503-1.791-1.679-2.092-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.201-.301.301-.502.1-.2.05-.376-.025-.526-.075-.15-.677-1.63-.927-2.232-.244-.587-.492-.507-.677-.517-.175-.01-.376-.01-.577-.01-.2 0-.527.075-.802.376-.276.301-1.053 1.028-1.053 2.508 0 1.48 1.078 2.909 1.229 3.11.15.2 2.122 3.24 5.141 4.544 3.02 1.304 3.02.87 3.571.815.552-.055 1.777-.726 2.028-1.43.25-.703.25-1.304.175-1.43-.075-.125-.276-.2-.577-.35zM12.042 21.666a9.585 9.585 0 01-4.887-1.332l-.35-.208-3.633.953.97-3.541-.227-.362a9.58 9.58 0 01-1.469-5.136c0-5.302 4.316-9.617 9.623-9.617 2.569 0 4.985 1.002 6.802 2.82 1.817 1.818 2.818 4.234 2.818 6.804 0 5.304-4.316 9.619-9.647 9.619zm7.98-17.592A11.233 11.233 0 0012.042 1C5.938 1 .97 5.968.97 12.072c0 1.95.508 3.856 1.474 5.534L1 23.364l5.908-1.55a11.206 11.206 0 005.134 1.248h.005c6.104 0 11.072-4.969 11.072-11.074 0-2.959-1.152-5.741-3.249-7.838z" />
          </svg>
        </a>
      </div>

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
              href="https://wa.me/5551926361240?text=Ol%C3%A1!%20Gostaria%20de%20falar%20com%20a%20equipe%20do%20LiLouPro."
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-all hover:border-emerald-500/30"
              title="Fale com nossa equipe no WhatsApp"
            >
              <svg 
                className="w-3.5 h-3.5 fill-emerald-400" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.301-.15-1.777-.877-2.052-.977-.276-.1-.477-.15-.677.15-.2.301-.777.977-.953 1.177-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.897-.801-1.503-1.791-1.679-2.092-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.201-.301.301-.502.1-.2.05-.376-.025-.526-.075-.15-.677-1.63-.927-2.232-.244-.587-.492-.507-.677-.517-.175-.01-.376-.01-.577-.01-.2 0-.527.075-.802.376-.276.301-1.053 1.028-1.053 2.508 0 1.48 1.078 2.909 1.229 3.11.15.2 2.122 3.24 5.141 4.544 3.02 1.304 3.02.87 3.571.815.552-.055 1.777-.726 2.028-1.43.25-.703.25-1.304.175-1.43-.075-.125-.276-.2-.577-.35zM12.042 21.666a9.585 9.585 0 01-4.887-1.332l-.35-.208-3.633.953.97-3.541-.227-.362a9.58 9.58 0 01-1.469-5.136c0-5.302 4.316-9.617 9.623-9.617 2.569 0 4.985 1.002 6.802 2.82 1.817 1.818 2.818 4.234 2.818 6.804 0 5.304-4.316 9.619-9.647 9.619zm7.98-17.592A11.233 11.233 0 0012.042 1C5.938 1 .97 5.968.97 12.072c0 1.95.508 3.856 1.474 5.534L1 23.364l5.908-1.55a11.206 11.206 0 005.134 1.248h.005c6.104 0 11.072-4.969 11.072-11.074 0-2.959-1.152-5.741-3.249-7.838z" />
              </svg>
              <span>Fale com nossa equipe</span>
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
