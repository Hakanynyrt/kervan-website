// Kaynak: guides.ts 'keski-mi-sivri-uc-mu' TR/EN bölüm 0, 1, 2, 4
// The narration of the guide's 3B video (scripts/guide-video/narration.ts). Each `src` is
// verbatim from guides.ts.
import type { GuideSteps } from './types';

export const guideSteps: GuideSteps = {
  key: 'keski-mi-sivri-uc-mu',
  steps: [
    {
      id: 'chisel',
      h: { tr: 'Keski', en: 'Chisel' },
      s: {
        tr: 'Keski ucun ağzı yassıdır; darbeyi bir çizgi boyunca verir.',
        en: 'A chisel has a flat edge and strikes along a line.',
      },
      src: {
        tr: 'Ağzı yassıdır; darbeyi bir çizgi boyunca verir.',
        en: 'It has a flat edge and strikes along a line.',
      },
    },
    {
      id: 'moil',
      h: { tr: 'Sivri uç', en: 'Moil point' },
      s: {
        tr: 'Sivri uç darbeyi tek noktaya toplar ve malzemeye girer.',
        en: 'A moil point focuses the blow on a single point and penetrates.',
      },
      src: {
        tr: 'Darbeyi tek noktaya toplar ve malzemeye girer.',
        en: 'It focuses the blow on a single point and penetrates.',
      },
    },
    {
      id: 'blunt',
      h: { tr: 'Küt uç', en: 'Blunt tool' },
      s: {
        tr: 'Küt uç darbeyi geniş bir yüzeye yayar.',
        en: 'A blunt tool spreads the blow over a wide face.',
      },
      src: {
        tr: 'Küt uç darbeyi geniş bir yüzeye yayar',
        en: 'A blunt tool spreads the blow over a wide face',
      },
    },
    {
      id: 'pyramid',
      h: { tr: 'Piramit uç', en: 'Pyramid tool' },
      s: {
        tr: 'Piramit uç, sivri ucun delici etkisini daha dayanıklı bir uç biçimiyle birleştirir.',
        en: 'A pyramid tool combines the penetration of a moil point with a tougher tip.',
      },
      src: {
        tr: 'Piramit uç, sivri ucun delici etkisini daha dayanıklı bir uç biçimiyle birleştirir',
        en: 'A pyramid tool combines the penetration of a moil point with a tougher tip',
      },
    },
    {
      id: 'fit',
      h: { tr: 'Uç kırıcıya göre', en: 'Set by your breaker' },
      s: {
        tr: 'Uç tipi ne olursa olsun, çapı, boyu ve kama yuvası kırıcınızın modeline göre belirlenir.',
        en: 'Whatever the type, the diameter, length and key slot are set by your breaker model.',
      },
      src: {
        tr: 'Uç tipi ne olursa olsun çapı, boyu ve kama yuvası kırıcınızın modeline göre belirlenir.',
        en: 'Whatever the type, the diameter, length and key slot are set by your breaker model.',
      },
    },
  ],
};
