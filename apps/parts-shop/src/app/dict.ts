import type { Lang } from '../types';

/**
 * Every text of the iPhone app's own chrome and screens (top bar, tab bar, Start, Makinelerim,
 * Tara, the offline and update screens), aria-labels included: TR primary, EN secondary. The
 * shop's pages keep their own texts (src/lib/dict.ts). dict.test.ts checks both languages have
 * every key filled.
 */
export interface AppDict {
  appName: string;
  /** boot-guard.js: shown when the app has not started after a few seconds, with the error. */
  bootFail: string;
  /** The tab bar's landmark name and its five tabs. */
  tabs: {
    label: string;
    home: string;
    guides: string;
    scan: string;
    machines: string;
    palet: string;
    /** The Palet tab's accessible name with the number of items on it (as the site's cart link). */
    paletCount: (n: number) => string;
  };
  top: {
    back: string;
    addMachine: string;
    /** The same button once the model is saved (pressed; a tap removes it again). */
    inMachines: string;
  };
  /** Shown while a page is read. */
  loading: string;
  start: {
    search: string;
    sections: string;
    tips: string;
    parts: string;
    guides: string;
    palet: string;
    machines: string;
    noMachines: string;
    editMachines: string;
    language: string;
    langName: Record<Lang, string>;
  };
  finder: {
    label: string;
    placeholder: string;
    none: string;
    failed: string;
    retry: string;
    /** "n more" under the rows when the list is cut. */
    more: (n: number) => string;
    add: string;
    added: string;
    addLabel: (name: string) => string;
  };
  machines: {
    title: string;
    empty: string;
    add: string;
    remove: string;
    removeLabel: (name: string) => string;
  };
  scan: {
    title: string;
    soon: string;
    field: string;
    open: string;
    notKervan: string;
  };
  offline: {
    title: string;
    text: string;
    retry: string;
  };
  failed: {
    title: string;
  };
  update: {
    title: string;
    open: string;
  };
  /** The dated line over a cached page with prices that was not read again in this session. */
  priceDate: (date: string) => string;
  /** The same line over the palet when it could not be read again: its prices are those of the
   *  day each line was added (no one date). */
  priceDateCart: string;
}

export const APP_DICT: Record<Lang, AppDict> = {
  tr: {
    appName: 'Kervan Kırıcı Parça',
    bootFail: 'Uygulama açılamadı. Bu ekranın görüntüsünü bize gönderin.',
    tabs: {
      label: 'Uygulama bölümleri',
      home: 'Ana ekran',
      guides: 'Rehber',
      scan: 'Tara',
      machines: 'Makinelerim',
      palet: 'Palet',
      paletCount: (n) => `Palet, ${n} ürün`,
    },
    top: {
      back: 'Geri',
      addMachine: 'Makinelerime ekle',
      inMachines: 'Makinelerimde',
    },
    loading: 'Yükleniyor',
    start: {
      search: 'Kırıcı modeli ara',
      sections: 'Bölümler',
      tips: 'Kırıcı uçları',
      parts: 'Yedek parçalar',
      guides: 'Bakım rehberi',
      palet: 'Palet',
      machines: 'Makinelerim',
      noMachines: 'Kayıtlı makine yok.',
      editMachines: 'Makinelerimi düzenle',
      language: 'Dil',
      langName: { tr: 'Türkçe', en: 'English' },
    },
    finder: {
      label: 'Marka veya model',
      placeholder: 'Marka veya model yazın',
      none: 'Bu adla model bulunamadı.',
      failed: 'Model listesi yüklenemedi.',
      retry: 'Tekrar dene',
      more: (n) => `${n} model daha; aramayı daraltın.`,
      add: 'Ekle',
      added: 'Eklendi',
      addLabel: (name) => `${name}: makinelerime ekle`,
    },
    machines: {
      title: 'Makinelerim',
      empty: 'Kayıtlı makine yok.',
      add: 'Makine ekle',
      remove: 'Çıkar',
      removeLabel: (name) => `${name}: makinelerimden çıkar`,
    },
    scan: {
      title: 'Tara',
      soon: 'Kod tarama iPhone uygulamasıyla gelecek.',
      field: 'Kervan bağlantısı',
      open: 'Aç',
      notKervan: 'Bu bir Kervan bağlantısı değil',
    },
    offline: {
      title: 'Bağlantı yok',
      text: 'Bu sayfa telefonda kayıtlı değil.',
      retry: 'Tekrar dene',
    },
    failed: {
      title: 'Sayfa açılamadı',
    },
    update: {
      title: 'Bu sayfa için uygulamayı güncelleyin',
      open: 'Sitede aç',
    },
    priceDate: (date) => `Fiyatlar ${date} tarihlidir; bağlantı olunca güncellenir.`,
    priceDateCart: 'Fiyatlar ürünün eklendiği günün fiyatıdır; bağlantı olunca güncellenir.',
  },
  en: {
    appName: 'Kervan Breaker Parts',
    bootFail: 'The app could not start. Please send us a screenshot of this screen.',
    tabs: {
      label: 'App sections',
      home: 'Home',
      guides: 'Guides',
      scan: 'Scan',
      machines: 'My machines',
      palet: 'Cart',
      paletCount: (n) => `Cart, ${n} ${n === 1 ? 'item' : 'items'}`,
    },
    top: {
      back: 'Back',
      addMachine: 'Add to my machines',
      inMachines: 'In my machines',
    },
    loading: 'Loading',
    start: {
      search: 'Search breaker models',
      sections: 'Sections',
      tips: 'Breaker tips',
      parts: 'Spare parts',
      guides: 'Maintenance guides',
      palet: 'Cart',
      machines: 'My machines',
      noMachines: 'No saved machines.',
      editMachines: 'Edit my machines',
      language: 'Language',
      langName: { tr: 'Türkçe', en: 'English' },
    },
    finder: {
      label: 'Make or model',
      placeholder: 'Type a make or model',
      none: 'No model found by that name.',
      failed: 'The model list could not be loaded.',
      retry: 'Try again',
      more: (n) => `${n} more ${n === 1 ? 'model' : 'models'}; narrow the search.`,
      add: 'Add',
      added: 'Added',
      addLabel: (name) => `${name}: add to my machines`,
    },
    machines: {
      title: 'My machines',
      empty: 'No saved machines.',
      add: 'Add a machine',
      remove: 'Remove',
      removeLabel: (name) => `${name}: remove from my machines`,
    },
    scan: {
      title: 'Scan',
      soon: 'Code scanning comes with the iPhone app.',
      field: 'Kervan link',
      open: 'Open',
      notKervan: 'This is not a Kervan link',
    },
    offline: {
      title: 'No connection',
      text: 'This page is not saved on this phone.',
      retry: 'Try again',
    },
    failed: {
      title: 'The page could not be opened',
    },
    update: {
      title: 'Update the app for this page',
      open: 'Open on the website',
    },
    priceDate: (date) => `Prices are as of ${date}; they update once you are online.`,
    priceDateCart: 'Prices are as of the day each item was added; they update once you are online.',
  },
};

/** A date as the dated price line writes it ("14 Kasım 2026", "14 November 2026"). */
export const fmtDate = (at: number, lang: Lang): string =>
  new Date(at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
