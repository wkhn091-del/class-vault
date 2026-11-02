import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpLeft, Pin, Search } from 'lucide-react';
import { formatBytes, relativeDate, tabColor } from '../lib/format.js';
import { useLocale } from '../context/LocaleContext.jsx';
import Reveal from '../motion/Reveal.jsx';
import Magnetic from '../motion/Magnetic.jsx';

/** Darken a hex toward navy for depth on door gradients. */
function mixNavy(hex) {
  try {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const mix = (c) => Math.round(c * 0.45 + 30 * 0.55);
    return `#${[mix(r), mix(g), mix(b)].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  } catch {
    return '#152A45';
  }
}

/**
 * Student folder gallery — featured doors + searchable archive, same visual
 * altitude as the teacher desk.
 */
export default function StudentVault({ folders = [] }) {
  const { t, locale } = useLocale();
  const reduce = useReducedMotion();
  const [query, setQuery] = useState('');

  // Trust the server/manual order — first folders are the main doors.
  const featured = useMemo(() => folders.slice(0, 4), [folders]);
  const featuredIds = useMemo(() => new Set(featured.map((f) => f.id)), [featured]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        String(f.description || '').toLowerCase().includes(q)
    );
  }, [folders, query]);

  const archive = useMemo(
    () => filtered.filter((f) => !featuredIds.has(f.id) || query.trim()),
    [filtered, featuredIds, query]
  );

  const searching = Boolean(query.trim());
  const showFeatured = !searching && featured.length > 0;
  const list = searching ? filtered : archive;

  if (folders.length === 0) return null;

  return (
    <>
      {showFeatured && (
        <section id="doors" className="relative scroll-mt-24 overflow-hidden px-4 py-14 sm:px-6 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-navy/[0.1] via-blue/[0.06] to-brass/12"
          />
          <div className="relative mx-auto max-w-5xl">
            <Reveal>
              <h2 className="font-display text-[28px] text-navy sm:text-[36px]">{t.doorsTitle}</h2>
              <p className="mt-3 max-w-[48ch] text-[16px] text-graphite">{t.doorsLead}</p>
            </Reveal>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {featured.map((folder, i) => {
                const colour = folder.color || tabColor(folder.name);
                return (
                  <Reveal key={folder.id} delay={i * 0.07} y={32}>
                    <Magnetic strength={0.12}>
                      <Link
                        to={`/f/${folder.id}`}
                        className="group relative flex min-h-[168px] flex-col justify-between overflow-hidden rounded-3xl p-6 text-white shadow-lift transition duration-base hover:-translate-y-1"
                        style={{
                          background: `linear-gradient(145deg, ${colour} 0%, ${mixNavy(colour)} 100%)`,
                        }}
                      >
                        <motion.span
                          aria-hidden="true"
                          className="absolute -end-6 -top-6 h-28 w-28 rounded-full bg-white/15 blur-2xl"
                          animate={reduce ? undefined : { scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                          transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <div className="relative">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[12px] font-bold tracking-wide text-white/70">
                              {String(i + 1).padStart(2, '0')}
                            </p>
                            {folder.is_pinned && (
                              <Pin className="h-3.5 w-3.5 fill-current text-brassSoft" aria-label={t.pinned} />
                            )}
                          </div>
                          <h3 className="mt-2 font-display text-[26px] leading-tight sm:text-[30px]">
                            {folder.name}
                          </h3>
                          {folder.description && (
                            <p className="mt-2 line-clamp-2 text-[14px] text-white/80">
                              {folder.description}
                            </p>
                          )}
                        </div>
                        <div className="relative mt-6 flex items-center justify-between text-[14px] font-bold">
                          <span>
                            {folder.fileCount === 0 ? t.emptyForNow : t.files(folder.fileCount)}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm transition group-hover:bg-white/30">
                            {t.doorsOpen}
                            <ArrowUpLeft className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </Link>
                    </Magnetic>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section
        id="vault"
        className="scroll-mt-24 border-y border-navy/10 bg-gradient-to-b from-brassSoft/45 via-canvas to-navy/[0.05] px-4 py-12 sm:px-6 sm:py-14"
      >
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="font-display text-[28px] text-navy sm:text-[34px]">
              {searching ? t.allFolders : t.archiveMoreTitle}
            </h2>
            <div className="mt-4 h-px w-20 brass-rule" />
            <p className="mt-4 max-w-[48ch] text-[16px] text-graphite">
              {searching ? t.vaultSearchLead : t.archiveMoreLead}
            </p>
          </Reveal>

          <div className="relative mt-6">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-mute" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.teacherSearchPlaceholder}
              className="w-full rounded-xl border border-hairline bg-surface py-3 pe-4 ps-11 text-[15px] shadow-inset placeholder:text-mute focus:border-navy"
              aria-label={t.teacherSearchPlaceholder}
            />
          </div>

          {!showFeatured && searching === false && (
            <p className="mt-4 text-[13px] text-mute">{t.archiveAllInDoors}</p>
          )}

          {list.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((folder, index) => {
                const colour = folder.color || tabColor(folder.name);
                return (
                  <motion.div
                    key={folder.id}
                    initial={reduce ? false : { opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{
                      duration: 0.5,
                      delay: Math.min(index * 0.05, 0.4),
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <div className="group relative pt-[18px]">
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute start-0 top-0 h-[22px] w-[46%] max-w-[150px] rounded-t-[12px] transition-all duration-base ease-out group-hover:-top-1 group-hover:h-[28px]"
                        style={{ backgroundColor: colour }}
                      />
                      <Link
                        to={`/f/${folder.id}`}
                        className="block transition-transform duration-base ease-out hover:-translate-y-1.5"
                      >
                        <article className="relative flex min-h-[160px] flex-col justify-between overflow-hidden rounded-2xl rounded-ss-none border border-hairline bg-surface p-5 shadow-card transition-shadow duration-base group-hover:shadow-lift">
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-0 top-0 h-1 opacity-90"
                            style={{ backgroundColor: colour }}
                          />
                          <div>
                            <h3 className="flex items-start gap-1.5 font-display text-[21px] leading-snug text-navy">
                              {folder.is_pinned && (
                                <Pin
                                  className="mt-1.5 h-4 w-4 shrink-0 fill-current text-brass"
                                  aria-label={t.pinned}
                                />
                              )}
                              <span>{folder.name}</span>
                            </h3>
                            {folder.description && (
                              <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-graphite">
                                {folder.description}
                              </p>
                            )}
                          </div>
                          <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-hairline pt-3">
                            <span className="text-[15px] font-semibold text-navy">
                              {folder.fileCount === 0 ? t.emptyForNow : t.files(folder.fileCount)}
                            </span>
                            {folder.fileCount > 0 && (
                              <span className="tabular text-[13px] text-mute">
                                {formatBytes(folder.totalBytes, locale)} ·{' '}
                                {t.addedRelative(relativeDate(folder.updatedAt, t, locale))}
                              </span>
                            )}
                          </div>
                          <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-brass opacity-0 transition group-hover:opacity-100">
                            {t.doorsOpen}
                            <ArrowUpLeft className="h-3.5 w-3.5" />
                          </span>
                        </article>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="mt-8 text-center text-[14px] font-semibold text-graphite">
              {searching ? t.noMatchesNote : t.archiveAllInDoors}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
