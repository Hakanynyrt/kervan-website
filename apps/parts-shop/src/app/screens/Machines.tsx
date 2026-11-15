import { useMemo } from 'react';
import { localePath } from '../../lib/locale-path';
import type { Lang } from '../../types';
import type { AppDict } from '../dict';
import { Icon } from '../icons';
import { ModelFinder } from '../ModelFinder';
import { store } from '../store';
import { useMachines } from '../use-machines';
import { FOCUS, FOCUS_INSET, H2, SCREEN } from '../ui';

/**
 * "Makinelerim": the buyer's own breakers, saved on the phone. Each row opens only that model's
 * own page (never a list of parts merged across models); a row can be removed; models are added
 * with the same search as Start or from a model page's top bar.
 */
export default function Machines({ lang, d }: { lang: Lang; d: AppDict }) {
  const machines = useMachines();
  const saved = useMemo(() => new Set((machines ?? []).map((m) => m.path)), [machines]);
  return (
    <div className={`${SCREEN} flex flex-col gap-8`}>
      <section aria-label={d.machines.title}>
        {machines && machines.length === 0 && (
          <p className="m-0 py-2 text-base text-ink-mid">{d.machines.empty}</p>
        )}
        {machines && machines.length > 0 && (
          <ul className="m-0 list-none border-t border-hair p-0">
            {machines.map((m) => (
              <li key={m.path} className="flex items-stretch border-b border-hair">
                <a
                  href={localePath(m.path, lang)}
                  className={`flex min-h-12 min-w-0 flex-1 items-center justify-between gap-3 py-2 pr-2 text-base font-medium text-ink hover:text-brand-hi ${FOCUS_INSET}`}
                >
                  <span className="min-w-0 break-words">{m.name}</span>
                  <Icon name="chevron" className="size-5 shrink-0 text-ink-soft" />
                </a>
                <button
                  type="button"
                  aria-label={d.machines.removeLabel(m.name)}
                  onClick={() => void store.removeMachine(m.path)}
                  className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center border-l border-hair px-3 text-sm font-medium text-ink-mid hover:text-err ${FOCUS}`}
                >
                  {d.machines.remove}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="kv-machines-add">
        <h2 id="kv-machines-add" className={`${H2} mb-3`}>
          {d.machines.add}
        </h2>
        <ModelFinder
          lang={lang}
          d={d}
          label={d.finder.label}
          saved={saved}
          onAdd={(m) => void store.addMachine(m)}
        />
      </section>
    </div>
  );
}
