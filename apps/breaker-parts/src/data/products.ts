import type { Product } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   9 hidrolik kırıcı yedek parça ailesi.
   - Resmi olan parçalarda `image` dolu; diğerlerinde boş bırakılarak
     ProductCard'ın placeholder render'ı tetiklenir (Faz 6'da gerçek
     studio shot'larıyla doldurulacak).
   - subTypes sadece çeşit barındıran kategoriler için; çoğu parça tek
     formdadır.
═══════════════════════════════════════════════════════════════════════ */

export const PRODUCTS: Product[] = [
  {
    slug: 'keski',
    image: '/photos/uclar/uclar-yard.jpeg',
    tr: {
      name: 'Keski',
      tagline: 'Kırıcının ucu — taşla, betonla, asfaltla ilk temas.',
      body: 'Sahanın en sarf parçası. Sivri uç, yassı keski, asfalt keskisi ve özel ölçülerle stoklarımızda. Aşınmaya karşı 42CrMoA üzeri ısıl işlem disipliniyle dayanım.',
    },
    en: {
      name: 'Chisel',
      tagline: 'The point — first contact with stone, concrete, asphalt.',
      body: 'The most consumed part on the field. Moil point, flat chisel, asphalt cutter and custom sizes in stock. Built for wear with 42CrMoA-grade alloy and our heat-treatment discipline.',
    },
    subTypes: [
      {
        slug: 'moil',
        tr: { name: 'Sivri uç (Moil)', desc: 'Sert zemin: granit, beton, sert kaya' },
        en: { name: 'Moil point', desc: 'Hard ground: granite, concrete, hard rock' },
      },
      {
        slug: 'blunt',
        tr: { name: 'Yassı keski (Blunt)', desc: 'Yüzey işleri, beton kırma' },
        en: { name: 'Flat / Blunt chisel', desc: 'Surface work, concrete breaking' },
      },
      {
        slug: 'asphalt',
        tr: { name: 'Asfalt keskisi', desc: 'Yol bakımı, asfalt sökümü' },
        en: { name: 'Asphalt cutter', desc: 'Road maintenance, pavement removal' },
      },
    ],
  },
  {
    slug: 'piston',
    image: '/photos/pistonlar/pistons-stack.jpeg',
    tr: {
      name: 'Piston',
      tagline: 'Darbenin kaynağı. Yüksek frekansla çalışır, yılmaz durur.',
      body: 'Kırıcının kalbi. Hassas tolerans, sertleştirme + temperleme ile yüksek darbe dayanımı. Marka ve model bazlı farklı çap/boy varyasyonları stokludur.',
    },
    en: {
      name: 'Piston',
      tagline: 'The source of the strike. High frequency, doesn\'t flinch.',
      body: 'The heart of the hammer. Tight tolerance, hardened + tempered for high impact endurance. Multiple diameter / length variants per brand and model held in stock.',
    },
  },
  {
    slug: 'burc',
    image: '/photos/burclar/burclar-raf.jpeg',
    tr: {
      name: 'Burç',
      tagline: 'Sessiz kahraman. Piston ile keski arasında dengeyi kurar.',
      body: 'Üst ve alt burç olmak üzere iki konumlu. Sürtünmeye dayanıklı, ölçülü tolerans. Doğru burç olmazsa keski savrulur, piston yorulur — bu parça denge demek.',
    },
    en: {
      name: 'Bushing',
      tagline: 'The quiet hero. Holds balance between piston and chisel.',
      body: 'Upper and lower variants. Wear-resistant, measured tolerance. The wrong bushing throws the chisel and tires the piston — this part is balance.',
    },
  },
  {
    slug: 'tie-rod',
    image: '',
    tr: {
      name: 'Tie Rod (Gergi çubuğu)',
      tagline: 'Üst ve alt gövdeyi tek beden tutar.',
      body: 'Kırıcının iskeletini sıkıştıran çubuk. Yüksek çekme dayanımı, doğru ön gerilme. Aşırı yüklenmiş veya yorulmuş tie rod\'u zamanında değiştirmek, gövdeyi de korur.',
    },
    en: {
      name: 'Tie Rod',
      tagline: 'Holds the upper and lower body as one.',
      body: 'The skeleton-fastening rod. High tensile strength, correct preload. Replacing a fatigued tie rod in time also protects the housings.',
    },
  },
  {
    slug: 'tamir-kiti',
    image: '/photos/kit/seal-kit.jpeg',
    tr: {
      name: 'Tamir Kiti',
      tagline: 'Sızdırmazlık ve bağlantı parçaları. Ayrıntıların tümü.',
      body: 'O-ring, conta, sızdırmazlık seti, küçük bağlantı elemanları — periyodik bakımda tek pakette. Marka ve model bazlı eşleştirilmiş içerik.',
    },
    en: {
      name: 'Repair Kit',
      tagline: 'Seals and fasteners. All the small things.',
      body: 'O-rings, gaskets, seal sets, small connectors — every consumable in one pack for periodic maintenance. Matched per brand and model.',
    },
  },
  {
    slug: 'kama',
    image: '',
    tr: {
      name: 'Kama (Wedge)',
      tagline: 'Keskiyi kilitleyen sessiz parça.',
      body: 'Keskinin gövde içinde sabit kalmasını sağlayan dayanıklı kama. Aşınma simetrik olmazsa keski darbeyi tek tarafta yer — kamayı zamanında çevirin veya değiştirin.',
    },
    en: {
      name: 'Wedge',
      tagline: 'The quiet part that locks the chisel.',
      body: 'The hardened wedge that keeps the chisel in place inside the body. Asymmetric wear means lopsided strikes — rotate or replace in time.',
    },
  },
  {
    slug: 'alt-govde',
    image: '',
    tr: {
      name: 'Alt Gövde (Lower Housing)',
      tagline: 'Burçların ve keskinin yaşadığı yer.',
      body: 'Kırıcının dış kabuğunun alt yarısı. Burç yataklarını barındırır, sahaya çıkar, taşa çarpar. Çok aşınmadan değişimi kırıcının ömrünü uzatır.',
    },
    en: {
      name: 'Lower Housing',
      tagline: 'Where the bushings and chisel live.',
      body: 'The lower half of the breaker shell. Holds the bushing seats, takes the field abuse, hits stone. Replacing it before deep wear extends the whole machine\'s life.',
    },
  },
  {
    slug: 'saplama',
    image: '',
    tr: {
      name: 'Saplama (Stud)',
      tagline: 'Gövdeyi taşıyıcı plakaya bağlayan.',
      body: 'Hidrolik kırıcıyı ekskavatör adapter plakasına bağlayan dişli pim. Doğru tork, doğru malzeme — en sık kopan ama en az dikkat edilen parça.',
    },
    en: {
      name: 'Stud',
      tagline: 'Connects the body to the carrier plate.',
      body: 'The threaded pin that fastens the breaker to the excavator adapter plate. Right torque, right material — the part most often broken, least often inspected.',
    },
  },
  {
    slug: 'yan-saplama',
    image: '',
    tr: {
      name: 'Yan Saplama (Side Stud)',
      tagline: 'Yan yüzeyleri kilitleyen sabitleyici.',
      body: 'Kırıcının yan paneli ve gövde arasındaki sıkı kavramayı sağlayan saplama. Eşit aşınma için periyodik kontrol ve sıralı değişim önerilir.',
    },
    en: {
      name: 'Side Stud',
      tagline: 'The fastener that locks the side panels.',
      body: 'The stud that holds the side panel against the breaker body. Periodic inspection and sequenced replacement keep wear even.',
    },
  },
];

/** Map for O(1) slug lookups. */
export const PRODUCT_BY_SLUG: Record<string, Product> = Object.fromEntries(
  PRODUCTS.map((p) => [p.slug, p]),
);
