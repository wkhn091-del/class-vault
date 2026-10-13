import { motion, useReducedMotion } from 'framer-motion';
import { FolderOpen } from 'lucide-react';
import { useLocale } from '../context/LocaleContext.jsx';
import Magnetic from '../motion/Magnetic.jsx';

const CLASS_NAME = import.meta.env.VITE_CLASS_NAME || 'המתיבתא';
const TAGLINE = import.meta.env.VITE_CLASS_TAGLINE || 'תורה ודעת';

const EASE = [0.16, 1, 0.3, 1];

/**
 * Production Hero — copy B approved.
 * H1 paints immediately (no motion gate). Secondary elements may animate.
 */
export default function Hero() {
  const { t } = useLocale();
  const reduce = useReducedMotion();

  return (
    <section
      aria-label={CLASS_NAME}
      className="relative overflow-hidden border-b border-navy/10"
    >
      {/* Depth washes — idle only when motion allowed */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute -end-20 top-0 h-[22rem] w-[22rem] rounded-full bg-navy/[0.12] blur-3xl"
          animate={reduce ? undefined : { y: [0, 16, 0], opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -start-16 bottom-0 h-64 w-64 rounded-full bg-brass/20 blur-3xl"
          animate={reduce ? undefined : { y: [0, -12, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brassSoft/40 via-transparent to-navy/[0.05]" />
      </div>

      <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:grid-cols-2 lg:gap-12 lg:pb-24">
        {/* Copy — first in DOM = right side in RTL */}
        <div className="relative order-2 lg:order-1">
          {/* Ghost word — wow, not competing with CTA */}
          <p
            aria-hidden="true"
            className="pointer-events-none absolute -top-6 end-0 select-none font-display text-[clamp(3.5rem,14vw,7rem)] font-bold leading-none text-navy/[0.06] sm:-top-10"
          >
            {CLASS_NAME}
          </p>

          <p className="relative text-[13px] font-semibold tracking-wide text-navy/75">{TAGLINE}</p>

          {/* Micro-trust above the fold — Script 2 A */}
          <p className="relative mt-2 inline-flex rounded-full border border-navy/15 bg-navy/[0.06] px-3 py-1 text-[12px] font-semibold text-navy">
            {t.trustLine}
          </p>

          {/* H1: eager, no framer delay */}
          <h1 className="relative mt-4 font-display text-[clamp(2.5rem,5.5vw,4.25rem)] font-bold leading-[1.08] text-navy">
            {t.heroH1}
          </h1>

          <div className="relative mt-5 h-px w-24 brass-rule" />

          <motion.p
            className="relative mt-5 max-w-[36ch] text-[clamp(1.05rem,2vw,1.25rem)] leading-relaxed text-graphite"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reduce ? 0 : 0.18, ease: EASE }}
          >
            {t.heroH2}
          </motion.p>

          <motion.div
            className="relative mt-8 flex flex-col gap-3 sm:items-start"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reduce ? 0 : 0.28, ease: EASE }}
          >
            <Magnetic strength={0.1} className="w-full sm:w-auto">
              <a
                href="#doors"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-navy px-6 py-3.5 text-[16px] font-bold text-white shadow-[0_10px_28px_-12px_rgba(30,58,95,0.65)] transition duration-fast hover:-translate-y-px hover:bg-navyDeep hover:shadow-[0_14px_32px_-12px_rgba(30,58,95,0.75)] sm:w-auto"
              >
                <FolderOpen className="h-[18px] w-[18px]" aria-hidden="true" />
                {t.heroCta}
              </a>
            </Magnetic>
            <p className="text-center text-[13px] text-mute sm:text-start">{t.heroMicro}</p>
          </motion.div>
        </div>

        {/* Visual — logo / drawer object */}
        <motion.div
          className="order-1 flex justify-center lg:order-2 lg:justify-end"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: reduce ? 0 : 0.35, ease: EASE }}
        >
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-navy/15 via-blue/10 to-brass/20 blur-2xl"
            />
            <div className="relative flex h-[220px] w-[220px] items-center justify-center rounded-[2rem] border border-navy/10 bg-gradient-to-br from-surface via-raised to-brassSoft/60 shadow-lift sm:h-[260px] sm:w-[260px]">
              <img
                src="/brand/metivta-logo.png"
                alt={CLASS_NAME}
                width={160}
                height={160}
                fetchPriority="high"
                decoding="async"
                className="h-36 w-36 object-contain drop-shadow-[0_18px_24px_rgba(30,58,95,0.28)] sm:h-40 sm:w-40"
              />
              {/* Soft reflection */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 bottom-5 h-10 rounded-[100%] bg-navy/10 blur-md"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
