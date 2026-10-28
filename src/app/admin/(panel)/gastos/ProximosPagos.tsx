import Link from 'next/link';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { PanelDeLista } from '@/components/panel/PanelDeLista';
import type { FilaDeRecurrente } from '@/lib/gastos/consultas';
import { nombreDelGasto } from '@/lib/gastos/filas';
import {
  cuandoVence,
  faltaPagarEsteMes,
  proximosPagos,
  type ProximoPago,
} from '@/lib/gastos/fijos';
import { nombreDeFrecuencia } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import { BaldosaDeFecha } from './BaldosaDeFecha';

const NOMBRE = 'block text-sm font-semibold truncate hover:text-primary transition-colors';

function FilaDeProximo({ proximo, hoy }: { proximo: ProximoPago; hoy: string }) {
  const detalle = [nombreDeFrecuencia(proximo.frecuencia), cuandoVence(proximo.fecha, hoy)];
  return (
    <li className="px-4 md:px-5 py-3 flex items-center gap-3 hover:bg-secondary/40 transition-colors">
      <BaldosaDeFecha fecha={proximo.fecha} viene />
      <div className="flex-1 min-w-0">
        <Link href={`/admin/gastos/fijos/${proximo.id}`} className={NOMBRE}>
          {proximo.nombre}
        </Link>
        <p className="text-[11px] text-muted-foreground truncate">
          {detalle.filter(Boolean).join(' · ')}
        </p>
      </div>
      <span className="text-sm font-bold tabular-nums whitespace-nowrap">
        {formatearPesos(proximo.montoCentavos)}
      </span>
    </li>
  );
}

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

/** Cada gasto fijo activo con su próximo pago, del más cercano al más lejano. */
export function ProximosPagos({
  recurrentes,
  hoy,
}: {
  recurrentes: FilaDeRecurrente[];
  hoy: string;
}) {
  const proximos = proximosPagos(recurrentes, hoy);
  const pausados = recurrentes.filter((fijo) => !fijo.activo);
  const falta = faltaPagarEsteMes(proximos, hoy);
  return (
    <PanelDeLista titulo="Próximos pagos" cantidad={String(proximos.length)}>
      {proximos.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground leading-relaxed">
          Todavía no hay gastos fijos. Cargá uno con Cargar gasto y elegí cada cuánto se repite.
        </p>
      ) : (
        <ul aria-label="Próximos pagos" className="divide-y divide-border">
          {proximos.map((proximo) => (
            <FilaDeProximo key={proximo.id} proximo={proximo} hoy={hoy} />
          ))}
        </ul>
      )}
      <p className="px-4 md:px-6 py-3 border-t border-border text-sm font-semibold">
        {falta > 0
          ? `Falta pagar este mes: ${formatearPesos(falta)}`
          : 'Este mes no quedan pagos fijos.'}
      </p>
      {pausados.length > 0 ? <Pausados pausados={pausados} /> : null}
    </PanelDeLista>
  );
}
