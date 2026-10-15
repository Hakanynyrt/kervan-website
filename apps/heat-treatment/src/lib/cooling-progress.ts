/** Scroll progress (0–1) through the Cooling section, shared by `Cooling` (stage labels) and
 *  `CoolingScene` (the tip), so both move together. The span is the section height minus its
 *  sticky stage's height: the stage stays pinned until the piece has fully cooled. The stage is
 *  measured (its height is `svh`, steady while a phone's toolbar slides), not `innerHeight`,
 *  which changes with the toolbar and made the piece jump. */
export function coolingProgress(section: HTMLElement): number {
  const r = section.getBoundingClientRect();
  const stage = section.firstElementChild as HTMLElement | null;
  const span = r.height - (stage?.offsetHeight || window.innerHeight);
  return span > 0 ? Math.max(0, Math.min(1, -r.top / span)) : 0;
}
