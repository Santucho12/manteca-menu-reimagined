import Link from 'next/link';
import type { EnlaceDelMarco } from '@/lib/acceso/marco';
import { cn } from '@/lib/utils';
import { ICONOS } from './iconos';

type Props = { enlace: EnlaceDelMarco; activo: boolean; alTocar?: () => void; oscura?: boolean };

const BASE =
  'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 [@media(max-height:820px)]:py-2.5';

// La sidebar es oscura; la lista de "Mas" del celular, clara.
const ESTILOS = {
  oscura: {
    activo:
      'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30',
    inactivo: 'text-white/60 hover:bg-white/10 hover:text-white',
    insignia: 'bg-white/20 text-white',
  },
  clara: {
    activo: 'bg-accent/10 text-accent ring-accent/30 ring-1',
    inactivo: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
    insignia: 'bg-accent text-accent-foreground',
  },
};

/** Un enlace de la sidebar (y de "Mas" en el celular), con su icono; la seccion activa resaltada. */
export function EnlaceDelPanel({ enlace, activo, alTocar, oscura = false }: Props) {
  const Icono = ICONOS[enlace.clave];
  const estilo = ESTILOS[oscura ? 'oscura' : 'clara'];
  return (
    <Link
      href={enlace.href}
      onClick={alTocar}
      aria-current={activo ? 'page' : undefined}
      className={cn(BASE, activo ? estilo.activo : estilo.inactivo)}
    >
      <Icono size={20} strokeWidth={activo ? 2.4 : 2} aria-hidden />
      <span>{enlace.texto}</span>
      {enlace.insignia ? (
        <span className={cn('ml-auto rounded-full px-2 py-0.5 text-xs font-bold', estilo.insignia)}>
          {enlace.insignia}
        </span>
      ) : null}
    </Link>
  );
}
