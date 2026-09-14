import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useLocale } from '../context/LocaleContext.jsx';

const VARIANTS = {
  primary:
    'bg-navy text-white shadow-card hover:bg-navyDeep active:scale-[0.985] disabled:bg-mute disabled:shadow-none',
  brass:
    'bg-brass text-white shadow-card hover:brightness-95 active:scale-[0.985] disabled:bg-mute disabled:shadow-none',
  quiet:
    'bg-surface text-ink border border-hairline shadow-inset hover:border-ink/25 hover:bg-raised active:scale-[0.985]',
  ghost: 'text-graphite hover:text-ink hover:bg-ink/[0.05]',
  danger: 'text-danger border border-danger/25 hover:bg-danger/[0.07] active:scale-[0.985]',
};

export function Button({ variant = 'primary', className = '', busy = false, children, ...props }) {
  return (
    <button
      {...props}
      disabled={props.disabled || busy}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Field({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-hairline bg-surface px-3.5 py-3 text-[16px] shadow-inset transition-colors placeholder:text-mute focus:border-navy"
      />
      {hint && <span className="mt-1.5 block text-[13px] text-graphite">{hint}</span>}
    </label>
  );
}

export function Modal({ open, onClose, title, children, wide = false }) {
  const reduce = useReducedMotion();
  const { t } = useLocale();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/50 backdrop-blur-[3px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-t-3xl border border-hairline bg-surface p-6 shadow-lift sm:rounded-2xl`}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 className="text-2xl">{title}</h2>
              <button
                onClick={onClose}
                aria-label={t.close}
                className="-m-1.5 rounded-xl p-1.5 text-graphite transition-colors hover:bg-ink/[0.05] hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Spinner({ label }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-16 text-sm text-graphite">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="rounded-2xl border border-dashed border-hairline bg-surface/50 px-6 py-16 text-center">
      <h3 className="text-xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-graphite">{children}</p>
    </div>
  );
}
