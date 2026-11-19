import { Store } from 'lucide-react';
import Link from 'next/link';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { cn } from '@/lib/utils';
import { AccionesDeCanal } from './AccionesDeCanal';

type Canal = {
  id: string;
  nombre: string;
  activo: boolean;
  de_sistema: boolean;
  se_controla_en_el_cierre: boolean;
};

/** Los tipos de venta en una sola tarjeta: una fila por tipo, con editar, activar y borrar a la derecha. */
export function TarjetasDeCanales({ canales }: { canales: Canal[] }) {
  return (
    <section
      aria-labelledby="canales-titulo"
      className="rounded-3xl border border-border bg-white p-3 shadow-sm shadow-slate-900/5 md:p-4"
    >
      <div className="flex items-center justify-between gap-3 px-3 pb-3 pt-2">
        <h2 id="canales-titulo" className="font-display text-lg font-bold tracking-tight">
          Tipos de venta
        </h2>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
          {canales.length} {canales.length === 1 ? 'tipo' : 'tipos'}
        </span>
      </div>
      <ul aria-label="Tipos de venta" className="space-y-0.5">
        {canales.map((canal) => (
          <li
            key={canal.id}
            className={cn(
              'flex items-center gap-3 rounded-2xl px-3 py-1.5 transition-colors duration-200 hover:bg-secondary/50',
              !canal.activo && 'opacity-60',
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Store size={16} aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <Link
                href={`/admin/ventas/canales/${canal.id}`}
                className="min-w-0 wrap-break-word text-sm font-bold text-foreground"
              >
                {canal.nombre}
              </Link>
              {canal.activo ? null : (
                <InsigniaDeEstado tono="pizarra">Desactivado</InsigniaDeEstado>
              )}
            </div>
            <AccionesDeCanal
              id={canal.id}
              nombre={canal.nombre}
              activo={canal.activo}
              controla={canal.de_sistema ? null : canal.se_controla_en_el_cierre}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
