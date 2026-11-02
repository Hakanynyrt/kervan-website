/**
 * Scroll ↔ scene progress for the gear section (`GearProcess` and `gear-scene` share it, so the
 * tabs, the stage bar and the 3D scene always agree).
 *
 * The scene's own scale P runs 0..1: cold steel → hot frame (P_HOLD) → quench → temper → report.
 * Before the visitor scrolls, the scene warms up to the hot frame by itself; the first HOLD_SPAN
 * of the pinned scroll keeps the part at that frame (Isıtma: held at temperature), the rest walks
 * Su verme → Temperleme → Rapor.
 */
export const P_HOLD = 0.36;
export const HOLD_SPAN = 0.12;

/** Scroll progress p (0..1 over the pinned section) → scene progress P. */
export const toP = (p: number) =>
  p <= HOLD_SPAN ? P_HOLD : P_HOLD + ((1 - P_HOLD) * (p - HOLD_SPAN)) / (1 - HOLD_SPAN);

/** Scene progress P → the scroll progress that shows it (the start of the hold for P <= P_HOLD). */
export const fromP = (P: number) =>
  P <= P_HOLD ? 0 : HOLD_SPAN + ((1 - HOLD_SPAN) * (P - P_HOLD)) / (1 - P_HOLD);
