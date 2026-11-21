import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Una píldora de color para distinguir algo de un vistazo (un turno, una acción). El color sale de
 * la regla del sistema (coloresDelSistema): verde bien, rojo mal, gris apagado, el resto distingue.
 */
export function EtiquetaDeColor({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold',
        color,
      )}
    >
      {children}
    </span>
  );
}

/** La persona por su nombre, sin inicial: alcanza con el nombre (Santiago, 2026-11-21). */
export function Persona({ nombre }: { nombre: string | null | undefined }) {
  if (!nombre) return <span className="text-xs text-muted-foreground">—</span>;
  return <span className="text-xs font-semibold text-foreground">{nombre}</span>;
}
