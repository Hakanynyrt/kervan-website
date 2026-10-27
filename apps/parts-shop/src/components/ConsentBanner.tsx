import { useEffect, useState } from 'react';
import type { Dict } from '../lib/dict';
import { legalPath } from '../lib/legal';
import { localePath } from '../lib/locale-path';
import {
  CONSENT_OPEN_EVENT,
  conversionsForLink,
  isAutomatedClient,
  loadAdsTag,
  readConsent,
  revokeAdsConsent,
  trackConversion,
  writeConsent,
  type ConsentChoice,
} from '../lib/ads';
import { FOCUS } from './Layout';
import type { Lang } from '../types';

/**
 * Cookie consent for Google Ads measurement (same design as heat-treatment's). Client-only:
 * the first render is null in the prerender and the hydrate, so the markup always matches;
 * the banner appears after mount for humans who have not chosen yet. Non-modal (no focus
 * trap), no motion (the shop has none in M1).
 */
export function ConsentBanner({ lang, t }: { lang: Lang; t: Dict }) {
  const [open, setOpen] = useState(false);
  const c = t.consent;

  useEffect(() => {
    if (isAutomatedClient()) return;
    const choice = readConsent();
    if (choice === 'granted') loadAdsTag();
    if (choice === null) setOpen(true);

    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);

    // Phone and WhatsApp links anywhere count as contact conversions, links marked
    // ORDER_CONVERSION (order requests, quotes) only as `form`; no-op until the tag is loaded.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]');
      if (a) for (const kind of conversionsForLink(a)) trackConversion(kind);
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
    // The tag cannot be unloaded, but consent mode stops it from storing or sending ad data
    // at once; from the next page load it is not loaded at all.
    else revokeAdsConsent();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="kv-consent-title"
      aria-describedby="kv-consent-body"
      className="fixed inset-x-3 bottom-3 z-50 rounded-sm border border-hair-strong bg-bg p-5 font-sans text-sm shadow-lg sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-w-md"
    >
      <p id="kv-consent-title" className="m-0 text-base font-bold text-ink">
        {c.title}
      </p>
      <p id="kv-consent-body" className="m-0 mt-2 leading-relaxed text-ink-mid">
        {c.body}{' '}
        <a
          href={`${localePath(legalPath('kvkk'), lang)}#cerezler`}
          className={`font-medium text-brand-hi underline underline-offset-2 hover:text-ink ${FOCUS}`}
        >
          {c.policy}
        </a>
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => choose('denied')}
          className={`min-h-11 cursor-pointer rounded-sm border border-ink-soft bg-bg px-4 font-medium text-ink hover:bg-bg-warm ${FOCUS}`}
        >
          {c.reject}
        </button>
        <button
          type="button"
          onClick={() => choose('granted')}
          className={`min-h-11 cursor-pointer rounded-sm bg-brand px-4 font-medium text-on-brand hover:bg-brand-hi ${FOCUS}`}
        >
          {c.accept}
        </button>
      </div>
    </div>
  );
}
