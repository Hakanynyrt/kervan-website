import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface Props {
  children: ReactNode | string;
  className?: string;
}

/** Scroll-progress destekli kelime/satır reveal.
 *  Kullanıcı section'a girdikçe metin parça parça koyulaşır.
 *  Tek bir text bloğu için tasarlandı (paragraf seviyesi). */
export default function ScrollReveal({ children, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'start 0.25'],
  });

  // Kelime listesi
  const text = typeof children === 'string' ? children : '';
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <p ref={ref} className={'font-serif italic text-xl md:text-2xl text-ink leading-relaxed ' + className}>
      {words.map((w, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return <Word key={i} progress={scrollYProgress} range={[start, end]}>{w}</Word>;
      })}
    </p>
  );
}

interface WordProps {
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
  range: [number, number];
  children: string;
}

function Word({ progress, range, children }: WordProps) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <>
      <motion.span style={{ opacity }} className="inline-block">
        {children}
      </motion.span>
      {' '}
    </>
  );
}
