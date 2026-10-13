import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';

/** Thin reading-progress line under the header. */
export default function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -bottom-px z-50 h-[3px] origin-right bg-gradient-to-l from-brass via-navy to-blue"
      style={{ scaleX: reduce ? scrollYProgress : smooth }}
    />
  );
}
