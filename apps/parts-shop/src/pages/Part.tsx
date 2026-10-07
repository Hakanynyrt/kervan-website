import { useState } from 'react';
import { Container } from '@kervan/ui';
import { ORG_EMAIL } from '@kervan/seo';
import {
  Breadcrumb,
  Chips,
  ImgNote,
  OemLine,
  PageTitle,
  Photo,
  QTY,
  StickyQuote,
  Terms,
  type Qty,
} from '../components/Bits';
import { FOCUS, whatsappHref } from '../components/Layout';
import type { Dict } from '../lib/dict';
import { PART_PHOTOS } from '../lib/photos';
import { PARTS_PATH, type PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'part' }>;

/** One spare-part group: our stock photos and a quote by breaker model. */
export default function Part({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  const p = t.parts.items[model.part];
  const [breaker, setBreaker] = useState('');
  const [qty, setQty] = useState<Qty>('1');
  const text = t.parts.text(p.name, breaker.trim(), qty);
  const photos = PART_PHOTOS[model.part];
  return (
    <Container className="pb-28 pt-8 lg:pb-12 lg:pt-12">
      <Breadcrumb trail={[[t.parts.title, PARTS_PATH]]} current={p.name} lang={lang} t={t} />
      <PageTitle>{p.name}</PageTitle>
      <OemLine t={t} />
      <p className="m-0 mt-3 max-w-3xl font-sans text-ink-mid">{p.body}</p>

      <div
        className={`mt-8 grid gap-8 lg:gap-10 ${photos.length ? 'lg:grid-cols-[minmax(0,1fr)_22rem]' : 'max-w-md'}`}
      >
        <aside className="lg:order-2">
          <div className="rounded-md border border-hair-strong bg-bg p-5 font-sans text-sm">
            <p className="m-0 text-lg font-bold text-ink">{t.parts.quoteTitle}</p>
            <p className="m-0 mt-2 text-ink-mid">{t.parts.quoteBody}</p>
            <label htmlFor="breaker" className="mt-4 block font-semibold text-ink">
              {t.parts.modelLabel}
            </label>
            <input
              id="breaker"
              type="text"
              value={breaker}
              onChange={(e) => setBreaker(e.target.value)}
              placeholder={t.parts.modelPlaceholder}
              autoComplete="off"
              className={`mt-2 w-full rounded-sm border border-ink-soft bg-bg px-3 py-2.5 text-base text-ink placeholder:text-ink-soft ${FOCUS}`}
            />
            <div className="mt-4">
              <Chips
                legend={t.family.qty}
                name="qty"
                options={QTY.map((x) => ({ value: x, label: x }))}
                value={qty}
                onChange={setQty}
              />
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <a
                href={whatsappHref(text)}
                className={`rounded-sm bg-whatsapp px-5 py-3 text-center font-medium text-white ${FOCUS}`}
              >
                {t.family.whatsapp}
              </a>
              <a
                href={`mailto:${ORG_EMAIL}?subject=${encodeURIComponent(p.name)}&body=${encodeURIComponent(text)}`}
                className={`rounded-sm border border-ink-soft px-5 py-3 text-center text-ink hover:bg-bg-warm ${FOCUS}`}
              >
                {t.family.email}
              </a>
            </div>
          </div>
          <div className="mt-6">
            <Terms t={t} />
          </div>
        </aside>
        {photos.length > 0 && (
          <div className="lg:order-1">
            <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
              {photos.map((base, i) => (
                <li key={base}>
                  <Photo base={base} alt={`${t.parts.photosAlt(p.name)} (${i + 1})`} lazy={i > 0} />
                </li>
              ))}
            </ul>
            <ImgNote t={t} className="mt-2" />
          </div>
        )}
      </div>
      <StickyQuote text={text} t={t} />
    </Container>
  );
}
