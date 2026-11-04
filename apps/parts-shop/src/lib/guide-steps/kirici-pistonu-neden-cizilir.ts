// Kaynak: guides.ts 'kirici-pistonu-neden-cizilir' TR/EN bölüm 0, 1, 2, 3
// The narration of the guide's 3B video (scripts/guide-video/narration.ts). Each `src` is
// verbatim from guides.ts.
import type { GuideSteps } from './types';

export const guideSteps: GuideSteps = {
  key: 'kirici-pistonu-neden-cizilir',
  steps: [
    {
      id: 'dirty-oil',
      h: { tr: 'Kirli yağ', en: 'Dirty oil' },
      s: {
        tr: 'Yağa karışan toz, metal parçacığı ya da su, yüzeyleri zımpara gibi çizer.',
        en: 'Dust, metal particles or water in the oil score the surfaces like sandpaper.',
      },
      src: {
        tr: 'Yağa karışan toz, metal parçacığı ya da su yüzeyleri zımpara gibi çizer.',
        en: 'Dust, metal particles or water in the oil score the surfaces like sandpaper.',
      },
    },
    {
      id: 'hose-ends',
      h: { tr: 'Hortum uçları', en: 'Hose ends' },
      s: {
        tr: 'Kırıcı makineden ayrıyken hortum uçlarını temizleyip kapatın, yeni hatları ilk çalışmadan önce yıkayın.',
        en: 'Clean and cap the hose ends while the breaker is off the machine, and flush new lines before the first run.',
      },
      src: {
        tr: 'kırıcı makineden ayrıyken hortum uçlarını temizleyip kapatın, yeni hatları ilk çalışmadan önce yıkayın',
        en: 'clean and cap the hose ends while the breaker is off the machine, and flush new lines before the first run',
      },
    },
    {
      id: 'off-axis',
      h: { tr: 'Eğik vuruş', en: 'An off-axis blow' },
      s: {
        tr: 'Aşınmış ya da uymayan burç, ucu eğik tutar; piston silindir içinde yana itilir ve tek taraftan çizilir.',
        en: 'A worn or wrong-fit bushing holds the tool at an angle; the piston is pushed sideways in the cylinder and scores on one side.',
      },
      src: {
        tr: 'Aşınmış ya da uymayan burç ucu eğik tutar',
        en: 'A worn or wrong-fit bushing holds the tool at an angle',
      },
    },
    {
      id: 'blank-firing',
      h: { tr: 'Boşta vuruş', en: 'Blank firing' },
      s: {
        tr: 'Uç, bir yüzeye dayanmadan vurulduğunda, piston normal vuruş boyunu aşıp silindirin ön tarafına kadar gider.',
        en: 'When the tool strikes without resting on a surface, the piston runs past its normal stroke towards the front of the cylinder.',
      },
      src: {
        tr: 'Uç bir yüzeye dayanmadan vurulduğunda piston normal vuruş boyunu aşıp silindirin ön tarafına kadar gider',
        en: 'When the tool strikes without resting on a surface, the piston runs past its normal stroke towards the front of the cylinder',
      },
    },
    {
      id: 'hot-oil',
      h: { tr: 'Isınan yağ', en: 'Overheating' },
      s: {
        tr: 'İncelen yağ, piston ile silindir arasındaki yağ filmini tutamaz ve metal metale sürtünür.',
        en: 'Thinned oil cannot keep the oil film between piston and cylinder, and metal rubs on metal.',
      },
      src: {
        tr: 'incelen yağ piston ile silindir arasındaki yağ filmini tutamaz ve metal metale sürtünür',
        en: 'thinned oil cannot keep the oil film between piston and cylinder, and metal rubs on metal',
      },
    },
  ],
};
