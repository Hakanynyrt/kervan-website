/** İhracat noktaları — Kocaeli'den çıkıp ulaşılan şehirler.
 *  Lat/lon WGS84 ondalık derece. Şehir/ülke isimleri TR ve EN ayrı,
 *  globe tooltip'i o anki dile göre seçer. Listeyi büyütmek için
 *  diziye yeni satır ekle — Globe component otomatik yeni dot + arc
 *  çiziyor. */
export interface ExportPoint {
  city: string;
  cityTr: string;
  country: string;
  countryTr: string;
  lat: number;
  lon: number;
}

export const ORIGIN: ExportPoint = {
  city: 'Kocaeli',
  cityTr: 'Kocaeli',
  country: 'Türkiye',
  countryTr: 'Türkiye',
  lat: 40.77,
  lon: 30.16,
};

export const EXPORTS: ExportPoint[] = [
  // ──── Avrupa ─────────────────────────────────────────────────────
  { city: 'Frankfurt',  cityTr: 'Frankfurt',  country: 'Germany',      countryTr: 'Almanya',          lat: 50.11, lon:   8.68 },
  { city: 'Milan',      cityTr: 'Milano',     country: 'Italy',        countryTr: 'İtalya',           lat: 45.46, lon:   9.19 },
  { city: 'Lyon',       cityTr: 'Lyon',       country: 'France',       countryTr: 'Fransa',           lat: 45.76, lon:   4.84 },
  { city: 'Madrid',     cityTr: 'Madrid',     country: 'Spain',        countryTr: 'İspanya',          lat: 40.42, lon:  -3.70 },
  { city: 'London',     cityTr: 'Londra',     country: 'UK',           countryTr: 'Birleşik Krallık', lat: 51.51, lon:  -0.13 },
  { city: 'Rotterdam',  cityTr: 'Rotterdam',  country: 'Netherlands',  countryTr: 'Hollanda',         lat: 51.92, lon:   4.48 },
  { city: 'Warsaw',     cityTr: 'Varşova',    country: 'Poland',       countryTr: 'Polonya',          lat: 52.23, lon:  21.01 },
  { city: 'Bucharest',  cityTr: 'Bükreş',     country: 'Romania',      countryTr: 'Romanya',          lat: 44.43, lon:  26.10 },

  // ──── MENA ───────────────────────────────────────────────────────
  { city: 'Cairo',      cityTr: 'Kahire',     country: 'Egypt',        countryTr: 'Mısır',            lat: 30.04, lon:  31.24 },
  { city: 'Algiers',    cityTr: 'Cezayir',    country: 'Algeria',      countryTr: 'Cezayir',          lat: 36.75, lon:   3.06 },
  { city: 'Riyadh',     cityTr: 'Riyad',      country: 'Saudi Arabia', countryTr: 'Suudi Arabistan',  lat: 24.71, lon:  46.68 },
  { city: 'Dubai',      cityTr: 'Dubai',      country: 'UAE',          countryTr: 'BAE',              lat: 25.20, lon:  55.27 },
  { city: 'Baghdad',    cityTr: 'Bağdat',     country: 'Iraq',         countryTr: 'Irak',             lat: 33.32, lon:  44.36 },

  // ──── CIS / Orta Asya ─────────────────────────────────────────────
  { city: 'Moscow',     cityTr: 'Moskova',    country: 'Russia',       countryTr: 'Rusya',            lat: 55.75, lon:  37.62 },
  { city: 'Baku',       cityTr: 'Bakü',       country: 'Azerbaijan',   countryTr: 'Azerbaycan',       lat: 40.41, lon:  49.87 },
  { city: 'Almaty',     cityTr: 'Almatı',     country: 'Kazakhstan',   countryTr: 'Kazakistan',       lat: 43.24, lon:  76.94 },

  // ──── Asya / Amerika ─────────────────────────────────────────────
  { city: 'Mumbai',     cityTr: 'Mumbai',     country: 'India',        countryTr: 'Hindistan',        lat: 19.08, lon:  72.88 },
  { city: 'Houston',    cityTr: 'Houston',    country: 'USA',          countryTr: 'ABD',              lat: 29.76, lon: -95.37 },
];
