'use client';

import { LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { EnlaceDelMarco } from '@/lib/acceso/marco';
import { enlaceActivo } from '@/lib/acceso/navegacion';
import { EnlaceDelPanel } from './EnlaceDelPanel';
import { MarcaDelPanel } from './MarcaDelPanel';

type Props = { nombre: string; enlaces: EnlaceDelMarco[] };

function UsuarioYSalir({ nombre }: { nombre: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white"
      >
        {nombre.charAt(0).toUpperCase()}
      </span>
      <p className="min-w-0 flex-1 truncate text-xs font-semibold text-white/80">{nombre}</p>
      <form action="/admin/salir" method="post">
        <button
          type="submit"
          className="flex min-h-9 items-center gap-2 rounded-xl px-2.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut size={16} aria-hidden />
          Salir
        </button>
      </form>
    </div>
  );
}

/** La sidebar de la computadora: un panel oscuro flotante con la marca, las secciones y quien esta. */
export function BarraLateral({ nombre, enlaces }: Props) {
  const activo = enlaceActivo(enlaces, usePathname());
  return (
    <aside className="fixed top-3 bottom-3 left-3 z-50 hidden w-[252px] flex-col rounded-[28px] bg-[#0b0d14] shadow-2xl shadow-slate-900/30 lg:flex">
      <div className="p-6 pb-4">
        <MarcaDelPanel />
      </div>
      <nav
        aria-label="Panel"
        hidden={enlaces.length === 0}
        className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-2"
      >
        {enlaces.map((enlace) => (
          <EnlaceDelPanel
            key={enlace.clave}
            enlace={enlace}
            activo={enlace.clave === activo}
            oscura
          />
        ))}
      </nav>
      <div className="p-3">
        <UsuarioYSalir nombre={nombre} />
      </div>
    </aside>
  );
}
