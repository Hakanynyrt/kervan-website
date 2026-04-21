/* ═══════════════════════════════════════════════════════════════════
   KERVAN HEAT — INTRO SCREEN
   Vanilla, anında çalışır, React/Babel beklemez
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  // Prevent double-mount (for bfcache / hot reload)
  if (document.getElementById('kv-intro')) return;
  if (window.__kvIntroDone) return;

  // Only show once per session (user already saw it on first page load)
  try {
    if (sessionStorage.getItem('kv_intro_seen') === '1') return;
    sessionStorage.setItem('kv_intro_seen', '1');
  } catch (_) { /* private mode — still show */ }

  // Skip intro if user arrived via in-site link (has a ref within same origin)
  // but DO show on first arrival & hard refresh
  // Note: we still show on any first-of-session load regardless of referrer

  const DURATION = 2100;          // ms, tam süre
  const FADE_OUT = 520;           // ms, fade süresi
  const TOTAL = DURATION + FADE_OUT;

  // Root
  const root = document.createElement('div');
  root.id = 'kv-intro';
  root.setAttribute('aria-hidden', 'false');
  root.setAttribute('aria-label', 'Kervan Heat — açılış');
  root.innerHTML = `
    <div class="kv-intro__noise"></div>
    <div class="kv-intro__grid"></div>

    <div class="kv-intro__frame">
      <span class="kv-intro__corner kv-intro__corner--tl"></span>
      <span class="kv-intro__corner kv-intro__corner--tr"></span>
      <span class="kv-intro__corner kv-intro__corner--bl"></span>
      <span class="kv-intro__corner kv-intro__corner--br"></span>
    </div>

    <div class="kv-intro__top">
      <span class="kv-intro__tag">▲ KVN-HEAT · EST. 1999</span>
      <span class="kv-intro__tag kv-intro__tag--right">KARTEPE · KOCAELİ · TR</span>
    </div>

    <div class="kv-intro__center">
      <div class="kv-intro__logo">
        <span class="kv-intro__logo__box">
          <span class="kv-intro__logo__mark">Krv</span>
          <span class="kv-intro__logo__num">6</span>
          <span class="kv-intro__logo__mass">12.011</span>
          <span class="kv-intro__logo__sub">Carbon</span>
        </span>
        <span class="kv-intro__logo__word">KERVAN <b>HEAT</b></span>
      </div>
      <div class="kv-intro__tagline">
        <span class="kv-intro__tagline__type"></span>
        <span class="kv-intro__tagline__cursor">▌</span>
      </div>
      <div class="kv-intro__meters">
        <span class="kv-intro__meter"><b data-count="40">00</b><i>+</i> MARKA</span>
        <span class="kv-intro__meter"><b data-count="26">00</b> YIL</span>
        <span class="kv-intro__meter"><b data-count="500">000</b> t/AY</span>
      </div>
    </div>

    <div class="kv-intro__bottom">
      <div class="kv-intro__bar">
        <span class="kv-intro__bar__fill"></span>
      </div>
      <div class="kv-intro__bar__meta">
        <span class="kv-intro__bar__left">● YÜKLENIYOR</span>
        <span class="kv-intro__bar__right">KRV-INTRO · v1.0</span>
      </div>
    </div>
  `;
  document.documentElement.appendChild(root);

  // Lock scroll & interaction for full duration
  const html = document.documentElement;
  const body = document.body || document.createElement('body');
  const prevOverflow = html.style.overflow;
  html.style.overflow = 'hidden';
  const blockScroll = (e) => { e.preventDefault(); };
  const blockKey = (e) => {
    // Sadece navigasyon tuşları
    if ([32, 33, 34, 35, 36, 37, 38, 39, 40, 9].includes(e.keyCode)) e.preventDefault();
  };
  window.addEventListener('wheel', blockScroll, { passive: false });
  window.addEventListener('touchmove', blockScroll, { passive: false });
  window.addEventListener('keydown', blockKey, false);

  // Typewriter tagline (TR default, diğer diller de)
  const lang = (new URLSearchParams(location.search).get('lang') || document.documentElement.lang || 'tr').slice(0, 2);
  const TAG = {
    tr: 'Hidrolik kırıcı parçaları.',
    en: 'Hydraulic breaker parts.',
    de: 'Hydraulikhammer-Teile.',
    ru: 'Запчасти гидромолотов.',
  };
  const taglineText = TAG[lang] || TAG.tr;
  const typeEl = root.querySelector('.kv-intro__tagline__type');
  let i = 0;
  const typeStart = 480;  // ms sonrası başlar
  const typeSpeed = 42;   // ms per char
  setTimeout(() => {
    const tid = setInterval(() => {
      i++;
      typeEl.textContent = taglineText.slice(0, i);
      if (i >= taglineText.length) clearInterval(tid);
    }, typeSpeed);
  }, typeStart);

  // Number counters
  const meters = root.querySelectorAll('[data-count]');
  const countStart = 900;
  setTimeout(() => {
    meters.forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      const dur = 800;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(ease * target)).padStart(2, '0');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, countStart);

  // Progress bar fill — css handles animation via CSS variable transition
  setTimeout(() => {
    root.querySelector('.kv-intro__bar__fill').style.width = '100%';
  }, 50);

  // Fade out + cleanup
  setTimeout(() => {
    root.classList.add('kv-intro--leaving');
  }, DURATION);

  setTimeout(() => {
    root.remove();
    html.style.overflow = prevOverflow;
    window.removeEventListener('wheel', blockScroll);
    window.removeEventListener('touchmove', blockScroll);
    window.removeEventListener('keydown', blockKey);
    window.__kvIntroDone = true;
  }, TOTAL);

  // Accessibility: prefers-reduced-motion → kısa fade, no type effect
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    typeEl.textContent = taglineText;
    meters.forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      el.textContent = String(target).padStart(2, '0');
    });
  }
})();
