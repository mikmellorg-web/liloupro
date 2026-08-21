export async function forceCheckForAppUpdates(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        return true;
      }
    } catch (e) {
      console.warn('Erro ao checar atualizações do service worker:', e);
    }
  }
  return false;
}
