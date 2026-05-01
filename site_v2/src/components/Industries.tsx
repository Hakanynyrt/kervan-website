import { motion } from 'framer-motion';
import type { DictBlock } from '../types';
import { staggerContainer, fadeUp, inViewOnce } from '../lib/motion';
import SectionHead from './SectionHead';
import Marquee from './ui/Marquee';

interface Props {
  t: DictBlock;
}

export default function Industries({ t }: Props) {
  return (
    <section id="industries" className="min-h-dvh snap-start flex flex-col justify-center py-16 md:py-24">
      <SectionHead
        eyebrow={t.industries.eyebrow}
        title={t.industries.title}
        aside={t.industries.aside}
      />

      <motion.ul
        className="max-w-[1280px] mx-auto px-8 border-t border-hair list-none m-0 p-0"
        variants={staggerContainer(0, 0.08)}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
      >
        {t.industries.items.map((it, i) => (
          <motion.li
            key={i}
            variants={fadeUp}
            className="group grid grid-cols-12 gap-4 md:gap-8 items-baseline border-b border-hair py-8 md:py-10 cursor-default"
          >
            <span className="col-span-2 md:col-span-1 font-sans text-sm tracking-widest text-ink-soft">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="col-span-10 md:col-span-4 font-serif italic text-3xl md:text-4xl text-ink relative">
              {it.name}
              <span className="absolute -bottom-1 left-0 right-full h-px bg-brand transition-all duration-500 ease-out group-hover:right-0" />
            </span>
            <span className="col-span-12 md:col-span-7 font-sans text-base text-ink-mid leading-relaxed">
              {it.desc}
            </span>
          </motion.li>
        ))}
      </motion.ul>

      {/* Manifesto marquee — atelier signal strip */}
      <div className="mt-24 md:mt-32 border-t border-b border-hair">
        <Marquee items={t.industries.marquee} duration={70} />
      </div>
    </section>
  );
}
