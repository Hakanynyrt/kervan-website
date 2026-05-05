import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn.js';

type Underline = 'always' | 'hover' | 'none';

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> {
  href: string;
  external?: boolean;
  underline?: Underline;
  children: ReactNode;
}

const underlineClasses: Record<Underline, string> = {
  always: 'underline underline-offset-4 decoration-1',
  hover:
    'relative after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-px after:bg-current ' +
    'after:scale-x-0 after:origin-left after:transition-transform after:duration-300 after:ease-soft ' +
    'hover:after:scale-x-100',
  none: '',
};

export function Link({
  href,
  external = false,
  underline = 'hover',
  children,
  className,
  ...rest
}: Props) {
  const externalProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  return (
    <a
      href={href}
      className={cn(
        'inline text-current font-sans transition-colors duration-200 ease-soft hover:text-brand',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        underlineClasses[underline],
        className,
      )}
      {...externalProps}
      {...rest}
    >
      {children}
    </a>
  );
}
