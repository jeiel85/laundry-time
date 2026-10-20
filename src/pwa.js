export function isStandaloneDisplay(win = globalThis.window, nav = globalThis.navigator) {
  if (!win) return false;
  const standaloneMedia = typeof win.matchMedia === 'function' && win.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = Boolean(nav && nav.standalone === true);
  return Boolean(standaloneMedia || iosStandalone);
}

export async function registerServiceWorker({
  nav = globalThis.navigator,
  baseUrl = import.meta.env?.BASE_URL || '/',
} = {}) {
  if (!nav || !('serviceWorker' in nav) || !nav.serviceWorker) return null;
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const swUrl = `${normalizedBase}sw.js`;
  try {
    return await nav.serviceWorker.register(swUrl, { scope: normalizedBase });
  } catch {
    return null;
  }
}

export function createInstallController({
  win = globalThis.window,
  nav = globalThis.navigator,
  onStateChange = () => {},
  onInstalled = () => {},
} = {}) {
  let deferredPrompt = null;
  let installed = isStandaloneDisplay(win, nav);

  function notify() {
    onStateChange({
      canInstall: Boolean(deferredPrompt) && !installed,
      installed,
    });
  }

  function handleBeforeInstallPrompt(event) {
    event.preventDefault?.();
    if (isStandaloneDisplay(win, nav)) {
      installed = true;
      deferredPrompt = null;
    } else {
      deferredPrompt = event;
    }
    notify();
  }

  function handleAppInstalled() {
    deferredPrompt = null;
    installed = true;
    notify();
    onInstalled();
  }

  if (win?.addEventListener) {
    win.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    win.addEventListener('appinstalled', handleAppInstalled);
  }

  notify();

  return {
    get state() {
      return {
        canInstall: Boolean(deferredPrompt) && !installed,
        installed,
      };
    },
    async promptInstall() {
      if (!deferredPrompt || installed) return false;
      const promptEvent = deferredPrompt;
      deferredPrompt = null;
      notify();
      try {
        await promptEvent.prompt?.();
        const choice = await promptEvent.userChoice;
        if (choice?.outcome === 'accepted') {
          installed = true;
        }
        notify();
        return choice?.outcome === 'accepted';
      } catch {
        notify();
        return false;
      }
    },
    dispose() {
      if (win?.removeEventListener) {
        win.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        win.removeEventListener('appinstalled', handleAppInstalled);
      }
    },
  };
}
