/* global React */
// useState / useEffect / useRef come from dict.jsx (loaded first).

// ═══════════════════════════════════════════════════════════════════════
// NAV — minimal, lang switch, CTA
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
      <a className="nav__brand" href="/">
        <span className="nav__mark">Krv</span>
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
          className={"nav__lang" + (lang === 'tr' ? ' is-active' : '')}
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
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// HERO
// ═══════════════════════════════════════════════════════════════════════
function Hero({ t }) {
  return (
    <section className="hero">
      <div className="hero__copy">
        <div className="eyebrow">{t.hero.eyebrow}</div>
        <h1 className="hero__title">
          <span className="hero__line">{t.hero.title1}</span>
          <span className="hero__line hero__line--accent">{t.hero.title2}</span>
        </h1>
        <p className="hero__sub">{t.hero.sub}</p>
        <div className="hero__actions">
          <a href="#contact" className="btn btn--primary">{t.hero.cta}</a>
          <a href="#products" className="btn btn--ghost">{t.hero.ctaSecondary} →</a>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PRODUCTS — four cards, photo + name + blurb
// ═══════════════════════════════════════════════════════════════════════
function Products({ t }) {
  return (
    <section className="sec" id="products">
      <div className="sec__head">
        <div className="eyebrow">{t.products.eyebrow}</div>
        <h2 className="sec__title">{t.products.title.split('\n').map((l, i) => <span key={i}>{l}</span>)}</h2>
      </div>

      <div className="products">
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
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CRAFT — single wide image + narrative
// ═══════════════════════════════════════════════════════════════════════
function Craft({ t }) {
  return (
    <section className="sec craft" id="craft">
      <div className="craft__grid">
        <div className="craft__copy">
          <div className="eyebrow">{t.craft.eyebrow}</div>
          <h2 className="sec__title">{t.craft.title}</h2>
          <p className="craft__body">{t.craft.body}</p>
        </div>
        <div className="craft__img" style={{ backgroundImage: 'url(photos/workshop-overview.jpeg)' }}></div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// INDUSTRIES — 4 simple rows
// ═══════════════════════════════════════════════════════════════════════
function Industries({ t }) {
  return (
    <section className="sec industries" id="industries">
      <div className="sec__head">
        <div className="eyebrow">{t.industries.eyebrow}</div>
        <h2 className="sec__title">{t.industries.title}</h2>
      </div>

      <ul className="ind">
        {t.industries.items.map((it, i) => (
          <li className="ind__row" key={i}>
            <span className="ind__num">0{i + 1}</span>
            <span className="ind__name">{it.name}</span>
            <span className="ind__desc">{it.desc}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CONTACT — info + RFQ form
// ═══════════════════════════════════════════════════════════════════════
function Contact({ t }) {
  const [state, setState] = useState('idle'); // idle | sending | success | error
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
    <section className="sec contact" id="contact">
      <div className="contact__grid">
        <div className="contact__info">
          <div className="eyebrow">{t.contact.eyebrow}</div>
          <h2 className="sec__title">{t.contact.title}</h2>
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

        <form className="rfq" ref={formRef} onSubmit={onSubmit}>
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
      <div className="foot__row">
        <div className="foot__brand">
          <span className="nav__mark">Krv</span>
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
    </footer>
  );
}
