import type { TipType } from '@kervan/tips';
import type { PartKey } from './routes';
import type { Lang } from '../types';
import type { PartRender, RenderView } from './photos';

export interface Dict {
  meta: {
    siteName: string;
    homeTitle: string;
    homeDesc: string;
    listTitle: string;
    listDesc: string;
    familyTitle: (code: string, d: string) => string;
    familyDesc: (code: string, d: string, types: string) => string;
    breakerTitle: (name: string, d: string) => string;
    breakerDesc: (name: string, d: string, types: string) => string;
    notFoundTitle: string;
    popularTitle: string;
    popularDesc: string;
    brandTitle: (brand: string) => string;
    brandDesc: (brand: string, n: number) => string;
    partsTitle: string;
    partsDesc: string;
    partTitle: (name: string) => string;
    partDesc: (name: string) => string;
    /** One modelled part's own page: caption = "Montabert BRV 32 piston". */
    partItemTitle: (caption: string) => string;
    partItemDesc: (caption: string) => string;
    cartTitle: string;
  };
  nav: {
    label: string;
    popular: string;
    catalogSite: string;
    quote: string;
    /** The header quote button on phones. */
    quoteShort: string;
    quoteText: string;
    /** Header quote message on a breaker page. */
    quoteTextFor: (name: string) => string;
    skip: string;
    /** Short group names for the category bar (tips first, then PART_KEYS). */
    groups: { tips: string } & Record<PartKey, string>;
    call: string;
    cart: string;
    langLabel: string;
    langOther: string;
    /** Header utility group (language, cart, quote). */
    tools: string;
    /** Theme select: the sun decides (auto), or the visitor. */
    theme: { label: string; auto: string; light: string; dark: string };
  };
  top: { tagline: string; shop: string };
  banner: { label: string; preview: string; demo: string; how: string };
  tip: Record<TipType, string>;
  home: {
    title: string;
    lead: string;
    cta: string;
    ctaQuote: string;
    popular: string;
    featured: string;
    morePopular: string;
    groups: string;
    count: (n: number) => string;
    /** Under the hero composite: what the picture is. */
    heroCaption: (caption: string) => string;
    heroMore: string;
    allGroups: string;
    makes: {
      title: string;
      lead: string;
      all: (n: number) => string;
      count: (n: number) => string;
      note: string;
    };
    trust: { title: string; body: string }[];
    sectors: {
      title: string;
      lead: string;
      typesLabel: string;
      note: string;
      items: { name: string; body: string; types: TipType[] }[];
    };
  };
  card: { view: string };
  breaker: { title: (name: string) => string };
  popular: {
    title: string;
    lead: string;
    tips: string;
    parts: string;
    partsLead: string;
  };
  list: {
    title: string;
    lead: string;
    model: string;
    diameter: string;
    types: string;
  };
  family: {
    kicker: (d: string) => string;
    crumbHome: string;
    crumbLabel: string;
    diameter: string;
    type: string;
    qty: string;
    stockTitle: string;
    stockNote: string;
    stockAlt: (i: number) => string;
    angle: string;
    availability: string;
    inStock: (n: number) => string;
    lead: (days: number) => string;
    ask: string;
    askLead: string;
    carrier: string;
    carrierValue: (min: number, max: number) => string;
    carrierNote: string;
    quoteTitle: string;
    quoteBody: string;
    whatsapp: string;
    email: string;
    /** Priced products: the box orders instead of asking for a quote. */
    orderTitle: string;
    orderBody: string;
    orderWa: string;
    orderMail: string;
    /** Price on request: a quote request. */
    quoteText: (name: string, type: string, code: string, qty: number, url: string) => string;
    /** Priced: an order with the unit price the buyer saw. */
    orderText: (
      name: string,
      type: string,
      code: string,
      qty: number,
      price: string,
      url: string,
    ) => string;
    /** Links to other parts we make for this breaker. */
    partsTitle: string;
    renderAlt: (name: string, type: string) => string;
    sideAlt: (name: string, type: string) => string;
    rearAlt: (name: string) => string;
    viewRear: string;
  };
  search: {
    label: string;
    placeholder: string;
    button: string;
    none: (q: string) => string;
    count: (n: number) => string;
    brands: string;
    all: string;
    /** Phones: the make chips behind a summary. */
    changeMake: (n: number) => string;
    didYouMean: (q: string) => string;
    /** Under an empty search box: nothing is listed until something is typed. */
    hint: string;
  };
  missing: {
    title: string;
    body: string;
    button: string;
    text: string;
    textFor: (q: string) => string;
  };
  qty: { less: string; more: string; clamped: (max: number) => string };
  price: {
    label: string;
    fxNote: (date: string) => string;
    add: string;
    added: string;
    goCart: string;
    /** Second, smaller figure next to the net price. */
    inclVat: (money: string) => string;
  };
  cart: {
    title: string;
    empty: string;
    emptyBody: string;
    browse: string;
    /** Static ordering guide (#siparis-adimlari). */
    steps: { title: string; items: { h: string; p: string }[]; note: string };
    product: string;
    qty: string;
    unit: string;
    lineTotal: string;
    ask: string;
    total: string;
    subtotal: string;
    vat: (pct: number) => string;
    totalNote: string;
    remove: (name: string) => string;
    removeShort: string;
    removed: (name: string) => string;
    cleared: string;
    undo: string;
    subject: (first: string, more: number) => string;
    contactTitle: string;
    name: string;
    company: string;
    phone: string;
    city: string;
    note: string;
    sendWa: string;
    sendMail: string;
    clear: string;
    info: string;
    message: (lines: string[], total: string, contact: string[]) => string;
    /** One order line: name, type, code, qty × unit = line total, then the page link. */
    line: (name: string, qty: number, unit: string, total: string | null, url: string) => string;
  };
  brand: { title: (brand: string) => string; lead: (n: number) => string };
  /** Sales terms shown on every product page: quality, shipping, payment, warranty. */
  terms: { title: string; rows: [string, string][]; note: string };
  parts: {
    title: string;
    lead: string;
    tips: { name: string; body: string };
    items: Record<PartKey, { name: string; body: string }>;
    view: string;
    /** Count line on a product-group card (computed from the renders or the catalogue). */
    groupsTitle: string;
    fitNote: string;
    plant: { title: string; lead: string; note: string; items: { caption: string; alt: string }[] };
    photosAlt: (name: string) => string;
    /** "Rammer E68 alt gövde". */
    renderCaption: (model: string, name: string) => string;
    renderView: Record<RenderView, string>;
    renderKind: Record<NonNullable<PartRender['kind']>, string>;
    /** Under the model in a series strip, so the bushings of one breaker tell apart. */
    renderKindShort: Record<NonNullable<PartRender['kind']>, string>;
    renderVariant: Record<NonNullable<PartRender['variant']>, string>;
    viewer: {
      open: string;
      close: string;
      hint: string;
      loading: string;
      error: string;
      cut: string;
      cutOff: string;
      cutLabel: string;
      cutHint: string;
    };
    series: {
      title: (series: string) => string;
      hint: string;
      prev: string;
      next: string;
      jump: string;
    };
    /** Repair kits: the contents table under the pictures. */
    kit: {
      title: string;
      part: string;
      qty: string;
      note: string;
      /** Under the title instead of the OEM line: kits are put together, not made by us. */
      oem: string;
      renderNote: string;
      type: Record<import('./photos').KitItemType, string>;
    };
    /** Group page before a search: a few renders with no make or model named. */
    showcase: { title: string; lead: string; alt: (part: string, i: number) => string };
    /** Under a part's caption: its breaker's tip page. */
    tipLink: string;
    /** Under a part's caption: WhatsApp quote for exactly that model. */
    quoteThis: string;
    /** One modelled part's own page (linkable, shareable). */
    item: {
      /** Group page card → the part's own page. */
      pageLink: string;
      share: string;
      copied: string;
      /** Clipboard unavailable: show the address to copy by hand. */
      copyFailed: (url: string) => string;
      whatsappSend: string;
      /** Back to the group page: "Tüm piston modelleri". */
      back: (group: string) => string;
      related: string;
      linksLabel: string;
    };
    /** Front heads sold with or without their bushings and pins. */
    fitted: {
      label: string;
      without: string;
      with: string;
      withNote: string;
      name: (part: string, withB: boolean) => string;
    };
    quoteTitle: string;
    quoteBody: string;
    modelLabel: string;
    modelPlaceholder: string;
    text: (part: string, model: string, qty: number) => string;
    noPhoto: string;
  };
  /** Under product pictures: tip renders, part renders from our drawings, real stock photos. */
  imgNote: string;
  renderNote: string;
  photoNote: string;
  /** Quality line under every product title. */
  oem: string;
  legal: {
    nav: string;
    agree: string;
    and: string;
    toc: string;
    updated: (date: string) => string;
    /** EN only: the Turkish text is binding. */
    binding: string;
    others: string;
  };
  footer: {
    legal: string;
    docs: string;
    images: string;
    shop: string;
    company: string;
    contact: string;
    about: string;
    fit: string;
    fax: string;
  };
  notFound: { title: string; body: string; home: string; ask: string };
}

export const DICT: Record<Lang, Dict> = {
  tr: {
    meta: {
      siteName: 'Kervan Mağaza',
      homeTitle: 'Hidrolik kırıcı yedek parçaları | Kervan Mağaza',
      homeDesc:
        'Kervan üretimi hidrolik kırıcı yedek parçaları: kırıcı ucu, alt gövde, burç, kama, saplama, piston ve daha fazlası; kırıcınızın marka ve modeline göre.',
      listTitle: 'Tüm kırıcı uçları | Kervan Mağaza',
      listDesc: 'Marka ve modele göre tüm Kervan kırıcı uçları: çalışma çapı ve uç tipleri.',
      familyTitle: (code, d) => `${code} kırıcı ucu Ø${d} | Kervan Mağaza`,
      familyDesc: (code, d, types) => `${code}: Ø${d} mm kırıcı ucu (${types}).`,
      breakerTitle: (name, d) => `${name} kırıcı ucu${d ? ` Ø${d}` : ''} | Kervan Mağaza`,
      breakerDesc: (name, d, types) =>
        `${name} hidrolik kırıcı için Kervan ucu: ${d ? `Ø${d} mm, ` : ''}${types}.`,
      notFoundTitle: 'Sayfa bulunamadı | Kervan Mağaza',
      popularTitle: 'Çok satan kırıcı uçları | Kervan Mağaza',
      popularDesc: 'En çok sipariş edilen Kervan kırıcı uçları, kırıcı marka ve modeline göre.',
      brandTitle: (brand) => `${brand} kırıcı uçları | Kervan Mağaza`,
      brandDesc: (brand, n) => `${brand} hidrolik kırıcılar için Kervan uçları: ${n} model.`,
      partsTitle: 'Kırıcı yedek parçaları | Kervan Mağaza',
      partsDesc:
        'Hidrolik kırıcı ucu, alt gövde, burç, kama, saplama, piston, akümülatör parçaları ve aşınma plakası: Kervan üretimi.',
      partTitle: (name) => `Kırıcı ${name.toLocaleLowerCase('tr')} | Kervan Mağaza`,
      partDesc: (name) =>
        `Hidrolik kırıcı ${name.toLocaleLowerCase('tr')}: Kervan üretimi, kırıcınızın modeline göre teklif.`,
      partItemTitle: (caption) => `${caption} | Kervan Mağaza`,
      partItemDesc: (caption) =>
        `${caption}: Kervan üretimi hidrolik kırıcı yedek parçası. Fiyat teklifi için yazın.`,
      cartTitle: 'Palet | Kervan Mağaza',
    },
    nav: {
      label: 'Ana menü',
      popular: 'Çok satanlar',
      catalogSite: 'Kurumsal',
      quote: 'Teklif iste',
      quoteShort: 'Teklif',
      quoteText: 'Merhaba, kırıcı yedek parçası için fiyat teklifi almak istiyorum.',
      quoteTextFor: (name) => `Merhaba, ${name} kırıcı ucu için bilgi almak istiyorum.`,
      skip: 'İçeriğe geç',
      groups: {
        tips: 'Uç',
        'alt-govde': 'Alt gövde',
        burc: 'Burç',
        kama: 'Kama',
        saplama: 'Saplama',
        piston: 'Piston',
        akumulator: 'Akümülatör',
        'asinma-plakasi': 'Aşınma plakası',
        'tamir-takimi': 'Tamir takımı',
      },
      call: 'Ara',
      cart: 'Palet',
      langLabel: 'English',
      langOther: 'EN',
      tools: 'Hızlı erişim',
      theme: { label: 'Tema', auto: 'Otomatik', light: 'Açık', dark: 'Koyu' },
    },
    top: {
      tagline: 'Hidrolik kırıcı yedek parça üreticisi',
      shop: 'Kırıcı yedek parça mağazası',
    },
    banner: {
      label: 'Sipariş talebi:',
      preview:
        'online ödeme henüz yok; paletinizi WhatsApp veya e-posta ile gönderin, size dönelim.',
      how: 'Nasıl sipariş verilir?',
      demo: 'DEMO verisi: bu ürünler gerçek değildir.',
    },
    tip: {
      chisel: 'Keski',
      moil: 'Sivri',
      blunt: 'Küt',
      pyramid: 'Piramit',
      conical: 'Konik',
      asphalt: 'Asfalt',
    },
    home: {
      title: 'Hidrolik kırıcı yedek parçaları',
      lead: 'Kırıcı ucu, alt gövde, burç, kama, saplama, piston ve diğer parçalar: kendi tezgâhımızda işlenir, çelik parçalar kendi tesisimizde ısıl işlem görür. Kırıcınızın marka ve modelini arayın, uyan parçayı seçin. Stoktan aynı gün kargo.',
      cta: 'Tüm kırıcı uçları',
      ctaQuote: 'Teklif iste',
      popular: 'Çok satanlar',
      featured: 'Kırıcı ucu',
      morePopular: 'Tüm çok satanlar',
      groups: 'Ürün gruplarımız',
      count: (n) => `${n} kırıcı modeli`,
      heroCaption: (c) => `${c} · kendi çizimimizden modellenmiş görsel`,
      heroMore: 'Diğer parçalar',
      allGroups: 'Tüm yedek parçalar',
      makes: {
        title: 'Uyumlu kırıcı markaları',
        lead: 'Kırıcınızın markasını seçin, o markanın modellerini görün.',
        all: (n) => `Tüm markalar (${n})`,
        count: (n) => `${n} model`,
        note: 'Ürünlerimiz Kervan Makina üretimidir, kırıcı üreticisinin orijinal parçası değildir; marka ve model adları yalnızca uyumu belirtir.',
      },
      trust: [
        {
          title: 'Kendi üretimimiz',
          body: 'Kartepe’deki tesisimizde, orijinal ölçülerde ve OEM kalitesinde işlenir; aracı yoktur.',
        },
        {
          title: 'Kendi ısıl işlemimiz',
          body: 'Isıl işlem kendi fırınlarımızda, kontrollü olarak yapılır.',
        },
        {
          title: 'Modele göre seçim',
          body: 'Kırıcınızın marka ve modelini seçin, uyan ucu görün.',
        },
        {
          title: 'Stoktan aynı gün kargo',
          body: 'Stoktaki uçlar ödemeniz bize ulaştığı gün kargoya verilir.',
        },
      ],
      sectors: {
        title: 'Sizin işinizi yapanlar hangi ucu seçiyor?',
        lead: 'Sahada aynı işi yapan firmaların genellikle tercih ettiği uç tipleri.',
        typesLabel: 'Genellikle tercih edilen',
        note: 'Genel saha uygulamasıdır; kırıcı üreticisinin önerisi geçerlidir.',
        items: [
          {
            name: 'Taş ocağı',
            body: 'Sert kayada kırma ve iri blokların parçalanması.',
            types: ['pyramid', 'conical', 'blunt'],
          },
          {
            name: 'Maden',
            body: 'Cevher ve sert kaya; yüksek aşınma.',
            types: ['conical', 'moil'],
          },
          {
            name: 'Yıkım',
            body: 'Betonarme yapılar ve temel kırma.',
            types: ['moil', 'chisel'],
          },
          {
            name: 'Altyapı ve kazı',
            body: 'Kanal açma, katmanlı zemin ve asfalt.',
            types: ['chisel', 'asphalt', 'moil'],
          },
        ],
      },
    },
    card: { view: 'Ucu gör' },
    breaker: { title: (name) => `${name} kırıcı ucu` },
    list: {
      title: 'Tüm kırıcı uçları',
      lead: 'Kırıcınızın marka ve modelini yazın. En çok sipariş edilenler ayrı sayfada.',
      model: 'Kırıcı',
      diameter: 'Çalışma çapı',
      types: 'Uç tipleri',
    },
    popular: {
      title: 'Çok satanlar',
      lead: 'En çok sipariş edilen kırıcı uçları ve aynı kırıcılar için ürettiğimiz yedek parçalar, karışık.',
      tips: 'Kırıcı ucu',
      parts: 'Çok satan kırıcılar için yedek parçalar',
      partsLead:
        'Ucu en çok sipariş edilen kırıcı modelleri için ürettiğimiz parçalar; parça satış sıralaması değildir.',
    },
    family: {
      kicker: (d) => `Ø${d} mm hidrolik kırıcı ucu`,
      crumbHome: 'Ana sayfa',
      crumbLabel: 'Bulunduğunuz yer',
      diameter: 'Çalışma çapı',
      type: 'Uç tipi',
      qty: 'Adet',
      stockTitle: 'Stoğumuzdan',
      stockNote: 'Atölyemizdeki stoktan kırıcı uçları.',
      stockAlt: (i) => `Kervan atölyesinde stoktaki kırıcı uçları (${i})`,
      angle: 'Uç açısı',
      availability: 'Durum',
      inStock: (n) => (n >= 10 ? 'Stokta (10+)' : `Stokta (${n})`),
      lead: (days) => `Üretim ~${days} iş günü`,
      ask: 'Fiyat için sorun',
      askLead: 'Stoktan aynı gün kargo',
      carrier: 'Taşıyıcı (yaklaşık)',
      carrierValue: (min, max) => `${min}–${max} t ekskavatör`,
      carrierNote: 'Yaklaşık değerdir; kırıcı üreticisinin önerisi geçerlidir.',
      quoteTitle: 'Fiyat teklifi isteyin',
      quoteBody: 'Kırıcınız ve seçtiğiniz uç mesaja yazılır; size hemen dönelim.',
      whatsapp: 'WhatsApp ile sor',
      email: 'E-posta gönder',
      orderTitle: 'Sipariş verin',
      orderBody:
        'Kırıcınız, seçtiğiniz uç, adet ve fiyat mesaja yazılır; ödeme ve kargo bilgisiyle size dönelim.',
      orderWa: 'WhatsApp ile sipariş ver',
      orderMail: 'E-posta ile sipariş ver',
      quoteText: (name, type, code, qty, url) =>
        `Merhaba, ${name} için ${type} kırıcı ucu${code ? ` (${code})` : ''}, ${qty} adet için fiyat teklifi almak istiyorum.\n${url}`,
      orderText: (name, type, code, qty, price, url) =>
        `Merhaba, ${name} için ${type} kırıcı ucu${code ? ` (${code})` : ''}, ${qty} adet sipariş vermek istiyorum (birim ${price}, KDV hariç).\n${url}`,
      partsTitle: 'Bu kırıcı için ürettiğimiz parçalar',
      renderAlt: (name, type) => `${name} ${type} kırıcı ucu`,
      sideAlt: (name, type) => `${name} ${type} kırıcı ucu, yandan görünüş`,
      rearAlt: (name) => `${name} kırıcı ucunun kama kanalı ve arka ucu, yakın görünüş`,
      viewRear: 'Kama kanalı ve arka uç',
    },
    search: {
      label: 'Kırıcı modeli ara',
      placeholder: 'Ör. HB 20G, MB 700, Furukawa F22',
      button: 'Ara',
      none: (q) => `"${q}" için model bulunamadı.`,
      count: (n) => `${n} model`,
      brands: 'Markalar',
      all: 'Tüm markalar',
      changeMake: (n) => `Marka değiştir (${n})`,
      didYouMean: (q) => `Bunu mu demek istediniz: ${q}`,
      hint: 'Kırıcınızın marka ve modelini yazın; uyan ürünler burada listelenir.',
    },
    missing: {
      title: 'Modeliniz listede yok mu, emin değil misiniz?',
      body: 'Kırıcınızın marka ve modelini, mümkünse ucun çapını ve bir fotoğrafını WhatsApp’tan gönderin; uyan ucu biz bulalım. Çap, ucun çalışan (ön) kısmında kumpasla ölçülür.',
      button: 'WhatsApp ile sor',
      text: 'Merhaba, kırıcımın markası/modeli: … Ölçtüğüm uç çapı: … mm. Fotoğraf ekliyorum.',
      textFor: (q) =>
        `Merhaba, kırıcımın markası/modeli: ${q}. Ölçtüğüm uç çapı: … mm. Fotoğraf ekliyorum.`,
    },
    qty: {
      less: 'Bir azalt',
      more: 'Bir artır',
      clamped: (max) => `En fazla ${max} adet girilebilir; daha fazlası için bize yazın.`,
    },
    price: {
      label: 'Fiyat',
      fxNote: (date) => `TL fiyatı TCMB döviz satış kuruyla (${date}) hesaplanır.`,
      add: 'Palete yükle',
      added: 'Palete yüklendi',
      goCart: 'Palete git',
      inclVat: (money) => `KDV dahil ≈ ${money}`,
    },
    cart: {
      title: 'Palet',
      empty: 'Paletiniz boş.',
      emptyBody: 'Kırıcı modelinize göre uç veya yedek parça seçin, “Palete yükle” ile ekleyin.',
      browse: 'Yedek parçalara göz atın',
      steps: {
        title: 'Sipariş nasıl verilir?',
        items: [
          {
            h: 'Ürünü seçin',
            p: 'Kırıcı marka ve modelinizi arayın, uç tipini seçip palete yükleyin.',
          },
          {
            h: 'Talebi gönderin',
            p: 'Paleti WhatsApp veya e-posta ile sipariş talebi olarak gönderin; bilgileriniz yalnızca bu mesaja yazılır.',
          },
          {
            h: 'Onay ve kargo',
            p: 'Toplam bedel, kargo ve ödeme bilgilerini içeren sipariş onayını gönderiyoruz; stoktaki ürünler aynı gün kargoya verilir.',
          },
        ],
        note: 'Ayrıntılar:',
      },
      product: 'Ürün',
      qty: 'Adet',
      unit: 'Birim fiyat (KDV hariç)',
      lineTotal: 'Tutar',
      ask: 'Fiyat sorulacak',
      total: 'Toplam (KDV dahil, kargo hariç)',
      subtotal: 'Ara toplam (KDV hariç)',
      vat: (pct) => `KDV (%${pct})`,
      totalNote: 'Fiyatı sorulacak ürünler toplama dahil değildir.',
      remove: (name) => `${name} ürününü paletten indir`,
      removeShort: 'Kaldır',
      removed: (name) => `${name} paletten indirildi.`,
      cleared: 'Palet boşaltıldı.',
      undo: 'Geri al',
      subject: (first, more) =>
        `Sipariş talebi – magaza.kervanbreaker.com – ${first}${more ? ` (+${more})` : ''}`,
      contactTitle: 'İletişim bilgileriniz',
      name: 'Ad soyad',
      company: 'Firma',
      phone: 'Telefon',
      city: 'Şehir',
      note: 'Not',
      sendWa: 'Sipariş talebini WhatsApp ile gönder',
      sendMail: 'E-posta ile gönder',
      clear: 'Paleti boşalt',
      info: 'Online ödeme henüz yok: sipariş talebinizi alınca size dönüyoruz; ödeme kredi kartı veya havale/EFT ile. Stoktaki ürünler ödemeniz bize ulaştığı gün kargoya verilir; kargo ücreti alıcıya aittir ve tutarı sipariş onayında bildirilir. Bilgileriniz yalnız bu mesaja yazılır, sitede saklanmaz.',
      message: (lines, total, contact) =>
        [
          'Merhaba, sipariş talebim:',
          ...lines,
          '',
          total,
          ...(contact.length ? ['', ...contact] : []),
        ].join('\n'),
      line: (name, qty, unit, total, url) =>
        `- ${name}: ${qty} × ${unit}${total ? ` = ${total}` : ''}\n  ${url}`,
    },
    brand: {
      title: (brand) => `${brand} kırıcı uçları`,
      lead: (n) => `${n} model. Kırıcınızın modelini seçin.`,
    },
    terms: {
      title: 'Satış koşulları',
      rows: [
        ['Kalite', 'OEM kalitesinde, orijinal ölçülerde'],
        ['Kargo', 'Alıcıya aittir; tutarı sipariş onayında bildirilir'],
        ['Ödeme', 'Kredi kartı veya havale/EFT'],
        ['Garanti', 'Teslimden itibaren 3 ay, malzeme ve üretim hatalarına karşı'],
      ],
      note: 'Ürünlerimiz Kervan Makina üretimidir, kırıcı üreticisinin orijinal parçası değildir; marka ve model adları yalnızca uyumu belirtir. Garanti malzeme ve üretim (ısıl işlem dahil) hatalarını kapsar; normal aşınma, boşta vuruş, ucu levye gibi kullanma, yanal veya eğik vuruş, aşınmış burç ile çalışma, yağlamasız kullanma ve yanlış uç seçiminden doğan hasarlar kapsam dışıdır. İnceleme için kırık parça ve fotoğrafları istenir.',
    },
    parts: {
      title: 'Kırıcı yedek parçaları',
      lead: 'Kırıcı ucu, alt gövde, burç, kama, saplama, piston, akümülatör parçaları ve aşınma plakası üretip satıyoruz. Kırıcınızın marka ve modelini yazın, fiyatı hemen iletelim.',
      tips: {
        name: 'Kırıcı ucu',
        body: 'Keski, sivri, küt, piramit ve konik uçlar; kırıcı modeline göre.',
      },
      items: {
        'alt-govde': {
          name: 'Alt gövde',
          body: 'Ucu ve burçları taşıyan alt gövde (ön kafa). Aşınmış ya da çatlamış gövdenin yerine.',
        },
        burc: {
          name: 'Burç',
          body: 'Ucu yönlendiren kafa (alt) ve üst burçlar ile dayama burçları; bazı kırıcılarda dayama ve merkezleme tek parçadır. Aşınmış burç ucu erken kırar; uçla birlikte kontrol edin.',
        },
        kama: { name: 'Kama', body: 'Ucu gövdede tutan kamalar ve tutucu pimler.' },
        saplama: {
          name: 'Saplama',
          body: 'Kırıcı gövdesini bir arada tutan saplamalar, somun ve pullarıyla.',
        },
        piston: { name: 'Piston', body: 'Kırıcının darbe pistonu; kırıcı modeline göre.' },
        akumulator: {
          name: 'Akümülatör parçaları',
          body: 'Akümülatör üst ve alt kapakları ile akümülatör saplamaları.',
        },
        'asinma-plakasi': {
          name: 'Aşınma plakası',
          body: 'Kırıcı gövdesini kutu içinde koruyan aşınma plakaları.',
        },
        'tamir-takimi': {
          name: 'Tamir takımı',
          body: 'Kırıcı modeline göre sızdırmazlık takımı: o-ringler, keçeler, toz keçeleri, destek ve teflon ringler; içeriği ve ölçüleriyle.',
        },
      },
      view: 'İncele',
      groupsTitle: 'Ürün grupları',
      fitNote:
        'Ürünlerimiz Kervan Makina üretimidir; marka ve model adları yalnızca uyumu belirtir.',
      plant: {
        title: 'Tesisimiz',
        lead: 'Parçalarımızı Kartepe’deki tesisimizde işliyor, ısıl işlemini kendi fırınlarımızda yapıyoruz.',
        note: 'Fotoğraflar tesisimizde çekilmiştir.',
        items: [
          { caption: 'CNC tezgâhında işleme', alt: 'Kervan tesisinde CNC tezgâhında parça işleme' },
          {
            caption: 'Isıl işlem holü ve fırınlarımız',
            alt: 'Kervan ısıl işlem holünde kuyu tipi fırınlar ve işlenmiş parçalar',
          },
          { caption: 'Raflardaki burç stoğumuz', alt: 'Kervan tesisinde raflarda kırıcı burçları' },
          {
            caption: 'Uç stoğumuz: stoktan aynı gün kargo',
            alt: 'Kervan tesisinde sehpalarda kırıcı uçları',
          },
        ],
      },
      photosAlt: (name) =>
        `Kervan atölyesinde stoktaki kırıcı ${name.toLocaleLowerCase('tr')} parçaları`,
      renderCaption: (model, name) => `${model} ${name.toLocaleLowerCase('tr')}`,
      renderView: {
        front: 'ön görünüş',
        rear: 'arka görünüş',
        side: 'yan görünüş',
        detail: 'saplama somunu penceresi',
        section: 'kesit görünüşü',
        assembly: 'burçları takılı montaj kesiti',
        top: 'üstten görünüş',
      },
      renderKind: {
        toolBushing: 'kafa burcu (alt burç)',
        upperBushing: 'üst burç (merkezleme)',
        thrustRing: 'dayama burcu',
        thrustUpperBushing: 'dayama-merkezleme burcu',
        spacerBushing: 'dayama ara burcu',
        oneBushing: 'tek parça kafa-merkezleme-dayama burcu',
        toolUpperBushing: 'tek parça kafa-merkezleme burcu',
        rockDrillThrustRing: 'kaya delici dayama burcu',
        rockDrillHead: 'kaya delici ön kafası',
        retainerKey: 'kama (tool pin)',
        tieRod: 'boy saplama',
        piston: 'piston',
        retainerPin: 'kama tutucu pim',
        sideBolt: 'yan saplama',
        accumulatorUpper: 'akümülatör üst kapağı',
        accumulatorLower: 'akümülatör alt kapağı',
        accumulatorBolt: 'akümülatör saplaması',
        wearPlate: 'aşınma plakası',
        repairKit: 'tamir takımı',
      },
      renderKindShort: {
        toolBushing: 'Kafa burcu',
        upperBushing: 'Üst burç',
        thrustRing: 'Dayama burcu',
        thrustUpperBushing: 'Dayama-merkezleme',
        spacerBushing: 'Dayama ara burcu',
        oneBushing: 'Tek parça burç',
        toolUpperBushing: 'Kafa-merkezleme',
        rockDrillThrustRing: 'Dayama burcu',
        rockDrillHead: 'Kaya delici',
        retainerKey: 'Kama',
        tieRod: 'Boy saplama',
        piston: 'Piston',
        retainerPin: 'Tutucu pim',
        sideBolt: 'Yan saplama',
        accumulatorUpper: 'Üst kapak',
        accumulatorLower: 'Alt kapak',
        accumulatorBolt: 'Saplama',
        wearPlate: 'Aşınma plakası',
        repairKit: 'Tamir takımı',
      },
      renderVariant: {
        oldType: 'eski tip',
        newType: 'yeni tip',
        roundNut: 'yuvarlak somunlu',
        autoGrease: 'otomatik yağlamalı',
        typeY: 'Y tipi',
        typeE: 'E tipi',
        typeL: 'L tipi',
        typeT: 'T tipi',
        oilGroove: 'yağ kanallı',
        greasingHole: 'yağlama delikli',
        puCoated: 'PU kaplamalı',
      },
      viewer: {
        open: '3B incele',
        close: 'Görsele dön',
        hint: 'Sürükleyerek çevirin, iki parmakla ya da tekerlekle yakınlaştırın; ok tuşlarıyla da çevrilir.',
        loading: '3B model yükleniyor…',
        error: '3B model açılamadı.',
        cut: 'Kesit',
        cutOff: 'Kesiti kapat',
        cutLabel: 'Kesit konumu',
        cutHint: 'Sürgüyü sağa sola kaydırın: parça baştan sona kesilerek iç yapısı görünür.',
      },
      series: {
        title: (series) => `${series} modelleri`,
        hint: 'Modeli seçmek için yana kaydırın.',
        prev: 'Önceki model',
        next: 'Sonraki model',
        jump: 'Markaya git',
      },
      kit: {
        title: 'Takımın içeriği',
        part: 'Parça',
        qty: 'Adet',
        note: 'Takım, kırıcınızın modeline göre eksiksiz hazırlanır; teklifte modeli belirtmeniz yeterli.',
        oem: 'Kırıcı modeline göre eksiksiz hazırlanan sızdırmazlık takımı.',
        renderNote: 'Görseller 3B modeldir; temsilidir.',
        type: {
          oring: 'O-ring',
          backup: 'Destek ringi',
          stepseal: 'Basamaklı keçe',
          rodseal: 'Keçe (nutring)',
          wiper: 'Toz keçesi',
          gasseal: 'Gaz keçesi',
          guidering: 'Kılavuz ring',
          teflonring: 'Teflon ring',
          bondedseal: 'Sızdırmazlık pulu',
          plug: 'Tapa',
          valve: 'Valf',
          other: 'Diğer',
        },
      },
      showcase: {
        title: 'Ürettiklerimizden',
        lead: 'Kendi çizimlerimizden modellenmiş parçalar. Marka ve modelinizi yazınca o kırıcının parçaları açılır.',
        alt: (part, i) => `${part} örneği ${i}`,
      },
      tipLink: 'Bu kırıcının ucu',
      quoteThis: 'Bu model için teklif iste',
      item: {
        pageLink: 'Parça sayfası',
        share: 'Bağlantıyı paylaş',
        copied: 'Bağlantı kopyalandı',
        copyFailed: (url) => `Bağlantıyı kopyalayın: ${url}`,
        whatsappSend: "Bu parçayı WhatsApp'ta gönder",
        back: (group) => `Tüm ${group.toLocaleLowerCase('tr')} modelleri`,
        related: 'Bu kırıcı için ürettiğimiz diğer parçalar',
        linksLabel: 'Parça bağlantıları',
      },
      fitted: {
        label: 'Seçenek',
        without: 'Burçsuz',
        with: 'Burçlu',
        withNote: 'Burçlar ve pimler takılı',
        name: (part, withB) => `${withB ? 'burçlu' : 'burçsuz'} ${part.toLocaleLowerCase('tr')}`,
      },
      quoteTitle: 'Fiyat teklifi isteyin',
      quoteBody: 'Kırıcınızın marka ve modelini yazın; mesaja eklenir.',
      modelLabel: 'Kırıcı marka ve modeli',
      modelPlaceholder: 'Ör. Furukawa HB 20G',
      text: (part, model, qty) =>
        model
          ? `Merhaba, ${model} için ${part.toLocaleLowerCase('tr')}, ${qty} adet için fiyat almak istiyorum.`
          : `Merhaba, ${part.toLocaleLowerCase('tr')}, ${qty} adet için fiyat almak istiyorum. Kırıcımın marka ve modeli: …`,
      noPhoto: 'Fotoğraf yakında',
    },
    imgNote: 'Görseller temsilidir.',
    renderNote: 'Kendi çizimlerimizden 3B görseller; temsilidir.',
    photoNote: 'Atölyemizdeki stoktan, gerçek fotoğraflar.',
    oem: 'OEM / orijinal kalitesinde, orijinal ölçülerde üretilir.',
    legal: {
      nav: 'Yasal metinler',
      agree: 'Sipariş talebi göndererek aşağıdaki metinleri okuduğunuzu kabul edersiniz:',
      and: 've',
      toc: 'İçindekiler',
      updated: (d) => `Son güncelleme: ${d}`,
      binding: '',
      others: 'Diğer yasal metinler',
    },
    footer: {
      legal: 'Üretici ve satıcı',
      docs: 'Yasal',
      shop: 'Mağaza',
      company: 'Kurumsal',
      contact: 'İletişim',
      about:
        'Kartepe / Kocaeli’de hidrolik kırıcı yedek parça üretimi; ısıl işlem kendi tesisimizde.',
      fit: 'Kırıcı marka ve model adları yalnızca uyumu belirtir; ürünlerimiz kırıcı üreticisinin orijinal parçası değildir.',
      fax: 'Faks',
      images:
        '© Kervan Makina. Ürün görselleri Kervan Makina’ya aittir, temsilidir; izinsiz kullanılamaz.',
    },
    notFound: {
      title: 'Sayfa bulunamadı (404)',
      body: 'Aradığınız sayfa yok ya da taşındı. Kırıcı modelinizi arayın veya ürün gruplarımıza göz atın.',
      home: 'Ana sayfaya dön',
      ask: 'WhatsApp’tan sorun',
    },
  },
  en: {
    meta: {
      siteName: 'Kervan Shop',
      homeTitle: 'Hydraulic breaker spare parts | Kervan Shop',
      homeDesc:
        'Hydraulic breaker spare parts made by Kervan: tips, front heads, bushings, retainer keys, tie rods, pistons and more, by breaker make and model.',
      listTitle: 'All breaker tips | Kervan Shop',
      listDesc:
        'All Kervan breaker tips by breaker make and model: working diameter and tip types.',
      familyTitle: (code, d) => `${code} breaker tip Ø${d} | Kervan Shop`,
      familyDesc: (code, d, types) => `${code}: Ø${d} mm breaker tip (${types}).`,
      breakerTitle: (name, d) => `${name} breaker tip${d ? ` Ø${d}` : ''} | Kervan Shop`,
      breakerDesc: (name, d, types) =>
        `Kervan tip for the ${name} hydraulic breaker: ${d ? `Ø${d} mm, ` : ''}${types}.`,
      notFoundTitle: 'Page not found | Kervan Shop',
      popularTitle: 'Best-selling breaker tips | Kervan Shop',
      popularDesc: 'The most ordered Kervan breaker tips, by breaker make and model.',
      brandTitle: (brand) => `${brand} breaker tips | Kervan Shop`,
      brandDesc: (brand, n) => `Kervan tips for ${brand} hydraulic breakers: ${n} models.`,
      partsTitle: 'Breaker spare parts | Kervan Shop',
      partsDesc:
        'Hydraulic breaker tips, front heads, bushings, retainer keys, tie rods, pistons, accumulator parts and wear plates made by Kervan.',
      partTitle: (name) => `Breaker ${name.toLowerCase()} | Kervan Shop`,
      partDesc: (name) =>
        `Hydraulic breaker ${name.toLowerCase()} made by Kervan; quotes by breaker model.`,
      partItemTitle: (caption) => `${caption} | Kervan Shop`,
      partItemDesc: (caption) =>
        `${caption}: hydraulic breaker spare part made by Kervan. Write to us for a quote.`,
      cartTitle: 'Cart | Kervan Shop',
    },
    nav: {
      label: 'Main menu',
      popular: 'Best sellers',
      catalogSite: 'Company',
      quote: 'Request a quote',
      quoteShort: 'Quote',
      quoteText: 'Hello, I would like a quote for a breaker spare part.',
      quoteTextFor: (name) => `Hello, I have a question about the tip for the ${name} breaker.`,
      skip: 'Skip to content',
      groups: {
        tips: 'Tips',
        'alt-govde': 'Front heads',
        burc: 'Bushings',
        kama: 'Keys',
        saplama: 'Tie rods',
        piston: 'Pistons',
        akumulator: 'Accumulator',
        'asinma-plakasi': 'Wear plates',
        'tamir-takimi': 'Repair kits',
      },
      call: 'Call',
      cart: 'Cart',
      langLabel: 'Türkçe',
      langOther: 'TR',
      tools: 'Quick links',
      theme: { label: 'Theme', auto: 'Auto', light: 'Light', dark: 'Dark' },
    },
    top: {
      tagline: 'Hydraulic breaker spare parts maker',
      shop: 'Breaker spare parts shop',
    },
    banner: {
      label: 'Order request:',
      preview:
        'no online payment yet; send your cart by WhatsApp or e-mail and we will get back to you.',
      how: 'How to order',
      demo: 'DEMO data: these products are not real.',
    },
    tip: {
      chisel: 'Chisel',
      moil: 'Moil',
      blunt: 'Blunt',
      pyramid: 'Pyramid',
      conical: 'Conical',
      asphalt: 'Asphalt',
    },
    home: {
      title: 'Hydraulic breaker spare parts',
      lead: 'Tips, front heads, bushings, retainer keys, tie rods, pistons and other parts, machined on our own lathes, the steel ones heat-treated in our own plant. Search your breaker make and model and pick the part that fits. Ships from stock the same day.',
      cta: 'All breaker tips',
      ctaQuote: 'Request a quote',
      popular: 'Best sellers',
      featured: 'Breaker tips',
      morePopular: 'All best sellers',
      groups: 'Our product groups',
      count: (n) => `${n} breaker models`,
      heroCaption: (c) => `${c} · rendered from our own drawing`,
      heroMore: 'Other parts',
      allGroups: 'All spare parts',
      makes: {
        title: 'Compatible breaker makes',
        lead: 'Pick your breaker’s make to see its models.',
        all: (n) => `All makes (${n})`,
        count: (n) => `${n} models`,
        note: 'Our products are made by Kervan Makina and are not the breaker maker’s original parts; make and model names only show the fit.',
      },
      trust: [
        {
          title: 'Our own production',
          body: 'Machined in our plant in Kartepe, Türkiye, to original dimensions and OEM quality; no middlemen.',
        },
        {
          title: 'Our own heat treatment',
          body: 'Heat-treated in our own furnaces, under control.',
        },
        {
          title: 'Chosen by model',
          body: 'Pick your breaker make and model and see the tip that fits.',
        },
        {
          title: 'Ships from stock the same day',
          body: 'Tips in stock ship the day your payment reaches us.',
        },
      ],
      sectors: {
        title: 'Which tip do people doing your work choose?',
        lead: 'The tip types companies doing the same work usually choose on site.',
        typesLabel: 'Usually chosen',
        note: 'General site practice; the breaker maker’s recommendation comes first.',
        items: [
          {
            name: 'Quarrying',
            body: 'Breaking hard rock and oversize boulders.',
            types: ['pyramid', 'conical', 'blunt'],
          },
          { name: 'Mining', body: 'Ore and hard rock; high wear.', types: ['conical', 'moil'] },
          {
            name: 'Demolition',
            body: 'Reinforced concrete and foundations.',
            types: ['moil', 'chisel'],
          },
          {
            name: 'Utilities and excavation',
            body: 'Trenching, layered ground and asphalt.',
            types: ['chisel', 'asphalt', 'moil'],
          },
        ],
      },
    },
    card: { view: 'View tip' },
    breaker: { title: (name) => `${name} breaker tip` },
    list: {
      title: 'All breaker tips',
      lead: 'Type your breaker make and model. The most ordered tips have their own page.',
      model: 'Breaker',
      diameter: 'Working diameter',
      types: 'Tip types',
    },
    popular: {
      title: 'Best sellers',
      lead: 'The most ordered breaker tips and the spare parts we make for the same breakers, mixed.',
      tips: 'Breaker tips',
      parts: 'Spare parts for the best-selling breakers',
      partsLead:
        'Parts we make for the breaker models whose tips are ordered most; not a ranking of part sales.',
    },
    family: {
      kicker: (d) => `Ø${d} mm hydraulic breaker tip`,
      crumbHome: 'Home',
      crumbLabel: 'Breadcrumb',
      diameter: 'Working diameter',
      type: 'Tip type',
      qty: 'Quantity',
      stockTitle: 'From our stock',
      stockNote: 'Breaker tips in stock at our plant.',
      stockAlt: (i) => `Breaker tips in stock at the Kervan plant (${i})`,
      angle: 'Tip angle',
      availability: 'Availability',
      inStock: (n) => (n >= 10 ? 'In stock (10+)' : `In stock (${n})`),
      lead: (days) => `Made to order, ~${days} working days`,
      ask: 'Price on request',
      askLead: 'Ships from stock the same day',
      carrier: 'Carrier (approx.)',
      carrierValue: (min, max) => `${min}–${max} t excavator`,
      carrierNote: 'Approximate; the breaker maker’s recommendation wins.',
      quoteTitle: 'Request a quote',
      quoteBody: 'Your breaker and the tip you chose go into the message; we reply right away.',
      whatsapp: 'Ask on WhatsApp',
      email: 'Send an e-mail',
      orderTitle: 'Place an order',
      orderBody:
        'Your breaker, the tip, quantity and price go into the message; we reply with payment and shipping details.',
      orderWa: 'Order on WhatsApp',
      orderMail: 'Order by e-mail',
      quoteText: (name, type, code, qty, url) =>
        `Hello, I would like a quote for the ${type} tip${code ? ` (${code})` : ''} for the ${name}, quantity ${qty}.\n${url}`,
      orderText: (name, type, code, qty, price, url) =>
        `Hello, I would like to order the ${type} tip${code ? ` (${code})` : ''} for the ${name}, quantity ${qty} (unit ${price}, excl. VAT).\n${url}`,
      partsTitle: 'Parts we make for this breaker',
      renderAlt: (name, type) => `${name} ${type} breaker tip`,
      sideAlt: (name, type) => `${name} ${type} breaker tip, side view`,
      rearAlt: (name) => `${name} breaker tip key slot and rear end, close-up`,
      viewRear: 'Key slot and rear end',
    },
    search: {
      label: 'Search breaker model',
      placeholder: 'E.g. HB 20G, MB 700, Furukawa F22',
      button: 'Search',
      none: (q) => `No model found for "${q}".`,
      count: (n) => `${n} models`,
      brands: 'Makes',
      all: 'All makes',
      changeMake: (n) => `Change make (${n})`,
      didYouMean: (q) => `Did you mean: ${q}`,
      hint: 'Type your breaker make and model; the matching products are listed here.',
    },
    missing: {
      title: 'Model not listed, or not sure?',
      body: 'Send your breaker make and model, if possible the tip diameter and a photo, on WhatsApp; we will find the tip that fits. Measure the diameter with a caliper on the working (front) part of the tip.',
      button: 'Ask on WhatsApp',
      text: 'Hello, my breaker make/model: … Tip diameter I measured: … mm. Photo attached.',
      textFor: (q) =>
        `Hello, my breaker make/model: ${q}. Tip diameter I measured: … mm. Photo attached.`,
    },
    qty: {
      less: 'One less',
      more: 'One more',
      clamped: (max) => `At most ${max} pieces; write to us for more.`,
    },
    price: {
      label: 'Price',
      fxNote: (date) => `TRY prices use the CBRT USD selling rate of ${date}.`,
      add: 'Add to cart',
      added: 'Added to cart',
      goCart: 'Go to cart',
      inclVat: (money) => `incl. VAT ≈ ${money}`,
    },
    cart: {
      title: 'Cart',
      empty: 'Your cart is empty.',
      emptyBody: 'Choose a tip or spare part by breaker model and add it with “Add to cart”.',
      browse: 'Browse spare parts',
      steps: {
        title: 'How to order',
        items: [
          {
            h: 'Choose the part',
            p: 'Search your breaker make and model, pick the tip type and add it to the cart.',
          },
          {
            h: 'Send the request',
            p: 'Send the cart as an order request by WhatsApp or e-mail; your details only go into that message.',
          },
          {
            h: 'Confirmation and shipping',
            p: 'We send an order confirmation with the total, shipping and payment details; stock items ship the same day.',
          },
        ],
        note: 'Details:',
      },
      product: 'Product',
      qty: 'Qty',
      unit: 'Unit price (excl. VAT)',
      lineTotal: 'Amount',
      ask: 'Price on request',
      total: 'Total (incl. VAT, excl. shipping)',
      subtotal: 'Subtotal (excl. VAT)',
      vat: (pct) => `VAT (${pct}%)`,
      totalNote: 'Products priced on request are not in the total.',
      remove: (name) => `Remove ${name} from the cart`,
      removeShort: 'Remove',
      removed: (name) => `${name} removed from the cart.`,
      cleared: 'Cart emptied.',
      undo: 'Undo',
      subject: (first, more) =>
        `Order request – magaza.kervanbreaker.com – ${first}${more ? ` (+${more})` : ''}`,
      contactTitle: 'Your contact details',
      name: 'Name',
      company: 'Company',
      phone: 'Phone',
      city: 'City',
      note: 'Note',
      sendWa: 'Send the order request on WhatsApp',
      sendMail: 'Send by e-mail',
      clear: 'Empty the cart',
      info: 'No online payment yet: once we receive your request we get back to you; payment by credit card or bank transfer. Items in stock ship the day your payment reaches us; shipping is paid by the buyer and the amount is given in the order confirmation. Your details only go into this message; the site does not store them.',
      message: (lines, total, contact) =>
        [
          'Hello, my order request:',
          ...lines,
          '',
          total,
          ...(contact.length ? ['', ...contact] : []),
        ].join('\n'),
      line: (name, qty, unit, total, url) =>
        `- ${name}: ${qty} × ${unit}${total ? ` = ${total}` : ''}\n  ${url}`,
    },
    brand: {
      title: (brand) => `${brand} breaker tips`,
      lead: (n) => `${n} models. Pick your breaker model.`,
    },
    terms: {
      title: 'Terms of sale',
      rows: [
        ['Quality', 'OEM quality, original dimensions'],
        ['Shipping', 'Paid by the buyer; the amount is given in the order confirmation'],
        ['Payment', 'Credit card or bank transfer'],
        ['Warranty', '3 months from delivery, against material and manufacturing defects'],
      ],
      note: 'Our products are made by Kervan Makina and are not the breaker maker’s original parts; make and model names only show the fit. The warranty covers material and manufacturing (including heat treatment) defects; normal wear, blank firing, prying with the tip, side or angled strikes, working with a worn bushing, running without grease and choosing the wrong tip are not covered. We ask for the broken part and photos to assess a claim.',
    },
    parts: {
      title: 'Breaker spare parts',
      lead: 'We make and sell breaker tips, front heads, bushings, retainer keys, tie rods, pistons, accumulator parts and wear plates. Send your breaker make and model and we reply with the price right away.',
      tips: {
        name: 'Breaker tips',
        body: 'Chisel, moil, blunt, pyramid and conical tips, by breaker model.',
      },
      items: {
        'alt-govde': {
          name: 'Front head',
          body: 'The lower body that holds the tip and bushings; replaces a worn or cracked one.',
        },
        burc: {
          name: 'Bushings',
          body: 'Tool (lower) and upper bushings that guide the tip, and thrust rings; on some breakers the thrust ring and upper bushing are one piece. A worn bushing breaks tips early; check them with the tip.',
        },
        kama: {
          name: 'Retainer keys',
          body: 'Keys and retainer pins that hold the tip in the front head.',
        },
        saplama: {
          name: 'Tie rods',
          body: 'Tie rods that hold the breaker body together, with nuts and washers.',
        },
        piston: { name: 'Pistons', body: 'The breaker’s impact piston, by breaker model.' },
        akumulator: {
          name: 'Accumulator parts',
          body: 'Accumulator covers (upper and lower) and accumulator bolts.',
        },
        'asinma-plakasi': {
          name: 'Wear plates',
          body: 'Wear plates that protect the breaker body inside its box.',
        },
        'tamir-takimi': {
          name: 'Repair kits',
          body: 'Seal kits by breaker model: o-rings, rod seals, wipers, back-up and PTFE rings, with their contents and sizes.',
        },
      },
      view: 'View',
      groupsTitle: 'Product groups',
      fitNote: 'Our products are made by Kervan Makina; make and model names only show the fit.',
      plant: {
        title: 'Our plant',
        lead: 'We machine our parts in our plant in Kartepe and heat-treat them in our own furnaces.',
        note: 'Photos taken at our plant.',
        items: [
          {
            caption: 'CNC machining',
            alt: 'Machining a part on a CNC machine at the Kervan plant',
          },
          {
            caption: 'Heat-treatment hall and furnaces',
            alt: 'Pit furnaces and machined parts in the Kervan heat-treatment hall',
          },
          {
            caption: 'Bushing stock on the shelves',
            alt: 'Breaker bushings on shelves at the Kervan plant',
          },
          {
            caption: 'Tip stock: same-day shipping from stock',
            alt: 'Breaker tips on racks at the Kervan plant',
          },
        ],
      },
      photosAlt: (name) => `${name} in stock at the Kervan plant`,
      renderCaption: (model, name) => `${model} ${name.toLowerCase()}`,
      renderView: {
        front: 'front view',
        rear: 'rear view',
        side: 'side view',
        detail: 'tie-rod nut window',
        section: 'section view',
        assembly: 'section with the bushings fitted',
        top: 'top view',
      },
      renderKind: {
        toolBushing: 'tool bushing (lower bushing)',
        upperBushing: 'upper bushing',
        thrustRing: 'thrust ring',
        thrustUpperBushing: 'thrust ring and upper bushing (one piece)',
        spacerBushing: 'thrust ring spacer',
        oneBushing: 'one-piece tool, upper and thrust bushing',
        toolUpperBushing: 'one-piece tool and upper bushing',
        rockDrillThrustRing: 'rock drill thrust ring',
        rockDrillHead: 'rock drill front head',
        retainerKey: 'retainer key (tool pin)',
        tieRod: 'through bolt',
        piston: 'piston',
        retainerPin: 'retainer pin',
        sideBolt: 'side bolt',
        accumulatorUpper: 'accumulator cover',
        accumulatorLower: 'accumulator bottom',
        accumulatorBolt: 'accumulator bolt',
        wearPlate: 'wear plate',
        repairKit: 'repair kit',
      },
      renderKindShort: {
        toolBushing: 'Tool bushing',
        upperBushing: 'Upper bushing',
        thrustRing: 'Thrust ring',
        thrustUpperBushing: 'Thrust + upper',
        spacerBushing: 'Thrust ring spacer',
        oneBushing: 'One-piece',
        toolUpperBushing: 'Tool + upper',
        rockDrillThrustRing: 'Thrust ring',
        rockDrillHead: 'Rock drill',
        retainerKey: 'Retainer key',
        tieRod: 'Through bolt',
        piston: 'Piston',
        retainerPin: 'Retainer pin',
        sideBolt: 'Side bolt',
        accumulatorUpper: 'Cover',
        accumulatorLower: 'Bottom',
        accumulatorBolt: 'Bolt',
        wearPlate: 'Wear plate',
        repairKit: 'Repair kit',
      },
      renderVariant: {
        oldType: 'old type',
        newType: 'new type',
        roundNut: 'round nuts',
        autoGrease: 'auto-grease',
        typeY: 'Y type',
        typeE: 'E type',
        typeL: 'L type',
        typeT: 'T type',
        oilGroove: 'oil grooves',
        greasingHole: 'greasing hole',
        puCoated: 'PU-coated',
      },
      viewer: {
        open: 'View in 3D',
        close: 'Back to the picture',
        hint: 'Drag to turn, pinch or scroll to zoom; the arrow keys turn it too.',
        loading: 'Loading the 3D model…',
        error: 'The 3D model could not be opened.',
        cut: 'Section',
        cutOff: 'Hide the section',
        cutLabel: 'Section position',
        cutHint: 'Move the slider left and right to cut the part from end to end and see inside.',
      },
      series: {
        title: (series) => `${series} models`,
        hint: 'Swipe sideways to pick a model.',
        prev: 'Previous model',
        next: 'Next model',
        jump: 'Jump to make',
      },
      kit: {
        title: 'Kit contents',
        part: 'Part',
        qty: 'Qty',
        note: 'The kit is put together complete for your breaker model; just name the model in your request.',
        oem: 'A complete seal kit put together for the breaker model.',
        renderNote: 'Pictures are 3D models; for illustration.',
        type: {
          oring: 'O-ring',
          backup: 'Back-up ring',
          stepseal: 'Step seal',
          rodseal: 'Rod seal',
          wiper: 'Wiper',
          gasseal: 'Gas seal',
          guidering: 'Guide ring',
          teflonring: 'PTFE ring',
          bondedseal: 'Bonded seal',
          plug: 'Plug',
          valve: 'Valve',
          other: 'Other',
        },
      },
      showcase: {
        title: 'Some of what we make',
        lead: 'Parts modelled from our own drawings. Type your make and model to open that breaker’s parts.',
        alt: (part, i) => `${part} example ${i}`,
      },
      tipLink: 'Tip for this breaker',
      quoteThis: 'Request a quote for this model',
      item: {
        pageLink: 'Part page',
        share: 'Share link',
        copied: 'Link copied',
        copyFailed: (url) => `Copy the link: ${url}`,
        whatsappSend: 'Send this part on WhatsApp',
        back: (group) => `All ${group.toLowerCase()} models`,
        related: 'Other parts we make for this breaker',
        linksLabel: 'Part links',
      },
      fitted: {
        label: 'Option',
        without: 'Without bushings',
        with: 'With bushings',
        withNote: 'Bushings and pins fitted',
        name: (part, withB) =>
          `${part.toLowerCase()} ${withB ? 'with' : 'without'} bushings and pins`,
      },
      quoteTitle: 'Request a quote',
      quoteBody: 'Type your breaker make and model; it goes into the message.',
      modelLabel: 'Breaker make and model',
      modelPlaceholder: 'E.g. Furukawa HB 20G',
      text: (part, model, qty) =>
        model
          ? `Hello, I would like the price of ${part.toLowerCase()} for the ${model}, quantity ${qty}.`
          : `Hello, I would like the price of ${part.toLowerCase()}, quantity ${qty}. My breaker make and model: …`,
      noPhoto: 'Photo coming soon',
    },
    imgNote: 'Images are for illustration.',
    renderNote: '3D images from our own drawings; for illustration.',
    photoNote: 'Real photos of our stock at the plant.',
    oem: 'Made to OEM / original quality and original dimensions.',
    legal: {
      nav: 'Legal',
      agree: 'By sending an order request you confirm you have read:',
      and: 'and',
      toc: 'Contents',
      updated: (d) => `Last updated: ${d}`,
      binding: 'This is a translation; the Turkish text is binding.',
      others: 'Other legal texts',
    },
    footer: {
      legal: 'Manufacturer and seller',
      docs: 'Legal',
      shop: 'Shop',
      company: 'Company',
      contact: 'Contact',
      about:
        'Hydraulic breaker spare parts made in Kartepe / Kocaeli, heat-treated in our own plant.',
      fit: 'Breaker make and model names only show the fit; our products are not the breaker maker’s original parts.',
      fax: 'Fax',
      images:
        '© Kervan Makina. Product images belong to Kervan Makina and are illustrations; do not use without permission.',
    },
    notFound: {
      title: 'Page not found (404)',
      body: 'The page does not exist or has moved. Search your breaker model or browse our product groups.',
      home: 'Back to the home page',
      ask: 'Ask on WhatsApp',
    },
  },
};
