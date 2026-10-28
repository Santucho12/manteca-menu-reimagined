import Link from 'next/link';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { PanelDeLista } from '@/components/panel/PanelDeLista';
import type { FilaDeRecurrente } from '@/lib/gastos/consultas';
import { nombreDelGasto } from '@/lib/gastos/filas';
import { faltaPagarEsteMes, proximosPagos } from '@/lib/gastos/fijos';
import { itemsPorPagar, type Pendiente } from '@/lib/gastos/porPagar';
import { formatearPesos } from '@/lib/plata';
import { FilaPorPagar } from './FilaPorPagar';

const NOMBRE = 'block text-sm font-semibold truncate hover:text-primary transition-colors';

function Pausados({ pausados }: { pausados: FilaDeRecurrente[] }) {
  return (
    <details className="border-t border-border">
      <summary className="px-4 md:px-6 py-3 text-xs font-bold text-muted-foreground cursor-pointer hover:text-foreground">
        Pausados ({pausados.length})
      </summary>
      <ul aria-label="Pausados" className="divide-y divide-border border-t border-border">
        {pausados.map((fijo) => (
          <li key={fijo.id} className="px-4 md:px-5 py-3 flex items-center gap-3">
            <Link href={`/admin/gastos/fijos/${fijo.id}`} className={`${NOMBRE} flex-1 min-w-0`}>
              {nombreDelGasto(fijo)}
            </Link>
            <InsigniaDeEstado tono="pizarra">Pausado</InsigniaDeEstado>
          </li>
        ))}
      </ul>
    </details>
  );
}

type Props = {
  recurrentes: FilaDeRecurrente[];
  porPagar: Pendiente[];
  /** Vencimientos de fijos que ya tienen su por pagar: el próximo pago los saltea. */
  tomados: Set<string>;
  hoy: string;
};

/** Lo por pagar y el próximo pago de cada fijo activo, del más cercano al más lejano. */
export function ProximosPagos({ recurrentes, porPagar, tomados, hoy }: Props) {
  const items = itemsPorPagar(porPagar, proximosPagos(recurrentes, hoy, tomados));
  const pausados = recurrentes.filter((fijo) => !fijo.activo);
  const falta = faltaPagarEsteMes(items, hoy);
  return (
    <PanelDeLista titulo="Próximos pagos" cantidad={String(items.length)}>
      {items.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground leading-relaxed">
          No hay nada por pagar. Cargá un gasto con «Todavía no», o uno que se repita.
        </p>
      ) : (
        <ul aria-label="Próximos pagos" className="divide-y divide-border">
          {items.map((item) => (
            <FilaPorPagar key={item.clave} item={item} hoy={hoy} />
          ))}
        </ul>
      )}
      <p className="px-4 md:px-6 py-3 border-t border-border text-sm font-semibold">
        {falta > 0
          ? `Falta pagar este mes: ${formatearPesos(falta)}`
          : 'Este mes no queda nada por pagar.'}
      </p>
      {pausados.length > 0 ? <Pausados pausados={pausados} /> : null}
    </PanelDeLista>
  );
}
