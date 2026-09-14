import { Link } from 'react-router-dom';
import { KeyRound, ShieldCheck, Eye, Languages } from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';

const CLASS_NAME = import.meta.env.VITE_CLASS_NAME || 'ארכיון הכיתה';

export default function Header({ onUnlockClick }) {
  const { isAdmin, lock } = useAdmin();
  const { t, toggle } = useLocale();

  return (
    <header className="sticky top-0 z-40 border-b border-hairline/90 bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="group flex items-baseline gap-2.5">
          <span className="font-display text-[21px] font-bold">{CLASS_NAME}</span>
          <span className="hidden h-px w-10 self-center brass-rule transition-all group-hover:w-16 sm:block" />
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggle}
            aria-label={t.switchLang}
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-graphite transition-colors hover:bg-ink/[0.05] hover:text-ink"
          >
            <Languages className="h-4 w-4" />
            <span className="hidden sm:inline">{t.switchLang}</span>
          </button>

          {isAdmin ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brass/30 bg-brassSoft px-3 py-1.5 text-[13px] font-bold text-brass">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t.adminMode}
              </span>
              <button
                onClick={lock}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-graphite transition-colors hover:bg-ink/[0.05] hover:text-ink"
              >
                {t.exit}
              </button>
            </>
          ) : (
            <>
              <span className="hidden items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1.5 text-[13px] font-semibold text-graphite sm:inline-flex">
                <Eye className="h-3.5 w-3.5" />
                {t.studentMode}
              </span>
              <button
                onClick={onUnlockClick}
                aria-label={t.adminEnter}
                className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-graphite transition-colors hover:bg-ink/[0.05] hover:text-ink"
              >
                <KeyRound className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Admin mode is a change of state, so it gets a persistent strip rather
          than a chip you could miss. Students never see it. */}
      {isAdmin && (
        <div className="border-t border-brass/25 bg-brassSoft/60">
          <p className="mx-auto max-w-5xl px-4 py-1.5 text-[13px] font-semibold text-brass sm:px-6">
            {t.adminModeNote}
          </p>
        </div>
      )}
    </header>
  );
}
