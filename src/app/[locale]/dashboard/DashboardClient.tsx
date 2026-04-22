'use client';

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {getBrowserClient} from '@/lib/supabase';
import AuthTrigger from '@/components/AuthTrigger';

const TOOLS = [
  {key: 'qr' as const, href: '/tools/qr'},
  {key: 'paycheck' as const, href: '/tools/paycheck'},
  {key: 'calc' as const, href: '/tools/quote'}
];

export default function DashboardClient() {
  const t = useTranslations('dashboard');
  const tProducts = useTranslations('products.items');
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'authed' | 'anon' | 'unconfigured'>('loading');

  useEffect(() => {
    (async () => {
      const supabase = await getBrowserClient();
      if (!supabase) {
        setStatus('unconfigured');
        return;
      }
      const {data} = await supabase.auth.getUser();
      if (data.user) {
        setEmail(data.user.email ?? null);
        setStatus('authed');
      } else {
        setStatus('anon');
      }
    })();
  }, []);

  async function signOut() {
    const supabase = await getBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setEmail(null);
    setStatus('anon');
  }

  return (
    <section className="pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-dim)] mb-4">
          2erre · Area riservata
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--color-text-strong)]">
          {t('title')}
        </h1>
        <p className="mt-3 text-[var(--color-text-soft)]">{t('subtitle')}</p>

        {status === 'loading' && (
          <div className="mt-10 card p-8 text-[var(--color-text-soft)]">…</div>
        )}

        {(status === 'anon' || status === 'unconfigured') && (
          <div className="mt-10 card p-8">
            <p className="text-[var(--color-text-soft)]">{t('notLogged')}</p>
            <AuthTrigger mode="login" className="btn btn-primary mt-4 inline-flex">
              {t('login')} →
            </AuthTrigger>
          </div>
        )}

        {status === 'authed' && (
          <>
            <div className="mt-10 card p-8 flex flex-wrap items-center justify-between gap-4">
              <Link href="/account" className="flex-1 min-w-0 -m-2 p-2 rounded-2xl hover:bg-[var(--color-ink-1)] transition">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
                  Account
                </div>
                <div className="mt-1 text-lg text-[var(--color-text-strong)] truncate">
                  {t('welcome', {email: email ?? ''})}
                </div>
                <div className="mt-1 text-xs text-[var(--color-accent)] uppercase tracking-wider">
                  {t('editAccount')}
                </div>
              </Link>
              <button onClick={signOut} className="btn btn-ghost">
                {t('signout')}
              </button>
            </div>

            <div className="mt-10">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-dim)] mb-4">
                {t('tools')}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {TOOLS.map((tl) => (
                  <Link
                    key={tl.key}
                    href={tl.href}
                    className="card p-6 hover:border-[var(--color-accent)] transition group"
                  >
                    <div className="text-lg font-semibold text-[var(--color-text-strong)] group-hover:text-[var(--color-accent)]">
                      {tProducts(`${tl.key}.name`)}
                    </div>
                    <div className="mt-1 text-sm text-[var(--color-text-soft)]">
                      {tProducts(`${tl.key}.tagline`)}
                    </div>
                    <div className="mt-4 text-xs uppercase tracking-wider text-[var(--color-accent)]">
                      Apri →
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
