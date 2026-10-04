import { useCallback, useEffect, useState } from 'react';
import type { VegaCatalog } from '../types';

export type CatalogStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'unauthorized'
  | 'not_configured'
  | 'empty'
  | 'error';

/** Loads the private tip catalog once the catalog tab is opened. The data is kept
 *  in memory only (never localStorage/sessionStorage) and dropped on sign-out. */
export function useVegaCatalog(enabled: boolean, onUnauthorized: () => void) {
  const [status, setStatus] = useState<CatalogStatus>('idle');
  const [catalog, setCatalog] = useState<VegaCatalog | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setCatalog(null);
      setStatus('idle');
      return;
    }
    if (catalog) return;
    let alive = true;
    setStatus('loading');
    (async () => {
      try {
        const r = await fetch('/api/tech/catalog', { credentials: 'same-origin' });
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
        const b = (await r.json()) as { ok?: boolean; authed?: boolean; catalog?: VegaCatalog };
        if (!alive) return;
        if (b.ok === true && b.authed === true && Array.isArray(b.catalog?.items)) {
          setCatalog(b.catalog as VegaCatalog);
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
  }, [enabled, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { status, catalog, retry };
}
