import { useMemo, useState, useDeferredValue, useEffect } from 'react';

export interface VegaPart {
  id: string;
  brand: string;
  model: string;
  partType: string;
  oem: string;
  material: string;
  hardnessHRC: string;
  lengthMm: number;
  diameterMm: number;
  image?: string;
  url?: string; // link to product page
}

export interface Props {
  data: VegaPart[];
  lang: 'tr' | 'en';
}

interface Dict {
  search: string;
  brand: string;
  model: string;
  type: string;
  all: string;
  export: string;
  noResults: string;
  count: string;
  favorite: string;
}

const DICT: Record<'tr' | 'en', Dict> = {
  tr: {
    search: 'OEM veya model ara',
    brand: 'Marka',
    model: 'Model',
    type: 'Tip',
    all: 'Tümü',
    export: 'CSV İndir',
    noResults: 'Sonuç yok',
    count: 'sonuç',
    favorite: 'Favori',
  },
  en: {
    search: 'Search OEM or model',
    brand: 'Brand',
    model: 'Model',
    type: 'Type',
    all: 'All',
    export: 'Download CSV',
    noResults: 'No results',
    count: 'results',
    favorite: 'Favorite',
  },
};

const FAV_KEY = 'fyp_favs_v1';

function isBrowser() {
  return typeof window !== 'undefined';
}

export default function FindYourPart({ data, lang }: Props) {
  const t = DICT[lang];
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [partType, setPartType] = useState('');
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const deferredQuery = useDeferredValue(query);

  // Load favs from localStorage
  useEffect(() => {
    if (!isBrowser()) return;
    try {
      const raw = localStorage.getItem(FAV_KEY);
      if (raw) setFavs(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  // URL state sync
  useEffect(() => {
    if (!isBrowser()) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('brand')) setBrand(params.get('brand') ?? '');
    if (params.get('model')) setModel(params.get('model') ?? '');
    if (params.get('type')) setPartType(params.get('type') ?? '');
    if (params.get('q')) setQuery(params.get('q') ?? '');
  }, []);

  useEffect(() => {
    if (!isBrowser()) return;
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (brand) params.set('brand', brand);
    if (model) params.set('model', model);
    if (partType) params.set('type', partType);
    const q = params.toString();
    const url = q ? `?${q}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [query, brand, model, partType]);

  const brands = useMemo(
    () => Array.from(new Set(data.map((p) => p.brand))).sort(),
    [data]
  );
  const models = useMemo(
    () =>
      Array.from(
        new Set(data.filter((p) => !brand || p.brand === brand).map((p) => p.model))
      ).sort(),
    [data, brand]
  );
  const types = useMemo(() => Array.from(new Set(data.map((p) => p.partType))).sort(), [data]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return data.filter((p) => {
      if (brand && p.brand !== brand) return false;
      if (model && p.model !== model) return false;
      if (partType && p.partType !== partType) return false;
      if (q) {
        const hay = `${p.brand} ${p.model} ${p.oem} ${p.partType}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, deferredQuery, brand, model, partType]);

  const toggleFav = (id: string) => {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const exportCsv = () => {
    const headers = ['Brand', 'Model', 'Part Type', 'OEM', 'Material', 'HRC', 'Length (mm)', 'Diameter (mm)'];
    const rows = filtered.map((p) => [
      p.brand,
      p.model,
      p.partType,
      p.oem,
      p.material,
      p.hardnessHRC,
      String(p.lengthMm),
      String(p.diameterMm),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kervan-parts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (typeof window !== 'undefined') {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ event: 'csv_download', count: filtered.length });
    }
  };

  return (
    <div className="fyp">
      <div className="fyp__filters">
        <input
          type="search"
          placeholder={t.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="fyp__search"
          aria-label={t.search}
        />
        <select value={brand} onChange={(e) => { setBrand(e.target.value); setModel(''); }}>
          <option value="">{t.brand} — {t.all}</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          <option value="">{t.model} — {t.all}</option>
          {models.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={partType} onChange={(e) => setPartType(e.target.value)}>
          <option value="">{t.type} — {t.all}</option>
          {types.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
        </select>
        <button type="button" onClick={exportCsv} className="fyp__export" disabled={filtered.length === 0}>
          {t.export}
        </button>
      </div>

      <p className="fyp__count">{filtered.length} {t.count}</p>

      {filtered.length === 0 ? (
        <p className="fyp__empty">{t.noResults}</p>
      ) : (
        <ul className="fyp__list">
          {filtered.slice(0, 200).map((p) => {
            const isFav = favs.has(p.id);
            return (
              <li key={p.id} className="fyp__row">
                <button
                  type="button"
                  className={`fyp__fav ${isFav ? 'is-on' : ''}`}
                  onClick={() => toggleFav(p.id)}
                  aria-label={t.favorite}
                >★</button>
                <div className="fyp__cell fyp__cell--strong">{p.brand} {p.model}</div>
                <div className="fyp__cell">{p.partType}</div>
                <div className="fyp__cell fyp__cell--mono">{p.oem}</div>
                <div className="fyp__cell fyp__cell--mono">{p.material} · HRC {p.hardnessHRC}</div>
                <div className="fyp__cell fyp__cell--mono">Ø{p.diameterMm} × {p.lengthMm} mm</div>
                {p.url && <a href={p.url} className="fyp__link">→</a>}
              </li>
            );
          })}
        </ul>
      )}

      <style>{`
        .fyp { display: flex; flex-direction: column; gap: 1rem; }
        .fyp__filters { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 0.5rem; }
        .fyp__search, .fyp__filters select { padding: 0.55rem 0.7rem; background: var(--bg-2); color: var(--text-primary); border: 1px solid var(--border); border-radius: 6px; font: inherit; }
        .fyp__export { padding: 0.55rem 0.9rem; background: var(--accent-orange); color: #111; border: 0; border-radius: 6px; font-weight: 600; cursor: pointer; }
        .fyp__export:disabled { opacity: 0.4; cursor: not-allowed; }
        .fyp__count { font-family: ui-monospace, monospace; font-size: 0.85rem; color: var(--text-muted); }
        .fyp__empty { color: var(--text-muted); font-style: italic; padding: 2rem 0; }
        .fyp__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
        .fyp__row { display: grid; grid-template-columns: auto 1.3fr 1fr 1fr 1fr 1fr auto; gap: 0.75rem; align-items: center; padding: 0.65rem 0.85rem; background: var(--bg-1); }
        .fyp__row:hover { background: var(--bg-2); }
        .fyp__fav { background: transparent; border: 0; color: var(--text-muted); font-size: 1.1rem; cursor: pointer; padding: 0 0.25rem; }
        .fyp__fav.is-on { color: var(--accent-orange); }
        .fyp__cell { font-size: 0.85rem; color: var(--text-secondary); }
        .fyp__cell--strong { color: var(--text-primary); font-weight: 600; }
        .fyp__cell--mono { font-family: ui-monospace, monospace; font-size: 0.78rem; }
        .fyp__link { color: var(--accent-orange); font-size: 1.1rem; }
        @media (max-width: 780px) {
          .fyp__filters { grid-template-columns: 1fr 1fr; }
          .fyp__search { grid-column: 1 / -1; }
          .fyp__export { grid-column: 1 / -1; }
          .fyp__row { grid-template-columns: auto 1fr auto; }
          .fyp__cell:nth-of-type(3), .fyp__cell:nth-of-type(4), .fyp__cell:nth-of-type(5) { display: none; }
        }
      `}</style>
    </div>
  );
}
