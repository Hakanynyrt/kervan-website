import { createContext, useCallback, useContext, useRef, useState } from 'react';

export type DrawingsStatus = 'idle' | 'loading' | 'ready' | 'missing' | 'error';

export interface Drawings {
  status: DrawingsStatus;
  /** data: URI of the tip's technical drawing, null when there is none */
  src: (id: string) => string | null;
  /** starts the one-time download (no-op once started) */
  load: () => void;
  retry: () => void;
}

/** Technical drawings of the tips, fetched once when the first detail panel opens
 *  (about 2 MB, so not with the catalog). Kept in memory only and dropped with the
 *  catalog tab on sign-out. */
export function useVegaDrawings(onUnauthorized: () => void): Drawings {
  const [status, setStatus] = useState<DrawingsStatus>('idle');
  const [images, setImages] = useState<Record<string, string> | null>(null);
  const started = useRef(false);

  const run = useCallback(() => {
    started.current = true;
    setStatus('loading');
    (async () => {
      try {
        const r = await fetch('/api/tech/drawings', { credentials: 'same-origin' });
        if (r.status === 401) {
          onUnauthorized();
          return setStatus('error');
        }
        // No drawings uploaded (404) or no binding (503): just show nothing.
        if (r.status === 404 || r.status === 503) return setStatus('missing');
        const ct = r.headers.get('content-type') ?? '';
        if (r.status !== 200 || !ct.includes('application/json')) return setStatus('error');
        const b = (await r.json()) as {
          ok?: boolean;
          authed?: boolean;
          drawings?: { images?: Record<string, string> };
        };
        const im = b.drawings?.images;
        if (b.ok === true && b.authed === true && im && typeof im === 'object') {
          setImages(im);
          setStatus('ready');
        } else setStatus('error');
      } catch {
        setStatus('error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(() => {
    if (!started.current) run();
  }, [run]);
  const retry = useCallback(() => run(), [run]);
  const src = useCallback(
    (id: string) => {
      const b64 = images?.[id];
      return typeof b64 === 'string' && b64 ? `data:image/png;base64,${b64}` : null;
    },
    [images],
  );
  return { status, src, load, retry };
}

export const DrawingsContext = createContext<Drawings | null>(null);
export const useDrawings = (): Drawings | null => useContext(DrawingsContext);
