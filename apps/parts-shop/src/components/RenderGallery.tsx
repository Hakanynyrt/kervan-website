import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { Dict } from '../lib/dict';
import type { RenderView } from '../lib/photos';
import { FOCUS } from './Layout';

type View = RenderView | 'hero';
export type GalleryItem = { base: string; view: View };

/**
 * A part's pictures as one gallery (owner approved): one fixed 4:3 frame (the 16:9 showcase picture
 * sits in it with dark bands, the 4:3 views fill it, so the frame never changes height), a
 * thumbnail column on the left from `sm` up (a row under the frame on phones) with numbered short
 * names, and a bar under the frame with the view's name, "n / N" and ‹ › buttons; phones can also
 * swipe the frame. No new image files: the frame and the view thumbnails use the `-lg` files,
 * the showcase thumbnail its `-xs`. The prerender shows the first picture.
 * `overlay` sits on the frame (e.g. "3B incele"); `below` goes right under the bar.
 */
export default function RenderGallery({
  items,
  caption,
  lazy = false,
  t,
  overlay,
  below,
}: {
  items: GalleryItem[];
  caption: string;
  lazy?: boolean;
  t: Dict;
  overlay?: (k: number) => ReactNode;
  below?: ReactNode;
}) {
  const g = t.parts.gallery;
  const [k, setK] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const swipe = useRef<number | null>(null);
  const n = items.length;
  const cur = items[Math.min(k, n - 1)];
  if (!cur) return null;
  const name = (v: View) => (v === 'hero' ? g.hero : t.parts.renderView[v]);
  const go = (i: number, focus = false) => {
    const j = (i + n) % n;
    setK(j);
    if (focus) tabs.current[j]?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    const to =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? k + 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? k - 1
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? n - 1
              : null;
    if (to === null) return;
    e.preventDefault();
    go(to, true);
  };
  const isHero = cur.view === 'hero';
  const arrow = `flex size-11 cursor-pointer items-center justify-center rounded-sm border border-hair-strong bg-bg text-lg text-ink hover:bg-bg-warm ${FOCUS}`;

  return (
    <div
      className={
        n > 1 ? 'grid gap-x-4 gap-y-3 sm:grid-cols-[76px_minmax(0,1fr)] sm:gap-y-0' : undefined
      }
    >
      <div className="min-w-0 sm:col-start-2">
        <div
          className="relative aspect-[4/3] touch-pan-y overflow-hidden rounded-t-md border border-hair bg-stage-deep"
          onPointerDown={(e) => {
            if (e.pointerType !== 'mouse') swipe.current = e.clientX;
          }}
          onPointerUp={(e) => {
            const x0 = swipe.current;
            swipe.current = null;
            if (x0 === null || n < 2) return;
            const dx = e.clientX - x0;
            if (Math.abs(dx) > 40) go(k + (dx < 0 ? 1 : -1));
          }}
          onPointerCancel={() => (swipe.current = null)}
        >
          <img
            key={cur.base}
            src={`${cur.base}-lg.webp`}
            width={isHero ? 1600 : 960}
            height={isHero ? 900 : 720}
            alt={`${caption}, ${name(cur.view)}`}
            loading={lazy ? 'lazy' : undefined}
            decoding="async"
            draggable={false}
            className="absolute inset-0 h-full w-full object-contain select-none"
          />
          {overlay?.(k)}
        </div>
        <div className="flex items-center justify-between gap-3 rounded-b-md border border-t-0 border-hair bg-bg-soft py-1.5 pr-1.5 pl-3 font-sans text-sm">
          <p className="m-0 min-w-0 text-ink" aria-live="polite">
            {n > 1 && <span className="font-semibold tabular-nums">{k + 1} · </span>}
            {name(cur.view)}
          </p>
          {n > 1 && (
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="mr-1 text-ink-mid tabular-nums">{g.count(k + 1, n)}</span>
              <button type="button" onClick={() => go(k - 1)} aria-label={g.prev} className={arrow}>
                <span aria-hidden="true">‹</span>
              </button>
              <button type="button" onClick={() => go(k + 1)} aria-label={g.next} className={arrow}>
                <span aria-hidden="true">›</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {n > 1 && (
        <div
          role="tablist"
          aria-label={g.label}
          onKeyDown={onKey}
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:col-start-1 sm:row-start-1 sm:mx-0 sm:flex-col sm:self-start sm:overflow-visible sm:px-0 sm:pb-0"
        >
          {items.map((it, i) => (
            <button
              key={it.base}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              aria-selected={i === k}
              aria-label={`${i + 1}. ${name(it.view)}`}
              tabIndex={i === k ? 0 : -1}
              onClick={() => go(i)}
              className={`w-16 shrink-0 cursor-pointer rounded-sm p-0 text-left sm:w-full ${FOCUS}`}
            >
              <span
                className={`block overflow-hidden rounded-sm border bg-stage ${i === k ? 'border-ink shadow-[inset_0_-2px_0_var(--color-brand)]' : 'border-hair hover:border-hair-strong'}`}
              >
                <img
                  src={it.view === 'hero' ? `${it.base}-xs.webp` : `${it.base}-lg.webp`}
                  width={it.view === 'hero' ? 320 : 960}
                  height={it.view === 'hero' ? 180 : 720}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="block aspect-[4/3] h-auto w-full object-contain"
                />
              </span>
              <span
                className={`mt-1 hidden font-sans text-xs leading-tight sm:block ${i === k ? 'font-semibold text-ink' : 'text-ink-mid'}`}
              >
                {i + 1} {it.view === 'hero' ? g.heroShort : g.short[it.view]}
              </span>
            </button>
          ))}
        </div>
      )}
      {/* Under the frame on every screen; on phones after the thumbnail row. */}
      {below && <div className="min-w-0 sm:col-start-2">{below}</div>}
    </div>
  );
}
