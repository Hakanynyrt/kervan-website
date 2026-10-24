import type { OrgSocialKey } from '@kervan/seo';
import type { TipType } from '@kervan/tips';
import type { PartKey } from './routes';
import type { Lang } from '../types';
import type { PartFilter } from './part-filters';
import type { PartRender, RenderView } from './photos';

export interface Dict {
  meta: {
    /** og:site_name and the WebSite JSON-LD name: one name everywhere, the one the titles end in
     *  (Google's site name follows it; differing names make it fall back to the domain). */
    siteName: string;
    /** Brand after the "|" in page titles (the maker people search for). */
    brand: string;
    homeTitle: string;
    homeDesc: string;
    listTitle: string;
    listDesc: string;
    familyTitle: (code: string, d: string) => string;
    familyDesc: (code: string, d: string, types: string) => string;
    breakerTitle: (name: string, d: string) => string;
    /** `alias`: at most one other spelling of the model (the no-space form, "HB20G"); the full
     *  list is on the page only. */
    breakerDesc: (name: string, d: string, types: string, alias: string | null) => string;
    notFoundTitle: string;
    popularTitle: string;
    popularDesc: string;
    brandTitle: (brand: string) => string;
    brandDesc: (brand: string, n: number) => string;
    partsTitle: string;
    partsDesc: string;
    partTitle: (name: string) => string;
    /** `kit`: repair kits are put together for the breaker, not made by us. */
    partDesc: (name: string, kit: boolean) => string;
    /** One modelled part's own page: caption = "Montabert BRV 32 piston". */
    partItemTitle: (caption: string) => string;
    /** `priced`: the page shows a price (order), else a quote. */
    partItemDesc: (caption: string, o: { kit: boolean; priced: boolean }) => string;
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
    /** Phone call on the phones' bottom bar ("Telefon": "Ara" is the search button). */
    call: string;
    cart: string;
    /** Shown once, next to the header's cart link: "(sepetiniz)", since "palet" is the owner's word. */
    cartHint: string;
    /** The header cart link's accessible name, with the number of items once known. */
    cartLabel: (n: number) => string;
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
    morePopular: string;
    groups: string;
    /** Opening strip: our parts of one breaker side by side, each linking to its group. */
    pick: {
      alt: string;
      caption: string;
      listLabel: string;
      tips: string;
    };
    allGroups: string;
    /** "Önce arama": the make/model finder and the panel listing the chosen model's parts. */
    finder: {
      title: string;
      makes: string;
      allMakes: (n: number) => string;
      models: (make: string) => string;
      allModels: (make: string, n: number) => string;
      found: string;
      /** Under the model chips: the names only show the fit. */
      note: string;
      /** Panel before a model is picked. */
      startTitle: string;
      startBody: string;
      popular: string;
      /** Panel for a picked model. */
      forModel: string;
      breakerPage: string;
      noParts: string;
      /** Tip rows of a breaker with several tip sizes. */
      tipN: (n: number) => string;
    };
    /** "Ürettiklerimizden": priced tips and parts, linked to their pages. */
    made: { title: string; lead: string };
    /** "Nasıl sipariş verilir?": the steps (cart.steps) and the contact box. */
    order: { body: string; whatsapp: string; mail: string };
    trust: { title: string; body: string }[];
  };
  card: { view: string };
  /** A tip size: the working diameter only (owner, 2026-10-23: never the length), plus an
   *  ordinal when a breaker has two tips of one diameter (`sizeOrdinals` in tip-options.ts). */
  tipSize: (d: string, ord: number | null) => string;
  breaker: {
    title: (name: string) => string;
    /** Under the title: other spellings of the model the catalogue merged into this page. */
    aliases: (list: string) => string;
    /** Model facts from the catalogue: sizes, tip types, carrier class, the parts we make. */
    facts: {
      title: (name: string) => string;
      size: string;
      types: string;
      carrier: string;
      parts: string;
    };
  };
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
    /** One sentence under the lead: we make tools with dust grooves for some breakers (no model named). */
    groovedHint: string;
    /** Badge on a result row whose breaker has tools with dust grooves; link to the section. */
    groovedBadge: string;
    /** Brand page cards: net list price (or span) and the note under it; no price yet. */
    /** Next to a card's price: "+ vergiler" in Turkish (net prices), "export price" in English. */
    priceNote: string;
    priceAsk: string;
    /** On a card whose picture is another breaker's tip. */
    sampleBadge: string;
    /** A model card's picture: its own tip, or (`sample`) another breaker's as a sample. */
    cardAlt: (name: string, sample: boolean) => string;
    /** Under a page of model cards: shows the next page. */
    more: (left: number) => string;
    groovedBadgeLabel: (name: string) => string;
  };
  family: {
    kicker: (d: string) => string;
    crumbHome: string;
    crumbLabel: string;
    diameter: string;
    type: string;
    /** Chips of a breaker that takes tips of two sizes. */
    size: string;
    qty: string;
    stockTitle: string;
    stockNote: string;
    stockAlt: (i: number) => string;
    /** Tools with dust grooves we model for the breaker (`SPECIAL_TOOLS`, kind `grooved`). */
    groovedTitle: string;
    groovedNote: string;
    groovedAlt: (type: string, special?: boolean) => string;
    /** Line under the type selector, jumping to the dust-groove section. */
    groovedJump: string;
    /** The same section when the breaker also has other special tools (relieved). */
    specialTitle: string;
    specialNote: string;
    specialJump: string;
    /** Relieved ("boşaltmalı") tool of a tip type. */
    relievedAlt: (type: string) => string;
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
    /** Extra products: caption and alt of the sample picture (another breaker's tip). */
    sample: (name: string) => string;
    /** `name`: this page's model; `sample`: the breaker whose tip the picture shows. */
    sampleAlt: (name: string, sample: string) => string;
    /** The owner's real photos of the model's tips (`BREAKER_PHOTOS`): caption, and alt of the n-th (1-based). */
    realPhoto: (name: string) => string;
    realPhotoAlt: (name: string, n: number) => string;
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
    /** Results narrowed by the filters: n of the total the typed search found. */
    countFiltered: (n: number, total: number) => string;
    /** Narrowing filters, shown only for a typed search's results. */
    filter: {
      label: string;
      type: string;
      carrier: string;
      /** Diameter band `from` ≤ Ø < `below` mm (0 / Infinity at the ends), with tonnage when known. */
      band: (from: number, below: number, tons: { min: number; max: number } | null) => string;
      /** Short form for the WhatsApp message. */
      bandShort: (from: number, below: number, tons: { min: number; max: number } | null) => string;
      grooved: string;
      all: string;
      clear: string;
      /** The filters leave nothing of the n results the typed search found. */
      none: (n: number) => string;
    };
  };
  missing: {
    title: string;
    body: string;
    button: string;
    text: string;
    /** `filters`: a short summary of the narrowing filters, if any. */
    textFor: (q: string, filters?: string) => string;
  };
  qty: { less: string; more: string; clamped: (max: number) => string };
  price: {
    label: string;
    fxNote: (date: string) => string;
    add: string;
    added: string;
    goCart: string;
    /** Second, smaller figure next to the net price. */
    /** After the price on item pages ("+ vergiler"; empty in English). */
    plus: string;
    /** Under the price on item pages and the cart: empty in Turkish, the export / shipping note in English. */
    note: string;
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
    /** English cart only (international orders): required, goes into the order message. */
    country: string;
    /** After a required field's label. */
    required: string;
    countryMissing: string;
    /** English cart only: one line on international shipping, from facts stated elsewhere. */
    intlNote: string;
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
  terms: {
    title: string;
    /** Fit, shipping, payment; the warranty row follows (`warranty` / `warrantyAll`). */
    rows: [string, string][];
    warrantyLabel: string;
    /** One product's warranty row, by months from `warrantyMonths` (`src/lib/warranty.ts`). */
    warranty: (months: number) => string;
    /** Where no single product is meant (home order box): both periods. */
    warrantyAll: string;
    note: string;
  };
  parts: {
    title: string;
    lead: string;
    tips: { name: string; body: string };
    /** `h1`: the group page's heading ("Hidrolik kırıcı burcu"); `name` stays short (nav, crumbs). */
    items: Record<PartKey, { name: string; h1: string; body: string }>;
    /** Picture of a part-group card (home, parts page). */
    groupAlt: (h1: string) => string;
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
    /** "Parça türü" chips on a group page (`part-filters.ts`). */
    filter: { label: string; all: string; items: Record<PartFilter, string> };
    /** RenderGallery: a part's pictures in one frame with thumbnails. */
    gallery: {
      label: string;
      prev: string;
      next: string;
      count: (i: number, n: number) => string;
      hero: string;
      heroShort: string;
      short: Record<RenderView, string>;
      /** Alt text of a part picture: "Rammer E68 alt gövde, ön görünüş" (cards use `hero`). */
      alt: (caption: string, view: string) => string;
    };
    viewer: {
      open: string;
      close: string;
      hint: string;
      loading: string;
      error: string;
      cut: string;
      cutOff: string;
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
    /** Group page before a search: every part as a picture card, a page of them at a time. */
    showcase: { title: string; lead: string; more: (left: number) => string };
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
    /** Genuine OEM numbers of the part ours replaces (owner's decision), cross-reference only. */
    oemRef: {
      label: string;
      /** Item page: what the numbers are for. */
      note: string;
    };
    /** Priced parts of breakers we have not modelled: a search shows them with a sample picture. */
    listed: {
      title: string;
      lead: string;
      sample: string;
      /** The owner's part types (PART_TYPES codes), as a part name. */
      type: Record<string, string>;
    };
    /** Priced parts: order instead of a quote. */
    order: {
      title: string;
      body: string;
      wa: string;
      mail: string;
      delivery: string;
      /** The order message (unit price as shown, net). */
      text: (part: string, breaker: string, qty: number, price: string, url: string) => string;
      /** Under a priced part: a quote for another breaker on the group page. */
      other: string;
      /** Tie rods are sold as a set (owner): the price includes the nuts and washers. */
      withNuts: string;
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
    /** Reopens the cookie banner (ConsentBanner). */
    cookies: string;
    /** Heading over the social profile links. */
    social: string;
    /** aria-label of each social profile link (icon only). */
    socials: Record<OrgSocialKey, string>;
  };
  /** Cookie banner for Google Ads measurement (ConsentBanner). */
  consent: { title: string; body: string; accept: string; reject: string; policy: string };
  notFound: { title: string; body: string; home: string; ask: string };
}

export const DICT: Record<Lang, Dict> = {
  tr: {
    meta: {
      siteName: 'Kervan Makina',
      brand: 'Kervan Makina',
      homeTitle: 'Kırıcı yedek parça ve kırıcı ucu | Kervan Makina',
      homeDesc:
        'Hidrolik kırıcı yedek parça: kırıcı ucu, alt gövde, burç, kama, saplama, piston, aşınma plakası ve tamir takımı, marka ve modele göre. Stoktan aynı gün kargo.',
      listTitle: 'Kırıcı ucu: marka ve modele göre | Kervan Makina',
      listDesc:
        'Hidrolik kırıcı ucu: kırıcınızın marka ve modelini yazın, çalışma çapı ve uç tipleriyle Kervan üretimi ucu bulun. Stoktan aynı gün kargo.',
      familyTitle: (code, d) => `${code} kırıcı ucu Ø${d} mm | Kervan Makina`,
      familyDesc: (code, d, types) =>
        `${code}: Ø${d} mm hidrolik kırıcı ucu (${types}). Kervan üretimi kırıcı yedek parça; stoktan aynı gün kargo.`,
      breakerTitle: (name, d) => `${name} kırıcı ucu${d ? ` Ø${d}` : ''} | Kervan Makina`,
      breakerDesc: (name, d, types, alias) =>
        `${name}${alias ? ` (${alias})` : ''} hidrolik kırıcı ucu: ${d ? `Ø${d} mm, ` : ''}${types}. Kervan üretimi kırıcı yedek parça; stoktan aynı gün kargo.`,
      notFoundTitle: 'Sayfa bulunamadı | Kervan Makina',
      popularTitle: 'Çok satan kırıcı uçları ve yedek parçalar | Kervan Makina',
      popularDesc:
        'En çok sipariş edilen kırıcı uçları ve aynı kırıcılar için ürettiğimiz yedek parçalar, kırıcı marka ve modeline göre.',
      brandTitle: (brand) => `${brand} kırıcı ucu | Kervan Makina`,
      brandDesc: (brand, n) =>
        `${brand} hidrolik kırıcı ucu: ${n} ${brand} kırıcı modeli için Kervan üretimi uç, çalışma çapı ve uç tipleri. Stoktan aynı gün kargo.`,
      partsTitle: 'Hidrolik kırıcı yedek parçaları | Kervan Makina',
      partsDesc:
        'Hidrolik kırıcı yedek parçaları: kırıcı ucu, alt gövde, burç, kama, saplama, piston, akümülatör parçaları, aşınma plakası ve tamir takımı, marka ve modele göre.',
      partTitle: (name) =>
        `Kırıcı ${name.toLocaleLowerCase('tr')}: marka ve modele göre | Kervan Makina`,
      partDesc: (name, kit) =>
        kit
          ? 'Hidrolik kırıcı tamir takımı: kırıcınızın modeline göre eksiksiz hazırlanan sızdırmazlık takımı. Marka ve modelinizi yazın.'
          : `Hidrolik kırıcı ${name.toLocaleLowerCase('tr')}: Kervan üretimi kırıcı yedek parça, kırıcınızın marka ve modeline göre. Marka ve modelinizi yazın.`,
      partItemTitle: (caption) => `${caption} | Kervan Makina`,
      partItemDesc: (caption, { kit, priced }) =>
        `${caption}: ${kit ? 'kırıcı modeline göre hazırlanan sızdırmazlık takımı' : 'Kervan üretimi hidrolik kırıcı yedek parçası'}. ${priced ? 'Fiyatı sayfada, stoktan aynı gün kargo.' : 'Fiyat teklifi için yazın.'}`,
      cartTitle: 'Palet | Kervan Makina',
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
      call: 'Telefon',
      cart: 'Palet',
      cartHint: '(sepetiniz)',
      cartLabel: (n) => `Palet (sepetiniz)${n ? `, ${n} ürün` : ''}`,
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
      morePopular: 'Tüm çok satanlar',
      groups: 'Ürün gruplarımız',
      pick: {
        alt: 'Bir hidrolik kırıcının ürettiğimiz parçaları yan yana: akümülatör, saplamalar, piston, burçlar, alt gövde, kama, aşınma plakaları ve kırıcı ucu',
        caption:
          'Ürettiğimiz parçalar, 3B görsel. Bir parçaya tıklayın, o parçanın sayfası açılır.',
        listLabel: 'Parçalar',
        tips: 'Kırıcı ucu',
      },
      allGroups: 'Tüm yedek parçalar',
      finder: {
        title: 'Kırıcınızın markası ve modeli',
        makes: 'Marka',
        allMakes: (n) => `Tüm markalar (${n})`,
        models: (make) => `${make} modelleri`,
        allModels: (make, n) => `Tüm ${make} modelleri (${n})`,
        found: 'Bulunan modeller',
        note: 'Ürünlerimiz Kervan Makina üretimidir, kırıcı üreticisinin orijinal parçası değildir; marka ve model adları yalnızca uyumu belirtir.',
        startTitle: 'Kırıcınızı seçin',
        startBody:
          'Markayı seçin ya da modeli yazın; burada o kırıcı için ürettiğimiz uç ve yedek parçalar, sayfalarının bağlantılarıyla listelenir.',
        popular: 'Çok satan kırıcılar',
        forModel: 'Bu kırıcı için ürettiğimiz parçalar',
        breakerPage: 'Kırıcı sayfası',
        noParts: 'Bu kırıcının diğer parçaları için modelinizi WhatsApp’tan yazın, size dönelim.',
        tipN: (n) => `${n}. uç`,
      },
      made: {
        title: 'Ürettiklerimizden',
        lead: 'Ürettiğimiz uç ve parçalardan bir seçki. Fiyatlar nettir; TL karşılığı altında.',
      },
      order: {
        body: 'Online ödeme henüz yok. Kırıcınızı ve parçayı yazın, size hemen dönelim.',
        whatsapp: 'WhatsApp ile sor',
        mail: 'E-posta gönder',
      },
      trust: [
        {
          title: 'Kendi üretimimiz',
          body: 'Kartepe’deki tesisimizde OEM ölçülerinde üretilir, birebir uyumludur; aracı yoktur.',
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
          body: 'Stoktaki ürünler ödemeniz bize ulaştığı gün kargoya verilir.',
        },
      ],
    },
    card: { view: 'Ucu gör' },
    tipSize: (d, ord) => (ord ? `Ø${d} · ${ord}. tip` : `Ø${d} mm`),
    breaker: {
      title: (name) => `${name} kırıcı ucu`,
      aliases: (list) => `Diğer yazılışlar: ${list}`,
      facts: {
        title: (name) => `${name} kırıcı ucu bilgileri`,
        size: 'Uç ölçüsü',
        types: 'Uç tipleri',
        carrier: 'Taşıyıcı sınıfı (yaklaşık)',
        parts: 'Bu kırıcı için ayrıca ürettiklerimiz',
      },
    },
    list: {
      title: 'Tüm kırıcı uçları',
      lead: 'Kırıcınızın marka ve modelini yazın. En çok sipariş edilenler ayrı sayfada.',
      model: 'Kırıcı',
      diameter: 'Çalışma çapı',
      types: 'Uç tipleri',
      groovedHint: 'Bazı kırıcılar için toz kanallı uç da yapıyoruz; kırıcınızı yazın.',
      groovedBadge: 'Toz kanallı',
      priceNote: '+ vergiler',
      priceAsk: 'Fiyat için sorun',
      sampleBadge: 'Temsili görsel',
      cardAlt: (name, sample) =>
        sample ? `${name} kırıcı ucu için temsili görsel` : `${name} kırıcı ucu`,
      more: (left) => `Daha fazla göster (${left} model daha)`,
      groovedBadgeLabel: (name) => `${name} için toz kanallı uçlar`,
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
      size: 'Uç ölçüsü',
      qty: 'Adet',
      stockTitle: 'Stoğumuzdan',
      stockNote: 'Atölyemizdeki stoktan kırıcı uçları.',
      stockAlt: (i) => `Kervan atölyesinde stoktaki kırıcı uçları (${i})`,
      groovedTitle: 'Toz kanallı uçlar',
      groovedNote:
        'Bu kırıcı için ürettiğimiz toz kanallı uçlar; görseller 3B modeldir. Fiyat için teklif isteyin.',
      groovedAlt: (type, special) =>
        `Toz kanallı ${special ? 'özel ' : ''}${type.toLocaleLowerCase('tr')} uç`,
      groovedJump: 'Bu kırıcı için toz kanallı uçlar da var →',
      specialTitle: 'Özel uçlar',
      specialNote:
        'Bu kırıcı için ürettiğimiz özel uçlar; görseller 3B modeldir. Fiyat için teklif isteyin.',
      specialJump: 'Bu kırıcı için özel uçlar da var →',
      relievedAlt: (type) => `Boşaltmalı ${type.toLocaleLowerCase('tr')} uç`,
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
        `Merhaba, ${name} için ${type} kırıcı ucu${code ? ` (${code})` : ''}, ${qty} adet sipariş vermek istiyorum (birim ${price} + vergiler).\n${url}`,
      partsTitle: 'Bu kırıcı için ürettiğimiz parçalar',
      renderAlt: (name, type) => `${name} ${type} kırıcı ucu`,
      sample: (name) => `Temsili görsel: ${name} ucu`,
      sampleAlt: (name, sample) => `${name} kırıcı ucu için temsili görsel: ${sample} ucu`,
      realPhoto: (name) => `Kendi üretimimiz: ${name} uyumlu keski ve sivri uç (gerçek fotoğraf)`,
      realPhotoAlt: (name, n) =>
        `${name} uyumlu keski ve sivri kırıcı ucu, Kervan üretimi: gerçek fotoğraf ${n}`,
      sideAlt: (name, type) => `${name} ${type} kırıcı ucu, yandan görünüş`,
      rearAlt: (name) => `${name} kırıcı ucunun kama kanalı ve arka ucu, yakın görünüş`,
      viewRear: 'Kama kanalı ve arka uç',
    },
    search: {
      label: 'Kırıcı modeli ara',
      placeholder: 'Kırıcınızın marka ve modeli, ör. Furukawa HB 20G',
      button: 'Ara',
      none: (q) => `"${q}" için model bulunamadı.`,
      count: (n) => `${n} model`,
      brands: 'Markalar',
      all: 'Tüm markalar',
      changeMake: (n) => `Marka değiştir (${n})`,
      didYouMean: (q) => `Bunu mu demek istediniz: ${q}`,
      hint: 'Kırıcınızın marka ve modelini yazın; uyan ürünler burada listelenir.',
      countFiltered: (n, total) => `${n} model (${total} sonuçtan)`,
      filter: {
        label: 'Sonuçları daralt',
        type: 'Uç tipi',
        carrier: 'Uç çapı · ekskavatör (yaklaşık)',
        band: (from, below, tons) =>
          from === 0
            ? `Ø${below} mm altı`
            : below === Infinity
              ? `Ø${from} mm ve üstü`
              : `Ø${from}–${below - 1} mm${tons ? ` · yaklaşık ${tons.min}–${tons.max} t` : ''}`,
        bandShort: (from, below, tons) =>
          from === 0
            ? `Ø${below} altı`
            : below === Infinity
              ? `Ø${from} ve üstü`
              : `${tons ? `~${tons.min}–${tons.max} t, ` : ''}Ø${from}–${below - 1}`,
        grooved: 'Toz kanallı',
        all: 'Tümü',
        clear: 'Filtreleri temizle',
        none: (n) => `Bu seçimlerle sonuç yok (yazdığınızla ${n} sonuç var).`,
      },
    },
    missing: {
      title: 'Modeliniz listede yok mu, emin değil misiniz?',
      body: 'Kırıcınızın marka ve modelini, mümkünse ucun çapını ve bir fotoğrafını WhatsApp’tan gönderin; uyan ucu biz bulalım. Çap, ucun çalışan (ön) kısmında kumpasla ölçülür.',
      button: 'WhatsApp ile sor',
      text: 'Merhaba, kırıcımın markası/modeli: … Ölçtüğüm uç çapı: … mm. Fotoğraf ekliyorum.',
      textFor: (q, filters) =>
        `Merhaba, kırıcımın markası/modeli: ${q}.${filters ? ` Seçimlerim: ${filters}.` : ''} Ölçtüğüm uç çapı: … mm. Fotoğraf ekliyorum.`,
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
      plus: '+ vergiler',
      note: '',
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
            p: 'Toplam bedel, kargo ve ödeme bilgilerini içeren sipariş onayını gönderiyoruz; stoktaki ürünler ödemeniz bize ulaştığı gün kargoya verilir.',
          },
        ],
        note: 'Ayrıntılar:',
      },
      product: 'Ürün',
      qty: 'Adet',
      unit: 'Birim fiyat (+ vergiler)',
      lineTotal: 'Tutar',
      ask: 'Fiyat sorulacak',
      total: 'Toplam (vergiler dahil, kargo hariç)',
      subtotal: 'Ara toplam',
      vat: (pct) => `Vergiler (%${pct})`,
      totalNote: 'Fiyatı sorulacak ürünler toplama dahil değildir.',
      remove: (name) => `${name} ürününü paletten indir`,
      removeShort: 'Kaldır',
      removed: (name) => `${name} paletten indirildi.`,
      cleared: 'Palet boşaltıldı.',
      undo: 'Geri al',
      subject: (first, more) =>
        `Sipariş talebi – kiriciparca.com – ${first}${more ? ` (+${more})` : ''}`,
      contactTitle: 'İletişim bilgileriniz',
      name: 'Ad soyad',
      company: 'Firma',
      phone: 'Telefon',
      city: 'Şehir',
      country: 'Ülke',
      required: '(zorunlu)',
      countryMissing: '',
      intlNote: '',
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
        ['Uyum', 'OEM ölçülerinde üretilir, birebir uyumludur'],
        ['Kargo', 'Alıcıya aittir; tutarı sipariş onayında bildirilir'],
        ['Ödeme', 'Kredi kartı veya havale/EFT'],
      ],
      warrantyLabel: 'Garanti',
      warranty: (m) => `Teslimden itibaren ${m} ay, malzeme ve üretim hatalarına karşı`,
      warrantyAll:
        'Teslimden itibaren alt gövde ve pistonlarda 6 ay, burçlarda 3 ay, diğer ürünlerde 2 ay; malzeme ve üretim hatalarına karşı',
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
          h1: 'Hidrolik kırıcı alt gövdesi',
          body: 'Ucu ve burçları taşıyan alt gövde (ön kafa). Aşınmış ya da çatlamış gövdenin yerine.',
        },
        burc: {
          name: 'Burç',
          h1: 'Hidrolik kırıcı burcu',
          body: 'Ucu yönlendiren kafa burçları, merkezlemeler ve dayama burçları; bazı kırıcılarda dayama ve merkezleme tek parçadır. Aşınmış burç ucu erken kırar; uçla birlikte kontrol edin.',
        },
        kama: {
          name: 'Kama',
          h1: 'Hidrolik kırıcı kaması',
          body: 'Ucu gövdede tutan kamalar ve tutucu pimler.',
        },
        saplama: {
          name: 'Saplama',
          h1: 'Hidrolik kırıcı saplaması',
          body: 'Kırıcı gövdesini bir arada tutan saplamalar; takımlar somunlarıyla, çizimde varsa pullarıyla.',
        },
        piston: {
          name: 'Piston',
          h1: 'Hidrolik kırıcı pistonu',
          body: 'Kırıcının darbe pistonu; kırıcı modeline göre.',
        },
        akumulator: {
          name: 'Akümülatör parçaları',
          h1: 'Hidrolik kırıcı akümülatör parçaları',
          body: 'Akümülatör üst ve alt kapakları ile akümülatör saplamaları.',
        },
        'asinma-plakasi': {
          name: 'Aşınma plakası',
          h1: 'Hidrolik kırıcı aşınma plakası',
          body: 'Kırıcı gövdesini kutu içinde koruyan aşınma plakaları.',
        },
        'tamir-takimi': {
          name: 'Tamir takımı',
          h1: 'Hidrolik kırıcı tamir takımı',
          body: 'Kırıcı modeline göre sızdırmazlık takımı: o-ringler, keçeler, toz keçeleri, destek ve teflon ringler; içerik listesiyle.',
        },
      },
      view: 'İncele',
      groupAlt: (h1) => `${h1}, Kervan üretimi`,
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
        toolBushing: 'kafa burcu',
        upperBushing: 'merkezleme',
        thrustRing: 'dayama burcu',
        thrustUpperBushing: 'dayama-merkezleme burcu',
        spacerBushing: 'dayama ara burcu',
        upperSpacerBushing: 'merkezleme ara burcu',
        oneBushing: 'tek parça kafa-merkezleme-dayama burcu',
        toolUpperBushing: 'tek parça kafa-merkezleme burcu',
        rockDrillThrustRing: 'kaya delici dayama burcu',
        rockDrillChuckBushing: 'kaya delici şank arka dayama burcu',
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
        tieRodNut: 'boy saplama somunu',
        tieRodUpperNut: 'boy saplama üst somunu',
        tieRodLowerNut: 'boy saplama alt somunu',
        tieRodWasher: 'boy saplama pulu',
        tieRodBush: 'boy saplama burcu',
        sideBoltWasher: 'yan saplama pulu',
        bodyDowel: 'gövde merkezleme pimi',
        accumulatorDowel: 'akümülatör kapağı merkezleme pimi',
        toolBushingPin: 'kafa burcu pimi',
        toolBushingPinRetainer: 'kafa burcu pimi tutucu pimi',
        toolUpperPin: 'kafa burcu-merkezleme pimi',
        keyUpperPin: 'kama ve merkezleme pimi',
        upperBushingPin: 'merkezleme pimi',
        toolBushingPinPlug: 'kafa burcu pimi tapası',
        upperBushingPinPlug: 'merkezleme pimi tapası',
        keyPinPlug: 'kama pimi tapası',
        keyPinHolder: 'kama pim tutucusu',
        keyPinRetainer: 'kama pimi tutucu pimi',
        keyPinRubber: 'kama pimi tutucu lastiği',
        keyPinWasher: 'kama pimi tutucu pulu',
        lowerRetainerPin: 'kama tutucu alt pimi',
        retainerLockPin: 'kama tutucu kilit pimi',
        springPin: 'kama tutucu yay pimi',
        topBuffer: 'üst vibrasyon takozu',
        sideBuffer: 'yan vibrasyon takozu',
        bottomBuffer: 'alt vibrasyon takozu',
        topBufferPlate: 'üst vibrasyon takozu plakası',
        bottomBufferPlate: 'alt vibrasyon takozu plakası',
        bufferGuide: 'üst vibrasyon takozu kılavuzu',
        topWearPlate: 'üst aşınma plakası',
        sideWearPlate: 'yan aşınma plakası',
        frontWearPlate: 'ön aşınma plakası',
        allRoundWearPlate: 'üst-alt-yan aşınma plakası',
        tieRodSet: 'boy saplama takımı',
        wearPlateSet: 'aşınma plakası ve takoz seti',
        bushingSet: 'burç takımı',
      },
      renderKindShort: {
        toolBushing: 'Kafa burcu',
        upperBushing: 'Merkezleme',
        thrustRing: 'Dayama burcu',
        thrustUpperBushing: 'Dayama-merkezleme',
        spacerBushing: 'Dayama ara burcu',
        upperSpacerBushing: 'Merkezleme ara burcu',
        oneBushing: 'Tek parça burç',
        toolUpperBushing: 'Kafa-merkezleme',
        rockDrillThrustRing: 'Dayama burcu',
        rockDrillChuckBushing: 'Şank arka dayama',
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
        tieRodNut: 'Somun',
        tieRodUpperNut: 'Üst somun',
        tieRodLowerNut: 'Alt somun',
        tieRodWasher: 'Pul',
        tieRodBush: 'Saplama burcu',
        sideBoltWasher: 'Yan saplama pulu',
        bodyDowel: 'Gövde pimi',
        accumulatorDowel: 'Merkezleme pimi',
        toolBushingPin: 'Kafa burcu pimi',
        toolBushingPinRetainer: 'Pim tutucu',
        toolUpperPin: 'Kafa-merkezleme pimi',
        keyUpperPin: 'Kama-merkezleme pimi',
        upperBushingPin: 'Merkezleme pimi',
        toolBushingPinPlug: 'Pim tapası',
        upperBushingPinPlug: 'Pim tapası',
        keyPinPlug: 'Pim tapası',
        keyPinHolder: 'Pim tutucu',
        keyPinRetainer: 'Pim tutucu',
        keyPinRubber: 'Tutucu lastik',
        keyPinWasher: 'Tutucu pul',
        lowerRetainerPin: 'Alt tutucu pim',
        retainerLockPin: 'Kilit pimi',
        springPin: 'Yay pimi',
        topBuffer: 'Üst takoz',
        sideBuffer: 'Yan takoz',
        bottomBuffer: 'Alt takoz',
        topBufferPlate: 'Takoz plakası',
        bottomBufferPlate: 'Takoz plakası',
        bufferGuide: 'Takoz kılavuzu',
        topWearPlate: 'Üst plaka',
        sideWearPlate: 'Yan plaka',
        frontWearPlate: 'Ön plaka',
        allRoundWearPlate: 'Aşınma plakası',
        tieRodSet: 'Somunlu takım',
        wearPlateSet: 'Set',
        bushingSet: 'Burç takımı',
      },
      filter: {
        label: 'Parça türü',
        all: 'Tümü',
        items: {
          toolBushing: 'Kafa burcu',
          upperBushing: 'Merkezleme',
          thrustRing: 'Dayama burcu',
          oneBushing: "3'ü bir arada burç",
          twoInOne: 'İkisi bir arada burç',
          pins: 'Pimler',
          plugs: 'Pim tapaları',
          rods: 'Boy saplamalar',
          sideBolts: 'Yan saplamalar ve pulları',
          nuts: 'Somunlar',
          washers: 'Pul ve burçlar',
          keys: 'Kamalar',
          plates: 'Aşınma plakaları',
          buffers: 'Vibrasyon takozları',
          sets: 'Setler',
        },
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
        typeB: 'B tipi',
        oilGroove: 'yağ kanallı',
        greasingHole: 'yağlama delikli',
        puCoated: 'PU kaplamalı',
        rubberCoated: 'lastik kaplamalı',
        oRingType: 'O-ringli tip',
        pu: 'poliüretan',
        rubber: 'kauçuk',
        city: 'City',
        hatless: 'şapkasız',
        standardType: 'standart tip',
        roundShape: 'yuvarlak',
        triLobe: 'üçgen',
        no1: 'No. 1',
        no2: 'No. 2',
        no3: 'No. 3',
        no4: 'No. 4',
      },
      gallery: {
        label: 'Görünümler',
        prev: 'Önceki görünüm',
        next: 'Sonraki görünüm',
        count: (i, n) => `${i} / ${n}`,
        hero: 'genel görünüş',
        heroShort: 'Genel',
        alt: (caption, view) => `${caption}, ${view}`,
        short: {
          front: 'Ön',
          rear: 'Arka',
          side: 'Yan',
          detail: 'Pencere',
          section: 'Kesit',
          assembly: 'Montaj kesiti',
          top: 'Üstten',
        },
      },
      viewer: {
        open: '3B incele',
        close: 'Görsele dön',
        hint: 'Sürükleyerek çevirin, iki parmakla ya da tekerlekle yakınlaştırın; ok tuşlarıyla da çevrilir.',
        loading: '3B model yükleniyor…',
        error: '3B model açılamadı.',
        cut: 'Kesit',
        cutOff: 'Kesiti kapat',
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
        lead: 'Ürettiğimiz parçalar. Marka ve modelinizi yazınca o kırıcının parçaları açılır.',
        more: (left) => `Daha fazla göster (${left} parça daha)`,
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
      oemRef: {
        label: 'Muadil OEM no.',
        note: 'Yalnızca karşılaştırma içindir: parçamız kendi üretimimizdir ve bu OEM numaralı parçayla uyumludur.',
      },
      listed: {
        title: 'Satıştaki parçalar',
        lead: 'Bu kırıcı için sattığımız parçalar. Resimler temsilidir: aynı parçanın benzer boydaki bir kırıcı için yaptığımız örneği.',
        sample: 'Temsili görsel',
        type: {
          ALT_GOVDE: 'alt gövde (burçlu)',
          KAFA_BURCU: 'kafa burcu',
          MERKEZLEME: 'merkezleme',
          DAYAMA: 'dayama burcu',
          MERKEZLEME_DAYAMA: 'dayama-merkezleme burcu',
          BURC_TAKIMI: 'burç takımı',
          KAMA: 'kama',
          KAMA_PIMI: 'kama pimi',
          BOY_SAPLAMA: 'boy saplama',
          YAN_SAPLAMA: 'yan saplama',
          PISTON: 'piston',
          TAMIR_TAKIMI: 'tamir takımı',
          ASINMA_PLAKASI: 'aşınma plakası',
          ASINMA_SETI: 'aşınma plakası takımı',
          TAKOZ_TEPE: 'tepe takozu',
          TAKOZ_YAN: 'yan takoz',
          TAKOZ_ALT: 'alt takoz',
          AKU_UST: 'akümülatör üstü',
          AKU_ALT: 'akümülatör altı',
          AKU_SAPLAMA: 'akümülatör saplaması',
        },
      },
      order: {
        title: 'Sipariş verin',
        body: 'Parça, adet ve fiyat mesaja yazılır; ödeme ve kargo bilgisiyle size dönelim.',
        wa: 'WhatsApp ile sipariş ver',
        mail: 'E-posta ile sipariş ver',
        delivery: 'Stoktan aynı gün kargo',
        text: (part, breaker, qty, price, url) =>
          `Merhaba, ${breaker} ${part}, ${qty} adet sipariş vermek istiyorum (birim ${price} + vergiler).\n${url}`,
        other: 'Başka bir kırıcı için teklif isteyin',
        withNuts: 'Somunlarıyla birlikte, takım olarak',
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
    renderNote: '3B görseller; temsilidir.',
    photoNote: 'Atölyemizdeki stoktan, gerçek fotoğraflar.',
    oem: 'OEM ölçülerinde üretilir, birebir uyumludur.',
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
      cookies: 'Çerez tercihleri',
      social: 'Sosyal medya',
      socials: {
        facebook: 'Kervan Facebook sayfası',
        instagram: 'Kervan Instagram hesabı',
        youtube: 'Kervan YouTube kanalı',
        linkedin: 'Kervan LinkedIn sayfası',
        x: 'Kervan X hesabı',
        telegram: 'Kervan Telegram kanalı',
      },
    },
    consent: {
      title: 'Çerez tercihi',
      body: 'Reklam ölçümü için Google Ads ve OpenAI (ChatGPT) Ads çerezlerini yalnızca izin verirseniz kullanırız; veriler yurt dışına (ABD) aktarılır. Reddederseniz site ve sipariş aynen çalışır.',
      accept: 'Kabul et',
      reject: 'Reddet',
      policy: 'Ayrıntılar',
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
      siteName: 'Kervan Makina',
      brand: 'Kervan Makina',
      homeTitle: 'Hydraulic breaker spare parts and tips | Kervan Makina',
      homeDesc:
        'Hydraulic breaker parts by make and model: tips, front heads, bushings, retainer keys, tie rods, pistons, wear plates, repair kits. Same-day shipping from stock.',
      listTitle: 'Breaker tips by make and model | Kervan Makina',
      listDesc:
        'Hydraulic breaker tips: type your breaker make and model to find the Kervan tip, with working diameter and tip types. Same-day shipping from stock.',
      familyTitle: (code, d) => `${code} breaker tip Ø${d} mm | Kervan Makina`,
      familyDesc: (code, d, types) =>
        `${code}: Ø${d} mm hydraulic breaker tip (${types}). Breaker spare part made by Kervan; same-day shipping from stock.`,
      breakerTitle: (name, d) => `${name} breaker tip${d ? ` Ø${d}` : ''} | Kervan Makina`,
      breakerDesc: (name, d, types, alias) =>
        `${name}${alias ? ` (${alias})` : ''} hydraulic breaker tip: ${d ? `Ø${d} mm, ` : ''}${types}. Breaker spare part made by Kervan; same-day shipping from stock.`,
      notFoundTitle: 'Page not found | Kervan Makina',
      popularTitle: 'Best-selling breaker tips and spare parts | Kervan Makina',
      popularDesc:
        'The most ordered breaker tips and the parts we make for the same breakers, by breaker make and model.',
      brandTitle: (brand) => `${brand} breaker tips | Kervan Makina`,
      brandDesc: (brand, n) =>
        `${brand} hydraulic breaker tips: Kervan tips for ${n} ${brand} breaker models, with working diameter and tip types. Same-day shipping from stock.`,
      partsTitle: 'Hydraulic breaker spare parts | Kervan Makina',
      partsDesc:
        'Hydraulic breaker spare parts: tips, front heads, bushings, retainer keys, tie rods, pistons, accumulator parts, wear plates and repair kits, by make and model.',
      partTitle: (name) => `Breaker ${name.toLowerCase()} by make and model | Kervan Makina`,
      partDesc: (name, kit) =>
        kit
          ? 'Hydraulic breaker repair kits: complete seal kits put together for your breaker model. Type your make and model.'
          : `Hydraulic breaker ${name.toLowerCase()} made by Kervan, by breaker make and model. Type your make and model.`,
      partItemTitle: (caption) => `${caption} | Kervan Makina`,
      partItemDesc: (caption, { kit, priced }) =>
        `${caption}: ${kit ? 'seal kit put together for the breaker model' : 'hydraulic breaker spare part made by Kervan'}. ${priced ? 'Price on the page, same-day shipping from stock.' : 'Write to us for a quote.'}`,
      cartTitle: 'Cart | Kervan Makina',
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
      cartHint: '',
      cartLabel: (n) => `Cart${n ? `, ${n} ${n === 1 ? 'item' : 'items'}` : ''}`,
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
      morePopular: 'All best sellers',
      groups: 'Our product groups',
      pick: {
        alt: 'The parts we make for a hydraulic breaker, side by side: accumulator, tie rods, piston, bushings, front head, key, wear plates and tool',
        caption: 'The parts we make, as 3D images. Click a part to open its page.',
        listLabel: 'Parts',
        tips: 'Breaker tool',
      },
      allGroups: 'All spare parts',
      finder: {
        title: 'Your breaker’s make and model',
        makes: 'Make',
        allMakes: (n) => `All makes (${n})`,
        models: (make) => `${make} models`,
        allModels: (make, n) => `All ${make} models (${n})`,
        found: 'Models found',
        note: 'Our products are made by Kervan Makina and are not the breaker maker’s original parts; make and model names only show the fit.',
        startTitle: 'Choose your breaker',
        startBody:
          'Pick the make or type the model; the tips and spare parts we make for that breaker are listed here, with links to their pages.',
        popular: 'Best-selling breakers',
        forModel: 'Parts we make for this breaker',
        breakerPage: 'Breaker page',
        noParts:
          'For this breaker’s other parts, send us your model on WhatsApp and we will get back to you.',
        tipN: (n) => `Tool ${n}`,
      },
      made: {
        title: 'From our production',
        lead: 'A selection of the tips and parts we make, at export prices.',
      },
      order: {
        body: 'No online payment yet. Tell us your breaker and the part, and we will get back to you.',
        whatsapp: 'Ask on WhatsApp',
        mail: 'Send an e-mail',
      },
      trust: [
        {
          title: 'Our own production',
          body: 'Made in our plant in Kartepe, Türkiye, to OEM dimensions, a direct fit; no middlemen.',
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
          body: 'Items in stock ship the day your payment reaches us.',
        },
      ],
    },
    card: { view: 'View tip' },
    tipSize: (d, ord) => (ord ? `Ø${d} · type ${ord}` : `Ø${d} mm`),
    breaker: {
      title: (name) => `${name} breaker tip`,
      aliases: (list) => `Also written: ${list}`,
      facts: {
        title: (name) => `${name} breaker tip facts`,
        size: 'Tip size',
        types: 'Tip types',
        carrier: 'Carrier class (approx.)',
        parts: 'We also make for this breaker',
      },
    },
    list: {
      title: 'All breaker tips',
      lead: 'Type your breaker make and model. The most ordered tips have their own page.',
      model: 'Breaker',
      diameter: 'Working diameter',
      types: 'Tip types',
      groovedHint: 'For some breakers we also make tools with dust grooves; type your breaker.',
      groovedBadge: 'Dust grooves',
      priceNote: 'export price',
      priceAsk: 'Ask for a price',
      sampleBadge: 'Sample picture',
      cardAlt: (name, sample) =>
        sample ? `Sample picture for the ${name} breaker tip` : `${name} breaker tip`,
      more: (left) => `Show more (${left} more models)`,
      groovedBadgeLabel: (name) => `Tools with dust grooves for the ${name}`,
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
      size: 'Tip size',
      qty: 'Quantity',
      stockTitle: 'From our stock',
      stockNote: 'Breaker tips in stock at our plant.',
      stockAlt: (i) => `Breaker tips in stock at the Kervan plant (${i})`,
      groovedTitle: 'Tools with dust grooves',
      groovedNote:
        'Tools with dust grooves we make for this breaker; the pictures are 3D models. Ask for a quote.',
      groovedAlt: (type, special) =>
        `${special ? 'Special ' : ''}${special ? type.toLowerCase() : type} tool with dust grooves`,
      groovedJump: 'Tools with dust grooves are also available for this breaker →',
      specialTitle: 'Special tools',
      specialNote:
        'Special tools we make for this breaker; the pictures are 3D models. Ask for a quote.',
      specialJump: 'Special tools are also available for this breaker →',
      relievedAlt: (type) => `Relieved ${type.toLowerCase()} tool`,
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
        `Hello, I would like to order the ${type} tip${code ? ` (${code})` : ''} for the ${name}, quantity ${qty} (unit ${price}, export price).\n${url}`,
      partsTitle: 'Parts we make for this breaker',
      renderAlt: (name, type) => `${name} ${type} breaker tip`,
      sample: (name) => `Sample picture: the ${name} tip`,
      sampleAlt: (name, sample) => `Sample picture for the ${name} breaker tip: the ${sample} tip`,
      realPhoto: (name) => `Our own make: ${name}-compatible chisel and moil tips (real photo)`,
      realPhotoAlt: (name, n) =>
        `${name}-compatible chisel and moil breaker tips made by Kervan: real photo ${n}`,
      sideAlt: (name, type) => `${name} ${type} breaker tip, side view`,
      rearAlt: (name) => `${name} breaker tip key slot and rear end, close-up`,
      viewRear: 'Key slot and rear end',
    },
    search: {
      label: 'Search breaker model',
      placeholder: 'Your breaker make and model, e.g. Furukawa HB 20G',
      button: 'Search',
      none: (q) => `No model found for "${q}".`,
      count: (n) => `${n} models`,
      brands: 'Makes',
      all: 'All makes',
      changeMake: (n) => `Change make (${n})`,
      didYouMean: (q) => `Did you mean: ${q}`,
      hint: 'Type your breaker make and model; the matching products are listed here.',
      countFiltered: (n, total) => `${n} models (of ${total} results)`,
      filter: {
        label: 'Narrow the results',
        type: 'Tip type',
        carrier: 'Tip diameter · excavator (approx.)',
        band: (from, below, tons) =>
          from === 0
            ? `Under Ø${below} mm`
            : below === Infinity
              ? `Ø${from} mm and up`
              : `Ø${from}–${below - 1} mm${tons ? ` · approx. ${tons.min}–${tons.max} t` : ''}`,
        bandShort: (from, below, tons) =>
          from === 0
            ? `under Ø${below}`
            : below === Infinity
              ? `Ø${from} and up`
              : `${tons ? `~${tons.min}–${tons.max} t, ` : ''}Ø${from}–${below - 1}`,
        grooved: 'Dust grooves',
        all: 'All',
        clear: 'Clear filters',
        none: (n) => `No results with these choices (your search found ${n}).`,
      },
    },
    missing: {
      title: 'Model not listed, or not sure?',
      body: 'Send your breaker make and model, if possible the tip diameter and a photo, on WhatsApp; we will find the tip that fits. Measure the diameter with a caliper on the working (front) part of the tip.',
      button: 'Ask on WhatsApp',
      text: 'Hello, my breaker make/model: … Tip diameter I measured: … mm. Photo attached.',
      textFor: (q, filters) =>
        `Hello, my breaker make/model: ${q}.${filters ? ` My choices: ${filters}.` : ''} Tip diameter I measured: … mm. Photo attached.`,
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
      plus: '',
      note: 'Export price: product price only, shipping is not included. Orders delivered within Türkiye are invoiced with Turkish taxes.',
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
            p: 'We send an order confirmation with the total, shipping and payment details; items in stock ship the day your payment reaches us.',
          },
        ],
        note: 'Details:',
      },
      product: 'Product',
      qty: 'Qty',
      unit: 'Unit price (export)',
      lineTotal: 'Amount',
      ask: 'Price on request',
      total: 'Total (export price, excl. shipping)',
      subtotal: 'Subtotal',
      vat: (pct) => `Taxes (${pct}%)`,
      totalNote: 'Products priced on request are not in the total.',
      remove: (name) => `Remove ${name} from the cart`,
      removeShort: 'Remove',
      removed: (name) => `${name} removed from the cart.`,
      cleared: 'Cart emptied.',
      undo: 'Undo',
      subject: (first, more) =>
        `Order request – kiriciparca.com – ${first}${more ? ` (+${more})` : ''}`,
      contactTitle: 'Your contact details',
      name: 'Name',
      company: 'Company',
      phone: 'Phone',
      city: 'City',
      country: 'Country',
      required: '(required)',
      countryMissing: 'Please enter your country, so we can quote the shipping.',
      intlNote: 'Orders outside Türkiye: prices are export prices; shipping is not included.',
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
        ['Fit', 'Made to OEM dimensions, a direct fit'],
        ['Shipping', 'Paid by the buyer; the amount is given in the order confirmation'],
        ['Payment', 'Credit card or bank transfer'],
      ],
      warrantyLabel: 'Warranty',
      warranty: (m) => `${m} months from delivery, against material and manufacturing defects`,
      warrantyAll:
        'From delivery: 6 months on front heads and pistons, 3 months on bushings, 2 months on all other products; against material and manufacturing defects',
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
          h1: 'Hydraulic breaker front heads',
          body: 'The lower body that holds the tip and bushings; replaces a worn or cracked one.',
        },
        burc: {
          name: 'Bushings',
          h1: 'Hydraulic breaker bushings',
          body: 'Tool bushings and upper bushings that guide the tip, and thrust rings; on some breakers the thrust ring and upper bushing are one piece. A worn bushing breaks tips early; check them with the tip.',
        },
        kama: {
          name: 'Retainer keys',
          h1: 'Hydraulic breaker retainer keys',
          body: 'Keys and retainer pins that hold the tip in the front head.',
        },
        saplama: {
          name: 'Tie rods',
          h1: 'Hydraulic breaker tie rods',
          body: 'Tie rods that hold the breaker body together; sets come with their nuts, and washers where the drawing has them.',
        },
        piston: {
          name: 'Pistons',
          h1: 'Hydraulic breaker pistons',
          body: 'The breaker’s impact piston, by breaker model.',
        },
        akumulator: {
          name: 'Accumulator parts',
          h1: 'Hydraulic breaker accumulator parts',
          body: 'Accumulator covers (upper and lower) and accumulator bolts.',
        },
        'asinma-plakasi': {
          name: 'Wear plates',
          h1: 'Hydraulic breaker wear plates',
          body: 'Wear plates that protect the breaker body inside its box.',
        },
        'tamir-takimi': {
          name: 'Repair kits',
          h1: 'Hydraulic breaker repair kits',
          body: 'Seal kits by breaker model: o-rings, rod seals, wipers, back-up and PTFE rings, with a list of contents.',
        },
      },
      view: 'View',
      groupAlt: (h1) => `${h1}, made by Kervan`,
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
        toolBushing: 'tool bushing',
        upperBushing: 'upper bushing',
        thrustRing: 'thrust ring',
        thrustUpperBushing: 'thrust ring and upper bushing (one piece)',
        spacerBushing: 'thrust ring spacer',
        upperSpacerBushing: 'upper bushing spacer',
        oneBushing: 'one-piece tool, upper and thrust bushing',
        toolUpperBushing: 'one-piece tool and upper bushing',
        rockDrillThrustRing: 'rock drill thrust ring',
        rockDrillChuckBushing: 'rock drill rotation chuck bushing',
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
        tieRodNut: 'through bolt nut',
        tieRodUpperNut: 'through bolt upper nut',
        tieRodLowerNut: 'through bolt lower nut',
        tieRodWasher: 'through bolt washer',
        tieRodBush: 'through bolt bush',
        sideBoltWasher: 'side bolt washer',
        bodyDowel: 'body dowel pin',
        accumulatorDowel: 'accumulator cover dowel pin',
        toolBushingPin: 'tool bushing pin',
        toolBushingPinRetainer: 'tool bushing pin retainer',
        toolUpperPin: 'tool and upper bushing pin',
        keyUpperPin: 'key and upper bushing pin',
        upperBushingPin: 'upper bushing pin',
        toolBushingPinPlug: 'tool bushing pin plug',
        upperBushingPinPlug: 'upper bushing pin plug',
        keyPinPlug: 'key pin plug',
        keyPinHolder: 'key pin holder',
        keyPinRetainer: 'key pin retainer',
        keyPinRubber: 'key pin retaining rubber',
        keyPinWasher: 'key pin retaining washer',
        lowerRetainerPin: 'lower key retaining pin',
        retainerLockPin: 'key retainer lock pin',
        springPin: 'key retainer spring pin',
        topBuffer: 'top buffer',
        sideBuffer: 'side buffer',
        bottomBuffer: 'bottom buffer',
        topBufferPlate: 'top buffer plate',
        bottomBufferPlate: 'bottom buffer plate',
        bufferGuide: 'top buffer guide',
        topWearPlate: 'top wear plate',
        sideWearPlate: 'side wear plate',
        frontWearPlate: 'front wear plate',
        allRoundWearPlate: 'top, bottom and side wear plate',
        tieRodSet: 'through bolt set',
        wearPlateSet: 'wear plate and buffer set',
        bushingSet: 'bushing set',
      },
      renderKindShort: {
        toolBushing: 'Tool bushing',
        upperBushing: 'Upper bushing',
        thrustRing: 'Thrust ring',
        thrustUpperBushing: 'Thrust + upper',
        spacerBushing: 'Thrust ring spacer',
        upperSpacerBushing: 'Upper bushing spacer',
        oneBushing: 'One-piece',
        toolUpperBushing: 'Tool + upper',
        rockDrillThrustRing: 'Thrust ring',
        rockDrillChuckBushing: 'Chuck bushing',
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
        tieRodNut: 'Nut',
        tieRodUpperNut: 'Upper nut',
        tieRodLowerNut: 'Lower nut',
        tieRodWasher: 'Washer',
        tieRodBush: 'Bolt bush',
        sideBoltWasher: 'Side bolt washer',
        bodyDowel: 'Body dowel',
        accumulatorDowel: 'Dowel pin',
        toolBushingPin: 'Tool bushing pin',
        toolBushingPinRetainer: 'Pin retainer',
        toolUpperPin: 'Tool + upper pin',
        keyUpperPin: 'Key + upper pin',
        upperBushingPin: 'Upper bushing pin',
        toolBushingPinPlug: 'Pin plug',
        upperBushingPinPlug: 'Pin plug',
        keyPinPlug: 'Pin plug',
        keyPinHolder: 'Pin holder',
        keyPinRetainer: 'Pin retainer',
        keyPinRubber: 'Retaining rubber',
        keyPinWasher: 'Retaining washer',
        lowerRetainerPin: 'Lower retainer pin',
        retainerLockPin: 'Lock pin',
        springPin: 'Spring pin',
        topBuffer: 'Top buffer',
        sideBuffer: 'Side buffer',
        bottomBuffer: 'Bottom buffer',
        topBufferPlate: 'Buffer plate',
        bottomBufferPlate: 'Buffer plate',
        bufferGuide: 'Buffer guide',
        topWearPlate: 'Top plate',
        sideWearPlate: 'Side plate',
        frontWearPlate: 'Front plate',
        allRoundWearPlate: 'Wear plate',
        tieRodSet: 'Set with nuts',
        wearPlateSet: 'Set',
        bushingSet: 'Bushing set',
      },
      filter: {
        label: 'Part type',
        all: 'All',
        items: {
          toolBushing: 'Tool bushings',
          upperBushing: 'Upper bushings',
          thrustRing: 'Thrust rings',
          oneBushing: 'Three-in-one bushings',
          twoInOne: 'Two-in-one bushings',
          pins: 'Pins',
          plugs: 'Pin plugs',
          rods: 'Through bolts',
          sideBolts: 'Side bolts and washers',
          nuts: 'Nuts',
          washers: 'Washers and bushes',
          keys: 'Retainer keys',
          plates: 'Wear plates',
          buffers: 'Buffers',
          sets: 'Sets',
        },
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
        typeB: 'B type',
        oilGroove: 'oil grooves',
        greasingHole: 'greasing hole',
        puCoated: 'PU-coated',
        rubberCoated: 'rubber-coated',
        oRingType: 'O-ring type',
        pu: 'polyurethane',
        rubber: 'rubber',
        city: 'City',
        hatless: 'without collar',
        standardType: 'standard type',
        roundShape: 'round',
        triLobe: 'three-lobe',
        no1: 'No. 1',
        no2: 'No. 2',
        no3: 'No. 3',
        no4: 'No. 4',
      },
      gallery: {
        label: 'Views',
        prev: 'Previous view',
        next: 'Next view',
        count: (i, n) => `${i} / ${n}`,
        hero: 'general view',
        heroShort: 'General',
        alt: (caption, view) => `${caption}, ${view}`,
        short: {
          front: 'Front',
          rear: 'Rear',
          side: 'Side',
          detail: 'Window',
          section: 'Section',
          assembly: 'Assembly',
          top: 'Top',
        },
      },
      viewer: {
        open: 'View in 3D',
        close: 'Back to the picture',
        hint: 'Drag to turn, pinch or scroll to zoom; the arrow keys turn it too.',
        loading: 'Loading the 3D model…',
        error: 'The 3D model could not be opened.',
        cut: 'Section',
        cutOff: 'Hide the section',
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
        title: 'What we make',
        lead: 'The parts we make. Type your make and model to open that breaker’s parts.',
        more: (left) => `Show more (${left} more parts)`,
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
      oemRef: {
        label: 'Equivalent OEM no.',
        note: 'For cross-reference only: our part is our own production, compatible with the part of this OEM number.',
      },
      listed: {
        title: 'Parts we sell',
        lead: 'Parts we sell for this breaker. Pictures are representative: the same part we make for a breaker of similar size.',
        sample: 'Representative picture',
        type: {
          ALT_GOVDE: 'front head (with bushings)',
          KAFA_BURCU: 'tool bushing',
          MERKEZLEME: 'upper bushing',
          DAYAMA: 'thrust ring',
          MERKEZLEME_DAYAMA: 'thrust ring and upper bushing',
          BURC_TAKIMI: 'bushing set',
          KAMA: 'retainer key',
          KAMA_PIMI: 'retainer pin',
          BOY_SAPLAMA: 'through bolt',
          YAN_SAPLAMA: 'side bolt',
          PISTON: 'piston',
          TAMIR_TAKIMI: 'seal kit',
          ASINMA_PLAKASI: 'wear plate',
          ASINMA_SETI: 'wear plate set',
          TAKOZ_TEPE: 'top buffer',
          TAKOZ_YAN: 'side buffer',
          TAKOZ_ALT: 'bottom buffer',
          AKU_UST: 'accumulator top',
          AKU_ALT: 'accumulator bottom',
          AKU_SAPLAMA: 'accumulator bolt',
        },
      },
      order: {
        title: 'Order',
        body: 'The part, quantity and price go into the message; we reply with payment and shipping details.',
        wa: 'Order on WhatsApp',
        mail: 'Order by e-mail',
        delivery: 'Ships from stock the same day',
        text: (part, breaker, qty, price, url) =>
          `Hello, I would like to order ${qty} × ${breaker} ${part} (unit ${price}, export price).\n${url}`,
        other: 'Request a quote for another breaker',
        withNuts: 'Sold as a set, with its nuts',
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
    renderNote: '3D images; for illustration.',
    photoNote: 'Real photos of our stock at the plant.',
    oem: 'Made to OEM dimensions, a direct fit.',
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
      cookies: 'Cookie preferences',
      social: 'Social media',
      socials: {
        facebook: 'Kervan on Facebook',
        instagram: 'Kervan on Instagram',
        youtube: 'Kervan on YouTube',
        linkedin: 'Kervan on LinkedIn',
        x: 'Kervan on X',
        telegram: 'Kervan on Telegram',
      },
    },
    consent: {
      title: 'Cookie preference',
      body: 'We use Google Ads and OpenAI (ChatGPT) Ads cookies to measure our ads only if you allow it; the data goes abroad (USA). If you decline, the site and ordering work the same.',
      accept: 'Accept',
      reject: 'Decline',
      policy: 'Details',
    },
    notFound: {
      title: 'Page not found (404)',
      body: 'The page does not exist or has moved. Search your breaker model or browse our product groups.',
      home: 'Back to the home page',
      ask: 'Ask on WhatsApp',
    },
  },
};
