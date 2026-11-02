import Link from 'next/link';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { PanelDeLista } from '@/components/panel/PanelDeLista';
import type { FilaDeRecurrente } from '@/lib/gastos/consultas';
import { nombreDelGasto } from '@/lib/gastos/filas';
import { faltaPagarEsteMes, proximosPagos } from '@/lib/gastos/fijos';
import { nombreDelMes } from '@/lib/gastos/meses';
import { agruparPorMes, type GrupoDeMes } from '@/lib/gastos/porMes';
import {
  dentroDeLosProximos,
  itemsPorPagar,
  type ItemPorPagar,
  type Pendiente,
} from '@/lib/gastos/porPagar';
import { formatearPesos } from '@/lib/plata';
import { FilaPorPagar } from './FilaPorPagar';

const NOMBRE = 'block text-sm font-semibold wrap-break-word hover:text-primary transition-colors';

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
  /** El pago que se abre al entrar, si el enlace lo pide. */
  pagar?: string | undefined;
};

// Cada mes abre con su nombre y lo que suma: se nota cuando lo que viene pasa al mes siguiente.
function Mes({
  grupo,
  hoy,
  pagar,
}: {
  grupo: GrupoDeMes<ItemPorPagar>;
  hoy: string;
  pagar?: string | undefined;
}) {
  return (
    <>
      <li
        role="presentation"
        className="mt-2 flex items-baseline justify-between gap-3 px-3 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground first:mt-0"
      >
        <span>{nombreDelMes(grupo.mes)}</span>
        <span className="tabular-nums">{formatearPesos(grupo.totalCentavos)}</span>
      </li>
      {grupo.items.map((item) => (
        <FilaPorPagar key={item.clave} item={item} hoy={hoy} pagar={pagar} />
      ))}
    </>
  );
}

// Se ve lo que vence en los próximos 30 días.
const DIAS_POR_DELANTE = 30;

/** Lo por pagar y el próximo pago de cada fijo activo, del más cercano al más lejano. */
export function ProximosPagos({ recurrentes, porPagar, tomados, hoy, pagar }: Props) {
  const todos = itemsPorPagar(porPagar, proximosPagos(recurrentes, hoy, tomados));
  const items = dentroDeLosProximos(todos, hoy, DIAS_POR_DELANTE);
  const pausados = recurrentes.filter((fijo) => !fijo.activo);
  const falta = faltaPagarEsteMes(todos, hoy);
  return (
    <PanelDeLista titulo="Próximos pagos" cantidad={String(items.length)} contador="rojo">
      {items.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground leading-relaxed">
          No hay nada por pagar en ese plazo. Cargá un gasto con «Todavía no», o uno que se repita.
        </p>
      ) : (
        <ul aria-label="Próximos pagos" className="space-y-0.5 p-2">
          {agruparPorMes(items).map((grupo) => (
            <Mes key={grupo.mes} grupo={grupo} hoy={hoy} pagar={pagar} />
          ))}
        </ul>
      )}
      <p className="m-3 rounded-2xl bg-secondary/50 px-4 py-3 text-sm font-semibold">
        {falta > 0
          ? `Falta pagar este mes: ${formatearPesos(falta)}`
          : 'Este mes no queda nada por pagar.'}
      </p>
      {pausados.length > 0 ? <Pausados pausados={pausados} /> : null}
    </PanelDeLista>
  );
}
