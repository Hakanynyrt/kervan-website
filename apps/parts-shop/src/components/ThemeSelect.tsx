import { useEffect, useState } from 'react';
import type { Dict } from '../lib/dict';
import { FOCUS } from './Layout';

/** localStorage key; the inline script in index.html reads the same one before paint. */
const KEY = 'kv_theme';
type Choice = 'auto' | 'light' | 'dark';
const isChoice = (v: unknown): v is Choice => v === 'auto' || v === 'light' || v === 'dark';
const THEME_COLOR: Record<'light' | 'dark', string> = { light: '#FFFFFF', dark: '#1c1f23' };

/** Is the page dark right now, from the attributes the edge and the inline script set. */
const isDark = (): boolean => {
  const h = document.documentElement;
  const t = h.getAttribute('data-theme');
  if (t === 'dark' || t === 'light') return t === 'dark';
  if (h.hasAttribute('data-sun')) return h.getAttribute('data-sun') === 'night';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Header theme select: "by the sun" (the edge middleware's day/night mark, see
 * functions/_middleware.ts), or light / dark by hand. The choice lives only in this browser
 * and is applied on `<html data-theme>`; the prerender shows "auto", the stored choice is read
 * after hydration so the server markup matches.
 */
export function ThemeSelect({ t }: { t: Dict }) {
  const [choice, setChoice] = useState<Choice>('auto');
  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (isChoice(v)) setChoice(v);
    } catch {
      /* storage blocked: stays auto */
    }
  }, []);
  const pick = (v: Choice) => {
    setChoice(v);
    const h = document.documentElement;
    if (v === 'auto') h.removeAttribute('data-theme');
    else h.setAttribute('data-theme', v);
    try {
      if (v === 'auto') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, v);
    } catch {
      /* storage blocked: applies to this page only */
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLOR[isDark() ? 'dark' : 'light']);
  };
  return (
    <label className="hidden items-center gap-1.5 text-ink-mid md:flex">
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0">
        <circle cx="8" cy="8" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{t.nav.theme.label}</span>
      <select
        value={choice}
        onChange={(e) => pick(e.target.value as Choice)}
        className={`cursor-pointer rounded-sm border border-hair bg-bg py-1 pl-1.5 pr-1 font-sans text-sm text-ink-mid hover:text-ink ${FOCUS}`}
      >
        <option value="auto">{t.nav.theme.auto}</option>
        <option value="light">{t.nav.theme.light}</option>
        <option value="dark">{t.nav.theme.dark}</option>
      </select>
    </label>
  );
}
