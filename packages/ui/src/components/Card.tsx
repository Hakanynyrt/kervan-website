import type { ElementType, ReactNode } from 'react';
import { cn } from '../lib/cn.js';

type Padding = 'sm' | 'md' | 'lg';

interface Props {
  children: ReactNode;
  padding?: Padding;
  hover?: boolean;
  as?: ElementType;
  className?: string;
}

const padClasses: Record<Padding, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8 md:p-10',
};

export function Card({ children, padding = 'md', hover = false, as: Tag = 'div', className }: Props) {
  return (
    <Tag
      className={cn(
        'bg-bg-soft border border-hair rounded-md',
        padClasses[padding],
        hover && 'transition-transform duration-300 ease-soft hover:-translate-y-1.5 hover:border-hair-strong',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
