import { Store } from 'lucide-react';
import Link from 'next/link';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { cn } from '@/lib/utils';
import { AccionesDeCanal } from './AccionesDeCanal';

type Canal = { id: string; nombre: string; activo: boolean };

/** Los canales de venta en tarjetas: el nombre grande y, a la derecha, editar y desactivar. */
export function TarjetasDeCanales({ canales }: { canales: Canal[] }) {
  return (
    <section aria-labelledby="canales-titulo" className="space-y-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2
          id="canales-titulo"
          className="text-base font-bold tracking-tight uppercase text-muted-foreground/80"
        >
          Tipos de venta
        </h2>
        <span className="px-2 py-1 bg-secondary rounded-md text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {canales.length} {canales.length === 1 ? 'tipo de venta' : 'tipos de venta'}
        </span>
      </div>
      <ul
        aria-label="Tipos de venta"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4"
      >
        {canales.map((canal) => (
          <li
            key={canal.id}
            className={cn(
              'group relative flex items-center gap-4 rounded-2xl border border-border bg-card p-4 md:p-5 shadow-[0_2px_10px_-4px_rgba(43,29,20,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl',
              !canal.activo && 'opacity-60',
            )}
          >
            <span
              aria-hidden="true"
              className="absolute top-0 left-6 right-6 h-1 rounded-b-full bg-primary/70"
            />
            <div className="shrink-0 rounded-xl bg-secondary p-3 text-foreground">
              <Store size={22} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <Link
                href={`/admin/ventas/canales/${canal.id}`}
                className="block truncate font-display text-lg font-bold tracking-tight text-foreground hover:text-primary transition-colors"
              >
                {canal.nombre}
              </Link>
              {canal.activo ? null : (
                <InsigniaDeEstado tono="pizarra">Desactivado</InsigniaDeEstado>
              )}
            </div>
            <AccionesDeCanal id={canal.id} nombre={canal.nombre} activo={canal.activo} />
          </li>
        ))}
      </ul>
    </section>
  );
}
