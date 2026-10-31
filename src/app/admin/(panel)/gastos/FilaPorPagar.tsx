import Link from 'next/link';
import { BotonDeAnular } from '@/components/panel/BotonDeAnular';
import { Chip } from '@/components/panel/Insignias';
import { cuandoVence } from '@/lib/gastos/fijos';
import { tonoDeLaMarca } from '@/lib/gastos/filas';
import { nombreDeFrecuencia } from '@/lib/gastos/pantalla';
import { esElPagoPedido, type ItemPorPagar } from '@/lib/gastos/porPagar';
import { formatearPesos } from '@/lib/plata';
import { cn } from '@/lib/utils';
import { anularPorPagarDesdeElPanel } from './acciones';
import { BaldosaDeFecha } from './BaldosaDeFecha';
import { BotonDePago } from './VentanaDePago';

// En la columna angosta, el nombre ocupa hasta dos renglones antes de cortarse.
const NOMBRE = 'block text-xs font-semibold line-clamp-2 break-words';

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
export function FilaPorPagar({
  item,
  hoy,
  pagar,
}: {
  item: ItemPorPagar;
  hoy: string;
  pagar?: string | undefined;
}) {
  const vencido = item.fecha < hoy;
  return (
    <li className="flex flex-wrap items-center gap-2.5 rounded-2xl px-3 py-2 transition-colors sm:flex-nowrap duration-200 hover:bg-secondary/50">
      <BaldosaDeFecha fecha={item.fecha} viene={!vencido} vencido={vencido} chica />
      <div className="flex-1 min-w-0">
        <Nombre item={item} />
        {/* Primero cuándo vence: si no entra, lo que se corta es el detalle. */}
        <p className="text-[10px] text-muted-foreground truncate">
          <span className={cn(vencido && 'font-bold text-rose-600')}>
            {cuandoVence(item.fecha, hoy)}
          </span>
          {item.frecuencia ? null : ` · ${item.detalle}`}
        </p>
        {item.frecuencia ? (
          <Chip tono={tonoDeLaMarca(`Fijo · ${nombreDeFrecuencia(item.frecuencia)}`)}>
            {`Fijo · ${nombreDeFrecuencia(item.frecuencia)}`}
          </Chip>
        ) : null}
      </div>
      <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:shrink-0 sm:flex-col sm:items-end">
        <span className="text-xs font-bold tabular-nums whitespace-nowrap">
          {formatearPesos(item.montoCentavos)}
        </span>
        <div className="flex items-center gap-1">
          <BotonDePago item={item} hoy={hoy} abierta={esElPagoPedido(item, pagar)} />
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
