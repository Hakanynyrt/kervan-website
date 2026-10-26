import type { Dict } from './dict';
import type { PartRender } from './photos';
import type { PartKey } from './routes';

/** The breaker model a render fits, with its variant (e.g. old type) when it has one. */
export const renderModel = (r: PartRender, t: Dict): string =>
  r.variant ? `${r.model} (${t.parts.renderVariant[r.variant]})` : r.model;

/** A render's caption ("Montabert BRV 32 piston"); `partName` is the group (or fitted) name. */
export const renderTitle = (r: PartRender, partName: string, t: Dict): string =>
  r.kind
    ? `${renderModel(r, t)} ${t.parts.renderKind[r.kind]}`
    : t.parts.renderCaption(renderModel(r, t), partName);

/** The model's other common spelling, letters and number joined or apart: "MTB 210" → "MTB210",
 *  "Soosan SB50" → "Soosan SB 50"; null when it has neither form. */
export function otherSpelling(model: string): string | null {
  const joined = model.replace(/\b([A-Za-z]+)[\s-]+(?=\d)/, '$1');
  if (joined !== model) return joined;
  const spaced = model.replace(/\b([A-Za-z]{2,})(?=\d)/, '$1 ');
  return spaced === model ? null : spaced;
}

/** A rock drill part (not a breaker part): its kind's noun names the machine itself. */
export const isRockDrill = (r: Pick<PartRender, 'kind'>): boolean =>
  !!r.kind?.startsWith('rockDrill');

/** An item page's title and h1: "MTB 210 kırıcı kaması", "Soosan SB 50 kırıcı kafa burcu",
 *  "COP 1032 kaya delici dayama burcu". */
export const renderSeoName = (r: PartRender, part: PartKey, t: Dict): string =>
  t.parts.item.seoName(
    renderModel(r, t),
    r.kind
      ? (t.parts.renderKindNoun[r.kind] ?? t.parts.renderKind[r.kind])
      : t.parts.itemNoun[part],
    isRockDrill(r),
  );

/** The line under an item page's h1: "Uyduğu kırıcı: Soosan SB50 (Soosan SB 50), eski tip." */
export const renderFits = (r: PartRender, t: Dict): string =>
  t.parts.item.fits(r.model, {
    other: otherSpelling(r.model),
    variant: r.variant ? t.parts.renderVariant[r.variant] : null,
    rockDrill: isRockDrill(r),
  });

/** Link labels for one group's items on a breaker page: a label that would repeat (two renders
 *  of one kind for different model names) gets its model added, "Kama · Krupp HM 560 / 580". */
export function distinctLabels(items: readonly { label: string; model: string }[]): string[] {
  return items.map(({ label, model }) =>
    items.filter((x) => x.label === label).length > 1 ? `${label} · ${model}` : label,
  );
}
