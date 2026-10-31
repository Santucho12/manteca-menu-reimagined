import { Receipt } from 'lucide-react';
import Link from 'next/link';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { ListaDelPanel, type Columna } from '@/components/panel/ListaDelPanel';
import { SinResultados } from '@/components/panel/SinResultados';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import type { FilaDeVenta } from '@/lib/ventas/consultas';
import { estadoDeVenta, horaDeVenta, tonoDeEstado } from '@/lib/ventas/pantalla';
import { MediosDePago, OrigenDeVenta } from './OrigenYMedio';

// El enlace de la fecha se estira sobre toda la fila: un clic en cualquier parte abre la venta.
const ENLACE =
  'text-xs font-semibold text-foreground hover:text-primary rounded whitespace-nowrap after:absolute after:inset-0 after:content-[""] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors';

const noCuenta = (v: FilaDeVenta) => v.anulado || v.estado !== 'cerrada';

const Total = ({ venta }: { venta: FilaDeVenta }) => (
  <span
    className={`text-sm font-bold whitespace-nowrap ${noCuenta(venta) ? 'text-muted-foreground line-through' : 'text-foreground'}`}
  >
    {formatearPesos(venta.total_centavos)}
  </span>
);

const Estado = ({ venta }: { venta: FilaDeVenta }) => (
  <InsigniaDeEstado tono={tonoDeEstado(venta)}>{estadoDeVenta(venta)}</InsigniaDeEstado>
);

function Fecha({ venta }: { venta: FilaDeVenta }) {
  const hora = horaDeVenta(venta.fecha, venta.cerrada_en);
  return (
    <div>
      <Link href={`/admin/ventas/${venta.id}`} className={ENLACE}>
        {fechaParaMostrar(venta.fecha)}
      </Link>
      {hora ? <p className="text-[11px] text-muted-foreground">{hora}</p> : null}
    </div>
  );
}

function Origen({ venta }: { venta: FilaDeVenta }) {
  return (
    <div>
      <OrigenDeVenta origen={venta.origen} />
      {venta.cargada_por ? (
        <p className="text-[11px] text-muted-foreground">Cargada por {venta.cargada_por}</p>
      ) : null}
      {venta.canal ? <p className="text-[11px] text-muted-foreground">{venta.canal}</p> : null}
    </div>
  );
}

const COLUMNAS: Columna<FilaDeVenta>[] = [
  { titulo: 'Fecha', celda: (v) => <Fecha venta={v} /> },
  { titulo: 'Origen', celda: (v) => <Origen venta={v} /> },
  { titulo: 'Medio', desde: 'lg', celda: (v) => <MediosDePago medios={v.medios} /> },
  { titulo: 'Estado', celda: (v) => <Estado venta={v} /> },
  { titulo: 'Total', alinear: 'der', celda: (v) => <Total venta={v} /> },
];

function Tarjeta({ venta }: { venta: FilaDeVenta }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <Fecha venta={venta} />
        <Total venta={venta} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Origen venta={venta} />
          <MediosDePago medios={venta.medios} />
        </div>
        <Estado venta={venta} />
      </div>
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
