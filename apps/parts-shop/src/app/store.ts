import type { Lang } from '../types';
import { isNativeApp } from './native.ts';

/**
 * The app's device state: the saved machines and the language. Nothing leaves the phone. Behind
 * a small async key-value interface: the web build keeps it in localStorage, the iPhone build
 * keeps it in @capacitor/preferences (iOS UserDefaults, declared in the app's privacy manifest)
 * without touching the screens.
 */

/** An async string store (localStorage on the web; @capacitor/preferences on the iPhone). */
export interface KV {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/** The keys this app writes (all versioned: a changed shape gets a new key). */
export const STORE_KEYS = {
  machines: 'kv_app_machines_v1',
  lang: 'kv_app_lang_v1',
} as const;

/** A saved breaker: its own page (neutral, Turkish path `/kirici/<make>/<model>`) and its name. */
export interface Machine {
  path: string;
  name: string;
}

/** The most machines kept (a fleet list, not a catalogue). */
export const MAX_MACHINES = 100;

/** A breaker page path, `/kirici/<make>/<model>`, lower-case slugs only. */
const MACHINE_PATH = /^\/kirici\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const isMachinePath = (path: string): boolean => MACHINE_PATH.test(path);

/** Saved machines as read back from storage: only well-formed rows, each path once. */
export function parseMachines(raw: string | null): Machine[] {
  if (!raw) return [];
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: Machine[] = [];
  for (const x of v) {
    if (!x || typeof x !== 'object') continue;
    const { path, name } = x as Record<string, unknown>;
    if (typeof path !== 'string' || typeof name !== 'string') continue;
    const n = name.trim().slice(0, 120);
    if (!isMachinePath(path) || !n || seen.has(path)) continue;
    seen.add(path);
    out.push({ path, name: n });
    if (out.length >= MAX_MACHINES) break;
  }
  return out;
}

/** The first language: the phone's (Turkish for any `tr`), English for everything else. */
export const firstLang = (navLang: string | undefined | null): Lang =>
  /^tr(\b|-|_|$)/i.test(navLang ?? '') ? 'tr' : 'en';

export const parseLang = (raw: string | null): Lang | null =>
  raw === 'tr' || raw === 'en' ? raw : null;

/** localStorage as a `KV` (storage blocked: reads come back empty, writes are dropped). */
export const localKV: KV = {
  async get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage full or blocked */
    }
  },
  async remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* blocked */
    }
  },
};

/** The part of @capacitor/preferences the store uses. */
export interface Prefs {
  get(o: { key: string }): Promise<{ value: string | null }>;
  set(o: { key: string; value: string }): Promise<void>;
  remove(o: { key: string }): Promise<void>;
}

/**
 * @capacitor/preferences as a `KV` (iPhone build): the plugin is loaded on first use, so the web
 * build never runs it. Failures read as empty and drop the write, as `localKV` does.
 */
export function preferencesKV(
  load: () => Promise<Prefs> = () => import('@capacitor/preferences').then((m) => m.Preferences),
): KV {
  let req: Promise<Prefs> | undefined;
  // A failed load is asked again next time (not cached).
  const prefs = () =>
    (req ??= load().catch((e: unknown) => {
      req = undefined;
      throw e;
    }));
  return {
    async get(key) {
      try {
        return (await (await prefs()).get({ key })).value;
      } catch {
        return null;
      }
    },
    async set(key, value) {
      try {
        await (await prefs()).set({ key, value });
      } catch {
        /* not saved */
      }
    },
    async remove(key) {
      try {
        await (await prefs()).remove({ key });
      } catch {
        /* not removed */
      }
    },
  };
}

/** An in-memory `KV` (tests). */
export function memoryKV(init: Record<string, string> = {}): KV & { data: Map<string, string> } {
  const data = new Map(Object.entries(init));
  return {
    data,
    async get(key) {
      return data.get(key) ?? null;
    },
    async set(key, value) {
      data.set(key, value);
    },
    async remove(key) {
      data.delete(key);
    },
  };
}

export interface AppStore {
  machines(): Promise<Machine[]>;
  /** Adds a machine (no change when its page is already saved or the path is not a model's). */
  addMachine(m: Machine): Promise<Machine[]>;
  removeMachine(path: string): Promise<Machine[]>;
  /** The saved language, else the first one from the phone's language (saved then). */
  lang(navLang?: string | null): Promise<Lang>;
  setLang(lang: Lang): Promise<void>;
  /** Called after every change of the machines list. */
  onMachines(fn: (list: Machine[]) => void): () => void;
}

export function createStore(kv: KV): AppStore {
  const subs = new Set<(list: Machine[]) => void>();
  const read = async () => parseMachines(await kv.get(STORE_KEYS.machines));
  const write = async (list: Machine[]) => {
    await kv.set(STORE_KEYS.machines, JSON.stringify(list));
    for (const fn of subs) fn(list);
    return list;
  };
  return {
    machines: read,
    async addMachine(m) {
      const list = await read();
      const name = m.name.trim();
      if (!isMachinePath(m.path) || !name || list.some((x) => x.path === m.path)) return list;
      if (list.length >= MAX_MACHINES) return list;
      return write([...list, { path: m.path, name: name.slice(0, 120) }]);
    },
    async removeMachine(path) {
      const list = await read();
      const next = list.filter((x) => x.path !== path);
      return next.length === list.length ? list : write(next);
    },
    async lang(navLang) {
      const saved = parseLang(await kv.get(STORE_KEYS.lang));
      if (saved) return saved;
      const first = firstLang(navLang);
      await kv.set(STORE_KEYS.lang, first);
      return first;
    },
    async setLang(lang) {
      await kv.set(STORE_KEYS.lang, lang);
    },
    onMachines(fn) {
      subs.add(fn);
      return () => {
        subs.delete(fn);
      };
    },
  };
}

/** The app's store: @capacitor/preferences inside the iPhone app, localStorage elsewhere. */
export const store: AppStore = createStore(isNativeApp() ? preferencesKV() : localKV);
