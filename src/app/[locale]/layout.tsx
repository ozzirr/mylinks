import {notFound} from 'next/navigation';
import {NextIntlClientProvider, hasLocale} from 'next-intl';
// (hasLocale lives on the root next-intl export in v4)
import {getTranslations, setRequestLocale} from 'next-intl/server';
import type {Metadata} from 'next';
import {routing} from '@/i18n/routing';
import {Suspense} from 'react';
import PillNav from '@/components/PillNav';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'meta'});
  return {
    title: t('title'),
    description: t('description')
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider locale={locale}>
      <Suspense fallback={null}>
        <PillNav />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
      <Suspense fallback={null}>
        <AuthModal />
      </Suspense>
    </NextIntlClientProvider>
  );
}
