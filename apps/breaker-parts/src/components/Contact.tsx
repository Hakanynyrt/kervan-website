import type { DictBlock, Lang } from '../types';
import { H2, SECTION } from '../lib/ui';
import ContactBlock from './ContactBlock';

interface Props {
  t: DictBlock;
  lang: Lang;
}

/** İletişim (`#contact`) on the home page: heading and lead over the shared quote panel + form. */
export default function Contact({ t, lang }: Props) {
  return (
    <section id="contact" aria-labelledby="contact-title" className={SECTION}>
      <ContactBlock
        t={t}
        lang={lang}
        titleId="contact-title"
        head={
          <>
            <h2 id="contact-title" className={H2}>
              {t.contact.title}
            </h2>
            <p className="m-0 mt-3 mb-7 text-base min-[721px]:text-[17px] text-ink-mid">
              {t.contact.sub}
            </p>
          </>
        }
      />
    </section>
  );
}
