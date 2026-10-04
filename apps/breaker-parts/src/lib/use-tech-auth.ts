import { useCallback, useEffect, useState } from 'react';
import type { TechContent } from '../types';

export type TechState = 'unknown' | 'anon' | 'authed';
export type LoginResult = 'ok' | 'wrong' | 'not_configured' | 'error';
export type TechBundle = { tr?: TechContent; en?: TechContent };

const hasHint = (): boolean =>
  document.cookie.split(';').some((c) => c.trim() === 'kv_tech_hint=1');

/** Strict check: only a real 200 JSON answer with authed === true counts. */
async function fetchContent(): Promise<TechBundle | null> {
  try {
    const r = await fetch('/api/tech/content', { credentials: 'same-origin' });
    if (r.status !== 200 || !(r.headers.get('content-type') ?? '').includes('application/json')) {
      return null;
    }
    const b = (await r.json()) as { ok?: boolean; authed?: boolean; content?: TechBundle };
    return b.ok === true && b.authed === true && b.content ? b.content : null;
  } catch {
    return null;
  }
}

/** The tab is invisible unless the server confirms a valid session. The
 *  protected text is never in the JS bundle; it only arrives via the API. */
export function useTechAuth() {
  const [state, setState] = useState<TechState>('unknown');
  const [content, setContent] = useState<TechBundle | null>(null);
  useEffect(() => {
    let alive = true;
    if (!hasHint()) {
      setState('anon');
      return;
    }
    fetchContent().then((c) => {
      if (!alive) return;
      setContent(c);
      setState(c ? 'authed' : 'anon');
    });
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (password: string): Promise<LoginResult> => {
    try {
      const r = await fetch('/api/tech/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'kv' },
        body: JSON.stringify({ password }),
      });
      if (r.status === 503) return 'not_configured';
      if (r.status === 401) return 'wrong';
      if (r.status !== 200) return 'error';
      const c = await fetchContent();
      if (!c) return 'error';
      setContent(c);
      setState('authed');
      return 'ok';
    } catch {
      return 'error';
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/tech/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'kv' },
        body: '{}',
      });
    } finally {
      setContent(null);
      setState('anon');
    }
  }, []);

  return { state, content, login, logout };
}

export type TechAuth = ReturnType<typeof useTechAuth>;
