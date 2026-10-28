import { DICT } from '../lib/dict';
import { pathForLang } from '../lib/use-lang';
import type { Lang } from '../types';
import { BTN_PRIMARY } from '../lib/ui';

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2';

/**
 * Static 404 page. Cloudflare Pages serves the nearest 404.html with HTTP 404:
 * dist/404.html (Turkish first) for unknown paths, dist/en/404.html (English
 * first, `<html lang="en">`) under /en/. Both show both languages. No motion,
 * no client script.
 */
export default function NotFound({ lang = 'tr' }: { lang?: Lang }) {
  const langs: Lang[] = lang === 'en' ? ['en', 'tr'] : ['tr', 'en'];
  return (
    <main className="min-h-dvh flex flex-col justify-center py-20 md:py-32">
      <div className="max-w-[820px] w-full mx-auto px-6 md:px-8 flex flex-col gap-16">
        <a
          href={pathForLang(lang)}
          className={`self-start flex items-center min-h-11 ${focusRing}`}
          aria-label={DICT[lang].nav.home}
        >
          <img
            src="/logo-krv-v2.svg"
            alt=""
            width={124}
            height={40}
            className="h-[26px] w-auto select-none"
            draggable={false}
          />
        </a>
        {langs.map((l) => {
          const t = DICT[l].notFound;
          return (
            <section
              key={l}
              lang={l === lang ? undefined : l}
              className="flex flex-col gap-6 items-start"
            >
              <span className="font-sans text-sm font-semibold text-ink-mid tabular-nums">
                {t.eyebrow}
              </span>
              {l === lang ? (
                <h1 className="m-0 font-sans font-bold text-ink text-[30px] min-[721px]:text-[40px] leading-[1.1] tracking-[-0.03em]">
                  {t.title}
                </h1>
              ) : (
                <h2 className="m-0 font-sans font-bold text-ink text-[30px] min-[721px]:text-[40px] leading-[1.1] tracking-[-0.03em]">
                  {t.title}
                </h2>
              )}
              <p className="m-0 font-sans text-[17px] text-ink-mid">{t.body}</p>
              <a href={pathForLang(l)} className={`${BTN_PRIMARY} ${focusRing}`}>
                {t.home}
              </a>
            </section>
          );
        })}
      </div>
    </main>
  );
}
