import type { ElementType, ReactNode } from 'react';
import { cn } from '../lib/cn.js';

interface Props {
  children: ReactNode;
  as?: ElementType;
  /** Use the wider 1440px max-width (e.g. for hero/full-bleed sections). */
  wide?: boolean;
  className?: string;
}

export function Container({ children, as: Tag = 'div', wide = false, className }: Props) {
  return (
    <Tag
      className={cn(
        'mx-auto w-full px-6 md:px-8',
        wide ? 'max-w-[1440px]' : 'max-w-[1280px]',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
