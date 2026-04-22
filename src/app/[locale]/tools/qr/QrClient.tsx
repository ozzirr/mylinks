'use client';

import {useEffect, useState} from 'react';
import QRCode from 'qrcode';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {getBrowserClient} from '@/lib/supabase';
import AuthTrigger from '@/components/AuthTrigger';

const USED_KEY = '2erre.qr.used';

export default function QrClient() {
  const t = useTranslations('tools.qr');
  const tPay = useTranslations('tools.paycheck');
  const [text, setText] = useState('');
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [used, setUsed] = useState(false);

  const [authedEmail, setAuthedEmail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');

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

  async function generate() {
    if (!text.trim() || locked) return;
    const url = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 512,
      color: {dark: '#050507', light: '#ffffff'}
    });
    setDataUrl(url);
    localStorage.setItem(USED_KEY, '1');
    setUsed(true);
  }

  async function saveReport(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus('sending');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email,
          tool: 'qr',
          payload: {target: text, dataUrl}
        })
      });
      setSaveStatus(res.ok ? 'ok' : 'err');
    } catch {
      setSaveStatus('err');
    }
  }

  return (
    <section className="pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-dim)] mb-4">
          2erre · Tools
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--color-text-strong)] leading-tight">
          {t('title')}
        </h1>
        <p className="mt-3 text-[var(--color-text-soft)]">{t('subtitle')}</p>

        <div className="mt-10 card p-8">
          <label className="label">URL / Testo</label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="field"
            placeholder={t('placeholder')}
            disabled={locked}
          />
          <div className="mt-4 flex gap-3">
            <button
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={generate}
              disabled={locked}
            >
              {t('generate')} →
            </button>
            {dataUrl && (
              <a className="btn btn-ghost" href={dataUrl} download="2erre-qr.png">
                {t('download')}
              </a>
            )}
          </div>

          {dataUrl && (
            <div className="mt-8 flex justify-center">
              <div className="rounded-2xl bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dataUrl} alt="QR" width={320} height={320} />
              </div>
            </div>
          )}
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
                disabled={!dataUrl || saveStatus === 'sending'}
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
            <p className="text-sm text-[var(--color-text-soft)]">
              {locked ? t('locked') : t('locked')}
            </p>
            <AuthTrigger mode="signup" className="btn btn-dark mt-4">{t('signup')} →</AuthTrigger>
          </div>
        )}
      </div>
    </section>
  );
}
