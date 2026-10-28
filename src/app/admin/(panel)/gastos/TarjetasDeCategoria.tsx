import { ChevronDown, Filter } from 'lucide-react';
import Link from 'next/link';
import { enlaceDeGastos, fechaParaMostrar, type FiltrosDeGastos } from '@/lib/gastos/pantalla';
import type { ResumenDeCategoria } from '@/lib/gastos/porCategoria';
import { formatearPesos } from '@/lib/plata';
import { cn } from '@/lib/utils';

type Props = { resumen: ResumenDeCategoria[]; filtros: FiltrosDeGastos; hoy: string };

function GastosDeLaCategoria({ categoria }: { categoria: ResumenDeCategoria }) {
  return (
    <ul
      aria-label={`Gastos de ${categoria.nombre}`}
      className="divide-y divide-border border-t border-border"
    >
      {categoria.gastos.map((gasto) => (
        <li
          key={gasto.id}
          className="flex items-baseline justify-between gap-3 px-4 py-1.5 text-xs"
        >
          <span className="min-w-0 truncate">
            <span className="font-bold text-muted-foreground">
              {fechaParaMostrar(gasto.fecha).slice(0, 5)}
            </span>{' '}
            {gasto.descripcion ?? 'Sin descripción'}
          </span>
          <span className="shrink-0 font-bold tabular-nums">
            {formatearPesos(gasto.montoCentavos)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Tarjeta({
  categoria,
  filtros,
  hoy,
}: { categoria: ResumenDeCategoria } & Omit<Props, 'resumen'>) {
  const activa = filtros.categoriaId === categoria.categoriaId;
  const destino = { ...filtros, categoriaId: activa ? null : categoria.categoriaId, pagina: 1 };
  return (
    <details
      className={cn(
        'group self-start rounded-2xl border transition-colors',
        activa ? 'bg-secondary border-foreground/25 shadow-md' : 'bg-card border-border shadow-xs',
      )}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-2 p-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block truncate text-xs font-black uppercase tracking-widest text-muted-foreground">
            {categoria.nombre}
          </span>
          <strong className="mt-1 block font-display text-xl font-bold tracking-tight">
            {formatearPesos(categoria.totalCentavos)}
          </strong>
          <span className="text-xs text-muted-foreground">
            {categoria.cantidad === 1 ? '1 gasto' : `${categoria.cantidad} gastos`}
          </span>
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <GastosDeLaCategoria categoria={categoria} />
      <Link
        href={enlaceDeGastos(destino, hoy)}
        aria-current={activa ? 'true' : undefined}
        className="flex items-center gap-1.5 border-t border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary/60"
      >
        <Filter size={12} aria-hidden="true" />{' '}
        {activa ? 'Ver todos los gastos' : 'Filtrar la lista'}
      </Link>
    </details>
  );
}

/** Una tarjeta por categoria con gastos en el mes: se abre para ver cuales son y filtra la lista. */
export function TarjetasDeCategoria({ resumen, filtros, hoy }: Props) {
  if (resumen.length === 0) return null;
  return (
    <ul
      aria-label="Categorías del mes"
      className="grid grid-cols-2 md:grid-cols-3 gap-3 items-start"
    >
      {resumen.map((categoria) => (
        <li key={categoria.categoriaId}>
          <Tarjeta categoria={categoria} filtros={filtros} hoy={hoy} />
        </li>
      ))}
    </ul>
  );
}
