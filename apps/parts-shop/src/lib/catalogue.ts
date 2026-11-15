/**
 * The product catalogue as a PDF, one per language, in `public/katalog/`. The file name carries the
 * edition (year-month): a changed PDF gets a new name, here and in `public/`, because `_headers`
 * caches the folder immutable. The size in the dict's link text is checked against the file
 * (catalogue.test.ts).
 */
export const CATALOGUE_PDF = {
  tr: '/katalog/krv-katalog-2026-11-tr.pdf',
  en: '/katalog/krv-catalogue-2026-11-en.pdf',
} as const;
