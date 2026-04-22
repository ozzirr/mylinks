import Image from 'next/image';

type Client = {name: string; src?: string};

const CLIENTS: Client[] = [
  {name: 'MS Porte', src: '/brand/white/logo-ms-porte-optimized.webp'},
  {name: 'Olio Arsieni', src: '/brand/white/logo-olio-arsieni-optimized.webp'},
  {name: 'Generale Elettrica', src: '/brand/white/logo-generale-elettrica-optimized.webp'},
  {name: 'Odora', src: '/brand/white/logo_odora.webp'},
  {name: 'Cliente 05'},
  {name: 'Cliente 06'},
  {name: 'Cliente 07'},
  {name: 'Cliente 08'}
];

export default function ClientsMarquee() {
  const loop = [...CLIENTS, ...CLIENTS];

  return (
    <section data-section="clients" className="relative py-16 md:py-20 border-y border-[var(--color-line)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center text-xs uppercase tracking-[0.24em] text-[var(--color-text-dim)] mb-10">
          Le aziende che ci hanno scelto
        </div>
      </div>

      <div className="marquee-mask overflow-hidden">
        <div className="animate-marquee flex items-center gap-16 md:gap-24 w-max">
          {loop.map((c, i) => (
            <div
              key={`${c.name}-${i}`}
              className="shrink-0 h-12 md:h-14 flex items-center justify-center opacity-70 hover:opacity-100 transition"
              aria-hidden={i >= CLIENTS.length}
            >
              {c.src ? (
                <Image
                  src={c.src}
                  alt={c.name}
                  width={160}
                  height={56}
                  className="h-full w-auto object-contain"
                />
              ) : (
                <span className="text-[var(--color-text-dim)] text-sm uppercase tracking-[0.2em] whitespace-nowrap">
                  {c.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
