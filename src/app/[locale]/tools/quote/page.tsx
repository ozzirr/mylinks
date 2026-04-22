import {Suspense} from 'react';
import {setRequestLocale} from 'next-intl/server';
import QuoteClient from './QuoteClient';

export default async function QuotePage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={null}>
      <QuoteClient />
    </Suspense>
  );
}
