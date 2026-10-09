import { ORG_EMAIL, ORG_PHONE } from '@kervan/seo';
import type { Lang } from '../types';

/**
 * The shop's legal pages (distance-selling pre-information, contract, returns, privacy).
 * Turkish is the binding text; the English pages are a translation. Seller details are the
 * company's registered ones (owner); they differ from the trading name used elsewhere.
 */
export const LEGAL_KEYS = ['on-bilgilendirme', 'mesafeli-satis', 'iade-ve-cayma', 'kvkk'] as const;
export type LegalKey = (typeof LEGAL_KEYS)[number];
export const LEGAL_PATH = '/yasal';
export const legalPath = (k: LegalKey): string => `${LEGAL_PATH}/${k}`;

export const SELLER = {
  name: 'Kervan Isıl İşlem ve Makine San. Tic. Ltd. Şti.',
  address: 'Uzunçiftlik Mh. Sadun Atığ Cd. No:112, Kartepe / Kocaeli',
  tax: 'Alemdar V.D. 5451088184',
  phone: '0 (262) 371 10 05',
  fax: '0 (262) 371 10 04',
  mobile: ORG_PHONE,
  email: ORG_EMAIL,
  web: 'magaza.kervanbreaker.com',
} as const;

export interface LegalSection {
  h: string;
  p: string[];
}
export interface LegalDoc {
  title: string;
  desc: string;
  sections: LegalSection[];
}

export const UPDATED = '2026-10-07';

const sellerTr: LegalSection = {
  h: 'Satıcı bilgileri',
  p: [
    `Unvan: ${SELLER.name}`,
    `Adres: ${SELLER.address}`,
    `Vergi dairesi ve numarası: ${SELLER.tax}`,
    `Telefon: ${SELLER.phone} · Mobil / WhatsApp: ${SELLER.mobile} · Faks: ${SELLER.fax}`,
    `E-posta: ${SELLER.email} · İnternet sitesi: ${SELLER.web}`,
  ],
};
const sellerEn: LegalSection = {
  h: 'Seller',
  p: [
    `Company: ${SELLER.name}`,
    `Address: ${SELLER.address}, Türkiye`,
    `Tax office and number: ${SELLER.tax}`,
    `Phone: ${SELLER.phone} · Mobile / WhatsApp: ${SELLER.mobile} · Fax: ${SELLER.fax}`,
    `E-mail: ${SELLER.email} · Website: ${SELLER.web}`,
  ],
};

const TR: Record<LegalKey, LegalDoc> = {
  'on-bilgilendirme': {
    title: 'Ön bilgilendirme formu',
    desc: 'Mesafeli satışlarda sözleşme kurulmadan önce alıcıya verilen bilgiler.',
    sections: [
      sellerTr,
      {
        h: 'Ürünün temel nitelikleri',
        p: [
          'Ürünler Satıcı tarafından üretilen hidrolik kırıcı uçları ve yedek parçalarıdır. Ürünün uyduğu kırıcı marka ve modeli, uç tipi ve çalışma çapı ürün sayfasında yazılıdır. Marka ve model adları yalnızca uyumu belirtir; ürünler kırıcı üreticisinin orijinal parçası değildir.',
          'Ürün görselleri temsilidir; ölçüler ürün sayfasındaki bilgilere ve sipariş onayına göre geçerlidir.',
        ],
      },
      {
        h: 'Fiyat, vergiler ve kargo',
        p: [
          'Ürün sayfalarında fiyat ABD doları ve Türk lirası olarak gösterilir; Türk lirası tutarı Türkiye Cumhuriyet Merkez Bankası’nın sayfada tarihi yazan döviz satış kuruyla hesaplanır.',
          'Vergiler dahil toplam satış bedeli, kargo ücreti ve ödeme bilgileri, sipariş talebiniz üzerine Satıcı’nın göndereceği sipariş onayında ayrıca gösterilir. Kargo ücreti Alıcı’ya aittir.',
          'Sipariş onayında bildirilen fiyat, onayda yazan süre boyunca geçerlidir.',
        ],
      },
      {
        h: 'Siparişin verilmesi ve ödeme',
        p: [
          'Sitede online ödeme yoktur. Paletteki (sepetteki) ürünler WhatsApp ya da e-posta ile sipariş talebi olarak Satıcı’ya iletilir. Satıcı, stok ve fiyatı teyit ederek sipariş onayını gönderir; Alıcı’nın onayı ve ödemesiyle sözleşme kurulur.',
          'Ödeme kredi kartı veya banka havalesi/EFT ile yapılır. Kart ödemesinde kullanılacak yöntem sipariş onayında bildirilir; kart bilgileri bu siteye girilmez ve site tarafından saklanmaz.',
        ],
      },
      {
        h: 'Teslimat',
        p: [
          'Stoktaki ürünler ödemenin Satıcı’ya ulaştığı gün kargoya verilir. Stokta olmayan veya siparişe göre üretilen ürünlerde teslim süresi sipariş onayında bildirilir ve her durumda 30 günü geçemez.',
          'Ürün, Alıcı’nın sipariş onayında belirttiği adrese kargo ile gönderilir. Teslim sırasında paket hasarlıysa tutanak tutturulması rica olunur.',
        ],
      },
      {
        h: 'Cayma hakkı',
        p: [
          'Tüketici niteliğindeki Alıcı, ürünü teslim aldığı günden itibaren 14 gün içinde hiçbir gerekçe göstermeden ve cezai şart ödemeden sözleşmeden cayabilir. Ayrıntılar ve istisnalar “İade ve cayma” sayfasındadır.',
          'Alıcı’nın istekleri veya kişisel ihtiyaçları doğrultusunda özel olarak üretilen ürünlerde cayma hakkı kullanılamaz.',
        ],
      },
      {
        h: 'Garanti ve şikâyetler',
        p: [
          'Ürünler teslimden itibaren 3 ay süreyle malzeme ve üretim (ısıl işlem dahil) hatalarına karşı garantilidir. Normal aşınma, boşta vuruş, ucu levye gibi kullanma, yanal veya eğik vuruş, aşınmış burç ile çalışma, yağlamasız kullanma ve yanlış uç seçiminden doğan hasarlar garanti dışıdır. Tüketicinin 6502 sayılı Kanun’dan doğan ayıplı mal hakları saklıdır.',
          `Talep ve şikâyetlerinizi ${SELLER.email} adresine veya ${SELLER.phone} numarasına iletebilirsiniz.`,
          'Tüketici uyuşmazlıklarında, Ticaret Bakanlığı’nca her yıl belirlenen parasal sınırlar içinde Alıcı’nın veya Satıcı’nın yerleşim yerindeki tüketici hakem heyetine, bu sınırların üzerinde tüketici mahkemesine başvurulabilir.',
        ],
      },
      { h: 'Güncelleme', p: [`Bu form en son ${UPDATED} tarihinde güncellenmiştir.`] },
    ],
  },
  'mesafeli-satis': {
    title: 'Mesafeli satış sözleşmesi',
    desc: 'magaza.kervanbreaker.com üzerinden verilen siparişlerde geçerli satış sözleşmesi.',
    sections: [
      {
        h: '1. Taraflar',
        p: [
          `Satıcı: ${SELLER.name}, ${SELLER.address}, ${SELLER.tax}, telefon ${SELLER.phone}, e-posta ${SELLER.email}.`,
          'Alıcı: Sipariş talebini gönderen ve sipariş onayında adı, adresi ve iletişim bilgileri yazan gerçek veya tüzel kişi.',
        ],
      },
      {
        h: '2. Konu',
        p: [
          'Bu sözleşme, Alıcı’nın magaza.kervanbreaker.com üzerinden talep ettiği ve Satıcı’nın sipariş onayında cinsi, miktarı, vergiler dahil satış bedeli, kargo ücreti ve ödeme şekli yazılı ürünlerin satışı ve teslimine ilişkin hak ve yükümlülükleri 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca düzenler.',
        ],
      },
      {
        h: '3. Sözleşmenin kurulması',
        p: [
          'Alıcı, sipariş talebini göndermeden önce ön bilgilendirme formunu okuyup anladığını kabul eder. Sözleşme, Satıcı’nın gönderdiği sipariş onayının Alıcı tarafından onaylanması ve ödemenin yapılmasıyla kurulur. Satıcı, sözleşmenin kurulmasından sonra bu sözleşmeyi ve ön bilgilendirme formunu kalıcı veri saklayıcısıyla (e-posta veya mesaj) Alıcı’ya iletir.',
        ],
      },
      {
        h: '4. Ödeme',
        p: [
          'Bedel, sipariş onayında bildirilen yöntemle kredi kartı veya banka havalesi/EFT ile ödenir. Havale/EFT’de açıklamaya sipariş onayındaki ad veya firma adı yazılmalıdır. Kargo ücreti Alıcı’ya aittir.',
        ],
      },
      {
        h: '5. Teslimat',
        p: [
          'Stoktaki ürünler ödemenin Satıcı’ya ulaştığı gün kargoya verilir. Diğer ürünlerde teslim süresi sipariş onayında bildirilir ve 30 günü geçemez. Satıcı bu sürede teslim edemeyeceğini anlarsa Alıcı’ya bildirir; Alıcı sözleşmeyi feshedebilir ve ödediği bedel 14 gün içinde iade edilir.',
          'Ürün, kargo firmasına teslimle birlikte Alıcı’nın talep ettiği adrese gönderilir. Tüketici olan Alıcı açısından ürün, kendisine veya gösterdiği kişiye teslim edilinceye kadar oluşan kayıp ve hasardan Satıcı sorumludur.',
        ],
      },
      {
        h: '6. Cayma hakkı',
        p: [
          'Tüketici olan Alıcı, ürünü teslim aldığı günden itibaren 14 gün içinde gerekçe göstermeden cayabilir. Cayma bildirimi bu süre içinde e-posta, WhatsApp veya yazılı olarak Satıcı’ya yapılır. Alıcı, bildirimden itibaren 10 gün içinde ürünü Satıcı’ya geri gönderir. Satıcı, bildirimin ulaşmasından itibaren 14 gün içinde ürün bedelini ve tahsil edilen teslim masrafını ödeme yöntemine uygun şekilde iade eder.',
          'Satıcı’nın iade için belirttiği kargo firmasıyla yapılan gönderimde iade kargo ücreti Satıcı’ya aittir. Ürünün olağan kullanımı dışında kullanılmasından doğan değer kaybından Alıcı sorumludur.',
          'Alıcı’nın istekleri veya kişisel ihtiyaçları doğrultusunda özel olarak üretilen ürünlerde cayma hakkı yoktur. Cayma hakkı, ticari veya mesleki amaçla hareket eden (tacir) alıcılar için geçerli değildir.',
        ],
      },
      {
        h: '7. Garanti ve ayıplı mal',
        p: [
          'Ürünler teslimden itibaren 3 ay süreyle malzeme ve üretim (ısıl işlem dahil) hatalarına karşı garantilidir. Normal aşınma ve hatalı kullanımdan doğan hasarlar garanti dışıdır. İnceleme için kırık parça ve fotoğrafları istenir. Tüketici olan Alıcı’nın 6502 sayılı Kanun’un 11. maddesindeki seçimlik hakları saklıdır.',
        ],
      },
      {
        h: '8. Uyuşmazlıklar',
        p: [
          'Tüketici uyuşmazlıklarında, her yıl belirlenen parasal sınırlar içinde tüketici hakem heyetleri, bu sınırların üzerinde tüketici mahkemeleri yetkilidir. Tacir alıcılarla uyuşmazlıklarda Kocaeli mahkemeleri ve icra daireleri yetkilidir.',
        ],
      },
      {
        h: '9. Yürürlük',
        p: [
          `Bu sözleşme, sipariş onayıyla birlikte yürürlüğe girer. Metin en son ${UPDATED} tarihinde güncellenmiştir.`,
        ],
      },
    ],
  },
  'iade-ve-cayma': {
    title: 'İade ve cayma',
    desc: 'Cayma hakkı, iade süreci ve garanti kapsamındaki ürünler.',
    sections: [
      {
        h: '14 gün içinde cayma (tüketiciler)',
        p: [
          'Ürünü teslim aldığınız günden itibaren 14 gün içinde gerekçe göstermeden cayabilirsiniz. Bunun için sipariş bilgilerinizle birlikte bize e-posta, WhatsApp veya yazılı olarak bildirimde bulunmanız yeterlidir.',
          'Bildiriminizden itibaren 10 gün içinde ürünü, kullanılmamış ve mümkünse ambalajıyla geri gönderin. İade için anlaşmalı kargo firmamızı ve gönderi kodunu size bildiririz; bu firmayla yapılan iade gönderiminin ücreti bize aittir.',
          'Bildiriminiz bize ulaştıktan sonra en geç 14 gün içinde ödediğiniz ürün bedelini ve tahsil edilen teslim masrafını, ödeme yönteminize uygun şekilde iade ederiz.',
        ],
      },
      {
        h: 'Cayma hakkının olmadığı durumlar',
        p: [
          'İsteğiniz veya ölçüleriniz doğrultusunda özel olarak üretilen ürünler.',
          'Ticari veya mesleki amaçla (fatura firma adına, tacir olarak) yapılan alımlar: bu alımlarda iade, karşılıklı anlaşmayla yapılır ve iade kargo ücreti alıcıya aittir.',
          'Olağan kullanım dışında kullanılmış, montajı yapılmış veya hasar görmüş ürünlerde değer kaybından alıcı sorumludur.',
        ],
      },
      {
        h: 'Hatalı veya hasarlı ürün',
        p: [
          'Ürün size hasarlı ya da yanlış ulaştıysa veya malzeme ya da üretim hatası taşıyorsa, fotoğraflarıyla birlikte bize bildirin. Garanti süresi teslimden itibaren 3 aydır. Hatalı ürünlerde gönderim ve iade masrafları bize aittir; ürünü onarır, değiştirir veya bedelini iade ederiz.',
          'Normal aşınma, boşta vuruş, ucu levye gibi kullanma, yanal veya eğik vuruş, aşınmış burç ile çalışma, yağlamasız kullanma ve yanlış uç seçiminden doğan hasarlar garanti kapsamında değildir.',
        ],
      },
      { h: 'İletişim', p: [sellerTr.p[0], sellerTr.p[3], sellerTr.p[4]] },
    ],
  },
  kvkk: {
    title: 'Kişisel verilerin korunması (KVKK) aydınlatma metni',
    desc: 'magaza.kervanbreaker.com’da kişisel verilerin nasıl işlendiği.',
    sections: [
      {
        h: 'Veri sorumlusu',
        p: [
          `${SELLER.name}, ${SELLER.address}. 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca veri sorumlusudur.`,
        ],
      },
      {
        h: 'Hangi veriler işlenir',
        p: [
          'Site bir üyelik veya form sistemi içermez ve kişisel veri saklamaz. Paletiniz (sepetiniz) yalnızca kendi tarayıcınızın yerel belleğinde tutulur; bize gönderilmez. Sitede çerez kullanılmaz.',
          'Sipariş talebini WhatsApp veya e-posta ile gönderdiğinizde, mesajda yazan bilgiler (ad, firma, telefon, şehir, not, sipariş içeriği) ve mesajı gönderdiğiniz numara veya e-posta adresi tarafımıza ulaşır. Sipariş onayında teslimat adresi ve fatura bilgileri de istenir.',
          'Siteyi barındıran Cloudflare, güvenlik ve işletim amacıyla IP adresi ve tarayıcı bilgisi gibi teknik kayıtları tutar. Ziyaret istatistikleri çerezsiz ve kişiyi tanımlamayan biçimde ölçülebilir.',
        ],
      },
      {
        h: 'Amaç ve hukuki sebep',
        p: [
          'Veriler; sipariş talebinizi yanıtlamak, sözleşmeyi kurup ifa etmek, ürünü teslim etmek, faturalandırmak, iade ve garanti taleplerini yürütmek ve yasal yükümlülüklerimizi yerine getirmek için işlenir (KVKK m.5/2-c, ç ve f). Teknik kayıtlar sitenin güvenliği için meşru menfaat kapsamında tutulur.',
        ],
      },
      {
        h: 'Aktarım',
        p: [
          'Veriler, siparişin teslimi için kargo firmasına, ödemenin alınması için bankalara, yasal yükümlülükler için yetkili kamu kurumlarına ve muhasebe hizmeti alınan kişilere aktarılabilir.',
          'WhatsApp (Meta), e-posta sağlayıcıları ve Cloudflare yurt dışında sunucuları bulunan hizmetlerdir. Bu kanalları kullanarak bize ulaştığınızda verileriniz, sizin seçtiğiniz iletişim aracı üzerinden KVKK m.9 kapsamında yurt dışına aktarılmış olur. İsterseniz telefonla da sipariş verebilirsiniz.',
        ],
      },
      {
        h: 'Saklama süresi',
        p: [
          'Sipariş ve fatura kayıtları ilgili mevzuatın öngördüğü süre boyunca (vergi ve ticaret mevzuatı gereği 10 yıl) saklanır; sonuçlanmayan sipariş talepleri en geç 1 yıl içinde silinir.',
        ],
      },
      {
        h: 'Haklarınız',
        p: [
          'KVKK m.11 uyarınca verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltme, silme, aktarıldığı kişileri öğrenme, itiraz etme ve zararın giderilmesini isteme haklarına sahipsiniz.',
          `Başvurularınızı ${SELLER.email} adresine veya yazılı olarak ${SELLER.address} adresine iletebilirsiniz. Başvurular en geç 30 gün içinde ücretsiz yanıtlanır.`,
        ],
      },
      { h: 'Güncelleme', p: [`Bu metin en son ${UPDATED} tarihinde güncellenmiştir.`] },
    ],
  },
};

const BINDING = 'This is a translation; the Turkish text is binding.';

const EN: Record<LegalKey, LegalDoc> = {
  'on-bilgilendirme': {
    title: 'Pre-contract information',
    desc: 'Information given to the buyer before a distance sale.',
    sections: [
      { h: 'Note', p: [BINDING] },
      sellerEn,
      {
        h: 'Products',
        p: [
          'Hydraulic breaker tips and spare parts made by the Seller. The breaker make and model, tip type and working diameter are shown on the product page. Make and model names only show the fit; the products are not the breaker maker’s original parts. Pictures are illustrations.',
        ],
      },
      {
        h: 'Price, taxes and shipping',
        p: [
          'Prices are shown in US dollars and Turkish lira, the lira amount at the Central Bank of the Republic of Türkiye selling rate dated on the page. The total price including taxes, the shipping cost and the payment details are given in the order confirmation the Seller sends. Shipping is paid by the buyer.',
        ],
      },
      {
        h: 'Ordering and payment',
        p: [
          'There is no online payment on the site. The cart is sent to the Seller as an order request by WhatsApp or e-mail; the Seller confirms stock and price, and the contract is made when the buyer accepts the confirmation and pays. Payment by credit card or bank transfer; card details are never entered on or stored by this site.',
        ],
      },
      {
        h: 'Delivery',
        p: [
          'Items in stock ship the day payment reaches the Seller. For other items the delivery time is given in the confirmation and never exceeds 30 days.',
        ],
      },
      {
        h: 'Right of withdrawal, warranty, complaints',
        p: [
          'Consumers may withdraw within 14 days of delivery without giving a reason (see “Returns and withdrawal”); items made to the buyer’s own specification are excluded. The products carry a 3-month warranty from delivery against material and manufacturing (including heat treatment) defects; wear and misuse are not covered. Consumers’ statutory rights are not affected.',
          `Complaints: ${SELLER.email}, ${SELLER.phone}. Consumer disputes go to the consumer arbitration committee or consumer court as provided by Turkish law.`,
        ],
      },
    ],
  },
  'mesafeli-satis': {
    title: 'Distance sales contract',
    desc: 'The sales contract for orders placed through magaza.kervanbreaker.com.',
    sections: [
      { h: 'Note', p: [BINDING] },
      {
        h: '1. Parties and subject',
        p: [
          `Seller: ${SELLER.name}, ${SELLER.address}, ${SELLER.tax}. Buyer: the person or company named in the order confirmation. The contract covers the sale and delivery of the items, quantities and prices in the order confirmation under Turkish Consumer Protection Law No. 6502 and the Distance Contracts Regulation.`,
        ],
      },
      {
        h: '2. Formation, payment and delivery',
        p: [
          'The contract is made when the buyer accepts the Seller’s order confirmation and pays by credit card or bank transfer. Shipping is paid by the buyer. Items in stock ship the day payment arrives; others within the time in the confirmation and never later than 30 days. The Seller sends this contract and the pre-contract information to the buyer by e-mail or message.',
        ],
      },
      {
        h: '3. Withdrawal',
        p: [
          'A consumer buyer may withdraw within 14 days of delivery by notifying the Seller and returns the item within 10 days of the notice. Returns through the carrier named by the Seller are free; the Seller refunds the price and the delivery cost within 14 days of the notice. Items made to the buyer’s specification and purchases by businesses are excluded.',
        ],
      },
      {
        h: '4. Warranty and disputes',
        p: [
          '3-month warranty from delivery against material and manufacturing defects; consumers’ statutory rights for defective goods are reserved. Consumer disputes: consumer arbitration committees and consumer courts; disputes with businesses: the courts of Kocaeli.',
        ],
      },
    ],
  },
  'iade-ve-cayma': {
    title: 'Returns and withdrawal',
    desc: 'Right of withdrawal, returns and warranty claims.',
    sections: [
      { h: 'Note', p: [BINDING] },
      {
        h: 'Withdrawal within 14 days (consumers)',
        p: [
          'You may withdraw within 14 days of delivery without giving a reason: tell us by e-mail, WhatsApp or in writing, then send the item back unused within 10 days. We give you our contracted carrier and a return code; returns with that carrier are free. We refund the price and the delivery cost within 14 days of your notice.',
        ],
      },
      {
        h: 'No right of withdrawal',
        p: [
          'Items made to your own specification; purchases for business purposes (returns by agreement, return shipping paid by the buyer); loss of value from use beyond inspection is the buyer’s responsibility.',
        ],
      },
      {
        h: 'Faulty or damaged items',
        p: [
          'Tell us with photos if an item arrives damaged or wrong or has a material or manufacturing defect (warranty: 3 months from delivery). For faulty items we pay the shipping both ways and repair, replace or refund. Wear and misuse (blank firing, prying, side strikes, worn bushing, no grease, wrong tip) are not covered.',
        ],
      },
      { h: 'Contact', p: [sellerEn.p[0], sellerEn.p[3], sellerEn.p[4]] },
    ],
  },
  kvkk: {
    title: 'Privacy notice (KVKK)',
    desc: 'How personal data is handled on magaza.kervanbreaker.com.',
    sections: [
      { h: 'Note', p: [BINDING] },
      {
        h: 'Controller and data',
        p: [
          `${SELLER.name}, ${SELLER.address}, is the data controller under Turkish Law No. 6698. The site has no accounts or forms, sets no cookies and stores no personal data; your cart stays in your own browser. When you send an order request by WhatsApp or e-mail we receive what the message contains and your number or address; the confirmation also asks for delivery and invoice details. Cloudflare, which hosts the site, keeps technical logs such as IP addresses for security.`,
        ],
      },
      {
        h: 'Purpose, transfers, retention',
        p: [
          'Data is used to answer the request, make and perform the contract, deliver, invoice and handle returns and warranty claims, and to meet legal duties. It may go to the carrier, banks, authorities and our accountants. WhatsApp, e-mail providers and Cloudflare run servers abroad; using them sends your data abroad through the channel you choose (you may also order by phone). Order and invoice records are kept for 10 years as required by law; requests that do not lead to an order are deleted within a year.',
        ],
      },
      {
        h: 'Your rights',
        p: [
          `You have the rights in Article 11 of the Law (access, correction, deletion, objection and more). Write to ${SELLER.email} or to our address; we reply free of charge within 30 days.`,
        ],
      },
    ],
  },
};

export const LEGAL: Record<Lang, Record<LegalKey, LegalDoc>> = { tr: TR, en: EN };

/** Section anchor on a legal page (index-based: ASCII and stable). */
export const legalAnchor = (i: number): string => `m${i + 1}`;

/** The seller-details section (drawn as a definition list on the page). */
export const isSellerSection = (s: LegalSection): boolean => s === sellerTr || s === sellerEn;
