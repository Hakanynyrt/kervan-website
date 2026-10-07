import { useEffect, useState } from 'react';
import type { FxRate } from '@kervan/tips';
import { Container } from '@kervan/ui';
import { ORG_EMAIL } from '@kervan/seo';
import { PageTitle } from '../components/Bits';
import { FOCUS, whatsappHref } from '../components/Layout';
import { CART_EVENT, MAX_QTY, readCart, writeCart, type CartItem } from '../lib/cart';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { fmtDate, fmtTry, fmtUsd, VAT_PERCENT, vatOf } from '../lib/price';
import { LEGAL, legalPath } from '../lib/legal';
import { LIST_PATH } from '../lib/routes';
import type { Lang } from '../types';

const FIELDS = ['name', 'company', 'phone', 'city', 'note'] as const;
type Field = (typeof FIELDS)[number];

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
    note: '',
  });
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
  const update = (next: CartItem[]) => {
    setItems(next);
    writeCart(next);
  };
  const setQty = (id: string, qty: number) =>
    update(
      (items ?? []).map((x) =>
        x.id === id ? { ...x, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : x,
      ),
    );

  const list = items ?? [];
  const totalCents = list.reduce((n, x) => n + (x.cents ?? 0) * x.qty, 0);
  const vatCents = vatOf(totalCents);
  const grossCents = totalCents + vatCents;
  const anyAsk = list.some((x) => x.cents === null);
  const money = (cents: number) =>
    [fmtUsd(cents, lang), fmtTry(cents, fx, lang)].filter(Boolean).join(' / ');
  const lines = list.map(
    (x) =>
      `- ${x.name}, ${t.tip[x.tipType]}${x.code ? ` (${x.code})` : ''}: ${x.qty} × ${x.cents === null ? c.ask : fmtUsd(x.cents, lang)}`,
  );
  const message = c.message(
    lines,
    [
      `${c.subtotal}: ${money(totalCents)}`,
      `${c.vat(VAT_PERCENT)}: ${money(vatCents)}`,
      `${c.total}: ${money(grossCents)}${anyAsk ? ` (${c.totalNote})` : ''}`,
    ].join('\n'),
    FIELDS.filter((k) => contact[k].trim()).map((k) => `${c[k]}: ${contact[k].trim()}`),
  );

  return (
    <Container className="py-12">
      <PageTitle>{c.title}</PageTitle>
      {items === null ? null : list.length === 0 ? (
        <div className="mt-6 font-sans">
          <p className="m-0 text-ink-mid">{c.empty}</p>
          <a
            href={localePath(LIST_PATH, lang)}
            className={`mt-4 inline-block rounded-sm bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-brand-hi ${FOCUS}`}
          >
            {c.browse}
          </a>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="min-w-0">
            <ul className="m-0 list-none divide-y divide-hair border-y border-hair p-0 font-sans text-sm">
              {list.map((x) => (
                <li key={x.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
                  <div className="min-w-0 flex-1">
                    <a
                      href={localePath(x.path, lang)}
                      className={`font-semibold text-ink hover:underline ${FOCUS}`}
                    >
                      {x.name}
                    </a>
                    <p className="m-0 text-ink-mid">{t.tip[x.tipType]}</p>
                    <p className="m-0 text-ink-mid tabular-nums">
                      {c.unit}: {x.cents === null ? c.ask : fmtUsd(x.cents, lang)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1" role="group" aria-label={c.qty}>
                    <button
                      type="button"
                      aria-label={c.less}
                      onClick={() => setQty(x.id, x.qty - 1)}
                      className={`size-9 cursor-pointer rounded-sm border border-ink-soft bg-bg text-ink ${FOCUS}`}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={MAX_QTY}
                      value={x.qty}
                      aria-label={`${c.qty}: ${x.name}`}
                      onChange={(e) => setQty(x.id, Number(e.target.value) || 1)}
                      className={`h-9 w-16 rounded-sm border border-ink-soft bg-bg text-center text-ink tabular-nums ${FOCUS}`}
                    />
                    <button
                      type="button"
                      aria-label={c.more}
                      onClick={() => setQty(x.id, x.qty + 1)}
                      className={`size-9 cursor-pointer rounded-sm border border-ink-soft bg-bg text-ink ${FOCUS}`}
                    >
                      +
                    </button>
                  </div>
                  <p className="m-0 w-28 text-right font-semibold text-ink tabular-nums">
                    {x.cents === null ? '—' : fmtUsd(x.cents * x.qty, lang)}
                  </p>
                  <button
                    type="button"
                    aria-label={c.remove(x.name)}
                    onClick={() => update(list.filter((y) => y.id !== x.id))}
                    className={`cursor-pointer text-ink-mid underline hover:text-ink ${FOCUS}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-6 font-sans">
              <dl className="m-0 text-sm tabular-nums">
                {(
                  [
                    [c.subtotal, totalCents],
                    [c.vat(VAT_PERCENT), vatCents],
                  ] as [string, number][]
                ).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-1 text-ink-mid">
                    <dt>{k}</dt>
                    <dd className="m-0 text-right">{money(v)}</dd>
                  </div>
                ))}
              </dl>
              <p className="m-0 mt-2 flex justify-between border-t border-hair pt-3 text-lg font-bold text-ink tabular-nums">
                <span>{c.total}</span>
                <span>{fmtUsd(grossCents, lang)}</span>
              </p>
              {fmtTry(grossCents, fx, lang) && (
                <p className="m-0 mt-1 text-right text-lg font-semibold text-ink tabular-nums">
                  {fmtTry(grossCents, fx, lang)}
                </p>
              )}
              {fx && (
                <p className="m-0 mt-1 text-right text-xs text-ink-soft">
                  {t.price.fxNote(fmtDate(fx.date, lang))}
                </p>
              )}
              {anyAsk && <p className="m-0 mt-2 text-sm text-ink-mid">{c.totalNote}</p>}
              <button
                type="button"
                onClick={() => update([])}
                className={`mt-4 cursor-pointer text-sm text-ink-mid underline hover:text-ink ${FOCUS}`}
              >
                {c.clear}
              </button>
            </div>
          </div>

          <aside className="rounded-md border border-hair-strong bg-bg p-5 font-sans text-sm">
            <p className="m-0 text-lg font-bold text-ink">{c.contactTitle}</p>
            {FIELDS.map((k) => (
              <div key={k} className="mt-3">
                <label htmlFor={`c-${k}`} className="block font-medium text-ink">
                  {c[k]}
                </label>
                {k === 'note' ? (
                  <textarea
                    id={`c-${k}`}
                    rows={3}
                    value={contact[k]}
                    onChange={(e) => setContact({ ...contact, [k]: e.target.value })}
                    className={`mt-1 w-full rounded-sm border border-ink-soft bg-bg px-3 py-2 text-base text-ink ${FOCUS}`}
                  />
                ) : (
                  <input
                    id={`c-${k}`}
                    type={k === 'phone' ? 'tel' : 'text'}
                    autoComplete={
                      k === 'name'
                        ? 'name'
                        : k === 'company'
                          ? 'organization'
                          : k === 'phone'
                            ? 'tel'
                            : k === 'city'
                              ? 'address-level2'
                              : 'off'
                    }
                    value={contact[k]}
                    onChange={(e) => setContact({ ...contact, [k]: e.target.value })}
                    className={`mt-1 w-full rounded-sm border border-ink-soft bg-bg px-3 py-2 text-base text-ink ${FOCUS}`}
                  />
                )}
              </div>
            ))}
            <p className="m-0 mt-5 text-xs text-ink-mid">
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
              <a
                href={whatsappHref(message)}
                className={`rounded-sm bg-whatsapp px-5 py-3 text-center font-medium text-white ${FOCUS}`}
              >
                {c.sendWa}
              </a>
              <a
                href={`mailto:${ORG_EMAIL}?subject=${encodeURIComponent(c.title)}&body=${encodeURIComponent(message)}`}
                className={`rounded-sm border border-ink-soft px-5 py-3 text-center text-ink hover:bg-bg-warm ${FOCUS}`}
              >
                {c.sendMail}
              </a>
            </div>
            <p className="m-0 mt-4 text-xs text-ink-mid">{c.info}</p>
          </aside>
        </div>
      )}
    </Container>
  );
}
