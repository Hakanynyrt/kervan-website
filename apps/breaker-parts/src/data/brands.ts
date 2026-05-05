import type { BrandSpec } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   Hidrolik kırıcı markaları — uyumlu parça tedarik ettiğimiz set.
   Logo dosyaları /public/brand-logos/<slug>.svg. MTB'nin logosu yok —
   wordmark fallback ile render edilir.
═══════════════════════════════════════════════════════════════════════ */

export const BRANDS: BrandSpec[] = [
  { slug: 'atlas-copco', name: 'Atlas Copco', logo: 'atlas-copco', country: 'Sweden' },
  { slug: 'epiroc',      name: 'Epiroc',      logo: 'epiroc',      country: 'Sweden' },
  { slug: 'furukawa',    name: 'Furukawa',    logo: 'furukawa',    country: 'Japan' },
  { slug: 'soosan',      name: 'Soosan',      logo: 'soosan',      country: 'South Korea' },
  { slug: 'hanwoo',      name: 'Hanwoo',      logo: 'hanwoo',      country: 'South Korea' },
  { slug: 'indeco',      name: 'Indeco',      logo: 'indeco',      country: 'Italy' },
  { slug: 'rammer',      name: 'Rammer',      logo: 'rammer',      country: 'Finland' },
  { slug: 'montabert',   name: 'Montabert',   logo: 'montabert',   country: 'France' },
  { slug: 'sandvik',     name: 'Sandvik',     logo: 'sandvik',     country: 'Sweden' },
  { slug: 'npk',         name: 'NPK',         logo: 'npk',         country: 'USA / Japan' },
  { slug: 'toku',        name: 'Toku',        logo: 'toku',        country: 'Japan' },
  { slug: 'kobelco',     name: 'Kobelco',     logo: 'kobelco',     country: 'Japan' },
  { slug: 'krupp',       name: 'Krupp',       logo: 'krupp',       country: 'Germany' },
  { slug: 'da',          name: 'D&A',         logo: 'da',          country: 'South Korea' },
  { slug: 'mtb',         name: 'MTB',         country: 'South Korea' },
];
