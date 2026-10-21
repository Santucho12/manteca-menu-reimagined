'use client';

import { LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { gruposDelPanel, type EnlaceDelMarco, type GrupoDelPanel } from '@/lib/acceso/marco';
import { enlaceActivo } from '@/lib/acceso/navegacion';
import { EnlaceDelPanel } from './EnlaceDelPanel';
import { MarcaDelPanel } from './MarcaDelPanel';

type Props = { nombre: string; enlaces: EnlaceDelMarco[] };

function Grupo({ grupo, activo }: { grupo: GrupoDelPanel; activo: string | null }) {
  return (
    <div className="space-y-1">
      {grupo.titulo ? (
        <p className="text-muted-foreground px-4 pt-3 pb-1 text-[10px] font-bold tracking-[0.16em] uppercase">
          {grupo.titulo}
        </p>
      ) : null}
      {grupo.enlaces.map((enlace) => (
        <EnlaceDelPanel key={enlace.clave} enlace={enlace} activo={enlace.clave === activo} />
      ))}
    </div>
  );
}

function Salir({ nombre }: { nombre: string }) {
  return (
    <>
      <p className="text-muted-foreground truncate px-4 pt-2 text-xs font-bold">{nombre}</p>
      <form action="/admin/salir" method="post">
        <button
          type="submit"
          className="text-muted-foreground hover:bg-secondary hover:text-foreground flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 text-sm font-semibold transition-colors"
        >
          <LogOut size={20} aria-hidden />
          Salir
        </button>
      </form>
    </>
  );
}

/** La sidebar de la computadora: el logo, las secciones por momento del dia y, al pie, la cuenta. */
export function BarraLateral({ nombre, enlaces }: Props) {
  const activo = enlaceActivo(enlaces, usePathname());
  const { grupos, pie } = gruposDelPanel(enlaces);
  return (
    <aside className="bg-card fixed top-0 left-0 z-50 hidden h-full w-[260px] flex-col border-r lg:flex">
      <div className="px-8 pt-8 pb-4">
        <MarcaDelPanel />
      </div>
      <nav
        aria-label="Panel"
        hidden={enlaces.length === 0}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-2"
      >
        <div className="flex-1 space-y-2">
          {grupos.map((grupo) => (
            <Grupo key={grupo.titulo ?? 'todas'} grupo={grupo} activo={activo} />
          ))}
        </div>
        <div className="mt-4 border-t pt-3">
          <Grupo grupo={{ titulo: null, enlaces: pie }} activo={activo} />
        </div>
      </nav>
      <div className="px-4 pb-4">
        <Salir nombre={nombre} />
      </div>
    </aside>
  );
}
