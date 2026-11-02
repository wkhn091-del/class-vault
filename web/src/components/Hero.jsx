import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, BookOpen, Download, FolderOpen, Sparkles } from 'lucide-react';
import { tabColor } from '../lib/format.js';
import { useLocale } from '../context/LocaleContext.jsx';
import Counter from '../motion/Counter.jsx';
import Magnetic from '../motion/Magnetic.jsx';

const CLASS_NAME = import.meta.env.VITE_CLASS_NAME || 'המתיבתא';
const TAGLINE = import.meta.env.VITE_CLASS_TAGLINE || 'תורה ודעת';
const EASE = [0.16, 1, 0.3, 1];

const FALLBACK_STACK = [
  { name: 'גמרא', color: '#5e7f73' },
  { name: 'הלכה', color: '#4e6585' },
  { name: 'מתמטיקה', color: '#c9a227' },
];

/**
 * Full-bleed student hero — brand first, cinematic navy, live folder stack.
 */
export default function Hero({ folders = [], folderCount = 0, fileCount = 0 }) {
  const { t } = useLocale();
  const reduce = useReducedMotion();

  const stack = (folders.length
    ? [...folders]
        .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || b.fileCount - a.fileCount)
        .slice(0, 3)
        .map((f) => ({ name: f.name, color: f.color || tabColor(f.name), id: f.id }))
    : FALLBACK_STACK
  );

  return (
    <section
      aria-label={CLASS_NAME}
      className="relative overflow-hidden border-b border-brass/30"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#152A45] via-navy to-[#1a3d5c]" />
        <motion.div
          className="absolute -end-24 top-0 h-[28rem] w-[28rem] rounded-full bg-brass/25 blur-3xl"
          animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -start-20 bottom-0 h-72 w-72 rounded-full bg-blue/30 blur-3xl"
          animate={reduce ? undefined : { y: [0, -18, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to left, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        <div className="relative text-white">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[12px] font-bold tracking-wide text-brassSoft backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            {CLASS_NAME}
            <span className="text-white/45">·</span>
            <span className="font-semibold text-white/80">{TAGLINE}</span>
          </p>

          <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,3.75rem)] font-bold leading-[1.08]">
            {t.heroH1}
          </h1>
          <p className="mt-4 max-w-[40ch] text-[clamp(1.05rem,2vw,1.2rem)] leading-relaxed text-white/75">
            {t.heroH2}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Magnetic strength={0.1}>
              <a
                href="#doors"
                className="inline-flex items-center gap-2 rounded-2xl bg-brass px-5 py-3.5 text-[15px] font-bold text-white shadow-[0_12px_32px_-12px_rgba(169,124,37,0.85)] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                <FolderOpen className="h-[18px] w-[18px]" />
                {t.heroCta}
              </a>
            </Magnetic>
            <a
              href="#vault"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3.5 text-[15px] font-bold text-white backdrop-blur-sm transition hover:bg-white/15"
            >
              {t.jumpArchive}
              <ArrowDown className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-3 text-[13px] text-white/55">{t.heroMicro}</p>

          {(folderCount > 0 || fileCount > 0) && (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:max-w-md">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <p className="font-display text-[32px] font-bold leading-none">
                  <Counter value={folderCount} />
                </p>
                <p className="mt-1 text-[13px] text-white/65">{t.statsFolders}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <p className="font-display text-[32px] font-bold leading-none">
                  <Counter value={fileCount} />
                </p>
                <p className="mt-1 text-[13px] text-white/65">{t.statsFiles}</p>
              </div>
            </div>
          )}

          <ul className="mt-8 grid gap-2 sm:grid-cols-2">
            {[
              { icon: BookOpen, text: t.featBrowse },
              { icon: Download, text: t.featInstant },
              { icon: FolderOpen, text: t.featOrdered },
              { icon: Sparkles, text: t.featNoLogin },
            ].map(({ icon: Icon, text }, i) => (
              <motion.li
                key={text}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : 0.15 + i * 0.06, duration: 0.4, ease: EASE }}
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/15 px-3 py-2.5 text-[13px] font-semibold text-white/85"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brass/25 text-brassSoft">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </motion.li>
            ))}
          </ul>
        </div>

        <motion.div
          className="relative mx-auto w-full max-w-sm lg:mx-0 lg:justify-self-end"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: reduce ? 0 : 0.2, ease: EASE }}
        >
          <div className="relative aspect-square">
            {stack.map((card, i) => {
              const rot = [-8, 4, -2][i] ?? 0;
              const y = [28, 14, 0][i] ?? 0;
              const body = (
                <>
                  <span
                    className="absolute start-4 top-0 h-5 w-[42%] -translate-y-[70%] rounded-t-xl"
                    style={{ backgroundColor: card.color }}
                  />
                  <div className="mt-2 flex h-full flex-col justify-between">
                    <div>
                      <p className="font-display text-[22px] text-navy">{card.name}</p>
                      <p className="mt-1 text-[13px] text-graphite">{t.teacherStackHint}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-bold text-brass">
                      <img
                        src="/brand/metivta-logo.png"
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5 object-contain opacity-80"
                      />
                      {CLASS_NAME}
                    </div>
                  </div>
                </>
              );

              return (
                <motion.div
                  key={card.id || card.name}
                  className="absolute inset-[12%]"
                  style={{ rotate: rot, y, zIndex: i + 1 }}
                  animate={reduce ? undefined : { y: [y, y - 8, y] }}
                  transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.08 }}
                >
                  {card.id ? (
                    <Link
                      to={`/f/${card.id}`}
                      className="relative flex h-full flex-col rounded-[1.4rem] border border-white/20 bg-gradient-to-br from-white/95 to-white/80 p-5 shadow-lift transition hover:brightness-[1.02]"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="relative flex h-full flex-col rounded-[1.4rem] border border-white/20 bg-gradient-to-br from-white/95 to-white/80 p-5 shadow-lift">
                      {body}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
