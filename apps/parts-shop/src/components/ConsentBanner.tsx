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
 * trap), no motion (the shop has none in M1). A one-line strip at the bottom edge.
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

  // A thin strip along the bottom edge (owner: "daha az rahatsız etsin"): one line from md up,
  // text over the buttons on phones; both choices the same size (KVKK cookie guide).
  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="kv-consent-title"
      aria-describedby="kv-consent-body"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-hair-strong bg-bg font-sans text-sm shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 md:flex-row md:items-center md:gap-4">
        <p id="kv-consent-title" className="sr-only">
          {c.title}
        </p>
        <p id="kv-consent-body" className="m-0 min-w-0 flex-1 leading-snug text-ink-mid">
          {c.body}{' '}
          <a
            href={`${localePath(legalPath('kvkk'), lang)}#cerezler`}
            className={`font-medium text-brand-hi underline underline-offset-2 hover:text-ink ${FOCUS}`}
          >
            {c.policy}
          </a>
        </p>
        <div className="grid shrink-0 grid-cols-2 gap-2 md:w-64">
          <button
            type="button"
            onClick={() => choose('denied')}
            className={`min-h-10 cursor-pointer rounded-sm border border-ink-soft bg-bg px-4 font-medium text-ink hover:bg-bg-warm ${FOCUS}`}
          >
            {c.reject}
          </button>
          <button
            type="button"
            onClick={() => choose('granted')}
            className={`min-h-10 cursor-pointer rounded-sm bg-brand px-4 font-medium text-on-brand hover:bg-brand-hi ${FOCUS}`}
          >
            {c.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
