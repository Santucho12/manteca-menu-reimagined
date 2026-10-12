'use client';

import { Ellipsis, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { EnlaceDelMarco } from '@/lib/acceso/marco';
import { enlaceActivo, repartirParaCelular } from '@/lib/acceso/navegacion';
import { cn } from '@/lib/utils';
import { EnlaceDelPanel } from './EnlaceDelPanel';
import { ICONOS } from './iconos';
import { MarcaDelPanel } from './MarcaDelPanel';

const BOTON =
  'flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[9px] font-bold transition-colors';

// A diferencia de Plan Reminder Pro, se ve quien tiene la sesion: el celular puede ser del local.
function Arriba({ nombre }: { nombre: string }) {
  return (
    <header className="bg-card/95 fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between gap-2 border-b px-4 backdrop-blur lg:hidden">
      <MarcaDelPanel chica />
      <span className="text-muted-foreground ml-auto truncate text-xs font-semibold">{nombre}</span>
      <form action="/admin/salir" method="post">
        <button
          type="submit"
          aria-label="Salir"
          className="text-muted-foreground flex h-9 w-9 items-center justify-center rounded-xl"
        >
          <LogOut size={18} aria-hidden />
        </button>
      </form>
    </header>
  );
}

function Abajo({ enlace, activo }: { enlace: EnlaceDelMarco; activo: boolean }) {
  const Icono = ICONOS[enlace.clave];
  return (
    <Link
      href={enlace.href}
      aria-current={activo ? 'page' : undefined}
      className={cn(BOTON, activo ? 'text-primary' : 'text-muted-foreground')}
    >
      <Icono size={20} strokeWidth={activo ? 2.5 : 2} aria-hidden />
      <span className="max-w-full truncate px-0.5">{enlace.texto}</span>
    </Link>
  );
}

type PropsDeMas = { enlaces: EnlaceDelMarco[]; activo: string | null; cerrar: () => void };

function MasSecciones({ enlaces, activo, cerrar }: PropsDeMas) {
  return (
    <nav
      aria-label="Más secciones"
      className="bg-card fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-50 space-y-1 border-t p-4 shadow-lg lg:hidden"
    >
      {enlaces.map((enlace) => (
        <EnlaceDelPanel
          key={enlace.clave}
          enlace={enlace}
          activo={enlace.clave === activo}
          alTocar={cerrar}
        />
      ))}
    </nav>
  );
}

type Props = { nombre: string; enlaces: EnlaceDelMarco[] };

/** En el celular: la marca y Salir arriba; las secciones abajo, al alcance del pulgar. */
export function BarrasDelCelular({ nombre, enlaces }: Props) {
  const activo = enlaceActivo(enlaces, usePathname());
  const { abajo, mas } = repartirParaCelular(enlaces);
  const [abierto, setAbierto] = useState(false);
  const enMas = mas.some((enlace) => enlace.clave === activo);
  return (
    <>
      <Arriba nombre={nombre} />
      {abierto ? (
        <MasSecciones enlaces={mas} activo={activo} cerrar={() => setAbierto(false)} />
      ) : null}
      <nav
        aria-label="Panel"
        hidden={enlaces.length === 0}
        className="bg-card/95 fixed inset-x-0 bottom-0 z-50 flex border-t pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {abajo.map((enlace) => (
          <Abajo key={enlace.clave} enlace={enlace} activo={enlace.clave === activo} />
        ))}
        {mas.length > 0 ? (
          <button
            type="button"
            aria-expanded={abierto}
            onClick={() => setAbierto(!abierto)}
            className={cn(BOTON, abierto || enMas ? 'text-primary' : 'text-muted-foreground')}
          >
            <Ellipsis size={20} aria-hidden />
            <span>Más</span>
          </button>
        ) : null}
      </nav>
    </>
  );
}
