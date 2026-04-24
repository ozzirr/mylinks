import {getTranslations} from 'next-intl/server';
import ServiceCardLink from '@/components/ServiceCardLink';

const ITEMS = ['consulting', 'web', 'apps', 'ai'] as const;

export default async function Services() {
  const t = await getTranslations('services');

  return (
    <section id="servizi" className="relative py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mx-auto max-w-3xl">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-[var(--color-text-strong)] leading-[1.05]">
            {t('headingPre')}{' '}
            <span className="text-display gradient-text italic">{t('headingAccent')}</span>
          </h2>
          <p className="mt-5 text-base md:text-lg text-[var(--color-text-soft)] leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {ITEMS.map((key, i) => (
            <ServiceCardLink
              key={key}
              slug={key}
              href={`/servizi/${key}`}
              className="card p-8 group relative overflow-hidden block transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-dim)]">
                    0{i + 1} · Servizio
                  </div>
                  <h3 className="mt-3 text-2xl md:text-3xl font-semibold text-[var(--color-text-strong)]">
                    {t(`items.${key}.title`)}{' '}
                    <span className="text-display text-[var(--color-accent)] text-xl align-baseline">
                      {t(`items.${key}.tagline`)}
                    </span>
                  </h3>
                </div>
              </div>
              <p className="mt-4 text-[var(--color-text-soft)] leading-relaxed max-w-md">
                {t(`items.${key}.body`)}
              </p>
              <div className="mt-6 pt-6 border-t border-[var(--color-line)]">
                <span className="inline-flex items-center gap-2 text-[var(--color-text-strong)] text-sm font-medium uppercase tracking-wider group-hover:text-[var(--color-accent)] transition">
                  {t('discover')}
                  <span className="text-[var(--color-accent)]">→</span>
                </span>
              </div>
            </ServiceCardLink>
          ))}
        </div>
      </div>
    </section>
  );
}
