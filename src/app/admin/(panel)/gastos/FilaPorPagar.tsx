import Link from 'next/link';
import { cuandoVence } from '@/lib/gastos/fijos';
import type { ItemPorPagar } from '@/lib/gastos/porPagar';
import { formatearPesos } from '@/lib/plata';
import { cn } from '@/lib/utils';
import { BaldosaDeFecha } from './BaldosaDeFecha';

const NOMBRE = 'block text-sm font-semibold truncate';

/** Lo de un fijo lleva a su ficha; lo anotado suelto no tiene otra pantalla. */
function Nombre({ item }: { item: ItemPorPagar }) {
  if (!item.fijoId) return <p className={NOMBRE}>{item.nombre}</p>;
  return (
    <Link
      href={`/admin/gastos/fijos/${item.fijoId}`}
      className={cn(NOMBRE, 'hover:text-primary transition-colors')}
    >
      {item.nombre}
    </Link>
  );
}

/** Una fila de Próximos pagos: cuándo vence, qué es y cuánto. Lo vencido, en rosa. */
export function FilaPorPagar({ item, hoy }: { item: ItemPorPagar; hoy: string }) {
  const vencido = item.fecha < hoy;
  return (
    <li className="px-4 md:px-5 py-3 flex items-center gap-3 hover:bg-secondary/40 transition-colors">
      <BaldosaDeFecha fecha={item.fecha} viene={!vencido} vencido={vencido} />
      <div className="flex-1 min-w-0">
        <Nombre item={item} />
        <p className="text-[11px] text-muted-foreground truncate">
          {item.detalle} ·{' '}
          <span className={cn(vencido && 'font-bold text-rose-600')}>
            {cuandoVence(item.fecha, hoy)}
          </span>
        </p>
      </div>
      <span className="text-sm font-bold tabular-nums whitespace-nowrap">
        {formatearPesos(item.montoCentavos)}
      </span>
    </li>
  );
}
