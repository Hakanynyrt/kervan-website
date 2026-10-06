import { breaker } from './breakers.ts';
import { skuCode } from './codes.ts';
import type { PublicCatalog, PublicFamily, TipType } from './types.ts';

/** Invented rows for local builds and forks. XX codes and the DEMO brand make them unmistakable. */
export function demoCatalog(): PublicCatalog {
  const spec: [number, 1 | 2 | null, TipType[]][] = [
    [100, 1, ['chisel', 'moil']],
    [135, 1, ['chisel', 'moil', 'blunt']],
    [150, 2, ['chisel', 'pyramid']],
    [75, null, ['moil']],
    [165, null, ['chisel', 'moil']],
    [190, null, ['blunt']],
  ];
  const families: PublicFamily[] = spec.map(([d, tier, types], i) => {
    const code = `XX${d}-${String(i + 1).padStart(2, '0')}`;
    return {
      code,
      attrs: {
        diameterMm: d,
        collarDiameterMm: d + 15,
        key: {
          count: 2,
          thicknessMm: Math.round(d / 4),
          slotLengthMm: d,
          backEndToSlotMm: 80,
          slotEnd: 'rounded',
        },
        rear: { step: false, diameterMm: null },
      },
      popularTier: tier,
      fits: [breaker('DEMO', `D-${d}`), breaker('DEMO', `D-${d}S`)],
      skus: types.map((t) => ({
        code: skuCode(code, t),
        tipType: t,
        lengthMm: { min: d * 8, max: d * 9 },
        weightKg: { min: Math.round(d * 0.7), max: Math.round(d * 0.8) },
        tipAngleDeg: null,
        priceUsdNetCents: null,
        availability: { kind: 'ask' },
      })),
    };
  });
  return { schema: 1, demo: true, families };
}
