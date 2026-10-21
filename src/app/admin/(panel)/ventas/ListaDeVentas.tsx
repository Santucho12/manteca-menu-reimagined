import { ChevronRight, Receipt } from 'lucide-react';
import Link from 'next/link';
import { Pildora } from '@/components/panel/Piezas';
import { nombreDeMedio } from '@/lib/caja/pantalla';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import type { FilaDeVenta } from '@/lib/ventas/consultas';
import { estadoDeVenta, nombreDeOrigen } from '@/lib/ventas/pantalla';

const FILA =
  'group relative flex items-center gap-4 px-6 py-4 transition-colors duration-200 hover:bg-secondary/60';

function Fila({ venta }: { venta: FilaDeVenta }) {
  const detalle = [nombreDeOrigen(venta.origen), venta.canal, ...venta.medios.map(nombreDeMedio)];
  const noCuenta = venta.anulado || venta.estado !== 'cerrada';
  return (
    <li>
      <div className={FILA}>
        <span className="bg-accent/15 grid size-10 shrink-0 place-items-center rounded-xl">
          <Receipt size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <Link
            href={`/admin/ventas/${venta.id}`}
            className="font-bold underline-offset-4 after:absolute after:inset-0 hover:underline"
          >
            {fechaParaMostrar(venta.fecha)}
          </Link>
          <p className="text-muted-foreground truncate text-sm">
            {detalle.filter(Boolean).join(' · ')}
          </p>
        </div>
        {noCuenta ? <Pildora>{estadoDeVenta(venta)}</Pildora> : null}
        <span
          className={`font-heading text-lg font-bold tabular-nums ${noCuenta ? 'text-muted-foreground line-through' : ''}`}
        >
          {formatearPesos(venta.total_centavos)}
        </span>
        <ChevronRight
          size={18}
          aria-hidden="true"
          className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </li>
  );
}

export function ListaDeVentas({ filas }: { filas: FilaDeVenta[] }) {
  if (filas.length === 0)
    return (
      <p className="text-muted-foreground px-6 py-12 text-center">No hay ventas para mostrar.</p>
    );
  return (
    <ul aria-label="Ventas" className="divide-y">
      {filas.map((venta) => (
        <Fila key={venta.id} venta={venta} />
      ))}
    </ul>
  );
}
