import { motion } from 'framer-motion';
import { staggerContainer, lineReveal } from './lib/motion';

export default function App() {
  return (
    <main className="min-h-screen bg-bg flex flex-col items-center justify-center px-8 py-24 gap-8">
      <div className="font-eyebrow">Site_v2 · Mood C — Atelier Editorial</div>

      <motion.h1
        className="font-display text-ink max-w-[18ch] text-center"
        variants={staggerContainer(0.2, 0.18)}
        initial="hidden"
        animate="show"
      >
        {'Kırıcıyı ayakta tutan parçalar.'.split(' ').map((w, i) => (
          <span
            key={i}
            style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'baseline' }}
          >
            <motion.span
              variants={lineReveal}
              style={{ display: 'inline-block', willChange: 'transform' }}
            >
              {w}
            </motion.span>
            {' '}
          </span>
        ))}
      </motion.h1>

      <p className="font-italic-quote text-ink-mid text-2xl max-w-[34ch] text-center">
        Yirmi altı yıl, ateşin ve metalin hikayesi.
      </p>

      <div className="flex gap-4 mt-4">
        <span className="px-4 py-1 border border-hair text-ink-mid text-sm font-sans">Bg #F4F1EB</span>
        <span className="px-4 py-1 bg-ink text-bg text-sm font-sans">Ink #2D1F15</span>
        <span className="px-4 py-1 bg-brand text-bg text-sm font-sans">Brand #B8460E</span>
      </div>
    </main>
  );
}
