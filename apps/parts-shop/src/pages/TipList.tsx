import { Container } from '@kervan/ui';
import type { Dict } from '../lib/dict';
import { fmtNum } from '../lib/format';
import { localePath } from '../lib/locale-path';
import type { PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'list' }>;

export default function TipList({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  return (
    <Container className="py-12">
      <h1 className="m-0 font-serif text-4xl text-ink">{t.list.title}</h1>
      <p className="m-0 mt-3 font-sans text-ink-mid">{t.list.lead}</p>
      <div className="mt-8 overflow-x-auto rounded-md border border-hair">
        <table className="w-full border-collapse font-sans text-sm tabular-nums">
          <thead className="bg-bg-soft text-left text-ink-mid">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                {t.list.code}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t.list.diameter}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t.list.types}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t.list.fits}
              </th>
            </tr>
          </thead>
          <tbody>
            {model.rows.map((r) => (
              <tr key={r.code} className="border-t border-hair">
                <th scope="row" className="px-4 py-3 text-left font-medium">
                  <a
                    href={localePath(r.path, lang)}
                    className="text-ink underline decoration-hair underline-offset-4 hover:decoration-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
                  >
                    {r.code}
                  </a>
                  {r.popularTier !== null && (
                    <span className="ml-2 text-xs text-brand-hi">{t.card.popular}</span>
                  )}
                </th>
                <td className="px-4 py-3 text-ink">Ø{fmtNum(r.diameterMm, lang)}</td>
                <td className="px-4 py-3 text-ink">{r.types.map((x) => t.tip[x]).join(', ')}</td>
                <td className="px-4 py-3 text-ink-mid">
                  {r.fits.join(', ')}
                  {r.fitsMore > 0 && ` ${t.card.more(r.fitsMore)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
