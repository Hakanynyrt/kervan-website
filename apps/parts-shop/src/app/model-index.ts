import { MODEL_INDEX_PATH, type MakeModels, type ModelRef } from '../lib/finder';
import { sourceUrl } from '../lib/page-source';

/**
 * The names-only model index of the make/model search (`/kirici-modelleri.json`, public, no
 * prices), read from the site through page-source.ts; the last copy read is kept in
 * localStorage so the search still works offline.
 */
export type ModelIndex = readonly MakeModels<ModelRef>[];

const KEEP = 'kv_app_model_index_v1';

const valid = (v: unknown): v is ModelIndex =>
  Array.isArray(v) &&
  v.every(
    (m) =>
      m &&
      typeof m.brand === 'string' &&
      Array.isArray(m.models) &&
      m.models.every(
        (x: unknown) =>
          !!x &&
          typeof (x as ModelRef).model === 'string' &&
          typeof (x as ModelRef).slug === 'string',
      ),
  );

function kept(): ModelIndex | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEEP) ?? 'null') as unknown;
    return valid(v) ? v : null;
  } catch {
    return null;
  }
}

let req: Promise<ModelIndex> | null = null;

/** The index: read once per session from the site, else the kept copy; rejects when neither. */
export const loadModelIndex = (): Promise<ModelIndex> =>
  (req ??= fetch(sourceUrl(MODEL_INDEX_PATH))
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
    .then((v: unknown) => {
      if (!valid(v)) throw new Error('index');
      try {
        localStorage.setItem(KEEP, JSON.stringify(v));
      } catch {
        /* storage full or blocked: the next start reads it again */
      }
      return v;
    })
    .catch((e: unknown) => {
      req = null;
      const k = kept();
      if (k) return k;
      throw e;
    }));
