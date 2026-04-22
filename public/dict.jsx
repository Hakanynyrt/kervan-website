/* global React */
const { useState, useEffect, useRef } = React;

// ═══════════════════════════════════════════════════════════════════════════
// Dictionary — TR / EN
// Kısa, duygusal, teknik detaysız.
// ═══════════════════════════════════════════════════════════════════════════
window.DICT = {
  tr: {
    nav: {
      products: 'Ürünler',
      craft: 'Atölye',
      industries: 'Sektörler',
      contact: 'İletişim',
      cta: 'Teklif Al',
    },
    hero: {
      eyebrow: 'Kocaeli · 1999',
      title1: 'Kırıcıyı ayakta',
      title2: 'tutan parçalar.',
      sub: 'Keski, piston, burç, sızdırmazlık. Her biri kendi atölyemizde, kendi ellerimizle.',
      cta: 'Teklif Al',
      ctaSecondary: 'Ürünlere bak',
      stats: [
        { n: '26',   l: 'Yıl deneyim' },
        { n: '40+',  l: 'Marka uyumu' },
        { n: '1000+',l: 'Parça çeşidi' },
        { n: '24s',  l: 'Teklif süresi' },
      ],
    },
    products: {
      eyebrow: 'Ürün Aileleri',
      title: 'Basit dört kalem.\nHer kırıcının ihtiyacı.',
      aside: 'Her parça kendi tezgâhında, kendi malzemesiyle. Değiştirilemeyen tek şey: özen.',
      items: [
        { name: 'Keski', desc: 'Kırıcının ucu. Toprakla, taşla, betonla ilk temas noktası.', img: 'photos/chisel-stock.jpeg' },
        { name: 'Piston', desc: 'Darbenin kaynağı. Yüksek frekansla çalışır, yılmaz durur.', img: 'photos/cnc-machining.jpeg' },
        { name: 'Burç', desc: 'Sessiz kahraman. Piston ile keski arasında dengeyi kurar.', img: 'photos/saw-machine.jpeg' },
        { name: 'Kit', desc: 'Sızdırmazlık ve bağlantı parçaları. Ayrıntıların tümü.', img: 'photos/workshop-overview.jpeg' },
      ],
    },
    craft: {
      eyebrow: 'Atölye',
      title: 'Zanaat ellerde yaşar.',
      body: 'Yirmi altı yıl önce bir hayalle başladık. Bugün aynı çatı altında, aynı özenle, aynı titizlikle devam ediyoruz. Üretim hattımız değil — atölyemiz.',
    },
    industries: {
      eyebrow: 'Kimler İçin',
      title: 'İşini yapanın yanında.',
      aside: 'Türkiye\'nin her köşesinde, kazıdan ocağa, yoldan yıkıma — sahada çalışan her kırıcıya.',
      items: [
        { name: 'İnşaat', desc: 'Temel kazıdan yıkıma' },
        { name: 'Madencilik', desc: 'Ocağın derininde' },
        { name: 'Kariyer', desc: 'Kayayla iş görenler' },
        { name: 'Yol', desc: 'Altyapı ve yenileme' },
      ],
    },
    contact: {
      eyebrow: 'İletişim',
      title: 'Bir mesaj, bir cevap.',
      sub: 'Formunu doldur, yirmi dört saat içinde dönelim.',
      fields: {
        name: 'Ad Soyad',
        company: 'Firma',
        email: 'E-posta',
        phone: 'Telefon',
        message: 'Ne arıyorsun?',
      },
      kvkk: 'KVKK Aydınlatma Metni\'ni okudum, iletişim için bilgilerimin işlenmesini kabul ediyorum.',
      submit: 'Gönder',
      sending: 'Gönderiliyor…',
      success: 'Aldık. En kısa sürede dönüyoruz.',
      error: 'Bir sorun oldu. +90 531 669 37 34\'ü arayabilirsin.',
      address: 'Uzunçiftlik Mah. Sadun Atığ Cad. No:112/A\nKartepe · Kocaeli',
      phoneLabel: 'Telefon',
      emailLabel: 'E-posta',
      hoursLabel: 'Çalışma',
      hours: 'Pzt–Cmt · 08:00–18:00',
    },
    footer: {
      brand: 'Kervan Heat',
      tag: 'Kocaeli · 1999',
      rights: '© 2026 Kervan Isıl İşlem. Tüm hakları saklıdır.',
      kvkk: 'KVKK',
    },
  },

  en: {
    nav: {
      products: 'Products',
      craft: 'Workshop',
      industries: 'Industries',
      contact: 'Contact',
      cta: 'Get a Quote',
    },
    hero: {
      eyebrow: 'Kocaeli · Since 1999',
      title1: 'Parts that keep',
      title2: 'the hammer running.',
      sub: 'Chisels, pistons, bushings, seals. Each one made in our workshop, by hand.',
      cta: 'Get a Quote',
      ctaSecondary: 'See products',
      stats: [
        { n: '26',   l: 'Years of craft' },
        { n: '40+',  l: 'Hammer brands' },
        { n: '1000+',l: 'Parts shipped' },
        { n: '24h',  l: 'Quote turnaround' },
      ],
    },
    products: {
      eyebrow: 'Product Families',
      title: 'Four simple things.\nWhat every hammer needs.',
      aside: 'Every part on its own bench, with its own steel. The one thing that never changes: care.',
      items: [
        { name: 'Chisel', desc: 'The point of the hammer. First contact with earth, rock, concrete.', img: 'photos/chisel-stock.jpeg' },
        { name: 'Piston', desc: 'The source of the strike. High frequency. Doesn\'t flinch.', img: 'photos/cnc-machining.jpeg' },
        { name: 'Bushing', desc: 'The quiet hero. Holds the balance between piston and chisel.', img: 'photos/saw-machine.jpeg' },
        { name: 'Kit', desc: 'Seals and fasteners. All the small things.', img: 'photos/workshop-overview.jpeg' },
      ],
    },
    craft: {
      eyebrow: 'Workshop',
      title: 'Craft lives in hands.',
      body: 'We started twenty-six years ago with one idea. Today we keep going under the same roof, with the same care, the same attention. It is not a production line — it is a workshop.',
    },
    industries: {
      eyebrow: 'Who We Serve',
      title: 'Beside the people doing the work.',
      aside: 'Across Turkey — from trench to pit, from roadwork to demolition — with every crew running a breaker.',
      items: [
        { name: 'Construction', desc: 'From foundation to demolition' },
        { name: 'Mining', desc: 'Deep in the pit' },
        { name: 'Quarry', desc: 'Working with stone' },
        { name: 'Roads', desc: 'Infrastructure & renewal' },
      ],
    },
    contact: {
      eyebrow: 'Contact',
      title: 'One message, one answer.',
      sub: 'Fill the form. We will come back within twenty-four hours.',
      fields: {
        name: 'Name',
        company: 'Company',
        email: 'Email',
        phone: 'Phone',
        message: 'What are you looking for?',
      },
      kvkk: 'I have read the privacy notice and consent to my information being processed for contact.',
      submit: 'Send',
      sending: 'Sending…',
      success: 'Got it. We will be in touch soon.',
      error: 'Something went wrong. You can call +90 531 669 37 34.',
      address: 'Uzunçiftlik Mah. Sadun Atığ Cad. No:112/A\nKartepe · Kocaeli · Türkiye',
      phoneLabel: 'Phone',
      emailLabel: 'Email',
      hoursLabel: 'Hours',
      hours: 'Mon–Sat · 08:00–18:00',
    },
    footer: {
      brand: 'Kervan Heat',
      tag: 'Kocaeli · Since 1999',
      rights: '© 2026 Kervan Heat Treatment. All rights reserved.',
      kvkk: 'Privacy',
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// useLang — simple TR/EN switcher with localStorage
// ═══════════════════════════════════════════════════════════════════════════
window.useLang = function useLang() {
  const [lang, setLang] = useState(() => {
    try {
      const fromQ = new URLSearchParams(location.search).get('lang');
      if (fromQ === 'tr' || fromQ === 'en') return fromQ;
      const stored = localStorage.getItem('kv_lang');
      if (stored === 'tr' || stored === 'en') return stored;
      const nav = (navigator.language || 'tr').slice(0, 2).toLowerCase();
      return nav === 'tr' ? 'tr' : 'en';
    } catch (_) {
      return 'tr';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kv_lang', lang);
      document.documentElement.setAttribute('lang', lang);
    } catch (_) {}
  }, [lang]);

  return [lang, setLang];
};
