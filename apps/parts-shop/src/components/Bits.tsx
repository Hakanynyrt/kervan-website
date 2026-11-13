import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { TextInput } from '@astryxdesign/core/TextInput';
import { ORG_PHONE_E164 } from '@kervan/seo';
import { MAX_QTY } from '../lib/cart';
import type { Dict } from '../lib/dict';
import { LEGAL, legalPath } from '../lib/legal';
import { localePath } from '../lib/locale-path';
import { PLANT_PHOTOS, PLANT_WIDE } from '../lib/photos';
import { CART_PATH, type PartKey } from '../lib/routes';
import { warrantyMonths } from '../lib/warranty';
import type { Lang } from '../types';
import { FOCUS, FIELD_TEXT, OUTLINE_BUTTON, WHATSAPP_BUTTON, whatsappHref } from './Layout';
import { photoImg, photoSet } from '../lib/photo-url';

/** A filter chip (`aria-pressed` buttons, the make links): part kinds, tip search filters. Picked
 *  is ink: ember stays for actions ("Ara", "Teklif iste"). */
export const chipClass = (active: boolean): string =>
  `inline-flex min-h-11 cursor-pointer items-center rounded-sm border px-3 ${active ? 'border-ink bg-ink text-bg' : 'border-ink-soft bg-bg text-ink hover:bg-bg-warm'} ${FOCUS}`;

/** Home / … / current page. `trail` is [label, neutral path] pairs before the current page. */
export function Breadcrumb({
  trail,
  current,
  lang,
  t,
}: {
  trail: [string, string][];
  current: string;
  lang: Lang;
  t: Dict;
}) {
  const items: [string, string][] = [[t.family.crumbHome, '/'], ...trail];
  return (
    <nav aria-label={t.family.crumbLabel} className="font-sans text-sm text-ink-mid">
      <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
        {items.map(([label, path]) => (
          <li key={path}>
            {/* Inline, so the 44 px padding on phones enlarges the target without moving the line. */}
            <a
              href={localePath(path, lang)}
              className={`hover:text-ink hover:underline max-lg:py-[14px] ${FOCUS}`}
            >
              {label}
            </a>
            <span aria-hidden="true" className="ml-2">
              /
            </span>
          </li>
        ))}
        <li aria-current="page" className="text-ink">
          {current}
        </li>
      </ol>
    </nav>
  );
}

/** A radio group drawn as square chips (keyboard: Tab into the group, arrows to choose). */
export function Chips<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-3 p-0 font-sans text-sm font-semibold text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={`${chipClass(o.value === value)} font-sans text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand has-[:focus-visible]:outline-offset-2`}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={o.value === value}
              onChange={() => onChange(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Quantity: − / number / + (product, part and cart pages). The field may be cleared while
 * typing; a valid number counts at once, anything else is settled on blur or Enter (1 …
 * MAX_QTY, with a note when it was capped).
 */
export function QtyStepper({
  id,
  value,
  onChange,
  label,
  t,
}: {
  id: string;
  value: number;
  onChange: (n: number) => void;
  /** Accessible name of the field (e.g. "Adet" or "Adet: Rammer E 68"). */
  label: string;
  t: Dict;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [capped, setCapped] = useState(false);
  const set = (n: number) => {
    setCapped(n > MAX_QTY);
    onChange(Math.max(1, Math.min(MAX_QTY, n)));
  };
  const commit = () => {
    if (draft === null) return;
    const n = parseInt(draft, 10);
    if (Number.isFinite(n) && n > 0) set(n);
    setDraft(null);
  };
  const field = useRef<HTMLInputElement>(null);
  const type = (raw: string) => {
    const v = raw.replace(/\D/g, '').slice(0, 5);
    setDraft(v);
    const n = parseInt(v, 10);
    if (n >= 1 && n <= MAX_QTY) {
      setCapped(false);
      onChange(n);
    }
  };
  // A number typed before hydration: the box keeps it and it counts, as if typed after.
  useEffect(() => {
    const typed = field.current?.value ?? '';
    if (typed && typed !== String(value)) type(typed);
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const btn = `${OUTLINE_BUTTON} shrink-0 text-lg`;
  return (
    <div className="font-sans">
      <div className="flex items-center gap-1">
        <Button
          label={t.qty.less}
          icon={<span aria-hidden="true">−</span>}
          isIconOnly
          variant="secondary"
          aria-controls={id}
          isDisabled={value <= 1}
          onClick={() => {
            setDraft(null);
            set(value - 1);
          }}
          className={btn}
        />
        <TextInput
          ref={field}
          id={id}
          label={label}
          isLabelHidden
          inputMode="numeric"
          autoComplete="off"
          value={draft ?? String(value)}
          aria-describedby={capped ? `${id}-note` : undefined}
          onChange={type}
          onBlur={commit}
          onEnter={commit}
          width={64}
          controlClassName={`[&_input]:text-center [&_input]:tabular-nums ${FIELD_TEXT}`}
        />
        <Button
          label={t.qty.more}
          icon={<span aria-hidden="true">+</span>}
          isIconOnly
          variant="secondary"
          aria-controls={id}
          isDisabled={value >= MAX_QTY}
          onClick={() => {
            setDraft(null);
            set(value + 1);
          }}
          className={btn}
        />
      </div>
      {capped && (
        <p id={`${id}-note`} role="status" className="m-0 mt-1 text-xs text-ink-mid">
          {t.qty.clamped(MAX_QTY)}
        </p>
      )}
    </div>
  );
}

/** What pressing "Palete yükle" gave; `n` is the line's quantity in the cart (null: not readable). */
export type Added = { n: number | null } | null;

/** The result of "Palete yükle" and the cart link. Always in the page, so it is announced; empty
 *  it adds no space. */
export function AddedNote({ added, lang, t }: { added: Added; lang: Lang; t: Dict }) {
  return (
    <p role="status" className={`m-0 text-center text-ink ${added ? 'mt-3' : ''}`}>
      {added && (
        <>
          {added.n === null ? t.price.added : t.price.addedQty(added.n)} ·{' '}
          <a
            href={localePath(CART_PATH, lang)}
            className={`font-medium text-brand-hi underline ${FOCUS}`}
          >
            {t.price.goCart}
          </a>
        </>
      )}
    </p>
  );
}

/** "Model not listed / not sure": WhatsApp with a message to fill in (the query when given). */
export function MissingModel({
  t,
  query = '',
  filters = '',
  className = 'mt-12',
}: {
  t: Dict;
  query?: string;
  /** Short summary of the search's narrowing filters, added to the message. */
  filters?: string;
  className?: string;
}) {
  return (
    <section className={`rounded-md border border-hair bg-bg-soft p-6 font-sans ${className}`}>
      <h2 className="m-0 text-lg font-bold text-ink">{t.missing.title}</h2>
      <p className="m-0 mt-2 max-w-3xl text-sm text-ink-mid">{t.missing.body}</p>
      <Button
        href={whatsappHref(query ? t.missing.textFor(query, filters) : t.missing.text)}
        label={t.missing.button}
        size="lg"
        className={`mt-4 px-5 ${WHATSAPP_BUTTON}`}
      />
    </section>
  );
}

/**
 * Phones only: quote and call buttons fixed at the bottom of the screen. Priced pages pass `onAdd`
 * (the page's own "Palete yükle" handler, so the bar adds exactly what the order box would) and
 * its `added` result: the bar then leads with "Palete yükle", WhatsApp shortened to its name (the
 * full "WhatsApp ile sipariş ver" stays the accessible name), and shows the result above the
 * buttons. That line is visual only: the page's `AddedNote` (always in the DOM) announces it.
 */
export function StickyQuote({
  text,
  label,
  t,
  onAdd,
  added = null,
  lang = 'tr',
}: {
  text: string;
  label?: string;
  t: Dict;
  onAdd?: () => void;
  added?: Added;
  lang?: Lang;
}) {
  const waLabel = label ?? t.family.whatsapp;
  return (
    <div
      data-sticky-bar
      data-added={onAdd && added ? '' : undefined}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-hair bg-bg p-3 font-sans text-sm font-medium lg:hidden"
    >
      {onAdd && added && (
        <p className="m-0 mb-2 text-center text-ink">
          <span aria-hidden="true">
            {added.n === null ? t.price.added : t.price.addedQty(added.n)} ·{' '}
          </span>
          <a
            href={localePath(CART_PATH, lang)}
            className={`font-medium text-brand-hi underline ${FOCUS}`}
          >
            {t.price.goCart}
          </a>
        </p>
      )}
      <div className="flex gap-2">
        {onAdd && (
          <Button
            label={t.price.add}
            variant="primary"
            size="lg"
            onClick={onAdd}
            className="min-w-0 flex-1 px-3"
          />
        )}
        <Button
          href={whatsappHref(text)}
          label={waLabel}
          size="lg"
          className={
            onAdd
              ? `shrink-0 px-3 min-[400px]:px-4 ${WHATSAPP_BUTTON}`
              : `min-w-0 flex-1 px-4 ${WHATSAPP_BUTTON}`
          }
        >
          {onAdd ? t.nav.order.whatsapp : undefined}
        </Button>
        <Button
          href={`tel:${ORG_PHONE_E164}`}
          label={t.nav.call}
          variant="secondary"
          size="lg"
          className={`shrink-0 ${onAdd ? 'px-3 min-[400px]:px-4' : 'px-5'} ${OUTLINE_BUTTON}`}
        />
      </div>
    </div>
  );
}

/** A 4:3 photo from public/photos (see lib/photos.ts). */
export function Photo({
  base,
  alt,
  lazy = true,
  single = false,
  sizes,
}: {
  base: string;
  alt: string;
  lazy?: boolean;
  /** A part render: published in one size only (`-lg`), to keep the deployment under Pages' file limit. */
  single?: boolean;
  /** How wide it is shown, when not the usual two-column layout. */
  sizes?: string;
}) {
  return (
    <img
      src={photoImg(base, single ? 'lg' : 'sm')}
      srcSet={single ? undefined : photoSet(base, ['sm', 480], ['lg', 960])}
      sizes={
        single ? undefined : (sizes ?? '(min-width: 1024px) 436px, (min-width: 640px) 50vw, 100vw')
      }
      width={480}
      height={360}
      alt={alt}
      loading={lazy ? 'lazy' : undefined}
      decoding="async"
      className={`block h-auto w-full rounded-md border border-hair ${single ? 'bg-pstage' : 'bg-bg-warm'}`}
    />
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="m-0 mt-5 font-sans text-3xl font-bold text-ink md:text-4xl">{children}</h1>;
}

/**
 * Quality, shipping, payment and warranty lines, with the warranty scope below. `compact` (part
 * item and breaker pages, thousands of them): the payment / e-invoice / reply-time line
 * (`terms.facts`), then one short line with this product's warranty period
 * and the not-original disclaimer, linking the pre-contract information page that carries the full
 * terms and the warranty scope (`legal.ts`); the full block stays on the group pages.
 */
export function Terms({
  t,
  part,
  compact,
}: {
  t: Dict;
  part?: PartKey;
  /** The page language, for the terms link: set it for the one-line form. */
  compact?: Lang;
}) {
  if (compact)
    return (
      <section aria-labelledby="terms" className="font-sans text-sm">
        <h2 id="terms" className="m-0 text-base font-bold text-ink">
          {t.terms.title}
        </h2>
        <p className="m-0 mt-2 text-ink">{t.terms.facts}</p>
        <p className="m-0 mt-1 text-ink-mid">
          {t.terms.short(warrantyMonths(part))}{' '}
          <a
            href={localePath(legalPath('on-bilgilendirme'), compact)}
            className={`underline hover:text-ink ${FOCUS}`}
          >
            {t.terms.more}
          </a>
        </p>
      </section>
    );
  const rows: [string, string][] = [
    ...t.terms.rows,
    [t.terms.warrantyLabel, t.terms.warranty(warrantyMonths(part))],
  ];
  return (
    <section aria-labelledby="terms" className="font-sans text-sm">
      <h2 id="terms" className="m-0 text-base font-bold text-ink">
        {t.terms.title}
      </h2>
      <dl className="m-0 mt-2">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 border-t border-hair py-2.5"
          >
            <dt className="text-ink-mid">{k}</dt>
            <dd className="m-0 text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="m-0 mt-2 text-xs text-ink-mid">{t.terms.note}</p>
    </section>
  );
}

/** Line under product pictures: tip renders are illustrations, part renders come from our drawings. */
export function ImgNote({
  t,
  kind = 'tip',
  className = '',
}: {
  t: Dict;
  kind?: 'tip' | 'render' | 'photo' | 'kit';
  className?: string;
}) {
  return (
    <p className={`m-0 font-sans text-xs text-ink-mid ${className}`}>
      {kind === 'render'
        ? t.renderNote
        : kind === 'kit'
          ? t.parts.kit.renderNote
          : kind === 'photo'
            ? t.photoNote
            : t.imgNote}
    </p>
  );
}

/** The OEM-dimensions line under a product title ("OEM ölçülerinde üretilir, birebir uyumludur"). */
/** Repair kits are put together for the breaker, not made by us: their own line (`kit`). */
/**
 * "Muadil OEM no.": the original manufacturer's numbers of the part ours is compatible with
 * (owner's decision; cross-reference only, never our mpn/sku). `note` adds what they are for.
 */
export function OemNumbers({
  numbers,
  t,
  note = false,
  className = '',
}: {
  numbers: readonly string[];
  t: Dict;
  note?: boolean;
  className?: string;
}) {
  if (!numbers.length) return null;
  const o = t.parts.oemRef;
  return (
    <div className={`font-sans text-sm ${className}`}>
      <dl className="m-0 flex flex-wrap gap-x-1.5">
        <dt className="font-medium text-ink-mid">{o.label}:</dt>
        <dd className="m-0 text-ink tabular-nums">{numbers.join(', ')}</dd>
      </dl>
      {note && <p className="m-0 mt-1 max-w-3xl text-ink-mid">{o.note}</p>}
    </div>
  );
}

export function OemLine({ t, kit = false }: { t: Dict; kit?: boolean }) {
  return (
    <p className="m-0 mt-2 font-sans text-base font-semibold text-ink">
      {kit ? t.parts.kit.oem : t.oem}
    </p>
  );
}

/** The three ordering steps (`cart.steps`) and the pre-contract information link: the cart's
 *  ordering guide and the home's "Nasıl sipariş verilir?". `className` sets the list's grid. */
export function OrderSteps({
  lang,
  t,
  note = true,
  className = '',
}: {
  lang: Lang;
  t: Dict;
  /** "Ayrıntılar: Ön bilgilendirme formu" under the steps (the home has it with its phones). */
  note?: boolean;
  className?: string;
}) {
  const c = t.cart;
  return (
    <>
      <ol className={`m-0 grid list-none gap-4 p-0 font-sans ${className}`}>
        {c.steps.items.map((s, i) => (
          <li key={s.h} className="rounded-sm border border-hair bg-bg p-5">
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-sm bg-bg-warm text-sm font-bold text-ink"
            >
              {i + 1}
            </span>
            <p className="m-0 mt-3 font-semibold text-ink">{s.h}</p>
            <p className="m-0 mt-1 text-sm text-ink-mid">{s.p}</p>
          </li>
        ))}
      </ol>
      {note && (
        <p className="m-0 mt-4 font-sans text-xs text-ink-soft">
          {c.steps.note}{' '}
          <a
            href={localePath(legalPath('on-bilgilendirme'), lang)}
            className={`underline hover:text-ink ${FOCUS}`}
          >
            {LEGAL[lang]['on-bilgilendirme'].title}
          </a>
        </p>
      )}
    </>
  );
}

/** PLANT_PHOTOS index of the heat-treatment hall, which opens the home's "Tesisimiz". */
const HALL = 1;

/**
 * "Tesisimiz": our four plant photos (4:5) with captions (`/yedek-parca`). `hall` is the home's
 * layout: the heat-treatment hall large beside the title, the sentence and the other three (on
 * phones under the sentence).
 */
export function PlantPhotos({
  t,
  hall = false,
  className = '',
}: {
  t: Dict;
  hall?: boolean;
  className?: string;
}) {
  const pl = t.parts.plant;
  if (hall) {
    const h = PLANT_PHOTOS[HALL];
    return (
      <section
        aria-labelledby="plant"
        className={`grid grid-cols-[minmax(0,1fr)] gap-x-10 font-sans lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start ${className}`}
      >
        <figure className="order-3 m-0 mt-4 lg:order-none lg:mt-0">
          <img
            src={photoImg(h, 'lg')}
            srcSet={photoSet(h, ['sm', 480], ['lg', 960])}
            sizes="(min-width: 1024px) 50vw, 100vw"
            width={960}
            height={1200}
            alt={pl.items[HALL].alt}
            loading="lazy"
            decoding="async"
            className="block aspect-[3/2] h-auto w-full rounded-sm bg-bg-warm object-cover object-[50%_58%] lg:aspect-[2/1]"
          />
          <figcaption className="mt-2 text-[13px] text-ink-mid">
            {pl.items[HALL].caption}
          </figcaption>
        </figure>
        <div className="contents lg:block">
          <h2 id="plant" className="order-1 m-0 text-[22px] font-bold text-ink md:text-[26px]">
            {pl.title}
          </h2>
          <p className="order-2 m-0 mt-2 max-w-[34em] text-[16.5px] leading-snug text-ink lg:mt-2.5 lg:text-[19px]">
            {pl.lead}
          </p>
          <ul className="order-4 m-0 mt-4 grid list-none grid-cols-3 gap-2 p-0 lg:mt-[22px] lg:gap-3.5">
            {PLANT_PHOTOS.map((p, i) =>
              i === HALL ? null : (
                <li key={p}>
                  <figure className="m-0">
                    <img
                      src={photoImg(p, 'sm')}
                      width={480}
                      height={600}
                      alt={pl.items[i].alt}
                      loading="lazy"
                      decoding="async"
                      className="block aspect-[4/5] h-auto w-full rounded-sm bg-bg-warm object-cover lg:aspect-[5/4]"
                    />
                    <figcaption className="mt-2 text-xs leading-snug text-ink-mid lg:text-[13px]">
                      {pl.items[i].caption}
                    </figcaption>
                  </figure>
                </li>
              ),
            )}
          </ul>
          <p className="order-5 m-0 mt-3 text-xs text-ink-soft">{pl.note}</p>
        </div>
      </section>
    );
  }
  return (
    <section aria-labelledby="plant" className={className}>
      <h2 id="plant" className="m-0 font-sans text-2xl font-bold text-ink">
        {pl.title}
      </h2>
      <p className="m-0 mt-2 max-w-3xl font-sans text-ink-mid">{pl.lead}</p>
      <ul className="m-0 mt-6 grid list-none grid-cols-2 gap-4 p-0 lg:grid-cols-4">
        {PLANT_PHOTOS.map((p, i) => (
          <li key={p}>
            <figure className="m-0">
              <img
                src={photoImg(p, 'sm')}
                srcSet={photoSet(p, ['sm', 480], ['lg', 960])}
                sizes="(min-width: 1024px) 316px, 50vw"
                width={480}
                height={600}
                alt={pl.items[i].alt}
                loading="lazy"
                decoding="async"
                className="block aspect-[4/5] h-auto w-full rounded-sm border border-hair bg-bg-warm object-cover"
              />
              <figcaption className="mt-2 font-sans text-sm text-ink-mid">
                {pl.items[i].caption}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <ul className="m-0 mt-4 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {PLANT_WIDE.map((p, i) => (
          <li key={p}>
            <figure className="m-0">
              <img
                src={photoImg(p, 'sm')}
                srcSet={photoSet(p, ['sm', 640], ['lg', 1280])}
                sizes="(min-width: 1024px) 426px, (min-width: 640px) 50vw, 100vw"
                width={640}
                height={480}
                alt={pl.wide[i].alt}
                loading="lazy"
                decoding="async"
                className="block h-auto w-full rounded-sm border border-hair bg-bg-warm"
              />
              <figcaption className="mt-2 font-sans text-sm text-ink-mid">
                {pl.wide[i].caption}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <p className="m-0 mt-4 font-sans text-xs text-ink-soft">{pl.note}</p>
    </section>
  );
}

/** A short "nasıl seçilir" guide at the foot of a listing page: plain paragraphs under an h2
 *  (no list, no cards), general facts only (2026-10-27). */
export function Guide({
  id,
  title,
  body,
  intro,
}: {
  id: string;
  title: string;
  body: readonly string[];
  intro?: string;
}) {
  return (
    <section aria-labelledby={id} className="mt-12 max-w-3xl border-t border-hair pt-8 font-sans">
      {intro && <p className="m-0 mb-6 text-base text-ink-mid">{intro}</p>}
      <h2 id={id} className="m-0 text-xl font-bold text-ink">
        {title}
      </h2>
      {body.map((x) => (
        <p key={x} className="m-0 mt-3 text-base text-ink-mid">
          {x}
        </p>
      ))}
    </section>
  );
}
