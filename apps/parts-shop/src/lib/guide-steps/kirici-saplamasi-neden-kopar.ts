// Kaynak: guides.ts 'kirici-saplamasi-neden-kopar' TR/EN bölüm 0, 1, 2, 4
// The narration of the guide's 3B video (scripts/guide-video/narration.ts). Each `src` is
// verbatim from guides.ts.
import type { GuideSteps } from './types';

export const guideSteps: GuideSteps = {
  key: 'kirici-saplamasi-neden-kopar',
  steps: [
    {
      id: 'crosswise',
      h: { tr: 'Çapraz ve kademeli', en: 'Crosswise, in stages' },
      s: {
        tr: 'Somunları kılavuzdaki sırayla, çapraz ve kademeli olarak sıkın.',
        en: 'Tighten the nuts in the order the manual gives, crosswise and in stages.',
      },
      src: {
        tr: 'Somunları kılavuzdaki sırayla, çapraz ve kademeli olarak sıkın.',
        en: 'Tighten the nuts in the order the manual gives, crosswise and in stages.',
      },
    },
    {
      id: 'uneven',
      h: { tr: 'Eşit olmayan sıkma', en: 'Uneven tightening' },
      s: {
        tr: 'Somunlar birbirinden farklı sıkılırsa, yükü saplamaların yalnızca bir kısmı taşır ve en çok yüklenen önce kopar.',
        en: 'If the nuts are tightened unevenly, only some of the rods carry the load and the most loaded one breaks first.',
      },
      src: {
        tr: 'Somunlar birbirinden farklı sıkılırsa yükü saplamaların yalnızca bir kısmı taşır ve en çok yüklenen önce kopar.',
        en: 'If the nuts are tightened unevenly, only some of the rods carry the load and the most loaded one breaks first.',
      },
    },
    {
      id: 'loose',
      h: { tr: 'Gevşeyen somun', en: 'A loose nut' },
      s: {
        tr: 'Darbe ve titreşim, somunları zamanla gevşetebilir; gevşek saplama kısa sürede yorulur ve onun yükünü diğerleri taşır.',
        en: 'Impact and vibration can loosen the nuts over time; a loose rod soon fatigues and the others carry its load.',
      },
      src: {
        tr: 'Darbe ve titreşim somunları zamanla gevşetebilir; gevşek saplama kısa sürede yorulur ve onun yükünü diğerleri taşır.',
        en: 'Impact and vibration can loosen the nuts over time; a loose rod soon fatigues and the others carry its load.',
      },
    },
    {
      id: 'side-load',
      h: { tr: 'Yanal yük', en: 'Side load' },
      s: {
        tr: 'Ucu levye gibi kullanmak gövdeye yanal yük bindirir; saplamalar çekmenin yanında eğilme yükü de taşır.',
        en: 'Prying with the tool puts side loads on the body; the rods then carry bending as well as tension.',
      },
      src: {
        tr: 'saplamalar çekmenin yanında eğilme yükü de taşır',
        en: 'the rods then carry bending as well as tension',
      },
    },
    {
      id: 'fatigue',
      h: { tr: 'Yorulma çatlağı', en: 'A fatigue crack' },
      s: {
        tr: 'Kopma çoğu zaman diş dibinde ya da kesitin değiştiği yerde başlar ve uyarı vermeden olur.',
        en: 'A break usually starts at the root of a thread or where the rod’s section changes, and comes without warning.',
      },
      src: {
        tr: 'kopma çoğu zaman diş dibinde ya da kesitin değiştiği yerde başlar ve uyarı vermeden olur',
        en: 'a break usually starts at the root of a thread or where the rod’s section changes, and comes without warning',
      },
    },
  ],
};
