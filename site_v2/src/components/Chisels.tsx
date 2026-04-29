import type { DictBlock } from '../types';
import Gallery from './Gallery';

export default function Chisels({ t }: { t: DictBlock }) {
  return (
    <Gallery
      idAttr="chisels"
      eyebrow={t.chisels.eyebrow}
      title={t.chisels.title}
      aside={t.chisels.aside}
      items={t.chisels.items}
    />
  );
}
