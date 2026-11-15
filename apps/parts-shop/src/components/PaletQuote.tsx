import type { Dict } from '../lib/dict';
import { sellerBlock } from '../lib/legal';
import { fmtDate } from '../lib/price';
import type { Lang } from '../types';

/** One line of the printed quote, as its palet row shows it. */
export interface QuoteLine {
  id: string;
  name: string;
  /** Tip type or part name. */
  label: string;
  qty: number;
  /** The unit price the row leads with; null = "fiyat sorulacak". */
  unit: string | null;
  /** Under it, where the unit is the tax-inclusive TL price: the net USD price. */
  unitNet?: string;
  /** The line's amount; null = "fiyat sorulacak". */
  total: string | null;
}

/** The quote's title names its lines table. */
const TITLE_ID = 'kv-quote-title';

/** The print button's printer icon. */
export const PRINT_ICON = (
  <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none">
    <path
      d="M4.5 6V2.5h7V6M4.5 11.5h-1A1.5 1.5 0 012 10V7.5A1.5 1.5 0 013.5 6h9A1.5 1.5 0 0114 7.5V10a1.5 1.5 0 01-1.5 1.5h-1M4.5 9.5h7v4h-7z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * /palet's printed quote ("Teklifi yazdır", 2026-11-13): in the page only while the palet has
 * lines and shown in print alone (`.kv-quote` in globals.css hides it on screen and everything
 * else in print), so the browser's print dialog gives a plain A4 document the buyer can save as
 * PDF. Seller, title and date, buyer, lines, totals, terms, then the palet link. Every figure and
 * sentence is /palet's own (the page passes its lines and totals, whose prices it reads again
 * from the product pages when it loads, and its print button waits for that read; a line whose
 * page could not be read then keeps the price it was added with); the quote adds no term of its
 * own: no validity period, number, signature or bank details. No colour classes: the text is
 * black on white whatever the theme.
 */
export function PaletQuote({
  lang,
  t,
  day,
  buyer,
  lines,
  unitLabel,
  sums,
  total,
  totalAlt,
  notes,
  anyAsk,
  shareUrl,
}: {
  lang: Lang;
  t: Dict;
  /** Today in the buyer's browser (`YYYY-MM-DD`); empty until it is read. */
  day: string;
  /** The filled contact fields, "Firma: …". */
  buyer: string[];
  lines: QuoteLine[];
  unitLabel: string;
  /** Subtotal and taxes, where the page shows them. */
  sums: [string, string][];
  total: string;
  /** The total's other currency, under it. */
  totalAlt: string | null;
  /** The exchange-rate and price notes under the total. */
  notes: string[];
  anyAsk: boolean;
  shareUrl: string;
}) {
  const c = t.cart;
  const seller = sellerBlock(lang);
  const [, shipping] = t.terms.rows;
  const terms: [string, string][] = [shipping, [t.terms.warrantyLabel, t.terms.warrantyAll]];
  const cell = 'border-b border-current py-1 align-top';
  return (
    <div className="kv-quote font-sans text-[13px] leading-normal">
      <div>
        <h3 className="m-0 font-semibold">{seller.h}</h3>
        {seller.p.map((x) => (
          <p key={x} className="m-0">
            {x}
          </p>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id={TITLE_ID} className="m-0 text-[22px] font-bold">
          {c.print.title}
        </h2>
        {day && (
          <p className="m-0 tabular-nums">
            {c.print.date}: {fmtDate(day, lang)}
          </p>
        )}
      </div>
      {buyer.length > 0 && (
        <div className="mt-4">
          <h3 className="m-0 font-semibold">{c.print.buyer}</h3>
          {buyer.map((x) => (
            <p key={x} className="m-0 break-words">
              {x}
            </p>
          ))}
        </div>
      )}
      <table
        aria-labelledby={TITLE_ID}
        className="mt-5 w-full border-collapse border-t border-current text-left leading-snug tabular-nums"
      >
        <thead>
          <tr>
            {/* Half the width for the names; the figures share the rest. */}
            <th scope="col" className={`${cell} w-1/2 pr-3 font-semibold`}>
              {c.product}
            </th>
            <th scope="col" className={`${cell} px-2 text-right font-semibold`}>
              {c.qty}
            </th>
            <th scope="col" className={`${cell} px-2 text-right font-semibold`}>
              {unitLabel}
            </th>
            <th scope="col" className={`${cell} pl-2 text-right font-semibold`}>
              {c.lineTotal}
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((x) => (
            <tr key={x.id} className="break-inside-avoid">
              {/* The row's header, looking like the cell it was: plain weight, left aligned. */}
              <th scope="row" className={`${cell} pr-3 text-left font-normal`}>
                <span className="block font-semibold">{x.name}</span>
                {x.label}
              </th>
              <td className={`${cell} px-2 text-right`}>{x.qty}</td>
              {x.total === null ? (
                <td colSpan={2} className={`${cell} pl-2 text-right`}>
                  {c.ask}
                </td>
              ) : (
                <>
                  <td className={`${cell} px-2 text-right whitespace-nowrap`}>
                    {x.unit}
                    {x.unitNet && <span className="block text-[11px]">{x.unitNet}</span>}
                  </td>
                  <td className={`${cell} pl-2 text-right font-semibold whitespace-nowrap`}>
                    {x.total}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="break-inside-avoid">
        {/* The sum and its notes in one column on the right, as on the page. */}
        <div className="mt-3 ml-auto max-w-[24rem] text-right tabular-nums">
          <dl className="m-0">
            {sums.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-0.5">
                <dt className="text-left">{k}</dt>
                <dd className="m-0">{v}</dd>
              </div>
            ))}
            <div
              className={`flex justify-between gap-4 text-[15px] font-bold ${sums.length ? 'mt-1 border-t border-current pt-1.5' : ''}`}
            >
              <dt className="text-left">{c.total}</dt>
              <dd className="m-0 whitespace-nowrap">{total}</dd>
            </div>
          </dl>
          {totalAlt && <p className="m-0 mt-0.5">{totalAlt}</p>}
          {notes.map((x) => (
            <p key={x} className="m-0 mt-1 text-[11px]">
              {x}
            </p>
          ))}
        </div>
        {anyAsk && <p className="m-0 mt-3">{c.totalNote}</p>}
      </div>
      <div className="mt-6 break-inside-avoid border-t border-current pt-3">
        <p className="m-0">{t.terms.facts}</p>
        <dl className="m-0 mt-2">
          {terms.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3">
              <dt className="font-semibold">{k}</dt>
              <dd className="m-0">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="m-0 mt-2 text-[11px]">{t.terms.note}</p>
      </div>
      <p className="m-0 mt-5 break-all">{c.share.reopen(shareUrl)}</p>
    </div>
  );
}
