import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Sparkles, Smartphone, Check, ArrowRight } from 'lucide-react';
import luxuryAppIcon from '../assets/images/liloupro_luxury_logo_1787753536902.jpg';

interface CustomInstallBannerProps {
  onOpenGuideModal?: () => void;
}

export const CustomInstallBanner: React.FC<CustomInstallBannerProps> = ({
  onOpenGuideModal
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [supportsBeforeInstallPrompt, setSupportsBeforeInstallPrompt] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(true); // start true until checked
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);

  // Check standalone mode and capture beforeinstallprompt
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check if already installed / running in standalone window
    const checkStandalone = () => {
      const standaloneQuery = window.matchMedia('(display-mode: standalone)').matches;
      const navigatorStandalone = (window.navigator as any).standalone === true;
      const isAndroidAppReferrer = typeof document !== 'undefined' && document.referrer.includes('android-app://');
      return standaloneQuery || navigatorStandalone || isAndroidAppReferrer;
    };

    const standalone = checkStandalone();
    setIsStandalone(standalone);
    if (standalone) {
      setIsDismissed(true);
      return;
    }

    // 2. Check platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

    // 3. Check dismissal in localStorage
    try {
      const dismissedAt = localStorage.getItem('liloupro_install_banner_dismissed_v10');
      if (dismissedAt) {
        const timeSince = Date.now() - parseInt(dismissedAt, 10);
        // If dismissed less than 4 hours ago, keep hidden
        if (timeSince < 4 * 60 * 60 * 1000) {
          setIsDismissed(true);
        } else {
          setIsDismissed(false);
        }
      } else {
        setIsDismissed(false);
      }
    } catch {
      setIsDismissed(false);
    }

    // 4. Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setSupportsBeforeInstallPrompt(true);
      setIsDismissed(false); // Make sure banner shows if browser supports it
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsDismissed(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setIsDismissed(true);
          try {
            localStorage.setItem('liloupro_install_banner_dismissed_v10', Date.now().toString());
          } catch {}
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Install prompt failed, opening guide modal:', err);
        if (onOpenGuideModal) onOpenGuideModal();
      }
    } else {
      // If beforeinstallprompt is not directly available (e.g. iOS or desktop browser), open the interactive guide
      if (onOpenGuideModal) {
        onOpenGuideModal();
      }
    }
  }, [deferredPrompt, onOpenGuideModal]);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    try {
      localStorage.setItem('liloupro_install_banner_dismissed_v10', Date.now().toString());
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, []);

  // Do not render if app is running in standalone mode or already installed or dismissed
  if (isStandalone || isInstalled || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.aside
        id="custom-pwa-install-banner"
        initial={{ opacity: 0, y: 50, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-5 sm:bottom-5 sm:max-w-md z-[9990] select-none"
        role="region"
        aria-label="Banner de instalação do aplicativo LiLouPro"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-950/98 to-black/98 border border-amber-500/40 shadow-2xl shadow-black/80 backdrop-blur-xl p-3.5 sm:p-4 text-white">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-12 -left-12 w-28 h-28 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            id="btn-dismiss-install-banner"
            type="button"
            onClick={handleDismiss}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer z-10"
            title="Fechar aviso de instalação"
            aria-label="Fechar aviso"
          >
            <X size={15} />
          </button>

          <div className="flex items-center gap-3.5 relative z-10">
            {/* Official Luxury Icon with Gold Border */}
            <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-2xl blur-xs opacity-60" />
              <img
                src={luxuryAppIcon}
                alt="Logo Oficial LiLouPro Luxo"
                className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border-2 border-amber-400/70 shadow-lg shadow-black/60"
              />
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow">
                <Sparkles size={10} className="fill-slate-950 stroke-slate-950" />
              </div>
            </div>

            {/* Banner Text Content */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                  <Sparkles size={9} />
                  App Oficial PWA
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-black text-white truncate mt-0.5">
                Baixe o LiLouPro no Celular
              </h3>
              <p className="text-[11px] text-slate-300 line-clamp-1 leading-tight mt-0.5 font-medium">
                {supportsBeforeInstallPrompt 
                  ? 'Instalação direta com 1 clique.'
                  : isIos 
                    ? 'Adicione à tela de início do iPhone.'
                    : 'Acesse cifras e escalas com 1 toque.'}
              </p>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2 relative z-10">
            <button
              id="btn-install-app-banner"
              type="button"
              onClick={handleInstallClick}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 active:scale-[0.98] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-950/40 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {supportsBeforeInstallPrompt ? (
                <>
                  <Download size={13} className="stroke-[3]" />
                  <span>Instalar com 1 Toque</span>
                </>
              ) : (
                <>
                  <Smartphone size={13} className="stroke-[2.5]" />
                  <span>Como Baixar no Celular</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>

            <button
              id="btn-banner-remind-later"
              type="button"
              onClick={handleDismiss}
              className="py-2 px-2.5 text-[11px] font-bold text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 rounded-xl transition-colors shrink-0 cursor-pointer border border-white/5"
            >
              Depois
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
