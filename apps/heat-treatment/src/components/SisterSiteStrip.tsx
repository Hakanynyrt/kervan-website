import { useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { durations, editorialEase, useReducedMotion } from '@kervan/motion';
import type { DictBlock, Lang } from '../types';

/** Same session flag as IntroOverlay / Hero (keep the three in sync). */
const INTRO_KEY = 'kv_v2_intro_seen';
/** Hero waits this long for the intro curtain on a first visit (Hero.tsx INTRO_WAIT). */
const INTRO_WAIT = 2;
/** Hero's last stat ends at ~t0 + 1.96 s (stagger t0+1, 4 × 0.12, 0.6 s); the sheen plays alone after it. */
const SHEEN_AT = 2.1;
const introPending = (): boolean => {
  try {
    return sessionStorage.getItem(INTRO_KEY) !== '1';
  } catch {
    return false;
  }
};

/** Links activate on Enter natively; Space too (CLAUDE.md), like Nav's language link. */
const onSpace = (e: ReactKeyboardEvent<HTMLAnchorElement>) => {
  if (e.key !== ' ') return;
  e.preventDefault();
  e.currentTarget.click();
};

interface Props {
  lang: Lang;
  t: DictBlock['sister'];
  /** The header is stuck and has slid this strip above the viewport. */
  hidden: boolean;
}

export default function SisterSiteStrip({ lang, t, hidden }: Props) {
  // True in static mode (prerender + hydrate) and under reduced motion: final state, no motion nodes.
  const reduced = useReducedMotion();
  const [sheenDelay] = useState(() => (!reduced && introPending() ? INTRO_WAIT : 0) + SHEEN_AT);

  return (
    <div
      className={
        'relative h-(--kv-strip-h) overflow-hidden bg-bg-soft ' +
        (reduced ? '' : 'transition-[visibility] duration-300 ') +
        // Stays visible while its link has keyboard focus (Nav keeps the header down), so focus is not lost on scroll.
        (hidden ? 'invisible has-[a:focus-visible]:visible' : 'visible')
      }
    >
      {/* Ember glow behind the copy ("hot metal") */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-brand-soft),transparent_70%)]"
      />
      {/* Glowing 1px hairline on the bottom edge */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-brand to-transparent"
      />
      {/* One-shot sheen, animated mode only; never rendered in static mode, so SSR and hydrate markup match */}
      {!reduced && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-brand-soft to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '300%' }}
          transition={{ duration: durations.lg, ease: editorialEase, delay: sheenDelay }}
        />
      )}
      <a
        href={t.href}
        hrefLang={lang}
        onKeyDown={onSpace}
        data-sister-link=""
        className="group relative flex h-full items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 md:px-8 whitespace-nowrap font-sans text-xs sm:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:-outline-offset-4"
      >
        <span className="inline-flex shrink-0 items-center gap-1.5 sm:rounded-pill sm:border sm:border-brand sm:px-2.5 sm:py-1">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-pill bg-brand-hi shadow-glow-brand"
          />
          <span className="hidden sm:inline text-xs/none font-medium uppercase tracking-[0.2em] text-brand-hi">
            {t.tag}
          </span>
        </span>{' '}
        {/* Only the lead shrinks (ellipsis) when the text is enlarged; the domain and arrow always stay whole.
            Colour sits on the spans: the global `a { color: inherit }` overrides utilities on the <a>. */}
        <span className="min-w-0 truncate text-ink-mid transition-colors group-hover:text-ink group-focus-visible:text-ink md:hidden max-[340px]:sr-only">
          {t.leadShort}
        </span>{' '}
        <span className="hidden min-w-0 truncate text-ink-mid transition-colors group-hover:text-ink group-focus-visible:text-ink md:inline">
          {t.lead}
        </span>{' '}
        <span className="shrink-0 font-serif italic text-sm sm:text-base text-ink underline decoration-1 underline-offset-4 decoration-transparent transition-colors group-hover:decoration-brand group-focus-visible:decoration-brand">
          {t.site}
        </span>
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={
            'shrink-0 text-brand-hi ' +
            (reduced
              ? ''
              : 'transition-transform duration-150 ease-editorial group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-focus-visible:translate-x-0.5 group-focus-visible:-translate-y-0.5')
          }
        >
          <path d="M7 17 17 7" />
          <path d="M8 7h9v9" />
        </svg>
      </a>
    </div>
  );
}
