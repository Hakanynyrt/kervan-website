import { Button } from '@astryxdesign/core/Button';
import { Breadcrumb, PageTitle } from '../components/Bits';
import { OUTLINE_BUTTON, WHATSAPP_BUTTON, WRAP, whatsappHref } from '../components/Layout';
import { ORDER_CONVERSION } from '../lib/ads';
import type { Dict } from '../lib/dict';
import { INTL } from '../lib/intl-orders';
import { ORDER_EMAIL } from '../lib/site';
import type { Lang } from '../types';

/** The international orders page: the export terms as one table, then the proforma request. */
export default function IntlOrders({ lang, t }: { lang: Lang; t: Dict }) {
  const d = INTL[lang];
  const mail = `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(d.subject)}&body=${encodeURIComponent(d.ask)}`;
  return (
    <div className={`${WRAP} py-10`}>
      <Breadcrumb trail={[]} current={d.title} lang={lang} t={t} />
      <PageTitle>{d.title}</PageTitle>
      <p className="m-0 mt-3 max-w-[68ch] font-sans text-ink-mid">{d.lead}</p>
      <dl className="m-0 mt-8 max-w-[52rem] rounded-sm border border-hair bg-bg-soft px-4 font-sans text-[15px] leading-7 text-ink-mid">
        {d.rows.map(([label, lines]) => (
          <div key={label} className="border-t border-hair py-4 first:border-t-0 sm:flex sm:gap-4">
            <dt className="font-semibold text-ink sm:w-44 sm:shrink-0">{label}</dt>
            <dd className="m-0 min-w-0">
              {lines.map((x) => (
                <p key={x} className="m-0 mt-1 first:mt-0">
                  {x}
                </p>
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-8 flex flex-wrap gap-3 font-sans">
        <Button
          href={whatsappHref(d.ask)}
          label={t.intl.wa}
          size="lg"
          {...ORDER_CONVERSION}
          className={`h-auto min-h-11 whitespace-normal px-5 py-2 ${WHATSAPP_BUTTON}`}
        />
        <Button
          href={mail}
          label={t.intl.mail}
          variant="secondary"
          size="lg"
          {...ORDER_CONVERSION}
          className={`h-auto min-h-11 whitespace-normal px-5 py-2 ${OUTLINE_BUTTON}`}
        />
      </div>
    </div>
  );
}
