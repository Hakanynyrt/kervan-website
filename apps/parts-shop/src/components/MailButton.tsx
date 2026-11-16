import { useState, type MouseEvent } from 'react';
import { Button } from '@astryxdesign/core/Button';
import type { Dict } from '../lib/dict';
import { ORDER_EMAIL } from '../lib/site';
import { FOCUS } from './Layout';

interface Props {
  t: Dict;
  label: string;
  subject?: string;
  body?: string;
  className?: string;
  size?: 'lg';
  /** Runs first; a click it cancels (the cart's missing country) shows no help line. */
  onClick?: (e: MouseEvent) => void;
  'aria-disabled'?: boolean;
  'data-kv-conversion'?: 'form';
}

const copyLink = `min-h-11 cursor-pointer border-0 bg-transparent p-0 font-sans text-sm text-ink underline underline-offset-2 hover:no-underline ${FOCUS}`;

/**
 * An e-mail request button. It stays a `mailto:` link, but a computer with no mail program set
 * up does nothing on such a link (owner, 2026-11-16: "basınca bir şey gelmiyor"). So after a
 * click a line under the buttons gives the address as text and copies it, and the request text,
 * for pasting into webmail. `display: contents` keeps the button a direct item of the row.
 */
export function MailButton({ t, label, subject, body, onClick, ...rest }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<'addr' | 'text' | null>(null);
  const query = [
    subject && `subject=${encodeURIComponent(subject)}`,
    body && `body=${encodeURIComponent(body)}`,
  ]
    .filter(Boolean)
    .join('&');
  const copy = (what: 'addr' | 'text') => {
    const value = what === 'addr' ? ORDER_EMAIL : [subject, body].filter(Boolean).join('\n\n');
    navigator.clipboard?.writeText(value).then(
      () => setCopied(what),
      () => setCopied(null),
    );
  };
  const m = t.mailHelp;
  return (
    <span className="contents">
      <Button
        href={`mailto:${ORDER_EMAIL}${query ? `?${query}` : ''}`}
        label={label}
        variant="secondary"
        onClick={(e: MouseEvent) => {
          onClick?.(e);
          if (!e.defaultPrevented) setOpen(true);
        }}
        {...rest}
      />
      {open && (
        <span
          role="status"
          className="flex basis-full flex-wrap items-center gap-x-4 font-sans text-sm text-ink-mid"
        >
          <span>
            {m.note} <b className="font-semibold text-ink select-all">{ORDER_EMAIL}</b>
          </span>
          <button type="button" className={copyLink} onClick={() => copy('addr')}>
            {copied === 'addr' ? m.copied : m.copyAddr}
          </button>
          {body && (
            <button type="button" className={copyLink} onClick={() => copy('text')}>
              {copied === 'text' ? m.copied : m.copyText}
            </button>
          )}
        </span>
      )}
    </span>
  );
}
