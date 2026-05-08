import type { DictBlock } from '../types';
import Gallery from './Gallery';

export default function Atolye({ t }: { t: DictBlock }) {
  return (
    <Gallery
      idAttr="atolye"
      eyebrow={t.atolye.eyebrow}
      title={t.atolye.title}
      aside={t.atolye.aside}
      items={t.atolye.items}
    />
  );
}
