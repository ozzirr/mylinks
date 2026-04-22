'use client';

import {useEffect, useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {computeQuote, formatEUR, type QuoteInput} from '@/lib/quote';
import {getBrowserClient} from '@/lib/supabase';
import AuthTrigger from '@/components/AuthTrigger';

const TYPES: QuoteInput['type'][] = ['landing', 'website', 'ecommerce', 'webapp', 'mobile', 'ai'];
const COMPLEXITIES: QuoteInput['complexity'][] = ['simple', 'medium', 'complex'];
const URGENCIES: QuoteInput['urgency'][] = ['relaxed', 'normal', 'rush'];
const INTEGRATIONS: QuoteInput['integrations'][] = ['none', 'few', 'many'];

const USED_KEY = '2erre.quote.used';

export default function QuoteClient() {
  const t = useTranslations('tools.quote');
  const tPay = useTranslations('tools.paycheck');

  const [type, setType] = useState<QuoteInput['type']>('website');
  const [complexity, setComplexity] = useState<QuoteInput['complexity']>('medium');
  const [urgency, setUrgency] = useState<QuoteInput['urgency']>('normal');
  const [integrations, setIntegrations] = useState<QuoteInput['integrations']>('few');

  const [authedEmail, setAuthedEmail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [used, setUsed] = useState(false);

  useEffect(() => {
    setUsed(localStorage.getItem(USED_KEY) === '1');
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
      localStorage.setItem(USED_KEY, '1');
      setUsed(true);
    }
  }

  const result = useMemo(
    () => computeQuote({type, complexity, urgency, integrations}),
    [type, complexity, urgency, integrations]
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
          tool: 'quote',
          payload: {type, complexity, urgency, integrations, result}
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
          <div className="card p-8 space-y-6">
            <Group label={t('fields.type')}>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map((k) => (
                  <Chip key={k} active={type === k} onClick={() => { if (locked) return; setType(k); markUsed(); }} disabled={locked}>
                    {t(`type.${k}`)}
                  </Chip>
                ))}
              </div>
            </Group>

            <Group label={t('fields.complexity')}>
              <div className="flex gap-2">
                {COMPLEXITIES.map((k) => (
                  <Chip key={k} active={complexity === k} onClick={() => { if (locked) return; setComplexity(k); markUsed(); }} disabled={locked} flex>
                    {t(`complexity.${k}`)}
                  </Chip>
                ))}
              </div>
            </Group>

            <Group label={t('fields.urgency')}>
              <div className="flex gap-2">
                {URGENCIES.map((k) => (
                  <Chip key={k} active={urgency === k} onClick={() => { if (locked) return; setUrgency(k); markUsed(); }} disabled={locked} flex>
                    {t(`urgency.${k}`)}
                  </Chip>
                ))}
              </div>
            </Group>

            <Group label={t('fields.integrations')}>
              <div className="flex gap-2">
                {INTEGRATIONS.map((k) => (
                  <Chip key={k} active={integrations === k} onClick={() => { if (locked) return; setIntegrations(k); markUsed(); }} disabled={locked} flex>
                    {t(`integrations.${k}`)}
                  </Chip>
                ))}
              </div>
            </Group>
          </div>

          <div className="card p-8 flex flex-col relative">
            {locked && (
              <div className="absolute inset-0 z-10 rounded-[inherit] backdrop-blur-sm bg-black/40 flex flex-col items-center justify-center text-center p-6">
                <p className="text-sm text-[var(--color-text-soft)] max-w-xs">{tPay('locked')}</p>
                <AuthTrigger mode="signup" className="btn btn-primary mt-4">{tPay('signup')} →</AuthTrigger>
              </div>
            )}
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-dim)]">
              {t('results.title')}
            </div>
            <div className="mt-4">
              <div className="text-4xl md:text-5xl font-semibold text-[var(--color-text-strong)] leading-tight">
                {formatEUR(result.min)} — {formatEUR(result.max)}
              </div>
              <div className="text-sm text-[var(--color-accent)] uppercase tracking-wider mt-2">
                {t('results.range')}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--color-line)]">
              <div className="text-2xl font-semibold text-[var(--color-text-strong)]">
                {t('results.weeks', {w: result.weeks})}
              </div>
              <div className="text-sm text-[var(--color-text-soft)] mt-1">
                {t('results.duration')}
              </div>
            </div>

            <p className="mt-6 text-sm text-[var(--color-text-soft)] leading-relaxed">
              {t('results.includes')}
            </p>
            <p className="mt-2 text-xs text-[var(--color-text-dim)] leading-relaxed">
              {t('results.disclaimer')}
            </p>

            <Link
              href={{pathname: '/contatti', query: {service: type, range: `${result.min}-${result.max}`}}}
              className="btn btn-primary mt-6"
            >
              {t('next')}
            </Link>
          </div>
        </div>

        {authedEmail ? (
          <form onSubmit={saveReport} className="mt-6 card p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1 w-full">
                <label className="label">{tPay('save')}</label>
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
                {tPay('saveCta')} →
              </button>
            </div>
            {saveStatus !== 'idle' && (
              <div className="mt-3 text-sm">
                {saveStatus === 'sending' && <span className="text-[var(--color-text-dim)]">…</span>}
                {saveStatus === 'ok' && <span className="text-[var(--color-accent)]">{tPay('saveOk')}</span>}
                {saveStatus === 'err' && <span className="text-red-400">{tPay('saveErr')}</span>}
              </div>
            )}
          </form>
        ) : (
          <div className="mt-6 card p-6 text-center">
            <p className="text-sm text-[var(--color-text-soft)]">{tPay('locked')}</p>
            <AuthTrigger mode="signup" className="btn btn-dark mt-4">{tPay('signup')} →</AuthTrigger>
          </div>
        )}
      </div>
    </section>
  );
}

function Group({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div>
      <div className="label mb-2">{label}</div>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  flex,
  disabled
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  flex?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${flex ? 'flex-1 ' : ''}rounded-full px-4 py-2 text-sm border transition disabled:opacity-50 disabled:cursor-not-allowed ${
        active
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-text-strong)]'
          : 'border-[var(--color-line)] text-[var(--color-text-soft)] hover:text-[var(--color-text-strong)] hover:border-[var(--color-text-soft)]'
      }`}
    >
      {children}
    </button>
  );
}
