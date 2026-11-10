import type { BrandSpec } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   Hidrolik kırıcı markaları — uyumlu parça tedarik ettiğimiz set.
   Ülke adları dict.ts'te (`brands.countries`, slug ile).
═══════════════════════════════════════════════════════════════════════ */

export const BRANDS: BrandSpec[] = [
  { slug: 'atlas-copco', name: 'Atlas Copco' },
  { slug: 'epiroc', name: 'Epiroc' },
  { slug: 'furukawa', name: 'Furukawa' },
  { slug: 'soosan', name: 'Soosan' },
  { slug: 'hanwoo', name: 'Hanwoo' },
  { slug: 'indeco', name: 'Indeco' },
  { slug: 'rammer', name: 'Rammer' },
  { slug: 'montabert', name: 'Montabert' },
  { slug: 'sandvik', name: 'Sandvik' },
  { slug: 'npk', name: 'NPK' },
  { slug: 'toku', name: 'Toku' },
  { slug: 'kobelco', name: 'Kobelco' },
  { slug: 'krupp', name: 'Krupp' },
  { slug: 'da', name: 'D&A' },
  { slug: 'mtb', name: 'MTB' },
];
