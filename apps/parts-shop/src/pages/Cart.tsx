import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import type { FxRate } from '@kervan/tips';
import { Button } from '@astryxdesign/core/Button';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { OrderFacts, OrderSteps, PageTitle, QtyStepper } from '../components/Bits';
import {
  FIELD_RING,
  FIELD_TEXT,
  FOCUS,
  OUTLINE_BUTTON,
  WHATSAPP_BUTTON,
  whatsappHref,
  WRAP,
} from '../components/Layout';
import { PaletQuote, PRINT_ICON, type QuoteLine } from '../components/PaletQuote';
import { PartGroups } from '../components/PartGroups';
import { SHARE_ICON, useShare } from '../components/ShareLinks';
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
} from '../lib/price';
import { LEGAL, legalPath } from '../lib/legal';
import {
  decodePalet,
  lineHref,
  mergeShared,
  paletLink,
  paletParam,
  refreshLines,
  withoutPalet,
  type PaletLines,
  type SharedLine,
} from '../lib/palet-share';
import { sharedPaletLines } from '../lib/palet-lines';
import { lineTryCents, localDay, paletSum } from '../lib/palet-quote';
import { CART_PATH, PARTS_PATH } from '../lib/routes';
import type { Lang } from '../types';
import { ORDER_EMAIL, SITE } from '../lib/site';

const FIELDS = [
  'name',
  'company',
  'phone',
  'city',
  'country',
  'email',
  'taxOffice',
  'taxId',
  'note',
] as const;
type Field = (typeof FIELDS)[number];
/** Optional invoice details (2026-11-13), grouped under their own legend; like every field they
 *  go into the order message only when filled. */
const INVOICE: readonly Field[] = ['email', 'taxOffice', 'taxId'];
/** The country is asked on the English cart only (international orders), and required there. */
const fieldsFor = (lang: Lang): readonly Field[] =>
  lang === 'en' ? FIELDS : FIELDS.filter((k) => k !== 'country');
const AUTOCOMPLETE: Record<Field, string> = {
  name: 'name',
  company: 'organization',
  phone: 'tel',
  city: 'address-level2',
  country: 'country-name',
  email: 'email',
  taxOffice: 'off',
  taxId: 'off',
  note: 'off',
};

/**
 * The cart: lines from this browser's storage, quantities, totals in USD and TRY, and the order
 * request sent as a WhatsApp or e-mail message, or printed as a quote (`PaletQuote`). Prerendered
 * as an empty shell; the lines appear after hydration, and their names and prices are then read
 * again from their product pages.
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
    email: '',
    taxOffice: '',
    taxId: '',
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
  // A shared palet link (`?p=`, lib/palet-share.ts): asked once, then merged with the names and
  // prices its product pages show now (one fetch per page, lib/palet-lines.ts); the query leaves the address bar once it is handled, so a
  // reload does not add the lines again.
  const [incoming, setIncoming] = useState<
    | { state: 'loading' }
    | {
        state: 'ask';
        shared: SharedLine[];
        lines: PaletLines;
        preview: CartItem[];
        dropped: number;
      }
    | { state: 'failed' }
    | null
  >(null);
  const [sharedNote, setSharedNote] = useState('');
  const askHeading = useRef<HTMLHeadingElement>(null);
  const dropQuery = () => {
    try {
      const { pathname, search, hash } = window.location;
      window.history.replaceState(window.history.state, '', pathname + withoutPalet(search) + hash);
    } catch {
      /* no history API: the query stays */
    }
  };
  useEffect(() => {
    const raw = paletParam(window.location.search);
    if (raw === null) return;
    const { lines: shared, bad } = decodePalet(raw);
    if (!shared.length) {
      setSharedNote(c.share.none);
      dropQuery();
      return;
    }
    let live = true;
    setIncoming({ state: 'loading' });
    sharedPaletLines(
      shared.map((x) => x.id),
      lang,
    )
      .then((lines) => {
        if (!live) return;
        const { added, dropped } = mergeShared([], shared, lines);
        if (!added.length) {
          setIncoming(null);
          setSharedNote(c.share.none);
          dropQuery();
        } else setIncoming({ state: 'ask', shared, lines, preview: added, dropped: dropped + bad });
      })
      .catch(() => live && setIncoming({ state: 'failed' }));
    return () => {
      live = false;
    };
    // Once, on load: the link is read from the address bar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (incoming?.state === 'ask') askHeading.current?.focus();
  }, [incoming?.state]);
  const acceptShared = () => {
    if (incoming?.state !== 'ask') return;
    const { items: next, added } = mergeShared(readCart(), incoming.shared, incoming.lines);
    setUndo(null);
    update(next);
    setIncoming(null);
    setSharedNote(
      [c.share.added(added.length), incoming.dropped ? c.share.dropped(incoming.dropped) : '']
        .filter(Boolean)
        .join(' '),
    );
    dropQuery();
  };
  const declineShared = () => {
    setIncoming(null);
    dropQuery();
  };
  // The last removal (one line or the whole cart), undoable until the next change.
  const [undo, setUndo] = useState<{ items: CartItem[]; msg: string } | null>(null);
  const update = (next: CartItem[]) => {
    setItems(next);
    writeCart(next);
  };
  // The stored lines carry the name and price of the day they were added: on load they are read
  // again from their product pages, as a shared link's are, and written back, so the totals, the
  // order message and the printed quote show what the site shows now (review, 2026-11-13: a
  // dated quote must not carry an old price). A line whose page cannot be read stays as stored.
  useEffect(() => {
    const ids = readCart().map((x) => x.id);
    if (!ids.length) return;
    let live = true;
    sharedPaletLines(ids, lang)
      .then((lines) => {
        if (!live) return;
        const { items: next, changed } = refreshLines(readCart(), lines);
        if (!changed) return;
        setUndo((u) => u && { ...u, items: refreshLines(u.items, lines).items });
        update(next);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
    // Once, on load: lines added later come with their page's price.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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

  // The printed quote's date (PaletQuote): today in this browser, read again when a print starts
  // (the button or the browser's own Print), so a palet left open overnight is dated the day it
  // is printed.
  const [printDay, setPrintDay] = useState('');
  useEffect(() => {
    const read = () => setPrintDay(localDay(new Date()));
    read();
    // Before the print's snapshot is taken, not after it.
    const stamp = () => flushSync(read);
    window.addEventListener('beforeprint', stamp);
    return () => window.removeEventListener('beforeprint', stamp);
  }, []);

  const list = items ?? [];
  // Tips name their type through the dict; spare parts carry the label they were added with.
  const lineLabel = (x: CartItem) => (x.tipType ? t.tip[x.tipType] : (x.label ?? ''));
  // One sum for the totals, the order message and the printed quote (lib/palet-quote.ts). Taxes
  // are added on Turkish pages only; English pages show the export price. "Fiyat sorulacak"
  // lines (unpriced parts) have no price and are left out of the subtotal, taxes and total.
  const { totalCents, vatCents, grossCents, anyAsk, anyPriced, totalTry } = paletSum(
    list,
    lang,
    fx,
  );
  // Turkish with a rate (owner, G2): each line is its unit's tax-inclusive TL price (the product
  // pages' figure) × quantity, and the total is the sum of those lines, so the cart never
  // differs from the pages. The subtotal and tax rows stay in net USD.
  const gross = leadsGross(lang, fx);
  const money = (cents: number) =>
    gross
      ? fmtUsd(cents, lang)
      : [fmtUsd(cents, lang), fmtTry(cents, fx, lang)].filter(Boolean).join(' / ');
  const lineTotal = (x: CartItem) => {
    if (x.cents === null) return null;
    const l = lineTryCents(x, lang, fx);
    return l !== null ? fmtTryCents(l, lang) : fmtUsd(x.cents * x.qty, lang);
  };
  // A priced line's unit price as its row leads with it, and that price's label.
  const unitLabel = gross ? c.unitGross : c.unit;
  const unitShown = (cents: number) =>
    gross ? fmtTryCents(grossTryCents(cents, fx) ?? 0, lang) : fmtUsd(cents, lang);
  // The totals as the page shows them above the send buttons; the order message and the printed
  // quote take the same rows.
  const sumRows: [string, string][] = vatCents
    ? [
        [c.subtotal, money(totalCents)],
        [c.vat(VAT_PERCENT), money(vatCents)],
      ]
    : [];
  const totalShown = !anyPriced
    ? c.ask
    : totalTry !== null
      ? fmtTryCents(totalTry, lang)
      : fmtUsd(grossCents, lang);
  // Under it: the gross USD of a TL total, or the TL amount of a USD one.
  const totalAlt = !anyPriced
    ? null
    : totalTry !== null
      ? fmtUsd(grossCents, lang)
      : fmtTry(grossCents, fx, lang);
  const priceNotes = [
    fx && anyPriced ? t.price.fxNote(fmtDate(fx.date, lang)) : '',
    t.price.note,
  ].filter(Boolean);
  const lines = list.map((x) =>
    c.line(
      `${x.name}, ${lineLabel(x)}${x.code ? ` (${x.code})` : ''}`,
      x.qty,
      x.cents === null ? null : unitText(x.cents, fx, lang, t),
      lineTotal(x),
      SITE + localePath(x.path, lang),
    ),
  );
  const totalText =
    totalTry !== null
      ? `${fmtTryCents(totalTry, lang)} / ${fmtUsd(grossCents, lang)}`
      : money(grossCents);
  const subject = list.length ? c.subject(list[0].name, list.length - 1) : c.title;
  // "Paleti paylaş" and the order messages' last line: ids and quantities only.
  const shareUrl = paletLink(SITE, localePath(CART_PATH, lang), list);
  const { status: shareStatus, share } = useShare(c.share);
  // The filled contact fields, "Firma: …".
  const filled = (keys: readonly Field[]) =>
    keys.filter((k) => contact[k].trim()).map((k) => `${c[k]}: ${contact[k].trim()}`);
  const body = c.message(
    lines,
    anyPriced
      ? [
          ...sumRows.map(([k, v]) => `${k}: ${v}`),
          `${c.total}: ${totalText}`,
          ...(anyAsk ? [c.totalNote] : []),
        ].join('\n')
      : `${c.total}: ${c.ask}`,
    filled(fields),
  );
  const message = list.length ? `${body}\n\n${c.share.reopen(shareUrl)}` : body;
  // "Teklifi yazdır": the lines as their rows show them.
  const quoteLines: QuoteLine[] = list.map((x) => ({
    id: x.id,
    name: x.name,
    label: lineLabel(x),
    qty: x.qty,
    unit: x.cents === null ? null : unitShown(x.cents),
    unitNet: x.cents !== null && gross ? `${fmtUsd(x.cents, lang)} ${t.price.plus}` : undefined,
    total: lineTotal(x),
  }));

  const field = (k: Field) => (
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
          status={k === 'country' && countryError && blocked ? { type: 'error' } : undefined}
          aria-describedby={
            k === 'country' && countryError && blocked ? 'c-country-err' : undefined
          }
          type={k === 'phone' ? 'tel' : k === 'email' ? 'email' : 'text'}
          autoComplete={AUTOCOMPLETE[k]}
          value={contact[k]}
          onChange={(v) => setContact({ ...contact, [k]: v })}
          containerClassName="[&_label]:font-medium"
          controlClassName={`px-3 ${FIELD_TEXT}`}
        />
      )}
      {k === 'country' && countryError && blocked && (
        <p id="c-country-err" role="alert" className="m-0 mt-1 text-sm font-medium text-err">
          {c.countryMissing}
        </p>
      )}
    </div>
  );

  return (
    <div className={`${WRAP} py-12`}>
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
      {/* The outcome of a shared palet link. */}
      <p role="status" className="m-0 font-sans text-sm text-ink">
        {sharedNote && <span className="mt-4 block">{sharedNote}</span>}
      </p>
      {incoming?.state === 'loading' && (
        <p className="m-0 mt-4 font-sans text-sm text-ink-mid">{c.share.loading}</p>
      )}
      {incoming?.state === 'failed' && (
        <p role="alert" className="m-0 mt-4 font-sans text-sm font-medium text-err">
          {c.share.failed}
        </p>
      )}
      {incoming?.state === 'ask' && (
        <section
          aria-labelledby="shared-h"
          className="mt-6 rounded-sm border border-hair-strong bg-bg-soft p-5 font-sans text-sm"
        >
          <h2
            id="shared-h"
            ref={askHeading}
            tabIndex={-1}
            className="m-0 text-lg font-semibold text-ink outline-none"
          >
            {c.share.ask}
          </h2>
          <ul className="m-0 mt-3 list-none divide-y divide-hair border-y border-hair p-0">
            {incoming.preview.map((x) => (
              <li key={x.id} className="flex justify-between gap-4 py-2">
                <span className="min-w-0">
                  <span className="font-semibold text-ink">{x.name}</span>{' '}
                  <span className="text-ink-mid">{lineLabel(x)}</span>
                </span>
                <span className="whitespace-nowrap text-ink tabular-nums">
                  {c.qty}: {x.qty}
                </span>
              </li>
            ))}
          </ul>
          {incoming.dropped > 0 && (
            <p className="m-0 mt-2 text-ink-mid">{c.share.dropped(incoming.dropped)}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button label={c.share.add} variant="primary" onClick={acceptShared} className="px-5" />
            <Button
              label={c.share.cancel}
              variant="secondary"
              onClick={declineShared}
              className={`px-5 ${OUTLINE_BUTTON}`}
            />
          </div>
        </section>
      )}
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
        // One shrinkable column on phones: the form's inputs no longer widen the page at 320 px.
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
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
                      href={localePath(lineHref(x), lang)}
                      className={`font-semibold text-ink hover:underline ${FOCUS}`}
                    >
                      {x.name}
                    </a>
                    <p className="m-0 text-ink-mid">{lineLabel(x)}</p>
                    {/* A "fiyat sorulacak" line says so in its amount column only. */}
                    {x.cents !== null && (
                      <>
                        <p className="m-0 text-ink-mid tabular-nums">
                          {unitLabel}: {unitShown(x.cents)}
                        </p>
                        {gross && (
                          <p className="m-0 text-xs text-ink-soft tabular-nums">
                            {fmtUsd(x.cents, lang)} {t.price.plus}
                          </p>
                        )}
                      </>
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
                  {/* sm:min-w-32: "Fiyat sorulacak" / "Price on request" fit it too, so every
                    line's stepper stands in one column. */}
                  <p className="col-start-2 row-start-1 m-0 self-start text-right font-semibold whitespace-nowrap text-ink tabular-nums sm:ml-auto sm:min-w-32 sm:self-center">
                    {lineTotal(x) ?? <span className="font-medium text-ink-mid">{c.ask}</span>}
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
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-sans">
              <Button
                label={c.share.button}
                variant="secondary"
                onClick={() => void share(shareUrl, c.share.title)}
                icon={SHARE_ICON}
                className={`px-4 ${OUTLINE_BUTTON}`}
              />
              <Button
                label={c.print.button}
                variant="secondary"
                onClick={() => window.print()}
                icon={PRINT_ICON}
                className={`px-4 ${OUTLINE_BUTTON}`}
              />
              <Button
                label={c.clear}
                variant="ghost"
                onClick={() => remove([], c.cleared)}
                className="px-2 text-sm text-ink-mid underline hover:text-ink"
              />
            </div>
            <p className="m-0 mt-2 font-sans text-xs text-ink-mid">{c.share.hint}</p>
            <p
              role="status"
              aria-live="polite"
              className="m-0 mt-1 break-all font-sans text-sm text-ink-mid"
            >
              {shareStatus}
            </p>
          </div>

          <aside className="rounded-md border border-hair-strong bg-bg p-5 font-sans text-sm">
            <h2 className="m-0 text-lg font-bold text-ink">{c.contactTitle}</h2>
            {fields.filter((k) => k !== 'note' && !INVOICE.includes(k)).map(field)}
            <fieldset className="m-0 mt-5 border-0 p-0">
              <legend className="p-0 font-semibold text-ink">{c.invoiceTitle}</legend>
              {INVOICE.map(field)}
            </fieldset>
            {field('note')}
            {/* The sum sits right above the send buttons, so it is read before sending. */}
            <div className="mt-5 border-t border-hair pt-4">
              <dl className="m-0 text-sm tabular-nums">
                {sumRows.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-1 text-ink-mid">
                    <dt>{k}</dt>
                    <dd className="m-0 text-right">{v}</dd>
                  </div>
                ))}
                <div
                  className={`flex justify-between gap-4 text-lg font-bold text-ink ${sumRows.length ? 'mt-2 border-t border-hair pt-3' : ''}`}
                >
                  <dt>{c.total}</dt>
                  <dd className="m-0 whitespace-nowrap">{totalShown}</dd>
                </div>
              </dl>
              {totalAlt && (
                <p className="m-0 mt-1 text-right text-sm text-ink-mid tabular-nums">{totalAlt}</p>
              )}
              {priceNotes.map((x) => (
                <p key={x} className="m-0 mt-1 text-right text-xs text-ink-soft">
                  {x}
                </p>
              ))}
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
            <p className="m-0 mt-4 text-sm text-ink">{t.terms.facts}</p>
            {c.intlNote && <p className="m-0 mt-4 text-xs text-ink-mid">{c.intlNote}</p>}
            <p className="m-0 mt-4 text-xs text-ink-mid">{c.info}</p>
          </aside>
        </div>
      )}
      {/* Print only ("Teklifi yazdır"); the contact fields without the note. */}
      {list.length > 0 && (
        <PaletQuote
          lang={lang}
          t={t}
          day={printDay}
          buyer={filled(fields.filter((k) => k !== 'note'))}
          lines={quoteLines}
          unitLabel={unitLabel}
          sums={sumRows}
          total={totalShown}
          totalAlt={totalAlt}
          notes={priceNotes}
          anyAsk={anyAsk}
          shareUrl={shareUrl}
        />
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
        {/* No send buttons yet (empty palet, and the prerendered page): the payment line here. */}
        {list.length === 0 && <OrderFacts t={t} className="mt-3" />}
      </section>
    </div>
  );
}
