import type { DictBlock } from '../types';
import Gallery from './Gallery';

export default function Stock({ t }: { t: DictBlock }) {
  return (
    <Gallery
      idAttr="stock"
      eyebrow={t.stock.eyebrow}
      title={t.stock.title}
      aside={t.stock.aside}
      items={t.stock.items}
    />
  );
}
