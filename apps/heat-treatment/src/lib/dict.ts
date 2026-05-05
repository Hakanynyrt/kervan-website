import type { Dict } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   Heat-treatment dictionary — TR (default) / EN.
   Kontrollü atmosfer pit-tip fırınlarda fason ısıl işlem.
═══════════════════════════════════════════════════════════════════════ */

export const DICT: Dict = {
  tr: {
    nav: {
      services: 'Hizmetler',
      capacity: 'Teknik Kapasite',
      craft: 'İmalathanemiz',
      about: 'Hakkımızda',
      contact: 'İletişim',
      cta: 'Teklif Al',
    },
    hero: {
      eyebrow: 'Kartepe · Kocaeli',
      title1: 'Kontrollü atmosfer pit-tip',
      title2: 'fırınlarda fason ısıl işlem.',
      sub: 'Sertleştirme, temperleme, sementasyon. 42CrMo, 42CrMoA ve diğer alaşımlar — kendi ölçüm ve kontrol disiplinimizle.',
      cta: 'Teklif Al',
      ctaSecondary: 'Hizmetler',
      stats: [
        { n: '1+2',     l: 'sementasyon + temper potası' },
        { n: 'Ø1200',   l: 'mm max çap' },
        { n: '2.5 t',   l: 'tek sefer max yük' },
        { n: '42CrMo',  l: 'standart alaşım' },
      ],
    },
    services: {
      eyebrow: 'Hizmetler',
      title: 'Üç ana süreç. Tek disiplin.',
      aside: 'Her parti için malzeme analizi, kontrollü atmosfer, ölçülmüş sıcaklık eğrisi. Lot izi sonuna kadar açık.',
      items: [
        {
          index: '01',
          name: 'Sertleştirme & Temperleme',
          body: 'Pit-tip fırında ısıtma, kontrollü soğutma, ardından temper potasında stres giderimi. İki potalı temper hattı sayesinde aynı gün içinde iki ayrı sıcaklık eğrisi paralel çalışabilir.',
          bullets: [
            'Yağ ve hava soğutma',
            'Çift potalı temper — paralel sıcaklık',
            'Yüzey sertlik kontrolü, lot başı',
          ],
        },
        {
          index: '02',
          name: 'Sementasyon',
          body: 'Propan-hava karışımı ile karbon zenginleştirme. Default tek sementasyon — gerekli olmadıkça ikinci pasaja geçilmez. Müşteri istediğinde veya geometri zorladığında ikinci sementasyon talep üzerine yapılır.',
          bullets: [
            'Propan-hava atmosfer',
            'Default tek sementasyon',
            'Gerekirse ikinci pasaj — talep üzerine',
          ],
        },
        {
          index: '03',
          name: 'Fason Isıl İşlem',
          body: 'Standart hizmet listesinin dışına çıkan ihtiyaçlar için: özel alaşım, özel sıcaklık eğrisi, özel parti büyüklüğü. Önce numune, sonra seri.',
          bullets: [
            'Diğer alaşımlar — talep üzerine',
            'Özel sıcaklık eğrisi',
            'Numune → seri akış',
          ],
        },
      ],
    },
    capacity: {
      eyebrow: 'Teknik Kapasite',
      title: 'Sayılarla atölye.',
      aside: 'Bir bakışta fırın kapasitesi, malzeme yelpazesi ve ölçüm disiplini.',
      items: [
        { value: '1', label: 'Sementasyon potası', note: 'Propan-hava karışımı atmosfer' },
        { value: '2', label: 'Temper potası', note: 'Paralel iki sıcaklık eğrisi' },
        { value: 'Ø1200 mm', label: 'Max parça çapı', note: 'Pit-tip fırın iç ölçüsü' },
        { value: '2.5 ton', label: 'Tek sefer max yük', note: 'Brüt parti ağırlığı' },
        { value: 'OES', label: 'Spektrometre', note: 'Lot başı malzeme analizi' },
        { value: '42CrMo · 42CrMoA', label: 'Standart alaşımlar', note: 'Diğerleri — talep üzerine' },
      ],
    },
    craft: {
      eyebrow: 'İmalathanemiz',
      title: 'Sıcaklık sabırla yükselir.',
      body: 'Fırın bir tezgâh değil; bir saat. Termokupldan gelen her okuma, atmosferdeki her oksijen seviyesi, eğrideki her dakika — hepsi parçanın iç yapısına yazılır. Burada acele etmek yok; doğru sıcaklık, doğru süre, doğru soğutma. Ve bunun arkasında, on yıllardır aynı tezgâhın başında olan eller.',
    },
    about: {
      eyebrow: 'Hakkımızda',
      title: 'Kervan Isıl İşlem San. Tic. Ltd. Şti.',
      body: 'Kartepe / Kocaeli\'de fason ısıl işlem hizmeti veriyoruz. Türkiye\'nin sanayi koridorunun ortasında — gelen parçayı ölçer, işler, kontrol eder ve aynı disiplinle teslim ederiz. Her partinin ardında bir lot kaydı, bir spektrometre okuması ve bir sertlik testi vardır.',
      company: 'Kervan Isıl İşlem San. Tic. Ltd. Şti.',
      location: 'Kartepe · Kocaeli',
    },
    contact: {
      eyebrow: 'İletişim',
      title: 'Bir mesaj, bir cevap.',
      sub: 'Parça çizimini veya malzeme bilgisini paylaş, yirmi dört saat içinde dönüş yapalım.',
      fields: {
        name: 'Ad Soyad',
        company: 'Firma',
        email: 'E-posta',
        phone: 'Telefon',
        message: 'Hangi alaşım, hangi parti büyüklüğü, hangi süreç?',
      },
      kvkk: 'KVKK Aydınlatma Metni\'ni okudum, iletişim için bilgilerimin işlenmesini kabul ediyorum.',
      submit: 'Gönder',
      sending: 'Gönderiliyor…',
      success: 'Aldık. En kısa sürede dönüyoruz.',
      error: 'Bir sorun oldu. +90 531 669 37 34\'ü arayabilirsin.',
      address: 'Kartepe · Kocaeli',
      phoneLabel: 'Telefon',
      whatsappLabel: 'WhatsApp',
      emailLabel: 'E-posta',
      instagramLabel: 'Instagram',
      hoursLabel: 'Çalışma',
      hours: 'Pzt–Cmt · 08:00–18:00',
    },
    footer: {
      brand: 'Kervan Heat',
      tag: 'Kartepe · Kocaeli',
      rights: '© 2026 Kervan Isıl İşlem San. Tic. Ltd. Şti. Tüm hakları saklıdır.',
      kvkk: 'KVKK',
    },
  },

  en: {
    nav: {
      services: 'Services',
      capacity: 'Capacity',
      craft: 'Our Workshop',
      about: 'About',
      contact: 'Contact',
      cta: 'Get a Quote',
    },
    hero: {
      eyebrow: 'Kartepe · Kocaeli',
      title1: 'Contract heat treatment in',
      title2: 'controlled-atmosphere pit furnaces.',
      sub: 'Hardening, tempering, carburizing. 42CrMo, 42CrMoA and other alloys — under our own measurement and control discipline.',
      cta: 'Get a Quote',
      ctaSecondary: 'Services',
      stats: [
        { n: '1+2',     l: 'carburizing + tempering pots' },
        { n: 'Ø1200',   l: 'mm max diameter' },
        { n: '2.5 t',   l: 'max load per batch' },
        { n: '42CrMo',  l: 'standard alloy' },
      ],
    },
    services: {
      eyebrow: 'Services',
      title: 'Three core processes. One discipline.',
      aside: 'Material analysis per batch, controlled atmosphere, measured temperature curves. The lot record stays open through delivery.',
      items: [
        {
          index: '01',
          name: 'Hardening & Tempering',
          body: 'Heating in a pit furnace, controlled cooling, then stress relief in the tempering pot. With two tempering pots, two distinct temperature curves can run in parallel within the same day.',
          bullets: [
            'Oil and air quench',
            'Two-pot tempering — parallel curves',
            'Surface hardness check, every lot',
          ],
        },
        {
          index: '02',
          name: 'Carburizing',
          body: 'Carbon enrichment via propane-air atmosphere. Single-pass carburizing by default — a second pass is only run when geometry or specification requires it.',
          bullets: [
            'Propane-air atmosphere',
            'Single-pass by default',
            'Second pass on request',
          ],
        },
        {
          index: '03',
          name: 'Bespoke Heat Treatment',
          body: 'For requirements outside the standard list: special alloys, special curves, special batch sizes. Sample first, then production run.',
          bullets: [
            'Other alloys on request',
            'Custom temperature curves',
            'Sample → production flow',
          ],
        },
      ],
    },
    capacity: {
      eyebrow: 'Capacity',
      title: 'The shop in numbers.',
      aside: 'Furnace capacity, material range and measurement discipline at a glance.',
      items: [
        { value: '1', label: 'Carburizing pot', note: 'Propane-air atmosphere' },
        { value: '2', label: 'Tempering pots', note: 'Two parallel temperature curves' },
        { value: 'Ø1200 mm', label: 'Max part diameter', note: 'Pit furnace inner dimension' },
        { value: '2.5 ton', label: 'Max load per batch', note: 'Gross batch weight' },
        { value: 'OES', label: 'Spectrometer', note: 'Material analysis per lot' },
        { value: '42CrMo · 42CrMoA', label: 'Standard alloys', note: 'Others on request' },
      ],
    },
    craft: {
      eyebrow: 'Our Workshop',
      title: 'Temperature rises with patience.',
      body: 'A furnace is not a bench; it is a clock. Every reading from the thermocouple, every oxygen level in the atmosphere, every minute on the curve — all of it is written into the part. There is no rushing here; the right temperature, the right time, the right cooling. Behind it, the same hands that have stood at the same furnace for decades.',
    },
    about: {
      eyebrow: 'About',
      title: 'Kervan Isıl İşlem San. Tic. Ltd. Şti.',
      body: 'We provide contract heat treatment in Kartepe / Kocaeli, in the heart of Türkiye\'s industrial corridor. We measure the part, run the process, verify the result and ship it back — with the same discipline every time. Behind every batch is a lot record, a spectrometer reading and a hardness test.',
      company: 'Kervan Isıl İşlem San. Tic. Ltd. Şti.',
      location: 'Kartepe · Kocaeli · Türkiye',
    },
    contact: {
      eyebrow: 'Contact',
      title: 'One message, one answer.',
      sub: 'Share the drawing or material spec — we will come back within twenty-four hours.',
      fields: {
        name: 'Name',
        company: 'Company',
        email: 'Email',
        phone: 'Phone',
        message: 'Which alloy, which batch size, which process?',
      },
      kvkk: 'I have read the privacy notice and consent to my information being processed for contact.',
      submit: 'Send',
      sending: 'Sending…',
      success: 'Got it. We will be in touch soon.',
      error: 'Something went wrong. You can call +90 531 669 37 34.',
      address: 'Kartepe · Kocaeli · Türkiye',
      phoneLabel: 'Phone',
      whatsappLabel: 'WhatsApp',
      emailLabel: 'Email',
      instagramLabel: 'Instagram',
      hoursLabel: 'Hours',
      hours: 'Mon–Sat · 08:00–18:00',
    },
    footer: {
      brand: 'Kervan Heat',
      tag: 'Kartepe · Kocaeli',
      rights: '© 2026 Kervan Heat Treatment. All rights reserved.',
      kvkk: 'Privacy',
    },
  },
};
