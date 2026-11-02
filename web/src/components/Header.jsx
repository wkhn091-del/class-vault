import { Link } from 'react-router-dom';
import { KeyRound, ShieldCheck, Eye, Languages, FolderPlus } from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import ScrollProgress from '../motion/ScrollProgress.jsx';
import InstallAppButton from './InstallAppButton.jsx';

const CLASS_NAME = import.meta.env.VITE_CLASS_NAME || 'המתיבתא';
const TAGLINE = import.meta.env.VITE_CLASS_TAGLINE || 'תורה ודעת';

export default function Header({ onUnlockClick }) {
  const { isAdmin, lock } = useAdmin();
  const { t, toggle } = useLocale();

  function requestNewFolder() {
    if (window.location.pathname !== '/') {
      window.location.assign('/#teacher-desk');
      window.setTimeout(() => window.dispatchEvent(new Event('metivta:new-folder')), 80);
      return;
    }
    document.getElementById('teacher-desk')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.dispatchEvent(new Event('metivta:new-folder'));
  }

  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-gradient-to-l from-canvas/95 via-brassSoft/40 to-navy/[0.08] backdrop-blur-xl">
      <div className="relative mx-auto flex h-[4.25rem] max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="group flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy/10 ring-1 ring-navy/15">
            <img
              src="/brand/metivta-logo.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-[20px] font-bold leading-tight text-navy sm:text-[22px]">
              {CLASS_NAME}
            </span>
            <span className="hidden text-[12px] font-medium tracking-wide text-graphite sm:block">
              {TAGLINE}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <InstallAppButton />
          <button
            onClick={toggle}
            aria-label={t.switchLang}
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-graphite transition-colors duration-fast hover:bg-navy/10 hover:text-navy"
          >
            <Languages className="h-4 w-4" />
            <span className="hidden sm:inline">{t.switchLang}</span>
          </button>

          {isAdmin ? (
            <>
              <button
                type="button"
                onClick={requestNewFolder}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brass px-3 py-2 text-sm font-bold text-white shadow-card transition hover:brightness-95"
              >
                <FolderPlus className="h-4 w-4" />
                <span className="hidden sm:inline">{t.newFolder}</span>
              </button>
              <span className="hidden items-center gap-1.5 rounded-full border border-brass/30 bg-brassSoft px-3 py-1.5 text-[13px] font-bold text-brass sm:inline-flex">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t.adminMode}
              </span>
              <button
                onClick={lock}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-graphite transition-colors duration-fast hover:bg-navy/10 hover:text-navy"
              >
                {t.exit}
              </button>
            </>
          ) : (
            <>
              <span className="hidden items-center gap-1.5 rounded-full border border-navy/15 bg-navy/[0.06] px-3 py-1.5 text-[13px] font-semibold text-navy sm:inline-flex">
                <Eye className="h-3.5 w-3.5" />
                {t.studentMode}
              </span>
              <button
                onClick={onUnlockClick}
                aria-label={t.adminEnter}
                title={t.adminEnter}
                className="inline-flex items-center gap-1.5 rounded-xl bg-navy/10 px-2.5 py-2 text-sm font-semibold text-navy transition-colors duration-fast hover:bg-navy hover:text-white"
              >
                <KeyRound className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="border-t border-brass/25 bg-gradient-to-l from-brassSoft via-brassSoft/80 to-navy/[0.06]">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
            <p className="text-[13px] font-semibold text-brass">{t.adminModeNote}</p>
            <a
              href="#teacher-desk"
              className="text-[13px] font-bold text-navy underline-offset-2 hover:underline"
            >
              {t.teacherDeskJump}
            </a>
          </div>
        </div>
      )}

      <ScrollProgress />
    </header>
  );
}
