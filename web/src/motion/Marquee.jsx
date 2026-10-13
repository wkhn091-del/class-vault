import { useReducedMotion } from 'framer-motion';

/** Endless subject strip — fun without stealing focus from the archive. */
export default function Marquee({ items = [], className = '' }) {
  const reduce = useReducedMotion();
  const row = [...items, ...items];

  return (
    <div
      className={`relative overflow-hidden border-y border-hairline/80 bg-navy/[0.03] ${className}`}
      aria-hidden="true"
    >
      <div
        className={`flex w-max gap-10 py-4 ${reduce ? '' : 'animate-marquee'}`}
        style={reduce ? undefined : { animationDuration: '42s' }}
      >
        {row.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="shrink-0 font-display text-[18px] font-bold text-navy/55 sm:text-[22px]"
          >
            {label}
            <span className="mx-5 text-brass/70">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
