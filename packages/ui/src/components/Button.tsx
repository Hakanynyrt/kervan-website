import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn.js';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

type ButtonProps =
  | (CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & { href?: undefined })
  | (CommonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> & { href: string; external?: boolean });

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand text-bg hover:bg-brand-hi active:bg-brand-lo',
  secondary: 'bg-brand-soft text-brand hover:bg-brand-soft/80',
  ghost: 'bg-transparent text-ink hover:bg-bg-soft',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-6 py-2.5 text-base',
  lg: 'px-8 py-3.5 text-lg',
};

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-pill font-sans font-medium ' +
  'transition-colors duration-200 ease-soft ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', loading, children, className } = props;
  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);
  const content = loading ? <span aria-live="polite">…</span> : children;

  if ('href' in props && props.href !== undefined) {
    const { href, external, variant: _v, size: _s, loading: _l, children: _c, className: _cn, ...rest } = props;
    void _v; void _s; void _l; void _c; void _cn;
    const anchorExtras = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
    return (
      <a href={href} className={classes} {...anchorExtras} {...rest}>
        {content}
      </a>
    );
  }

  const { variant: _v, size: _s, loading: _l, children: _c, className: _cn, ...rest } = props;
  void _v; void _s; void _l; void _c; void _cn;
  return (
    <button type="button" className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {content}
    </button>
  );
}
