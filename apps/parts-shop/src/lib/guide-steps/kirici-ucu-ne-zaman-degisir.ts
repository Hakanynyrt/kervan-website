// Kaynak: guides.ts 'kirici-ucu-ne-zaman-degisir' TR/EN bölüm 0, 1, 2, 3
// The narration of the guide's 3B video (scripts/guide-video/narration.ts). Each `src` is
// verbatim from guides.ts.
import type { GuideSteps } from './types';

export const guideSteps: GuideSteps = {
  key: 'kirici-ucu-ne-zaman-degisir',
  steps: [
    {
      id: 'shorten',
      h: { tr: 'Uç boyu kısalır', en: 'The tool gets shorter' },
      s: {
        tr: 'Uç çalıştıkça kısalır; kılavuzda verilen en kısa kullanım boyuna indiyse değiştirilmelidir.',
        en: 'A tool gets shorter as it works; at the shortest usable length in the manual it should be replaced.',
      },
      src: { tr: 'Uç çalıştıkça kısalır.', en: 'A tool gets shorter as it works.' },
    },
    {
      id: 'mushroom',
      h: { tr: 'Arka yüz ezilir', en: 'The impact face mushrooms' },
      s: {
        tr: 'Pistonun vurduğu arka yüz ezilip kenarlarından taşabilir; taşan kenar burç içinde sıkışır.',
        en: 'The rear face the piston strikes can deform and spread over its edges; the spread edge jams in the bushing.',
      },
      src: {
        tr: 'Pistonun vurduğu arka yüz zamanla ezilip kenarlarından taşabilir.',
        en: 'The spread edge jams in the bushing',
      },
    },
    {
      id: 'crack',
      h: { tr: 'Çatlak uç', en: 'A cracked tool' },
      s: {
        tr: 'Çatlak uç her an kırılabilir; yeni uç takmadan önce burçları da kontrol edin.',
        en: 'A cracked tool can break at any time; check the bushings before fitting a new tool.',
      },
      src: { tr: 'Çatlak uç her an kırılabilir.', en: 'A cracked tool can break at any time.' },
    },
    {
      id: 'checks',
      h: { tr: 'Değişimde kontrol', en: 'Checks at a change' },
      s: {
        tr: 'Uçla birlikte burçları ve kamayı da kontrol edin; takarken ucun kama kanalına ve burç yüzeyine gres sürün.',
        en: 'Check the bushings and the retainer key as well; grease the key slot and the bushing surface when fitting.',
      },
      src: {
        tr: 'Uçla birlikte burçları ve kamayı da kontrol edin',
        en: 'Grease the key slot and the bushing surface when fitting.',
      },
    },
  ],
};
