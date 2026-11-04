// Kaynak: guides.ts 'kirici-burcu-ne-zaman-degisir' TR/EN bölüm 0, 1, 2
// The narration of the guide's 3B video (scripts/guide-video/narration.ts). Each `src` is
// verbatim from guides.ts.
import type { GuideSteps } from './types';

export const guideSteps: GuideSteps = {
  key: 'kirici-burcu-ne-zaman-degisir',
  steps: [
    {
      id: 'clearance',
      h: { tr: 'Boşluk büyür', en: 'The clearance grows' },
      s: {
        tr: 'Burç aşındıkça uç ile burç arasındaki boşluk büyür.',
        en: 'As a bushing wears, the clearance between tool and bushing grows.',
      },
      src: {
        tr: 'Burç aşındıkça uç ile burç arasındaki boşluk büyür.',
        en: 'As a bushing wears, the clearance between tool and bushing grows.',
      },
    },
    {
      id: 'measure',
      h: { tr: 'Boşluğu ölçün', en: 'Measure the clearance' },
      s: {
        tr: 'Boşluğu ucun gövdesi ile burcun iç çapı arasından ölçün; sınır aşıldıysa burç değiştirilmelidir.',
        en: 'Measure between the tool shank and the bushing bore; past the limit, replace the bushing.',
      },
      src: {
        tr: 'Boşluğu ucun gövdesi ile burcun iç çapı arasından ölçün; sınır aşıldıysa burç değiştirilmelidir.',
        en: 'Measure between the tool shank and the bushing bore; past the limit, replace the bushing.',
      },
    },
    {
      id: 'signs',
      h: { tr: 'Aşınma belirtileri', en: 'Signs of wear' },
      s: {
        tr: 'Ucun yanlara fazla oynaması, burç iç yüzeyinde oval aşınma ve ucun gövdesinde tek taraflı aşınma, burcun yorulduğunu gösterir.',
        en: 'Too much side play of the tool, an oval bore and wear on one side of the tool shank show a worn bushing.',
      },
      src: {
        tr: 'Ucun yanlara fazla oynaması, burç iç yüzeyinde oval aşınma',
        en: 'wear on one side of the tool shank show a worn bushing',
      },
    },
    {
      id: 'together',
      h: { tr: 'Birlikte kontrol', en: 'Checked together' },
      s: {
        tr: 'Kafa burcu ve dayama burcu birlikte kontrol edilir; burç yuvasının alt gövdede düzgün olduğundan emin olun.',
        en: 'Check the front and the thrust bushing together; make sure the bushing seat in the front head is sound.',
      },
      src: {
        tr: 'Burç yuvasının alt gövdede düzgün olduğundan emin olun.',
        en: 'Make sure the bushing seat in the front head is sound.',
      },
    },
  ],
};
