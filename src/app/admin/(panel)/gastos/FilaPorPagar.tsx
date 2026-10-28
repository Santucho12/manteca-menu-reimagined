import Link from 'next/link';
import { BotonDeAnular } from '@/components/panel/BotonDeAnular';
import { cuandoVence } from '@/lib/gastos/fijos';
import type { ItemPorPagar } from '@/lib/gastos/porPagar';
import { formatearPesos } from '@/lib/plata';
import { cn } from '@/lib/utils';
import { anularPorPagarDesdeElPanel } from './acciones';
import { BaldosaDeFecha } from './BaldosaDeFecha';
import { BotonDePago } from './VentanaDePago';

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
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-sm font-bold tabular-nums whitespace-nowrap">
          {formatearPesos(item.montoCentavos)}
        </span>
        <div className="flex items-center gap-1">
          <BotonDePago item={item} hoy={hoy} />
          {item.porPagarId ? (
            <BotonDeAnular
              id={item.porPagarId}
              anular={anularPorPagarDesdeElPanel}
              titulo={`No se paga: ${item.nombre}`}
              texto="No se paga"
              confirmar="Confirmar"
              aviso="Quitado de por pagar"
              compacto
            />
          ) : null}
        </div>
      </div>
    </li>
  );
}
