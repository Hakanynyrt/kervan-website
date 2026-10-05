import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import type { DictBlock, Lang } from '../types';
import { SectionHeading } from '@kervan/ui';
import { BOT_UA_PATTERN } from '@kervan/motion';
import { EXPORTS } from '../lib/exports';

// The globe pulls in three.js (~700 KB) and runs a WebGL loop: load it as its own chunk,
// and only once the section is within a few screens of the viewport.
const ExportsGlobe = lazy(() => import('./ExportsGlobe'));

/** Bots and headless browsers never load the globe (it is decoration). */
const isBot = () => {
  try {
    return navigator.webdriver || new RegExp(BOT_UA_PATTERN, 'i').test(navigator.userAgent || '');
  } catch {
    return false;
  }
};

/** Square placeholder that swaps to its children when it comes near the viewport.
 *  Always the placeholder on the server and on the first client render (so
 *  the prerendered markup hydrates cleanly); the swap happens after mount. */
function NearViewport({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (near || !el || isBot()) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '800px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  if (near) return <>{children}</>;
  return (
    <div ref={ref} aria-hidden="true" className="w-full max-w-[640px] mx-auto aspect-square" />
  );
}

interface Props {
  t: DictBlock;
  lang: Lang;
}

/** Section wrapper for the exports globe. Counts the destinations from
 *  the data file so the title doesn't drift if the list grows. */
export default function Exports({ t, lang }: Props) {
  const count = EXPORTS.length;
  const title = t.exports.title.replace('{count}', String(count));

  return (
    <section
      id="exports"
      data-scene-pose="exports"
      className="min-h-dvh flex flex-col justify-center py-8 md:py-16"
    >
      <SectionHeading eyebrow={t.exports.eyebrow} title={title} aside={t.exports.aside} />
      <NearViewport>
        <Suspense
          fallback={
            <div aria-hidden="true" className="w-full max-w-[640px] mx-auto aspect-square" />
          }
        >
          <ExportsGlobe lang={lang} />
        </Suspense>
      </NearViewport>
    </section>
  );
}
