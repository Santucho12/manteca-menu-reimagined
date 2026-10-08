import Image from 'next/image';

const ANIMACION = (demora: number) => ({
  animation: `subir-y-aparecer 0.8s ${demora}s ease-out both`,
});

export function Portada() {
  return (
    <section className="alto-de-pantalla relative flex items-end justify-center overflow-hidden pb-16 md:items-center md:pb-0">
      <Image
        src="/menu/portada.jpg"
        alt="El equipo de Manteca"
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: 'center 35%' }}
      />
      <div className="velo-de-portada absolute inset-0" />
      <div className="relative z-10 mx-auto max-w-lg px-6 text-center">
        <div className="mb-6 inline-block" style={ANIMACION(0.2)}>
          <div className="mx-auto mb-4 h-[2px] w-16 bg-accent/60" />
          <span className="text-xs font-semibold tracking-[0.3em] text-white/90 uppercase">
            Panadería Artesanal
          </span>
          <div className="mx-auto mt-4 h-[2px] w-16 bg-accent/60" />
        </div>
        <h1 className="mb-4" style={ANIMACION(0.4)}>
          <Image
            src="/menu/logo-claro.png"
            alt="Manteca"
            width={480}
            height={160}
            className="mx-auto h-auto w-[260px] md:w-[480px]"
            priority
          />
        </h1>
        <p
          className="mb-6 text-base font-light tracking-[0.2em] text-white/85 uppercase md:text-lg"
          style={ANIMACION(0.6)}
        >
          El sabor de lo real
        </p>
        <p
          className="mx-auto mb-10 max-w-xs text-sm leading-relaxed text-white/70"
          style={ANIMACION(0.8)}
        >
          Masa madre · Harinas orgánicas · 3 días de elaboración
        </p>
        <a
          href="#menu"
          style={ANIMACION(1)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-xs font-semibold tracking-[0.15em] text-accent-foreground uppercase transition-transform active:scale-95"
        >
          Ver menú <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}
