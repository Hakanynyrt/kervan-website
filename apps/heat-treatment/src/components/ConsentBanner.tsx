import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { durations, editorialEase, useReducedMotion } from '@kervan/motion';
import type { DictBlock } from '../types';
import {
  CONSENT_OPEN_EVENT,
  isAutomatedClient,
  loadAdsTag,
  readConsent,
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
      const href = a.getAttribute('href') ?? '';
      if (href.startsWith('tel:')) trackConversion('phone');
      else if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) trackConversion('whatsapp');
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
    // A withdrawn consent takes full effect on the next page load (the tag
    // cannot be unloaded); nothing new is sent from then on.
    setOpen(false);
  };

  if (!open) return null;

  return (
    <motion.div
      role="dialog"
      aria-modal="false"
      aria-labelledby="kv-consent-title"
      aria-describedby="kv-consent-body"
      className="fixed z-50 bottom-4 inset-x-4 md:inset-x-auto md:right-6 md:bottom-6 md:max-w-md bg-bg-soft border border-hair rounded-md p-5 shadow-[0_12px_32px_rgba(0,0,0,0.5)] font-sans"
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durations.md, ease: editorialEase }}
    >
      <p id="kv-consent-title" className="text-sm font-medium text-ink m-0">
        {t.title}
      </p>
      <p id="kv-consent-body" className="mt-2 mb-0 text-sm text-ink-mid leading-relaxed">
        {t.body}{' '}
        {/* Colour/underline on the span: the global `a { color: inherit; text-decoration: none }` wins over utilities on the <a>. */}
        <a
          href="/kvkk#cerezler"
          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
        >
          <span className="text-brand-hi underline underline-offset-2">{t.policy}</span>
        </a>
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => choose('denied')}
          className="min-h-11 border border-ink-soft text-ink px-4 text-sm hover:bg-bg-warm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
        >
          {t.reject}
        </button>
        <button
          type="button"
          onClick={() => choose('granted')}
          className="min-h-11 bg-brand text-bg px-4 text-sm hover:bg-brand-hi transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
        >
          {t.accept}
        </button>
      </div>
    </motion.div>
  );
}
