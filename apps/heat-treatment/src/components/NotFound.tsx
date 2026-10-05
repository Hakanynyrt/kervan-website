import { DICT } from '../lib/dict';
import { pathForLang } from '../lib/use-lang';
import type { Lang } from '../types';

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2';

/**
 * Static 404 page (dist/404.html). Cloudflare Pages serves it with HTTP 404
 * for every unknown path, in either language, so it shows both: Turkish
 * first, English below. No motion, no client script.
 */
export default function NotFound() {
  const langs: Lang[] = ['tr', 'en'];
  return (
    <main className="min-h-dvh flex flex-col justify-center py-20 md:py-32">
      <div className="max-w-[820px] w-full mx-auto px-6 md:px-8 flex flex-col gap-16">
        <a
          href="/"
          className={`self-start flex items-center ${focusRing}`}
          aria-label={DICT.tr.nav.home}
        >
          <img
            src="/logo-krv-128.png"
            alt="Kervan Heat"
            width={40}
            height={40}
            className="h-10 w-10 md:h-11 md:w-11 select-none"
            draggable={false}
          />
        </a>
        {langs.map((l) => {
          const t = DICT[l].notFound;
          return (
            <section key={l} lang={l} className="flex flex-col gap-6 items-start">
              <span className="font-sans text-xs tracking-[0.2em] uppercase text-brand font-medium">
                {t.eyebrow}
              </span>
              {l === 'tr' ? (
                <h1 className="font-serif italic text-h2 text-ink leading-[1.1] tracking-[-0.015em] m-0">
                  {t.title}
                </h1>
              ) : (
                <h2 className="font-serif italic text-h2 text-ink leading-[1.1] tracking-[-0.015em] m-0">
                  {t.title}
                </h2>
              )}
              <p className="font-serif italic text-xl text-ink-mid leading-relaxed m-0">{t.body}</p>
              <a
                href={pathForLang(l)}
                className={`bg-brand text-bg px-7 py-3 font-sans text-sm tracking-wide hover:bg-brand-hi transition-colors ${focusRing}`}
              >
                {t.home}
              </a>
            </section>
          );
        })}
      </div>
    </main>
  );
}
