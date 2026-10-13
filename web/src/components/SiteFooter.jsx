import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { FolderOpen, Phone } from 'lucide-react';
import { useLocale } from '../context/LocaleContext.jsx';

const CLASS_NAME = import.meta.env.VITE_CLASS_NAME || 'המתיבתא';
const TAGLINE = import.meta.env.VITE_CLASS_TAGLINE || 'תורה ודעת';
const EASE = [0.16, 1, 0.3, 1];

export default function SiteFooter() {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const { pathname } = useLocation();
  const onHome = pathname === '/';

  const doorsHref = onHome ? '#doors' : '/#doors';

  return (
    <motion.footer
      className="border-t border-navy/20 bg-gradient-to-b from-navyDeep to-navy text-white"
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: EASE }}
    >
      {/* Mini-Hero */}
      <div className="border-b border-white/10 px-4 py-12 text-center sm:px-6 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <p className="text-[13px] font-semibold tracking-wide text-brassSoft">{TAGLINE}</p>
          <h2 className="mt-3 font-display text-[clamp(1.6rem,4vw,2.4rem)] text-white">
            {t.closeTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-[40ch] text-[15px] text-white/65">{t.closeBody}</p>
          <a
            href={doorsHref}
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-brass px-6 py-3.5 text-[15px] font-bold text-navyDeep shadow-[0_10px_28px_-12px_rgba(0,0,0,0.45)] transition duration-fast hover:-translate-y-px hover:bg-brassSoft hover:shadow-[0_14px_32px_-12px_rgba(0,0,0,0.5)]"
          >
            <FolderOpen className="h-[18px] w-[18px]" aria-hidden="true" />
            {t.heroCta}
          </a>
        </div>
      </div>

      {/* Columns */}
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:grid-cols-3 sm:gap-8 sm:px-6 sm:py-14">
        <div>
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <img
                src="/brand/metivta-logo.png"
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
            </span>
            <span>
              <span className="block font-display text-[18px] font-bold text-white">{CLASS_NAME}</span>
              <span className="block text-[12px] text-white/55">{TAGLINE}</span>
            </span>
          </Link>
          <a
            href={`tel:${t.legalPhone.replace(/[^\d+]/g, '')}`}
            className="footer-link mt-5 inline-flex min-h-12 items-center gap-2 text-[14px] text-white/70"
            aria-label={`${t.legalContact} ${t.legalPhone}`}
          >
            <Phone className="h-4 w-4 text-brassSoft" aria-hidden="true" />
            <bdi dir="ltr">{t.legalPhone}</bdi>
          </a>
          <p className="mt-2 text-[13px] text-white/45">{t.legalContact}</p>
        </div>

        <nav aria-label={t.footerExplore}>
          <p className="text-[13px] font-bold tracking-wide text-brassSoft">{t.footerExplore}</p>
          <ul className="mt-3 space-y-1">
            <li>
              <Link to="/" className="footer-link inline-flex min-h-12 items-center text-[15px] text-white/70">
                {t.footerHome}
              </Link>
            </li>
            <li>
              <a href={doorsHref} className="footer-link inline-flex min-h-12 items-center text-[15px] text-white/70">
                {t.jumpArchive}
              </a>
            </li>
          </ul>
        </nav>

        <nav aria-label={t.footerNav}>
          <p className="text-[13px] font-bold tracking-wide text-brassSoft">{t.footerNav}</p>
          <ul className="mt-3 space-y-1">
            <li>
              <Link
                to="/privacy"
                className="footer-link inline-flex min-h-12 items-center text-[15px] text-white/70"
              >
                {t.privacy}
              </Link>
            </li>
            <li>
              <Link
                to="/terms"
                className="footer-link inline-flex min-h-12 items-center text-[15px] text-white/70"
              >
                {t.terms}
              </Link>
            </li>
            <li>
              <Link
                to="/accessibility"
                className="footer-link inline-flex min-h-12 items-center text-[15px] text-white/70"
              >
                {t.accessibility}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center sm:px-6">
        <p className="text-[12px] text-white/45">{t.footer}</p>
      </div>
    </motion.footer>
  );
}
