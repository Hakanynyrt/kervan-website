import type { Dict } from './dict';
import type { PartRender } from './photos';

/** The breaker model a render fits, with its variant (e.g. old type) when it has one. */
export const renderModel = (r: PartRender, t: Dict): string =>
  r.variant ? `${r.model} (${t.parts.renderVariant[r.variant]})` : r.model;

/** A render's caption ("Montabert BRV 32 piston"); `partName` is the group (or fitted) name. */
export const renderTitle = (r: PartRender, partName: string, t: Dict): string =>
  r.kind
    ? `${renderModel(r, t)} ${t.parts.renderKind[r.kind]}`
    : t.parts.renderCaption(renderModel(r, t), partName);
