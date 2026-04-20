// Breaker database — brand → models → parts (ref codes match main catalog)
window.BREAKERS = {
  'FURUKAWA': [
    { model:'HB5G',  weight:350,   chisel:'Ø55 × 1050', pistonRef:'PST-17-050' },
    { model:'HB20G', weight:1900,  chisel:'Ø100 × 1400', pistonRef:'PST-17-100' },
    { model:'HB30G', weight:3700,  chisel:'Ø135 × 1650', pistonRef:'PST-17-135' },
    { model:'HB40G', weight:5200,  chisel:'Ø150 × 1800', pistonRef:'PST-17-150' },
  ],
  'RAMMER': [
    { model:'S25',   weight:260,   chisel:'Ø50 × 950',  pistonRef:'PST-17-050' },
    { model:'S83',   weight:1680,  chisel:'Ø95 × 1380',  pistonRef:'PST-17-095' },
    { model:'G100',  weight:1900,  chisel:'Ø100 × 1400', pistonRef:'PST-17-100' },
    { model:'E68',   weight:1320,  chisel:'Ø85 × 1250',  pistonRef:'PST-17-085' },
  ],
  'SOOSAN': [
    { model:'SB43',  weight:320,   chisel:'Ø55 × 1000', pistonRef:'PST-17-055' },
    { model:'SB81',  weight:1420,  chisel:'Ø90 × 1350',  pistonRef:'PST-17-090' },
    { model:'SB121', weight:2800,  chisel:'Ø125 × 1600', pistonRef:'PST-17-125' },
    { model:'SB151', weight:5100,  chisel:'Ø150 × 1800', pistonRef:'PST-17-150' },
  ],
  'ATLAS COPCO': [
    { model:'SB52',  weight:310,   chisel:'Ø55 × 1000', pistonRef:'PST-17-055' },
    { model:'MB1000',weight:950,   chisel:'Ø75 × 1200',  pistonRef:'PST-17-075' },
    { model:'MB1500',weight:1580,  chisel:'Ø95 × 1380',  pistonRef:'PST-17-095' },
    { model:'HB3000',weight:3250,  chisel:'Ø130 × 1600', pistonRef:'PST-17-130' },
  ],
  'MONTABERT': [
    { model:'V45',   weight:580,   chisel:'Ø68 × 1100', pistonRef:'PST-17-068' },
    { model:'XL1700',weight:1700,  chisel:'Ø100 × 1400', pistonRef:'PST-17-100' },
    { model:'V3500', weight:3500,  chisel:'Ø135 × 1650', pistonRef:'PST-17-135' },
  ],
  'INDECO': [
    { model:'HP500', weight:480,   chisel:'Ø65 × 1050', pistonRef:'PST-17-065' },
    { model:'HP1800',weight:1850,  chisel:'Ø100 × 1400', pistonRef:'PST-17-100' },
    { model:'HP4000',weight:4100,  chisel:'Ø140 × 1700', pistonRef:'PST-17-140' },
  ],
  'NPK': [
    { model:'GH4',   weight:380,   chisel:'Ø55 × 1050', pistonRef:'PST-17-055' },
    { model:'GH7',   weight:700,   chisel:'Ø68 × 1150',  pistonRef:'PST-17-068' },
    { model:'GH15',  weight:1600,  chisel:'Ø95 × 1380',  pistonRef:'PST-17-095' },
    { model:'GH23',  weight:2550,  chisel:'Ø115 × 1550', pistonRef:'PST-17-115' },
  ],
  'KOMATSU': [
    { model:'JMHB20',weight:1830,  chisel:'Ø100 × 1400', pistonRef:'PST-17-100' },
    { model:'JMHB35',weight:3450,  chisel:'Ø135 × 1650', pistonRef:'PST-17-135' },
  ],
  'DOOSAN': [
    { model:'DXB170H',weight:1750, chisel:'Ø100 × 1400', pistonRef:'PST-17-100' },
    { model:'DXB260H',weight:2650, chisel:'Ø120 × 1550', pistonRef:'PST-17-120' },
  ],
  'EPIROC': [
    { model:'HB2500',weight:2550,  chisel:'Ø120 × 1550', pistonRef:'PST-17-120' },
    { model:'HB4100',weight:4100,  chisel:'Ø140 × 1700', pistonRef:'PST-17-140' },
  ],
};

window.COMPAT_DICT = {
  tr: { title:'Uyumluluk Bulucu', step1:'Marka seç', step2:'Model seç', step3:'Parçalar',
        model:'Model', weight:'Ağırlık', chisel:'Standart keski', parts:'Eşleşen parçalar',
        back:'← Geri', ask:'Bu model için teklif iste',
        kitName:'Tam tamir kiti', kitDesc:'Piston + üst/alt burç + conta + yıkama', },
  en: { title:'Compatibility Finder', step1:'Choose brand', step2:'Choose model', step3:'Parts',
        model:'Model', weight:'Weight', chisel:'Stock chisel', parts:'Matching parts',
        back:'← Back', ask:'Quote this model',
        kitName:'Complete repair kit', kitDesc:'Piston + upper/lower bushing + seals + wash', },
  de: { title:'Kompatibilitäts-Finder', step1:'Marke wählen', step2:'Modell wählen', step3:'Teile',
        model:'Modell', weight:'Gewicht', chisel:'Standardmeißel', parts:'Passende Teile',
        back:'← Zurück', ask:'Angebot anfordern',
        kitName:'Reparatursatz komplett', kitDesc:'Kolben + obere/untere Buchse + Dichtungen', },
  ru: { title:'Подбор совместимости', step1:'Выбрать марку', step2:'Выбрать модель', step3:'Детали',
        model:'Модель', weight:'Вес', chisel:'Пика', parts:'Совместимые детали',
        back:'← Назад', ask:'Запросить по модели',
        kitName:'Полный ремкомплект', kitDesc:'Поршень + втулки + уплотнения + промывка', },
};
