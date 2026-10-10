import { useState } from 'react';
import { ORG_EMAIL } from '@kervan/seo';
import type { FxRate } from '@kervan/tips';
import { addToCart } from '../lib/cart';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { SITE } from '../lib/page-head';
import { fmtDate, fmtTry, fmtUsd, vatOf } from '../lib/price';
import { CART_PATH } from '../lib/routes';
import type { Lang } from '../types';
import { QtyStepper, Terms } from './Bits';
import { FOCUS, whatsappHref } from './Layout';

/** "1.850 USD · 81.000 TL": one line under a priced part (group page, phones). */
export function PartPriceLine({
  cents,
  fx,
  lang,
  className = '',
}: {
  cents: number;
  fx: FxRate | null;
  lang: Lang;
  className?: string;
}) {
  const tl = fmtTry(cents, fx, lang);
  return (
    <p className={`m-0 font-sans tabular-nums ${className}`}>
      <span className="font-semibold text-ink">{fmtUsd(cents, lang)}</span>
      {tl && <span className="text-ink-mid"> · {tl}</span>}
    </p>
  );
}

/** The order message of a priced part, as the WhatsApp / e-mail links and the sticky bar send it. */
export const partOrderText = (
  t: Dict,
  lang: Lang,
  label: string,
  breaker: string,
  qty: number,
  cents: number,
  path: string,
) => t.parts.order.text(label, breaker, qty, fmtUsd(cents, lang), SITE + localePath(path, lang));

/**
 * A priced spare part's order panel (item page): the price like the tip pages (USD, TL at the
 * CBRT rate, incl. VAT), same-day delivery, quantity, "Palete yükle", and the WhatsApp / e-mail
 * order. The cart line keeps the price it was added at.
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
}: {
  /** Cart line id: the item path, plus `#b` for a burçlu head. */
  id: string;
  /** Breaker make and model ("Rammer E68"). */
  breaker: string;
  /** The part ("kafa burcu (alt burç)"). */
  label: string;
  cents: number;
  path: string;
  qty: number;
  setQty: (n: number) => void;
  fx: FxRate | null;
  lang: Lang;
  t: Dict;
}) {
  const [added, setAdded] = useState(false);
  const o = t.parts.order;
  const tl = fmtTry(cents, fx, lang);
  const gross = cents + vatOf(cents);
  const grossMoney = [fmtUsd(gross, lang), fmtTry(gross, fx, lang)].filter(Boolean).join(' / ');
  const text = partOrderText(t, lang, label, breaker, qty, cents, path);
  return (
    <div className="lg:sticky lg:top-6">
      <div className="rounded-md border border-hair-strong bg-bg p-5 font-sans text-sm">
        <p className="m-0 text-sm text-ink-mid">{t.price.label}</p>
        <p className="m-0 mt-1 text-3xl font-bold text-ink tabular-nums">{fmtUsd(cents, lang)}</p>
        {tl && <p className="m-0 mt-1 text-lg font-semibold text-ink-mid tabular-nums">{tl}</p>}
        <p className="m-0 mt-1 text-sm text-ink-soft tabular-nums">{t.price.inclVat(grossMoney)}</p>
        {tl && fx && (
          <p className="m-0 mt-1 text-xs text-ink-soft">{t.price.fxNote(fmtDate(fx.date, lang))}</p>
        )}
        <p className="m-0 mt-3 border-t border-hair pt-3 text-ink">{o.delivery}</p>
        <p className="m-0 mt-4 text-lg font-bold text-ink">{o.title}</p>
        <p className="m-0 mt-2 text-ink-mid">{o.body}</p>
        <label htmlFor="qty" className="mb-2 mt-4 block font-semibold text-ink">
          {t.family.qty}
        </label>
        <QtyStepper
          id="qty"
          value={qty}
          onChange={(n) => {
            setQty(n);
            setAdded(false);
          }}
          label={t.family.qty}
          t={t}
        />
        <div className="mt-4 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              addToCart({ id, name: breaker, label, code: null, path, cents }, qty);
              setAdded(true);
            }}
            className={`cursor-pointer rounded-sm bg-brand px-5 py-3 text-center font-medium text-on-brand hover:bg-brand-hi ${FOCUS}`}
          >
            {t.price.add}
          </button>
          {added && (
            <p className="m-0 text-center text-ink" role="status">
              {t.price.added} ·{' '}
              <a
                href={localePath(CART_PATH, lang)}
                className={`font-medium text-brand-hi underline ${FOCUS}`}
              >
                {t.price.goCart}
              </a>
            </p>
          )}
          <a
            href={whatsappHref(text)}
            className={`rounded-sm bg-whatsapp px-5 py-3 text-center font-medium text-white ${FOCUS}`}
          >
            {o.wa}
          </a>
          <a
            href={`mailto:${ORG_EMAIL}?subject=${encodeURIComponent(`${breaker} ${label}`)}&body=${encodeURIComponent(text)}`}
            className={`rounded-sm border border-ink-soft px-5 py-3 text-center text-ink hover:bg-bg-warm ${FOCUS}`}
          >
            {o.mail}
          </a>
        </div>
      </div>
      <div className="mt-6">
        <Terms t={t} />
      </div>
    </div>
  );
}
