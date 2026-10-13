import { useEffect, useState } from 'react';
import { cn } from '../lib/cn.js';

/** localStorage key; each app's inline script in index.html reads the same one before paint. */
const KEY = 'kv_theme';
type Choice = 'auto' | 'light' | 'dark';
const isChoice = (v: unknown): v is Choice => v === 'auto' || v === 'light' || v === 'dark';

export interface ThemeSelectCopy {
  /** Accessible name of the select ("Tema"). */
  label: string;
  /** "By the sun" option. */
  auto: string;
  light: string;
  dark: string;
}

interface Props {
  t: ThemeSelectCopy;
  /** `<meta name="theme-color">` per theme; keep in sync with the app's index.html script. */
  themeColor: { light: string; dark: string };
  className?: string;
}

/** Is the page light right now, from the attributes the edge and the inline script set.
 *  The company sites are dark unless something says day (no mark ⇒ the night look). */
const isLight = (): boolean => {
  const h = document.documentElement;
  const t = h.getAttribute('data-theme');
  if (t === 'dark' || t === 'light') return t === 'light';
  return h.getAttribute('data-sun') === 'day';
};

/**
 * Header theme select for kervanbreaker.com and kervanheat.com: "by the sun" (the edge
 * middleware's `<html data-sun>` mark, see each app's functions/_middleware.ts), or light /
 * dark by hand. The choice lives only in this browser and is applied on `<html data-theme>`;
 * the prerender shows "auto", the stored choice is read after hydration so the server markup
 * matches. (The shop has its own, apps/parts-shop/src/components/ThemeSelect.tsx: its
 * fallback without a mark is light.)
 */
export function ThemeSelect({ t, themeColor, className }: Props) {
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
      ?.setAttribute('content', isLight() ? themeColor.light : themeColor.dark);
  };
  return (
    <label className={cn('items-center gap-1.5 text-ink-mid hover:text-ink', className)}>
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0">
        <circle cx="8" cy="8" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.25" />
        <path
          d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{t.label}</span>
      <select
        value={choice}
        onChange={(e) => pick(e.target.value as Choice)}
        className="min-h-11 cursor-pointer bg-transparent font-sans text-xs uppercase tracking-widest text-inherit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&>option]:bg-bg [&>option]:text-ink [&>option]:normal-case [&>option]:tracking-normal"
      >
        <option value="auto">{t.auto}</option>
        <option value="light">{t.light}</option>
        <option value="dark">{t.dark}</option>
      </select>
    </label>
  );
}
