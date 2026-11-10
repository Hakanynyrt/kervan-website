import { useEffect, useRef, useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import type { DictBlock } from '../types';
import { H2, SECTION, WRAP } from '../lib/ui';
import { HERO_PHOTO } from '../lib/home-photos';
import { ArrowLeft, ArrowRight, PlayIcon } from './icons';

interface Props {
  t: DictBlock;
}

/**
 * The workshop rail (`#atolye`): photos and video posters in a horizontal scroll-snap row
 * (4 / 3 / 1.4 cards a screen). The hero photo is left out. Pictures are fetched only once the
 * rail is within 600 px of the screen (so nothing competes with the hero photo at load), and then
 * lazily by the browser as cards scroll in. A video card plays its clip in place when tapped.
 * Server and first client render are the same (no pictures yet), so the prerender hydrates cleanly.
 */
export default function Workshop({ t }: Props) {
  const a = t.atolye;
  const items = a.items.filter((i) => i.img !== HERO_PHOTO);
  const [near, setNear] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  // Which end of the rail is reached. First render: neither, the same on the server.
  const [ends, setEnds] = useState({ start: false, end: false });
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = railRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          obs.disconnect();
        }
      },
      { rootMargin: '600px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const update = () =>
      setEnds({
        start: el.scrollLeft <= 1,
        end: el.scrollLeft >= el.scrollWidth - el.clientWidth - 1,
      });
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  /** Scrolls the rail by one card; does nothing at an end (the button keeps its focus). */
  const step = (dir: 1 | -1) => {
    if (dir < 0 ? ends.start : ends.end) return;
    const el = railRef.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.offsetWidth + 12), behavior: 'smooth' });
  };

  return (
    <section id="atolye" aria-labelledby="atolye-title" className={SECTION}>
      <div className={WRAP}>
        <div className="mb-8 min-[721px]:flex min-[721px]:items-end min-[721px]:justify-between gap-6">
          <div>
            <h2 id="atolye-title" className={H2}>
              {a.title}
            </h2>
            <p className="m-0 mt-3 text-base min-[721px]:text-[17px] text-ink-mid max-w-[520px]">
              {a.aside}
            </p>
          </div>
          <div className="max-[720px]:hidden flex gap-2">
            <Button
              label={a.prev}
              icon={<ArrowLeft size={20} />}
              isIconOnly
              className="kv-btn-box"
              aria-disabled={ends.start || undefined}
              onClick={() => step(-1)}
            />
            <Button
              label={a.next}
              icon={<ArrowRight size={20} />}
              isIconOnly
              className="kv-btn-box"
              aria-disabled={ends.end || undefined}
              onClick={() => step(1)}
            />
          </div>
        </div>
        <div ref={railRef} className="kv-rail" role="region" aria-label={a.title} tabIndex={0}>
          {items.map((it, i) => {
            const alt = it.desc ? `${it.name}: ${it.desc}` : it.name;
            const pic = near && it.img && (
              <img src={it.img} alt={alt} loading="lazy" decoding="async" />
            );
            return (
              <figure key={it.name}>
                {it.video && playing === i ? (
                  <div className="kv-rail-ph">
                    <video
                      src={it.video}
                      poster={it.img}
                      autoPlay
                      muted
                      loop
                      playsInline
                      controls
                      aria-label={alt}
                    />
                  </div>
                ) : it.video ? (
                  <button
                    type="button"
                    className="kv-rail-ph"
                    onClick={() => setPlaying(i)}
                    aria-label={`${a.video}: ${alt}`}
                  >
                    {pic}
                    <span className="kv-chip kv-rail-vid" aria-hidden="true">
                      <PlayIcon />
                      {a.video}
                    </span>
                  </button>
                ) : (
                  <div className="kv-rail-ph">{pic}</div>
                )}
                <figcaption>
                  <b>{it.name}</b>
                  {it.desc && <span>{it.desc}</span>}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
