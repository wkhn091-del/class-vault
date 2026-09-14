import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, tone = 'ok') => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 5000);
  }, []);

  const value = useMemo(
    () => ({ ok: (m) => push(m, 'ok'), problem: (m) => push(m, 'problem') }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2 p-4 sm:items-end"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 460, damping: 34 }}
              className="pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-2xl border border-hairline bg-surface px-4 py-3.5 text-[14px] shadow-lift"
            >
              {toast.tone === 'ok' ? (
                <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-navy" />
              ) : (
                <AlertTriangle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-danger" />
              )}
              <span className="leading-snug">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
