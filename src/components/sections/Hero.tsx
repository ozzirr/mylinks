import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import Cube from '@/components/cube/Cube';
import Particles from '@/components/Particles';

export default async function Hero() {
  const t = await getTranslations('hero');

  return (
    <section className="relative overflow-hidden">
      <div className="bg-dots" aria-hidden />
      <Particles />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-28 md:pt-32 pb-8 flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-semibold tracking-tight leading-[1.02] text-[var(--color-text-strong)]">
          <span>{t('titlePre')} </span>
          <span className="gradient-text">{t('titleAccent')}</span>
          <br />
          <span className="text-display">{t('titleSuffix')}</span>
        </h1>

        <p className="mt-7 max-w-2xl text-lg text-[var(--color-text-soft)] leading-relaxed">
          {t('subtitle')}
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-6">
          <Link
            href="/contatti"
            className="btn btn-light uppercase tracking-[0.15em] text-xs font-semibold !px-7 !py-4"
          >
            {t('ctaPrimary')} <span aria-hidden>→</span>
          </Link>
          <Link
            href="/#servizi"
            className="uppercase tracking-[0.15em] text-xs font-semibold text-[var(--color-text-soft)] hover:text-[var(--color-text-strong)] transition px-2 py-4"
          >
            {t('ctaSecondary')}
          </Link>
        </div>
      </div>

      <div className="relative z-[1] flex justify-center">
        <div className="relative w-[280px] sm:w-[340px] md:w-[400px] lg:w-[460px]">
          <div
            className="absolute -inset-16 bg-[radial-gradient(closest-side,rgba(34,211,238,0.25),transparent_70%)] blur-3xl pointer-events-none"
            aria-hidden
          />
          <div className="relative animate-float">
            <Cube />
          </div>
        </div>
      </div>
    </section>
  );
}
