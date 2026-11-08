import { useCallback, useEffect, useState } from 'react';
import type { CatalogStatus } from './use-vega-catalog';
import { type Quote, parseQuote } from './quote';

/** Loads the owner-only quote data (shop prices, stock, lead time) once the shared-tips tab is
 *  opened. Kept in memory only (never localStorage) and dropped on sign-out. A failure only hides
 *  the quote lines; the tab keeps working. */
export function useTechQuote(authed: boolean, active: boolean, onUnauthorized: () => void) {
  const [status, setStatus] = useState<CatalogStatus>('idle');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (authed) return;
    setQuote(null);
    setStatus('idle');
  }, [authed]);

  useEffect(() => {
    if (!authed || !active || quote) return;
    let alive = true;
    setStatus('loading');
    (async () => {
      try {
        const r = await fetch('/api/tech/quote', { credentials: 'same-origin' });
        if (!alive) return;
        if (r.status === 401) {
          setStatus('unauthorized');
          onUnauthorized();
          return;
        }
        if (r.status === 503) return setStatus('not_configured');
        const ct = r.headers.get('content-type') ?? '';
        if (r.status !== 200 || !ct.includes('application/json')) return setStatus('error');
        const b = (await r.json()) as { ok?: boolean; authed?: boolean };
        if (!alive) return;
        const q = b.ok === true && b.authed === true ? parseQuote(b) : null;
        if (q) {
          setQuote(q);
          setStatus('ready');
        } else setStatus('error');
      } catch {
        if (alive) setStatus('error');
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, active, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { status, quote, retry };
}
