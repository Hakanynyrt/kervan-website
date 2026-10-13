import { useEffect, useLayoutEffect } from 'react';

// useLayoutEffect warns during the prerender; it only has work to do in the browser.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Day theme, home page: the opening and the hero stay the 3D tip's dark stage (the tip is
 * studio-lit for a dark room). The scene canvas is fixed behind the whole page, so the band
 * cannot be a section background (it would cover the tip); it is painted on the page
 * background instead (`html.kv-band` in globals.css), down to the hero's bottom edge. Measured
 * before paint and again whenever the page height changes (the opening unmounting, fonts).
 * The fixed canvas is also clipped to the band's visible part (`--kv-band-vis`, day theme
 * only), so the tip never hangs over the light section below while it fades out.
 * On the night theme the band has the page colour and nothing is clipped.
 */
export function useStageBand() {
  useIsoLayoutEffect(() => {
    const root = document.documentElement;
    const hero = document.querySelector<HTMLElement>('.kv-hero');
    if (!hero) return;
    let bandH = 0;
    const setVisible = () =>
      root.style.setProperty('--kv-band-vis', `${Math.max(0, bandH - window.scrollY)}px`);
    const set = () => {
      bandH = Math.round(hero.getBoundingClientRect().bottom + window.scrollY);
      root.style.setProperty('--kv-band-h', `${bandH}px`);
      setVisible();
    };
    set();
    root.classList.add('kv-band');
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(set);
    ro?.observe(document.body);
    window.addEventListener('scroll', setVisible, { passive: true });
    return () => {
      ro?.disconnect();
      window.removeEventListener('scroll', setVisible);
      root.classList.remove('kv-band');
      root.style.removeProperty('--kv-band-h');
      root.style.removeProperty('--kv-band-vis');
    };
  }, []);
}
