import Link from 'next/link';
import { Chip } from '@/components/panel/Insignias';
import type { FilaDeGasto as Gasto } from '@/lib/gastos/consultas';
import { detalleDelGasto, marcasDelGasto, nombreDelGasto } from '@/lib/gastos/filas';
import { formatearPesos } from '@/lib/plata';
import { cn } from '@/lib/utils';
import { BaldosaDeFecha } from './BaldosaDeFecha';

/** Un gasto pagado: la fecha, qué fue, de qué categoría y proveedor, sus marcas y el monto. */
export function FilaDeGasto({ gasto }: { gasto: Gasto }) {
  const marcas = marcasDelGasto(gasto);
  return (
    <li className="px-4 md:px-5 py-3 flex items-center gap-3 hover:bg-secondary/40 transition-colors">
      <BaldosaDeFecha fecha={gasto.fecha} />
      <div className="flex-1 min-w-0 space-y-1">
        <Link
          href={`/admin/gastos/${gasto.id}`}
          className="block text-sm font-semibold truncate hover:text-primary transition-colors"
        >
          {nombreDelGasto(gasto)}
        </Link>
        <p className="text-[11px] text-muted-foreground truncate">{detalleDelGasto(gasto)}</p>
        {marcas.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {marcas.map((marca) => (
              <Chip key={marca}>{marca}</Chip>
            ))}
          </span>
        ) : null}
      </div>
      <span
        className={cn(
          'text-sm font-bold tabular-nums whitespace-nowrap',
          gasto.anulado ? 'text-muted-foreground line-through' : 'text-foreground',
        )}
      >
        {formatearPesos(gasto.monto_centavos)}
      </span>
    </li>
  );
}
