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
import { fmtDate, fmtTry, fmtUsd, vatOf } from '../lib/price';
import { CART_PATH, LIST_PATH, PARTS_PATH, partItemPath } from '../lib/routes';
import { localePath } from '../lib/locale-path';
import { SITE } from '../lib/page-head';
import type { PartLink } from '../lib/part-links';
import { tipImg } from '../lib/tip-img';
import type { Lang } from '../types';
import {
  Breadcrumb,
  Chips,
  ImgNote,
  MissingModel,
  OemLine,
  PageTitle,
  Photo,
  QtyStepper,
  StickyQuote,
  Terms,
} from './Bits';
import { FOCUS, whatsappHref } from './Layout';

function availabilityText(s: PublicSku, t: Dict): string {
  const a = s.availability;
  return a.kind === 'stock'
    ? t.family.inStock(a.qty)
    : a.kind === 'lead'
      ? t.family.lead(a.days)
      : t.family.askLead;
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
  /** Other parts we model for this breaker (cards on the part pages). */
  parts?: PartLink[];
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
 * Prerendered with the first type; the choice works after hydration. The pictures come first
 * (on phones too, owner's direction), then the selector and the quote; a quote bar stays at
 * the bottom on phones.
 */
export default function TipProduct({
  title,
  crumb,
  quoteName,
  trail = [],
  families,
  extra,
  path,
  parts = [],
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
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const opt = opts.get(type) ?? opts.get(types[0])!;
  const sku = opt.sku;
  const f = opt.family;
  const diameter = f ? f.attrs.diameterMm : (extra?.diameterMm ?? null);
  const tons = diameter === null ? null : carrierTons(diameter);
  const url = SITE + localePath(path, lang);
  const order = opt.cents !== null;
  const text =
    opt.cents === null
      ? tf.quoteText(quoteName, t.tip[opt.tipType], opt.code ?? '', qty, url)
      : tf.orderText(
          quoteName,
          t.tip[opt.tipType],
          opt.code ?? '',
          qty,
          fmtUsd(opt.cents, lang),
          url,
        );
  const tl = opt.cents === null ? null : fmtTry(opt.cents, fx, lang);
  const gross = opt.cents === null ? null : opt.cents + vatOf(opt.cents);
  const grossMoney =
    gross === null
      ? null
      : [fmtUsd(gross, lang), fmtTry(gross, fx, lang)].filter(Boolean).join(' / ');
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
      qty,
    );
    setAdded(true);
  };
  const mail = `mailto:${ORG_EMAIL}?subject=${encodeURIComponent(quoteName)}&body=${encodeURIComponent(text)}`;

  return (
    <Container className="pb-28 pt-8 lg:pb-12 lg:pt-12">
      <Breadcrumb
        trail={[[t.parts.title, PARTS_PATH], [t.parts.tips.name, LIST_PATH], ...trail]}
        current={crumb}
        lang={lang}
        t={t}
      />
      <PageTitle>{title}</PageTitle>
      <OemLine t={t} />
      {opt.cents !== null && (
        <p className="m-0 mt-2 font-sans text-base text-ink-mid tabular-nums lg:hidden">
          <span className="font-semibold text-ink">{fmtUsd(opt.cents, lang)}</span>
          {tl && ` · ${tl}`}
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
        {(sku?.image || f?.imageRear) && (
          <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
            {sku?.image && (
              <figure className="m-0 overflow-hidden rounded-md border border-hair bg-stage">
                <img
                  key={sku.image}
                  src={tipImg(sku.image)}
                  width={800}
                  height={533}
                  alt={tf.renderAlt(quoteName, t.tip[opt.tipType])}
                  decoding="async"
                  className="block h-auto w-full"
                />
                {sku.imageSide && (
                  <img
                    key={sku.imageSide}
                    src={tipImg(sku.imageSide)}
                    width={800}
                    height={267}
                    alt={tf.sideAlt(quoteName, t.tip[opt.tipType])}
                    loading="lazy"
                    decoding="async"
                    className="hidden h-auto w-full sm:block"
                  />
                )}
              </figure>
            )}
            {/* Phones: the side and rear views as two small pictures under the main one. */}
            <div className="grid grid-cols-2 items-start gap-3 sm:block">
              {sku?.imageSide && (
                <figure className="m-0 overflow-hidden rounded-md border border-hair bg-stage sm:hidden">
                  <img
                    key={sku.imageSide}
                    src={tipImg(sku.imageSide)}
                    width={600}
                    height={200}
                    alt={tf.sideAlt(quoteName, t.tip[opt.tipType])}
                    loading="lazy"
                    decoding="async"
                    className="block h-24 w-full object-contain"
                  />
                </figure>
              )}
              {f?.imageRear && (
                <figure className="m-0 overflow-hidden rounded-md border border-hair bg-stage sm:max-w-sm">
                  <img
                    src={tipImg(f.imageRear)}
                    width={480}
                    height={320}
                    alt={tf.rearAlt(quoteName)}
                    loading="lazy"
                    decoding="async"
                    className="block h-24 w-full object-contain sm:h-auto"
                  />
                  <figcaption className="sr-only border-t border-hair bg-bg px-3 py-2 font-sans text-sm text-ink sm:not-sr-only sm:block">
                    {tf.viewRear}
                  </figcaption>
                </figure>
              )}
            </div>
            <ImgNote t={t} />
          </div>
        )}

        <aside className="flex flex-col gap-6 lg:col-start-2">
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
                {tl && (
                  <p className="m-0 mt-1 text-lg font-semibold text-ink-mid tabular-nums">{tl}</p>
                )}
                {grossMoney && (
                  <p className="m-0 mt-1 text-sm text-ink-soft tabular-nums">
                    {t.price.inclVat(grossMoney)}
                  </p>
                )}
                {tl && fx && (
                  <p className="m-0 mt-1 text-xs text-ink-soft">
                    {t.price.fxNote(fmtDate(fx.date, lang))}
                  </p>
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
                sku && sku.availability.kind !== 'ask' ? availabilityText(sku, t) : tf.askLead,
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
            <p className="m-0 font-sans text-lg font-bold text-ink">
              {order ? tf.orderTitle : tf.quoteTitle}
            </p>
            <p className="m-0 mt-2 text-ink-mid">{order ? tf.orderBody : tf.quoteBody}</p>
            <div className="mt-4">
              <label htmlFor="qty" className="mb-2 block font-semibold text-ink">
                {tf.qty}
              </label>
              <QtyStepper
                id="qty"
                value={qty}
                onChange={(n) => {
                  setQty(n);
                  setAdded(false);
                }}
                label={tf.qty}
                t={t}
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
                {order ? tf.orderWa : tf.whatsapp}
              </a>
              <a
                href={mail}
                className={`rounded-sm border border-ink-soft px-5 py-3 text-center text-ink hover:bg-bg-warm ${FOCUS}`}
              >
                {order ? tf.orderMail : tf.email}
              </a>
            </div>
          </div>
          <Terms t={t} />
        </aside>
      </div>

      {parts.length > 0 && (
        <section
          aria-labelledby="our-parts"
          className="mt-12 rounded-md border border-hair bg-bg-soft p-5 font-sans"
        >
          <h2 id="our-parts" className="m-0 text-base font-bold text-ink">
            {tf.partsTitle}
          </h2>
          <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0 text-sm">
            {parts.map((x) => (
              <li key={x.part}>
                <a
                  href={localePath(partItemPath(x.part, x.anchor), lang)}
                  className={`inline-flex min-h-11 items-center rounded-sm border border-ink-soft bg-bg px-4 font-medium text-ink hover:bg-bg-warm ${FOCUS}`}
                >
                  {t.parts.items[x.part].name} →
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

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
        <ImgNote t={t} kind="photo" className="mt-2" />
      </section>

      <MissingModel t={t} />
      <StickyQuote text={text} label={order ? tf.orderWa : undefined} t={t} />
    </Container>
  );
}
