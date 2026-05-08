import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn.js';

interface Props {
  items: ReactNode[];
  /** Saniye cinsinden tek tur süresi. Düşük değer = hızlı. Default: 60s. */
  duration?: number;
  className?: string;
  itemClassName?: string;
  /** Custom separator between items. Defaults to a small rotated brand square. */
  separator?: ReactNode;
}

const defaultSeparator = (
  <span className="w-2 h-2 bg-brand rotate-45 flex-shrink-0" aria-hidden="true" />
);

/** Sonsuz yatay kayan şerit — atelier manifesto.
 *  Liste seamless döngü için iki kere render olur. */
export function Marquee({
  items,
  duration = 60,
  className,
  itemClassName,
  separator = defaultSeparator,
}: Props) {
  const doubled = [...items, ...items];

  return (
    <div
      className={cn('overflow-hidden whitespace-nowrap py-6', className)}
      aria-hidden="true"
    >
      <motion.div
        className="inline-flex gap-12"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration, ease: 'linear', repeat: Infinity }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className={cn(
              'inline-flex items-center gap-12 font-serif italic text-2xl md:text-3xl text-ink-mid',
              itemClassName,
            )}
          >
            {separator}
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
