/* global React */
// useState / useEffect / useRef come from dict.jsx (loaded first).

// Motion globals come from motion-shim.js (loaded before this file). Proxy
// fallback returns string tags so the page renders static HTML if the shim
// failed (CDN down, network error). Animation props become unknown DOM attrs
// in that case — acceptable trade-off vs. a white screen.
const motion = window.motion || new Proxy({}, { get: (_, tag) => tag });
const useReducedMotion = window.useReducedMotion || (() => false);

// ═══════════════════════════════════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════════════════════════════════
function Nav({ lang, setLang, t }) {
  const [open, setOpen]   = useState(false);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const on = () => setStuck(window.scrollY > 8);
    on();
    addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, []);

  return (
    <header className={"nav" + (stuck ? ' nav--stuck' : '')}>
      <div className="nav__inner">
        <a className="nav__brand" href="/">
          <span className="nav__mark">K</span>
          <span className="nav__name">Kervan Heat</span>
        </a>

        <nav className={"nav__links" + (open ? ' nav__links--open' : '')}>
          <a href="#products" onClick={() => setOpen(false)}>{t.nav.products}</a>
          <a href="#craft"    onClick={() => setOpen(false)}>{t.nav.craft}</a>
          <a href="#industries" onClick={() => setOpen(false)}>{t.nav.industries}</a>
          <a href="#contact"  onClick={() => setOpen(false)}>{t.nav.contact}</a>
        </nav>

        <div className="nav__right">
          <button
            className="nav__lang"
            onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
            aria-label="Language"
          >
            {lang === 'tr' ? 'EN' : 'TR'}
          </button>
          <a href="#contact" className="btn btn--primary btn--sm">{t.nav.cta}</a>
          <button
            className="nav__burger"
            onClick={() => setOpen(o => !o)}
            aria-label="Menu"
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// HERO — 8-col display headline + 4-col stats grid
//
// Display title animates word-by-word on first paint. Coordinates with
// intro.js: if the intro overlay is showing (first visit, kv_intro_seen
// unset), wait until it has faded (~2.7s) so the animation isn't wasted
// behind the veil. On subsequent visits the intro is skipped, so we start
// almost immediately.
// ═══════════════════════════════════════════════════════════════════════
function Hero({ t }) {
  const prefersReducedMotion = useReducedMotion();
  // Read sessionStorage once at mount — the intro decides what to do at the
  // same moment, so the value is stable for this render.
  const introSeen = (() => {
    try { return sessionStorage.getItem('kv_intro_seen') === '1'; }
    catch (_) { return true; }  // fail open: skip the wait, never block hero
  })();
  const startDelay = prefersReducedMotion ? 0 : (introSeen ? 0.2 : 2.7);

  const wordContainer = {
    hidden: {},
    show: {
      transition: {
        delayChildren: startDelay,
        staggerChildren: prefersReducedMotion ? 0 : 0.07,
      },
    },
  };
  const word = {
    hidden: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: '0.5em' },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  };

  // Whitespace-split preserves the natural line break between title1 and title2.
  const words1 = t.hero.title1.split(/\s+/).filter(Boolean);
  const words2 = t.hero.title2.split(/\s+/).filter(Boolean);

  // Each word ships in its own clipping wrapper so the rise is masked at the
  // baseline — the letters appear to lift out of the line, not slide in from
  // outside the box. The italic/brand-color treatment lives on the inner
  // motion.span via the existing `.display .ital` kit.css rule.
  const Word = ({ children, italic }) => (
    <span
      className="hero__word"
      style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'baseline' }}
    >
      <motion.span
        className={italic ? 'ital' : undefined}
        variants={word}
        style={{ display: 'inline-block', willChange: 'transform, opacity' }}
      >
        {children}
      </motion.span>
    </span>
  );

  return (
    <section className="hero">
      <div className="hero__grid">
        <div className="hero__copy reveal-stagger">
          <div className="eyebrow">{t.hero.eyebrow}</div>
          <motion.h1
            className="display"
            variants={wordContainer}
            initial="hidden"
            animate="show"
            aria-label={`${t.hero.title1} ${t.hero.title2}`}
          >
            {words1.map((w, i) => (
              <React.Fragment key={`a-${i}`}>
                <Word>{w}</Word>{i < words1.length - 1 && ' '}
              </React.Fragment>
            ))}
            {' '}
            {words2.map((w, i) => (
              <React.Fragment key={`b-${i}`}>
                <Word italic>{w}</Word>{i < words2.length - 1 && ' '}
              </React.Fragment>
            ))}
          </motion.h1>
          <p className="hero__sub">{t.hero.sub}</p>
          <div className="hero__actions">
            <a href="#contact"  className="btn btn--primary">{t.hero.cta}</a>
            <a href="#products" className="btn btn--ghost">{t.hero.ctaSecondary} →</a>
          </div>
        </div>

        <div className="hero__stats reveal-stagger">
          {t.hero.stats.map((s, i) => (
            <div className="stat" key={i}>
              <div className="stat__num">{s.n}</div>
              <div className="stat__label">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════════════
function Products({ t }) {
  return (
    <section className="sec" id="products">
      <div className="sec__head">
        <div className="sec__head-main reveal">
          <div className="eyebrow">{t.products.eyebrow}</div>
          <h2 className="h2">{t.products.title.split('\n').map((l, i) => <span key={i} style={{ display: 'block' }}>{l}</span>)}</h2>
        </div>
        <aside className="sec__head-aside reveal">{t.products.aside}</aside>
      </div>

      <div className="products-wrap">
        <div className="products reveal-stagger">
          {t.products.items.map((p, i) => (
            <article className="prod" key={i}>
              <div className="prod__img" style={{ backgroundImage: `url(${p.img})` }}>
                <span className="prod__num">0{i + 1}</span>
              </div>
              <div className="prod__body">
                <h3 className="prod__name">{p.name}</h3>
                <p className="prod__desc">{p.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// GALLERY — reusable horizontal scroll-snap slider for chisels / pistons
// Placeholder-friendly: items with no `img` render a named empty slot.
// ═══════════════════════════════════════════════════════════════════════
function Gallery({ eyebrow, title, aside, items, idAttr }) {
  const scroller = useRef(null);
  const scroll = (dir) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };
  return (
    <section className="sec" id={idAttr}>
      <div className="sec__head">
        <div className="sec__head-main reveal">
          <div className="eyebrow">{eyebrow}</div>
          <h2 className="h2">{title}</h2>
        </div>
        <aside className="sec__head-aside reveal">
          {aside}
          <div className="gal__ctrls">
            <button className="gal__btn" type="button" onClick={() => scroll(-1)} aria-label="Önceki">←</button>
            <button className="gal__btn" type="button" onClick={() => scroll( 1)} aria-label="Sonraki">→</button>
          </div>
        </aside>
      </div>

      <div className="gal" ref={scroller}>
        {items.map((it, i) => (
          <article className="gal__card reveal" key={i}>
            {it.video ? (
              <video
                className="gal__media"
                src={it.video}
                poster={it.img || undefined}
                muted
                autoPlay
                loop
                playsInline
                preload="metadata"
              />
            ) : it.img ? (
              <div className="gal__img" style={{ backgroundImage: `url(${it.img})` }} />
            ) : (
              <div className="gal__img gal__img--empty">
                <span className="gal__placeholder">{it.name}</span>
              </div>
            )}
            <div className="gal__meta">
              <div className="gal__name">{it.name}</div>
              {it.desc && <div className="gal__desc">{it.desc}</div>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Chisels({ t }) {
  return (
    <Gallery
      idAttr="chisels"
      eyebrow={t.chisels.eyebrow}
      title={t.chisels.title}
      aside={t.chisels.aside}
      items={t.chisels.items}
    />
  );
}

function Stock({ t }) {
  return (
    <Gallery
      idAttr="stock"
      eyebrow={t.stock.eyebrow}
      title={t.stock.title}
      aside={t.stock.aside}
      items={t.stock.items}
    />
  );
}

function Atolye({ t }) {
  return (
    <Gallery
      idAttr="atolye"
      eyebrow={t.atolye.eyebrow}
      title={t.atolye.title}
      aside={t.atolye.aside}
      items={t.atolye.items}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CRAFT — "İmalathanemiz": copy + workshop photo
// ═══════════════════════════════════════════════════════════════════════
function Craft({ t }) {
  return (
    <section className="craft" id="craft">
      <div className="craft__grid">
        <div className="craft__copy reveal-stagger">
          <div className="eyebrow">{t.craft.eyebrow}</div>
          <h2 className="h2">{t.craft.title}</h2>
          <p className="craft__body">{t.craft.body}</p>
        </div>
        <div className="craft__img reveal" style={{ backgroundImage: 'url(photos/workshop-overview.jpeg)' }}></div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// INDUSTRIES
// ═══════════════════════════════════════════════════════════════════════
function Industries({ t }) {
  return (
    <section className="sec" id="industries">
      <div className="sec__head">
        <div className="sec__head-main reveal">
          <div className="eyebrow">{t.industries.eyebrow}</div>
          <h2 className="h2">{t.industries.title}</h2>
        </div>
        <aside className="sec__head-aside reveal">{t.industries.aside}</aside>
      </div>

      <div className="ind-wrap">
        <ul className="ind reveal-stagger">
          {t.industries.items.map((it, i) => (
            <li className="ind__row" key={i}>
              <span className="ind__num">0{i + 1}</span>
              <span className="ind__name">{it.name}</span>
              <span className="ind__desc">{it.desc}</span>
              <span className="ind__arrow">→</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CONTACT
// ═══════════════════════════════════════════════════════════════════════
function Contact({ t }) {
  const [state, setState] = useState('idle');
  const [kvkk, setKvkk]   = useState(false);
  const formRef = useRef(null);

  async function onSubmit(e) {
    e.preventDefault();
    if (!kvkk || state === 'sending') return;
    setState('sending');
    try {
      const fd = new FormData(formRef.current);
      fd.set('kvkk_consent', '1');
      const r = await fetch('/api/rfq', { method: 'POST', body: fd });
      const j = await r.json().catch(() => ({}));
      setState(r.ok && j.ok ? 'success' : 'error');
      if (r.ok && j.ok) formRef.current.reset();
    } catch (_) {
      setState('error');
    }
  }

  return (
    <section className="contact" id="contact">
      <div className="contact__grid">
        <div className="contact__info reveal">
          <div className="eyebrow">{t.contact.eyebrow}</div>
          <h2 className="h2">{t.contact.title}</h2>
          <p className="contact__sub">{t.contact.sub}</p>

          <dl className="contact__list">
            <div>
              <dt>{t.contact.phoneLabel}</dt>
              <dd><a href="tel:+905316693734">+90 531 669 37 34</a></dd>
            </div>
            <div>
              <dt>{t.contact.emailLabel}</dt>
              <dd><a href="mailto:info@kervanheat.com">info@kervanheat.com</a></dd>
            </div>
            <div>
              <dt>Adres</dt>
              <dd style={{ whiteSpace: 'pre-line' }}>{t.contact.address}</dd>
            </div>
            <div>
              <dt>{t.contact.hoursLabel}</dt>
              <dd>{t.contact.hours}</dd>
            </div>
          </dl>
        </div>

        <form className="rfq reveal" ref={formRef} onSubmit={onSubmit}>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true"/>

          <label className="fld">
            <span>{t.contact.fields.name}</span>
            <input type="text" name="name" required maxLength={100}/>
          </label>
          <label className="fld">
            <span>{t.contact.fields.company}</span>
            <input type="text" name="company" maxLength={150}/>
          </label>
          <label className="fld">
            <span>{t.contact.fields.email}</span>
            <input type="email" name="email" required maxLength={200}/>
          </label>
          <label className="fld">
            <span>{t.contact.fields.phone}</span>
            <input type="tel" name="phone" maxLength={30}/>
          </label>
          <label className="fld fld--wide">
            <span>{t.contact.fields.message}</span>
            <textarea name="message" rows="4" maxLength={3000}></textarea>
          </label>

          <label className="kvkk">
            <input type="checkbox" checked={kvkk} onChange={e => setKvkk(e.target.checked)}/>
            <span>{t.contact.kvkk}</span>
          </label>

          <button type="submit" className="btn btn--primary btn--block" disabled={!kvkk || state === 'sending'}>
            {state === 'sending' ? t.contact.sending : t.contact.submit}
          </button>

          {state === 'success' && <p className="rfq__msg rfq__msg--ok">{t.contact.success}</p>}
          {state === 'error'   && <p className="rfq__msg rfq__msg--err">{t.contact.error}</p>}
        </form>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════════════
function Footer({ t }) {
  return (
    <footer className="foot">
      <div className="foot__inner">
        <div className="foot__row">
          <div className="foot__brand">
            <span className="nav__mark">K</span>
            <span className="foot__name">
              <b>{t.footer.brand}</b>
              <em>{t.footer.tag}</em>
            </span>
          </div>
          <nav className="foot__links">
            <a href="/kvkk.html">{t.footer.kvkk}</a>
            <a href="mailto:info@kervanheat.com">info@kervanheat.com</a>
          </nav>
        </div>
        <div className="foot__rights">{t.footer.rights}</div>
      </div>
    </footer>
  );
}
