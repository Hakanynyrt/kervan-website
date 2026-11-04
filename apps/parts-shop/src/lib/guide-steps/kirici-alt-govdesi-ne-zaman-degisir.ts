// Kaynak: guides.ts 'kirici-alt-govdesi-ne-zaman-degisir' TR/EN bölüm 0, 1, 2, 3
// The narration of the guide's 3B video (scripts/guide-video/narration.ts). Each `src` is
// verbatim from guides.ts.
import type { GuideSteps } from './types';

export const guideSteps: GuideSteps = {
  key: 'kirici-alt-govdesi-ne-zaman-degisir',
  steps: [
    {
      id: 'cracks',
      h: { tr: 'Gövdede çatlak', en: 'The head is cracked' },
      s: {
        tr: 'Çatlaklar çoğunlukla kama deliklerinin, saplama deliklerinin ve köşelerin çevresinde başlar.',
        en: 'Cracks mostly start around the key holes, the tie-rod holes and the corners.',
      },
      src: {
        tr: 'Çatlaklar çoğunlukla kama deliklerinin, saplama deliklerinin ve köşelerin çevresinde başlar.',
        en: 'Cracks mostly start around the key holes, the tie-rod holes and the corners.',
      },
    },
    {
      id: 'seat',
      h: { tr: 'Aşınmış yuva', en: 'A worn seat' },
      s: {
        tr: 'Yuva aşınır ya da ovalleşirse yeni burç da yerinde oynar veya döner; uç eğik çalışır.',
        en: 'A worn or oval seat lets even a new bushing move or turn; the tool works at an angle.',
      },
      src: {
        tr: 'Yuva aşınır ya da ovalleşirse yeni burç da yerinde oynar veya döner',
        en: 'A worn or oval seat lets even a new bushing move or turn',
      },
    },
    {
      id: 'key-holes',
      h: { tr: 'Oval kama delikleri', en: 'Oval key holes' },
      s: {
        tr: 'Delikler ovalleşirse kama oynar, darbeli yük alır ve sık kırılır.',
        en: 'Oval holes let the key move, take shock loads and break often.',
      },
      src: {
        tr: 'Delikler ovalleşirse kama oynar, darbeli yük alır ve sık kırılır.',
        en: 'Oval holes let the key move, take shock loads and break often.',
      },
    },
    {
      id: 'in-time',
      h: { tr: 'Zamanında değiştirin', en: 'Replace in time' },
      s: { tr: 'Burçları ve ucu zamanında değiştirin.', en: 'Replace bushings and tools in time.' },
      src: { tr: 'Burçları ve ucu zamanında değiştirin', en: 'Replace bushings and tools in time' },
    },
    {
      id: 'worn-bushing',
      h: { tr: 'Aşınmış burç', en: 'Worn bushings' },
      s: {
        tr: 'Aşınmış burç ile çalışmak, yükü doğrudan gövdeye aktarır.',
        en: 'Working with worn bushings passes the load straight to the head.',
      },
      src: {
        tr: 'aşınmış burç ile çalışmak yükü doğrudan gövdeye aktarır.',
        en: 'working with worn bushings passes the load straight to the head.',
      },
    },
  ],
};
