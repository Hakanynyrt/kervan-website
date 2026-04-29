import { motion } from 'framer-motion';
import type { DictBlock, CatalogGroup } from '../types';
import { fadeUp, staggerContainer, inViewOnce } from '../lib/motion';

interface Props {
  t: DictBlock;
}

/**
 * CatalogContent — editorial catalog body.
 * Header + print button + groups (her grup bir tablo).
 */
export default function CatalogContent({ t }: Props) {
  return (
    <section className="catalog pt-32 md:pt-40 pb-24 md:pb-32">
      <div className="max-w-[1280px] mx-auto px-6 md:px-8">
        {/* Header */}
        <motion.div
          className="flex flex-col gap-6 mb-16 md:mb-24 max-w-[820px]"
          variants={staggerContainer(0, 0.08)}
          initial="hidden"
          animate="show"
        >
          <motion.a
            href="/"
            variants={fadeUp}
            className="font-sans text-sm text-ink-soft hover:text-ink transition-colors w-fit"
          >
            {t.catalog.backToHome}
          </motion.a>

          <motion.div variants={fadeUp} className="font-eyebrow">
            {t.catalog.eyebrow}
          </motion.div>

          <motion.h1 variants={fadeUp} className="font-h1 italic text-ink">
            {t.catalog.title}
          </motion.h1>

          <motion.p variants={fadeUp} className="font-serif italic text-xl text-ink-mid leading-relaxed max-w-[44ch]">
            {t.catalog.sub}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-2 no-print">
            <button
              type="button"
              onClick={() => window.print()}
              className="border border-ink text-ink px-7 py-3 font-sans text-sm tracking-wide hover:bg-ink hover:text-bg transition-colors"
            >
              {t.catalog.printBtn} →
            </button>
          </motion.div>
        </motion.div>

        {/* Groups */}
        <div className="flex flex-col gap-20 md:gap-28">
          {t.catalog.groups.map((g, i) => (
            <Group key={i} index={i} group={g} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface GroupProps {
  index: number;
  group: CatalogGroup;
}

function Group({ index, group }: GroupProps) {
  return (
    <motion.div
      variants={staggerContainer(0, 0.06)}
      initial="hidden"
      whileInView="show"
      viewport={inViewOnce}
      className="flex flex-col gap-6"
    >
      <motion.div variants={fadeUp} className="flex items-baseline gap-4 border-b border-hair pb-4">
        <span className="font-sans text-xs tracking-widest text-ink-soft tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h2 className="font-h3 italic text-ink">{group.name}</h2>
        <span className="ml-auto font-sans text-xs tracking-widest tabular-nums text-ink-soft">
          × {group.rows.length}
        </span>
      </motion.div>

      <motion.div variants={fadeUp} className="overflow-x-auto -mx-6 md:mx-0">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-hair">
              {group.headers.map((h, hi) => (
                <th
                  key={hi}
                  scope="col"
                  className="text-left py-3 px-4 md:px-6 first:pl-6 md:first:pl-0 font-sans text-xs tracking-widest uppercase text-ink-soft font-medium"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {group.rows.map((row, ri) => (
              <tr key={ri} className="border-b border-hair/60 hover:bg-bg-soft/50 transition-colors">
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={
                      'py-4 px-4 md:px-6 first:pl-6 md:first:pl-0 font-serif text-base text-ink leading-relaxed' +
                      (ci === 0 ? ' tabular-nums tracking-wide' : '')
                    }
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
}
