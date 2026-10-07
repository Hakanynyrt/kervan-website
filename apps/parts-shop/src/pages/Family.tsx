import { carrierTons, type PublicSku } from '@kervan/tips';
import { Container } from '@kervan/ui';
import { ORG_EMAIL } from '@kervan/seo';
import type { Dict } from '../lib/dict';
import { fmtMm, fmtNum, fmtRange } from '../lib/format';
import { localePath } from '../lib/locale-path';
import { breakerName, LIST_PATH, type PageModel } from '../lib/routes';
import { FOCUS, whatsappHref } from '../components/Layout';
import type { Lang } from '../types';
import { tipImg } from '../lib/tip-img';

type Model = Extract<PageModel, { kind: 'family' }>;

function availabilityText(s: PublicSku, t: Dict): string {
  const a = s.availability;
  return a.kind === 'stock'
    ? t.family.inStock(a.qty)
    : a.kind === 'lead'
      ? t.family.lead(a.days)
      : t.family.ask;
}

export default function Family({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  const f = model.family;
  const a = f.attrs;
  const tf = t.family;
  const tons = carrierTons(a.diameterMm);
  const dims: [string, string][] = [
    [tf.diameter, fmtMm(a.diameterMm, lang)],
    [tf.collar, fmtMm(a.collarDiameterMm, lang)],
    [tf.keyCount, a.key.count === null ? '—' : String(a.key.count)],
    [tf.keyThickness, fmtMm(a.key.thicknessMm, lang)],
    [tf.slotLength, fmtMm(a.key.slotLengthMm, lang)],
    [tf.backEndToSlot, fmtMm(a.key.backEndToSlotMm, lang)],
    [
      tf.slotEnd,
      a.key.slotEnd === 'rounded'
        ? tf.slotRounded
        : a.key.slotEnd === 'tapered'
          ? tf.slotTapered
          : '—',
    ],
    [tf.rearStep, a.rear.step === null ? '—' : a.rear.step ? tf.yes : tf.no],
    [tf.rearDiameter, fmtMm(a.rear.diameterMm, lang)],
  ];
  const wa = whatsappHref(tf.whatsappText(f.code));
  const mail = `mailto:${ORG_EMAIL}?subject=${encodeURIComponent(f.code)}&body=${encodeURIComponent(tf.whatsappText(f.code))}`;

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
            {f.code}
          </li>
        </ol>
      </nav>
      <h1 className="m-0 mt-5 font-sans text-3xl font-bold text-ink md:text-4xl">
        {tf.kicker(fmtNum(a.diameterMm, lang))}
      </h1>
      <p className="m-0 mt-2 font-sans text-lg font-medium text-ink-mid">{f.code}</p>

      {(f.imageRear || f.skus.some((s) => s.image)) && (
        <figure className="m-0 mt-8">
          <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {f.imageRear && (
              <li className="flex flex-col overflow-hidden rounded-md border border-hair bg-bg-warm">
                <img
                  src={tipImg(f.imageRear, 'sm')}
                  srcSet={`${tipImg(f.imageRear, 'sm')} 480w, ${tipImg(f.imageRear, 'md')} 800w`}
                  sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                  width={800}
                  height={533}
                  alt={tf.rearAlt(f.code)}
                  decoding="async"
                  className="block h-auto w-full"
                />
                <span className="mt-auto block border-t border-hair bg-bg px-3 py-2 font-sans text-sm font-medium text-ink">
                  {tf.viewRear}
                </span>
              </li>
            )}
            {f.skus
              .filter((s): s is typeof s & { image: string } => !!s.image)
              .map((s) => (
                <li
                  key={s.code}
                  className="flex flex-col overflow-hidden rounded-md border border-hair bg-bg-warm"
                >
                  <img
                    src={tipImg(s.image, 'sm')}
                    srcSet={`${tipImg(s.image, 'sm')} 480w, ${tipImg(s.image, 'md')} 800w`}
                    sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                    width={800}
                    height={533}
                    alt={tf.renderAlt(f.code, t.tip[s.tipType])}
                    decoding="async"
                    className="block h-auto w-full"
                  />
                  {s.imageSide && (
                    <img
                      src={tipImg(s.imageSide, 'sm')}
                      srcSet={`${tipImg(s.imageSide, 'sm')} 600w, ${tipImg(s.imageSide, 'md')} 800w`}
                      sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                      width={800}
                      height={267}
                      alt={tf.sideAlt(f.code, t.tip[s.tipType])}
                      loading="lazy"
                      decoding="async"
                      className="mt-1 block h-auto w-full"
                    />
                  )}
                  <span className="mt-auto block border-t border-hair bg-bg px-3 py-2 font-sans text-sm font-medium text-ink">
                    {t.tip[s.tipType]}
                  </span>
                </li>
              ))}
          </ul>
          <figcaption className="mt-3 font-sans text-xs text-ink-soft">{tf.renderNote}</figcaption>
        </figure>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-10">
          <section aria-labelledby="variants">
            <h2 id="variants" className="m-0 mb-4 font-sans text-xl font-bold text-ink">
              {tf.variants}
            </h2>
            <div className="overflow-x-auto rounded-md border border-hair">
              <table className="w-full border-collapse font-sans text-sm tabular-nums">
                <thead className="bg-bg-soft text-left text-ink-mid">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">
                      {tf.type}
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      {tf.length}
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      {tf.weight}
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      {tf.angle}
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      {tf.availability}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {f.skus.map((s) => (
                    <tr key={s.code} id={s.tipType} className="border-t border-hair">
                      <th scope="row" className="px-4 py-3 text-left font-medium text-ink">
                        {t.tip[s.tipType]}
                        <span className="block text-xs font-normal text-ink-soft">{s.code}</span>
                      </th>
                      <td className="px-4 py-3 text-ink">{fmtRange(s.lengthMm, 'mm', lang)}</td>
                      <td className="px-4 py-3 text-ink">{fmtRange(s.weightKg, 'kg', lang)}</td>
                      <td className="px-4 py-3 text-ink">
                        {s.tipAngleDeg === null ? '—' : `${fmtNum(s.tipAngleDeg, lang)}°`}
                      </td>
                      <td className="px-4 py-3 text-ink-mid">{availabilityText(s, t)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="dims">
            <h2 id="dims" className="m-0 mb-4 font-sans text-xl font-bold text-ink">
              {tf.dims}
            </h2>
            <dl className="m-0 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {dims.map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-4 border-t border-hair py-3 font-sans text-sm"
                >
                  <dt className="text-ink-mid">{k}</dt>
                  <dd className="m-0 text-ink tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="m-0 mt-4 font-sans text-sm text-ink-mid">{tf.measureNote}</p>
          </section>

          {f.fits.length > 0 && (
            <section aria-labelledby="fits">
              <h2 id="fits" className="m-0 mb-4 font-sans text-xl font-bold text-ink">
                {tf.fits}
              </h2>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0 font-sans text-sm">
                {f.fits.map((b) => (
                  <li
                    key={b.slug}
                    className="rounded-sm border border-hair bg-bg-soft px-3 py-1 text-ink"
                  >
                    {breakerName(b)}
                  </li>
                ))}
              </ul>
              <p className="m-0 mt-4 font-sans text-xs text-ink-soft">{tf.marks}</p>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          {tons && (
            <div className="rounded-md border border-hair bg-bg-soft p-5 font-sans text-sm">
              <p className="m-0 text-sm font-semibold text-ink">{tf.carrier}</p>
              <p className="m-0 mt-2 text-lg text-ink">{tf.carrierValue(tons.min, tons.max)}</p>
              <p className="m-0 mt-2 text-ink-mid">{tf.carrierNote}</p>
            </div>
          )}
          <div className="rounded-md border border-hair-strong bg-bg p-5 font-sans text-sm">
            <p className="m-0 font-sans text-lg font-bold text-ink">{tf.quoteTitle}</p>
            <p className="m-0 mt-2 text-ink-mid">{tf.quoteBody}</p>
            <div className="mt-4 flex flex-col gap-3">
              <a
                href={wa}
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
