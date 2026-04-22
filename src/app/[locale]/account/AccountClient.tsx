'use client';

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {getBrowserClient} from '@/lib/supabase';
import AuthTrigger from '@/components/AuthTrigger';

type Status = 'loading' | 'authed' | 'anon';

export default function AccountClient() {
  const t = useTranslations('account');
  const tAuth = useTranslations('dashboard');
  const [status, setStatus] = useState<Status>('loading');

  const [email, setEmail] = useState('');
  const [initialEmail, setInitialEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const [profileState, setProfileState] = useState<'idle' | 'saving' | 'ok' | 'ok-email' | 'err'>('idle');
  const [profileMsg, setProfileMsg] = useState('');

  const [password, setPassword] = useState('');
  const [pwState, setPwState] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    (async () => {
      const supabase = await getBrowserClient();
      if (!supabase) {
        setStatus('anon');
        return;
      }
      const {data} = await supabase.auth.getUser();
      if (!data.user) {
        setStatus('anon');
        return;
      }
      const u = data.user;
      setEmail(u.email ?? '');
      setInitialEmail(u.email ?? '');
      const m = (u.user_metadata ?? {}) as Record<string, string>;
      setFirstName(m.first_name ?? '');
      setLastName(m.last_name ?? '');
      setPhone(m.phone ?? '');
      setStatus('authed');
    })();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileState('saving');
    const supabase = await getBrowserClient();
    if (!supabase) return;
    const update: Parameters<typeof supabase.auth.updateUser>[0] = {
      data: {first_name: firstName, last_name: lastName, phone}
    };
    const emailChanged = email !== initialEmail && email.trim().length > 0;
    if (emailChanged) update.email = email;
    const {error} = await supabase.auth.updateUser(update);
    if (error) {
      setProfileMsg(error.message);
      setProfileState('err');
    } else {
      setProfileState(emailChanged ? 'ok-email' : 'ok');
    }
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwState('saving');
    const supabase = await getBrowserClient();
    if (!supabase) return;
    const {error} = await supabase.auth.updateUser({password});
    if (error) {
      setPwMsg(error.message);
      setPwState('err');
    } else {
      setPassword('');
      setPwState('ok');
    }
  }

  if (status === 'loading') {
    return <section className="pt-32 pb-24"><div className="max-w-3xl mx-auto px-6 text-[var(--color-text-soft)]">…</div></section>;
  }

  if (status === 'anon') {
    return (
      <section className="pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="card p-8">
            <p className="text-[var(--color-text-soft)]">{tAuth('notLogged')}</p>
            <AuthTrigger mode="login" className="btn btn-primary mt-4 inline-flex">
              {tAuth('login')} →
            </AuthTrigger>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-6">
        <Link href="/dashboard" className="text-sm text-[var(--color-text-soft)] hover:text-[var(--color-accent)]">
          {t('back')}
        </Link>
        <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-[var(--color-text-strong)]">
          {t('title')}
        </h1>
        <p className="mt-3 text-[var(--color-text-soft)]">{t('subtitle')}</p>

        <form onSubmit={saveProfile} className="mt-10 card p-8 space-y-5">
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-dim)]">
            {t('profile')}
          </div>
          <div>
            <label className="label">{t('fields.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">{t('fields.firstName')}</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="field" />
            </div>
            <div>
              <label className="label">{t('fields.lastName')}</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="field" />
            </div>
          </div>
          <div>
            <label className="label">{t('fields.phone')}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="field" />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={profileState === 'saving'} className="btn btn-primary">
              {t('save')} →
            </button>
            {profileState === 'ok' && <span className="text-sm text-[var(--color-accent)]">{t('saved')}</span>}
            {profileState === 'ok-email' && <span className="text-sm text-[var(--color-accent)]">{t('savedEmail')}</span>}
            {profileState === 'err' && <span className="text-sm text-[var(--color-danger)]">{profileMsg}</span>}
          </div>
        </form>

        <form onSubmit={updatePassword} className="mt-6 card p-8 space-y-5">
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-dim)]">
            {t('password')}
          </div>
          <p className="text-sm text-[var(--color-text-soft)]">{t('passwordHint')}</p>
          <div>
            <label className="label">{t('newPassword')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              className="field"
            />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={pwState === 'saving'} className="btn btn-primary">
              {t('updatePassword')} →
            </button>
            {pwState === 'ok' && <span className="text-sm text-[var(--color-accent)]">{t('passwordUpdated')}</span>}
            {pwState === 'err' && <span className="text-sm text-[var(--color-danger)]">{pwMsg}</span>}
          </div>
        </form>
      </div>
    </section>
  );
}
