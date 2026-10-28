import type { DictBlock } from '../types';
import { WRAP } from '../lib/ui';

interface Props {
  t: DictBlock;
}

/** Report sheet with a tick (the hardness report). */
export function ReportIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
      className={className}
    >
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5M10 13l2 2 4-4" />
    </svg>
  );
}

/**
 * Capacity (`#teknik-kapasite`) right under the hero: a framed spec table with a head bar, the
 * owner's five figures (label, value + unit, note) and a footer row "every batch gets a hardness
 * report". Desktop 5 in a row, tablet 3 + 2, phones 2 × 2 plus the alloy cell at full width (so the
 * first 390×844 screen holds the H1, both actions, the table and the report row). Layout in
 * globals.css (`.kv-spec*`). No entrance animation: it is part of the first screen.
 */
export default function TechnicalCapacity({ t }: Props) {
  const c = t.capacity;
  const q = t.services.quality;
  return (
    <section
      id="teknik-kapasite"
      aria-labelledby="kapasite-title"
      className="bg-bg pt-3.5 pb-7 min-[721px]:pt-7 min-[721px]:pb-12"
    >
      <div className={WRAP}>
        <div className="kv-spec">
          <div className="kv-spec-head">
            <h2 id="kapasite-title">{c.eyebrow}</h2>
            <p>{c.title}</p>
          </div>
          <table>
            <caption className="sr-only">{c.aside}</caption>
            <tbody>
              {c.items.map((it) => (
                <tr key={it.label}>
                  <th scope="row">{it.label}</th>
                  <td>
                    <span className="kv-spec-v">
                      {it.value}
                      {/* The space sits in the smaller unit type, so the gap stays narrow. */}
                      {it.unit && <span className="kv-spec-u"> {it.unit}</span>}
                    </span>
                    {it.note && <span className="kv-spec-n">{it.note}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="kv-spec-foot">
            <ReportIcon />
            <strong>{q.name}</strong>
            <span>{q.body}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
