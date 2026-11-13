import { useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import type { FxRate } from '@kervan/tips';
import { ORDER_CONVERSION } from '../lib/ads';
import { addToCart, cartQty } from '../lib/cart';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { fmtDate, fmtGrossTry, fmtTry, fmtUsd, leadsGross, unitText } from '../lib/price';
import type { PartKey } from '../lib/routes';
import type { Lang } from '../types';
import { AddedNote, OrderFacts, QtyStepper, StickyQuote, Terms, type Added } from './Bits';
import { OUTLINE_BUTTON, WHATSAPP_BUTTON, whatsappHref } from './Layout';
import { ORDER_EMAIL, SITE } from '../lib/site';

/**
 * One line under a priced part (group page, phones): "97.200 TL (vergiler dahil) · 1.850 USD +
 * vergiler" on Turkish pages with a rate (owner, G2), "1,850 USD · 81,000 TL" in English.
 */
export function PartPriceLine({
  cents,
  fx,
  lang,
  note,
  plus = '',
  incl = '',
  className = '',
}: {
  cents: number;
  fx: FxRate | null;
  lang: Lang;
  /** After the USD price: "+ vergiler" on Turkish pages (`t.price.plus`). */
  plus?: string;
  /** After the tax-inclusive TL price: "(vergiler dahil)" (`t.price.incl`). */
  incl?: string;
  /** What the price covers, when it is more than the part (tie rods: nuts and washers). */
  note?: string | null;
  className?: string;
}) {
  const gross = leadsGross(lang, fx) ? fmtGrossTry(cents, fx, lang) : null;
  if (gross)
    return (
      <p className={`m-0 font-sans tabular-nums ${className}`}>
        <span className="font-semibold text-ink">{gross}</span>
        {incl && <span className="text-sm text-ink-soft"> {incl}</span>}
        <span className="text-sm text-ink-mid"> · {fmtUsd(cents, lang)}</span>
        {plus && <span className="text-sm text-ink-soft"> {plus}</span>}
        {note && <span className="block text-sm font-normal text-ink-mid">{note}</span>}
      </p>
    );
  const tl = fmtTry(cents, fx, lang);
  return (
    <p className={`m-0 font-sans tabular-nums ${className}`}>
      <span className="font-semibold text-ink">{fmtUsd(cents, lang)}</span>
      {tl && <span className="text-ink-mid"> · {tl}</span>}
      {plus && <span className="text-sm text-ink-soft"> {plus}</span>}
      {note && <span className="block text-sm font-normal text-ink-mid">{note}</span>}
    </p>
  );
}

/** Tie rods are sold as a set with their nuts and washers (owner): say so next to a bare rod's price (the set's name already says it). */
export const priceNote = (kind: string | undefined, t: Dict): string | null =>
  kind === 'tieRod' ? t.parts.order.withNuts : null;

/** The order message of a priced part, as the WhatsApp / e-mail links and the sticky bar send it. */
export const partOrderText = (
  t: Dict,
  lang: Lang,
  label: string,
  breaker: string,
  qty: number,
  cents: number,
  path: string,
  fx: FxRate | null,
) =>
  t.parts.order.text(
    label,
    breaker,
    qty,
    unitText(cents, fx, lang, t),
    SITE + localePath(path, lang),
  );

/**
 * A priced spare part's order panel (item page): the price like the tip pages (Turkish: the
 * tax-inclusive TL price, then the net USD price "+ vergiler"; English: the net export price and
 * its TL amount, with the export note), same-day delivery, quantity, "Palete yükle", and the WhatsApp / e-mail
 * order, and on phones the sticky bottom bar with the same "Palete yükle". The cart line keeps
 * the price it was added at.
 */
export function PartOrder({
  id,
  breaker,
  label,
  cents,
  path,
  qty,
  setQty,
  fx,
  lang,
  t,
  note,
  part,
}: {
  /** Cart line id: the item path, plus `#b` for a burçlu head. */
  id: string;
  /** Breaker make and model ("Rammer E68"). */
  breaker: string;
  /** The part ("kafa burcu"). */
  label: string;
  cents: number;
  path: string;
  qty: number;
  setQty: (n: number) => void;
  fx: FxRate | null;
  lang: Lang;
  t: Dict;
  /** What the price covers, when it is more than the part (see priceNote). */
  note?: string | null;
  /** The part group, for its warranty period in the sale terms. */
  part?: PartKey;
}) {
  const [added, setAdded] = useState<Added>(null);
  const o = t.parts.order;
  const gross = leadsGross(lang, fx) ? fmtGrossTry(cents, fx, lang) : null;
  const tl = gross ?? fmtTry(cents, fx, lang);
  const text = partOrderText(t, lang, label, breaker, qty, cents, path, fx);
  // "Palete yükle": the order box's button and the phones' sticky bar both call this.
  const add = () => {
    addToCart({ id, name: breaker, label, code: null, path, cents }, qty);
    setAdded({ n: cartQty(id) });
  };
  return (
    <div className="lg:sticky lg:top-6">
      <div className="rounded-md border border-hair-strong bg-bg p-5 font-sans text-sm">
        <p className="m-0 text-sm text-ink-mid">{t.price.label}</p>
        {gross ? (
          <>
            {/* data-offer: check-dist compares it with the JSON-LD offer. */}
            <p data-offer="" className="m-0 mt-1 text-3xl font-bold text-ink tabular-nums">
              {gross}
              <span className="text-base font-semibold text-ink-mid"> {t.price.incl}</span>
            </p>
            <p className="m-0 mt-1 text-base text-ink-mid tabular-nums">
              {fmtUsd(cents, lang)}
              {t.price.plus && <span className="text-ink-soft"> {t.price.plus}</span>}
            </p>
          </>
        ) : (
          <>
            <p data-offer="" className="m-0 mt-1 text-3xl font-bold text-ink tabular-nums">
              {fmtUsd(cents, lang)}
              {t.price.plus && (
                <span className="text-base font-semibold text-ink-mid"> {t.price.plus}</span>
              )}
            </p>
            {tl && <p className="m-0 mt-1 text-lg font-semibold text-ink-mid tabular-nums">{tl}</p>}
          </>
        )}
        {note && <p className="m-0 mt-1 text-sm text-ink">{note}</p>}
        {t.price.note && <p className="m-0 mt-1 text-sm text-ink-soft">{t.price.note}</p>}
        {tl && fx && (
          <p className="m-0 mt-1 text-xs text-ink-soft">{t.price.fxNote(fmtDate(fx.date, lang))}</p>
        )}
        {/* Desktop: the order button right under the price, above the fold (2026-10-27); phones
            keep it in the order box below, next to the sticky bar. */}
        <Button
          href={whatsappHref(text)}
          label={o.wa}
          size="lg"
          {...ORDER_CONVERSION}
          className={`mt-4 hidden w-full px-5 lg:flex ${WHATSAPP_BUTTON}`}
        />
        <p className="m-0 mt-3 border-t border-hair pt-3 text-ink">{o.delivery}</p>
        <h2 className="m-0 mt-4 text-lg font-bold text-ink">{o.title}</h2>
        {/* The stepper's field has this name itself (a hidden label). */}
        <p aria-hidden="true" className="m-0 mb-2 mt-4 font-semibold text-ink">
          {t.family.qty}
        </p>
        <QtyStepper
          id="qty"
          value={qty}
          onChange={(n) => {
            setQty(n);
            setAdded(null);
          }}
          label={t.family.qty}
          t={t}
        />
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <Button
              label={t.price.add}
              variant="primary"
              size="lg"
              width="100%"
              onClick={add}
              className="px-5"
            />
            <AddedNote added={added} lang={lang} t={t} />
          </div>
          <Button
            href={whatsappHref(text)}
            label={o.wa}
            size="lg"
            {...ORDER_CONVERSION}
            className={`px-5 lg:hidden ${WHATSAPP_BUTTON}`}
          />
          <Button
            href={`mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(`${breaker} ${label}`)}&body=${encodeURIComponent(text)}`}
            label={o.mail}
            variant="secondary"
            size="lg"
            {...ORDER_CONVERSION}
            className={`px-5 ${OUTLINE_BUTTON}`}
          />
        </div>
        <OrderFacts t={t} className="mt-3" />
      </div>
      <div className="mt-6">
        <Terms t={t} part={part} compact={lang} />
      </div>
      {/* Phones: the bottom bar with "Palete yükle" (this box's `add`), WhatsApp and Telefon. */}
      <StickyQuote text={text} label={o.wa} t={t} onAdd={add} added={added} lang={lang} />
    </div>
  );
}
