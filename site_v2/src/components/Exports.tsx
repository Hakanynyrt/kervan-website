import type { DictBlock, Lang } from '../types';
import SectionHead from './SectionHead';
import ExportsGlobe from './ExportsGlobe';
import { EXPORTS } from '../lib/exports';

interface Props {
  t: DictBlock;
  lang: Lang;
}

/** Section wrapper for the exports globe. Counts the destinations from
 *  the data file so the title doesn't drift if the list grows. */
export default function Exports({ t, lang }: Props) {
  const count = EXPORTS.length;
  const title = t.exports.title.replace('{count}', String(count));

  return (
    <section
      id="exports"
      data-scene-pose="exports"
      className="min-h-dvh snap-start flex flex-col justify-center py-8 md:py-16"
    >
      <SectionHead
        eyebrow={t.exports.eyebrow}
        title={title}
        aside={t.exports.aside}
      />
      <ExportsGlobe lang={lang} />
    </section>
  );
}
