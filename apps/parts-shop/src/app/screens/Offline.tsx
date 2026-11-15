import type { AppDict } from '../dict';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, H1, SCREEN } from '../ui';

/**
 * A page that could not be shown: no connection and no copy on the phone (`offline`), or the
 * site answered with something that is not a shop page (`failed`, with the page on the site).
 */
export default function Offline({
  d,
  failed = false,
  onRetry,
  onOpenSite,
}: {
  d: AppDict;
  failed?: boolean;
  onRetry: () => void;
  onOpenSite?: () => void;
}) {
  return (
    <div className={`${SCREEN} flex flex-col items-start gap-4 py-10`}>
      <h1 className={H1}>{failed ? d.failed.title : d.offline.title}</h1>
      {!failed && <p className="m-0 text-base text-ink-mid">{d.offline.text}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onRetry} className={BUTTON_PRIMARY}>
          {d.offline.retry}
        </button>
        {failed && onOpenSite && (
          <button type="button" onClick={onOpenSite} className={BUTTON_SECONDARY}>
            {d.update.open}
          </button>
        )}
      </div>
    </div>
  );
}
