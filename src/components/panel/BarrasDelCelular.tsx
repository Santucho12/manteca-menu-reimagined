'use client';

import { usePathname } from 'next/navigation';
import type { EnlaceDelMarco } from '@/lib/acceso/marco';
import { enlaceActivo, repartirParaCelular } from '@/lib/acceso/navegacion';
import { BotonSalir } from './BotonSalir';
import { EnlaceDeAbajo } from './EnlaceDeAbajo';
import { Marca } from './Marca';
import { MasSecciones } from './MasSecciones';

type Props = { nombre: string; enlaces: EnlaceDelMarco[] };

/** Las barras fijas del celular de Plan Reminder Pro, por debajo de lg. */
export function BarrasDelCelular({ nombre, enlaces }: Props) {
  const activo = enlaceActivo(enlaces, usePathname());
  const { abajo, mas } = repartirParaCelular(enlaces);
  return (
    <>
      <header className="lg:hidden fixed top-0 inset-x-0 h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] z-50 bg-card/95 backdrop-blur border-b border-border flex items-center justify-between px-4">
        <Marca tamano="barra" />
        <div className="flex items-center gap-1 min-w-0">
          <span className="truncate max-w-[45vw] text-xs font-semibold text-muted-foreground">
            {nombre}
          </span>
          <BotonSalir variante="barra" />
        </div>
      </header>
      {enlaces.length > 0 ? (
        <nav
          aria-label="Panel"
          className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur border-t border-border flex pb-[env(safe-area-inset-bottom)]"
        >
          {abajo.map((enlace) => (
            <EnlaceDeAbajo key={enlace.clave} enlace={enlace} activo={enlace.clave === activo} />
          ))}
          {mas.length > 0 ? <MasSecciones enlaces={mas} activo={activo} /> : null}
        </nav>
      ) : null}
    </>
  );
}
