import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {getPosts, type Locale} from '@/lib/blog';

export default async function BlogPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('blog');
  const posts = getPosts(locale as Locale);

  return (
    <section className="pt-32 pb-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)] mb-4">
            {t('title')}
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-[var(--color-text-strong)] leading-[1.05]">
            Digitale & AI<br />per le imprese
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-lg text-[var(--color-text-soft)]">
            {t('subtitle')}
          </p>
        </div>

        <ul className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}`}
                className="card block group overflow-hidden hover:border-[var(--color-accent)] transition relative h-full"
              >
                <div className="relative aspect-[4/3] p-6 flex items-end bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.18),transparent_60%),linear-gradient(180deg,var(--color-ink-2),var(--color-ink-1))] border-b border-[var(--color-line)]">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-text-soft)] bg-[var(--color-ink-0)]/60 backdrop-blur px-2.5 py-1 rounded-full border border-[var(--color-line)]">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                      <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" />
                      <path d="M5 3v2l1.5 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                    {t('readingTime', {min: p.readingMin})}
                  </div>
                  <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-text-strong)] leading-tight group-hover:text-[var(--color-accent)] transition">
                    {p.title}
                  </h2>
                </div>
                <div className="p-6">
                  <time
                    dateTime={p.date}
                    className="text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]"
                  >
                    {formatDate(p.date, locale as Locale)}
                  </time>
                  <p className="mt-3 text-sm text-[var(--color-text-soft)] leading-relaxed line-clamp-3">
                    {p.excerpt}
                  </p>
                  <div className="mt-5 inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[var(--color-accent)]">
                    {t('readMore')} →
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function formatDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(iso));
}
