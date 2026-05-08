import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const SESSION_KEY = 'kv_v2_intro_seen';
const TOTAL_MS = 2400;

/**
 * IntroOverlay — sayfa açılışında kısa cinematic perde-ayrılma efekti.
 *
 * Akış:
 *   0.0s — full siyah perde, ortada brand-color hairline (yarık)
 *   0.4s — yarık genişler, sol/sağ yarımlar dışarı kayar
 *   1.0s — chisel arkada zaten orbital animasyon başlamış, görünür hale gelir
 *   1.4s — "KERVAN HEAT" italic Fraunces brand fade-in/out
 *   2.4s — overlay tamamen unmount, sayfa serbest
 *
 * Session başına bir kez (sessionStorage gate). prefers-reduced-motion
 * bypass — overlay anında görünmez, page direkt yüklenir.
 *
 * Mühendis teması yok: grid/CAD/blueprint/measurement aesthetic'i
 * kullanılmadı. Sadece dark perde + ince brand-color hairline + büyük
 * italic serif tipografi.
 */
export default function IntroOverlay() {
  const reduced = useReducedMotion();
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return sessionStorage.getItem(SESSION_KEY) !== '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!show) return;
    if (reduced) {
      // Reduced motion: hiç gösterme, flag kaydet, çık
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ }
      setShow(false);
      return;
    }
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ }

    // Body scroll'u intro süresince kilitle
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    const id = setTimeout(() => setShow(false), TOTAL_MS);
    return () => {
      clearTimeout(id);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [show, reduced]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Sol perde — sola doğru kayıp ekrandan çıkar */}
          <motion.div
            className="absolute top-0 left-0 h-full w-1/2 bg-bg"
            initial={{ x: 0 }}
            animate={{ x: '-100%' }}
            transition={{ delay: 0.4, duration: 1.2, ease: [0.7, 0, 0.3, 1] }}
          />
          {/* Sağ perde — sağa doğru kayıp ekrandan çıkar */}
          <motion.div
            className="absolute top-0 right-0 h-full w-1/2 bg-bg"
            initial={{ x: 0 }}
            animate={{ x: '100%' }}
            transition={{ delay: 0.4, duration: 1.2, ease: [0.7, 0, 0.3, 1] }}
          />

          {/* Yarık — perdelerin tam ortasında ince brand-color line.
              Önce çıkar, perde açılırken parlar, sonra kaybolur. */}
          <motion.div
            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-brand"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{
              scaleY: [0, 1, 1, 0.4],
              opacity: [0, 1, 0.8, 0],
            }}
            transition={{
              duration: 1.6,
              times: [0, 0.18, 0.5, 1],
              ease: [0.7, 0, 0.3, 1],
            }}
            style={{ originY: 0.5 }}
          />

          {/* Brand text — perde açılırken belirir, kısa süre durur, fade out */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 1, 1, 0] }}
            transition={{
              duration: 2.4,
              times: [0, 0.45, 0.6, 0.85, 1],
            }}
          >
            <h1 className="font-serif italic text-[clamp(40px,8vw,96px)] text-ink leading-none tracking-tight">
              Kervan Heat
            </h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
