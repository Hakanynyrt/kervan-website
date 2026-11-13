import { slugify } from '@kervan/tips';
import type { Lang } from '../types';
import { DICT } from './dict';
import { fmtNum } from './format';
import { renderModel } from './part-caption';
import { findRender } from './part-links';
import { localePath } from './locale-path';
import { readPageProps } from './page-props';
import { linePagePath, listedLineId, partLineId, tipLineId, type PaletLines } from './palet-share';
import { PARTS_PATH, partItemPath, partPath, type PageModel } from './routes';
import { sizeOrdinals, tipOptions, tipVariants } from './tip-options';

/**
 * Every line the given pages of one language can put on the palet, keyed by its line id, with
 * the name, type or label, code, path and price the page itself would store (TipProduct,
 * PartItem / PartOrder, the group pages' listed parts). A shared palet link carries ids only;
 * /palet fetches the pages the ids name and reads names and prices from their props again
 * (`sharedPaletLines`). Keep in step with those pages: an id that differs is only dropped from a
 * shared link with a note.
 */
export function paletLinesOf(
  pages: readonly { path: string; model: PageModel }[],
  lang: Lang,
): PaletLines {
  const t = DICT[lang];
  const out: PaletLines = {};
  for (const { path, model: m } of pages) {
    if (m.kind === 'breaker' || m.kind === 'family') {
      const families = m.kind === 'breaker' ? m.families : [m.family];
      const extra = m.kind === 'breaker' ? m.extra : undefined;
      const quoteName = m.kind === 'breaker' ? m.name : m.family.code;
      const variants = tipVariants(families);
      const ords = sizeOrdinals(variants);
      const sets =
        variants.length > 1
          ? variants.map((v, i) => ({
              size: i + 1,
              families: v.families,
              name: `${quoteName} (${t.tipSize(fmtNum(v.diameterMm, lang), ords[i])})`,
            }))
          : [{ size: null, families, name: quoteName }];
      for (const s of sets) {
        const { opts, types } = tipOptions(s.families, extra);
        for (const type of types) {
          const o = opts.get(type)!;
          out[tipLineId(path, s.size, type)] = {
            name: s.name,
            tipType: o.tipType,
            code: o.code,
            path,
            cents: o.cents,
          };
        }
      }
    } else if (m.kind === 'partItem') {
      const r = findRender(m.part, m.anchor);
      if (!r) continue;
      const p = t.parts.items[m.part];
      const itemPath = partItemPath(m.part, m.anchor);
      const label = (withB: boolean) =>
        (r.kind
          ? t.parts.renderKind[r.kind]
          : r.fitted
            ? t.parts.fitted.name(p.name, withB)
            : p.name
        ).toLocaleLowerCase(lang === 'tr' ? 'tr' : 'en');
      const name = renderModel(r, t);
      out[partLineId(itemPath, false)] = {
        name,
        label: label(false),
        code: null,
        path: itemPath,
        cents: m.price,
      };
      if (r.fitted)
        out[partLineId(itemPath, true)] = {
          name,
          label: label(true),
          code: null,
          path: itemPath,
          cents: m.priceFitted,
        };
    } else if (m.kind === 'part') {
      const fallback = t.parts.items[m.part].name;
      for (const l of m.listed ?? [])
        out[listedLineId(m.part, slugify(l.breaker), l.type)] = {
          name: l.breaker,
          label: t.parts.listed.type[l.type] ?? fallback,
          code: null,
          path: partPath(m.part),
          cents: l.cents,
        };
    }
  }
  return out;
}

/** Pages fetched at once while a shared palet link is read. */
const FETCH_BATCH = 6;

/**
 * In the browser: the current lines of the pages a shared palet link names, one fetch per page
 * (its prerendered HTML, whose embedded props carry only what that page already shows; there is
 * deliberately no file with every line's price). A page that cannot be read leaves its ids out;
 * rejects only when no page could be fetched at all (offline).
 */
export async function sharedPaletLines(ids: readonly string[], lang: Lang): Promise<PaletLines> {
  const paths = [
    ...new Set(ids.map((id) => linePagePath(id, PARTS_PATH)).filter((p): p is string => !!p)),
  ];
  const out: PaletLines = {};
  let reached = 0;
  for (let i = 0; i < paths.length; i += FETCH_BATCH) {
    await Promise.all(
      paths.slice(i, i + FETCH_BATCH).map(async (path) => {
        try {
          const r = await fetch(localePath(path, lang));
          reached++;
          if (!r.ok) return;
          const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
          const props = readPageProps(doc);
          if (!props || props.lang !== lang || props.path !== path) return;
          Object.assign(out, paletLinesOf([{ path, model: props.model }], lang));
        } catch {
          /* offline or not a page: its ids are dropped */
        }
      }),
    );
  }
  if (paths.length && !reached) throw new Error('offline');
  return out;
}
