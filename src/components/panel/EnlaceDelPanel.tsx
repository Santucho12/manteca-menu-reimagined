import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { EnlaceDelMarco } from '@/lib/acceso/marco';
import { cn } from '@/lib/utils';
import { ICONOS } from './iconos';

type Props = { enlace: EnlaceDelMarco; activo: boolean; alTocar?: () => void };

/** Un enlace de la sidebar (y de "Mas" en el celular): pildora con icono, la activa resaltada. */
export function EnlaceDelPanel({ enlace, activo, alTocar }: Props) {
  const Icono = ICONOS[enlace.clave];
  return (
    <Link
      href={enlace.href}
      onClick={alTocar}
      aria-current={activo ? 'page' : undefined}
      className={cn(
        // Plan Reminder Pro tiene 5 secciones y aca son 10: en una pantalla baja se achica el alto.
        'flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-300 [@media(max-height:820px)]:py-2.5',
        activo
          ? 'text-primary bg-primary/10 ring-primary/20 shadow-sm ring-1'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
      )}
    >
      <Icono size={20} strokeWidth={activo ? 2.5 : 2} aria-hidden />
      <span>{enlace.texto}</span>
      {enlace.insignia ? <Badge className="ml-auto">{enlace.insignia}</Badge> : null}
    </Link>
  );
}
