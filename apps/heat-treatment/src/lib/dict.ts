import { ORG_LOCALITY, ORG_MERSIS, ORG_REGION, ORG_REGISTERED_NAME, ORG_STREET } from '@kervan/seo';
import type { Dict } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   Heat-treatment dictionary — TR (default) / EN.
   Kontrollü atmosfer pit-tip fırınlarda fason ısıl işlem.
═══════════════════════════════════════════════════════════════════════ */

export const DICT: Dict = {
  tr: {
    meta: {
      title: 'Kervan Heat — Fason ısıl işlem · Kartepe / Kocaeli',
      description:
        'Kontrollü atmosfer kuyu tipi (pit) fırınlarda fason ısıl işlem: sertleştirme, temperleme, gerilim giderme, normalizasyon ve yumuşatma tavlaması. Kartepe / Kocaeli.',
      siteDescription: 'Kontrollü atmosfer pit-tip fırınlarda fason ısıl işlem.',
      service: {
        type: 'Fason ısıl işlem',
        name: 'Fason ısıl işlem',
        description:
          'Kontrollü atmosfer pit-tip fırınlarda sertleştirme, temperleme, gerilim giderme, normalizasyon ve yumuşatma tavlaması. 42CrMo, 42CrMoA ve diğer alaşımlar; her partide sertlik ölçüm raporu.',
        catalogName: 'Isıl işlem hizmetleri',
        offers: [
          {
            name: 'Sertleştirme (su verme)',
            description: 'Pit-tip fırında ısıtma, ardından yağ veya havada kontrollü soğutma.',
          },
          {
            name: 'Temperleme',
            description: 'Su verme sonrası gerilimi alır, tokluk kazandırır; iki temper potası.',
          },
          {
            name: 'Gerilim giderme',
            description: 'Talaşlı işleme, kaynak veya şekillendirme sonrası iç gerilimi azaltır.',
          },
          {
            name: 'Normalizasyon',
            description: 'Dövme veya haddeleme sonrası iç yapıyı düzgünleştirir.',
          },
          {
            name: 'Yumuşatma tavlaması',
            description: 'Sertliği düşürür, talaşlı işlemeyi kolaylaştırır.',
          },
        ],
      },
    },
    notFound: {
      eyebrow: '404',
      title: 'Sayfa bulunamadı.',
      body: 'Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.',
      home: 'Ana sayfaya dön',
    },
    nav: {
      services: 'Hizmetler',
      capacity: 'Teknik Kapasite',
      craft: 'Tesisimiz',
      about: 'Hakkımızda',
      contact: 'İletişim',
      tech: 'Teknik Bilgiler',
      cta: 'Teklif Al',
      home: 'Kervan Heat — ana sayfa',
      menu: 'Menü',
      skip: 'İçeriğe geç',
      language: 'Dil',
      theme: { label: 'Tema', auto: 'Otomatik', light: 'Açık', dark: 'Koyu' },
      langShort: { tr: 'TR', en: 'EN' },
    },
    marks: { external: '↗', required: '*' },
    hero: {
      title1: 'Kontrollü atmosfer pit-tip',
      title2: 'fırınlarda fason ısıl işlem.',
      sub: 'Sertleştirme ve temperleme. 42CrMo, 42CrMoA ve diğer alaşımlar — kendi ölçüm ve kontrol disiplinimizle.',
      cta: 'Teklif Al',
      photo: {
        alt: 'Kartepe tesisimizde kuyu tipi fırının ağzında, fikstürüyle vince asılı kızgın şarj',
        caption: 'Pit fırın ağzında kızgın şarj',
      },
      plant: {
        alt: 'Tesisimizdeki fırın salonu: zemine gömülü kuyu tipi fırınlar; önde kapak mekanizmalı fırınlar, arkada üstünde küçük bir alev yanan bir fırın ve ağzı açık bir fırın',
        caption: 'Kuyu tipi fırın salonumuz',
      },
    },
    gear: {
      title: 'Parçanın ısıl işlem yolu.',
      sub: 'Kontrollü atmosfer, ölçülmüş sıcaklık eğrisi, her partide sertlik ölçümü.',
      sceneLabel: 'Isıl işlem gören dişli çarkın üç boyutlu görünümü',
      posterAlt: 'Isıtılmış dişli çark',
      stagesLabel: 'Isıl işlem aşamaları',
      stages: [
        { no: '1', name: 'Isıtma', desc: 'Pit-tip fırında sertleşme sıcaklığına ısıtılır.' },
        { no: '2', name: 'Su verme', desc: 'Kontrollü soğutulur.' },
        { no: '3', name: 'Temperleme', desc: 'Su verme sonrası gerilimi alır, tokluk kazandırır.' },
        { no: '4', name: 'Rapor', desc: 'Her partide sertlik ölçüm raporu.' },
      ],
      report: { title: 'Sertlik ölçüm raporu', note: 'Her partide' },
    },
    services: {
      eyebrow: 'Hizmetler',
      title: 'Beş süreç. Tek disiplin.',
      aside: 'Kontrollü atmosfer, ölçülmüş sıcaklık eğrisi, her partide sertlik ölçümü.',
      processesLabel: 'Isıl işlem süreçlerimiz',
      processes: [
        {
          name: 'Sertleştirme (su verme)',
          body: 'Parça pit-tip fırında sertleşme sıcaklığına ısıtılır, ardından yağ veya havada kontrollü soğutulur.',
        },
        {
          name: 'Temperleme',
          body: 'Su verme sonrası gerilimi alır, tokluk kazandırır. İki temper potası sayesinde aynı gün iki ayrı sıcaklık eğrisi paralel çalışabilir.',
        },
        {
          name: 'Gerilim giderme',
          body: 'Talaşlı işleme, kaynak veya şekillendirme sonrası parçadaki iç gerilimi azaltır.',
        },
        {
          name: 'Normalizasyon',
          body: 'Dövme veya haddeleme sonrası iç yapıyı düzgünleştirir, sonraki işlemlere hazırlar.',
        },
        {
          name: 'Yumuşatma tavlaması',
          body: 'Sertliği düşürür; parçanın talaşlı işlenmesini kolaylaştırır.',
        },
      ],
      quality: {
        name: 'Her partide sertlik ölçüm raporu',
        body: 'İşlenen her partinin sertliği ölçülür ve raporlanır.',
      },
      items: [
        {
          index: '01',
          name: 'Fason Isıl İşlem',
          body: 'Standart hizmet listesinin dışına çıkan ihtiyaçlar için: özel alaşım, özel sıcaklık eğrisi, özel parti büyüklüğü. Önce numune, sonra seri.',
          bullets: [
            'Diğer alaşımlar — talep üzerine',
            'Özel sıcaklık eğrisi',
            'Numune → seri akış',
          ],
        },
        {
          index: '02',
          name: 'Üretim & Entegrasyon',
          body: 'Hidrolik kırıcı yedek parçalarımızı da kendi tezgâhımızda üretir, kendi pit-tip fırınımızda işleriz. Metalurjiyi sadece müşteri parçası için değil, kendi parçamız için de yaşıyoruz.',
          bullets: [
            'Keski, piston, burç, tamir kiti',
            'Aynı tesis, aynı disiplin',
            { label: 'Katalog', site: 'kervanbreaker.com', href: 'https://kervanbreaker.com/' },
            { label: 'Online mağaza', site: 'kiriciparca.com', href: 'https://kiriciparca.com/' },
          ],
        },
      ],
    },
    capacity: {
      eyebrow: 'Teknik Kapasite',
      title: 'Sayılarla atölye.',
      aside: 'Bir bakışta fırın kapasitesi, malzeme yelpazesi ve ölçüm disiplini.',
      // Spec table order. "Max parça boyu 2,6 m": owner, 2026-10-28 (the pot's inner depth).
      items: [
        { label: 'Max parça çapı', value: 'Ø1200', unit: 'mm', note: 'Pit-tip fırın iç ölçüsü' },
        { label: 'Max parça boyu', value: '2,6', unit: 'm', note: 'Pota iç derinliği' },
        { label: 'Tek sefer max yük', value: '2,5', unit: 'ton', note: 'Brüt parti ağırlığı' },
        { label: 'Temper potası', value: '2', note: 'Paralel iki sıcaklık eğrisi' },
        {
          label: 'Standart alaşımlar',
          value: '42CrMo · 42CrMoA',
          note: 'Diğerleri — talep üzerine',
        },
      ],
    },
    techUi: {
      eyebrow: 'Teknik Bilgiler',
      title: 'Teknik bilgiler.',
      loginTitle: 'Giriş',
      passwordLabel: 'Parola',
      submit: 'Giriş yap',
      sending: 'Giriliyor…',
      wrong: 'Parola hatalı.',
      notConfigured: 'Giriş şu anda kapalı (yapılandırılmamış).',
      error: 'Bir hata oluştu. Tekrar deneyin.',
      logout: 'Çıkış yap',
      loading: 'Yükleniyor…',
    },
    craft: {
      eyebrow: 'Tesisimiz',
      title: 'Sıcaklık sabırla yükselir.',
      body: 'Fırın bir tezgâh değil; bir saat. Termokupldan gelen her okuma, atmosferdeki her oksijen seviyesi, eğrideki her dakika — hepsi parçanın iç yapısına yazılır. Burada acele etmek yok; doğru sıcaklık, doğru süre, doğru soğutma.',
      photosLabel: 'Isıl işlem tesisimizden fotoğraflar',
      photos: [
        {
          base: 'tesis-genel-01',
          alt: 'Kervan Isıl İşlem tesisi: tavan vinci, kuyu tipi fırınlar, fikstürler ve şarja hazır burçlar',
          caption: 'Tesisimiz: şarja hazır parçalar ve fikstürler',
        },
        {
          base: 'firin-agzi-03',
          alt: 'Kapağı açık, boş kuyu tipi fırına yukarıdan bakış: yalıtım halkası, tuğla örgülü iç duvar ve duvar boyunca dizili ısıtıcı rezistanslar',
          caption: 'Fırın ağzı',
        },
        {
          base: 'kontrol-panosu-03',
          alt: 'Duvar boyunca gelen boruların bağlandığı cam kapaklı beyaz dolap; içinde dikey cam tüpler, göstergeler, vanalar ve hortumlar',
          caption: 'Gösterge ve vana dolabı',
        },
        {
          base: 'kapali-firin-03',
          alt: 'Kapağı kapalı kuyu tipi fırın: kapak üstünde fan motoru ve kapak mekanizması, yanında yanan alev çıkışı',
          caption: 'Kapalı fırın',
        },
        {
          base: 'firin-alev-01',
          alt: 'Kuyu tipi fırının kapağındaki çıkıştan yükselen alev',
          caption: 'Fırın kapağında alev',
        },
        {
          base: 'firin-kapak-01',
          alt: 'Kapağı üzerinde fan motoru ve bağlantıları olan kuyu tipi fırın',
          caption: 'Fırın kapağı ve fan motoru',
        },
        {
          base: 'sarj-burc-01',
          alt: 'Taşıyıcı üzerine dizilmiş işlenmiş burçlar',
          caption: 'Şarja dizilmiş burçlar',
        },
        {
          base: 'sarj-govde-01',
          alt: 'Fikstür tablası üzerinde işlenmiş gövde blokları',
          caption: 'Fikstürde gövde blokları',
        },
        {
          base: 'sarj-mil-01',
          alt: 'Fikstür tablasında dik duran uzun işlenmiş parçalar',
          caption: 'Fikstürde uzun parçalar',
        },
        {
          base: 'sarj-silindirik-01',
          alt: 'Fikstürde demet hâlinde bağlanmış silindirik parçalar',
          caption: 'Demet hâlinde silindirik parçalar',
        },
        {
          base: 'sarj-halka-01',
          alt: 'Kuyu tipi fırının ağzında tabakaya dizilmiş halkalar',
          caption: 'Fırın ağzında halka şarjı',
        },
        {
          base: 'sarj-raf-01',
          alt: 'Katlı fikstürde dizilmiş küçük parçalar',
          caption: 'Katlı fikstürde küçük parçalar',
        },
        {
          base: 'sertlik-olcum-01',
          alt: 'Isıl işlem görmüş parçalar üzerinde el tipi cihazla sertlik ölçümü',
          caption: 'Sertlik ölçümü',
        },
        {
          base: 'sertlik-olcum-02',
          alt: 'Isıl işlem görmüş uzun parça üzerinde el tipi cihazla sertlik ölçümü',
          caption: 'Parça üzerinde sertlik ölçümü',
        },
        {
          base: 'surec-ekran-01',
          alt: 'Fırın kontrol panelinde süreç şeması',
          caption: 'Süreç ekranı',
        },
      ],
    },
    about: {
      eyebrow: 'Hakkımızda',
      title: ORG_REGISTERED_NAME,
      body: "Kartepe / Kocaeli'de fason ısıl işlem hizmeti veriyoruz. Türkiye'nin sanayi koridorunun ortasında — gelen parçayı ölçer, işler, kontrol eder ve aynı disiplinle teslim ederiz. Her partinin ardında bir sertlik testi vardır.",
      company: ORG_REGISTERED_NAME,
      location: 'Kartepe · Kocaeli',
    },
    contact: {
      eyebrow: 'İletişim',
      title: 'Bir mesaj, bir cevap.',
      sub: 'Parça çizimini veya malzeme bilgisini paylaşın, yirmi dört saat içinde dönüş yapalım.',
      fields: {
        name: 'Ad Soyad',
        company: 'Firma',
        email: 'E-posta',
        phone: 'Telefon',
        message: 'Hangi alaşım, hangi parti büyüklüğü, hangi süreç?',
      },
      submit: 'Gönder',
      sending: 'Gönderiliyor…',
      success: 'Aldık. En kısa sürede dönüyoruz.',
      error: "Bir sorun oldu. +90 531 669 37 34'ü arayabilirsiniz.",
      requiredNote: '* işaretli alanlar zorunludur.',
      invalid: {
        required: 'Bu alanı doldurun.',
        email: 'Geçerli bir e-posta adresi yazın.',
      },
      files: {
        label: 'Çizim / fotoğraf ekle',
        placeholder: 'Dosya seçin',
        remove: 'Kaldır',
        hint: 'PDF, DWG, DXF, STEP, JPG, PNG veya WebP · en fazla 3 dosya, toplam 8 MB',
        tooMany: 'En fazla 3 dosya ekleyebilirsiniz.',
        tooBig: 'Dosyaların toplamı 8 MB’ı geçemez.',
        badType: 'Bu dosya türü kabul edilmiyor. PDF, DWG, DXF, STEP, JPG, PNG veya WebP ekleyin.',
        rejected:
          'Eklediğiniz dosyalardan biri kabul edilmedi (tür, sayı veya boyut). Dosyaları kontrol edip tekrar gönderin.',
      },
      kvkk: {
        before: 'Bilgileriniz ',
        link: 'KVKK Aydınlatma Metni',
        after: ' kapsamında yalnızca talebinizi yanıtlamak için işlenir.',
      },
      addressLabel: 'Adres',
      address: `${ORG_STREET}\n${ORG_LOCALITY} / ${ORG_REGION}`,
      mapLabel: 'Google Haritalar’da aç',
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
      rights: `© 2026 ${ORG_REGISTERED_NAME} Tüm hakları saklıdır.`,
      mersis: `MERSİS No: ${ORG_MERSIS}`,
      kvkk: 'KVKK',
      cookies: 'Çerez tercihleri',
    },
    consent: {
      title: 'Çerez tercihi',
      body: 'Reklam ölçümü için Google Ads çerezlerini yalnızca izin verirseniz kullanırız; veriler Google’a (ABD) aktarılır. Reddederseniz site aynen çalışır.',
      accept: 'Kabul et',
      reject: 'Reddet',
      policy: 'Ayrıntılar',
    },
  },

  en: {
    meta: {
      title: 'Kervan Heat — Contract heat treatment · Kartepe / Kocaeli',
      description:
        'Contract heat treatment in controlled-atmosphere pit furnaces: hardening, tempering, stress relieving, normalising and soft annealing. Kartepe / Kocaeli, Türkiye.',
      siteDescription: 'Contract heat treatment in controlled-atmosphere pit furnaces.',
      service: {
        type: 'Contract heat treatment',
        name: 'Contract heat treatment',
        description:
          'Hardening, tempering, stress relieving, normalising and soft annealing in controlled-atmosphere pit furnaces. 42CrMo, 42CrMoA and other alloys; a hardness test report for every batch.',
        catalogName: 'Heat treatment services',
        offers: [
          {
            name: 'Hardening (quenching)',
            description: 'Heating in a pit furnace, then controlled cooling in oil or air.',
          },
          {
            name: 'Tempering',
            description: 'Relieves the stress of quenching and adds toughness; two tempering pots.',
          },
          {
            name: 'Stress relieving',
            description: 'Reduces internal stress after machining, welding or forming.',
          },
          {
            name: 'Normalising',
            description: 'Evens out the structure after forging or rolling.',
          },
          {
            name: 'Soft annealing',
            description: 'Lowers hardness and makes the part easier to machine.',
          },
        ],
      },
    },
    notFound: {
      eyebrow: '404',
      title: 'Page not found.',
      body: 'The page you are looking for may have moved or never existed.',
      home: 'Back to the home page',
    },
    nav: {
      services: 'Services',
      capacity: 'Capacity',
      craft: 'Our Plant',
      about: 'About',
      contact: 'Contact',
      tech: 'Technical Info',
      cta: 'Get a Quote',
      home: 'Kervan Heat — home',
      menu: 'Menu',
      skip: 'Skip to content',
      language: 'Language',
      theme: { label: 'Theme', auto: 'Auto', light: 'Light', dark: 'Dark' },
      langShort: { tr: 'TR', en: 'EN' },
    },
    marks: { external: '↗', required: '*' },
    hero: {
      title1: 'Contract heat treatment in',
      title2: 'controlled-atmosphere pit furnaces.',
      sub: 'Hardening and tempering. 42CrMo, 42CrMoA and other alloys — under our own measurement and control discipline.',
      cta: 'Get a Quote',
      photo: {
        alt: 'A glowing charge on its fixture, hanging from the crane at the mouth of a pit furnace in our Kartepe plant',
        caption: 'Glowing charge at the pit furnace mouth',
      },
      plant: {
        alt: 'The furnace hall in our plant: pit furnaces set into the floor; lidded furnaces with their lid drives in front, and behind them a furnace with a small flame on top and one with its mouth open',
        caption: 'Our pit furnace hall',
      },
    },
    gear: {
      title: "A part's path through heat treatment.",
      sub: 'Controlled atmosphere, measured temperature curves, a hardness check on every batch.',
      sceneLabel: '3D view of a gear going through heat treatment',
      posterAlt: 'A heated gear',
      stagesLabel: 'Heat treatment stages',
      stages: [
        { no: '1', name: 'Heating', desc: 'Heated to hardening temperature in a pit furnace.' },
        { no: '2', name: 'Quenching', desc: 'Cooled under control.' },
        {
          no: '3',
          name: 'Tempering',
          desc: 'Relieves the stress of quenching and adds toughness.',
        },
        { no: '4', name: 'Report', desc: 'A hardness test report for every batch.' },
      ],
      report: { title: 'Hardness test report', note: 'Every batch' },
    },
    services: {
      eyebrow: 'Services',
      title: 'Five processes. One discipline.',
      aside: 'Controlled atmosphere, measured temperature curves, a hardness check on every batch.',
      processesLabel: 'Our heat treatment processes',
      processes: [
        {
          name: 'Hardening (quenching)',
          body: 'The part is heated to hardening temperature in a pit furnace, then cooled under control in oil or air.',
        },
        {
          name: 'Tempering',
          body: 'Relieves the stress of quenching and adds toughness. With two tempering pots, two distinct temperature curves can run in parallel on the same day.',
        },
        {
          name: 'Stress relieving',
          body: 'Reduces the internal stress left in a part by machining, welding or forming.',
        },
        {
          name: 'Normalising',
          body: 'Evens out the structure after forging or rolling and prepares the part for the next steps.',
        },
        {
          name: 'Soft annealing',
          body: 'Lowers hardness so the part is easier to machine.',
        },
      ],
      quality: {
        name: 'A hardness test report for every batch',
        body: 'The hardness of every batch we treat is measured and reported.',
      },
      items: [
        {
          index: '01',
          name: 'Contract Heat Treatment',
          body: 'For requirements outside the standard list: special alloys, special curves, special batch sizes. Sample first, then production run.',
          bullets: [
            'Other alloys on request',
            'Custom temperature curves',
            'Sample → production flow',
          ],
        },
        {
          index: '02',
          name: 'Production & Integration',
          body: 'We also make hydraulic breaker spare parts on our own machines and treat them in our own pit furnaces. We apply the same metallurgy to our own parts as to our customers’.',
          bullets: [
            'Chisel, piston, bushing, repair kit',
            'Same plant, same discipline',
            {
              label: 'Catalogue',
              site: 'kervanbreaker.com',
              href: 'https://kervanbreaker.com/en/',
            },
            { label: 'Online shop', site: 'kiriciparca.com', href: 'https://kiriciparca.com/en/' },
          ],
        },
      ],
    },
    capacity: {
      eyebrow: 'Capacity',
      title: 'Our plant in numbers.',
      aside: 'Furnace capacity, material range and measurement discipline at a glance.',
      items: [
        {
          label: 'Max part diameter',
          value: 'Ø1200',
          unit: 'mm',
          note: 'Pit furnace inner dimension',
        },
        { label: 'Max part length', value: '2.6', unit: 'm', note: 'Pot inner depth' },
        { label: 'Max load per batch', value: '2.5', unit: 'ton', note: 'Gross batch weight' },
        { label: 'Tempering pots', value: '2', note: 'Two parallel temperature curves' },
        { label: 'Standard alloys', value: '42CrMo · 42CrMoA', note: 'Others on request' },
      ],
    },
    techUi: {
      eyebrow: 'Technical Info',
      title: 'Technical info.',
      loginTitle: 'Sign in',
      passwordLabel: 'Password',
      submit: 'Sign in',
      sending: 'Signing in…',
      wrong: 'Wrong password.',
      notConfigured: 'Sign-in is currently disabled (not configured).',
      error: 'Something went wrong. Please try again.',
      logout: 'Sign out',
      loading: 'Loading…',
    },
    craft: {
      eyebrow: 'Our Plant',
      title: 'Temperature rises with patience.',
      body: 'A furnace is not a bench; it is a clock. Every reading from the thermocouple, every oxygen level in the atmosphere, every minute on the curve — all of it is written into the part. There is no rushing here; the right temperature, the right time, the right cooling.',
      photosLabel: 'Photos from our heat treatment plant',
      photos: [
        {
          base: 'tesis-genel-01',
          alt: 'Kervan heat treatment plant: overhead crane, pit furnaces, fixtures and bushings ready to load',
          caption: 'Our plant: parts and fixtures ready to load',
        },
        {
          base: 'firin-agzi-03',
          alt: 'Looking down into an open, empty pit furnace: the insulation ring, the brick-lined wall and the heating elements running around it',
          caption: 'Furnace mouth',
        },
        {
          base: 'kontrol-panosu-03',
          alt: 'White glass-door cabinet fed by pipes running along the wall, with vertical glass tubes, gauges, valves and hoses inside',
          caption: 'Gauge and valve cabinet',
        },
        {
          base: 'kapali-firin-03',
          alt: 'Closed pit furnace: the fan motor and lid mechanism on top, with a burning flame outlet beside it',
          caption: 'Closed furnace',
        },
        {
          base: 'firin-alev-01',
          alt: 'Flame rising from the outlet on a pit furnace lid',
          caption: 'Flame at the furnace lid',
        },
        {
          base: 'firin-kapak-01',
          alt: 'Pit furnace with the fan motor and connections on its lid',
          caption: 'Furnace lid and fan motor',
        },
        {
          base: 'sarj-burc-01',
          alt: 'Machined bushings arranged on a carrier',
          caption: 'Bushings loaded for the charge',
        },
        {
          base: 'sarj-govde-01',
          alt: 'Machined body blocks on a fixture tray',
          caption: 'Body blocks on the fixture',
        },
        {
          base: 'sarj-mil-01',
          alt: 'Long machined parts standing on a fixture tray',
          caption: 'Long parts on the fixture',
        },
        {
          base: 'sarj-silindirik-01',
          alt: 'Cylindrical parts bundled on a fixture',
          caption: 'Bundled cylindrical parts',
        },
        {
          base: 'sarj-halka-01',
          alt: 'Rings laid out in layers at the mouth of a pit furnace',
          caption: 'A charge of rings at the furnace mouth',
        },
        {
          base: 'sarj-raf-01',
          alt: 'Small parts arranged on a tiered fixture',
          caption: 'Small parts on a tiered fixture',
        },
        {
          base: 'sertlik-olcum-01',
          alt: 'Hardness check with a handheld tester on heat-treated parts',
          caption: 'Hardness check',
        },
        {
          base: 'sertlik-olcum-02',
          alt: 'Hardness check with a handheld tester on a long heat-treated part',
          caption: 'Hardness check on a part',
        },
        {
          base: 'surec-ekran-01',
          alt: 'Process diagram on the furnace control panel',
          caption: 'Process screen',
        },
      ],
    },
    about: {
      eyebrow: 'About',
      title: ORG_REGISTERED_NAME,
      body: "We provide contract heat treatment in Kartepe / Kocaeli, in the heart of Türkiye's industrial corridor. We measure the part, run the process, verify the result and ship it back — with the same discipline every time. Behind every batch is a hardness test.",
      company: ORG_REGISTERED_NAME,
      location: 'Kartepe · Kocaeli · Türkiye',
    },
    contact: {
      eyebrow: 'Contact',
      title: 'One message, one answer.',
      sub: 'Share the drawing or material spec — we will get back to you within twenty-four hours.',
      fields: {
        name: 'Name',
        company: 'Company',
        email: 'Email',
        phone: 'Phone',
        message: 'Which alloy, which batch size, which process?',
      },
      submit: 'Send',
      sending: 'Sending…',
      success: 'Got it. We will be in touch soon.',
      error: 'Something went wrong. You can call +90 531 669 37 34.',
      requiredNote: 'Fields marked * are required.',
      invalid: {
        required: 'Please fill in this field.',
        email: 'Please enter a valid email address.',
      },
      files: {
        label: 'Attach a drawing / photo',
        placeholder: 'Choose files',
        remove: 'Remove',
        hint: 'PDF, DWG, DXF, STEP, JPG, PNG or WebP · up to 3 files, 8 MB in total',
        tooMany: 'You can attach up to 3 files.',
        tooBig: 'The files may not exceed 8 MB in total.',
        badType: 'This file type is not accepted. Attach PDF, DWG, DXF, STEP, JPG, PNG or WebP.',
        rejected:
          'One of the attached files was not accepted (type, number or size). Please check the files and send again.',
      },
      kvkk: {
        before: 'We process your details only to answer your request, as described in our ',
        link: 'privacy notice (KVKK, in Turkish)',
        after: '.',
      },
      addressLabel: 'Address',
      address: `${ORG_STREET}\n${ORG_LOCALITY} / ${ORG_REGION}, Türkiye`,
      mapLabel: 'Open in Google Maps',
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
      rights: `© 2026 ${ORG_REGISTERED_NAME} All rights reserved.`,
      mersis: `MERSIS No: ${ORG_MERSIS}`,
      kvkk: 'Privacy',
      cookies: 'Cookie settings',
    },
    consent: {
      title: 'Cookie preference',
      body: 'We use Google Ads cookies to measure our ads only if you allow it; the data goes to Google (USA). If you decline, the site works the same.',
      accept: 'Accept',
      reject: 'Decline',
      policy: 'Details',
    },
  },
};
