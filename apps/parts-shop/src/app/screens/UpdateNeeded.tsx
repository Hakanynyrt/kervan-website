import type { AppDict } from '../dict';
import { BUTTON_PRIMARY, H1, SCREEN } from '../ui';

/**
 * A page this app cannot show: a page kind newer than the app, or a page that throws on the
 * site's newer data (ErrorBoundary). The page opens on the live site instead.
 */
export default function UpdateNeeded({ d, onOpenSite }: { d: AppDict; onOpenSite: () => void }) {
  return (
    <div className={`${SCREEN} flex flex-col items-start gap-4 py-10`}>
      <h1 className={H1}>{d.update.title}</h1>
      <button type="button" onClick={onOpenSite} className={BUTTON_PRIMARY}>
        {d.update.open}
      </button>
    </div>
  );
}
