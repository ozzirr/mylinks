import {notFound} from 'next/navigation';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import ContactForm from '@/components/sections/ContactForm';
import CaseStudies from '@/components/sections/CaseStudies';

const SLUGS = ['consulting', 'web', 'apps', 'ai'] as const;
type Slug = (typeof SLUGS)[number];

const SHOWS_PORTFOLIO: Record<Slug, boolean> = {
  consulting: false,
  web: true,
  apps: true,
  ai: false
};

type ProcessStep = {title: string; body: string};

export function generateStaticParams() {
  return SLUGS.map((slug) => ({slug}));
}

export default async function ServiceDetailPage({
  params
}: {
  params: Promise<{locale: string; slug: string}>;
}) {
  const {locale, slug} = await params;
  setRequestLocale(locale);

  if (!SLUGS.includes(slug as Slug)) notFound();
  const key = slug as Slug;

  const tServices = await getTranslations('services');
  const tDetail = await getTranslations('serviceDetail');
  const tItem = await getTranslations(`serviceDetail.items.${key}`);
  const tCard = await getTranslations(`services.items.${key}`);

  const process = tItem.raw('process') as ProcessStep[];
  const deliverables = tItem.raw('deliverables') as string[];

  return (
    <div className="pt-24 md:pt-28">
      <section className="relative py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/servizi"
            className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-dim)] hover:text-[var(--color-text-strong)] transition"
          >
            {tDetail('back')}
          </Link>

          <div className="mt-8">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">
              {tCard('tagline')}
            </div>
            <h1 className="mt-4 text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02] text-[var(--color-text-strong)]">
              {tCard('title')}
            </h1>
            <p className="mt-6 text-display italic text-2xl md:text-3xl text-[var(--color-accent)] leading-snug">
              {tItem('hero')}
            </p>
          </div>

          <p className="mt-10 max-w-3xl text-lg md:text-xl leading-relaxed text-[var(--color-text-soft)]">
            {tItem('intro')}
          </p>
        </div>
      </section>

      <section className="relative py-16 md:py-20 border-t border-[var(--color-line)]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-dim)] mb-3">
            {tDetail('processLabel')}
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-text-strong)]">
            {tItem('processTitle')}
          </h2>

          <ol className="mt-12 grid gap-6 md:grid-cols-2">
            {process.map((step, i) => (
              <li key={i} className="card p-7">
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">
                  0{i + 1}
                </div>
                <h3 className="mt-3 text-xl font-semibold text-[var(--color-text-strong)]">
                  {step.title}
                </h3>
                <p className="mt-3 text-[var(--color-text-soft)] leading-relaxed">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="relative py-16 md:py-20 border-t border-[var(--color-line)]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-dim)] mb-3">
            {tDetail('deliverablesLabel')}
          </div>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {deliverables.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[var(--color-text)] text-base md:text-lg"
              >
                <span className="text-[var(--color-accent)] mt-1">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {SHOWS_PORTFOLIO[key] && <CaseStudies />}

      <section className="relative border-t border-[var(--color-line)]">
        <ContactForm />
      </section>
    </div>
  );
}
