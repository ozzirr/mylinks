import Image from 'next/image';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';

export default async function Footer() {
  const t = await getTranslations('footer');
  const nav = await getTranslations('nav');
  const year = new Date().getFullYear();

  return (
    <footer className="mt-32 border-t border-[var(--color-line)]">
      <div className="max-w-6xl mx-auto px-6 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center">
            <Image
              src="/brand/logo_2erre.png"
              alt="2erre SRL"
              width={160}
              height={48}
              className="h-10 w-auto"
            />
          </div>
          <p className="mt-3 text-[var(--color-text-soft)] max-w-sm text-sm leading-relaxed">
            {t('tagline')}
          </p>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] mb-3">
            {t('columns.nav')}
          </div>
          <ul className="space-y-2 text-sm text-[var(--color-text-soft)]">
            <li><Link href="/servizi" className="hover:text-[var(--color-text-strong)]">{nav('services')}</Link></li>
            <li><Link href="/prodotti" className="hover:text-[var(--color-text-strong)]">{nav('products')}</Link></li>
            <li><Link href="/chi-siamo" className="hover:text-[var(--color-text-strong)]">{nav('about')}</Link></li>
            <li><Link href="/blog" className="hover:text-[var(--color-text-strong)]">{nav('blog')}</Link></li>
            <li><Link href="/contatti" className="hover:text-[var(--color-text-strong)]">{nav('contact')}</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] mb-3">
            {t('columns.legal')}
          </div>
          <ul className="space-y-2 text-sm text-[var(--color-text-soft)]">
            <li><Link href="/legal/privacy" className="hover:text-[var(--color-text-strong)]">{t('links.privacy')}</Link></li>
            <li><Link href="/legal/terms" className="hover:text-[var(--color-text-strong)]">{t('links.terms')}</Link></li>
            <li><Link href="/legal/cookies" className="hover:text-[var(--color-text-strong)]">{t('links.cookies')}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--color-line)]">
        <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-[var(--color-text-dim)]">
          {t('copyright', {year})}
        </div>
      </div>
    </footer>
  );
}
