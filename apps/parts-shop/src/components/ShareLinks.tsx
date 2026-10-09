import { useEffect, useRef, useState } from 'react';
import type { Dict } from '../lib/dict';
import { FOCUS } from './Layout';

/** Copy text without the async clipboard API (http, older browsers): a hidden textarea. */
function copyFallback(text: string): boolean {
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    el.remove();
    return ok;
  } catch {
    return false;
  }
}

const LINK = `inline-flex min-h-11 items-center font-medium text-brand-hi underline decoration-hair-strong underline-offset-4 hover:decoration-brand ${FOCUS}`;

/**
 * "Bağlantıyı paylaş" for one part's own page: the system share sheet where there is one,
 * otherwise the address goes to the clipboard with a short spoken status; plus a WhatsApp link
 * carrying the caption and the address. The markup is the same before and after hydration.
 */
export default function ShareLinks({ url, title, t }: { url: string; title: string; t: Dict }) {
  const s = t.parts.item;
  const [status, setStatus] = useState('');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const say = (msg: string, ms: number) => {
    setStatus(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus(''), ms);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      say(s.copied, 4000);
    } catch {
      if (copyFallback(url)) say(s.copied, 4000);
      else say(s.copyFailed(url), 15000);
    }
  };
  const share = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        // Closed by the visitor: nothing to do. Any other failure: copy instead.
        if (e instanceof DOMException && e.name === 'AbortError') return;
      }
    }
    await copy();
  };
  return (
    <span className="flex flex-wrap items-center gap-x-5 gap-y-1">
      <button
        type="button"
        onClick={() => void share()}
        className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border border-ink-soft bg-bg px-4 font-medium text-ink hover:bg-bg-warm ${FOCUS}`}
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none">
          <path
            d="M6.5 9.5l3-3M7 4.5l1.3-1.3a2.5 2.5 0 013.5 3.5L10.5 8M9 11.5l-1.3 1.3a2.5 2.5 0 01-3.5-3.5L5.5 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {s.share}
      </button>
      <a href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} className={LINK}>
        {s.whatsappSend}
      </a>
      <span role="status" aria-live="polite" className="break-all text-sm text-ink-mid">
        {status}
      </span>
    </span>
  );
}
