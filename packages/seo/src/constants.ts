/* ═══════════════════════════════════════════════════════════════════════
   Single source of truth for organization / contact metadata.
   Used by JSON-LD schema builders and meta helpers across both sites.
═══════════════════════════════════════════════════════════════════════ */

export const KERVAN_HEAT_URL = 'https://kervanheat.com';
export const KERVAN_BREAKER_URL = 'https://kervanbreaker.com';
export const KERVAN_SHOP_URL = 'https://kiriciparca.com';

/** Short legal name used by kervanheat.com (unchanged). */
export const ORG_LEGAL_NAME = 'Kervan Isıl İşlem San. Tic. Ltd. Şti.';
/** Registered company name (tax register; owner, Oct 2026). Used on kervanbreaker.com and
 *  kiriciparca.com: footers, KVKK / legal pages and their Organization JSON-LD. */
export const ORG_REGISTERED_NAME = 'Kervan Isıl İşlem ve Makine San. Tic. Ltd. Şti.';
export const ORG_TRADING_NAME = 'Kervan Makina';

export const ORG_PHONE = '+90 531 669 37 34';
export const ORG_PHONE_E164 = '+905316693734';
/** kervanheat.com contact address (unchanged). */
export const ORG_EMAIL = 'info@kervanheat.com';
/** Public contact address of kervanbreaker.com and kiriciparca.com (owner, Oct 2026): a Cloudflare
 *  Email Routing address forwarding to the owner's inbox. Matches the social profiles. */
export const ORG_PUBLIC_EMAIL = 'info@kiriciparca.com';

export const ORG_LOCALITY = 'Kartepe';
export const ORG_REGION = 'Kocaeli';
export const ORG_COUNTRY = 'TR';
export const ORG_STREET = 'Uzunçiftlik Mah. Sadun Atığ Cad. No:112/A';

export const ORG_INSTAGRAM = 'https://www.instagram.com/kervanmakina/';
export const ORG_FACEBOOK = 'https://www.facebook.com/KRVbreaker';
export const ORG_YOUTUBE = 'https://www.youtube.com/@kervanbreaker';
export const ORG_LINKEDIN = 'https://www.linkedin.com/company/kervan-isil-islem';
export const ORG_X = 'https://x.com/KervanHB';
export const ORG_TELEGRAM = 'https://t.me/kervanbreaker';

export type OrgSocialKey = 'facebook' | 'instagram' | 'youtube' | 'linkedin' | 'x' | 'telegram';

/** The brand's social profiles, in display order (footer icons + JSON-LD `sameAs`). */
export const ORG_SOCIALS: readonly { key: OrgSocialKey; url: string }[] = [
  { key: 'facebook', url: ORG_FACEBOOK },
  { key: 'instagram', url: ORG_INSTAGRAM },
  { key: 'youtube', url: ORG_YOUTUBE },
  { key: 'linkedin', url: ORG_LINKEDIN },
  { key: 'x', url: ORG_X },
  { key: 'telegram', url: ORG_TELEGRAM },
];

/** All three sites' canonical base URLs plus the social profiles — used as `sameAs` by the
 *  shared `organization()` builder (kervanbreaker.com, kiriciparca.com). kervanheat.com builds
 *  its own Organization in `apps/heat-treatment/src/lib/seo.ts`. */
export const ORG_SAME_AS = [
  KERVAN_HEAT_URL,
  KERVAN_BREAKER_URL,
  KERVAN_SHOP_URL,
  ORG_FACEBOOK,
  ORG_INSTAGRAM,
  ORG_YOUTUBE,
  ORG_LINKEDIN,
  ORG_X,
  ORG_TELEGRAM,
] as const;
