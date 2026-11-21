import type { ReactNode } from 'react';

type Props = { numero: number; titulo: string; ayuda?: string; children: ReactNode };

/** Un paso del formulario: número, título y una línea que dice qué se pide. */
export function TarjetaDePaso({ numero, titulo, ayuda, children }: Props) {
  return (
    <section className="rounded-2xl border border-border bg-white px-4 py-3 shadow-card md:px-6">
      <div className="mb-3 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground"
        >
          {numero}
        </span>
        <h2 className="font-display text-[17px] font-bold leading-tight tracking-tight">
          {titulo}
        </h2>
        {ayuda ? (
          <p className="hidden text-[13px] text-muted-foreground md:block">{ayuda}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
