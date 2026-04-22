'use client';

import {useEffect, useState} from 'react';
import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {usePathname} from 'next/navigation';
import {getBrowserClient} from '@/lib/supabase';
import LangSwitcher from './LangSwitcher';
import AuthTrigger from './AuthTrigger';

export default function PillNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const isHome = /^\/[a-z]{2}\/?$/.test(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const logoVisible = !isHome || pastHero;

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      const marquee = document.querySelector('[data-section="clients"]') as HTMLElement | null;
      const threshold = marquee
        ? marquee.offsetTop + marquee.offsetHeight - 80
        : window.innerHeight + 200;
      setPastHero(y > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [pathname]);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const supabase = await getBrowserClient();
      if (!supabase) return;
      const {data} = await supabase.auth.getUser();
      setAuthed(!!data.user);
      const sub = supabase.auth.onAuthStateChange((_evt, session) => {
        setAuthed(!!session?.user);
      });
      unsub = () => sub.data.subscription.unsubscribe();
    })();
    return () => unsub?.();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const links = [
    {href: '/#servizi', label: t('solutions')},
    {href: '/#casi', label: t('caseStudies')},
    {href: '/prodotti', label: t('products')},
    {href: '/blog', label: t('blog')}
  ] as const;

  const authLabel = authed ? t('dashboard') : t('login');

  function onNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.includes('#')) return;
    if (!isHome) return;
    const hash = href.split('#')[1];
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({behavior: 'smooth', block: 'start'});
    history.replaceState(null, '', `#${hash}`);
    setOpen(false);
  }

  return (
    <>
      <header key={pathname} className="sticky top-4 z-50 flex justify-center px-4 animate-nav-drop">
        <nav
          className={`pill-nav flex items-center gap-1 rounded-full pl-2 pr-2 py-1.5 transition-all ${
            scrolled ? 'shadow-[0_8px_40px_-16px_rgba(0,0,0,0.8)]' : ''
          }`}
        >
          <Link
            href="/"
            aria-label={t('brand')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[var(--color-text-strong)] font-semibold tracking-tight transition-all duration-300 ${
              logoVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none w-0 overflow-hidden px-0'
            }`}
          >
            <Image
              src="/brand/logo_2erre.png"
              alt={t('brand')}
              width={120}
              height={32}
              priority
              className="h-7 w-auto"
            />
            <span className="sr-only">{t('brand')}</span>
          </Link>

          <div className="hidden md:flex items-center gap-0.5">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={(e) => onNavClick(e, l.href)}
                className="px-3 py-1.5 rounded-full text-[0.8125rem] uppercase tracking-wider text-[var(--color-text-soft)] hover:text-[var(--color-text-strong)] transition"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2 pl-1">
            <LangSwitcher />
            {authed && (
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-full text-[0.8125rem] uppercase tracking-wider text-[var(--color-text-soft)] hover:text-[var(--color-text-strong)] transition"
              >
                {t('dashboard')}
              </Link>
            )}
            <Link href="/contatti" className="btn btn-dark !py-1.5 !px-4 !text-[0.8125rem]">
              {t('cta')}
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-2 pl-1">
            <Link href="/contatti" className="btn btn-dark !py-1.5 !px-4 !text-[0.8125rem]">
              {t('contact')}
            </Link>
            <button
              type="button"
              aria-label={open ? t('close') : t('menu')}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="w-9 h-9 rounded-full border border-[var(--color-line-strong)] bg-[var(--color-ink-1)] flex items-center justify-center text-[var(--color-text-strong)]"
            >
              {open ? <IconClose /> : <IconBurger />}
            </button>
          </div>
        </nav>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-40 pt-24 px-4 pb-8">
          <div
            className="absolute inset-0 bg-[var(--color-ink-0)]/85 backdrop-blur-xl"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative card p-2 max-w-xl mx-auto">
            <div className="p-4 pb-2 flex justify-center">
              <LangSwitcher verbose />
            </div>
            <ul className="flex flex-col">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={(e) => { setOpen(false); onNavClick(e, l.href); }}
                    className="flex items-center justify-between px-4 py-4 rounded-2xl text-[var(--color-text-strong)] text-lg hover:bg-[var(--color-ink-1)] transition"
                  >
                    <span>{l.label}</span>
                    <span className="text-[var(--color-text-dim)]">→</span>
                  </Link>
                </li>
              ))}
              <li className="mt-1 pt-1 border-t border-[var(--color-line)]">
                {authed ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between px-4 py-4 rounded-2xl text-[var(--color-text-strong)] text-lg hover:bg-[var(--color-ink-1)] transition"
                  >
                    <span>{authLabel}</span>
                    <span className="text-[var(--color-accent)]">→</span>
                  </Link>
                ) : (
                  <AuthTrigger
                    mode="login"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between px-4 py-4 rounded-2xl text-[var(--color-text-strong)] text-lg hover:bg-[var(--color-ink-1)] transition"
                  >
                    <span>{authLabel}</span>
                    <span className="text-[var(--color-accent)]">→</span>
                  </AuthTrigger>
                )}
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

function IconBurger() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
