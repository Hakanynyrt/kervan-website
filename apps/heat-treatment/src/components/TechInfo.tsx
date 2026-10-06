import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { SectionHeading } from '@kervan/ui';
import { fadeUp, inViewOnce, staggerContainer, useReducedMotion } from '@kervan/motion';
import type { DictBlock, Lang } from '../types';
import type { TechAuth } from '../lib/use-tech-auth';

interface Props {
  t: DictBlock;
  lang: Lang;
  tech: TechAuth;
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2';

/** Owner-only section. Nothing renders for visitors: the login form appears
 *  only at /#giris, and the content only after the server confirmed a session. */
export default function TechInfo({ t, lang, tech }: Props) {
  // Static (prerendered) mode and reduced motion render the final state.
  const reduce = useReducedMotion();
  if (tech.state === 'authed' && tech.content) {
    const c = tech.content[lang] ?? tech.content.tr;
    if (!c) return null;
    return (
      <section id="teknik-bilgiler" className="py-20 md:py-32">
        <SectionHeading eyebrow={c.eyebrow} title={c.title} aside={c.aside} />

        <motion.div
          className="max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-px bg-hair"
          variants={staggerContainer(0, 0.08)}
          initial={reduce ? false : 'hidden'}
          whileInView="show"
          viewport={inViewOnce}
        >
          {c.groups.map((g) => (
            <motion.div key={g.title} variants={fadeUp} className="bg-bg p-8 md:p-10">
              <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-brand font-medium m-0 mb-6">
                {g.title}
              </h3>
              <dl className="m-0 flex flex-col gap-5">
                {g.rows.map((r) => (
                  <div key={r.k} className="flex flex-col gap-1">
                    <dt className="font-sans text-xs tracking-[0.16em] uppercase text-ink-soft">
                      {r.k}
                    </dt>
                    <dd className="font-serif text-2xl text-ink m-0">{r.v}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          ))}
        </motion.div>

        <div className="max-w-[1280px] mx-auto px-6 md:px-8 mt-8">
          <button
            type="button"
            onClick={() => void tech.logout()}
            className={`font-sans text-sm text-ink-mid hover:text-ink underline underline-offset-4 ${focusRing}`}
          >
            {t.techUi.logout}
          </button>
        </div>
      </section>
    );
  }

  if (tech.loginRequested && tech.state !== 'unknown') return <LoginForm t={t} tech={tech} />;
  return null;
}

function LoginForm({ t, tech }: { t: DictBlock; tech: TechAuth }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !password) return;
    setBusy(true);
    setError(null);
    const r = await tech.login(password);
    setBusy(false);
    setPassword('');
    if (r === 'wrong') setError(t.techUi.wrong);
    else if (r === 'not_configured') setError(t.techUi.notConfigured);
    else if (r === 'error') setError(t.techUi.error);
  };

  return (
    <section id="giris" className="py-20 md:py-32">
      <SectionHeading eyebrow={t.techUi.eyebrow} title={t.techUi.loginTitle} />
      <form onSubmit={onSubmit} className="max-w-[420px] mx-auto px-6 md:px-8 flex flex-col gap-4">
        <label
          htmlFor="tech-pw"
          className="font-sans text-xs tracking-[0.16em] uppercase text-ink-soft"
        >
          {t.techUi.passwordLabel}
        </label>
        <input
          id="tech-pw"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`bg-bg-soft border border-hair-2 px-4 py-3 font-sans text-ink ${focusRing}`}
        />
        <button
          type="submit"
          disabled={busy || !password}
          className={`bg-brand text-bg px-5 py-3 font-sans text-sm hover:bg-brand-hi transition-colors disabled:opacity-60 ${focusRing}`}
        >
          {busy ? t.techUi.sending : t.techUi.submit}
        </button>
        {error && (
          <p role="alert" className="font-sans text-sm text-err m-0">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
