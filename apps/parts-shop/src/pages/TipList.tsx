import { Container } from '@kervan/ui';
import { FOCUS } from '../components/Layout';
import type { Dict } from '../lib/dict';
import { fmtNum } from '../lib/format';
import { localePath } from '../lib/locale-path';
import type { PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'list' }>;

export default function TipList({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  return (
    <Container className="py-12">
      <h1 className="m-0 font-sans text-3xl font-bold text-ink">{t.list.title}</h1>
      <p className="m-0 mt-3 font-sans text-ink-mid">{t.list.lead}</p>
      <div className="mt-8 overflow-x-auto rounded-md border border-hair">
        <table className="w-full border-collapse font-sans text-sm tabular-nums">
          <thead className="bg-bg-soft text-left text-ink-mid">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                {t.list.model}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t.list.diameter}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t.list.types}
              </th>
            </tr>
          </thead>
          <tbody>
            {model.rows.map((r) => (
              <tr key={r.slug} className="border-t border-hair">
                <th scope="row" className="px-4 py-3 text-left font-medium">
                  <a
                    href={localePath(r.path, lang)}
                    className={`text-brand-hi underline decoration-hair-strong underline-offset-4 hover:decoration-brand ${FOCUS}`}
                  >
                    {r.name}
                  </a>
                </th>
                <td className="px-4 py-3 text-ink">Ø{fmtNum(r.diameterMm, lang)} mm</td>
                <td className="px-4 py-3 text-ink">{r.types.map((x) => t.tip[x]).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
