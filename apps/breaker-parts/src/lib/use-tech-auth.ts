import { useCallback, useEffect, useState } from 'react';
import type { TechContent } from '../types';
import { clearTechLocal } from './tech-recent';

/** 'expired': the session ran out mid-use; the page keeps its data and asks for the password inline. */
export type TechState = 'unknown' | 'anon' | 'authed' | 'expired';
export type LoginResult = 'ok' | 'wrong' | 'not_configured' | 'error';
export type TechBundle = { tr?: TechContent; en?: TechContent };

const hasHint = (): boolean =>
  document.cookie.split(';').some((c) => c.trim() === 'kv_tech_hint=1');

/** Strict check: only a JSON answer with authed === true counts as signed in. A broken text
 *  secret (500 with authed: true) still signs in, so the catalog and shared-tips tabs work; only
 *  the Genel tab then shows its own error. */
async function fetchContent(): Promise<{ authed: boolean; content: TechBundle | null }> {
  const no = { authed: false, content: null };
  try {
    const r = await fetch('/api/tech/content', { credentials: 'same-origin' });
    if (!(r.headers.get('content-type') ?? '').includes('application/json')) return no;
    if (r.status !== 200 && r.status !== 500) return no;
    const b = (await r.json()) as { ok?: boolean; authed?: boolean; content?: TechBundle };
    if (b.authed !== true) return no;
    return { authed: true, content: b.ok === true && b.content ? b.content : null };
  } catch {
    return no;
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
      setContent(c.content);
      setState(c.authed ? 'authed' : 'anon');
    });
    return () => {
      alive = false;
    };
  }, []);

  /** `remember`: keep this phone signed in for 30 days (opt-in). */
  const login = useCallback(async (password: string, remember = false): Promise<LoginResult> => {
    try {
      const r = await fetch('/api/tech/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'kv' },
        body: JSON.stringify({ password, remember }),
      });
      if (r.status === 503) return 'not_configured';
      if (r.status === 401) return 'wrong';
      if (r.status !== 200) return 'error';
      const c = await fetchContent();
      if (!c.authed) return 'error';
      setContent(c.content);
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
      // This phone's recent and starred lists go with the session.
      clearTechLocal();
      setContent(null);
      setState('anon');
    }
  }, []);

  /** A data request answered 401: keep the page and its data, ask for the password inline. */
  const expire = useCallback(() => setState((s) => (s === 'authed' ? 'expired' : s)), []);

  return { state, content, login, logout, expire };
}

export type TechAuth = ReturnType<typeof useTechAuth>;
