// Kervan Heat — Figma Design Generator
// Run via: Plugins → Development → Import plugin from manifest…
// Then: Plugins → Development → Kervan Heat Design Generator

(async () => {
  // ─── DESIGN TOKENS ──────────────────────────────────────────────────────
  const hex = (h) => {
    h = h.replace('#','');
    return { r: parseInt(h.slice(0,2),16)/255, g: parseInt(h.slice(2,4),16)/255, b: parseInt(h.slice(4,6),16)/255 };
  };
  const T = {
    bg0: hex('#08090B'),  bg1: hex('#0E1014'),  bg2: hex('#151821'),  bg3: hex('#1C2029'),
    t1:  hex('#F5F6F8'),  t2:  hex('#A8ADB8'),  t3:  hex('#6B7280'),
    brand: hex('#E8781A'), brandHi: hex('#FF8A2B'), brandLo: hex('#B85810'),
    steel: hex('#2D3748'), steelHi: hex('#4A5568'),
    wa: hex('#25D366'),    ig1: hex('#E1306C'),    ig2: hex('#F77737'),
  };
  const LINE = { r:1,g:1,b:1 };

  // ─── FONT LOADING ───────────────────────────────────────────────────────
  const fonts = [
    {family:"Space Grotesk",style:"Medium"},{family:"Space Grotesk",style:"SemiBold"},{family:"Space Grotesk",style:"Bold"},
    {family:"Inter",style:"Regular"},{family:"Inter",style:"Medium"},{family:"Inter",style:"SemiBold"},{family:"Inter",style:"Bold"},
    {family:"JetBrains Mono",style:"Regular"},{family:"JetBrains Mono",style:"Medium"},
  ];
  figma.notify("Loading fonts…");
  for (const f of fonts) { try { await figma.loadFontAsync(f); } catch(e){} }

  // ─── HELPERS ────────────────────────────────────────────────────────────
  const fill = (c, opacity) => ({ type:"SOLID", color:{r:c.r,g:c.g,b:c.b}, opacity: opacity === undefined ? 1 : opacity });
  const stroke = (c, opacity) => ({ type:"SOLID", color:{r:c.r,g:c.g,b:c.b}, opacity: opacity === undefined ? 1 : opacity });

  function frame(name, opts = {}) {
    const f = figma.createFrame();
    f.name = name;
    if (opts.w != null || opts.h != null) f.resize(opts.w || 100, opts.h || 100);
    f.fills = opts.fill ? [fill(opts.fill, opts.fillOpacity)] : [];
    if (opts.stroke) { f.strokes = [stroke(opts.stroke, opts.strokeOpacity)]; f.strokeWeight = opts.strokeWeight || 1; }
    if (opts.radius != null) f.cornerRadius = opts.radius;
    if (opts.layout) {
      f.layoutMode = opts.layout;
      f.primaryAxisSizingMode = opts.primaryAuto ? "AUTO" : "FIXED";
      f.counterAxisSizingMode = opts.counterAuto ? "AUTO" : "FIXED";
      if (opts.px != null) { f.paddingLeft = opts.px; f.paddingRight = opts.px; }
      if (opts.py != null) { f.paddingTop = opts.py; f.paddingBottom = opts.py; }
      if (opts.p != null) { f.paddingLeft = f.paddingRight = f.paddingTop = f.paddingBottom = opts.p; }
      if (opts.gap != null) f.itemSpacing = opts.gap;
      if (opts.align) f.counterAxisAlignItems = opts.align;
      if (opts.justify) f.primaryAxisAlignItems = opts.justify;
    }
    if (opts.clip) f.clipsContent = true;
    return f;
  }

  function text(chars, opts = {}) {
    const t = figma.createText();
    t.fontName = { family: opts.family || "Inter", style: opts.style || "Regular" };
    t.fontSize = opts.size || 14;
    t.characters = chars;
    t.fills = [fill(opts.color || T.t1)];
    if (opts.tracking != null) t.letterSpacing = { value: opts.tracking, unit: "PERCENT" };
    if (opts.lineHeight != null) t.lineHeight = { value: opts.lineHeight, unit: "PERCENT" };
    if (opts.align) t.textAlignHorizontal = opts.align;
    if (opts.autoResize === false) t.textAutoResize = "NONE";
    else t.textAutoResize = opts.autoResize || "WIDTH_AND_HEIGHT";
    if (opts.maxWidth) { t.textAutoResize = "HEIGHT"; t.resize(opts.maxWidth, t.height); }
    if (opts.upper) t.textCase = "UPPER";
    return t;
  }

  function circle(size, color) {
    const e = figma.createEllipse();
    e.resize(size, size);
    e.fills = [fill(color)];
    return e;
  }

  // ─── VARIABLES ──────────────────────────────────────────────────────────
  let coll;
  try {
    coll = figma.variables.createVariableCollection("Kervan Brand");
    const m = coll.modes[0].modeId;
    const V = (name, color) => {
      const v = figma.variables.createVariable(name, coll, "COLOR");
      v.setValueForMode(m, { r: color.r, g: color.g, b: color.b });
      return v;
    };
    V("bg/0", T.bg0); V("bg/1", T.bg1); V("bg/2", T.bg2); V("bg/3", T.bg3);
    V("text/1", T.t1); V("text/2", T.t2); V("text/3", T.t3);
    V("brand/base", T.brand); V("brand/hi", T.brandHi); V("brand/lo", T.brandLo);
    V("steel/base", T.steel); V("steel/hi", T.steelHi);
  } catch(e) { /* already exists */ }

  // ─── PAGES ──────────────────────────────────────────────────────────────
  const desktopPage = figma.createPage();
  desktopPage.name = "💻 Desktop · 1440";
  const mobilePage = figma.createPage();
  mobilePage.name = "📱 Mobile · 375";
  figma.currentPage = desktopPage;

  // ─── COMPONENT: Krv LOGO MARK ───────────────────────────────────────────
  function logoMark(size = 36) {
    const f = frame("Logo", { w: size, h: size, radius: size * 0.17, clip: true });
    const bgGrad = figma.createRectangle();
    bgGrad.resize(size, size);
    bgGrad.fills = [{
      type: "GRADIENT_LINEAR",
      gradientTransform: [[0.71, 0.71, 0], [-0.71, 0.71, 0.5]],
      gradientStops: [
        { position: 0, color: { r: T.brandHi.r, g: T.brandHi.g, b: T.brandHi.b, a: 1 } },
        { position: 0.5, color: { r: T.brand.r, g: T.brand.g, b: T.brand.b, a: 1 } },
        { position: 1, color: { r: T.brandLo.r, g: T.brandLo.g, b: T.brandLo.b, a: 1 } }
      ]
    }];
    f.appendChild(bgGrad);

    // Periodic-table style: atomic number top-left, mass top-right, symbol center, name bottom
    const numT = text("6", { family:"Space Grotesk", style:"Bold", size: size*0.15, color:{r:0.04,g:0.04,b:0.04} });
    numT.x = size*0.12; numT.y = size*0.12; f.appendChild(numT);
    const massT = text("12.01", { family:"Space Grotesk", style:"Medium", size: size*0.11, color:{r:0.04,g:0.04,b:0.04} });
    massT.x = size - massT.width - size*0.12; massT.y = size*0.14; f.appendChild(massT);
    const sym = text("Krv", { family:"Space Grotesk", style:"Bold", size: size*0.42, color:{r:0.04,g:0.04,b:0.04} });
    sym.textAlignHorizontal = "CENTER"; sym.resize(size, sym.height);
    sym.x = 0; sym.y = size*0.32; f.appendChild(sym);
    const nm = text("Carbon", { family:"Space Grotesk", style:"Medium", size: size*0.12, color:{r:0.04,g:0.04,b:0.04} });
    nm.textAlignHorizontal = "CENTER"; nm.resize(size, nm.height);
    nm.x = 0; nm.y = size*0.78; f.appendChild(nm);

    return f;
  }

  // ─── COMPONENT: EYEBROW CHIP ────────────────────────────────────────────
  function eyebrow(label) {
    const f = frame("Eyebrow", {
      layout: "HORIZONTAL", primaryAuto: true, counterAuto: true,
      px: 12, py: 7, gap: 10, align: "CENTER",
      fill: T.brand, fillOpacity: 0.06, stroke: T.brand, strokeOpacity: 0.3,
      radius: 999
    });
    f.appendChild(circle(6, T.brand));
    f.appendChild(text(label, { family:"JetBrains Mono", style:"Medium", size: 11, color: T.brand, tracking: 14, upper: true }));
    return f;
  }

  // ─── COMPONENT: BUTTON ──────────────────────────────────────────────────
  function btn(label, kind = "primary") {
    const isPrimary = kind === "primary";
    const f = frame("Button " + kind, {
      layout: "HORIZONTAL", primaryAuto: true, counterAuto: true,
      px: 26, py: 15, gap: 10, align: "CENTER",
      fill: isPrimary ? T.brand : undefined,
      stroke: isPrimary ? T.brand : T.t1, strokeOpacity: isPrimary ? 1 : 0.14, strokeWeight: 1,
      radius: 10
    });
    f.appendChild(text(label, {
      family:"Inter", style:"SemiBold", size: 14,
      color: isPrimary ? { r: 0.04, g: 0.04, b: 0.05 } : T.t1
    }));
    return f;
  }

  // ─── COMPONENT: SPEC CHIP ───────────────────────────────────────────────
  function specChip(label) {
    const f = frame("Spec", {
      layout: "HORIZONTAL", primaryAuto: true, counterAuto: true,
      px: 10, py: 5, gap: 7, align: "CENTER",
      fill: T.brand, fillOpacity: 0.06, stroke: T.brand, strokeOpacity: 0.3,
      radius: 4
    });
    f.appendChild(circle(5, T.brand));
    f.appendChild(text(label, { family:"JetBrains Mono", style:"Medium", size: 10, color: T.brand, tracking: 8, upper: true }));
    return f;
  }

  // Keep all this globally available
  globalThis.__kervan = { T, LINE, fill, stroke, frame, text, circle, logoMark, eyebrow, btn, specChip };
  globalThis.__kervan.pages = { desktop: desktopPage, mobile: mobilePage };

  figma.notify("Tokens & helpers ready. Building frames…");

  // ─── DESKTOP FRAME ──────────────────────────────────────────────────────
  const { T: DT, fill: df, stroke: ds, frame: dfr, text: dt, circle: dc, logoMark: dlogo, eyebrow: deb, btn: dbtn, specChip: dsc } = globalThis.__kervan;
  const LINE_OP = 0.08, LINE2_OP = 0.14;

  const desktop = dfr("Desktop · 1440", { w: 1440, h: 100, fill: DT.bg0, layout: "VERTICAL", primaryAuto: true, counterAuto: false });
  desktop.paddingTop = 0; desktop.paddingBottom = 0;
  desktop.itemSpacing = 0;
  desktopPage.appendChild(desktop);

  // ─── NAVBAR ────────────────────────────────────────────────
  const nav = dfr("Navbar", {
    w: 1440, h: 68, fill: DT.bg0, fillOpacity: 0.92,
    layout: "HORIZONTAL", counterAuto: false, primaryAuto: false,
    px: 32, py: 0, align: "CENTER", justify: "SPACE_BETWEEN",
    stroke: LINE, strokeOpacity: LINE_OP
  });
  nav.resize(1440, 68);
  // brand lockup
  const brandGroup = dfr("Brand", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, gap:11, align:"CENTER" });
  brandGroup.appendChild(dlogo(34));
  const brandText = dfr("BrandText", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, gap:8, align:"BASELINE" });
  brandText.counterAxisAlignItems = "CENTER";
  const kervT = dt("KERVAN", { family:"Space Grotesk", style:"Bold", size:15, color: DT.t1 });
  const heatT = dt("HEAT", { family:"Space Grotesk", style:"Bold", size:15, color: DT.brand });
  const supT = dt("TR · MFG", { family:"JetBrains Mono", style:"Medium", size:8, color: DT.t3, tracking:12, upper:true });
  [kervT, heatT, supT].forEach(x => brandText.appendChild(x));
  brandGroup.appendChild(brandText);
  nav.appendChild(brandGroup);

  // nav links
  const links = dfr("Links", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, gap:2, align:"CENTER" });
  ["Yedek Parçalar","Uyumluluk","Isıl İşlem","Neden Biz","Katalog","İletişim"].forEach(label => {
    const l = dfr("Link", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, px:14, py:9, radius:8 });
    l.appendChild(dt(label, { family:"Inter", style:"Medium", size:14, color: DT.t2 }));
    links.appendChild(l);
  });
  nav.appendChild(links);

  // right side: lang + cta
  const navRight = dfr("NavRight", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, gap:10, align:"CENTER" });
  const lang = dfr("LangBtn", {
    layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, px:11, py:7, gap:4, align:"CENTER",
    stroke: LINE, strokeOpacity: LINE_OP, radius: 6
  });
  const en = dt("EN", { family:"JetBrains Mono", style:"Medium", size:11, color: DT.brand, tracking:8, upper:true });
  const sl = dt("/", { family:"JetBrains Mono", style:"Regular", size:11, color: DT.t3, tracking:8 });
  const tr = dt("TR", { family:"JetBrains Mono", style:"Regular", size:11, color: DT.t2, tracking:8, upper:true });
  [en, sl, tr].forEach(x => lang.appendChild(x));
  navRight.appendChild(lang);
  navRight.appendChild(dbtn("Teklif Al", "primary"));
  nav.appendChild(navRight);
  desktop.appendChild(nav);

  // ─── HERO ──────────────────────────────────────────────────
  const hero = dfr("Hero", { w: 1440, h: 720, fill: DT.bg0, layout: "HORIZONTAL", counterAuto: false, primaryAuto: false, px: 80, py: 120, gap: 72, align: "CENTER" });
  hero.resize(1440, 720);

  // hero copy
  const heroCopy = dfr("HeroCopy", { layout:"VERTICAL", primaryAuto:true, counterAuto:true, gap:24 });
  heroCopy.layoutGrow = 1; heroCopy.layoutAlign = "STRETCH";
  heroCopy.appendChild(deb("Üretici · Kartepe, Türkiye"));
  const heroTitle = dfr("HeroTitle", { layout:"VERTICAL", primaryAuto:true, counterAuto:true, gap:4 });
  const line1 = dt("Hidrolik Kırıcı", { family:"Space Grotesk", style:"SemiBold", size:64, color: DT.t1, tracking: -3, lineHeight: 102 });
  const line2 = dt("Parçaları.", { family:"Space Grotesk", style:"SemiBold", size:64, color: DT.t1, tracking: -3, lineHeight: 102 });
  const line3 = dt("Doğrudan Fabrikadan.", { family:"Space Grotesk", style:"SemiBold", size:64, color: DT.brand, tracking: -3, lineHeight: 102 });
  [line1, line2, line3].forEach(x => heroTitle.appendChild(x));
  heroCopy.appendChild(heroTitle);

  const heroSub = dt("Furukawa, Rammer, Soosan, Atlas Copco ve 40+ marka için uç, piston, burç, saplama ve tamir takımı yapıyoruz. 42CrMo çelik, HRC 48–52, kendi tesisimizde ısıl işlem. Stoktaysa aynı gün çıkar. Yakın ülkelere 5–10 gün.", {
    family:"Inter", style:"Regular", size:17, color: DT.t2, lineHeight: 160, maxWidth: 560
  });
  heroCopy.appendChild(heroSub);

  const ctas = dfr("CTAs", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, gap:14 });
  ctas.appendChild(dbtn("Teklif Al", "primary"));
  ctas.appendChild(dbtn("Parçaları Gör", "ghost"));
  heroCopy.appendChild(ctas);

  // stats
  const stats = dfr("Stats", { layout:"HORIZONTAL", counterAuto:true, primaryAuto:false, gap:0, align:"CENTER" });
  stats.resize(660, 80);
  stats.counterAxisSizingMode = "AUTO";
  stats.strokes = [ds(LINE, LINE_OP)]; stats.strokeTopWeight = 1; stats.strokeBottomWeight = 0; stats.strokeLeftWeight = 0; stats.strokeRightWeight = 0;
  stats.paddingTop = 28;
  const statItems = [
    ["42CrMo", "Krom-Molibden"],
    ["HRC 48–52", "Sertlik"],
    ["Aynı Gün", "Stok Ürünler"],
    ["40+", "Marka Uyumlu"]
  ];
  statItems.forEach(([v, l], i) => {
    const col = dfr("Stat", { layout:"VERTICAL", primaryAuto:true, counterAuto:true, gap:6 });
    col.layoutGrow = 1; col.layoutAlign = "STRETCH";
    col.paddingRight = 22;
    if (i < 3) { col.strokes = [ds(LINE, LINE_OP)]; col.strokeRightWeight = 1; }
    col.appendChild(dt(v, { family:"Space Grotesk", style:"Bold", size:22, color: DT.t1 }));
    col.appendChild(dt(l, { family:"JetBrains Mono", style:"Medium", size:10, color: DT.t3, tracking:12, upper:true }));
    stats.appendChild(col);
  });
  heroCopy.appendChild(stats);
  hero.appendChild(heroCopy);

  // hero visual — engineering drawing card
  const heroViz = dfr("HeroVisual", {
    w: 540, h: 580, fill: DT.bg1, stroke: LINE, strokeOpacity: LINE2_OP, radius: 20,
    layout: "VERTICAL", primaryAuto: false, counterAuto: false, clip: true
  });
  heroViz.layoutGrow = 0;
  // corner brackets
  const corners = [["TL",16,16,false,false,true,true],["TR",16,508,false,true,true,false],["BL",540,16,true,false,false,true],["BR",540,508,true,true,false,false]];
  // simpler: 4 small squares at corners
  [[16,16],[16,502],[502,16],[502,502]].forEach(([y,x])=>{
    const b = figma.createRectangle();
    b.resize(22, 22); b.fills = []; b.strokes = [ds(DT.brand)]; b.strokeWeight = 2;
    b.x = x; b.y = y;
    heroViz.appendChild(b);
  });
  // title block at top
  const tb = dfr("TitleBlock", { w:400, h:20, layout:"HORIZONTAL", counterAuto:false, primaryAuto:false, justify:"SPACE_BETWEEN", align:"CENTER" });
  tb.resize(400, 20); tb.x = 70; tb.y = 30; tb.fills = [];
  [["DRW KVN-CHI-001", DT.brand], ["MOIL POINT · 42CrMoA", DT.t2], ["REV 02", DT.brand]].forEach(([lbl, color], i) => {
    tb.appendChild(dt(lbl, { family:"JetBrains Mono", style:"Medium", size:9.5, color, tracking:14, upper:true }));
  });
  heroViz.appendChild(tb);

  // chisel drawing (simplified as stacked rectangles)
  const chiHead = figma.createRectangle();
  chiHead.resize(70, 52); chiHead.fills = [df(DT.steel)]; chiHead.strokes = [ds(DT.steelHi)]; chiHead.strokeWeight = 1; chiHead.cornerRadius = 3;
  chiHead.x = 235; chiHead.y = 90; heroViz.appendChild(chiHead);
  const chiCollar = figma.createRectangle();
  chiCollar.resize(100, 22); chiCollar.fills = [df(DT.steel)]; chiCollar.strokes = [ds(DT.steelHi)]; chiCollar.strokeWeight = 1; chiCollar.cornerRadius = 2;
  chiCollar.x = 220; chiCollar.y = 146; heroViz.appendChild(chiCollar);
  const chiBody = figma.createRectangle();
  chiBody.resize(70, 240); chiBody.fills = [df(DT.steel)]; chiBody.strokes = [ds(DT.steelHi)]; chiBody.strokeWeight = 1;
  chiBody.x = 235; chiBody.y = 172; heroViz.appendChild(chiBody);
  // tip (hot gradient triangle approximated as rectangle with orange fill)
  const chiTip = figma.createPolygon();
  chiTip.pointCount = 3;
  chiTip.resize(70, 110); chiTip.rotation = 180;
  chiTip.fills = [{
    type: "GRADIENT_LINEAR",
    gradientTransform: [[1, 0, 0], [0, 1, 0]],
    gradientStops: [
      { position: 0, color: { ...DT.bg1, a: 1 } },
      { position: 0.5, color: { ...DT.brand, a: 1 } },
      { position: 1, color: { ...DT.brandHi, a: 1 } }
    ]
  }];
  chiTip.x = 305; chiTip.y = 522; heroViz.appendChild(chiTip);

  // spec chips at bottom
  const specRow = dfr("Specs", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, gap:8, justify:"CENTER" });
  specRow.x = 120; specRow.y = 510;
  ["42CrMoA","HRC 48–52","Ø 135 mm","L 1420 mm"].forEach(s => specRow.appendChild(dsc(s)));
  heroViz.appendChild(specRow);

  // SKU footer
  const skuRow = dfr("SKURow", { w:400, h:20, layout:"HORIZONTAL", counterAuto:false, primaryAuto:false, justify:"SPACE_BETWEEN" });
  skuRow.resize(400, 20); skuRow.x = 70; skuRow.y = 552; skuRow.fills = [];
  [["SKU  KVN·CHI·0142", DT.t3], ["SCALE  1:8", DT.t3], ["ISO · GPS", DT.t3]].forEach(([s, c]) => {
    skuRow.appendChild(dt(s, { family:"JetBrains Mono", style:"Medium", size:9.5, color: c, tracking:10, upper:true }));
  });
  heroViz.appendChild(skuRow);

  hero.appendChild(heroViz);
  desktop.appendChild(hero);

  figma.notify("Hero done. Building parts grid…");

  // ─── PARTS GRID ────────────────────────────────────────────
  const parts = dfr("Parts", { w: 1440, h: 100, fill: DT.bg0, layout:"VERTICAL", counterAuto:false, primaryAuto:true, px: 80, py: 120, gap: 56, stroke: LINE, strokeOpacity: LINE_OP });
  parts.resize(1440, 100); parts.strokeTopWeight = 1; parts.strokeBottomWeight = 0; parts.strokeLeftWeight = 0; parts.strokeRightWeight = 0;
  // section number
  const secNum1 = dfr("SecNum", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, gap:14, align:"CENTER" });
  secNum1.appendChild(dt("01", { family:"JetBrains Mono", style:"Medium", size:11, color: DT.brand, tracking:16, upper:true }));
  secNum1.appendChild(dt("/ ÜRÜN YELPAZESİ", { family:"JetBrains Mono", style:"Medium", size:11, color: DT.t3, tracking:16, upper:true }));
  parts.appendChild(secNum1);
  // head
  const partsHead = dfr("Head", { layout:"VERTICAL", primaryAuto:true, counterAuto:true, gap:18 });
  partsHead.appendChild(deb("Ne Üretiyoruz"));
  partsHead.appendChild(dt("Her parça. Tek çatı.", { family:"Space Grotesk", style:"SemiBold", size:48, color: DT.t1, tracking:-2.8 }));
  partsHead.appendChild(dt("Dövme, talaş ve ısıl işlemin hepsini burada, Kartepe'de yapıyoruz. Ham çelikten bitmiş parçaya, her şey kendi atölyemizde.", { family:"Inter", style:"Regular", size:17, color: DT.t2, lineHeight:160, maxWidth:640 }));
  parts.appendChild(partsHead);

  // grid wrapper (custom layout: chisel hero spans full, then 2x3 grid)
  const grid = dfr("Grid", { layout:"VERTICAL", counterAuto:false, primaryAuto:true, gap:20 });
  grid.resize(1280, 100);

  // chisel hero card
  const chisel = dfr("Chisels Hero", {
    w: 1280, h: 320, radius: 16,
    fill: DT.bg2, stroke: DT.brand, strokeOpacity: 0.2,
    layout:"HORIZONTAL", counterAuto:false, primaryAuto:false, px: 44, py: 44, gap: 56, align:"CENTER"
  });
  chisel.resize(1280, 320);

  const chiLeft = dfr("ChisLeft", { layout:"VERTICAL", primaryAuto:true, counterAuto:true, gap: 18 });
  chiLeft.layoutGrow = 1; chiLeft.layoutAlign = "STRETCH";
  const chiBadge = dfr("Badge", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, px:11, py:6, fill: DT.brand, fillOpacity:0.1, stroke: DT.brand, strokeOpacity:0.32, radius:4 });
  chiBadge.appendChild(dt("ANA ÜRÜN · 01", { family:"JetBrains Mono", style:"Medium", size:10, color: DT.brand, tracking:14, upper:true }));
  chiLeft.appendChild(chiBadge);
  chiLeft.appendChild(dt("Uçlar", { family:"Space Grotesk", style:"SemiBold", size:44, color: DT.t1, tracking:-2.5 }));
  chiLeft.appendChild(dt("Sivri, düz, kama, küt, konik, geniş. 42CrMoA çelik, kendi fırınlarımızda HRC 48–52'ye sertleştirilir. İstediğiniz boya keseriz.", { family:"Inter", style:"Regular", size:15, color: DT.t2, lineHeight:155, maxWidth:440 }));

  // types 2-col list
  const typesList = dfr("Types", { layout:"VERTICAL", primaryAuto:true, counterAuto:true, gap:4 });
  [["Sivri Uç","Düz"],["Kama","Küt"],["Konik","Geniş"]].forEach(([a, b]) => {
    const row = dfr("Row", { layout:"HORIZONTAL", primaryAuto:false, counterAuto:true, gap:48 });
    row.resize(440, 30); row.paddingTop = 8; row.paddingBottom = 8;
    row.strokes = [ds(LINE, LINE_OP)]; row.strokeTopWeight = 1;
    [a,b].forEach(n => {
      const c = dfr("ChItem", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, gap:10, align:"CENTER" });
      c.appendChild(dc(6, DT.brand));
      c.appendChild(dt(n, { family:"JetBrains Mono", style:"Medium", size:12, color: DT.t1 }));
      row.appendChild(c);
    });
    typesList.appendChild(row);
  });
  chiLeft.appendChild(typesList);
  const specLine = dt("MALZEME  42CrMoA  ·  SERTLİK  HRC 48–52  ·  CNC TORNA", { family:"JetBrains Mono", style:"Medium", size:11, color: DT.t3, tracking:10, upper:true });
  chiLeft.appendChild(specLine);
  chisel.appendChild(chiLeft);

  // chisel visual (smaller drawing)
  const chiViz = dfr("ChiViz", { w:220, h:230, fill: DT.bg1, stroke: LINE, strokeOpacity: LINE_OP, radius:12, layout:"VERTICAL", primaryAuto:false, counterAuto:false });
  chiViz.resize(220, 230);
  const miniChi = figma.createRectangle();
  miniChi.resize(26, 130); miniChi.fills = [df(DT.steel)]; miniChi.strokes = [ds(DT.steelHi)]; miniChi.strokeWeight = 1;
  miniChi.x = 97; miniChi.y = 30; chiViz.appendChild(miniChi);
  const miniTip = figma.createPolygon();
  miniTip.pointCount = 3; miniTip.resize(26, 60); miniTip.rotation = 180;
  miniTip.fills = [df(DT.brand)];
  miniTip.x = 123; miniTip.y = 220; chiViz.appendChild(miniTip);
  chisel.appendChild(chiViz);

  grid.appendChild(chisel);

  // 6 satellite cards — 3-col grid, 2 rows
  const sats = [
    ["Pistonlar", "Spece göre taşlanmış. Binlerce saat çalışır, kafanızı ağrıtmaz.", "42CrMo · HRC 52"],
    ["Burçlar", "Üst ve alt burç, lap yüzey. Dar tolerans — boşluk yok, sallanma yok.", "SERT · LAP"],
    ["Saplamalar", "4340 dövme çelik. Somun ve rondela dahil. Sıkılmaya hazır.", "4340 FORGED"],
    ["Tamir Takımları", "Tam keçe ve aşınma seti. Kırıcı modelini söyle, kiti biz eşleyelim.", "TAM SET"],
    ["Kamalar", "Sertleştirilmiş tutucu kama. Darbeyi yer, takımı tutar.", "INDUCTION · HRC 55"],
    ["Alt Gövdeler", "Dövme, CNC işlenmiş. OEM ölçülerinde, tak ve çalıştır.", "FORGED · CNC"]
  ];
  for (let r = 0; r < 2; r++) {
    const satRow = dfr("SatRow", { layout:"HORIZONTAL", counterAuto:false, primaryAuto:false, gap:20 });
    satRow.resize(1280, 260); satRow.fills = [];
    for (let c = 0; c < 3; c++) {
      const [title, desc, spec] = sats[r*3 + c];
      const card = dfr("Card", {
        w: 413, h: 260, radius: 16,
        fill: DT.bg2, stroke: LINE, strokeOpacity: LINE_OP,
        layout:"VERTICAL", primaryAuto:false, counterAuto:false, px: 28, py: 28, gap:16
      });
      card.resize(413, 260);
      // icon square
      const icon = dfr("Icon", { w:46, h:46, radius:10, fill: DT.brand, fillOpacity:0.12, stroke: DT.brand, strokeOpacity:0.25, layout:"HORIZONTAL", counterAuto:true, primaryAuto:true, align:"CENTER", justify:"CENTER" });
      icon.resize(46, 46);
      icon.appendChild(dt("▸", { family:"Space Grotesk", style:"Bold", size:20, color: DT.brand }));
      card.appendChild(icon);
      card.appendChild(dt(title, { family:"Space Grotesk", style:"SemiBold", size:21, color: DT.t1 }));
      card.appendChild(dt(desc, { family:"Inter", style:"Regular", size:14, color: DT.t2, lineHeight:155, maxWidth:360 }));
      // spacer grows
      const sp = dfr("Sp", {}); sp.fills = []; sp.resize(1,1); sp.layoutGrow = 1; card.appendChild(sp);
      // footer: spec + arrow
      const foot = dfr("CardFoot", { layout:"HORIZONTAL", counterAuto:false, primaryAuto:false, gap:10, align:"CENTER", justify:"SPACE_BETWEEN" });
      foot.resize(360, 30); foot.paddingTop = 16;
      foot.strokes = [ds(LINE, LINE_OP)]; foot.strokeTopWeight = 1;
      foot.appendChild(dt(spec, { family:"JetBrains Mono", style:"Medium", size:10, color: DT.t3, tracking:8, upper:true }));
      const arr = dfr("Arrow", { w:30, h:30, radius:7, stroke: LINE, strokeOpacity: LINE2_OP, layout:"HORIZONTAL", counterAuto:true, primaryAuto:true, align:"CENTER", justify:"CENTER" });
      arr.resize(30, 30);
      arr.appendChild(dt("→", { family:"Inter", style:"Bold", size:14, color: DT.t2 }));
      foot.appendChild(arr);
      card.appendChild(foot);
      satRow.appendChild(card);
    }
    grid.appendChild(satRow);
  }
  parts.appendChild(grid);
  desktop.appendChild(parts);

  figma.notify("Parts done. Building services…");

  // ─── SERVICES ──────────────────────────────────────────────
  const services = dfr("Services", {
    w: 1440, h: 100, fill: DT.bg0, layout:"VERTICAL", counterAuto:false, primaryAuto:true,
    px: 80, py: 120, gap: 56, stroke: LINE, strokeOpacity: LINE_OP
  });
  services.resize(1440, 100); services.strokeTopWeight = 1; services.strokeBottomWeight = 0; services.strokeLeftWeight = 0; services.strokeRightWeight = 0;

  const secNum2 = dfr("SecNum", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, gap:14 });
  secNum2.appendChild(dt("03", { family:"JetBrains Mono", style:"Medium", size:11, color: DT.brand, tracking:16, upper:true }));
  secNum2.appendChild(dt("/ ISIL İŞLEM", { family:"JetBrains Mono", style:"Medium", size:11, color: DT.t3, tracking:16, upper:true }));
  services.appendChild(secNum2);

  // 2-col: facility card + process list
  const svGrid = dfr("SvGrid", { layout:"HORIZONTAL", counterAuto:false, primaryAuto:false, gap:80 });
  svGrid.resize(1280, 520);
  const svLeft = dfr("SvLeft", { layout:"VERTICAL", primaryAuto:true, counterAuto:false, gap: 20 });
  svLeft.resize(560, 520);
  svLeft.appendChild(deb("Isıl İşlem"));
  svLeft.appendChild(dt("Bizim fırınlar.\nBizim proses.", { family:"Space Grotesk", style:"SemiBold", size:44, color: DT.t1, tracking:-2.5, lineHeight:108 }));
  svLeft.appendChild(dt("Gönderdiğimiz her uç ve piston kendi kuyu fırınlarımızdan geçer. Ayrıca dışarıdan da ısıl işlem işi alırız — parçalarınızı getirin, sertleştirelim.", { family:"Inter", style:"Regular", size:16, color: DT.t2, lineHeight:160, maxWidth:480 }));
  // facility card
  const facility = dfr("Facility", {
    w: 560, h: 280, radius: 14, fill: DT.bg2, stroke: LINE, strokeOpacity: LINE_OP,
    layout:"VERTICAL", counterAuto:false, primaryAuto:false, px: 28, py: 28, gap: 14
  });
  facility.resize(560, 280);
  // orange top bar accent
  const accent = figma.createRectangle();
  accent.resize(500, 2); accent.fills = [df(DT.brand)]; accent.x = 28; accent.y = -1;
  facility.appendChild(accent);
  facility.appendChild(dt("KRV · FACILITY", { family:"JetBrains Mono", style:"Medium", size:10, color: DT.brand, tracking:14, upper:true }));
  facility.appendChild(dt("Kartepe, Kocaeli", { family:"Space Grotesk", style:"SemiBold", size:21, color: DT.t1 }));
  facility.appendChild(dt("Kontrollü atmosfer kuyu fırınlar. Yağ ve polimer söndürme. Tesiste HRC/HV ölçüm.", { family:"Inter", style:"Regular", size:14, color: DT.t2, lineHeight:155 }));
  // 2x2 spec grid
  const fSpecs = dfr("FSpecs", { layout:"VERTICAL", primaryAuto:true, counterAuto:false, gap:18 });
  fSpecs.resize(504, 120); fSpecs.paddingTop = 16;
  fSpecs.strokes = [ds(LINE, LINE_OP)]; fSpecs.strokeTopWeight = 1;
  [[["1050 °C","MAKS SICAKLIK"],["Ø 1200 mm","KUYU ÇAPI"]],[["Oil · Polymer","SÖNDÜRME"],["HRC · HV","TEST"]]].forEach(row => {
    const fr = dfr("Row", { layout:"HORIZONTAL", primaryAuto:false, counterAuto:true, gap:14 });
    fr.resize(504, 50);
    row.forEach(([v, l]) => {
      const col = dfr("FSCol", { layout:"VERTICAL", primaryAuto:true, counterAuto:true, gap:5 });
      col.layoutGrow = 1; col.layoutAlign = "STRETCH";
      col.appendChild(dt(v, { family:"Space Grotesk", style:"Bold", size:19, color: DT.t1, tracking:-1 }));
      col.appendChild(dt(l, { family:"JetBrains Mono", style:"Medium", size:9, color: DT.t3, tracking:12, upper:true }));
      fr.appendChild(col);
    });
    fSpecs.appendChild(fr);
  });
  facility.appendChild(fSpecs);
  svLeft.appendChild(facility);
  svGrid.appendChild(svLeft);

  // process list (right)
  const procList = dfr("ProcList", { layout:"VERTICAL", primaryAuto:true, counterAuto:false, gap:0 });
  procList.resize(640, 100);
  procList.strokes = [ds(LINE, LINE_OP)]; procList.strokeTopWeight = 1;
  const procs = [
    ["01","Karbonlama","850–950°C'de yüzey sertleştirme. Dışı sert, içi tok.","850–950 °C"],
    ["02","Söndürme","Yağ veya polimer banyo. Doğru martensit yapısı için kontrollü soğutma.","OIL · POLYMER"],
    ["03","Meneviş","Kırılganlığı alır, gerçek tokluğu verir.","150–650 °C"],
    ["04","Normalizasyon","Taneyi düzeltir. Parçanın her yerinde aynı sertlik.","HAVA"],
    ["05","Gerilim Giderme","Kaynak veya ağır talaştan sonra. İç gerilimi çatlak olmadan alır.","600–650 °C"],
    ["06","Sertlik Testi","Her parti test edilir. HRC ve HV. İstisna yok.","HRC · HV"]
  ];
  procs.forEach(([n, title, desc, temp]) => {
    const pi = dfr("ProcItem", {
      layout:"HORIZONTAL", primaryAuto:false, counterAuto:false, px: 0, py: 26, gap: 26, align:"CENTER",
      stroke: LINE, strokeOpacity: LINE_OP
    });
    pi.resize(640, 90); pi.strokeTopWeight = 0; pi.strokeBottomWeight = 1; pi.strokeLeftWeight = 0; pi.strokeRightWeight = 0;
    pi.appendChild(dt(n, { family:"JetBrains Mono", style:"Medium", size:11, color: DT.t3, tracking:10 }));
    const body = dfr("Body", { layout:"VERTICAL", primaryAuto:true, counterAuto:true, gap:5 });
    body.layoutGrow = 1; body.layoutAlign = "STRETCH";
    body.appendChild(dt(title, { family:"Space Grotesk", style:"SemiBold", size:19, color: DT.t1 }));
    body.appendChild(dt(desc, { family:"Inter", style:"Regular", size:13.5, color: DT.t2, lineHeight:150, maxWidth:440 }));
    pi.appendChild(body);
    const tempChip = dfr("TempChip", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, px:11, py:6, fill: DT.brand, fillOpacity:0.06, stroke: DT.brand, strokeOpacity:0.3, radius:4 });
    tempChip.appendChild(dt(temp, { family:"JetBrains Mono", style:"Medium", size:10, color: DT.brand, tracking:8, upper:true }));
    pi.appendChild(tempChip);
    procList.appendChild(pi);
  });
  svGrid.appendChild(procList);
  services.appendChild(svGrid);
  desktop.appendChild(services);

  // ─── SOCIAL / CTA ROW ──────────────────────────────────────
  const socRow = dfr("SocialRow", {
    w: 1440, h: 200, fill: DT.bg0, layout:"HORIZONTAL", counterAuto:false, primaryAuto:false,
    px: 80, py: 60, gap: 20, align:"CENTER", justify:"CENTER"
  });
  socRow.resize(1440, 200);
  // WhatsApp button
  const wa = dfr("WhatsApp", {
    layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, px:28, py:16, gap:12, align:"CENTER",
    fill: DT.wa, radius: 12
  });
  wa.appendChild(dt("💬", { family:"Inter", style:"Regular", size:18 }));
  wa.appendChild(dt("WhatsApp +90 531 669 37 34", { family:"Inter", style:"SemiBold", size:15, color:{r:1,g:1,b:1} }));
  socRow.appendChild(wa);
  // Instagram button
  const ig = dfr("Instagram", {
    layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, px:28, py:16, gap:12, align:"CENTER",
    radius: 12
  });
  ig.fills = [{ type:"GRADIENT_LINEAR", gradientTransform:[[1,0,0],[0,1,0]], gradientStops:[{position:0,color:{...DT.ig2,a:1}},{position:1,color:{...DT.ig1,a:1}}]}];
  ig.appendChild(dt("📷", { family:"Inter", style:"Regular", size:18 }));
  ig.appendChild(dt("Instagram @kervanmakina", { family:"Inter", style:"SemiBold", size:15, color:{r:1,g:1,b:1} }));
  socRow.appendChild(ig);
  desktop.appendChild(socRow);

  // ─── FOOTER ────────────────────────────────────────────────
  const foot = dfr("Footer", {
    w: 1440, h: 100, fill: DT.bg0, layout:"VERTICAL", counterAuto:false, primaryAuto:true,
    px: 80, py: 80, gap: 48, stroke: LINE, strokeOpacity: LINE_OP
  });
  foot.resize(1440, 100); foot.strokeTopWeight = 1; foot.strokeBottomWeight = 0; foot.strokeLeftWeight = 0; foot.strokeRightWeight = 0;

  const fCols = dfr("FCols", { layout:"HORIZONTAL", counterAuto:false, primaryAuto:false, gap:48 });
  fCols.resize(1280, 280);
  // col 1: brand
  const fc1 = dfr("Col1", { layout:"VERTICAL", primaryAuto:true, counterAuto:true, gap:20 });
  fc1.resize(480, 280);
  fc1.appendChild(dt("FABRİKA", { family:"JetBrains Mono", style:"Medium", size:10, color: DT.brand, tracking:14, upper:true }));
  const fBrand = dfr("FBrand", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, gap:12, align:"CENTER" });
  fBrand.appendChild(dlogo(36));
  const fBrandT = dfr("FBrandT", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, gap:2 });
  fBrandT.appendChild(dt("KERVAN", { family:"Space Grotesk", style:"Bold", size:17, color: DT.t1 }));
  fBrandT.appendChild(dt("HEAT", { family:"Space Grotesk", style:"Bold", size:17, color: DT.brand }));
  fBrand.appendChild(fBrandT);
  fc1.appendChild(fBrand);
  fc1.appendChild(dt("Kartepe'de hidrolik kırıcı yedek parçası üretiyoruz. Uç, piston, burç, saplama. 42CrMo çelik, CNC işleme, kendi fırınlarımızda ısıl işlem. Dünyaya göndeririz.", { family:"Inter", style:"Regular", size:14, color: DT.t2, lineHeight:165, maxWidth:380 }));
  fCols.appendChild(fc1);

  // col 2: contact
  const fc2 = dfr("Col2", { layout:"VERTICAL", primaryAuto:true, counterAuto:true, gap:14 });
  fc2.resize(380, 280);
  fc2.appendChild(dt("İLETİŞİM", { family:"JetBrains Mono", style:"Medium", size:10, color: DT.brand, tracking:14, upper:true }));
  [["FABRİKA","Sadun Atığ Cad. No: 112/A\nKartepe / Kocaeli, Türkiye"],["TELEFON","+90 531 669 37 34"],["E-POSTA","info@kervanheat.com"]].forEach(([l, v]) => {
    const item = dfr("Item", { layout:"VERTICAL", primaryAuto:true, counterAuto:true, gap:3 });
    item.paddingTop = 6; item.paddingBottom = 6;
    item.appendChild(dt(l, { family:"JetBrains Mono", style:"Medium", size:9, color: DT.t3, tracking:14, upper:true }));
    item.appendChild(dt(v, { family:"Inter", style:"Medium", size:14, color: DT.t1, lineHeight:150 }));
    fc2.appendChild(item);
  });
  fCols.appendChild(fc2);

  // col 3: hours
  const fc3 = dfr("Col3", { layout:"VERTICAL", primaryAuto:true, counterAuto:true, gap:14 });
  fc3.resize(380, 280);
  fc3.appendChild(dt("SAATLER · SERVİS", { family:"JetBrains Mono", style:"Medium", size:10, color: DT.brand, tracking:14, upper:true }));
  [["AÇIK","Pzt – Cmt\n08:00 – 18:00"],["KARGO","TR: aynı gün (stok)\nYakın ülkeler: 5–10 gün"],["TEKLİF","24 saat içinde"]].forEach(([l, v]) => {
    const item = dfr("Item", { layout:"VERTICAL", primaryAuto:true, counterAuto:true, gap:3 });
    item.paddingTop = 6; item.paddingBottom = 6;
    item.appendChild(dt(l, { family:"JetBrains Mono", style:"Medium", size:9, color: DT.t3, tracking:14, upper:true }));
    item.appendChild(dt(v, { family:"Inter", style:"Medium", size:14, color: DT.t1, lineHeight:150 }));
    fc3.appendChild(item);
  });
  fCols.appendChild(fc3);
  foot.appendChild(fCols);

  // tagline strip
  const tagline = dfr("Tagline", { w: 1280, h: 48, layout:"HORIZONTAL", counterAuto:false, primaryAuto:false, justify:"CENTER", align:"CENTER" });
  tagline.resize(1280, 48); tagline.fills = [];
  tagline.strokes = [ds(LINE, LINE_OP)]; tagline.strokeTopWeight = 1; tagline.paddingTop = 22;
  tagline.appendChild(dt("TÜRKİYE'DE ÜRETİLİR  ·  TESİSTE ISIL İŞLEM  ·  DÜNYAYA GÖNDERİLİR", { family:"JetBrains Mono", style:"Medium", size:11, color: DT.t2, tracking:12, upper:true }));
  foot.appendChild(tagline);

  // copyright
  const copy = dfr("Copy", { w: 1280, h: 30, layout:"HORIZONTAL", counterAuto:false, primaryAuto:false, justify:"SPACE_BETWEEN", align:"CENTER" });
  copy.resize(1280, 30); copy.fills = []; copy.paddingTop = 22;
  copy.strokes = [ds(LINE, LINE_OP)]; copy.strokeTopWeight = 1;
  copy.appendChild(dt("© 2026  KERVAN ISIL İŞLEM LTD. ŞTİ.  ·  TÜM HAKLARI SAKLIDIR.", { family:"JetBrains Mono", style:"Medium", size:10, color: DT.t3, tracking:10, upper:true }));
  copy.appendChild(dt("KERVANHEAT.COM", { family:"JetBrains Mono", style:"Medium", size:10, color: DT.t3, tracking:10, upper:true }));
  foot.appendChild(copy);
  desktop.appendChild(foot);

  figma.notify("Desktop done! Building mobile…");

  // ─── MOBILE FRAME ───────────────────────────────────────────
  figma.currentPage = mobilePage;

  const mobile = dfr("Mobile · 375", { w: 375, h: 100, fill: DT.bg0, layout:"VERTICAL", counterAuto:false, primaryAuto:true });
  mobile.itemSpacing = 0;
  mobilePage.appendChild(mobile);

  // mobile nav
  const mnav = dfr("MNav", { w:375, h:60, fill: DT.bg0, fillOpacity:0.92, layout:"HORIZONTAL", counterAuto:false, primaryAuto:false, px:20, py:0, align:"CENTER", justify:"SPACE_BETWEEN", stroke: LINE, strokeOpacity: LINE_OP });
  mnav.resize(375, 60); mnav.strokeTopWeight = 0; mnav.strokeBottomWeight = 1;
  const mbrand = dfr("MBrand", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, gap:10, align:"CENTER" });
  mbrand.appendChild(dlogo(32));
  const mbt = dfr("MBT", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, gap:1 });
  mbt.appendChild(dt("KERVAN", { family:"Space Grotesk", style:"Bold", size:14, color: DT.t1 }));
  mbt.appendChild(dt("HEAT", { family:"Space Grotesk", style:"Bold", size:14, color: DT.brand }));
  mbrand.appendChild(mbt);
  mnav.appendChild(mbrand);
  // hamburger
  const burger = dfr("Burger", { w:40, h:40, radius:8, layout:"VERTICAL", primaryAuto:true, counterAuto:true, gap:4, align:"CENTER", justify:"CENTER" });
  burger.resize(40, 40);
  for (let i = 0; i < 3; i++) {
    const bar = figma.createRectangle();
    bar.resize(18, 1.5); bar.fills = [df(DT.t1)];
    burger.appendChild(bar);
  }
  mnav.appendChild(burger);
  mobile.appendChild(mnav);

  // mobile hero
  const mhero = dfr("MHero", { w:375, h:100, fill: DT.bg0, layout:"VERTICAL", primaryAuto:true, counterAuto:false, px:20, py:56, gap:22 });
  mhero.appendChild(deb("Üretici · Kartepe"));
  const mTitle = dfr("MTitle", { layout:"VERTICAL", primaryAuto:true, counterAuto:true, gap:2 });
  mTitle.appendChild(dt("Hidrolik Kırıcı", { family:"Space Grotesk", style:"SemiBold", size:38, color: DT.t1, tracking:-2.5, lineHeight:102 }));
  mTitle.appendChild(dt("Parçaları.", { family:"Space Grotesk", style:"SemiBold", size:38, color: DT.t1, tracking:-2.5, lineHeight:102 }));
  mTitle.appendChild(dt("Doğrudan Fabrikadan.", { family:"Space Grotesk", style:"SemiBold", size:38, color: DT.brand, tracking:-2.5, lineHeight:102 }));
  mhero.appendChild(mTitle);
  mhero.appendChild(dt("Furukawa, Rammer, Soosan, Atlas Copco ve 40+ marka için uç, piston, burç, saplama. 42CrMo çelik, HRC 48–52. Stok aynı gün, Avrupa 5–10 gün.", { family:"Inter", style:"Regular", size:15, color: DT.t2, lineHeight:160, maxWidth:335 }));
  const mcta = dfr("MCTA", { layout:"VERTICAL", primaryAuto:true, counterAuto:false, gap:10 });
  mcta.resize(335, 100);
  [dbtn("Teklif Al","primary"), dbtn("Parçaları Gör","ghost")].forEach(b => { b.layoutAlign = "STRETCH"; b.primaryAxisAlignItems = "CENTER"; mcta.appendChild(b); });
  mhero.appendChild(mcta);
  // mobile stats 2x2
  const mstats = dfr("MStats", { layout:"VERTICAL", primaryAuto:true, counterAuto:false, gap:18 });
  mstats.resize(335, 120); mstats.paddingTop = 24; mstats.strokes = [ds(LINE, LINE_OP)]; mstats.strokeTopWeight = 1;
  [[["42CrMo","Krom-Molibden"],["HRC 48–52","Sertlik"]],[["Aynı Gün","Stok"],["40+","Marka"]]].forEach(pair => {
    const rr = dfr("Row", { layout:"HORIZONTAL", primaryAuto:false, counterAuto:true, gap:14 });
    rr.resize(335, 50);
    pair.forEach(([v, l]) => {
      const c = dfr("St", { layout:"VERTICAL", primaryAuto:true, counterAuto:true, gap:4 });
      c.layoutGrow = 1; c.layoutAlign = "STRETCH";
      c.appendChild(dt(v, { family:"Space Grotesk", style:"Bold", size:19, color: DT.t1 }));
      c.appendChild(dt(l, { family:"JetBrains Mono", style:"Medium", size:10, color: DT.t3, tracking:12, upper:true }));
      rr.appendChild(c);
    });
    mstats.appendChild(rr);
  });
  mhero.appendChild(mstats);
  mobile.appendChild(mhero);

  // mobile parts (stacked)
  const mparts = dfr("MParts", { w:375, h:100, fill: DT.bg0, layout:"VERTICAL", primaryAuto:true, counterAuto:false, px:20, py:56, gap:24, stroke: LINE, strokeOpacity: LINE_OP });
  mparts.strokeTopWeight = 1; mparts.strokeBottomWeight = 0; mparts.strokeLeftWeight = 0; mparts.strokeRightWeight = 0;
  mparts.appendChild(deb("Ürün Yelpazesi"));
  mparts.appendChild(dt("Her parça. Tek çatı.", { family:"Space Grotesk", style:"SemiBold", size:30, color: DT.t1, tracking:-1.8 }));
  mparts.appendChild(dt("Dövme, talaş ve ısıl işlemin hepsini Kartepe'de yapıyoruz.", { family:"Inter", style:"Regular", size:14, color: DT.t2, lineHeight:160, maxWidth:335 }));
  // stacked cards (chisel + 6)
  const allParts = [
    ["Uçlar","Sivri, düz, kama, küt, konik, geniş. 42CrMoA çelik, HRC 48–52.","42CrMoA · HRC 48–52",true],
    ["Pistonlar","Spece göre taşlanmış. Binlerce saat çalışır.","42CrMo · HRC 52"],
    ["Burçlar","Üst ve alt burç, lap yüzey. Dar tolerans.","SERT · LAP"],
    ["Saplamalar","4340 dövme çelik. Somun ve rondela dahil.","4340 FORGED"],
    ["Tamir Takımları","Tam keçe ve aşınma seti.","TAM SET"],
    ["Kamalar","Sertleştirilmiş tutucu kama.","INDUCTION · HRC 55"],
    ["Alt Gövdeler","Dövme, CNC işlenmiş. OEM ölçülerinde.","FORGED · CNC"]
  ];
  allParts.forEach(([title, desc, spec, hero]) => {
    const mc = dfr("MCard", {
      w: 335, h: 100, radius: 14,
      fill: DT.bg2, stroke: hero ? DT.brand : LINE, strokeOpacity: hero ? 0.2 : LINE_OP,
      layout:"VERTICAL", primaryAuto:true, counterAuto:false, px:22, py:22, gap:12
    });
    mc.resize(335, 100);
    if (hero) {
      const badge = dfr("Badge", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, px:9, py:5, fill: DT.brand, fillOpacity:0.1, stroke: DT.brand, strokeOpacity:0.32, radius:4 });
      badge.appendChild(dt("ANA ÜRÜN · 01", { family:"JetBrains Mono", style:"Medium", size:9, color: DT.brand, tracking:14, upper:true }));
      mc.appendChild(badge);
    } else {
      const icon = dfr("MIcon", { w:40, h:40, radius:8, fill: DT.brand, fillOpacity:0.12, stroke: DT.brand, strokeOpacity:0.25, layout:"HORIZONTAL", counterAuto:true, primaryAuto:true, align:"CENTER", justify:"CENTER" });
      icon.resize(40, 40);
      icon.appendChild(dt("▸", { family:"Space Grotesk", style:"Bold", size:18, color: DT.brand }));
      mc.appendChild(icon);
    }
    mc.appendChild(dt(title, { family:"Space Grotesk", style:"SemiBold", size: hero ? 28 : 19, color: DT.t1 }));
    mc.appendChild(dt(desc, { family:"Inter", style:"Regular", size:13.5, color: DT.t2, lineHeight:155, maxWidth:291 }));
    // footer
    const mf = dfr("MF", { layout:"HORIZONTAL", primaryAuto:false, counterAuto:false, gap:10, align:"CENTER", justify:"SPACE_BETWEEN" });
    mf.resize(291, 30); mf.paddingTop = 12; mf.strokes = [ds(LINE, LINE_OP)]; mf.strokeTopWeight = 1;
    mf.appendChild(dt(spec, { family:"JetBrains Mono", style:"Medium", size:10, color: DT.t3, tracking:8, upper:true }));
    const arr = dfr("A", { w:26, h:26, radius:6, stroke: LINE, strokeOpacity: LINE2_OP, layout:"HORIZONTAL", counterAuto:true, primaryAuto:true, align:"CENTER", justify:"CENTER" });
    arr.resize(26, 26);
    arr.appendChild(dt("→", { family:"Inter", style:"Bold", size:13, color: DT.t2 }));
    mf.appendChild(arr);
    mc.appendChild(mf);
    mparts.appendChild(mc);
  });
  mobile.appendChild(mparts);

  // mobile services (compact)
  const msvc = dfr("MSvc", { w:375, h:100, fill: DT.bg0, layout:"VERTICAL", primaryAuto:true, counterAuto:false, px:20, py:56, gap:20, stroke: LINE, strokeOpacity: LINE_OP });
  msvc.strokeTopWeight = 1; msvc.strokeBottomWeight = 0; msvc.strokeLeftWeight = 0; msvc.strokeRightWeight = 0;
  msvc.appendChild(deb("Isıl İşlem"));
  msvc.appendChild(dt("Bizim fırınlar. Bizim proses.", { family:"Space Grotesk", style:"SemiBold", size:28, color: DT.t1, tracking:-1.5, lineHeight:108 }));
  msvc.appendChild(dt("Gönderdiğimiz her uç ve piston kendi kuyu fırınlarımızdan geçer.", { family:"Inter", style:"Regular", size:14, color: DT.t2, lineHeight:155, maxWidth:335 }));
  // compact process list
  procs.forEach(([n, title, desc, temp]) => {
    const pi = dfr("MPI", { layout:"VERTICAL", primaryAuto:true, counterAuto:false, gap:6, stroke: LINE, strokeOpacity: LINE_OP });
    pi.resize(335, 100); pi.paddingTop = 18; pi.paddingBottom = 18; pi.strokeTopWeight = 1; pi.strokeBottomWeight = 0;
    const r1 = dfr("R1", { layout:"HORIZONTAL", primaryAuto:false, counterAuto:true, gap:12, align:"CENTER", justify:"SPACE_BETWEEN" });
    r1.resize(335, 24);
    const l = dfr("L", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, gap:12, align:"CENTER" });
    l.appendChild(dt(n, { family:"JetBrains Mono", style:"Medium", size:10, color: DT.brand, tracking:10 }));
    l.appendChild(dt(title, { family:"Space Grotesk", style:"SemiBold", size:17, color: DT.t1 }));
    r1.appendChild(l);
    const tc = dfr("TC", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, px:9, py:4, fill: DT.brand, fillOpacity:0.06, stroke: DT.brand, strokeOpacity:0.3, radius:4 });
    tc.appendChild(dt(temp, { family:"JetBrains Mono", style:"Medium", size:9, color: DT.brand, tracking:8, upper:true }));
    r1.appendChild(tc);
    pi.appendChild(r1);
    pi.appendChild(dt(desc, { family:"Inter", style:"Regular", size:12.5, color: DT.t2, lineHeight:150, maxWidth:335 }));
    msvc.appendChild(pi);
  });
  mobile.appendChild(msvc);

  // mobile social
  const msoc = dfr("MSoc", { w:375, h:100, fill: DT.bg0, layout:"VERTICAL", primaryAuto:true, counterAuto:false, px:20, py:40, gap:12 });
  [["WhatsApp +90 531 669 37 34", DT.wa, "💬"], ["Instagram @kervanmakina", DT.ig1, "📷"]].forEach(([label, c, icon]) => {
    const b = dfr("SocBtn", { layout:"HORIZONTAL", primaryAuto:false, counterAuto:false, gap:12, align:"CENTER", justify:"CENTER", px:20, py:16, fill: c, radius:12 });
    b.resize(335, 54);
    b.appendChild(dt(icon, { family:"Inter", style:"Regular", size:18 }));
    b.appendChild(dt(label, { family:"Inter", style:"SemiBold", size:15, color:{r:1,g:1,b:1} }));
    msoc.appendChild(b);
  });
  mobile.appendChild(msoc);

  // mobile footer
  const mfoot = dfr("MFoot", { w:375, h:100, fill: DT.bg0, layout:"VERTICAL", primaryAuto:true, counterAuto:false, px:20, py:48, gap:28, stroke: LINE, strokeOpacity: LINE_OP });
  mfoot.strokeTopWeight = 1; mfoot.strokeBottomWeight = 0; mfoot.strokeLeftWeight = 0; mfoot.strokeRightWeight = 0;
  const mfb = dfr("MFB", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, gap:12, align:"CENTER" });
  mfb.appendChild(dlogo(36));
  const mfbt = dfr("MFBT", { layout:"HORIZONTAL", primaryAuto:true, counterAuto:true, gap:2 });
  mfbt.appendChild(dt("KERVAN", { family:"Space Grotesk", style:"Bold", size:16, color: DT.t1 }));
  mfbt.appendChild(dt("HEAT", { family:"Space Grotesk", style:"Bold", size:16, color: DT.brand }));
  mfb.appendChild(mfbt);
  mfoot.appendChild(mfb);
  mfoot.appendChild(dt("Sadun Atığ Cad. No: 112/A\nKartepe / Kocaeli, Türkiye\ninfo@kervanheat.com", { family:"Inter", style:"Medium", size:13, color: DT.t2, lineHeight:160 }));
  mfoot.appendChild(dt("© 2026  KERVAN ISIL İŞLEM LTD. ŞTİ.", { family:"JetBrains Mono", style:"Medium", size:9, color: DT.t3, tracking:10, upper:true }));
  mobile.appendChild(mfoot);

  figma.notify("✓ Design done! Check Desktop & Mobile pages.", { timeout: 4000 });
  figma.viewport.scrollAndZoomIntoView([desktop]);
  figma.closePlugin("Kervan Heat design created ✓");
})();
