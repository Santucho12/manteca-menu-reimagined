import Link from 'next/link';
import type { EnlaceDelMarco } from '@/lib/acceso/marco';
import { cn } from '@/lib/utils';
import { ICONOS } from './iconos';

type Props = { enlace: EnlaceDelMarco; activo: boolean; alTocar?: () => void };

const BASE =
  'relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors duration-200 [@media(max-height:820px)]:py-2.5';
// La seccion activa: una pestaña dorada al costado y el texto en negrita, sin fondo (pedido 40).
const ACTIVO =
  'text-foreground font-bold before:absolute before:top-1/2 before:-left-4 before:h-6 before:w-1.5 before:-translate-y-1/2 before:rounded-r-full before:bg-accent';
const INACTIVO = 'text-muted-foreground font-semibold hover:bg-secondary hover:text-foreground';

/** Un enlace de la sidebar (y de "Mas" en el celular), con su icono y lo que tiene pendiente. */
export function EnlaceDelPanel({ enlace, activo, alTocar }: Props) {
  const Icono = ICONOS[enlace.clave];
  return (
    <Link
      href={enlace.href}
      onClick={alTocar}
      aria-current={activo ? 'page' : undefined}
      className={cn(BASE, activo ? ACTIVO : INACTIVO)}
    >
      <Icono size={20} strokeWidth={activo ? 2.5 : 2} aria-hidden />
      <span>{enlace.texto}</span>
      {enlace.insignia ? (
        <span className="bg-accent text-accent-foreground ml-auto grid min-w-6 place-items-center rounded-full px-1.5 py-0.5 text-xs font-bold">
          {enlace.insignia}
        </span>
      ) : null}
    </Link>
  );
}
