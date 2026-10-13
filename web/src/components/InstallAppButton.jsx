import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useLocale } from '../context/LocaleContext.jsx';

/**
 * Desktop/mobile install prompt for the PWA.
 * Shows only when the browser fires beforeinstallprompt (or iOS hint).
 */
export default function InstallAppButton() {
  const { t } = useLocale();
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (standalone) {
      setInstalled(true);
      return undefined;
    }

    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isSafari = /safari/i.test(window.navigator.userAgent) && !/crios|fxios/i.test(window.navigator.userAgent);
    if (isIos && isSafari) setIosHint(true);

    function onPrompt(event) {
      event.preventDefault();
      setDeferred(event);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferred(null);
    }

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  if (deferred) {
    return (
      <button
        type="button"
        onClick={install}
        aria-label={t.installApp}
        title={t.installApp}
        className="inline-flex items-center gap-1.5 rounded-xl bg-navy/10 px-2.5 py-2 text-sm font-semibold text-navy transition-colors duration-fast hover:bg-navy hover:text-white"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">{t.installApp}</span>
      </button>
    );
  }

  if (iosHint) {
    return (
      <span
        className="hidden max-w-[11rem] text-end text-[11px] leading-snug text-mute sm:inline"
        title={t.installIosHint}
      >
        {t.installIosHint}
      </span>
    );
  }

  return null;
}
