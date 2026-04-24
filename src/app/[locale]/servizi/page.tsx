import {setRequestLocale} from 'next-intl/server';
import Services from '@/components/sections/Services';

export default async function ServiziPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return (
    <div className="pt-20">
      <Services />
    </div>
  );
}
