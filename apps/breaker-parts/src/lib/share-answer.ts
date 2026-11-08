import type { FitsBreaker, FitsFamily } from '@kervan/tips';

/**
 * The customer-ready answer the owner sends from the shared-tips tab ("Müşteriye gönder"):
 * the breaker, the Kervan tip code, its working diameter and key count, the tip types and the
 * shop link. Only these public fields are read, so VEGA numbers, drawing numbers, repair-kit
 * sizes and the private same-parts list can never reach a customer through it.
 */
export interface AnswerText {
  /** "{name} için uç: {code} · Ø{d} mm{keys}" */
  line: string;
  keys: string;
  types: string;
  order: string;
}

export function buildAnswer(
  b: Pick<FitsBreaker, 'name'>,
  fam: Pick<FitsFamily, 'code' | 'd' | 'keyCount' | 'types'>,
  typeLabel: (t: FitsFamily['types'][number]) => string,
  shopLink: string,
  tx: AnswerText,
): string {
  const fill = (s: string, v: Record<string, string | number>) =>
    Object.entries(v).reduce((acc, [k, x]) => acc.replace(`{${k}}`, String(x)), s);
  const d = Math.round(fam.d * 10) / 10;
  const keys = fam.keyCount !== null ? fill(tx.keys, { n: fam.keyCount }) : '';
  const lines = [fill(tx.line, { name: b.name, code: fam.code, d, keys })];
  if (fam.types.length) lines.push(fill(tx.types, { types: fam.types.map(typeLabel).join(', ') }));
  lines.push(fill(tx.order, { url: shopLink }));
  return lines.join('\n');
}

/** wa.me link with the text prefilled (no number: WhatsApp asks whom to send it to). */
export const whatsappLink = (text: string): string =>
  `https://wa.me/?text=${encodeURIComponent(text)}`;
