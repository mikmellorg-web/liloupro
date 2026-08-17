/**
 * Service Worker Automatic Update & Lifecycle Manager
 * Ensures users always receive and run the latest application version automatically
 * without requiring manual hard refreshes or clearing cache.
 */

let isRefreshing = false;
let swRegistration: ServiceWorkerRegistration | null = null;

export function registerServiceWorkerAutoUpdate() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Prevent multiple reload loops
  const handleReload = () => {
    if (isRefreshing) return;
    isRefreshing = true;
    console.log('[SW Auto-Update] Nova versão detectada e ativada. Recarregando aplicativo...');
    window.location.reload();
  };

  // 1. Listen for controlling service worker change to reload page immediately
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    handleReload();
  });

  // 2. Listen for explicit broadcast message from new SW version
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && (event.data.type === 'SW_VERSION_UPDATED' || event.data.type === 'RELOAD_PAGE')) {
      handleReload();
    }
  });

  window.addEventListener('load', async () => {
    try {
      // Register with updateViaCache: 'none' to bypass browser HTTP cache on sw.js
      const registration = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none'
      });

      swRegistration = registration;
      console.log('[SW Auto-Update] Service Worker registrado com sucesso.');

      // Helper to check worker state and prompt skip waiting
      const trackInstallingWorker = (worker: ServiceWorker) => {
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed') {
            console.log('[SW Auto-Update] Novo worker instalado. Forçando ativação imediata...');
            worker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      };

      // If a waiting worker is already present, activate it immediately
      if (registration.waiting) {
        console.log('[SW Auto-Update] Worker em espera encontrado. Ativando...');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // If an installing worker is present, track its completion
      if (registration.installing) {
        trackInstallingWorker(registration.installing);
      }

      // Listen for future update detections
      registration.addEventListener('updatefound', () => {
        console.log('[SW Auto-Update] Nova atualização encontrada no servidor.');
        const newWorker = registration.installing;
        if (newWorker) {
          trackInstallingWorker(newWorker);
        }
      });

      // Immediate check on startup
      registration.update().catch((err) => {
        console.warn('[SW Auto-Update] Verificação inicial falhou:', err);
      });

      // Periodic automatic background check every 90 seconds
      setInterval(() => {
        if (navigator.onLine && registration) {
          registration.update().catch(() => {});
        }
      }, 90 * 1000);

      // Auto-check on user returning to the tab / waking mobile screen
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          registration.update().catch(() => {});
        }
      });

      // Auto-check on window focus
      window.addEventListener('focus', () => {
        if (navigator.onLine) {
          registration.update().catch(() => {});
        }
      });

      // Auto-check when device reconnects to internet
      window.addEventListener('online', () => {
        console.log('[SW Auto-Update] Conexão restabelecida. Verificando atualizações...');
        registration.update().catch(() => {});
      });

    } catch (err) {
      console.warn('[SW Auto-Update] Falha no registro do Service Worker:', err);
    }
  });
}

/**
 * Manually trigger an update check (e.g. from settings button)
 */
export async function forceCheckForAppUpdates(): Promise<{ updated: boolean; message: string }> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return { updated: false, message: 'Service Worker não suportado neste navegador.' };
  }

  try {
    const reg = swRegistration || await navigator.serviceWorker.getRegistration();
    if (!reg) {
      return { updated: false, message: 'Service Worker não encontrado.' };
    }

    if (reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      return { updated: true, message: 'Nova versão ativada! O aplicativo está recarregando...' };
    }

    await reg.update();

    if (reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      return { updated: true, message: 'Nova versão encontrada! Recarregando com as atualizações...' };
    }

    if (reg.installing) {
      return { updated: true, message: 'Baixando nova versão... O aplicativo será recarregado em instantes.' };
    }

    return { updated: false, message: 'Você já está utilizando a versão mais recente do aplicativo.' };
  } catch (error: any) {
    console.error('[SW Auto-Update] Erro ao verificar atualizações:', error);
    return { updated: false, message: 'Não foi possível verificar atualizações no momento.' };
  }
}
