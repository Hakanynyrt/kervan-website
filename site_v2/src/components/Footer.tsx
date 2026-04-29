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

        <nav className="flex gap-6 font-sans text-sm text-ink-mid">
          <a href="/kvkk.html" className="hover:text-ink transition-colors">{t.footer.kvkk}</a>
          <a href="mailto:info@kervanheat.com" className="hover:text-ink transition-colors">info@kervanheat.com</a>
          <a href="tel:+905316693734" className="hover:text-ink transition-colors">+90 531 669 37 34</a>
        </nav>

        <div className="font-sans text-xs text-ink-soft tracking-wide">{t.footer.rights}</div>
      </div>
    </footer>
  );
}
