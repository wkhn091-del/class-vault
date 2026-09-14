import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../lib/api.js';
import { useLocale } from './LocaleContext.jsx';
import { useToast } from './ToastContext.jsx';

const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const { t } = useLocale();
  const toast = useToast();

  // A stored token may have expired while the tab was closed.
  useEffect(() => {
    let cancelled = false;
    if (!tokenStore.get()) {
      setChecking(false);
      return undefined;
    }
    api
      .checkSession()
      .then(() => !cancelled && setIsAdmin(true))
      .catch(() => tokenStore.clear())
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const unlock = useCallback(async (passcode) => {
    const { token } = await api.unlock(passcode);
    tokenStore.set(token);
    setIsAdmin(true);
  }, []);

  const lock = useCallback(() => {
    tokenStore.clear();
    setIsAdmin(false);
    toast.ok(t.locked);
  }, [toast, t]);

  const value = useMemo(() => ({ isAdmin, checking, unlock, lock }), [isAdmin, checking, unlock, lock]);
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
