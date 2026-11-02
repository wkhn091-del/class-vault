import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FolderPlus, LayoutGrid, Search, ShieldCheck, Pin } from 'lucide-react';
import { useLocale } from '../context/LocaleContext.jsx';
import FolderCard from './FolderCard.jsx';
import { Button } from './ui.jsx';
import Reveal from '../motion/Reveal.jsx';

/** Teacher-only workspace: create folders and manage the full archive. */
export default function TeacherDesk({
  folders = [],
  onCreate,
  onSettings,
  onTogglePin,
}) {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const [query, setQuery] = useState('');
  const [onlyPinned, setOnlyPinned] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return folders.filter((f) => {
      if (onlyPinned && !f.is_pinned) return false;
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        String(f.description || '').toLowerCase().includes(q)
      );
    });
  }, [folders, query, onlyPinned]);

  const count = folders.length;
  const files = folders.reduce((sum, f) => sum + (f.fileCount || 0), 0);
  const pinnedCount = folders.filter((f) => f.is_pinned).length;

  return (
    <section
      id="teacher-desk"
      className="scroll-mt-28 border-y border-brass/25 bg-gradient-to-b from-brassSoft/55 via-canvas to-navy/[0.04] px-4 py-10 sm:px-6 sm:py-12"
    >
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-brass/35 bg-surface/80 px-3 py-1 text-[12px] font-bold tracking-wide text-brass">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t.adminMode}
              </p>
              <h2 className="mt-3 font-display text-[28px] text-navy sm:text-[34px]">{t.teacherDeskTitle}</h2>
              <p className="mt-2 max-w-[48ch] text-[15px] text-graphite">{t.teacherDeskLead}</p>
            </div>
            <Button variant="brass" className="shrink-0 shadow-lift" onClick={onCreate}>
              <FolderPlus className="h-[18px] w-[18px]" />
              {t.newFolder}
            </Button>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-navy/10 bg-surface/90 px-4 py-3 shadow-card">
            <p className="text-[12px] font-bold text-mute">{t.statsFolders}</p>
            <p className="mt-1 font-display text-[26px] text-navy">{count}</p>
          </div>
          <div className="rounded-2xl border border-navy/10 bg-surface/90 px-4 py-3 shadow-card">
            <p className="text-[12px] font-bold text-mute">{t.statsFiles}</p>
            <p className="mt-1 font-display text-[26px] text-navy">{files}</p>
          </div>
          <div className="rounded-2xl border border-navy/10 bg-surface/90 px-4 py-3 shadow-card">
            <p className="text-[12px] font-bold text-mute">{t.pinned}</p>
            <p className="mt-1 font-display text-[26px] text-navy">{pinnedCount}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-mute" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.teacherSearchPlaceholder}
              className="w-full rounded-xl border border-hairline bg-surface py-3 pe-4 ps-11 text-[15px] shadow-inset placeholder:text-mute focus:border-navy"
            />
          </div>
          <button
            type="button"
            onClick={() => setOnlyPinned((v) => !v)}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[14px] font-bold transition ${
              onlyPinned
                ? 'border-brass/40 bg-brassSoft text-brass'
                : 'border-hairline bg-surface text-graphite hover:border-navy/25'
            }`}
          >
            <Pin className={`h-4 w-4 ${onlyPinned ? 'fill-current' : ''}`} />
            {t.teacherFilterPinned}
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          <motion.button
            type="button"
            onClick={onCreate}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="group relative flex min-h-[148px] flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed border-brass/40 bg-gradient-to-br from-surface via-brassSoft/30 to-navy/[0.05] p-6 text-center transition hover:-translate-y-1 hover:border-brass hover:shadow-lift"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brass text-white shadow-card transition group-hover:scale-105">
              <FolderPlus className="h-6 w-6" />
            </span>
            <span className="font-display text-[18px] text-navy">{t.newFolder}</span>
            <span className="max-w-[28ch] text-[13px] text-graphite">{t.newFolderCardHint}</span>
          </motion.button>

          {filtered.map((folder, index) => (
            <motion.div
              key={folder.id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.45,
                delay: Math.min((index + 1) * 0.05, 0.4),
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <FolderCard folder={folder} onSettings={onSettings} onTogglePin={onTogglePin} />
            </motion.div>
          ))}
        </div>

        {folders.length === 0 && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-navy/10 bg-surface/80 p-4 text-start">
            <LayoutGrid className="mt-0.5 h-5 w-5 shrink-0 text-navy" />
            <p className="text-[14px] leading-relaxed text-graphite">{t.teacherDeskEmpty}</p>
          </div>
        )}

        {folders.length > 0 && filtered.length === 0 && (
          <p className="mt-6 text-center text-[14px] font-semibold text-graphite">{t.noMatchesNote}</p>
        )}
      </div>
    </section>
  );
}
