'use client';

import {useEffect, useState, useCallback} from 'react';
import {useSearchParams, useRouter, usePathname} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {getBrowserClient} from '@/lib/supabase';

type Mode = 'login' | 'signup';

export default function AuthModal() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const raw = search.get('auth');
  const mode: Mode | null =
    raw === 'login' || raw === 'signup' ? raw : null;
  const open = mode !== null;

  const close = useCallback(() => {
    const params = new URLSearchParams(search.toString());
    params.delete('auth');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, {scroll: false});
  }, [router, pathname, search]);

  const switchMode = useCallback(
    (next: Mode) => {
      const params = new URLSearchParams(search.toString());
      params.set('auth', next);
      router.replace(`${pathname}?${params.toString()}`, {scroll: false});
    },
    [router, pathname, search]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, close]);

  if (!open || !mode) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-[rgba(5,5,7,0.55)] backdrop-blur-xl"
        onClick={close}
        aria-hidden
      />

      <AuthModalCard key={mode} mode={mode} close={close} switchMode={switchMode} />
    </div>
  );
}

function AuthModalCard({
  mode,
  close,
  switchMode
}: {
  mode: Mode;
  close: () => void;
  switchMode: (next: Mode) => void;
}) {
  const t = useTranslations('auth');
  const tNav = useTranslations('nav');
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'err' | 'unconfigured'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') ?? '');
    const password = String(fd.get('password') ?? '');
    setState('sending');
    setErrorMsg('');

    const supabase = await getBrowserClient();
    if (!supabase) {
      setState('unconfigured');
      return;
    }

    const {data, error} =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({email, password})
        : await supabase.auth.signUp({email, password});

    if (error) {
      setErrorMsg(error.message);
      setState('err');
      return;
    }

    if (mode === 'login') {
      if (!data.session || !data.user) {
        setErrorMsg(t('login.failed'));
        setState('err');
        return;
      }

      setState('ok');
      close();
      router.refresh();
      return;
    }

    if (data.session && data.user) {
      setState('ok');
      close();
      router.refresh();
      return;
    }

    setState('idle');
    setErrorMsg(t('signup.checkEmail'));
  }

  return (
    <div className="relative card w-full max-w-md p-8 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.8)]">
        <button
          type="button"
          onClick={close}
          aria-label={tNav('close')}
          className="absolute top-4 right-4 w-9 h-9 rounded-full border border-[var(--color-line-strong)] bg-[var(--color-ink-1)] flex items-center justify-center text-[var(--color-text-soft)] hover:text-[var(--color-text-strong)] transition"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text-strong)]">
          {t(`${mode}.title`)}
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-soft)]">{t(`${mode}.subtitle`)}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">{t('fields.email')}</label>
            <input name="email" type="email" required autoComplete="email" className="field" />
          </div>
          <div>
            <label className="label">{t('fields.password')}</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="field"
            />
          </div>
          <button type="submit" disabled={state === 'sending'} className="btn btn-primary w-full">
            {t(`${mode}.submit`)} →
          </button>
          {mode === 'login' && (
            <div className="text-right">
              <Link
                href="/auth/reset"
                className="text-xs text-[var(--color-text-soft)] hover:text-[var(--color-accent)]"
              >
                {t('login.forgot')}
              </Link>
            </div>
          )}
        </form>

        {state === 'unconfigured' && (
          <p className="mt-4 text-sm text-[var(--color-amber)]">{t('unconfigured')}</p>
        )}
        {state === 'err' && (
          <p className="mt-4 text-sm text-[var(--color-danger)]">{errorMsg}</p>
        )}
        {state === 'idle' && errorMsg && (
          <p className="mt-4 text-sm text-[var(--color-accent)]">{errorMsg}</p>
        )}

        <div className="mt-6 pt-6 border-t border-[var(--color-line)] text-sm text-[var(--color-text-soft)]">
          {mode === 'login' ? (
            <>
              {t('login.noAccount')}{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-[var(--color-accent)] hover:underline"
              >
                {t('login.signupLink')}
              </button>
            </>
          ) : (
            <>
              {t('signup.hasAccount')}{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-[var(--color-accent)] hover:underline"
              >
                {t('signup.loginLink')}
              </button>
            </>
          )}
        </div>
      </div>
  );
}
