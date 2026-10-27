/**
 * "Rehber": short how-to articles for questions buyers search for (owner, 2026-10-27, SEO plan
 * item 4). General workshop facts only: no figures, references or claims we cannot stand behind;
 * limits always point to the breaker's own manual. Each article links the part groups it is about.
 * The owner approves every text before it is published.
 */
import type { PartKey } from './routes';
import type { Lang } from '../types';

export const GUIDE_KEYS = [
  'kirici-ucu-ne-zaman-degisir',
  'kirici-burcu-ne-zaman-degisir',
  'kirici-kamasi-neden-kirilir',
  'keski-mi-sivri-uc-mu',
  'kirici-yaglamasi-nasil-yapilir',
] as const;
export type GuideKey = (typeof GUIDE_KEYS)[number];

export const GUIDES_PATH = '/rehber';
export const guidePath = (k: GuideKey): string => `${GUIDES_PATH}/${k}`;

export interface Guide {
  title: string;
  /** Meta description and the lead under the title. */
  lead: string;
  sections: { h: string; p: readonly string[] }[];
  /** Part groups the article is about ('tips' for the tip pages). */
  links: readonly (PartKey | 'tips')[];
}

export const GUIDES: Record<
  Lang,
  { title: string; lead: string; more: string; items: Record<GuideKey, Guide> }
> = {
  tr: {
    title: 'Rehber',
    lead: 'Hidrolik kırıcı parçalarının bakımı ve değişimi üzerine kısa notlar.',
    more: 'İlgili parçalar',
    items: {
      'kirici-ucu-ne-zaman-degisir': {
        title: 'Kırıcı ucu ne zaman değiştirilir?',
        lead: 'Uç aşınan bir parçadır; zamanında değiştirilmezse burçları, kamayı ve pistonu da yorar. Değişim zamanını gösteren işaretler.',
        sections: [
          {
            h: 'Uç boyu kısaldıysa',
            p: [
              'Uç çalıştıkça kısalır. Kırıcı üreticisinin kullanım kılavuzunda ucun en kısa kullanım boyu verilir; uç bu boya indiyse değiştirilmelidir. Kısa uçla çalışmak hem verimi düşürür hem de alt gövdeye ve burçlara yük bindirir.',
            ],
          },
          {
            h: 'Ucun arka yüzü ezildiyse (mantarlaşma)',
            p: [
              'Pistonun vurduğu arka yüz zamanla ezilip kenarlarından taşabilir. Taşan kenar burç içinde sıkışır, ucun düzgün çalışmasını engeller ve pistona zarar verebilir. Arka yüzde taşma ya da çatlak görülürse uç değiştirilmelidir.',
            ],
          },
          {
            h: 'Uçta çatlak ya da kırık varsa',
            p: [
              'Çatlak uç her an kırılabilir. Kırılmanın nedeni çoğu zaman kullanımdır: boşta vuruş, ucu levye gibi kullanmak, yanal ya da eğik vuruş ve yağlamasız çalışma. Yeni uç takmadan önce burçları da kontrol edin.',
            ],
          },
          {
            h: 'Ucu değiştirirken',
            p: [
              'Uçla birlikte burçları ve kamayı da kontrol edin; aşınmış burç yeni ucu da erken kırar. Takarken ucun kama kanalına ve burç yüzeyine gres sürün. Kırıcınızın marka ve modeline uyan ucu kırıcı ucu sayfalarından seçebilirsiniz.',
            ],
          },
        ],
        links: ['tips', 'burc', 'kama'],
      },
      'kirici-burcu-ne-zaman-degisir': {
        title: 'Kırıcı burcu ne zaman değiştirilir?',
        lead: 'Burçlar ucu yönlendirir. Aşınmış burç ucu eğik çalıştırır; uç, piston ve alt gövde erken bozulur.',
        sections: [
          {
            h: 'Uç ile burç arasındaki boşluk',
            p: [
              'Burç aşındıkça uç ile burç arasındaki boşluk büyür. İzin verilen en büyük boşluk kırıcının kullanım kılavuzunda yazar. Boşluğu ucun gövdesi ile burcun iç çapı arasından ölçün; sınır aşıldıysa burç değiştirilmelidir.',
            ],
          },
          {
            h: 'Aşınmanın belirtileri',
            p: [
              'Ucun yanlara fazla oynaması, burç iç yüzeyinde oval aşınma, çizik ya da yanık izleri ve ucun gövdesinde tek taraflı aşınma burcun yorulduğunu gösterir.',
            ],
          },
          {
            h: 'Burç değişirken',
            p: [
              'Kafa burcu ve dayama burcu (merkezleme) birlikte kontrol edilir; bazı kırıcılarda ikisi tek parçadır. Yeni burçla birlikte ucu da kontrol edin, aşınmış uç yeni burcu çabuk bozar. Burç yuvasının alt gövdede düzgün olduğundan emin olun.',
            ],
          },
          {
            h: 'Burcun ömrünü uzatmak için',
            p: [
              'Düzenli gres yağı verin, boşta vuruş yapmayın, ucu levye gibi kullanmayın ve kırıcıyı vurduğu yüzeye dik tutun.',
            ],
          },
        ],
        links: ['burc', 'tips', 'alt-govde'],
      },
      'kirici-kamasi-neden-kirilir': {
        title: 'Kırıcı kaması neden kırılır?',
        lead: 'Kama ucu alt gövdede tutar. Kırılan ya da eğilen kama çoğu zaman başka bir sorunun işaretidir.',
        sections: [
          {
            h: 'Boşta vuruş',
            p: [
              'Uç bir yüzeye dayanmadan kırıcı çalıştırılırsa pistonun darbesi ucu ileri iter ve bu yükü kama karşılar. Boşta vuruş kamanın kırılmasının en sık nedenidir.',
            ],
          },
          {
            h: 'Aşınmış uç ya da burç',
            p: [
              'Ucun kama kanalı aşındıysa ya da burçlar boşluk yaptıysa uç eğik çalışır ve kamaya darbeli yük biner. Kamayı değiştirirken ucun kama kanalını ve burçları da kontrol edin.',
            ],
          },
          {
            h: 'Yağlamasız çalışma',
            p: [
              'Gres verilmeyen kırıcıda kama ve uç kanalı kuru sürtünür, aşınır ve çentiklenir. Çentikli kama darbe altında kırılır.',
            ],
          },
          {
            h: 'Kamayı değiştirirken',
            p: [
              'Kırıcınızın modeline uyan kamayı ve tutucu pimini birlikte kullanın. Eğilmiş ya da çatlamış kamayı düzeltip yeniden takmayın.',
            ],
          },
        ],
        links: ['kama', 'tips', 'burc'],
      },
      'keski-mi-sivri-uc-mu': {
        title: 'Keski mi, sivri uç mu? Kırıcı ucu tipi nasıl seçilir',
        lead: 'Uç önce kırıcınızın modeline uymalıdır; tipi ise yapılacak işe göre seçilir. Keski, sivri, küt ve piramit uçların farkı.',
        sections: [
          {
            h: 'Keski (yassı) uç',
            p: [
              'Ağzı yassıdır; darbeyi bir çizgi boyunca verir. Toprak, yumuşak kaya, asfalt ve beton yarmada, bir hat boyunca kırmak ya da kanal açmak için kullanılır. Ağzın yönü işe göre ayarlanır.',
            ],
          },
          {
            h: 'Sivri uç',
            p: [
              'Darbeyi tek noktaya toplar ve malzemeye girer. Beton ve kayada genel kırım işlerinde en yaygın uçtur; hangisini seçeceğinizden emin değilseniz çoğu iş için sivri uçla başlanır.',
            ],
          },
          {
            h: 'Küt ve piramit uç',
            p: [
              'Küt uç darbeyi geniş bir yüzeye yayar; iri blokları, sert ve kırılgan kayayı ve cürufu parçalamak için kullanılır. Piramit uç, sivri ucun delici etkisini daha dayanıklı bir uç biçimiyle birleştirir; sert kaya ve betonarme yıkımında tercih edilir.',
            ],
          },
          {
            h: 'Hangi işe hangisi',
            p: [
              'Kanal, hendek ve asfalt kesmek için keski; beton ve kayada genel kırım için sivri; iri blok ve sert kaya parçalamak için küt; sert kaya ve betonarme için piramit uç seçilir. Hangi ucu kullanırsanız kullanın ucu dik tutun, boşta vurmayın ve ucu levye gibi kullanmayın.',
            ],
          },
          {
            h: 'Uç seçerken',
            p: [
              'Uç tipi ne olursa olsun çapı, boyu ve kama yuvası kırıcınızın modeline göre belirlenir. Kırıcınızın marka ve modelini kırıcı ucu sayfalarında arayın; o modele uyan uçları tipleriyle birlikte görebilirsiniz.',
            ],
          },
        ],
        links: ['tips', 'burc'],
      },
      'kirici-yaglamasi-nasil-yapilir': {
        title: 'Hidrolik kırıcı yağlaması nasıl yapılır?',
        lead: 'Uç ile burçlar arasında sürekli sürtünme vardır; doğru gres doğru şekilde verilmezse uç, burç ve kama erken aşınır. Kırıcı yağlamasının temel kuralları.',
        sections: [
          {
            h: 'Ne zaman yağlanır',
            p: [
              'Yağlama aralığı kırıcının kullanım kılavuzunda yazar; çalışma şartları ağırlaştıkça daha sık yağlanır. Uç gövdesi kuru ve parlak görünüyorsa yağlama geç kalmış demektir. Her uç değişiminde de uç gövdesine ve burçlara gres sürülür.',
            ],
          },
          {
            h: 'Nasıl yağlanır',
            p: [
              'Kırıcıyı dik tutun ve ucu zemine bastırarak sonuna kadar içeri itin; böylece gres pistonun çalıştığı bölgeye değil, uç ile burçların arasına gider. Gresi kırıcının gres nipelinden, kılavuzda yazan miktarda verin. Fazla gres de zararlıdır: taşan gres darbe bölgesine dolabilir.',
            ],
          },
          {
            h: 'Hangi gres',
            p: [
              'Uç ve burçlar için kılavuzun önerdiği, yüksek sıcaklığa ve darbeye dayanıklı uç gresi kullanılır. Sıradan makine gresi bu sıcaklıkta erir ve akar, uçla burç arasında koruyucu film bırakmaz.',
            ],
          },
          {
            h: 'Otomatik yağlama',
            p: [
              'Kırıcıya ya da iş makinesine bağlanan otomatik yağlama sistemi gresi çalışma sırasında düzenli verir; elle yağlamanın unutulmasını önler. Sistemin deposunu ve hortumlarını düzenli kontrol edin.',
            ],
          },
          {
            h: 'Yağlamasız çalışmanın sonucu',
            p: [
              'Kuru çalışan uçta gövde çizilir ve renk değiştirir, burçlar çabuk aşınır, kama ve uç kanalı çentiklenir. Bu hasarlar normal aşınma değildir ve parçaların ömrünü belirgin şekilde kısaltır.',
            ],
          },
        ],
        links: ['tips', 'burc', 'kama'],
      },
    },
  },
  en: {
    title: 'Guides',
    lead: 'Short notes on maintaining and replacing hydraulic breaker parts.',
    more: 'Related parts',
    items: {
      'kirici-ucu-ne-zaman-degisir': {
        title: 'When should a breaker tool be replaced?',
        lead: 'The tool is a wear part; left too long it also wears the bushings, the retainer key and the piston. Signs that it is time to change it.',
        sections: [
          {
            h: 'The tool has got too short',
            p: [
              'A tool gets shorter as it works. The breaker manufacturer’s manual gives the shortest usable tool length; at that length the tool should be replaced. A short tool works less well and loads the front head and bushings.',
            ],
          },
          {
            h: 'The impact face has mushroomed',
            p: [
              'The rear face the piston strikes can deform and spread over its edges. The spread edge jams in the bushing, stops the tool working freely and can damage the piston. Replace a tool with a mushroomed or cracked impact face.',
            ],
          },
          {
            h: 'The tool is cracked or broken',
            p: [
              'A cracked tool can break at any time. Breakage is mostly caused by use: blank firing, prying with the tool, side or angled blows and running without grease. Check the bushings before fitting a new tool.',
            ],
          },
          {
            h: 'When you change the tool',
            p: [
              'Check the bushings and the retainer key as well; a worn bushing breaks a new tool early too. Grease the key slot and the bushing surface when fitting. Find the tool for your breaker’s make and model on the tool pages.',
            ],
          },
        ],
        links: ['tips', 'burc', 'kama'],
      },
      'kirici-burcu-ne-zaman-degisir': {
        title: 'When should a breaker bushing be replaced?',
        lead: 'Bushings guide the tool. A worn bushing lets the tool work at an angle, and the tool, piston and front head wear early.',
        sections: [
          {
            h: 'Clearance between tool and bushing',
            p: [
              'As a bushing wears, the clearance between tool and bushing grows. The largest allowed clearance is in the breaker’s manual. Measure between the tool shank and the bushing bore; past the limit, replace the bushing.',
            ],
          },
          {
            h: 'Signs of wear',
            p: [
              'Too much side play of the tool, an oval or scored bore, burn marks, and wear on one side of the tool shank show a worn bushing.',
            ],
          },
          {
            h: 'When you change a bushing',
            p: [
              'Check the front and the thrust bushing together; on some breakers they are one part. Check the tool too, as a worn tool soon ruins a new bushing. Make sure the bushing seat in the front head is sound.',
            ],
          },
          {
            h: 'To make bushings last',
            p: [
              'Grease regularly, avoid blank firing, never pry with the tool and keep the breaker square to the surface it strikes.',
            ],
          },
        ],
        links: ['burc', 'tips', 'alt-govde'],
      },
      'kirici-kamasi-neden-kirilir': {
        title: 'Why do breaker retainer keys break?',
        lead: 'The retainer key holds the tool in the front head. A broken or bent key is usually the sign of another problem.',
        sections: [
          {
            h: 'Blank firing',
            p: [
              'Run without the tool resting on a surface, the piston blow drives the tool forward and the key takes that load. Blank firing is the most common cause of broken keys.',
            ],
          },
          {
            h: 'Worn tool or bushings',
            p: [
              'A worn key slot on the tool or slack bushings let the tool work at an angle and put shock loads on the key. Check the tool’s key slot and the bushings when you change the key.',
            ],
          },
          {
            h: 'Running without grease',
            p: [
              'Without grease the key and the tool slot rub dry, wear and notch. A notched key breaks under impact.',
            ],
          },
          {
            h: 'When you change the key',
            p: [
              'Use the key and its retaining pin made for your breaker model together. Do not straighten and refit a bent or cracked key.',
            ],
          },
        ],
        links: ['kama', 'tips', 'burc'],
      },
      'keski-mi-sivri-uc-mu': {
        title: 'Chisel or moil point? How to choose a breaker tool type',
        lead: 'A tool must first fit your breaker model; its type is chosen for the job. The difference between chisel, moil, blunt and pyramid tools.',
        sections: [
          {
            h: 'Chisel (flat) tool',
            p: [
              'It has a flat edge and strikes along a line. It is used in soil, soft rock, asphalt and for splitting concrete, to break along a line or to open a trench. The edge is turned to suit the job.',
            ],
          },
          {
            h: 'Moil point',
            p: [
              'It focuses the blow on a single point and penetrates. It is the most common tool for general breaking in concrete and rock; if you are not sure which to choose, most jobs start with a moil point.',
            ],
          },
          {
            h: 'Blunt and pyramid tools',
            p: [
              'A blunt tool spreads the blow over a wide face; it breaks large blocks, hard and brittle rock and slag. A pyramid tool combines the penetration of a moil point with a tougher tip; it is preferred for hard rock and reinforced-concrete demolition.',
            ],
          },
          {
            h: 'Which tool for which job',
            p: [
              'A chisel for trenches, ditches and cutting asphalt; a moil point for general breaking in concrete and rock; a blunt tool for large blocks and hard rock; a pyramid tool for hard rock and reinforced concrete. Whatever the tool, keep it square, avoid blank firing and never pry with it.',
            ],
          },
          {
            h: 'When you choose a tool',
            p: [
              'Whatever the type, the diameter, length and key slot are set by your breaker model. Search your breaker’s make and model on the tool pages to see the tools that fit it, with their types.',
            ],
          },
        ],
        links: ['tips', 'burc'],
      },
      'kirici-yaglamasi-nasil-yapilir': {
        title: 'How to grease a hydraulic breaker',
        lead: 'The tool rubs against the bushings all the time; without the right grease applied the right way, tool, bushings and retainer key wear early. The basic rules of breaker greasing.',
        sections: [
          {
            h: 'When to grease',
            p: [
              'The greasing interval is in the breaker’s manual; the harder the conditions, the more often. A dry, shiny tool shank means greasing is overdue. Grease the tool shank and bushings at every tool change too.',
            ],
          },
          {
            h: 'How to grease',
            p: [
              'Hold the breaker upright and press the tool fully in against the ground, so the grease goes between tool and bushings rather than into the piston area. Grease through the breaker’s grease nipple, in the amount the manual gives. Too much grease does harm as well: the surplus can fill the impact area.',
            ],
          },
          {
            h: 'Which grease',
            p: [
              'Use the high-temperature, impact-resistant chisel paste the manual recommends for tool and bushings. Ordinary machine grease melts and runs at these temperatures and leaves no protective film between tool and bushing.',
            ],
          },
          {
            h: 'Automatic greasing',
            p: [
              'An automatic lubrication system on the breaker or the carrier feeds grease steadily while working and keeps greasing from being forgotten. Check its reservoir and hoses regularly.',
            ],
          },
          {
            h: 'What running dry does',
            p: [
              'A tool run dry gets a scored, discoloured shank, the bushings wear fast and the key and tool slot notch. This is not normal wear and it shortens the life of the parts markedly.',
            ],
          },
        ],
        links: ['tips', 'burc', 'kama'],
      },
    },
  },
};
