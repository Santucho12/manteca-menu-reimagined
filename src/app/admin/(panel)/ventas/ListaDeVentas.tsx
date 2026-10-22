import { Receipt } from 'lucide-react';
import Link from 'next/link';
import { Chip } from '@/components/panel/Insignias';
import { ListaDelPanel, type Columna } from '@/components/panel/ListaDelPanel';
import { SinResultados } from '@/components/panel/SinResultados';
import { nombreDeMedio } from '@/lib/caja/pantalla';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import type { FilaDeVenta } from '@/lib/ventas/consultas';
import { estadoDeVenta, nombreDeOrigen } from '@/lib/ventas/pantalla';

const ENLACE =
  'text-xs font-semibold text-foreground hover:text-primary rounded focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors';

const noCuenta = (v: FilaDeVenta) => v.anulado || v.estado !== 'cerrada';
const detalleDe = (v: FilaDeVenta) =>
  [nombreDeOrigen(v.origen), v.canal, ...v.medios.map(nombreDeMedio)].filter(Boolean).join(' · ');

const Total = ({ venta }: { venta: FilaDeVenta }) => (
  <span
    className={`text-sm font-bold whitespace-nowrap ${noCuenta(venta) ? 'text-muted-foreground line-through' : 'text-foreground'}`}
  >
    {formatearPesos(venta.total_centavos)}
  </span>
);

const Estado = ({ venta }: { venta: FilaDeVenta }) =>
  noCuenta(venta) ? <Chip>{estadoDeVenta(venta)}</Chip> : null;

const COLUMNAS: Columna<FilaDeVenta>[] = [
  {
    titulo: 'Fecha',
    celda: (v) => (
      <Link href={`/admin/ventas/${v.id}`} className={`${ENLACE} whitespace-nowrap`}>
        {fechaParaMostrar(v.fecha)}
      </Link>
    ),
  },
  { titulo: 'Origen', celda: (v) => <span className="text-xs">{nombreDeOrigen(v.origen)}</span> },
  { titulo: 'Canal', desde: 'lg', celda: (v) => <span className="text-xs">{v.canal ?? '—'}</span> },
  {
    titulo: 'Medio',
    desde: 'lg',
    celda: (v) => <span className="text-xs">{v.medios.map(nombreDeMedio).join(' · ') || '—'}</span>,
  },
  { titulo: 'Estado', celda: (v) => <Estado venta={v} /> },
  { titulo: 'Total', alinear: 'der', celda: (v) => <Total venta={v} /> },
];

function Tarjeta({ venta }: { venta: FilaDeVenta }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <Link href={`/admin/ventas/${venta.id}`} className="text-sm font-bold">
          {fechaParaMostrar(venta.fecha)}
        </Link>
        <Total venta={venta} />
      </div>
      <p className="text-xs text-muted-foreground">{detalleDe(venta)}</p>
      <Estado venta={venta} />
    </>
  );
}

type Props = { filas: FilaDeVenta[]; total: number };

/** Las ventas en la tabla de Plan Reminder Pro (y tarjetas en el celular). */
export function ListaDeVentas({ filas, total }: Props) {
  if (filas.length === 0) {
    return (
      <SinResultados
        titulo="No hay ventas para mostrar"
        texto="No hay registros que coincidan con tus filtros."
      />
    );
  }
  return (
    <ListaDelPanel
      etiqueta="Ventas"
      icono={Receipt}
      total={total}
      filas={filas}
      clave={(v) => v.id}
      columnas={COLUMNAS}
      tarjeta={(v) => <Tarjeta venta={v} />}
    />
  );
}
