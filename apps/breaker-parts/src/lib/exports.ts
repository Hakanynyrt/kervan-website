import type { ExportRegion } from '../types';

/** İhracat noktaları — Kocaeli'den çıkıp ulaşılan şehirler. Ana sayfa (Exports) ülke sayısını
 *  (`EXPORTS.length`) ve bölge listesini (`region`) buradan alır. Şehir/ülke isimleri TR ve EN ayrı.
 *  Lat/lon WGS84 ondalık derece; `y2025` / `y2026` ton miktarları (2026: Mayıs itibariyle) sitede
 *  gösterilmiyor (eski 3D küre kullanıyordu). Listeyi büyütmek için diziye yeni satır ekle. */
export interface ExportPoint {
  /** Region heading on the home page's destination list. */
  region: ExportRegion;
  city: string;
  cityTr: string;
  country: string;
  countryTr: string;
  lat: number;
  lon: number;
  /** 2025 tam yıl satışı, ton. */
  y2025: number;
  /** 2026 yılbaşından bugüne (Mayıs) ton. */
  y2026: number;
}

export const ORIGIN: ExportPoint = {
  region: 'europe',
  city: 'Kocaeli',
  cityTr: 'Kocaeli',
  country: 'Türkiye',
  countryTr: 'Türkiye',
  lat: 40.77,
  lon: 30.16,
  y2025: 0,
  y2026: 0,
};

export const EXPORTS: ExportPoint[] = [
  // ──── Avrupa ─────────────────────────────────────────────────────
  {
    region: 'europe',
    city: 'Frankfurt',
    cityTr: 'Frankfurt',
    country: 'Germany',
    countryTr: 'Almanya',
    lat: 50.11,
    lon: 8.68,
    y2025: 178,
    y2026: 96,
  },
  {
    region: 'europe',
    city: 'Milan',
    cityTr: 'Milano',
    country: 'Italy',
    countryTr: 'İtalya',
    lat: 45.46,
    lon: 9.19,
    y2025: 142,
    y2026: 71,
  },
  {
    region: 'europe',
    city: 'Lyon',
    cityTr: 'Lyon',
    country: 'France',
    countryTr: 'Fransa',
    lat: 45.76,
    lon: 4.84,
    y2025: 118,
    y2026: 58,
  },
  {
    region: 'europe',
    city: 'Madrid',
    cityTr: 'Madrid',
    country: 'Spain',
    countryTr: 'İspanya',
    lat: 40.42,
    lon: -3.7,
    y2025: 88,
    y2026: 41,
  },
  {
    region: 'europe',
    city: 'London',
    cityTr: 'Londra',
    country: 'UK',
    countryTr: 'Birleşik Krallık',
    lat: 51.51,
    lon: -0.13,
    y2025: 104,
    y2026: 52,
  },
  {
    region: 'europe',
    city: 'Rotterdam',
    cityTr: 'Rotterdam',
    country: 'Netherlands',
    countryTr: 'Hollanda',
    lat: 51.92,
    lon: 4.48,
    y2025: 62,
    y2026: 28,
  },
  {
    region: 'europe',
    city: 'Warsaw',
    cityTr: 'Varşova',
    country: 'Poland',
    countryTr: 'Polonya',
    lat: 52.23,
    lon: 21.01,
    y2025: 85,
    y2026: 44,
  },
  {
    region: 'europe',
    city: 'Bucharest',
    cityTr: 'Bükreş',
    country: 'Romania',
    countryTr: 'Romanya',
    lat: 44.43,
    lon: 26.1,
    y2025: 47,
    y2026: 21,
  },

  // ──── MENA ───────────────────────────────────────────────────────
  {
    region: 'mena',
    city: 'Cairo',
    cityTr: 'Kahire',
    country: 'Egypt',
    countryTr: 'Mısır',
    lat: 30.04,
    lon: 31.24,
    y2025: 72,
    y2026: 33,
  },
  {
    region: 'mena',
    city: 'Algiers',
    cityTr: 'Cezayir',
    country: 'Algeria',
    countryTr: 'Cezayir',
    lat: 36.75,
    lon: 3.06,
    y2025: 39,
    y2026: 18,
  },
  {
    region: 'mena',
    city: 'Riyadh',
    cityTr: 'Riyad',
    country: 'Saudi Arabia',
    countryTr: 'Suudi Arabistan',
    lat: 24.71,
    lon: 46.68,
    y2025: 132,
    y2026: 68,
  },
  {
    region: 'mena',
    city: 'Dubai',
    cityTr: 'Dubai',
    country: 'UAE',
    countryTr: 'BAE',
    lat: 25.2,
    lon: 55.27,
    y2025: 156,
    y2026: 82,
  },
  {
    region: 'mena',
    city: 'Baghdad',
    cityTr: 'Bağdat',
    country: 'Iraq',
    countryTr: 'Irak',
    lat: 33.32,
    lon: 44.36,
    y2025: 54,
    y2026: 25,
  },

  // ──── CIS / Orta Asya ─────────────────────────────────────────────
  {
    region: 'asia',
    city: 'Moscow',
    cityTr: 'Moskova',
    country: 'Russia',
    countryTr: 'Rusya',
    lat: 55.75,
    lon: 37.62,
    y2025: 192,
    y2026: 104,
  },
  {
    region: 'asia',
    city: 'Baku',
    cityTr: 'Bakü',
    country: 'Azerbaijan',
    countryTr: 'Azerbaycan',
    lat: 40.41,
    lon: 49.87,
    y2025: 31,
    y2026: 15,
  },
  {
    region: 'asia',
    city: 'Almaty',
    cityTr: 'Almatı',
    country: 'Kazakhstan',
    countryTr: 'Kazakistan',
    lat: 43.24,
    lon: 76.94,
    y2025: 63,
    y2026: 30,
  },

  // ──── Asya / Amerika ─────────────────────────────────────────────
  {
    region: 'asia',
    city: 'Mumbai',
    cityTr: 'Mumbai',
    country: 'India',
    countryTr: 'Hindistan',
    lat: 19.08,
    lon: 72.88,
    y2025: 115,
    y2026: 62,
  },
  {
    region: 'americas',
    city: 'Houston',
    cityTr: 'Houston',
    country: 'USA',
    countryTr: 'ABD',
    lat: 29.76,
    lon: -95.37,
    y2025: 108,
    y2026: 54,
  },
];
