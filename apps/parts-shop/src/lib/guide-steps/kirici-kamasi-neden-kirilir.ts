// Kaynak: guides.ts 'kirici-kamasi-neden-kirilir' TR/EN bölüm 0, 1, 2, 3
// The narration of the guide's 3B video (scripts/guide-video/narration.ts). Each `src` is
// verbatim from guides.ts.
import type { GuideSteps } from './types';

export const guideSteps: GuideSteps = {
  key: 'kirici-kamasi-neden-kirilir',
  steps: [
    {
      id: 'blank-firing',
      h: { tr: 'Boşta vuruş', en: 'Blank firing' },
      s: {
        tr: 'Uç, bir yüzeye dayanmadan kırıcı çalıştırılırsa, pistonun darbesi ucu ileri iter ve bu yükü kama karşılar.',
        en: 'Run without the tool resting on a surface, the piston blow drives the tool forward and the key takes that load.',
      },
      src: {
        tr: 'Uç bir yüzeye dayanmadan kırıcı çalıştırılırsa pistonun darbesi ucu ileri iter ve bu yükü kama karşılar.',
        en: 'Run without the tool resting on a surface, the piston blow drives the tool forward and the key takes that load.',
      },
    },
    {
      id: 'angle',
      h: { tr: 'Eğik çalışan uç', en: 'A tool at an angle' },
      s: {
        tr: 'Ucun kama kanalı aşındıysa ya da burçlar boşluk yaptıysa, uç eğik çalışır ve kamaya darbeli yük biner.',
        en: 'A worn key slot on the tool or slack bushings let the tool work at an angle and put shock loads on the key.',
      },
      src: {
        tr: 'Ucun kama kanalı aşındıysa ya da burçlar boşluk yaptıysa uç eğik çalışır ve kamaya darbeli yük biner.',
        en: 'A worn key slot on the tool or slack bushings let the tool work at an angle and put shock loads on the key.',
      },
    },
    {
      id: 'dry',
      h: { tr: 'Yağlamasız çalışma', en: 'Running without grease' },
      s: {
        tr: 'Gres verilmeyen kırıcıda kama ve uç kanalı kuru sürtünür ve çentiklenir; çentikli kama darbe altında kırılır.',
        en: 'Without grease the key and the tool slot rub dry and notch; a notched key breaks under impact.',
      },
      src: {
        tr: 'Gres verilmeyen kırıcıda kama ve uç kanalı kuru sürtünür',
        en: 'Without grease the key and the tool slot rub dry',
      },
    },
    {
      id: 'replace',
      h: { tr: 'Kama ve pim birlikte', en: 'Key and pin together' },
      s: {
        tr: 'Kırıcınızın modeline uyan kamayı ve tutucu pimini birlikte kullanın; eğilmiş ya da çatlamış kamayı düzeltip yeniden takmayın.',
        en: 'Use the key and its retaining pin made for your breaker model together; do not straighten and refit a bent or cracked key.',
      },
      src: {
        tr: 'Kırıcınızın modeline uyan kamayı ve tutucu pimini birlikte kullanın.',
        en: 'Use the key and its retaining pin made for your breaker model together.',
      },
    },
  ],
};
