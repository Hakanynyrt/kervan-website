// Kaynak: guides.ts 'kirici-yaglamasi-nasil-yapilir' TR/EN bölüm 1, 4
// The narration of the guide's 3B video (scripts/guide-video/narration.ts). Each `src` is
// verbatim from guides.ts.
import type { GuideSteps } from './types';

export const guideSteps: GuideSteps = {
  key: 'kirici-yaglamasi-nasil-yapilir',
  steps: [
    {
      id: 'upright',
      h: { tr: 'Dik tutun, ucu itin', en: 'Upright, tool pressed in' },
      s: {
        tr: 'Kırıcıyı dik tutun ve ucu zemine bastırarak sonuna kadar içeri itin.',
        en: 'Hold the breaker upright and press the tool fully in against the ground.',
      },
      src: {
        tr: 'Kırıcıyı dik tutun ve ucu zemine bastırarak sonuna kadar içeri itin',
        en: 'Hold the breaker upright and press the tool fully in against the ground',
      },
    },
    {
      id: 'nipple',
      h: { tr: 'Gres nipelinden', en: 'Through the nipple' },
      s: {
        tr: 'Gresi kırıcının gres nipelinden, kılavuzda yazan miktarda verin.',
        en: 'Grease through the breaker’s grease nipple, in the amount the manual gives.',
      },
      src: {
        tr: 'Gresi kırıcının gres nipelinden, kılavuzda yazan miktarda verin.',
        en: 'Grease through the breaker’s grease nipple, in the amount the manual gives.',
      },
    },
    {
      id: 'place',
      h: { tr: 'Uç ile burç arası', en: 'Between tool and bushings' },
      s: {
        tr: 'Gres, pistonun çalıştığı bölgeye değil, uç ile burçların arasına gider.',
        en: 'The grease goes between tool and bushings rather than into the piston area.',
      },
      src: {
        tr: 'pistonun çalıştığı bölgeye değil, uç ile burçların arasına gider',
        en: 'the grease goes between tool and bushings rather than into the piston area',
      },
    },
    {
      id: 'too-much',
      h: { tr: 'Fazla gres', en: 'Too much grease' },
      s: {
        tr: 'Fazla gres de zararlıdır: taşan gres darbe bölgesine dolabilir.',
        en: 'Too much grease does harm as well: the surplus can fill the impact area.',
      },
      src: {
        tr: 'Fazla gres de zararlıdır: taşan gres darbe bölgesine dolabilir.',
        en: 'Too much grease does harm as well: the surplus can fill the impact area.',
      },
    },
    {
      id: 'dry',
      h: { tr: 'Kuru çalışma', en: 'Running dry' },
      s: {
        tr: 'Kuru çalışan uçta gövde çizilir ve renk değiştirir, burçlar çabuk aşınır.',
        en: 'A tool run dry gets a scored, discoloured shank and the bushings wear fast.',
      },
      src: {
        tr: 'Kuru çalışan uçta gövde çizilir ve renk değiştirir, burçlar çabuk aşınır',
        en: 'A tool run dry gets a scored, discoloured shank',
      },
    },
  ],
};
