import { motion, useReducedMotion } from 'framer-motion';
import {
  FolderPlus, Upload, ShieldCheck, Pin, Palette, Sparkles, ArrowDown,
} from 'lucide-react';
import { useLocale } from '../context/LocaleContext.jsx';
import Counter from '../motion/Counter.jsx';
import Magnetic from '../motion/Magnetic.jsx';

const CLASS_NAME = import.meta.env.VITE_CLASS_NAME || 'המתיבתא';
const EASE = [0.16, 1, 0.3, 1];

const FEATURES = [
  { icon: FolderPlus, key: 'featCreate' },
  { icon: Palette, key: 'featColor' },
  { icon: Pin, key: 'featPin' },
  { icon: Upload, key: 'featUpload' },
];

/** Full-bleed teacher command hero — replaces the student marketing hero. */
export default function TeacherHero({ folderCount = 0, fileCount = 0, onCreate }) {
  const { t } = useLocale();
  const reduce = useReducedMotion();

  return (
    <section
      aria-label={t.adminMode}
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
            <ShieldCheck className="h-3.5 w-3.5" />
            {t.adminMode}
          </p>

          <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,3.75rem)] font-bold leading-[1.08]">
            {t.teacherHeroH1}
          </h1>
          <p className="mt-4 max-w-[40ch] text-[clamp(1.05rem,2vw,1.2rem)] leading-relaxed text-white/75">
            {t.teacherHeroLead}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Magnetic strength={0.1}>
              <button
                type="button"
                onClick={onCreate}
                className="inline-flex items-center gap-2 rounded-2xl bg-brass px-5 py-3.5 text-[15px] font-bold text-white shadow-[0_12px_32px_-12px_rgba(169,124,37,0.85)] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                <FolderPlus className="h-[18px] w-[18px]" />
                {t.newFolder}
              </button>
            </Magnetic>
            <a
              href="#teacher-desk"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3.5 text-[15px] font-bold text-white backdrop-blur-sm transition hover:bg-white/15"
            >
              {t.teacherDeskJump}
              <ArrowDown className="h-4 w-4" />
            </a>
          </div>

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

          <ul className="mt-8 grid gap-2 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, key }, i) => (
              <motion.li
                key={key}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : 0.15 + i * 0.06, duration: 0.4, ease: EASE }}
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/15 px-3 py-2.5 text-[13px] font-semibold text-white/85"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brass/25 text-brassSoft">
                  <Icon className="h-4 w-4" />
                </span>
                {t[key]}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Animated stack of folder tabs */}
        <motion.div
          className="relative mx-auto w-full max-w-sm lg:mx-0 lg:justify-self-end"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: reduce ? 0 : 0.2, ease: EASE }}
        >
          <div className="relative aspect-square">
            {[
              { rot: -8, y: 28, color: '#5e7f73', delay: 0 },
              { rot: 4, y: 14, color: '#4e6585', delay: 0.08 },
              { rot: -2, y: 0, color: '#c9a227', delay: 0.16 },
            ].map((card, i) => (
              <motion.div
                key={card.color}
                className="absolute inset-[12%] rounded-[1.4rem] border border-white/20 bg-gradient-to-br from-white/95 to-white/80 p-5 shadow-lift"
                style={{ rotate: card.rot, y: card.y, zIndex: i + 1 }}
                animate={reduce ? undefined : { y: [card.y, card.y - 8, card.y] }}
                transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: card.delay }}
              >
                <span
                  className="absolute start-4 top-0 h-5 w-[42%] -translate-y-[70%] rounded-t-xl"
                  style={{ backgroundColor: card.color }}
                />
                <div className="mt-2 flex h-full flex-col justify-between">
                  <div>
                    <p className="font-display text-[22px] text-navy">{CLASS_NAME}</p>
                    <p className="mt-1 text-[13px] text-graphite">{t.teacherStackHint}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] font-bold text-brass">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t.adminMode}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
