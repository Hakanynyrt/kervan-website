import { KERVAN_SHOP_URL } from '@kervan/seo';
import type { Lang } from '../types';
import { shopUrl } from '../lib/shop';

interface Props {
  lang: Lang;
  /** Shop path, e.g. '/yedek-parca/burc'. */
  path: string;
  /** The sentence before the domain, e.g. "Mağazada kırıcınıza göre bulun". */
  text: string;
  className?: string;
}

const SHOP_HOST = KERVAN_SHOP_URL.replace(/^https:\/\//, '');

/** A text link to the sister shop: the whole sentence is the link (same tab, no rel, like the
 *  sister-site strip). */
export default function ShopLink({ lang, path, text, className = '' }: Props) {
  return (
    <a
      href={shopUrl(path, lang)}
      hrefLang={lang}
      className={
        'group inline-flex items-center min-h-11 font-sans text-[15px] font-semibold ' +
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 ' +
        className
      }
    >
      <span className="text-brand group-hover:underline underline-offset-2">
        {text}: <span className="font-normal text-ink-mid">{SHOP_HOST}</span>{' '}
        <span aria-hidden="true">→</span>
      </span>
    </a>
  );
}
