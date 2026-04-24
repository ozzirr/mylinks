import Image from 'next/image';

type Client = {
  name: string;
  src?: string;
  imageClassName?: string;
};

const CLIENTS: Client[] = [
  {name: 'MS Porte', src: '/brand/white/logo-ms-porte-optimized.webp'},
  {name: 'Olio Arsieni', src: '/brand/white/logo-olio-arsieni-optimized.webp'},
  {name: 'Generale Elettrica', src: '/brand/white/logo-generale-elettrica-optimized.webp'},
  {name: 'Odora', src: '/brand/white/logo_odora.webp'},
  {name: 'Balance', src: '/brand/white/logo-balance.webp'},
  {name: 'Cliente 07'},
  {name: 'Cliente 08'}
];

export default function ClientsMarquee() {
  const loop = [...CLIENTS, ...CLIENTS];

  return (
    <section data-section="clients" className="relative py-10 md:py-12 border-y border-[var(--color-line)]">
      <div className="marquee-mask overflow-hidden">
        <div className="animate-marquee flex items-center w-max">
          {loop.map((c, i) => (
            <div
              key={`${c.name}-${i}`}
              className="shrink-0 h-20 md:h-24 flex items-center justify-center opacity-70 hover:opacity-100 transition mr-10 md:mr-14"
              aria-hidden={i >= CLIENTS.length}
            >
              {c.src ? (
                <div className="relative h-20 w-[230px] md:h-24 md:w-[260px]">
                  <Image
                    src={c.src}
                    alt={c.name}
                    fill
                    sizes="260px"
                    className={`object-contain ${c.imageClassName ?? ''}`}
                  />
                </div>
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
