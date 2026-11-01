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
  'kirici-alt-govdesi-ne-zaman-degisir',
  'kirici-pistonu-neden-cizilir',
  'kirici-saplamasi-neden-kopar',
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
      'kirici-alt-govdesi-ne-zaman-degisir': {
        title: 'Kırıcı alt gövdesi ne zaman değiştirilir?',
        lead: 'Alt gövde (ön kafa) ucu ve burçları taşır, kamayı yerinde tutar. Burç değiştirmekle düzelmeyen aşınma ve çatlaklar gövdenin değişme zamanının geldiğini gösterir.',
        sections: [
          {
            h: 'Burç yuvası aşındıysa',
            p: [
              'Burçlar alt gövdedeki yuvalarına sıkı oturur. Yuva aşınır ya da ovalleşirse yeni burç da yerinde oynar veya döner; uç eğik çalışır ve yeni burç kısa sürede bozulur. Yuvanın ölçüsü kırıcının kullanım kılavuzundaki sınırı aştıysa gövde değiştirilmelidir.',
            ],
          },
          {
            h: 'Kama delikleri ovalleştiyse',
            p: [
              'Kama alt gövdedeki deliklerden geçer. Delikler ovalleşirse kama oynar, darbeli yük alır ve sık kırılır. Yeni kama takıldığında da boşluk kalıyorsa sorun gövdededir.',
            ],
          },
          {
            h: 'Gövdede çatlak varsa',
            p: [
              'Çatlaklar çoğunlukla kama deliklerinin, saplama deliklerinin ve köşelerin çevresinde başlar. Çatlak darbe altında büyür ve gövde çalışırken kırılabilir. Çatlak görülen gövde ile çalışmaya devam etmeyin; durumunu bir uzmana kontrol ettirin.',
            ],
          },
          {
            h: 'Gövdenin ömrünü uzatmak için',
            p: [
              'Burçları ve ucu zamanında değiştirin; aşınmış burç ile çalışmak yükü doğrudan gövdeye aktarır. Düzenli gres verin, boşta vuruş yapmayın, ucu levye gibi kullanmayın ve saplama somunlarını kılavuzda yazan şekilde sıkılı tutun.',
            ],
          },
          {
            h: 'Alt gövde seçerken',
            p: [
              'Alt gövde kırıcının modeline göre üretilir; burç yuvaları, kama delikleri ve saplama delikleri o modele uymalıdır. Kırıcınızın marka ve modelini alt gövde sayfasında arayın; bazı modellerde gövde burçları takılı olarak da sunulur.',
            ],
          },
        ],
        links: ['alt-govde', 'burc', 'kama', 'saplama'],
      },
      'kirici-pistonu-neden-cizilir': {
        title: 'Kırıcı pistonu neden çizilir?',
        lead: 'Piston silindirin içinde çok dar bir boşlukla çalışır. Yağa karışan kir, eğik vuruş ya da aşırı ısınma piston ve silindir yüzeyini çizer.',
        sections: [
          {
            h: 'Kirli ya da yanlış hidrolik yağ',
            p: [
              'Piston ile silindiri hidrolik yağ yağlar. Yağa karışan toz, metal parçacığı ya da su yüzeyleri zımpara gibi çizer. Kir çoğu zaman kırıcı takılıp sökülürken kirli hortum uçlarından ve rakorlardan, yıkanmamış yeni hatlardan ya da onarım sırasında girer: kırıcı makineden ayrıyken hortum uçlarını temizleyip kapatın, yeni hatları ilk çalışmadan önce yıkayın. Üreticinin önerdiği yağı kullanın. Kırıcı çalışması yağı kazıdan çok daha hızlı ısıtıp kirlettiği için yağ ve filtreyi normal kazı aralıklarına göre değil, kılavuzların kırıcı çalışması için verdiği aralıklarda değiştirin; kılavuz istiyorsa kırıcı devresine dönüş filtresi takın.',
            ],
          },
          {
            h: 'Aşınmış burç, kötü uç ve yanlış gres',
            p: [
              'Aşınmış ya da uymayan burç ucu eğik tutar; piston ucun arka yüzüne eğik vurur, silindir içinde yana itilir ve tek taraftan çizilir. Darbe yüzü ezilmiş, çentiklenmiş ya da çatlamış veya kırıcıya uymayan uç pistonun vuruş yüzünü bozar; kopan parçalar keçelere ve piston ile silindir arasına girer. Gres de doğru yere gitmelidir: uç sonuna kadar itilmeden ya da fazla gres verilirse gres darbe bölgesine dolar, piston onu her vuruşta alt keçelere ve silindire basar; keçeler bozulur ve gres hidrolik yağa karışır. Uç, burç ve yağlama rehberleri ayrıntıyı anlatıyor.',
            ],
          },
          {
            h: 'Boşta vuruş ve ucu levye gibi kullanmak',
            p: [
              'Uç bir yüzeye dayanmadan vurulduğunda piston normal vuruş boyunu aşıp silindirin ön tarafına kadar gider; darbeyi alt gövde, kama, keçeler ve pistonun vuruş yüzü alır. Bozulan keçeler kirin girmesine ve yağ filminin kaybolmasına yol açar, piston çizilir. Ucu levye gibi kullanmak ise yanal yük bindirir; piston tek tarafa sürtünür ve çizilir.',
            ],
          },
          {
            h: 'Aşırı ısınma, gaz basıncı ve aşınmış keçeler',
            p: [
              'Ara vermeden uzun çalışmak, yetersiz soğutma ya da yanlış ayarlanmış hidrolik sistem yağı ısıtır; incelen yağ piston ile silindir arasındaki yağ filmini tutamaz ve metal metale sürtünür. Çalışma basıncı, yağ akışı ve sıcaklık sınırları kırıcının kılavuzunda yazar. Yanlış gaz basıncı pistonun hareketini bozar, yırtılan akümülatör diyaframı yağa parça karıştırır; gaz basıncını kılavuzda yazan aralıklarla kontrol ettirin. Aşınmış toz keçesi içeri toz ve çamur alır; keçeleri kılavuzdaki bakımlarda ve kaçak görüldüğünde değiştirin.',
            ],
          },
          {
            h: 'Belirtiler ve kontrol',
            p: [
              'Darbe gücünün düşmesi, vuruşun düzensizleşmesi, yağ kaçağı, keçelerin sık bozulması ve hidrolik yağda ya da filtrede metal parçacıkları piston ya da silindirin çizildiğini gösterebilir. Yağın temizliğini, filtreyi, uç ile burç arasındaki boşluğu, yağlamayı ve keçeleri kontrol edin; bu belirtilerle çalışmaya devam etmek hasarı büyütür. Pistonu söküp yüzeyini incelemek atölye işidir.',
            ],
          },
          {
            h: 'Piston ve silindir birlikte değerlendirilir',
            p: [
              'Çizik piston çoğu zaman silindirde de iz bırakır; çizik silindire takılan yeni piston da kısa sürede çizilir. Pistonun ve silindirin yeniden kullanılıp kullanılamayacağına, ikisini birlikte ölçüp inceleyen bir atölye karar verir. Çizilmeye yol açan neden giderilmeden yeni piston takmayın. Kırıcınızın marka ve modeline uyan pistonu piston sayfasında arayabilirsiniz.',
            ],
          },
        ],
        links: ['piston', 'burc', 'tips'],
      },
      'kirici-saplamasi-neden-kopar': {
        title: 'Kırıcı saplaması neden kopar?',
        lead: 'Saplamalar kırıcının gövde parçalarını bir arada tutar ve her darbede yük taşır. Kopan saplama çoğu zaman sıkma, bakım ya da kullanım hatasının işaretidir.',
        sections: [
          {
            h: 'Yanlış ya da eşit olmayan sıkma',
            p: [
              'Saplama somunları kırıcı üreticisinin kılavuzunda yazan yöntemle sıkılır. Az sıkılan saplamada gövde parçaları arasında boşluk açılır ve saplama her darbede vuruntulu yük alır; fazla sıkılan saplama baştan zorlanır. Somunlar birbirinden farklı sıkılırsa yükü saplamaların yalnızca bir kısmı taşır ve en çok yüklenen önce kopar. Sıkmadan önce dişleri temizleyin; dişleri ve somunların oturma yüzlerini kılavuzda yazan yağlayıcıyla yağlayın, çünkü kuru, kirli ya da paslı dişte aynı sıkma değeri çok daha az sıkılık verir. Somunları kılavuzdaki sırayla, çapraz ve kademeli olarak sıkın.',
            ],
          },
          {
            h: 'Gevşeyen somunlar, bozuk diş ve pul',
            p: [
              'Darbe ve titreşim somunları zamanla gevşetebilir; gevşek saplama kısa sürede yorulur ve onun yükünü diğerleri taşır. Yeni ya da revizyondan çıkmış kırıcıda birleşimler ilk çalışma saatlerinde oturur; somunların sıkılığını kılavuzda yazan ilk kontrol zamanında ve sonra kılavuzdaki aralıklarla kontrol edin. Eksik pul, aşınmış oturma yüzeyi ya da ezilmiş, paslı, çapaklı diş somunun tam oturmasını ve saplamanın doğru gerilmesini engeller. Dişi hasarlı saplama ve somunu yeniden kullanmayın.',
            ],
          },
          {
            h: 'Yanal yük: boşta vuruş, levye, aşınmış burç ve tampon',
            p: [
              'Boşta vuruşta darbenin enerjisi kırıcının gövdesine ve saplamalara biner. Ucu levye gibi kullanmak, taşı uçla yana itmek ya da aşınmış uç ve burçla eğik çalışmak gövdeye yanal yük bindirir; saplamalar çekmenin yanında eğilme yükü de taşır. Muhafazadaki aşınmış tamponlar ve aşınma plakaları gövdenin muhafaza içinde vurup sarsılmasına yol açar; bunları bakımlarda kontrol edin.',
            ],
          },
          {
            h: 'Yanlış gaz basıncı, fazla yağ basıncı ve bastırma',
            p: [
              'Arka kafa ya da akümülatör gaz basıncı düşük ya da yüksekse veya akümülatör diyaframı yırtılmışsa basınç darbeleri ve titreşim gövdeye geçer. Kırıcının değerlerini aşan çalışma basıncı ya da yağ akışı, yüksek dönüş hattı basıncı ve iş makinesini kırıcının üstüne kaldıracak kadar bastırmak da saplamalara her darbede fazladan yük bindirir. Gaz basıncını kılavuzda yazan aralıklarla kontrol ettirin; basınç ve yağ akışını kılavuzdaki değerlerde tutun.',
            ],
          },
          {
            h: 'Yorulma ve kırıcıya uymayan saplama',
            p: [
              'Saplama her darbede biraz gerilir ve geri bırakılır. Bu tekrar eden yük zamanla küçük çatlaklar açar; kopma çoğu zaman diş dibinde ya da kesitin değiştiği yerde başlar ve uyarı vermeden olur. Boyu, çapı, dişi ve malzemesi o kırıcıya göre yapılmamış bir saplama, ölçüsü benzese de doğru sıkılamaz ya da darbeye dayanmaz.',
            ],
          },
          {
            h: 'Belirtiler ve kontrol',
            p: [
              'Gövde parçaları arasında boşluk ya da oynama, birleşim yerlerinden yağ sızması, alışılmadık vuruntu ya da tıkırtı ve gevşemiş somunlar saplamalarda sorun olduğunu gösterir. Uç ve burç aşınmasına da bakın; saplamalara binen yanal yükün nedeni çoğu zaman oradadır. Bir saplama koptuysa kırıcıyı çalıştırmayın; yük diğer saplamalara biner ve onlar da kopabilir.',
            ],
          },
          {
            h: 'Saplama değişimi atölye işidir',
            p: [
              'Çoğu kırıcıda arka kafa, bazılarında akümülatör de basınçlı azot gazı tutar. Gaz kılavuzda yazan dolum takımıyla boşaltılmadan ve kırıcı yatırılıp desteklenmeden saplamalar gevşetilmez, sökülmez ve gövde açılmaz; aksi halde arka kafa fırlayıp ağır yaralanmaya yol açabilir. Saplamaları değiştirip tam değerine sıkmak atölye işidir; makine üzerinde operatöre düşen yalnızca somun sıkılığını kılavuzda yazan şekilde kontrol etmektir. Bir saplama koptuğunda diğerleri onun yükünü de taşımıştır; uzamış ya da gözle görülmeyen ince çatlaklar almış olabilirler. Bu yüzden saplamalar genellikle takım olarak, somun ve pullarıyla birlikte değiştirilir; kılavuzda yazanı esas alın. Kırıcınızın marka ve modeline uyan saplamaları saplama sayfasında arayabilirsiniz.',
            ],
          },
        ],
        links: ['saplama', 'alt-govde', 'burc'],
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
      'kirici-alt-govdesi-ne-zaman-degisir': {
        title: 'When should a breaker front head be replaced?',
        lead: 'The front head carries the tool and the bushings and holds the retainer key. Wear and cracks that new bushings do not cure show that the head is due for replacement.',
        sections: [
          {
            h: 'The bushing seat is worn',
            p: [
              'Bushings sit tight in their seats in the front head. A worn or oval seat lets even a new bushing move or turn; the tool works at an angle and the new bushing soon fails. If the seat is past the limit in the breaker’s manual, replace the head.',
            ],
          },
          {
            h: 'The key holes are oval',
            p: [
              'The retainer key passes through holes in the front head. Oval holes let the key move, take shock loads and break often. If a new key is still loose, the problem is in the head.',
            ],
          },
          {
            h: 'The head is cracked',
            p: [
              'Cracks mostly start around the key holes, the tie-rod holes and the corners. A crack grows under impact and the head can break in work. Do not keep working with a cracked head; have it checked by a specialist.',
            ],
          },
          {
            h: 'To make the head last',
            p: [
              'Replace bushings and tools in time; working with worn bushings passes the load straight to the head. Grease regularly, avoid blank firing, never pry with the tool and keep the tie-rod nuts tightened as the manual says.',
            ],
          },
          {
            h: 'When you choose a front head',
            p: [
              'A front head is made for one breaker model; its bushing seats, key holes and tie-rod holes must fit that model. Search your breaker’s make and model on the front head page; for some models the head is also offered with the bushings fitted.',
            ],
          },
        ],
        links: ['alt-govde', 'burc', 'kama', 'saplama'],
      },
      'kirici-pistonu-neden-cizilir': {
        title: 'Why does a breaker piston get scored?',
        lead: 'The piston runs inside the cylinder with a very small clearance. Dirt in the oil, off-axis blows or overheating score the piston and the cylinder.',
        sections: [
          {
            h: 'Contaminated or wrong hydraulic oil',
            p: [
              'Hydraulic oil lubricates the piston and the cylinder. Dust, metal particles or water in the oil score the surfaces like sandpaper. Dirt most often gets in through dirty hose ends and couplers when the breaker is fitted or removed, through new lines that were not flushed, or during a repair: clean and cap the hose ends while the breaker is off the machine, and flush new lines before the first run. Use the oil the manufacturer recommends. Breaker work heats and contaminates the oil much faster than digging, so change oil and filters at the intervals the manuals give for breaker work, not the normal digging intervals; fit a return filter to the breaker circuit if the manual asks for one.',
            ],
          },
          {
            h: 'Worn bushings, a bad tool and wrong greasing',
            p: [
              'A worn or wrong-fit bushing holds the tool at an angle; the piston strikes the tool’s impact end off-axis, is pushed sideways in the cylinder and scores on one side. A tool whose impact face is mushroomed, chipped or cracked, or that does not fit the breaker, damages the piston’s striking face, and the chips get into the seals and between piston and cylinder. Grease must go to the right place too: greased without the tool pressed fully in, or with too much grease, it fills the impact area and the piston presses it into the lower seals and the cylinder at every blow; the seals fail and the grease gets into the hydraulic oil. The tool, bushing and greasing guides give the details.',
            ],
          },
          {
            h: 'Blank firing and prying with the tool',
            p: [
              'When the tool strikes without resting on a surface, the piston runs past its normal stroke towards the front of the cylinder; the front head, the retainer key, the seals and the piston’s striking face take the blow. Damaged seals let dirt in and the oil film break down, and the piston scores. Prying with the tool puts a side load on it; the piston rubs on one side and scores.',
            ],
          },
          {
            h: 'Overheating, gas pressure and worn seals',
            p: [
              'Long work without breaks, poor cooling or a wrongly set hydraulic system heat the oil; thinned oil cannot keep the oil film between piston and cylinder, and metal rubs on metal. The limits for working pressure, oil flow and temperature are in the breaker’s manual. Wrong gas pressure upsets the piston’s movement, and a torn accumulator diaphragm puts debris into the oil; have the gas pressure checked at the intervals the manual gives. A worn dust seal lets dust and mud in; change the seals at the services the manual gives and whenever you see a leak.',
            ],
          },
          {
            h: 'Signs and checks',
            p: [
              'Loss of impact power, irregular blows, oil leaks, seals that keep failing and metal particles in the hydraulic oil or the filter can show a scored piston or cylinder. Check how clean the oil is, the filter, the clearance between tool and bushing, the greasing and the seals; working on with these signs makes the damage worse. Taking the piston out and inspecting its surface is workshop work.',
            ],
          },
          {
            h: 'Piston and cylinder are judged together',
            p: [
              'A scored piston usually marks the cylinder as well, and a new piston in a scored cylinder soon scores too. Whether piston and cylinder can be used again is decided by a workshop that measures and inspects the two together. Do not fit a new piston before the cause of the scoring has been removed. Search your breaker’s make and model on the piston page to find the piston that fits it.',
            ],
          },
        ],
        links: ['piston', 'burc', 'tips'],
      },
      'kirici-saplamasi-neden-kopar': {
        title: 'Why do breaker tie rods break?',
        lead: 'Tie rods hold the breaker body sections together and carry load at every blow. A broken rod usually points to a tightening, maintenance or operating fault.',
        sections: [
          {
            h: 'Wrong or uneven tightening',
            p: [
              'Tie-rod nuts are tightened by the method the breaker manufacturer’s manual gives. An under-tightened rod lets gaps open between the body sections and takes a shock load at every blow; an over-tightened rod is strained from the start. If the nuts are tightened unevenly, only some of the rods carry the load and the most loaded one breaks first. Before tightening, clean the threads and lubricate them and the nut seating faces with the lubricant the manual names, because dry, dirty or rusty threads give much less clamping at the same tightening value. Tighten the nuts in the order the manual gives, crosswise and in stages.',
            ],
          },
          {
            h: 'Loose nuts, damaged threads and washers',
            p: [
              'Impact and vibration can loosen the nuts over time; a loose rod soon fatigues and the others carry its load. On a new or rebuilt breaker the joints settle in the first working hours; check the tightness of the nuts at the first check the manual gives and then at the manual’s intervals. A missing washer, a worn seating face or crushed, rusty or burred threads keep the nut from seating fully and the rod from being tensioned correctly. Do not reuse a rod or nut with damaged threads.',
            ],
          },
          {
            h: 'Side loads: blank firing, prying, worn bushings and buffers',
            p: [
              'In blank firing the energy of the blow goes into the breaker body and the tie rods. Prying with the tool, pushing rock sideways with it, or working at an angle with a worn tool and bushings puts side loads on the body; the rods then carry bending as well as tension. Worn damping buffers and wear plates in the housing let the body hammer and rattle inside it; check them at service.',
            ],
          },
          {
            h: 'Wrong gas pressure, excess oil pressure and down force',
            p: [
              'If the back-head or accumulator gas pressure is too low or too high, or the accumulator diaphragm is torn, pressure peaks and vibration pass into the body. Working pressure or oil flow above the breaker’s rating, high return-line back pressure and pressing down so hard that the machine lifts on the breaker also add load to the rods at every blow. Have the gas pressure checked at the intervals the manual gives, and keep pressure and oil flow to the manual’s values.',
            ],
          },
          {
            h: 'Fatigue and a rod that does not match the breaker',
            p: [
              'A tie rod is stretched a little and released at every blow. This repeated load opens small cracks over time; a break usually starts at the root of a thread or where the rod’s section changes, and comes without warning. A rod whose length, diameter, thread and material were not made for that breaker, even one of similar size, cannot be tightened correctly or does not stand up to impact.',
            ],
          },
          {
            h: 'Signs and checks',
            p: [
              'Gaps or play between the body sections, oil seeping at the joints, unusual knocking or rattling and loose nuts show a problem with the tie rods. Look at tool and bushing wear too; the side load on the rods often comes from there. If a rod has broken, do not run the breaker; the load moves to the other rods and they can break too.',
            ],
          },
          {
            h: 'Replacing tie rods is workshop work',
            p: [
              'On most breakers the back head, and on some the accumulator too, holds nitrogen gas under pressure. Tie rods are not loosened or removed, and the body is not taken apart, until the gas has been let out with the charging kit the manual names and the breaker has been laid flat and supported; otherwise the back head can be thrown off and cause serious injury. Replacing tie rods and tightening them to full value is workshop work; on the machine, the operator only checks nut tightness as the manual says. When one rod breaks, the others have carried its load too; they may be stretched or have fine cracks you cannot see. So tie rods are usually replaced as a set, with their nuts and washers; follow what the manual says. Search your breaker’s make and model on the tie rod page to find the rods that fit it.',
            ],
          },
        ],
        links: ['saplama', 'alt-govde', 'burc'],
      },
    },
  },
};
