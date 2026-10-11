import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { nombreDeMedio } from '@/lib/caja/pantalla';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import type { FilaDeVenta } from '@/lib/ventas/consultas';
import { estadoDeVenta, nombreDeOrigen } from '@/lib/ventas/pantalla';

function Fila({ venta }: { venta: FilaDeVenta }) {
  const detalle = [nombreDeOrigen(venta.origen), venta.canal, ...venta.medios.map(nombreDeMedio)];
  const noCuenta = venta.anulado || venta.estado !== 'cerrada';
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 p-4">
      <div className="min-w-0 space-y-1">
        <Link
          href={`/admin/ventas/${venta.id}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {fechaParaMostrar(venta.fecha)}
        </Link>
        <p className="text-muted-foreground text-sm">{detalle.filter(Boolean).join(' · ')}</p>
      </div>
      <div className="flex items-center gap-2">
        {noCuenta ? <Badge variant="outline">{estadoDeVenta(venta)}</Badge> : null}
        <span className={noCuenta ? 'text-muted-foreground line-through' : 'font-medium'}>
          {formatearPesos(venta.total_centavos)}
        </span>
      </div>
    </li>
  );
}

export function ListaDeVentas({ filas }: { filas: FilaDeVenta[] }) {
  if (filas.length === 0)
    return <p className="text-muted-foreground">No hay ventas para mostrar.</p>;
  return (
    <ul aria-label="Ventas" className="bg-card divide-y rounded-xl border">
      {filas.map((venta) => (
        <Fila key={venta.id} venta={venta} />
      ))}
    </ul>
  );
}
