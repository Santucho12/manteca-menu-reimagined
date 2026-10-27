import type { ReactNode } from 'react';

type Props = { titulo: string; descripcion?: string; id?: string; children?: ReactNode };

/**
 * El encabezado que comparten las tarjetas de Inicio: el título chico, debajo una línea que dice
 * qué muestra la tarjeta, y su botón a la derecha.
 */
export function EncabezadoDeTarjeta({ titulo, descripcion, id, children }: Props) {
  return (
    <div className="mb-6 flex min-h-10 items-center justify-between gap-3">
      <div className="min-w-0">
        <h2
          id={id}
          className="font-display text-base font-extrabold tracking-tight text-foreground"
        >
          {titulo}
        </h2>
        {descripcion ? (
          <p className="mt-0.5 font-display text-xs font-bold leading-snug tracking-tight text-neutral-500">
            {descripcion}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
