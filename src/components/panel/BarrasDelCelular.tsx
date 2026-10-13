'use client';

import { Ellipsis, LogOut, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { EnlaceDelMarco } from '@/lib/acceso/marco';
import { enlaceActivo, insigniaDeMas, repartirParaCelular } from '@/lib/acceso/navegacion';
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
      <span className="text-muted-foreground ml-auto min-w-0 truncate text-xs font-semibold">
        {nombre}
      </span>
      <form action="/admin/salir" method="post" className="shrink-0">
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

type PropsDeIcono = { Icono: LucideIcon; resaltado: boolean; insignia: number | null };

/** El icono de la barra de abajo, con el numero de lo que espera si hay algo. */
function IconoDeAbajo({ Icono, resaltado, insignia }: PropsDeIcono) {
  return (
    <span className="relative">
      <Icono
        size={20}
        strokeWidth={resaltado ? 2.5 : 2}
        className={resaltado ? 'text-accent' : undefined}
        aria-hidden
      />
      {insignia ? (
        <span className="bg-accent text-accent-foreground absolute -top-1.5 -right-2.5 rounded-full px-1 text-[9px] leading-4">
          {insignia}
        </span>
      ) : null}
    </span>
  );
}

function Abajo({ enlace, activo }: { enlace: EnlaceDelMarco; activo: boolean }) {
  return (
    <Link
      href={enlace.href}
      aria-current={activo ? 'page' : undefined}
      className={cn(BOTON, activo ? 'text-foreground' : 'text-muted-foreground')}
    >
      <IconoDeAbajo Icono={ICONOS[enlace.clave]} resaltado={activo} insignia={enlace.insignia} />
      <span className="max-w-full truncate px-0.5">{enlace.texto}</span>
    </Link>
  );
}

type PropsDeMas = { enlaces: EnlaceDelMarco[]; activo: string | null; cerrar: () => void };

// Se cierra al tocar afuera (el fondo), con Escape o al elegir una seccion.
function MasSecciones({ enlaces, activo, cerrar }: PropsDeMas) {
  useEffect(() => {
    const conEscape = (evento: KeyboardEvent) => evento.key === 'Escape' && cerrar();
    window.addEventListener('keydown', conEscape);
    return () => window.removeEventListener('keydown', conEscape);
  }, [cerrar]);
  return (
    <>
      <div aria-hidden className="fixed inset-0 z-40 lg:hidden" onClick={cerrar} />
      <nav
        id="mas-secciones"
        aria-label="Más secciones"
        className="bg-card fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-50 max-h-[calc(100dvh-8rem)] space-y-1 overflow-y-auto border-t p-4 shadow-lg lg:hidden"
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
    </>
  );
}

type Props = { nombre: string; enlaces: EnlaceDelMarco[] };

/** En el celular: la marca y Salir arriba; las secciones abajo, al alcance del pulgar. */
export function BarrasDelCelular({ nombre, enlaces }: Props) {
  const ruta = usePathname();
  const activo = enlaceActivo(enlaces, ruta);
  const { abajo, mas } = repartirParaCelular(enlaces);
  // Se recuerda en que pantalla se abrio "Mas": al cambiar de pantalla queda cerrado solo.
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null);
  const abierto = abiertoEn === ruta;
  const cerrar = () => setAbiertoEn(null);
  const resaltado = abierto || mas.some((enlace) => enlace.clave === activo);
  return (
    <>
      <Arriba nombre={nombre} />
      {abierto ? <MasSecciones enlaces={mas} activo={activo} cerrar={cerrar} /> : null}
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
            aria-controls="mas-secciones"
            onClick={() => setAbiertoEn(abierto ? null : ruta)}
            className={cn(BOTON, resaltado ? 'text-foreground' : 'text-muted-foreground')}
          >
            <IconoDeAbajo Icono={Ellipsis} resaltado={resaltado} insignia={insigniaDeMas(mas)} />
            <span>Más</span>
          </button>
        ) : null}
      </nav>
    </>
  );
}
