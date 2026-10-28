import Link from 'next/link';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { Seccion } from '@/components/panel/Seccion';
import type { PagoDelRecurrente } from '@/lib/gastos/consultas';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import { cn } from '@/lib/utils';

/** Los últimos seis pagos del fijo, para ver qué se pagó. Lo que falta está en Próximos pagos. */
export function PagosDelFijo({ pagos }: { pagos: PagoDelRecurrente[] }) {
  return (
    <Seccion titulo="Pagos" forma="lista">
      {pagos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no se pagó ninguno.</p>
      ) : (
        <ul aria-label="Pagos" className="divide-y divide-border border-y border-border">
          {pagos.map((pago) => (
            <li key={pago.id} className="py-3 flex items-center gap-3">
              <Link
                href={`/admin/gastos/${pago.id}`}
                className="flex-1 text-sm font-semibold hover:text-primary transition-colors"
              >
                {fechaParaMostrar(pago.fecha)}
              </Link>
              {pago.anulado ? <InsigniaDeEstado tono="pizarra">Anulado</InsigniaDeEstado> : null}
              <span
                className={cn(
                  'text-sm font-bold tabular-nums',
                  pago.anulado && 'line-through text-muted-foreground',
                )}
              >
                {formatearPesos(pago.monto_centavos)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Seccion>
  );
}
