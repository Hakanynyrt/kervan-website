import type { DictBlock } from '../types';

interface Props {
  t: DictBlock;
}

export default function Footer({ t }: Props) {
  return (
    <footer className="border-t border-hair">
      <div className="max-w-[1280px] mx-auto px-8 py-12 flex flex-col md:flex-row gap-6 md:gap-12 items-start md:items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-serif italic text-3xl text-ink leading-none">K</span>
          <div className="flex flex-col">
            <span className="font-sans text-sm font-medium text-ink">{t.footer.brand}</span>
            <span className="font-serif italic text-sm text-ink-soft">{t.footer.tag}</span>
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm text-ink-mid items-center">
          <a
            href="https://www.instagram.com/kervanmakina/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram @kervanmakina"
            className="inline-flex items-center gap-2 hover:text-ink transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            @kervanmakina
          </a>
          <a
            href="https://wa.me/905316693734"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp +90 531 669 37 34"
            className="inline-flex items-center gap-2 hover:text-ink transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            +90 531 669 37 34
          </a>
          <a href="/kvkk.html" className="hover:text-ink transition-colors">{t.footer.kvkk}</a>
          <a href="mailto:info@kervanheat.com" className="hover:text-ink transition-colors">info@kervanheat.com</a>
        </nav>

        <div className="font-sans text-xs text-ink-soft tracking-wide">{t.footer.rights}</div>
      </div>
    </footer>
  );
}
