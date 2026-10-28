import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { fadeUp, inViewOnce, staggerContainer, useReducedMotion } from '@kervan/motion';
import type { DictBlock, Lang } from '../types';
import type { TechAuth } from '../lib/use-tech-auth';
import { BTN_PRIMARY, H2, SECTION, SEC_HEAD, SEC_LEAD, WRAP } from '../lib/ui';

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
      <section
        id="teknik-bilgiler"
        aria-labelledby="teknik-bilgiler-title"
        className={`${SECTION} bg-bg border-t border-hair`}
      >
        <div className={`${WRAP} ${SEC_HEAD}`}>
          <h2 id="teknik-bilgiler-title" className={H2}>
            {c.title}
          </h2>
          <p className={SEC_LEAD}>{c.aside}</p>
        </div>

        <motion.div
          className={`${WRAP} grid grid-cols-1 lg:grid-cols-3 gap-4`}
          variants={staggerContainer(0, 0.08)}
          initial={reduce ? false : 'hidden'}
          whileInView="show"
          viewport={inViewOnce}
        >
          {c.groups.map((g) => (
            <motion.div
              key={g.title}
              variants={fadeUp}
              className="bg-panel border border-hair rounded-[4px] p-6 min-[721px]:p-8"
            >
              <h3 className="m-0 mb-5 font-sans text-[19px] font-bold text-ink">{g.title}</h3>
              <dl className="m-0 flex flex-col gap-5">
                {g.rows.map((r) => (
                  <div key={r.k} className="flex flex-col gap-1">
                    <dt className="font-sans text-sm text-ink-mid">{r.k}</dt>
                    <dd className="m-0 font-sans text-xl font-semibold text-ink">{r.v}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          ))}
        </motion.div>

        <div className={`${WRAP} mt-6`}>
          <button
            type="button"
            onClick={() => void tech.logout()}
            className={`min-h-11 font-sans text-sm text-ink-mid hover:text-ink underline underline-offset-4 ${focusRing}`}
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
    <section
      id="giris"
      aria-labelledby="giris-title"
      className={`${SECTION} bg-bg border-t border-hair`}
    >
      <div className={WRAP}>
        <h2 id="giris-title" className={H2}>
          {t.techUi.title}
        </h2>
        <form onSubmit={onSubmit} className="max-w-[420px] mt-6 flex flex-col gap-3">
          <p className="m-0 font-sans text-base text-ink-mid">{t.techUi.loginTitle}</p>
          <label htmlFor="tech-pw" className="font-sans text-sm font-semibold text-ink">
            {t.techUi.passwordLabel}
          </label>
          <input
            id="tech-pw"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`min-h-12 px-3.5 py-3 rounded-[2px] border border-field-line bg-field font-sans text-base text-ink ${focusRing}`}
          />
          <button
            type="submit"
            disabled={busy || !password}
            className={`${BTN_PRIMARY} ${focusRing}`}
          >
            {busy ? t.techUi.sending : t.techUi.submit}
          </button>
          {error && (
            <p role="alert" className="font-sans text-sm text-err m-0">
              {error}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
