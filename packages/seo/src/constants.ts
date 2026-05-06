/* ═══════════════════════════════════════════════════════════════════════
   Single source of truth for organization / contact metadata.
   Used by JSON-LD schema builders and meta helpers across both sites.
═══════════════════════════════════════════════════════════════════════ */

export const KERVAN_HEAT_URL = 'https://kervanheat.com';
export const KERVAN_BREAKER_URL = 'https://kervanbreaker.com';

export const ORG_LEGAL_NAME = 'Kervan Isıl İşlem San. Tic. Ltd. Şti.';
export const ORG_TRADING_NAME = 'Kervan Makina';

export const ORG_PHONE = '+90 531 669 37 34';
export const ORG_PHONE_E164 = '+905316693734';
export const ORG_EMAIL = 'ahmet@kervanheat.com';

export const ORG_LOCALITY = 'Kartepe';
export const ORG_REGION = 'Kocaeli';
export const ORG_COUNTRY = 'TR';
export const ORG_STREET = 'Uzunçiftlik Mah. Sadun Atığ Cad. No:112/A';

export const ORG_INSTAGRAM = 'https://www.instagram.com/kervanmakina/';

/** Both domains' canonical base URLs in one array — used as `sameAs` so
 *  each Organization JSON-LD instance references its sibling site. */
export const ORG_SAME_AS = [
  KERVAN_HEAT_URL,
  KERVAN_BREAKER_URL,
  ORG_INSTAGRAM,
] as const;
