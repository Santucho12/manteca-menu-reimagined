'use client';

import { LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { EnlaceDelMarco } from '@/lib/acceso/marco';
import { enlaceActivo } from '@/lib/acceso/navegacion';
import { EnlaceDelPanel } from './EnlaceDelPanel';
import { MarcaDelPanel } from './MarcaDelPanel';

type Props = { nombre: string; enlaces: EnlaceDelMarco[] };

/** La sidebar de la computadora: la marca, las secciones y, abajo, quien esta y Salir. */
export function BarraLateral({ nombre, enlaces }: Props) {
  const activo = enlaceActivo(enlaces, usePathname());
  return (
    <aside className="bg-card fixed top-0 left-0 z-50 hidden h-full w-[260px] flex-col border-r lg:flex">
      <div className="p-8 pb-6">
        <MarcaDelPanel />
      </div>
      <nav
        aria-label="Panel"
        hidden={enlaces.length === 0}
        className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto p-4"
      >
        {enlaces.map((enlace) => (
          <EnlaceDelPanel key={enlace.clave} enlace={enlace} activo={enlace.clave === activo} />
        ))}
      </nav>
      <div className="space-y-2 p-4">
        <p className="text-muted-foreground truncate px-4 text-xs font-semibold">{nombre}</p>
        <form action="/admin/salir" method="post">
          <button
            type="submit"
            className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-300 [@media(max-height:820px)]:py-2.5"
          >
            <LogOut size={20} aria-hidden />
            Salir
          </button>
        </form>
      </div>
    </aside>
  );
}
