import { useEffect } from 'react';

interface Props {
  title: string;
  description?: string;
}

/** Sets `document.title` and (optionally) the `<meta name="description">`
 *  while the component is mounted. Restores the previous values on unmount
 *  so route transitions return to the index.html-defined defaults. */
export function UseDocTitle({ title, description }: Props) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    let descEl: HTMLMetaElement | null = null;
    let prevDesc: string | null = null;
    if (description) {
      descEl = document.querySelector('meta[name="description"]');
      if (descEl) {
        prevDesc = descEl.getAttribute('content');
        descEl.setAttribute('content', description);
      }
    }

    return () => {
      document.title = prevTitle;
      if (descEl && prevDesc !== null) descEl.setAttribute('content', prevDesc);
    };
  }, [title, description]);

  return null;
}
