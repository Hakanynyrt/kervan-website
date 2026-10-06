import type { Lang } from '../types';
import type { PageModel } from './routes';

/** Everything a page needs, embedded in its HTML as JSON so the client hydrates the same tree. */
export interface PageProps {
  lang: Lang;
  /** Neutral (Turkish) path, used by the language toggle. */
  path: string;
  model: PageModel;
}

export const PROPS_ID = 'kv-page';

export function readPageProps(doc: Document): PageProps | null {
  const text = doc.getElementById(PROPS_ID)?.textContent;
  if (!text) return null;
  try {
    return JSON.parse(text) as PageProps;
  } catch {
    return null;
  }
}
