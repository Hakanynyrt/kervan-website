import { useEffect, useId } from 'react';

interface Props {
  /** A schema.org JSON-LD object (or array of objects). Will be
   *  JSON.stringify'd into a `<script type="application/ld+json">` tag
   *  appended to <head>. */
  schema: object | object[];
}

/** Injects JSON-LD into <head> for the lifetime of the component.
 *  Removes the script on unmount so route transitions don't pile up
 *  stale schemas. Use one `<JsonLd>` per logical schema unit (e.g. one
 *  for Product, one for BreadcrumbList) for clarity. */
export function JsonLd({ schema }: Props) {
  const id = useId();

  useEffect(() => {
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.dataset.kervanJsonld = id;
    el.textContent = JSON.stringify(schema);
    document.head.appendChild(el);
    return () => {
      el.remove();
    };
  }, [id, schema]);

  return null;
}
