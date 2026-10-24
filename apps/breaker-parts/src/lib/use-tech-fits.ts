import { useCallback, useEffect, useState } from 'react';
import type { FitsIndex } from '@kervan/tips';
import type { CatalogStatus } from './use-vega-catalog';

/** Loads the private "which breakers share one tip" index once its tab is opened. Kept in
 *  memory only (never localStorage/sessionStorage) and dropped on sign-out. */
export function useTechFits(authed: boolean, active: boolean, onUnauthorized: () => void) {
  const [status, setStatus] = useState<CatalogStatus>('idle');
  const [fits, setFits] = useState<FitsIndex | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Signed out: drop the data at once.
  useEffect(() => {
    if (authed) return;
    setFits(null);
    setStatus('idle');
  }, [authed]);

  useEffect(() => {
    if (!authed || !active || fits) return;
    let alive = true;
    setStatus('loading');
    (async () => {
      try {
        const r = await fetch('/api/tech/fits', { credentials: 'same-origin' });
        if (!alive) return;
        if (r.status === 401) {
          setStatus('unauthorized');
          onUnauthorized();
          return;
        }
        if (r.status === 503) return setStatus('not_configured');
        if (r.status === 404) return setStatus('empty');
        const ct = r.headers.get('content-type') ?? '';
        if (r.status !== 200 || !ct.includes('application/json')) return setStatus('error');
        const b = (await r.json()) as { ok?: boolean; authed?: boolean; fits?: FitsIndex };
        if (!alive) return;
        if (
          b.ok === true &&
          b.authed === true &&
          Array.isArray(b.fits?.families) &&
          Array.isArray(b.fits?.breakers)
        ) {
          setFits(b.fits as FitsIndex);
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
  return { status, fits, retry };
}
