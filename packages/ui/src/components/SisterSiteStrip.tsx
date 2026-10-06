import { useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { durations, editorialEase, useReducedMotion } from '@kervan/motion';

/** Session flag both apps' IntroOverlay set (keep in sync). */
const INTRO_KEY = 'kv_v2_intro_seen';
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

export interface SisterSiteCopy {
  /** Pill label, sm+ (CSS-uppercased; <html lang> makes TR "KARDEŞ SİTE"). */
  tag: string;
  /** Lead before the domain, md+. */
  lead: string;
  /** Lead before the domain, below md (sr-only under 340px). */
  leadShort: string;
  /** Visible domain. */
  site: string;
  /** Same-language home page of the sister site. */
  href: string;
}

interface Props {
  lang: string;
  t: SisterSiteCopy;
  /** A small photo of what the sister site sells (3:2, 192×128 or larger). Decorative: the link text names the site. */
  image: string;
  /** The header is stuck and has slid this strip above the viewport. */
  hidden: boolean;
  /** Seconds before the one-shot sheen plays: on the session's first visit (intro curtain) and on later visits. */
  sheenAt: { first: number; later: number };
}

/**
 * Top band of the fixed header linking to the sister site (kervanheat.com ↔ kervanbreaker.com).
 * Each app's Nav renders it as the header's first child and slides the header up by
 * `--kv-strip-h` once the page scrolls; the page content is offset by the same variable.
 */
export function SisterSiteStrip({ lang, t, image, hidden, sheenAt }: Props) {
  // True in static mode (prerender + hydrate) and under reduced motion: final state, no motion nodes.
  const reduced = useReducedMotion();
  const [sheenDelay] = useState(() => (!reduced && introPending() ? sheenAt.first : sheenAt.later));

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
        {/* Photo of the sister site's work (about 3:2), ember ring */}
        <span className="relative shrink-0 overflow-hidden rounded-sm ring-1 ring-brand shadow-glow-brand h-7 w-10 sm:h-9 sm:w-14">
          <img
            src={image}
            alt=""
            width={56}
            height={36}
            decoding="async"
            draggable={false}
            className={
              'size-full object-cover select-none ' +
              (reduced
                ? ''
                : 'transition-transform duration-250 ease-editorial group-hover:scale-110 group-focus-visible:scale-110')
            }
          />
        </span>{' '}
        <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-brand px-2.5 py-1">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-pill bg-brand-hi shadow-glow-brand"
          />
          <span className="text-xs/none font-medium uppercase tracking-[0.2em] text-brand-hi">
            {t.tag}
          </span>
        </span>{' '}
        {/* Only the lead shrinks (ellipsis) when the text is enlarged; the domain and arrow always stay whole.
            Colour sits on the spans: the apps' global `a { color: inherit }` overrides utilities on the <a>. */}
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
