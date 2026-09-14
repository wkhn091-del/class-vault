import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { dictionaries, defaultLocale } from '../lib/i18n.js';

const LocaleContext = createContext(null);
export const useLocale = () => useContext(LocaleContext);

const KEY = 'class-vault-locale';

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => localStorage.getItem(KEY) || defaultLocale);
  const t = dictionaries[locale] ?? dictionaries.he;

  // Direction lives on <html> so native scrollbars, form controls and the
  // browser's own text selection all flip with the interface.
  useEffect(() => {
    document.documentElement.lang = t.lang;
    document.documentElement.dir = t.dir;
    document.documentElement.style.setProperty('--rule-dir', t.dir === 'rtl' ? 'right' : 'left');
    localStorage.setItem(KEY, locale);
  }, [locale, t]);

  const value = useMemo(
    () => ({ t, locale, isRtl: t.dir === 'rtl', toggle: () => setLocale((l) => (l === 'he' ? 'en' : 'he')) }),
    [t, locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
