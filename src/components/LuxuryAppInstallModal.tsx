import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Smartphone, 
  Share, 
  PlusSquare, 
  Check, 
  X, 
  Sparkles, 
  ChevronRight, 
  Compass, 
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import luxuryAppIcon from '../assets/images/liloupro_luxury_logo_1787753536902.jpg';

export interface LuxuryAppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export const LuxuryAppInstallModal: React.FC<LuxuryAppInstallModalProps> = ({
  isOpen,
  onClose,
  userName = 'Ministro'
}) => {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'guide' | 'download'>('guide');

  // Detect iOS vs Android vs Desktop
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);

    if (isIos) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Capture beforeinstallprompt event for Chromium / Android 1-click install
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setInstalledSuccess(true);
          setTimeout(() => {
            onClose();
          }, 2000);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    } else {
      setActiveTab('guide');
    }
  };

  const handleDontShowAgain = () => {
    try {
      localStorage.setItem('liloupro_hide_install_prompt', 'true');
    } catch (e) {
      console.warn('Could not set localStorage:', e);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="luxury-app-install-backdrop"
        className="fixed inset-0 z-[12000] bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          id="luxury-app-install-dialog"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-950/40 p-5 sm:p-7 text-white antialiased overflow-hidden"
        >
          {/* Subtle Golden Glow Effects in Background */}
          <div className="absolute -top-24 -left-24 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-brand/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header Action: Close button */}
          <button
            id="btn-close-install-modal"
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer z-10"
            title="Fechar"
          >
            <X size={18} />
          </button>

          {/* Centered Luxury Logo & Title */}
          <div className="text-center space-y-3 relative z-10 mt-1">
            <div className="relative inline-block mx-auto group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-3xl blur-md opacity-50 group-hover:opacity-80 transition duration-500 animate-pulse" />
              <img
                src={luxuryAppIcon}
                alt="Logo Oficial LiLouPro Luxo"
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl object-cover shadow-2xl border-2 border-amber-400/60 shadow-black/80"
              />
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 p-1.5 rounded-full shadow-lg border border-amber-200">
                <Sparkles size={14} className="fill-slate-950 stroke-slate-950" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-widest">
                <Sparkles size={11} className="text-amber-400" />
                Aplicativo Oficial PWA • LiLouPro
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
                Já baixou o LiLouPro no seu celular?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-sm mx-auto leading-relaxed">
                Olá, <strong className="text-amber-300">{userName}</strong>! Instale o app na sua tela inicial para ter acesso ultrarrápido às cifras, escalas e notificações do louvor.
              </p>
            </div>
          </div>

          {/* OS Switcher / Detection */}
          <div className="flex items-center justify-center gap-2 mt-5 p-1 bg-white/5 border border-white/10 rounded-2xl max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => setPlatform('ios')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                platform === 'ios'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>iPhone (iOS)</span>
            </button>
            <button
              type="button"
              onClick={() => setPlatform('android')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                platform === 'android'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Android</span>
            </button>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="mt-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 text-left">
            {platform === 'ios' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider pb-1 border-b border-white/5">
                  <Smartphone size={15} />
                  Passo a passo no Safari (iPhone / iPad):
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center text-xs font-black shrink-0">
                    1
                  </div>
                  <div className="text-xs text-slate-200 leading-snug">
                    Toque no botão de <strong>Compartilhar</strong> <span className="inline-flex items-center justify-center w-5 h-5 bg-white/10 rounded border border-white/20 mx-1 align-middle"><Share size={12} className="text-sky-400" /></span> na barra inferior do Safari.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center text-xs font-black shrink-0">
                    2
                  </div>
                  <div className="text-xs text-slate-200 leading-snug">
                    Role as opções para baixo e toque em <strong className="text-amber-300">"Adicionar à Tela de Início"</strong> <span className="inline-flex items-center justify-center w-5 h-5 bg-white/10 rounded border border-white/20 mx-1 align-middle"><PlusSquare size={12} className="text-emerald-400" /></span>.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center text-xs font-black shrink-0">
                    3
                  </div>
                  <div className="text-xs text-slate-200 leading-snug">
                    Toque em <strong>"Adicionar"</strong> no canto superior direito. Pronto! O ícone dourado de luxo aparecerá na tela do seu celular.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider pb-1 border-b border-white/5">
                  <Smartphone size={15} />
                  Passo a passo no Chrome / Edge (Android):
                </div>

                {deferredPrompt ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
                    <p className="text-xs font-medium text-emerald-300">
                      Seu celular suporta instalação instantânea com 1 clique!
                    </p>
                    <button
                      type="button"
                      onClick={handleInstallPwa}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Download size={14} className="stroke-[3]" />
                      Instalar Aplicativo com 1 Toque
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center text-xs font-black shrink-0">
                        1
                      </div>
                      <div className="text-xs text-slate-200 leading-snug">
                        Toque nos <strong>3 pontinhos (⋮)</strong> no canto superior direito do seu navegador Chrome.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center text-xs font-black shrink-0">
                        2
                      </div>
                      <div className="text-xs text-slate-200 leading-snug">
                        Toque na opção <strong className="text-amber-300">"Instalar aplicativo"</strong> (ou <em>"Instalar LiLouPro"</em>).
                        <p className="text-[11px] text-amber-400/90 mt-1 font-normal">
                          ⚠️ Se aparecer apenas <em>"Criar atalho"</em>, aguarde 2 segundos na página inicial para o navegador carregar o instalador oficial.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center text-xs font-black shrink-0">
                        3
                      </div>
                      <div className="text-xs text-slate-200 leading-snug">
                        Toque em <strong>"Instalar"</strong>. O ícone de luxo oficial em 3D será adicionado ao menu de aplicativos e à tela inicial!
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons Footer */}
          <div className="mt-5 space-y-2.5">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                id="btn-confirm-already-installed"
                type="button"
                onClick={handleDontShowAgain}
                className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Check size={16} className="stroke-[3]" />
                Já baixei no celular
              </button>

              <button
                id="btn-remind-later"
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-3 px-4 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors border border-white/10 cursor-pointer"
              >
                Lembrar mais tarde
              </button>
            </div>

            {/* Direct HD Image Download Option */}
            <div className="pt-2 border-t border-white/5 text-center">
              <a
                id="link-download-luxury-logo-hd"
                href="/luxury_app_icon.jpg"
                download="LiLouPro-Logo-Oficial-Luxo-HD.jpg"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-4 decoration-amber-400/40 hover:decoration-amber-300 transition-colors"
              >
                <Download size={12} />
                Baixar imagem do Logo Oficial em HD para a galeria (JPG 1024x1024)
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
