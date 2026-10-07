import { useState } from 'react';
import { carrierTons, type PublicFamily, type PublicSku } from '@kervan/tips';
import { Container } from '@kervan/ui';
import { ORG_EMAIL } from '@kervan/seo';
import type { Dict } from '../lib/dict';
import { fmtMm, fmtNum } from '../lib/format';
import { localePath } from '../lib/locale-path';
import { LIST_PATH } from '../lib/routes';
import { tipImg } from '../lib/tip-img';
import type { Lang } from '../types';
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
  families: PublicFamily[];
  lang: Lang;
  t: Dict;
}

/**
 * Product page body: a tip-type selector that swaps the pictures (and a code selector when
 * several tip families fit). Prerendered with the first family and type; the choice works
 * after hydration.
 */
export default function TipProduct({ title, crumb, quoteName, families, lang, t }: Props) {
  const tf = t.family;
  const [fi, setFi] = useState(0);
  const f = families[Math.min(fi, families.length - 1)];
  const [type, setType] = useState(f.skus[0].tipType);
  const sku = f.skus.find((s) => s.tipType === type) ?? f.skus[0];
  const tons = carrierTons(f.attrs.diameterMm);
  const text = tf.quoteText(quoteName, t.tip[sku.tipType], sku.code);
  const mail = `mailto:${ORG_EMAIL}?subject=${encodeURIComponent(`${quoteName} – ${sku.code}`)}&body=${encodeURIComponent(text)}`;
  const chip = (on: boolean) =>
    `cursor-pointer rounded-sm border px-4 py-2 font-sans text-sm font-medium has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand has-[:focus-visible]:outline-offset-2 ${
      on ? 'border-brand bg-brand text-white' : 'border-ink-soft bg-bg text-ink hover:bg-bg-warm'
    }`;

  return (
    <Container className="py-12">
      <nav aria-label={tf.crumbLabel} className="font-sans text-sm text-ink-mid">
        <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
          <li>
            <a href={localePath('/', lang)} className={`hover:text-ink hover:underline ${FOCUS}`}>
              {tf.crumbHome}
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <a
              href={localePath(LIST_PATH, lang)}
              className={`hover:text-ink hover:underline ${FOCUS}`}
            >
              {t.nav.tips}
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {crumb}
          </li>
        </ol>
      </nav>
      <h1 className="m-0 mt-5 font-sans text-3xl font-bold text-ink md:text-4xl">{title}</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-4">
          {sku.image ? (
            <figure className="m-0 overflow-hidden rounded-md border border-hair bg-stage">
              <img
                key={sku.image}
                src={tipImg(sku.image, 'md')}
                srcSet={`${tipImg(sku.image, 'sm')} 480w, ${tipImg(sku.image, 'md')} 800w`}
                sizes="(min-width: 1024px) 800px, 100vw"
                width={800}
                height={533}
                alt={tf.renderAlt(quoteName, t.tip[sku.tipType])}
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
                  alt={tf.sideAlt(quoteName, t.tip[sku.tipType])}
                  loading="lazy"
                  decoding="async"
                  className="block h-auto w-full border-t border-hair-strong/30"
                />
              )}
            </figure>
          ) : null}
          {f.imageRear && (
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
          {(sku.image || f.imageRear) && (
            <p className="m-0 font-sans text-xs text-ink-soft">{tf.renderNote}</p>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          {families.length > 1 && (
            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-3 p-0 font-sans text-sm font-semibold text-ink">
                {tf.option}
              </legend>
              <div className="flex flex-wrap gap-2">
                {families.map((x, i) => (
                  <label key={x.code} className={chip(i === fi)}>
                    <input
                      type="radio"
                      name="family"
                      className="sr-only"
                      checked={i === fi}
                      onChange={() => {
                        setFi(i);
                        if (!x.skus.some((s) => s.tipType === type)) setType(x.skus[0].tipType);
                      }}
                    />
                    {x.code}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-3 p-0 font-sans text-sm font-semibold text-ink">{tf.type}</legend>
            <div className="flex flex-wrap gap-2">
              {f.skus.map((s) => (
                <label key={s.code} className={chip(s.tipType === sku.tipType)}>
                  <input
                    type="radio"
                    name="type"
                    className="sr-only"
                    checked={s.tipType === sku.tipType}
                    onChange={() => setType(s.tipType)}
                  />
                  {t.tip[s.tipType]}
                </label>
              ))}
            </div>
          </fieldset>

          <dl className="m-0 font-sans text-sm">
            {[
              [tf.diameter, fmtMm(f.attrs.diameterMm, lang)],
              ...(sku.tipAngleDeg === null
                ? []
                : [[tf.angle, `${fmtNum(sku.tipAngleDeg, lang)}°`]]),
              [tf.code, sku.code],
              [tf.availability, availabilityText(sku, t)],
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
            <div className="mt-4 flex flex-col gap-3">
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
      </div>
    </Container>
  );
}
