import type { ReactNode } from 'react';
import { cn } from '../lib/cn.js';

type Tone = 'brand' | 'neutral' | 'ok' | 'err';
type Size = 'sm' | 'md';

interface Props {
  children: ReactNode;
  tone?: Tone;
  size?: Size;
  className?: string;
}

const toneClasses: Record<Tone, string> = {
  brand: 'bg-brand-soft text-brand border-brand/30',
  neutral: 'bg-bg-soft text-ink-mid border-hair',
  ok: 'bg-ok/10 text-ok border-ok/30',
  err: 'bg-err/10 text-err border-err/30',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-2 py-0.5 text-[10px] tracking-[0.18em]',
  md: 'px-3 py-1 text-eyebrow tracking-[0.2em]',
};

export function Badge({ children, tone = 'neutral', size = 'md', className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-sans font-medium uppercase rounded-pill border',
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
