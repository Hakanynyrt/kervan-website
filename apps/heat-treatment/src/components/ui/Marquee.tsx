import { motion } from 'framer-motion';

interface Props {
  items: string[];
  /** Saniye cinsinden tek tur süresi. Düşük değer = hızlı. Default: 60s. */
  duration?: number;
  className?: string;
}

/** Sonsuz yatay kayan şerit — atelier manifesto.
 *  CSS animation kullanmaz; framer-motion x: %50 animate eder.
 *  Liste iki kere render olur ki seamless döngü sağlansın. */
export default function Marquee({ items, duration = 60, className = '' }: Props) {
  // Liste duplikasyonu seamless loop için
  const doubled = [...items, ...items];

  return (
    <div className={'overflow-hidden whitespace-nowrap py-6 ' + className} aria-hidden="true">
      <motion.div
        className="inline-flex gap-12"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          duration,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-12 font-serif italic text-2xl md:text-3xl text-ink-mid"
          >
            <span className="w-2 h-2 bg-brand rotate-45 flex-shrink-0" aria-hidden="true" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
