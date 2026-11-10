import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { FxRate } from '@kervan/tips';
import { Button } from '@astryxdesign/core/Button';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Container } from '@kervan/ui';
import { OrderSteps, PageTitle, QtyStepper } from '../components/Bits';
import {
  FIELD_RING,
  FIELD_TEXT,
  FOCUS,
  OUTLINE_BUTTON,
  WHATSAPP_BUTTON,
  whatsappHref,
} from '../components/Layout';
import { PartGroups } from '../components/PartGroups';
import { ORDER_CONVERSION } from '../lib/ads';
import { CART_EVENT, readCart, writeCart, type CartItem } from '../lib/cart';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import {
  fmtDate,
  fmtTry,
  fmtTryCents,
  fmtUsd,
  grossTryCents,
  leadsGross,
  unitText,
  VAT_PERCENT,
  vatOf,
} from '../lib/price';
import { LEGAL, legalPath } from '../lib/legal';
import { PARTS_PATH } from '../lib/routes';
import type { Lang } from '../types';
import { ORDER_EMAIL, SITE } from '../lib/site';

const FIELDS = ['name', 'company', 'phone', 'city', 'country', 'note'] as const;
type Field = (typeof FIELDS)[number];
/** The country is asked on the English cart only (international orders), and required there. */
const fieldsFor = (lang: Lang): readonly Field[] =>
  lang === 'en' ? FIELDS : FIELDS.filter((k) => k !== 'country');
const AUTOCOMPLETE: Record<Field, string> = {
  name: 'name',
  company: 'organization',
  phone: 'tel',
  city: 'address-level2',
  country: 'country-name',
  note: 'off',
};

/**
 * The cart: lines from this browser's storage, quantities, totals in USD and TRY, and the order
 * request sent as a WhatsApp or e-mail message. Prerendered as an empty shell; the lines appear
 * after hydration.
 */
export default function Cart({ fx, lang, t }: { fx: FxRate | null; lang: Lang; t: Dict }) {
  const c = t.cart;
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [contact, setContact] = useState<Record<Field, string>>({
    name: '',
    company: '',
    phone: '',
    city: '',
    country: '',
    note: '',
  });
  const fields = fieldsFor(lang);
  const needCountry = lang === 'en';
  const countryRef = useRef<HTMLInputElement>(null);
  const [countryError, setCountryError] = useState(false);
  const blocked = needCountry && !contact.country.trim();
  // The send links stay links (WhatsApp / mailto); without the required country they only
  // point at the field (aria-disabled, so no conversion is counted either).
  const guard = (e: MouseEvent) => {
    if (!blocked) return;
    e.preventDefault();
    setCountryError(true);
    countryRef.current?.focus();
  };
  useEffect(() => {
    const load = () => setItems(readCart());
    load();
    window.addEventListener(CART_EVENT, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(CART_EVENT, load);
      window.removeEventListener('storage', load);
    };
  }, []);
  // The last removal (one line or the whole cart), undoable until the next change.
  const [undo, setUndo] = useState<{ items: CartItem[]; msg: string } | null>(null);
  const update = (next: CartItem[]) => {
    setItems(next);
    writeCart(next);
  };
  const setQty = (id: string, qty: number) => {
    setUndo(null);
    update((items ?? []).map((x) => (x.id === id ? { ...x, qty } : x)));
  };
  const remove = (next: CartItem[], msg: string) => {
    setUndo({ items: items ?? [], msg });
    setRemovals((n) => n + 1);
    update(next);
  };
  // The pressed Remove goes away with its line: the focus moves to "Geri al", and after "Geri al"
  // to the first line once the list is back.
  const undoBtn = useRef<HTMLButtonElement>(null);
  const firstLine = useRef<HTMLAnchorElement>(null);
  const undone = useRef(false);
  const [removals, setRemovals] = useState(0);
  useEffect(() => {
    if (removals) undoBtn.current?.focus();
  }, [removals]);
  useEffect(() => {
    if (!undone.current || !items?.length) return;
    undone.current = false;
    firstLine.current?.focus();
  }, [items]);

  const list = items ?? [];
  // Tips name their type through the dict; spare parts carry the label they were added with.
  const lineLabel = (x: CartItem) => (x.tipType ? t.tip[x.tipType] : (x.label ?? ''));
  const totalCents = list.reduce((n, x) => n + (x.cents ?? 0) * x.qty, 0);
  // Taxes are added on Turkish pages only; English pages show the export price.
  const vatCents = lang === 'tr' ? vatOf(totalCents) : 0;
  const grossCents = totalCents + vatCents;
  const anyAsk = list.some((x) => x.cents === null);
  // Turkish with a rate (owner, G2): each line is its unit's tax-inclusive TL price (the product
  // pages' figure) × quantity, and the total is the sum of those lines, so the cart never
  // differs from the pages. The subtotal and tax rows stay in net USD.
  const gross = leadsGross(lang, fx);
  const lineTry = (x: CartItem) =>
    x.cents === null ? null : (grossTryCents(x.cents, gross ? fx : null) ?? 0) * x.qty;
  const totalTry = gross ? list.reduce((n, x) => n + (lineTry(x) ?? 0), 0) : null;
  const money = (cents: number) =>
    gross
      ? fmtUsd(cents, lang)
      : [fmtUsd(cents, lang), fmtTry(cents, fx, lang)].filter(Boolean).join(' / ');
  const lineTotal = (x: CartItem) => {
    const l = lineTry(x);
    return x.cents === null
      ? null
      : gross && l !== null
        ? fmtTryCents(l, lang)
        : fmtUsd(x.cents * x.qty, lang);
  };
  const lines = list.map((x) =>
    c.line(
      `${x.name}, ${lineLabel(x)}${x.code ? ` (${x.code})` : ''}`,
      x.qty,
      x.cents === null ? c.ask : unitText(x.cents, fx, lang, t),
      lineTotal(x),
      SITE + localePath(x.path, lang),
    ),
  );
  const totalText =
    totalTry !== null
      ? `${fmtTryCents(totalTry, lang)} / ${fmtUsd(grossCents, lang)}`
      : money(grossCents);
  const subject = list.length ? c.subject(list[0].name, list.length - 1) : c.title;
  const message = c.message(
    lines,
    [
      ...(vatCents
        ? [`${c.subtotal}: ${money(totalCents)}`, `${c.vat(VAT_PERCENT)}: ${money(vatCents)}`]
        : []),
      `${c.total}: ${totalText}${anyAsk ? ` (${c.totalNote})` : ''}`,
    ].join('\n'),
    fields.filter((k) => contact[k].trim()).map((k) => `${c[k]}: ${contact[k].trim()}`),
  );

  return (
    <Container className="py-12">
      <PageTitle>{c.title}</PageTitle>
      {/* Always in the page, so a removal is announced; empty it adds no space. */}
      <div role="status">
        {undo && (
          <div className="mt-4 flex flex-wrap items-center gap-x-1 font-sans text-sm text-ink">
            <span>{undo.msg}</span>
            <Button
              ref={undoBtn}
              label={c.undo}
              variant="ghost"
              onClick={() => {
                undone.current = true;
                update(undo.items);
                setUndo(null);
              }}
              className="px-2 font-medium text-brand-hi underline"
            />
          </div>
        )}
      </div>
      {items === null ? null : list.length === 0 ? (
        <>
          <div className="mt-6 rounded-sm border border-hair bg-bg-soft p-6 font-sans sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div>
              <p className="m-0 text-lg font-semibold text-ink">{c.empty}</p>
              <p className="m-0 mt-1 text-sm text-ink-mid">{c.emptyBody}</p>
            </div>
            <Button
              href={localePath(PARTS_PATH, lang)}
              label={c.browse}
              variant="primary"
              size="lg"
              className="mt-4 shrink-0 px-5 sm:mt-0"
            />
          </div>
          <h2 className="m-0 mt-10 font-sans text-xl font-bold text-ink">{t.parts.title}</h2>
          <div className="mt-4">
            <PartGroups lang={lang} t={t} compact />
          </div>
        </>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="min-w-0">
            <ul className="m-0 list-none divide-y divide-hair border-y border-hair p-0 font-sans text-sm">
              {list.map((x, i) => (
                // Phones: name and total, then stepper and Remove; the DOM keeps name, stepper,
                // total, Remove, so Tab follows the screen (the total is not focusable).
                <li
                  key={x.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 py-4 sm:flex"
                >
                  <div className="col-start-1 row-start-1 min-w-0 sm:flex-1">
                    <a
                      ref={i === 0 ? firstLine : undefined}
                      href={localePath(x.path, lang)}
                      className={`font-semibold text-ink hover:underline ${FOCUS}`}
                    >
                      {x.name}
                    </a>
                    <p className="m-0 text-ink-mid">{lineLabel(x)}</p>
                    {gross && x.cents !== null ? (
                      <>
                        <p className="m-0 text-ink-mid tabular-nums">
                          {c.unitGross}: {fmtTryCents(grossTryCents(x.cents, fx) ?? 0, lang)}
                        </p>
                        <p className="m-0 text-xs text-ink-soft tabular-nums">
                          {fmtUsd(x.cents, lang)} {t.price.plus}
                        </p>
                      </>
                    ) : (
                      <p className="m-0 text-ink-mid tabular-nums">
                        {c.unit}: {x.cents === null ? c.ask : fmtUsd(x.cents, lang)}
                      </p>
                    )}
                  </div>
                  <div className="col-start-1 row-start-2">
                    <QtyStepper
                      id={`q-${i}`}
                      value={x.qty}
                      onChange={(n) => setQty(x.id, n)}
                      label={`${c.qty}: ${x.name}`}
                      t={t}
                    />
                  </div>
                  <p className="col-start-2 row-start-1 m-0 self-start text-right font-semibold whitespace-nowrap text-ink tabular-nums sm:ml-auto sm:min-w-24 sm:self-center">
                    {lineTotal(x) ?? '—'}
                  </p>
                  <Button
                    label={c.remove(x.name)}
                    variant="ghost"
                    onClick={() =>
                      remove(
                        list.filter((y) => y.id !== x.id),
                        c.removed(x.name),
                      )
                    }
                    className="col-start-2 row-start-2 justify-self-end px-2 text-ink-mid underline hover:text-ink"
                  >
                    {c.removeShort}
                  </Button>
                </li>
              ))}
            </ul>
            <div className="mt-4 font-sans">
              <Button
                label={c.clear}
                variant="ghost"
                onClick={() => remove([], c.cleared)}
                className="-ml-2 px-2 text-sm text-ink-mid underline hover:text-ink"
              />
            </div>
          </div>

          <aside className="rounded-md border border-hair-strong bg-bg p-5 font-sans text-sm">
            <h2 className="m-0 text-lg font-bold text-ink">{c.contactTitle}</h2>
            {fields.map((k) => (
              <div key={k} className="mt-3">
                {k === 'note' ? (
                  <TextArea
                    id={`c-${k}`}
                    label={c[k]}
                    rows={3}
                    value={contact[k]}
                    onChange={(v) => setContact({ ...contact, [k]: v })}
                    containerClassName="[&_label]:font-medium [&_textarea]:text-base"
                    controlClassName={FIELD_RING}
                  />
                ) : (
                  <TextInput
                    id={`c-${k}`}
                    ref={k === 'country' ? countryRef : undefined}
                    label={k === 'country' ? `${c[k]} ${c.required}` : c[k]}
                    size="lg"
                    status={
                      k === 'country' && countryError && blocked ? { type: 'error' } : undefined
                    }
                    aria-describedby={
                      k === 'country' && countryError && blocked ? 'c-country-err' : undefined
                    }
                    type={k === 'phone' ? 'tel' : 'text'}
                    autoComplete={AUTOCOMPLETE[k]}
                    value={contact[k]}
                    onChange={(v) => setContact({ ...contact, [k]: v })}
                    containerClassName="[&_label]:font-medium"
                    controlClassName={`px-3 ${FIELD_TEXT}`}
                  />
                )}
                {k === 'country' && countryError && blocked && (
                  <p
                    id="c-country-err"
                    role="alert"
                    className="m-0 mt-1 text-sm font-medium text-err"
                  >
                    {c.countryMissing}
                  </p>
                )}
              </div>
            ))}
            {/* The sum sits right above the send buttons, so it is read before sending. */}
            <div className="mt-5 border-t border-hair pt-4">
              <dl className="m-0 text-sm tabular-nums">
                {(vatCents
                  ? ([
                      [c.subtotal, totalCents],
                      [c.vat(VAT_PERCENT), vatCents],
                    ] as [string, number][])
                  : []
                ).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-1 text-ink-mid">
                    <dt>{k}</dt>
                    <dd className="m-0 text-right">{money(v)}</dd>
                  </div>
                ))}
                <div
                  className={`flex justify-between gap-4 text-lg font-bold text-ink ${vatCents ? 'mt-2 border-t border-hair pt-3' : ''}`}
                >
                  <dt>{c.total}</dt>
                  <dd className="m-0 whitespace-nowrap">
                    {totalTry !== null ? fmtTryCents(totalTry, lang) : fmtUsd(grossCents, lang)}
                  </dd>
                </div>
              </dl>
              {totalTry !== null ? (
                <p className="m-0 mt-1 text-right text-sm text-ink-mid tabular-nums">
                  {fmtUsd(grossCents, lang)}
                </p>
              ) : (
                fmtTry(grossCents, fx, lang) && (
                  <p className="m-0 mt-1 text-right text-sm text-ink-mid tabular-nums">
                    {fmtTry(grossCents, fx, lang)}
                  </p>
                )
              )}
              {fx && (
                <p className="m-0 mt-1 text-right text-xs text-ink-soft">
                  {t.price.fxNote(fmtDate(fx.date, lang))}
                </p>
              )}
              {t.price.note && (
                <p className="m-0 mt-1 text-right text-xs text-ink-soft">{t.price.note}</p>
              )}
              {anyAsk && <p className="m-0 mt-2 text-sm text-ink-mid">{c.totalNote}</p>}
            </div>
            <p className="m-0 mt-4 text-xs text-ink-mid">
              {t.legal.agree}{' '}
              <a
                href={localePath(legalPath('on-bilgilendirme'), lang)}
                className={`text-brand-hi underline ${FOCUS}`}
              >
                {LEGAL[lang]['on-bilgilendirme'].title}
              </a>{' '}
              {t.legal.and}{' '}
              <a
                href={localePath(legalPath('mesafeli-satis'), lang)}
                className={`text-brand-hi underline ${FOCUS}`}
              >
                {LEGAL[lang]['mesafeli-satis'].title}
              </a>
              .
            </p>
            <div className="mt-3 flex flex-col gap-3">
              <Button
                href={whatsappHref(message)}
                label={c.sendWa}
                size="lg"
                {...ORDER_CONVERSION}
                aria-disabled={blocked || undefined}
                onClick={guard}
                className={`px-5 ${WHATSAPP_BUTTON}`}
              />
              <Button
                href={`mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`}
                label={c.sendMail}
                variant="secondary"
                size="lg"
                {...ORDER_CONVERSION}
                aria-disabled={blocked || undefined}
                onClick={guard}
                className={`px-5 ${OUTLINE_BUTTON}`}
              />
            </div>
            {c.intlNote && <p className="m-0 mt-4 text-xs text-ink-mid">{c.intlNote}</p>}
            <p className="m-0 mt-4 text-xs text-ink-mid">{c.info}</p>
          </aside>
        </div>
      )}
      <section
        id="siparis-adimlari"
        aria-labelledby="steps-h"
        className="mt-14 scroll-mt-6 border-t border-hair pt-10 font-sans"
      >
        <h2 id="steps-h" className="m-0 text-xl font-bold text-ink">
          {c.steps.title}
        </h2>
        <OrderSteps lang={lang} t={t} className="mt-6 sm:grid-cols-3" />
      </section>
    </Container>
  );
}
