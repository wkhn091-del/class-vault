import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpLeft } from 'lucide-react';
import { tabColor } from '../lib/format.js';
import { useLocale } from '../context/LocaleContext.jsx';
import Reveal from '../motion/Reveal.jsx';
import Magnetic from '../motion/Magnetic.jsx';

/** Psychology “doors”: few clear entries into real folders — not a white wall. */
export default function SubjectDoors({ folders = [] }) {
  const { t } = useLocale();
  const reduce = useReducedMotion();

  // Parent already passes the top doors list — don’t re-slice/re-sort into duplicates.
  const doors = folders.slice(0, 4);
  if (doors.length === 0) return null;

  return (
    <section id="doors" className="relative scroll-mt-24 overflow-hidden px-4 py-16 sm:px-6 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-navy/[0.09] via-blue/[0.06] to-brass/10"
      />
      <div className="relative mx-auto max-w-5xl">
        <Reveal>
          <h2 className="font-display text-[28px] text-navy sm:text-[36px]">{t.doorsTitle}</h2>
          <p className="mt-3 max-w-[48ch] text-[16px] text-graphite">{t.doorsLead}</p>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {doors.map((folder, i) => {
            const colour = folder.color || tabColor(folder.name);
            return (
              <Reveal key={folder.id} delay={i * 0.07} y={32}>
                <Magnetic strength={0.12}>
                  <Link
                    to={`/f/${folder.id}`}
                    className="group relative flex min-h-[148px] flex-col justify-between overflow-hidden rounded-3xl p-6 text-white shadow-lift transition duration-base hover:-translate-y-1"
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
                      <p className="text-[12px] font-bold tracking-wide text-white/70">
                        {String(i + 1).padStart(2, '0')}
                      </p>
                      <h3 className="mt-2 font-display text-[26px] leading-tight sm:text-[30px]">
                        {folder.name}
                      </h3>
                      {folder.description && (
                        <p className="mt-2 line-clamp-2 text-[14px] text-white/80">{folder.description}</p>
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
  );
}

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
