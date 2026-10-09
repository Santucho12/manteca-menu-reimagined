import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { FilaDeGasto } from '@/lib/gastos/consultas';
import { fechaParaMostrar, nombreDeMedio } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';

function FilaDeLaLista({ gasto }: { gasto: FilaDeGasto }) {
  const detalle = [gasto.proveedor, nombreDeMedio(gasto.medio_de_pago)].filter(Boolean).join(' · ');
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 p-4">
      <div className="min-w-0 space-y-1">
        <Link
          href={`/admin/gastos/${gasto.id}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {gasto.categoria}
          {gasto.descripcion ? ` — ${gasto.descripcion}` : ''}
        </Link>
        <p className="text-muted-foreground text-sm">
          {fechaParaMostrar(gasto.fecha)} · {detalle}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {gasto.recurrente_id ? <Badge variant="secondary">Automático</Badge> : null}
        {gasto.cierre_id ? <Badge variant="secondary">De caja</Badge> : null}
        {gasto.anulado ? <Badge variant="outline">Anulado</Badge> : null}
        <span className={gasto.anulado ? 'text-muted-foreground line-through' : 'font-medium'}>
          {formatearPesos(gasto.monto_centavos)}
        </span>
      </div>
    </li>
  );
}

export function ListaDeGastos({ filas }: { filas: FilaDeGasto[] }) {
  if (filas.length === 0)
    return <p className="text-muted-foreground">No hay gastos para mostrar.</p>;
  return (
    <ul aria-label="Gastos" className="bg-card divide-y rounded-xl border">
      {filas.map((gasto) => (
        <FilaDeLaLista key={gasto.id} gasto={gasto} />
      ))}
    </ul>
  );
}
