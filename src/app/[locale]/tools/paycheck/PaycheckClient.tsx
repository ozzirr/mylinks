'use client';

import {useEffect, useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {computePaycheck, formatEUR} from '@/lib/paycheck';
import {getBrowserClient} from '@/lib/supabase';
import AuthTrigger from '@/components/AuthTrigger';

export default function PaycheckClient() {
  const t = useTranslations('tools.paycheck');

  const [gross, setGross] = useState(35000);
  const [months, setMonths] = useState<13 | 14>(13);
  const [dependents, setDependents] = useState(0);
  const [spouse, setSpouse] = useState(false);
  const [email, setEmail] = useState('');
  const [authedEmail, setAuthedEmail] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [used, setUsed] = useState(false);

  useEffect(() => {
    setUsed(localStorage.getItem('2erre.paycheck.used') === '1');
  }, []);

  useEffect(() => {
    (async () => {
      const supabase = await getBrowserClient();
      if (!supabase) return;
      const {data} = await supabase.auth.getUser();
      if (data.user?.email) {
        setAuthedEmail(data.user.email);
        setEmail(data.user.email);
      }
    })();
  }, []);

  const locked = used && !authedEmail;

  function markUsed() {
    if (!used) {
      localStorage.setItem('2erre.paycheck.used', '1');
      setUsed(true);
    }
  }

  const result = useMemo(
    () => computePaycheck({grossAnnual: gross, months, dependents, spouseDependent: spouse}),
    [gross, months, dependents, spouse]
  );

  async function saveReport(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus('sending');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email,
          tool: 'paycheck',
          payload: {gross, months, dependents, spouse, result}
        })
      });
      setSaveStatus(res.ok ? 'ok' : 'err');
    } catch {
      setSaveStatus('err');
    }
  }

  return (
    <section className="pt-32 pb-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-dim)] mb-4">
          2erre · Tools
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--color-text-strong)] leading-tight">
          {t('title')}
        </h1>
        <p className="mt-3 text-[var(--color-text-soft)]">{t('subtitle')}</p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="card p-8 space-y-5">
            <div>
              <label className="label">{t('fields.gross')}</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={10000}
                  max={150000}
                  step={500}
                  value={gross}
                  onChange={(e) => { if (locked) return; setGross(Number(e.target.value)); markUsed(); }}
                  className="flex-1 accent-[var(--color-accent)] disabled:opacity-50"
                  disabled={locked}
                />
                <input
                  type="number"
                  value={gross}
                  onChange={(e) => { if (locked) return; setGross(Number(e.target.value) || 0); markUsed(); }}
                  className="field w-32 disabled:opacity-50"
                  disabled={locked}
                />
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-dim)]">
                {formatEUR(gross)}
              </div>
            </div>

            <div>
              <label className="label">Mensilità</label>
              <div className="flex gap-2">
                {([13, 14] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { if (locked) return; setMonths(m); markUsed(); }}
                disabled={locked}
                    className={`btn flex-1 ${months === m ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {m === 13 ? t('months13') : t('months14')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">{t('fields.dependents')}</label>
              <input
                type="number"
                min={0}
                max={10}
                value={dependents}
                onChange={(e) => { if (locked) return; setDependents(Math.max(0, Number(e.target.value) || 0)); markUsed(); }}
                className="field disabled:opacity-50"
                disabled={locked}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-[var(--color-text-soft)]">
              <input
                type="checkbox"
                checked={spouse}
                onChange={(e) => { if (locked) return; setSpouse(e.target.checked); markUsed(); }}
                className="accent-[var(--color-accent)]"
                disabled={locked}
              />
              {t('fields.spouse')}
            </label>
          </div>

          <div className="card p-8 flex flex-col relative">
            {locked && (
              <div className="absolute inset-0 z-10 rounded-[inherit] backdrop-blur-sm bg-black/40 flex flex-col items-center justify-center text-center p-6">
                <p className="text-sm text-[var(--color-text-soft)] max-w-xs">{t('locked') || 'Registrati per continuare a usare lo strumento.'}</p>
                <AuthTrigger mode="signup" className="btn btn-primary mt-4">{t('signup') || 'Registrati gratis'} →</AuthTrigger>
              </div>
            )}
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-dim)]">
              {t('results.title')}
            </div>
            <div className="mt-4">
              <div className="text-5xl font-semibold text-[var(--color-text-strong)]">
                {formatEUR(result.netMonthly)}
              </div>
              <div className="text-sm text-[var(--color-accent)] uppercase tracking-wider mt-1">
                {t('results.net')}
              </div>
            </div>

            <dl className="mt-8 space-y-3 text-sm">
              <Row label={t('results.netAnnual')} value={formatEUR(result.netAnnual)} />
              <Row label={t('results.tax')} value={formatEUR(result.irpefAnnual)} />
              <Row label={t('results.social')} value={formatEUR(result.inpsAnnual)} />
              <Row label={t('results.employer')} value={formatEUR(result.employerCost)} emphasis />
            </dl>

            <p className="mt-6 text-xs text-[var(--color-text-dim)] leading-relaxed">
              {t('disclaimer')}
            </p>
          </div>
        </div>

        {authedEmail ? (
          <form onSubmit={saveReport} className="mt-6 card p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1 w-full">
                <label className="label">{t('save')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field bg-[var(--color-ink-1)] text-[var(--color-text-dim)] cursor-not-allowed opacity-70"
                  readOnly
                  aria-readonly
                />
                <div className="mt-1 text-xs text-[var(--color-text-dim)]">
                  <Link href="/account" className="hover:text-[var(--color-accent)]">
                    Modifica email →
                  </Link>
                </div>
              </div>
              <button
                type="submit"
                disabled={saveStatus === 'sending'}
                className="btn btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('saveCta')} →
              </button>
            </div>
            {saveStatus !== 'idle' && (
              <div className="mt-3 text-sm">
                {saveStatus === 'sending' && <span className="text-[var(--color-text-dim)]">…</span>}
                {saveStatus === 'ok' && <span className="text-[var(--color-accent)]">{t('saveOk')}</span>}
                {saveStatus === 'err' && <span className="text-red-400">{t('saveErr')}</span>}
              </div>
            )}
          </form>
        ) : (
          <div className="mt-6 card p-6 text-center">
            <p className="text-sm text-[var(--color-text-soft)]">{t('locked')}</p>
            <AuthTrigger mode="signup" className="btn btn-dark mt-4">{t('signup')} →</AuthTrigger>
          </div>
        )}
      </div>
    </section>
  );
}

function Row({label, value, emphasis}: {label: string; value: string; emphasis?: boolean}) {
  return (
    <div className="flex items-baseline justify-between border-b border-[var(--color-line)] pb-2">
      <dt className="text-[var(--color-text-soft)]">{label}</dt>
      <dd className={emphasis ? 'text-[var(--color-text-strong)] font-semibold' : 'text-[var(--color-text-strong)]'}>
        {value}
      </dd>
    </div>
  );
}
