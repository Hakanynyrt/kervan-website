import type { ReactNode } from 'react';
import { InternationalizationProvider } from '@astryxdesign/core/i18n';
import trTR from '@astryxdesign/core/locales/tr-TR.json';

/** Astryx's own strings in the page language. Same tree on the server and the client. */
export function AstryxProvider({ lang, children }: { lang: 'tr' | 'en'; children: ReactNode }) {
  return (
    <InternationalizationProvider
      locale={lang === 'tr' ? 'tr-TR' : 'en'}
      messages={{ 'tr-TR': trTR }}
    >
      {children}
    </InternationalizationProvider>
  );
}
