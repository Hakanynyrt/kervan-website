/* global React */
// useState/useEffect/useRef come from dict.jsx which is loaded before this file.

// ─── Typewriter ──────────────────────────────────────────────
function useTypewriter(text, speed = 50, startDelay = 300) {
  const [out, setOut] = useState('');
  useEffect(() => {
    setOut('');
    let i = 0;
    const start = setTimeout(() => {
      const t = setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) clearInterval(t);
      }, speed);
    }, startDelay);
    return () => clearTimeout(start);
  }, [text, speed, startDelay]);
  return out;
}

// ─── Hero drawing: chisel with live dimensions ──────────────
function HeroDrawing({ t }) {
  const [angle, setAngle] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const id = setInterval(() => setAngle(a => a + 0.6), 60);
    return () => clearInterval(id);
  }, []);
  // gentle hover-follow
  const [off, setOff] = useState({ x: 0, y: 0 });
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) / r.width;
    const y = (e.clientY - r.top - r.height / 2) / r.height;
    setOff({ x: x * 8, y: y * 8 });
  };
  return (
    <div className="hero__drawing" ref={ref} onMouseMove={onMove} onMouseLeave={() => setOff({x:0,y:0})}>
      <div className="hero__drawing__title">
        <span><b>●</b> {t.drawA} · {t.drawB}</span>
        <span>{t.drawD}</span>
      </div>
      <div className="hero__drawing__svg" style={{ transform: `translate(${off.x}px, ${off.y}px)`, transition:'transform .25s ease-out' }}>
        <svg viewBox="0 0 400 400" fill="none" stroke="currentColor">
          <defs>
            <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(232,120,26,0.28)" strokeWidth="1"/>
            </pattern>
            <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2A2F3A"/>
              <stop offset="0.5" stopColor="#3B424F"/>
              <stop offset="1" stopColor="#1A1E26"/>
            </linearGradient>
          </defs>

          {/* CHISEL */}
          <g transform="translate(200,200)">
            <g transform={`rotate(${Math.sin(angle*0.02)*2})`}>
              {/* shank body */}
              <rect x="-22" y="-130" width="44" height="200" fill="url(#steel)" stroke="#6B7280" strokeWidth="1"/>
              {/* flutes */}
              <rect x="-22" y="-40" width="44" height="4" fill="rgba(0,0,0,0.45)"/>
              <rect x="-22" y="-20" width="44" height="4" fill="rgba(0,0,0,0.45)"/>
              <rect x="-22" y="0" width="44" height="4" fill="rgba(0,0,0,0.45)"/>
              {/* tapered tip */}
              <polygon points="-22,70 22,70 14,140 -14,140" fill="url(#steel)" stroke="#6B7280" strokeWidth="1"/>
              <polygon points="-14,140 14,140 0,160" fill="url(#steel)" stroke="#E8781A" strokeWidth="1"/>
              {/* tip heat */}
              <polygon points="-14,140 14,140 0,160" fill="url(#hatch)"/>
              {/* highlight */}
              <rect x="-18" y="-128" width="4" height="196" fill="rgba(255,255,255,0.08)"/>
            </g>
          </g>

          {/* DIMENSIONS — top width Ø80 */}
          <g stroke="#E8781A" strokeWidth="1">
            <line x1="178" y1="40" x2="178" y2="68" />
            <line x1="222" y1="40" x2="222" y2="68" />
            <line x1="178" y1="50" x2="222" y2="50" />
            <polygon points="178,50 184,47 184,53" fill="#E8781A"/>
            <polygon points="222,50 216,47 216,53" fill="#E8781A"/>
          </g>
          <text x="200" y="38" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#E8781A" letterSpacing="1">Ø 80</text>

          {/* Length 1650 — left */}
          <g stroke="#E8781A" strokeWidth="1">
            <line x1="60" y1="70" x2="88" y2="70" />
            <line x1="60" y1="360" x2="88" y2="360" />
            <line x1="74" y1="70" x2="74" y2="360" />
            <polygon points="74,70 71,76 77,76" fill="#E8781A"/>
            <polygon points="74,360 71,354 77,354" fill="#E8781A"/>
          </g>
          <text x="54" y="215" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#E8781A" letterSpacing="1" transform="rotate(-90, 54, 215)">1650 mm</text>

          {/* Tip detail bubble */}
          <circle cx="200" cy="360" r="34" fill="none" stroke="#E8781A" strokeDasharray="3 3" strokeWidth="1"/>
          <line x1="214" y1="350" x2="320" y2="310" stroke="#E8781A" strokeWidth="1"/>
          <text x="324" y="308" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#E8781A" letterSpacing="1">DETAIL A</text>
          <text x="324" y="322" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#A8ADB8" letterSpacing="1">ISIL İŞLEMLİ</text>

          {/* Center line */}
          <line x1="200" y1="20" x2="200" y2="390" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" strokeDasharray="8 4 2 4"/>

          {/* Rulers */}
          <g stroke="rgba(255,255,255,0.2)" strokeWidth="0.5">
            {[...Array(18)].map((_, i) => (
              <line key={i} x1={20 + i*20} y1="388" x2={20 + i*20} y2={i % 5 === 0 ? 380 : 384}/>
            ))}
          </g>
        </svg>
      </div>
      <div className="hero__drawing__bot">
        <span>{t.drawC}</span>
        <span>FORGED · HEAT-TREATED</span>
      </div>
    </div>
  );
}

// ─── Part spec-sheet card ─────────────────────────────────────
function PartDrawing({ kind }) {
  if (kind === 'CHS-42') return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor">
      <rect x="86" y="20" width="28" height="120" strokeWidth="1.5"/>
      <rect x="86" y="55" width="28" height="3" fill="currentColor"/>
      <rect x="86" y="75" width="28" height="3" fill="currentColor"/>
      <rect x="86" y="95" width="28" height="3" fill="currentColor"/>
      <polygon points="86,140 114,140 106,175 94,175" strokeWidth="1.5"/>
      <polygon points="94,175 106,175 100,190" strokeWidth="1.5" fill="currentColor" fillOpacity="0.3"/>
      <line x1="70" y1="20" x2="75" y2="20" strokeDasharray="2 2"/>
      <line x1="70" y1="190" x2="75" y2="190" strokeDasharray="2 2"/>
    </svg>
  );
  if (kind === 'PST-17') return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor">
      <rect x="40" y="80" width="120" height="40" strokeWidth="1.5"/>
      <rect x="40" y="85" width="120" height="3" fill="currentColor"/>
      <rect x="40" y="92" width="120" height="3" fill="currentColor"/>
      <rect x="40" y="112" width="120" height="3" fill="currentColor"/>
      <rect x="30" y="75" width="10" height="50" strokeWidth="1.5"/>
      <rect x="160" y="75" width="10" height="50" strokeWidth="1.5"/>
      <line x1="30" y1="100" x2="170" y2="100" strokeDasharray="4 3"/>
    </svg>
  );
  if (kind === 'BSH-09') return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor">
      <circle cx="100" cy="100" r="60" strokeWidth="1.5"/>
      <circle cx="100" cy="100" r="35" strokeWidth="1.5"/>
      <circle cx="100" cy="100" r="1.5" fill="currentColor"/>
      <line x1="100" y1="30" x2="100" y2="40" strokeDasharray="2 2"/>
      <line x1="100" y1="160" x2="100" y2="170" strokeDasharray="2 2"/>
      <line x1="30" y1="100" x2="40" y2="100" strokeDasharray="2 2"/>
      <line x1="160" y1="100" x2="170" y2="100" strokeDasharray="2 2"/>
    </svg>
  );
  if (kind === 'BLT-23') return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor">
      <polygon points="70,60 130,60 140,80 130,100 70,100 60,80" strokeWidth="1.5"/>
      <rect x="88" y="100" width="24" height="80" strokeWidth="1.5"/>
      {[0,1,2,3,4,5,6,7,8,9,10].map(i => (
        <line key={i} x1="88" y1={108 + i*7} x2="112" y2={108 + i*7} strokeWidth="1"/>
      ))}
    </svg>
  );
  if (kind === 'HED-11') return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor">
      <path d="M 50 70 L 150 70 L 160 100 L 150 130 L 50 130 L 40 100 Z" strokeWidth="1.5"/>
      <circle cx="100" cy="100" r="16" strokeWidth="1.5"/>
      <circle cx="70" cy="100" r="4" strokeWidth="1"/>
      <circle cx="130" cy="100" r="4" strokeWidth="1"/>
      <line x1="40" y1="100" x2="45" y2="100" strokeDasharray="2 2"/>
      <line x1="155" y1="100" x2="160" y2="100" strokeDasharray="2 2"/>
    </svg>
  );
  // KIT-00
  return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor">
      <rect x="20" y="20" width="70" height="70" strokeWidth="1.5"/>
      <rect x="110" y="20" width="70" height="70" strokeWidth="1.5"/>
      <rect x="20" y="110" width="70" height="70" strokeWidth="1.5"/>
      <rect x="110" y="110" width="70" height="70" strokeWidth="1.5"/>
      <circle cx="55" cy="55" r="18" strokeWidth="1"/>
      <rect x="130" y="40" width="30" height="30" strokeWidth="1"/>
      <path d="M 40 130 L 70 170 L 80 145 Z" strokeWidth="1"/>
      <line x1="130" y1="120" x2="160" y2="120" strokeWidth="1"/>
      <line x1="130" y1="135" x2="160" y2="135" strokeWidth="1"/>
      <line x1="130" y1="150" x2="160" y2="150" strokeWidth="1"/>
      <line x1="130" y1="165" x2="160" y2="165" strokeWidth="1"/>
    </svg>
  );
}

// ─── Process icons ───────────────────────────────────────────
function ProcessIcon({ n }) {
  const common = { width:48, height:48, fill:"none", stroke:"currentColor", strokeWidth:1.5 };
  if (n === '01') return <svg viewBox="0 0 48 48" {...common}><rect x="8" y="20" width="32" height="8"/><line x1="12" y1="20" x2="12" y2="28"/><line x1="20" y1="20" x2="20" y2="28"/><line x1="28" y1="20" x2="28" y2="28"/><line x1="36" y1="20" x2="36" y2="28"/></svg>;
  if (n === '02') return <svg viewBox="0 0 48 48" {...common}><circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="3" fill="currentColor"/><line x1="24" y1="8" x2="24" y2="14"/><line x1="24" y1="34" x2="24" y2="40"/><line x1="8" y1="24" x2="14" y2="24"/><line x1="34" y1="24" x2="40" y2="24"/></svg>;
  if (n === '03') return <svg viewBox="0 0 48 48" {...common}><path d="M 12 34 Q 12 22 18 22 Q 22 22 22 28 Q 22 14 28 14 Q 36 14 36 34 Z"/><line x1="10" y1="38" x2="38" y2="38"/></svg>;
  if (n === '04') return <svg viewBox="0 0 48 48" {...common}><circle cx="24" cy="24" r="14"/><line x1="24" y1="10" x2="24" y2="38"/><line x1="10" y1="24" x2="38" y2="24"/><line x1="14" y1="14" x2="34" y2="34"/><line x1="34" y1="14" x2="14" y2="34"/></svg>;
  if (n === '05') return <svg viewBox="0 0 48 48" {...common}><rect x="10" y="10" width="28" height="28"/><polyline points="16,24 22,30 34,18"/></svg>;
  if (n === '06') return <svg viewBox="0 0 48 48" {...common}><rect x="6" y="18" width="22" height="16"/><polygon points="28,22 38,22 42,28 42,34 28,34"/><circle cx="16" cy="36" r="3"/><circle cx="34" cy="36" r="3"/></svg>;
  return null;
}

// ─── Nav with lang switcher ──────────────────────────────────
function Nav({ lang, setLang, t }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', on);
    on();
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => {
    const close = (e) => { if (!e.target.closest('.lang-menu')) setOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);
  const langs = [
    { code:'tr', label:'TÜRKÇE', flag:'🇹🇷' },
    { code:'en', label:'ENGLISH', flag:'🇬🇧' },
    { code:'de', label:'DEUTSCH', flag:'🇩🇪' },
    { code:'ru', label:'РУССКИЙ', flag:'🇷🇺' },
  ];
  const cur = langs.find(l => l.code === lang) || langs[1];
  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="wrap">
        <a className="logo" href="#">
          <span className="logo__mark">Krv<span className="logo__mark__sub">Carbon</span></span>
          <span className="logo__word">KERVAN <b>HEAT</b></span>
          <span className="logo__sup">KARTEPE</span>
        </a>
        <div className="nav__links">
          <a className="nav__link" href="index.html#parts"><span className="num">01 /</span>{t.nav.parts}</a>
          <a className="nav__link" href="compat.html"><span className="num">02 /</span>{t.nav.compat}</a>
          <a className="nav__link" href="index.html#furnace"><span className="num">03 /</span>{t.nav.furnace}</a>
          <a className="nav__link" href="about.html"><span className="num">04 /</span>{t.nav.about || 'About'}</a>
          <a className="nav__link" href="cases.html"><span className="num">05 /</span>{t.nav.cases || 'Cases'}</a>
          <a className="nav__link" href="blog.html"><span className="num">06 /</span>{t.nav.blog || 'Blog'}</a>
          <a className="nav__link" href="index.html#contact"><span className="num">07 /</span>{t.nav.contact}</a>
        </div>
        <div className="nav__actions">
          <div className={`lang-menu ${open?'open':''}`} onClick={(e)=>{e.stopPropagation(); setOpen(!open);}}>
            <span className="lang-menu__dot"/>
            <span>{cur.code.toUpperCase()}</span>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5"/></svg>
            <div className="lang-menu__dropdown">
              {langs.map(l => (
                <div key={l.code} className={`lang-menu__item ${l.code===lang?'active':''}`} onClick={()=>{setLang(l.code); setOpen(false);}}>
                  <span>{l.label}</span>
                  <span className="flag">{l.flag}</span>
                </div>
              ))}
            </div>
          </div>
          <a className="btn-quote" href="#contact">{t.nav.quote} <span>→</span></a>
        </div>
      </div>
    </nav>
  );
}

// ─── HERO ────────────────────────────────────────────────────
function Hero({ t }) {
  const typed = useTypewriter(t.hero.h1a, 60, 200);
  return (
    <section className="hero">
      <div className="hero__grid-bg"/>
      <div className="hero__glow"/>
      <div className="hero__top">
        <span>{t.hero.topL}</span>
        <span>{t.hero.topR}</span>
      </div>
      <div className="hero__main">
        <div className="hero__copy">
          <span className="hero__eyebrow">{t.hero.eyebrow}</span>
          <h1>
            {typed}{typed.length < t.hero.h1a.length && <span className="cursor"/>}
            {typed.length >= t.hero.h1a.length && <><br/><em>{t.hero.h1b}</em></>}
          </h1>
          <p className="hero__sub">{t.hero.sub}</p>
          <div className="hero__ctas">
            <a className="btn-primary" href="#contact">{t.hero.cta1} <span>→</span></a>
            <a className="btn-ghost" href="#parts">{t.hero.cta2}</a>
          </div>
          <div className="hero__specs">
            {t.hero.s.map((s, i) => (
              <div key={i} className="hero__spec">
                <span className="hero__spec__label">{s.l}</span>
                <span className="hero__spec__value">{s.v}</span>
              </div>
            ))}
          </div>
        </div>
        <HeroDrawing t={t.hero}/>
      </div>
      <div className="hero__bot">
        <span>{t.hero.botL}</span>
        <span>{t.hero.botR}</span>
      </div>
    </section>
  );
}

// ─── TICKER ──────────────────────────────────────────────────
function Ticker({ t }) {
  const items = [...t.ticker, ...t.ticker];
  return (
    <div className="ticker">
      <div className="ticker__track">
        {items.map((it, i) => (
          <span key={i} className="ticker__item">
            <span className="ticker__sep"/>
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── PARTS ───────────────────────────────────────────────────
function Parts({ t }) {
  return (
    <section id="parts" className="section" data-screen-label="Parts">
      <span className="section__label"><b>{t.parts.label}</b></span>
      <div className="section__ruler"/>
      <div className="wrap">
        <div className="section__head">
          <h2>{t.parts.h2a}<em>{t.parts.h2b}</em></h2>
          <p>{t.parts.sub}</p>
        </div>
        <div className="parts">
          {t.parts.items.map((p) => (
            <div key={p.ref} className="part">
              <div className="part__head">
                <span><b>REF</b>{p.ref}</span>
                <span>DWG 0{p.ref.slice(-2)}</span>
              </div>
              <div className="part__draw"><PartDrawing kind={p.ref}/></div>
              <span className="part__arrow">→</span>
              <div className="part__foot">
                <span className="part__name">{p.name}</span>
                <p className="part__desc">{p.desc}</p>
                <div className="part__specs">
                  <span><b>●</b>{p.s1}</span>
                  <span><b>●</b>{p.s2}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── COMPATIBILITY orbit ─────────────────────────────────────
const BRANDS = [
  'FURUKAWA','RAMMER','SOOSAN','ATLAS COPCO','MONTABERT','INDECO','NPK','KRUPP',
  'HANWOO','BOBCAT','CAT','DAEMO','OKADA','TOKU','GIANT','KOMATSU',
  'DOOSAN','JCB','TEREX','EVERDIGM','ALLIED','GENERAL','KINSHOFER','EPIROC',
];

function OrbitSection({ t }) {
  return (
    <section id="compat" className="section" data-screen-label="Compatibility">
      <span className="section__label"><b>{t.orbit.label}</b></span>
      <div className="section__ruler"/>
      <div className="wrap">
        <div className="section__head">
          <h2>{t.orbit.h2a}<em>{t.orbit.h2b}</em></h2>
          <p>{t.orbit.sub}</p>
        </div>
        <div className="orbit">
          <div className="orbit__ring"/>
          <div className="orbit__ring orbit__ring--2"/>
          <div className="orbit__ring orbit__ring--3"/>
          <div className="orbit__rotator">
            {BRANDS.map((b, i) => {
              const angle = (i / BRANDS.length) * Math.PI * 2;
              const ring = i % 3; // 3 rings
              const radii = ['48%','38%','28%'];
              const r = radii[ring];
              const x = `calc(50% + ${Math.cos(angle) * 100}% * 0.48 / 1)`;
              const cx = 50 + Math.cos(angle) * (ring === 0 ? 48 : ring === 1 ? 38 : 28);
              const cy = 50 + Math.sin(angle) * (ring === 0 ? 48 : ring === 1 ? 38 : 28);
              return (
                <span key={b} className="orbit__brand"
                  style={{
                    left: `${cx}%`,
                    top: `${cy}%`,
                    transform: `translate(-50%, -50%) rotate(${(i / BRANDS.length) * 360}deg)`,
                    // counter-rotate text so it stays level relative to orbit spin
                  }}>
                  {b}
                </span>
              );
            })}
          </div>
          <div className="orbit__center">
            <div className="orbit__k">Krv<span className="orbit__k__sub">Carbon</span></div>
            <div className="orbit__number">40+</div>
            <div className="orbit__caption">{t.orbit.caption}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FURNACE ─────────────────────────────────────────────────
function Furnace({ t }) {
  // heat curve path (SVG path in 0..100 coords)
  return (
    <section id="furnace" className="section" data-screen-label="Furnace">
      <span className="section__label"><b>{t.furnace.label}</b></span>
      <div className="section__ruler"/>
      <div className="wrap">
        <div className="section__head">
          <h2>{t.furnace.h2a}<em>{t.furnace.h2b}</em></h2>
          <p>{t.furnace.sub}</p>
        </div>
        <div className="furnace">
          <div className="furnace__left">
            <div className="furnace__list">
              {t.furnace.steps.map((s, i) => (
                <div key={i} className="furnace__row">
                  <span className="furnace__row__num">{s.num}</span>
                  <span className="furnace__row__name">{s.name}</span>
                  <span className="furnace__row__temp"><b>{s.temp}</b></span>
                </div>
              ))}
            </div>
          </div>
          <div className="furnace__chart">
            <div className="furnace__chart__title">
              <span><b>●</b> {t.furnace.chartT}</span>
              <span>{t.furnace.chartR}</span>
            </div>
            <svg className="furnace__chart__svg" viewBox="0 0 400 260" preserveAspectRatio="none">
              <defs>
                <linearGradient id="heatfill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#E8781A" stopOpacity="0.4"/>
                  <stop offset="1" stopColor="#E8781A" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {/* grid */}
              {[0,1,2,3,4].map(i => (
                <line key={'h'+i} x1="0" y1={i*65} x2="400" y2={i*65} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
              ))}
              {[0,1,2,3,4,5,6].map(i => (
                <line key={'v'+i} x1={i*66} y1="0" x2={i*66} y2="260" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
              ))}
              {/* curve: rise → hold high → quench drop → temper rise → final */}
              <path
                d="M 0 240 L 40 60 L 110 40 L 170 35 L 210 230 L 260 180 L 330 170 L 400 140"
                fill="none" stroke="#E8781A" strokeWidth="2"
              />
              <path
                d="M 0 240 L 40 60 L 110 40 L 170 35 L 210 230 L 260 180 L 330 170 L 400 140 L 400 260 L 0 260 Z"
                fill="url(#heatfill)" stroke="none"
              />
              {/* phase markers */}
              {[{x:75,l:'3.1'},{x:140,l:'3.2'},{x:200,l:'3.3'},{x:290,l:'3.4'},{x:380,l:'3.5'}].map((m, i) => (
                <g key={i}>
                  <line x1={m.x} y1="0" x2={m.x} y2="260" stroke="rgba(232,120,26,0.25)" strokeDasharray="3 3" strokeWidth="1"/>
                  <circle cx={m.x} cy={[60,40,230,180,140][i]} r="4" fill="#08090B" stroke="#E8781A" strokeWidth="2"/>
                  <text x={m.x} y="18" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#E8781A" textAnchor="middle" letterSpacing="1">{m.l}</text>
                </g>
              ))}
            </svg>
            <div className="furnace__chart__y">
              <span>1000°</span>
              <span>750°</span>
              <span>500°</span>
              <span>250°</span>
              <span>0°</span>
            </div>
            <div className="furnace__chart__x">
              <span>0 h</span>
              <span>3 h</span>
              <span>6 h</span>
              <span>9 h</span>
              <span>12 h</span>
              <span>15 h</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── PROCESS ─────────────────────────────────────────────────
function Process({ t }) {
  return (
    <section id="process" className="section" data-screen-label="Process">
      <span className="section__label"><b>{t.process.label}</b></span>
      <div className="section__ruler"/>
      <div className="wrap">
        <div className="section__head">
          <h2>{t.process.h2a}<em>{t.process.h2b}</em></h2>
          <p>{t.process.sub}</p>
        </div>
        <div className="process-track">
          {t.process.steps.map((s) => (
            <div key={s.n} className="process-step">
              <span className="process-step__num">{s.n} —</span>
              <span className="process-step__icon"><ProcessIcon n={s.n}/></span>
              <span className="process-step__name">{s.name}</span>
              <p className="process-step__desc">{s.desc}</p>
              <span className="process-step__tag"><b>●</b> {s.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── METERS ──────────────────────────────────────────────────
function Meters({ t }) {
  return (
    <section className="section" data-screen-label="Numbers">
      <span className="section__label"><b>{t.meters.label}</b></span>
      <div className="section__ruler"/>
      <div className="wrap">
        <div className="section__head">
          <h2>{t.meters.h2a}<em>{t.meters.h2b}</em></h2>
          <p>{t.meters.sub}</p>
        </div>
        <div className="meters">
          {t.meters.items.map((m, i) => (
            <div key={i} className="meter">
              <span className="meter__label">{m.l}</span>
              <span className="meter__value">
                <span>{m.v}</span>
                {m.u && <span className="unit">{m.u}</span>}
              </span>
              <div className="meter__bar" style={{ '--fill': m.fill }}/>
              <span className="meter__hint">{m.hint}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── RFQ ─────────────────────────────────────────────────────
function RFQ({ t }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [fileName, setFileName] = useState('');
  const [err, setErr] = useState('');
  const [consent, setConsent] = useState(false);
  const fileRef = useRef();
  const date = new Date().toISOString().slice(0, 10);
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!consent) { setErr(t.rfq.consentErr || 'KVKK onayı gerekli.'); return; }
    setErr(''); setSending(true);
    try {
      const fd = new FormData(e.target);
      // Map UI field names to worker field names
      if (fd.get('quantity')) { fd.append('qty', fd.get('quantity')); }
      if (fd.get('brand')) { fd.append('service', fd.get('brand')); }
      fd.append('kvkk_consent', '1');
      const res = await fetch('/api/rfq', { method:'POST', body: fd, headers:{ Accept:'application/json' } });
      if (res.ok) { setSent(true); }
      else { setErr('Gönderilemedi — info@kervanheat.com'); }
    } catch (e2) {
      setErr('Gönderilemedi — info@kervanheat.com');
    } finally { setSending(false); }
  };
  const hv = [...t.rfq.hv];
  hv[1] = date;
  return (
    <section id="contact" className="section" data-screen-label="RFQ">
      <span className="section__label"><b>{t.rfq.label}</b></span>
      <div className="section__ruler"/>
      <div className="wrap">
        <div className="section__head">
          <h2>{t.rfq.h2a}<em>{t.rfq.h2b}</em></h2>
          <p>{t.rfq.sub}</p>
        </div>
        <div className="rfq">
          <div className="rfq__header">
            {t.rfq.h.map((h, i) => (
              <div key={i} className="rfq__header__cell">
                <b>{h}</b>
                <span className={i === 2 ? 'orange' : ''}>{hv[i]}</span>
              </div>
            ))}
          </div>
          <form className="rfq__grid" onSubmit={onSubmit} encType="multipart/form-data">
            <div className="rfq__field">
              <label className="rfq__label"><span>{t.rfq.f.name}</span><b>REQ</b></label>
              <input required name="name" className="rfq__input" type="text"/>
            </div>
            <div className="rfq__field">
              <label className="rfq__label"><span>{t.rfq.f.email}</span><b>REQ</b></label>
              <input required name="email" className="rfq__input" type="email"/>
            </div>
            <div className="rfq__field">
              <label className="rfq__label"><span>{t.rfq.f.phone}</span></label>
              <input name="phone" className="rfq__input" type="tel" placeholder="+90"/>
            </div>
            <div className="rfq__field">
              <label className="rfq__label"><span>{t.rfq.f.company}</span></label>
              <input name="company" className="rfq__input" type="text"/>
            </div>
            <div className="rfq__field">
              <label className="rfq__label"><span>{t.rfq.f.brand}</span></label>
              <select name="brand" className="rfq__select" defaultValue="">
                <option value="" disabled>— {t.rfq.f.brandPh} —</option>
                {BRANDS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="rfq__field">
              <label className="rfq__label"><span>{t.rfq.f.qty}</span></label>
              <input name="quantity" className="rfq__input" type="text" placeholder="20"/>
            </div>
            <div className="rfq__field rfq__field--full">
              <label className="rfq__label"><span>{t.rfq.f.message}</span><b>REQ</b></label>
              <textarea required name="message" className="rfq__textarea" placeholder={t.rfq.f.messagePh}/>
            </div>
            <div className="rfq__field rfq__field--full">
              <label className="rfq__label"><span>{t.rfq.f.file || 'Fotoğraf / PDF (ops.)'}</span></label>
              <div style={{display:'flex', gap:10, alignItems:'center', flexWrap:'wrap'}}>
                <input ref={fileRef} name="attachment" type="file" accept="image/*,.pdf" style={{display:'none'}} onChange={e=>setFileName(e.target.files[0]?.name || '')}/>
                <button type="button" className="btn-secondary" style={{padding:'10px 16px', fontSize:10}} onClick={()=>fileRef.current.click()}>{t.rfq.f.fileBtn || 'DOSYA SEÇ'}</button>
                <span style={{fontFamily:'var(--f-mono)', fontSize:11, color:'var(--t-3)'}}>{fileName || (t.rfq.f.fileHint || 'Maks 5 MB · fotoğraf/PDF')}</span>
              </div>
            </div>
            {sent ? (
              <div className="rfq__success">
                <span>✓</span>
                <span>{t.rfq.success}</span>
              </div>
            ) : (
              <>
                <div className="rfq__field rfq__field--full">
                  <label className="rfq__consent">
                    <input type="checkbox" checked={consent} onChange={e=>{ setConsent(e.target.checked); if (e.target.checked && err) setErr(''); }}/>
                    <span className="rfq__consent__box" aria-hidden="true">{consent ? '✓' : ''}</span>
                    <span className="rfq__consent__text">
                      {t.rfq.consentA || 'Form üzerinden ilettiğim kişisel verilerin fiyat teklifi hazırlanması amacıyla işlenmesini kabul ediyorum.'}{' '}
                      <a href="kvkk.html" target="_blank" rel="noopener">{t.rfq.consentLink || 'KVKK Aydınlatma Metni'}</a>{t.rfq.consentB || ''}
                    </span>
                  </label>
                </div>
                <div className="rfq__submit">
                  <span className="rfq__submit__note"><b>●</b> {err || t.rfq.note}</span>
                  <button type="submit" disabled={sending || !consent} className="btn-primary">{sending ? '...' : t.rfq.submit} <span>→</span></button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────
function Footer({ t }) {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot__grid">
          <div className="foot__col">
            <a className="logo" href="#" style={{marginBottom:20, display:'inline-flex'}}>
              <span className="logo__mark">Krv<span className="logo__mark__sub">Carbon</span></span>
              <span className="logo__word">KERVAN <b>HEAT</b></span>
            </a>
            <p>{t.foot.about}</p>
            <div className="foot__certs">
              {t.foot.certs.map(c => (
                <span key={c} className="foot__cert"><b>✓</b> {c}</span>
              ))}
            </div>
          </div>
          <div className="foot__col">
            <h5>{t.foot.h1}</h5>
            <ul>{t.foot.p.map(p => <li key={p}><a href="#parts">{p}</a></li>)}</ul>
          </div>
          <div className="foot__col">
            <h5>{t.foot.h2}</h5>
            <ul>{t.foot.c.map(c => <li key={c}><a href="#">{c}</a></li>)}</ul>
          </div>
          <div className="foot__col">
            <h5>{t.foot.h3}</h5>
            <ul>{t.foot.cc.map(c => <li key={c}><a href="#contact">{c}</a></li>)}</ul>
          </div>
        </div>
        <div className="foot__block">
          {t.foot.block.map(([k, v], i) => (
            <div key={i} className="foot__block__cell">
              <b>{k}</b>
              <span className={i === 0 ? 'orange' : ''}>{v}</span>
            </div>
          ))}
        </div>
        <div className="foot__bot">
          <span>© 2026 KERVAN HEAT TREATMENT</span>
          <span className="foot__bot__links">
            <a href="kvkk.html">KVKK</a>
            <span aria-hidden="true">·</span>
            <span>{t.foot.bot}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

// ─── Floating WhatsApp button (with prefilled message) ────────────────
const WA_PHONE = '905316693734';
const WA_MSG = {
  tr: 'Merhaba, kervanheat.com\'dan yazıyorum. Aşağıdaki konuda fiyat almak istiyorum:\n\nKırıcı markası/modeli:\nParça (keski/piston/burç/cıvata):\nAdet:',
  en: 'Hello, I\'m reaching out from kervanheat.com. I\'d like a quote for:\n\nBreaker brand/model:\nPart (chisel/piston/bushing/bolt):\nQuantity:',
  de: 'Hallo, ich schreibe Ihnen von kervanheat.com. Ich möchte ein Angebot für:\n\nHersteller/Modell:\nTeil (Meißel/Kolben/Buchse/Bolzen):\nMenge:',
  ru: 'Здравствуйте, я пишу с сайта kervanheat.com. Хотел бы получить цену на:\n\nМарка/модель молота:\nДеталь (пика/поршень/втулка/болт):\nКоличество:',
};
function WAFloat({ lang }) {
  const msg = WA_MSG[lang] || WA_MSG.en;
  const url = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`;
  return (
    <a className="wa" href={url} target="_blank" rel="noopener" aria-label="WhatsApp">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
    </a>
  );
}

// Expose
Object.assign(window, { Nav, Hero, Ticker, Parts, OrbitSection, Furnace, Process, Meters, RFQ, Footer, WAFloat });
