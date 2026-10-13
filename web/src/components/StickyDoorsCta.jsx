import { useEffect, useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { useLocale } from '../context/LocaleContext.jsx';

/** Mobile sticky CTA until #doors is on screen — CRO fix, Script 2 Module C. */
export default function StickyDoorsCta() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById('doors');
    if (!target) {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show only while doors are still below the fold (not yet reached).
        const stillAbove = entry.boundingClientRect.top > window.innerHeight * 0.15;
        setVisible(!entry.isIntersecting && stillAbove);
      },
      { threshold: [0, 0.15, 0.5] }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
      <a
        href="#doors"
        className="pointer-events-auto flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-navy px-4 py-3.5 text-[15px] font-bold text-white shadow-lift"
      >
        <FolderOpen className="h-[18px] w-[18px]" aria-hidden="true" />
        {t.heroCta}
      </a>
    </div>
  );
}
