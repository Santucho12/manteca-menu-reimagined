'use client';

import Link from 'next/link';
import type { EnlaceDelMarco } from '@/lib/acceso/marco';
import { esProximamente } from '@/lib/acceso/proximamente';
import { cn } from '@/lib/utils';
import { avisarProximamente } from './avisarProximamente';
import { LUGAR_DE_ABAJO } from './estilos';
import { ICONOS_DEL_PANEL } from './iconos';
import { Insignia } from './Insignia';

type Props = { enlace: EnlaceDelMarco; activo: boolean };

/** Un lugar de la barra de abajo del celular. */
export function EnlaceDeAbajo({ enlace, activo }: Props) {
  const Icono = ICONOS_DEL_PANEL[enlace.clave];
  return (
    <Link
      href={enlace.href}
      onClick={(evento) => {
        if (!esProximamente(enlace.clave)) return;
        evento.preventDefault();
        avisarProximamente(enlace.texto);
      }}
      aria-current={activo ? 'page' : undefined}
      className={cn(LUGAR_DE_ABAJO, activo ? 'text-primary' : 'text-muted-foreground')}
    >
      <span className="relative">
        <Insignia numero={enlace.insignia} lugar="abajo" />
        <Icono size={20} strokeWidth={activo ? 2.5 : 2} />
      </span>
      <span className="truncate max-w-full px-0.5">{enlace.texto}</span>
    </Link>
  );
}
