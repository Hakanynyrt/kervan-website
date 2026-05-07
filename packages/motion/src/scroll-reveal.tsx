import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';

interface Props {
  /** Plain string content (split into words) or a single React node. */
  children: ReactNode | string;
  /** Class names applied to the wrapping <p>. Consumer owns presentation
   *  (font, size, color) — this primitive is purely a scroll-reveal driver. */
  className?: string;
  /** Min opacity each word starts at. Default 0.18. */
  baseOpacity?: number;
}

/** Scroll-progress destekli kelime/satır reveal.
 *  Kullanıcı section'a girdikçe metin parça parça koyulaşır.
 *  Tek bir text bloğu için tasarlandı (paragraf seviyesi).
 *  Stilsizdir — consumer className ile font/size/color verir. */
export function ScrollReveal({ children, className, baseOpacity = 0.18 }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'start 0.25'],
  });

  if (typeof children !== 'string') {
    return (
      <p ref={ref} className={className}>
        {children}
      </p>
    );
  }

  const words = children.split(/\s+/).filter(Boolean);

  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return (
          <Word key={i} progress={scrollYProgress} range={[start, end]} baseOpacity={baseOpacity}>
            {w}
          </Word>
        );
      })}
    </p>
  );
}

interface WordProps {
  progress: MotionValue<number>;
  range: [number, number];
  baseOpacity: number;
  children: string;
}

function Word({ progress, range, baseOpacity, children }: WordProps) {
  const opacity = useTransform(progress, range, [baseOpacity, 1]);
  return (
    <>
      <motion.span style={{ opacity }} className="inline-block">
        {children}
      </motion.span>{' '}
    </>
  );
}
