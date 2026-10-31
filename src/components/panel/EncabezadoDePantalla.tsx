import type { ReactNode } from 'react';
import { EntradaDelTitulo } from './Entradas';

type Props = { titulo: string; subtitulo?: string; acciones?: ReactNode; ayuda?: ReactNode };

/**
 * El encabezado de Plan Reminder Pro. Alla el titulo es h2 (su h1 es la marca); aca es el h1,
 * con las mismas clases.
 */
export function EncabezadoDePantalla({ titulo, subtitulo, acciones, ayuda }: Props) {
  const textos = (
    <div>
      <h1 className="text-2xl md:text-[2rem] font-display font-extrabold tracking-tight">
        {titulo}
      </h1>
      {subtitulo ? (
        <p className="text-sm md:text-[15px] text-muted-foreground font-medium mt-1">{subtitulo}</p>
      ) : null}
    </div>
  );
  return (
    <header className="mb-7 md:mb-11 flex items-start gap-3">
      <EntradaDelTitulo className="flex-1 min-w-0">
        {acciones ? (
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            {textos}
            <div className="flex flex-wrap items-center gap-3">{acciones}</div>
          </div>
        ) : (
          textos
        )}
      </EntradaDelTitulo>
      {ayuda}
    </header>
  );
}
