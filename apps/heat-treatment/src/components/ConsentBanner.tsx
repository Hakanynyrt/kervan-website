import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { durations, editorialEase, useReducedMotion } from '@kervan/motion';
import type { DictBlock } from '../types';
import {
  CONSENT_OPEN_EVENT,
  isAutomatedClient,
  loadAdsTag,
  conversionForHref,
  readConsent,
  revokeAdsConsent,
  trackConversion,
  writeConsent,
  type ConsentChoice,
} from '../lib/ads';

interface Props {
  t: DictBlock['consent'];
}

/**
 * Cookie consent for Google Ads measurement. Client-only: the first render is
 * null on the server and in the static hydrate, so markup always matches; the
 * banner appears after mount for humans who have not chosen yet.
 * Non-modal (no focus trap), both choices equally prominent.
 */
export default function ConsentBanner({ t }: Props) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isAutomatedClient()) return;
    const choice = readConsent();
    if (choice === 'granted') loadAdsTag();
    if (choice === null) setOpen(true);

    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);

    // Phone and WhatsApp links anywhere on the page count as contact conversions
    // (no-op until the tag is loaded).
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]');
      if (!a) return;
      const kind = conversionForHref(a.getAttribute('href') ?? '');
      if (kind) trackConversion(kind);
    };
    document.addEventListener('click', onClick, true);

    return () => {
      window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  const choose = (choice: ConsentChoice) => {
    writeConsent(choice);
    if (choice === 'granted') loadAdsTag();
    // The tag cannot be unloaded, but consent mode stops it from storing or
    // sending ad data at once; from the next page load it is not loaded at all.
    else revokeAdsConsent();
    setOpen(false);
  };

  if (!open) return null;

  return (
    // A thin strip along the bottom edge (owner: "daha az rahatsız etsin"): one line from md
    // up, text over the buttons on phones; both choices the same size (KVKK cookie guide).
    <motion.div
      role="dialog"
      aria-modal="false"
      aria-labelledby="kv-consent-title"
      aria-describedby="kv-consent-body"
      className="fixed z-50 inset-x-0 bottom-0 bg-bg-soft border-t border-hair shadow-[0_-8px_24px_rgba(0,0,0,0.45)] font-sans"
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durations.md, ease: editorialEase }}
    >
      <div className="mx-auto max-w-6xl px-4 py-2.5 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <p id="kv-consent-title" className="sr-only">
          {t.title}
        </p>
        <p id="kv-consent-body" className="m-0 flex-1 min-w-0 text-sm text-ink-mid leading-snug">
          {t.body}{' '}
          {/* Colour/underline on the span: the global `a { color: inherit; text-decoration: none }` wins over utilities on the <a>. */}
          <a
            href="/kvkk#cerezler"
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
          >
            <span className="text-brand-hi underline underline-offset-2">{t.policy}</span>
          </a>
        </p>
        <div className="grid grid-cols-2 gap-2 shrink-0 md:w-64">
          <button
            type="button"
            onClick={() => choose('denied')}
            className="min-h-10 border border-ink-soft text-ink px-4 text-sm hover:bg-bg-warm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
          >
            {t.reject}
          </button>
          <button
            type="button"
            onClick={() => choose('granted')}
            className="min-h-10 bg-brand text-bg px-4 text-sm hover:bg-brand-hi transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
