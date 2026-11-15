import { useId, useState, type FormEvent } from 'react';
import { SITE_ORIGIN } from '../../lib/page-source';
import type { AppDict } from '../dict';
import { kervanLink } from '../router';
import { BUTTON_PRIMARY, FIELD, SCREEN } from '../ui';

/**
 * "Tara" in M1: the camera scanner comes with the iPhone build (M2). Until then a Kervan link can
 * be pasted: only https links on the shop's site open (in the app); anything else is refused.
 */
export default function Scan({ d, open }: { d: AppDict; open: (url: string) => void }) {
  const id = useId();
  const [text, setText] = useState('');
  const [bad, setBad] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const target = kervanLink(text, SITE_ORIGIN);
    if (!target) {
      setBad(true);
      return;
    }
    setBad(false);
    open(target);
  };
  return (
    <div className={`${SCREEN} flex flex-col gap-6`}>
      <p className="m-0 text-base text-ink-mid">{d.scan.soon}</p>
      <form onSubmit={submit} noValidate className="flex flex-col gap-2">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {d.scan.field}
        </label>
        <div className="flex gap-2">
          <input
            id={id}
            type="url"
            inputMode="url"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="go"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setBad(false);
            }}
            aria-invalid={bad || undefined}
            aria-describedby={`${id}-err`}
            className={`${FIELD} min-w-0 flex-1`}
          />
          <button type="submit" className={`shrink-0 ${BUTTON_PRIMARY}`}>
            {d.scan.open}
          </button>
        </div>
        <p id={`${id}-err`} role="alert" className="m-0 text-sm font-medium text-err empty:hidden">
          {bad ? d.scan.notKervan : ''}
        </p>
      </form>
    </div>
  );
}
