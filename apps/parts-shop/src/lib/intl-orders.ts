import type { Lang } from '../types';

/**
 * The "international orders" page (`/ihracat`, `/en/ihracat`): the terms an order from outside
 * Türkiye runs on, as rows of a table. Terms are the owner's (2026-11-14, after a research pass
 * on each): FCA instead of EXW (we load and open the export declaration ourselves), advance bank
 * transfer only (no card: a keyed card payment can be charged back after the goods have left),
 * packing included, stock ready 3 working days after the payment arrives, the domestic warranty
 * periods. Not on the page until the customs broker, the bank and a lawyer confirm them: origin
 * and movement certificates (A.TR, EUR.1), a liability cap, governing law, transit times.
 * No price, bank account, customer or destination of a real order here.
 */
export const INTL_PATH = '/ihracat';

export interface IntlText {
  /** Page name: h1, breadcrumb, footer link. */
  title: string;
  /** Meta description (at most 155 characters). */
  desc: string;
  lead: string;
  /** [label, lines]. */
  rows: [string, string[]][];
  /** Prefilled WhatsApp / e-mail text of the proforma request. */
  ask: string;
  /** E-mail subject. */
  subject: string;
}

export const INTL: Record<Lang, IntlText> = {
  tr: {
    title: 'İhracat',
    desc: 'Türkiye dışından hidrolik kırıcı yedek parça siparişi: FCA Kartepe fiyat, peşin havale, ihracat belgeleri, ambalaj, hazırlık süresi ve garanti.',
    lead: 'Türkiye dışındaki firmalar için sipariş koşulları.',
    rows: [
      [
        'Fiyat',
        ['Vergiler hariç net USD.', 'Teslim şekli: FCA Kartepe, Kocaeli (Incoterms 2020).'],
      ],
      ['Para birimi', ['Proforma fatura USD; istenirse EUR.']],
      [
        'Ödeme',
        [
          'Proforma faturaya karşı tamamı peşin, banka havalesi (SWIFT) ile.',
          'Banka masrafları alıcıya aittir.',
        ],
      ],
      [
        'Nakliye',
        [
          'Nakliyeciniz fabrikamızdan teslim alır (FCA) ya da kara nakliyesini biz ayarlar, proformaya ayrı satır olarak ekleriz (CPT).',
          'Nakliye sigortası dahil değildir.',
          'İthalat gümrüğü ve ithalat vergileri alıcıya aittir.',
        ],
      ],
      [
        'İhracat belgeleri',
        [
          'İhracat beyannamesini biz açar, ticari fatura ve çeki listesini veririz; proformada ayrı satırdır.',
        ],
      ],
      [
        'Ambalaj',
        [
          'ISPM 15 damgalı, ısıl işlemli ahşap sandık veya palet; küçük parçalar kolide.',
          'Fiyata dahildir.',
        ],
      ],
      [
        'Hazırlık süresi',
        [
          'Stoktaki ürünler, ödeme hesabımıza geçtikten sonra 3 iş günü içinde sevke hazır olur.',
          'Taşıma süresi proformada bildirilir.',
        ],
      ],
      [
        'Teslim alırken',
        ['Sandığı kontrol edin; hasar varsa imzalamadan önce taşıma belgesine yazdırın.'],
      ],
      [
        'Garanti',
        [
          'Malzeme ve üretim (ısıl işlem dahil) hatalarına karşı: alt gövde ve pistonlarda 6 ay, burçlarda 3 ay, diğer ürünlerde 2 ay.',
          'Süre teslimle başlar; en geç sevkten 30 gün (deniz yolunda 60 gün) sonra başlamış sayılır.',
          'Başvuru: arızadan sonra 30 gün içinde kırık yüzeyin, parçanın tamamının ve üzerindeki kodun fotoğrafları. Parça yalnızca biz istersek geri gönderilir.',
          'Çözüm: yeni parça ya da parçanın bedeli.',
        ],
      ],
    ],
    ask: 'Merhaba, yurt dışı sipariş için proforma fatura istiyorum.\nFirma / ülke:\nKırıcı marka ve modeli:\nParçalar ve adetler:',
    subject: 'Yurt dışı sipariş: proforma talebi',
  },
  en: {
    title: 'International orders',
    desc: 'Ordering hydraulic breaker spare parts from outside Türkiye: FCA Kartepe prices, advance bank transfer, export documents, packing, lead time, warranty.',
    lead: 'Order terms for business buyers outside Türkiye.',
    rows: [
      [
        'Price',
        [
          'Net USD, Turkish taxes excluded.',
          'Delivery term: FCA Kartepe, Kocaeli (Incoterms 2020).',
        ],
      ],
      ['Currency', ['Proforma invoice in USD; EUR on request.']],
      [
        'Payment',
        [
          '100% in advance by bank transfer (SWIFT) against the proforma invoice.',
          'Bank charges are paid by the buyer.',
        ],
      ],
      [
        'Freight',
        [
          'Your forwarder collects at our plant (FCA), or we arrange road freight and add it to the proforma as a separate line (CPT).',
          'Transport insurance is not included.',
          'Import clearance, duties and import taxes are paid by the buyer.',
        ],
      ],
      [
        'Export documents',
        [
          'We open the Turkish export declaration and supply the commercial invoice and packing list; a separate line on the proforma.',
        ],
      ],
      [
        'Packing',
        [
          'Heat-treated wooden crate or pallet with the ISPM 15 mark; small parts in cartons.',
          'Included in the price.',
        ],
      ],
      [
        'Lead time',
        [
          'Stock items are ready to leave our plant within 3 working days after the payment reaches our account.',
          'Transit time is stated on the proforma.',
        ],
      ],
      [
        'On delivery',
        ["Check the crate; have any damage noted on the carrier's document before you sign."],
      ],
      [
        'Warranty',
        [
          'Against material and manufacturing (heat treatment included) defects: 6 months for front heads and pistons, 3 months for bushings, 2 months for other products.',
          'The period starts on delivery, and at the latest 30 days after dispatch (60 days by sea).',
          'Claims: photos of the fracture surface, the whole part and the code stamped on it, within 30 days of the failure. The part is returned only if we ask for it.',
          'Remedy: a replacement part or the price of the part.',
        ],
      ],
    ],
    ask: 'Hello, I would like a proforma invoice for an international order.\nCompany / country:\nBreaker make and model:\nParts and quantities:',
    subject: 'International order: proforma request',
  },
};
