import { useState } from 'react';
import {
  carrierTons,
  TIP_TYPES,
  type FxRate,
  type PublicExtra,
  type PublicFamily,
  type PublicSku,
  type TipType,
} from '@kervan/tips';
import { Container } from '@kervan/ui';
import { ORG_EMAIL } from '@kervan/seo';
import type { Dict } from '../lib/dict';
import { fmtMm, fmtNum } from '../lib/format';
import { STOCK_TIP_PHOTOS } from '../lib/photos';
import { addToCart } from '../lib/cart';
import { fmtDate, fmtTry, fmtUsd } from '../lib/price';
import { CART_PATH, LIST_PATH } from '../lib/routes';
import { localePath } from '../lib/locale-path';
import { tipImg } from '../lib/tip-img';
import type { Lang } from '../types';
import {
  Breadcrumb,
  Chips,
  MissingModel,
  PageTitle,
  Photo,
  QTY,
  StickyQuote,
  type Qty,
} from './Bits';
import { FOCUS, whatsappHref } from './Layout';

function availabilityText(s: PublicSku, t: Dict): string {
  const a = s.availability;
  return a.kind === 'stock'
    ? t.family.inStock(a.qty)
    : a.kind === 'lead'
      ? t.family.lead(a.days)
      : t.family.ask;
}

interface Props {
  /** Page heading (the breaker model, or the diameter on a family page). */
  title: string;
  /** Breadcrumb's last item. */
  crumb: string;
  /** What the quote message names: the breaker model or the tip code. */
  quoteName: string;
  /** Extra breadcrumb steps between "Breaker tips" and this page (e.g. the make). */
  trail?: [string, string][];
  families: PublicFamily[];
  /** A product sold by model without catalogue geometry (then `families` is empty). */
  extra?: PublicExtra;
  /** Neutral path of this page (cart line link and id). */
  path: string;
  fx: FxRate | null;
  lang: Lang;
  t: Dict;
}

/** One choice of the type selector: a catalogue SKU, or a type of an extra product. */
interface Option {
  tipType: TipType;
  sku: PublicSku | null;
  family: PublicFamily | null;
  code: string | null;
  cents: number | null;
}

/**
 * Product page body. One tip-type selector for every type the breaker takes; a type comes
 * from the first tip family that has it (the Kervan code only goes into the quote message).
 * Prerendered with the first type; the choice works after hydration. On phones the selector
 * and the quote come before the pictures, and a quote bar stays at the bottom.
 */
export default function TipProduct({
  title,
  crumb,
  quoteName,
  trail = [],
  families,
  extra,
  path,
  fx,
  lang,
  t,
}: Props) {
  const tf = t.family;
  const opts = new Map<TipType, Option>();
  for (const f of families)
    for (const s of f.skus)
      if (!opts.has(s.tipType))
        opts.set(s.tipType, {
          tipType: s.tipType,
          sku: s,
          family: f,
          code: s.code,
          cents: s.priceUsdNetCents,
        });
  for (const x of extra?.tipTypes ?? [])
    if (!opts.has(x))
      opts.set(x, {
        tipType: x,
        sku: null,
        family: null,
        code: null,
        cents: extra!.priceUsdNetCents,
      });
  const types = TIP_TYPES.filter((x) => opts.has(x));
  const [type, setType] = useState<TipType>(types[0]);
  const [qty, setQty] = useState<Qty>('1');
  const [added, setAdded] = useState(false);
  const opt = opts.get(type) ?? opts.get(types[0])!;
  const sku = opt.sku;
  const f = opt.family;
  const diameter = f ? f.attrs.diameterMm : (extra?.diameterMm ?? null);
  const tons = diameter === null ? null : carrierTons(diameter);
  const text = tf.quoteText(quoteName, t.tip[opt.tipType], opt.code ?? '', qty);
  const tl = opt.cents === null ? null : fmtTry(opt.cents, fx, lang);
  const add = () => {
    addToCart(
      {
        id: `${path}|${opt.tipType}`,
        name: quoteName,
        tipType: opt.tipType,
        code: opt.code,
        path,
        cents: opt.cents,
      },
      qty === '5+' ? 5 : Number(qty),
    );
    setAdded(true);
  };
  const mail = `mailto:${ORG_EMAIL}?subject=${encodeURIComponent(quoteName)}&body=${encodeURIComponent(text)}`;

  return (
    <Container className="pb-28 pt-8 lg:pb-12 lg:pt-12">
      <Breadcrumb trail={[[t.nav.tips, LIST_PATH], ...trail]} current={crumb} lang={lang} t={t} />
      <PageTitle>{title}</PageTitle>

      <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
        <aside className="flex flex-col gap-6 lg:order-2">
          <Chips
            legend={tf.type}
            name="type"
            options={types.map((x) => ({ value: x, label: t.tip[x] }))}
            value={opt.tipType}
            onChange={(v) => {
              setType(v);
              setAdded(false);
            }}
          />
          <div className="font-sans">
            <p className="m-0 text-sm text-ink-mid">{t.price.label}</p>
            {opt.cents === null ? (
              <p className="m-0 mt-1 text-lg font-semibold text-ink">{tf.ask}</p>
            ) : (
              <>
                <p className="m-0 mt-1 text-3xl font-bold text-ink tabular-nums">
                  {fmtUsd(opt.cents, lang)}
                </p>
                {tl && fx && (
                  <>
                    <p className="m-0 mt-1 text-lg font-semibold text-ink-mid tabular-nums">{tl}</p>
                    <p className="m-0 mt-1 text-xs text-ink-soft">
                      {t.price.fxNote(fmtDate(fx.date, lang))}
                    </p>
                  </>
                )}
              </>
            )}
          </div>
          <dl className="m-0 font-sans text-sm">
            {[
              ...(diameter === null ? [] : [[tf.diameter, fmtMm(diameter, lang)]]),
              ...(sku?.tipAngleDeg == null
                ? []
                : [[tf.angle, `${fmtNum(sku.tipAngleDeg, lang)}°`]]),
              [
                tf.availability,
                sku && sku.availability.kind !== 'ask'
                  ? availabilityText(sku, t)
                  : opt.cents === null
                    ? tf.ask
                    : tf.askLead,
              ],
              ...(tons ? [[tf.carrier, tf.carrierValue(tons.min, tons.max)]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-t border-hair py-3">
                <dt className="text-ink-mid">{k}</dt>
                <dd className="m-0 text-right text-ink tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          {tons && <p className="m-0 -mt-3 font-sans text-xs text-ink-soft">{tf.carrierNote}</p>}

          <div className="rounded-md border border-hair-strong bg-bg p-5 font-sans text-sm">
            <p className="m-0 font-sans text-lg font-bold text-ink">{tf.quoteTitle}</p>
            <p className="m-0 mt-2 text-ink-mid">{tf.quoteBody}</p>
            <div className="mt-4">
              <Chips
                legend={tf.qty}
                name="qty"
                options={QTY.map((x) => ({ value: x, label: x }))}
                value={qty}
                onChange={setQty}
              />
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={add}
                className={`cursor-pointer rounded-sm bg-brand px-5 py-3 text-center font-medium text-white hover:bg-brand-hi ${FOCUS}`}
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
                {tf.whatsapp}
              </a>
              <a
                href={mail}
                className={`rounded-sm border border-ink-soft px-5 py-3 text-center text-ink hover:bg-bg-warm ${FOCUS}`}
              >
                {tf.email}
              </a>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-4 lg:order-1">
          {sku?.image && (
            <figure className="m-0 overflow-hidden rounded-md border border-hair bg-stage">
              <img
                key={sku.image}
                src={tipImg(sku.image, 'md')}
                srcSet={`${tipImg(sku.image, 'sm')} 480w, ${tipImg(sku.image, 'md')} 800w`}
                sizes="(min-width: 1024px) 800px, 100vw"
                width={800}
                height={533}
                alt={tf.renderAlt(quoteName, t.tip[opt.tipType])}
                decoding="async"
                className="block h-auto w-full"
              />
              {sku.imageSide && (
                <img
                  key={sku.imageSide}
                  src={tipImg(sku.imageSide, 'md')}
                  srcSet={`${tipImg(sku.imageSide, 'sm')} 600w, ${tipImg(sku.imageSide, 'md')} 800w`}
                  sizes="(min-width: 1024px) 800px, 100vw"
                  width={800}
                  height={267}
                  alt={tf.sideAlt(quoteName, t.tip[opt.tipType])}
                  loading="lazy"
                  decoding="async"
                  className="block h-auto w-full"
                />
              )}
            </figure>
          )}
          {f?.imageRear && (
            <figure className="m-0 max-w-sm overflow-hidden rounded-md border border-hair bg-stage">
              <img
                src={tipImg(f.imageRear, 'sm')}
                width={480}
                height={320}
                alt={tf.rearAlt(quoteName)}
                loading="lazy"
                decoding="async"
                className="block h-auto w-full"
              />
              <figcaption className="border-t border-hair bg-bg px-3 py-2 font-sans text-sm text-ink">
                {tf.viewRear}
              </figcaption>
            </figure>
          )}
        </div>
      </div>

      <section aria-labelledby="stock" className="mt-12">
        <h2 id="stock" className="m-0 font-sans text-xl font-bold text-ink">
          {tf.stockTitle}
        </h2>
        <p className="m-0 mt-1 font-sans text-sm text-ink-mid">{tf.stockNote}</p>
        <ul className="m-0 mt-4 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-3">
          {STOCK_TIP_PHOTOS.map((base, i) => (
            <li key={base}>
              <Photo base={base} alt={tf.stockAlt(i + 1)} />
            </li>
          ))}
        </ul>
      </section>

      <MissingModel t={t} />
      <StickyQuote text={text} t={t} />
    </Container>
  );
}
