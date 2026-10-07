import type { FxRate } from '@kervan/tips';
import type { Lang } from '../types';
import type { PageModel } from './routes';

/** Everything a page needs, embedded in its HTML as JSON so the client hydrates the same tree. */
export interface PageProps {
  lang: Lang;
  /** Neutral (Turkish) path, used by the language toggle. */
  path: string;
  model: PageModel;
  /** USD → TRY rate of the build day, for the TRY prices (null: USD only). */
  fx: FxRate | null;
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
