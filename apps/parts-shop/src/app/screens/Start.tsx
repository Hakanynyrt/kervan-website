import { localePath } from '../../lib/locale-path';
import { GUIDES_PATH } from '../../lib/guides';
import { CART_PATH, LIST_PATH, PARTS_PATH } from '../../lib/routes';
import { LANGS } from '../../lib/locale-path';
import type { Lang } from '../../types';
import type { AppDict } from '../dict';
import { Icon } from '../icons';
import { ModelFinder } from '../ModelFinder';
import { APP_PATHS } from '../router';
import { useMachines } from '../use-machines';
import { FOCUS, H2, ROW, SCREEN } from '../ui';

/**
 * "Ana ekran": the make/model search, the shop's sections, the saved machines and the language.
 */
export default function Start({
  lang,
  d,
  onLang,
}: {
  lang: Lang;
  d: AppDict;
  onLang: (lang: Lang) => void;
}) {
  const machines = useMachines();
  const sections: { href: string; label: string }[] = [
    { href: LIST_PATH, label: d.start.tips },
    { href: PARTS_PATH, label: d.start.parts },
    { href: GUIDES_PATH, label: d.start.guides },
    { href: CART_PATH, label: d.start.palet },
  ];
  return (
    <div className={`${SCREEN} flex flex-col gap-8`}>
      <section aria-labelledby="kv-start-search">
        <h2 id="kv-start-search" className={`${H2} mb-3`}>
          {d.start.search}
        </h2>
        <ModelFinder lang={lang} d={d} label={d.finder.label} />
      </section>

      <section aria-labelledby="kv-start-sections">
        <h2 id="kv-start-sections" className={`${H2} mb-3`}>
          {d.start.sections}
        </h2>
        <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 min-[360px]:grid-cols-2">
          {sections.map((s) => (
            <li key={s.href}>
              <a
                href={localePath(s.href, lang)}
                className={`flex min-h-14 items-center justify-between gap-2 rounded-sm border border-hair bg-bg-soft px-3 py-2 text-[15px] font-semibold text-ink hover:border-hair-strong ${FOCUS}`}
              >
                <span className="min-w-0 [overflow-wrap:normal]">{s.label}</span>
                <Icon name="chevron" className="size-5 shrink-0 text-ink-soft" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="kv-start-machines">
        <h2 id="kv-start-machines" className={`${H2} mb-1`}>
          {d.start.machines}
        </h2>
        {machines && machines.length === 0 && (
          <p className="m-0 py-2 text-sm text-ink-mid">{d.start.noMachines}</p>
        )}
        {machines && machines.length > 0 && (
          <ul className="m-0 list-none p-0">
            {machines.map((m) => (
              <li key={m.path}>
                <a href={localePath(m.path, lang)} className={ROW}>
                  <span className="min-w-0 break-words">{m.name}</span>
                  <Icon name="chevron" className="size-5 shrink-0 text-ink-soft" />
                </a>
              </li>
            ))}
          </ul>
        )}
        <a
          href={APP_PATHS.machines}
          className={`mt-1 inline-flex min-h-11 items-center text-sm font-medium text-brand-hi underline underline-offset-2 hover:text-ink ${FOCUS}`}
        >
          {d.start.editMachines}
        </a>
      </section>

      <section aria-labelledby="kv-start-lang">
        <h2 id="kv-start-lang" className={`${H2} mb-3`}>
          {d.start.language}
        </h2>
        <div role="group" aria-labelledby="kv-start-lang" className="flex gap-2">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              lang={l}
              aria-pressed={l === lang}
              onClick={() => l !== lang && onLang(l)}
              className={`inline-flex min-h-11 min-w-24 items-center justify-center rounded-sm border px-4 text-sm font-medium ${FOCUS} ${l === lang ? 'border-ink bg-ink text-bg' : 'border-hair-strong bg-bg text-ink hover:border-ink'}`}
            >
              {d.start.langName[l]}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
