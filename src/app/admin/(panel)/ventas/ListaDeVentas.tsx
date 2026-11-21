import { Pencil, Receipt } from 'lucide-react';
import Link from 'next/link';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { ListaDelPanel, type Columna } from '@/components/panel/ListaDelPanel';
import { SinResultados } from '@/components/panel/SinResultados';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import { textoDelDescuento } from '@/lib/ventas/porCantidad';
import type { FilaDeVenta } from '@/lib/ventas/consultas';
import { estadoDeVenta, horaDeVenta, tonoDeEstado } from '@/lib/ventas/pantalla';
import { colorDelTipo } from '@/lib/panel/coloresDelSistema';
import { MediosDePago } from './OrigenYMedio';
import { EtiquetaDeColor, Persona } from '@/components/panel/Etiquetas';

// El enlace de la fecha se estira sobre toda la fila: un clic en cualquier parte abre la venta.
const ENLACE =
  'text-xs font-semibold text-foreground hover:text-emerald-700 rounded whitespace-nowrap after:absolute after:inset-0 after:content-[""] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition-colors';

const noCuenta = (v: FilaDeVenta) => v.anulado || v.estado !== 'cerrada';

const Total = ({ venta }: { venta: FilaDeVenta }) => (
  <span className="inline-flex flex-col items-end">
    <span
      className={`text-sm font-bold whitespace-nowrap ${noCuenta(venta) ? 'text-muted-foreground line-through' : 'text-foreground'}`}
    >
      {formatearPesos(venta.total_centavos)}
    </span>
    {venta.descuento_centavos ? (
      <span className="text-[11px] font-semibold text-rose-600 tabular-nums">
        {textoDelDescuento(
          venta.descuento_centavos,
          venta.descuento_porcentaje,
          venta.descuento_tipo,
        )}
      </span>
    ) : null}
  </span>
);

// Al lado del estado, si se editó después de cobrarla (pedido 102).
const Estado = ({ venta }: { venta: FilaDeVenta }) => (
  <span className="flex flex-wrap gap-1.5">
    <InsigniaDeEstado tono={tonoDeEstado(venta)}>{estadoDeVenta(venta)}</InsigniaDeEstado>
    {venta.editada ? (
      <InsigniaDeEstado tono="ambar" icono={Pencil}>
        Editada
      </InsigniaDeEstado>
    ) : null}
  </span>
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

// El tipo de venta es por dónde entró la venta (Local, Pedidos Ya…): ya no hay otro origen.
// Con el color de Vender, por su lugar en Tipos de venta (skill estetica-sistema, 2026-11-21).
function Tipo({ venta, tipos }: { venta: FilaDeVenta; tipos: string[] }) {
  if (!venta.canal) return <span className="text-sm text-muted-foreground">—</span>;
  return <EtiquetaDeColor color={colorDelTipo(venta.canal, tipos)}>{venta.canal}</EtiquetaDeColor>;
}

const Cobro = ({ venta }: { venta: FilaDeVenta }) => <Persona nombre={venta.cargada_por} />;

const columnas = (tipos: string[]): Columna<FilaDeVenta>[] => [
  { titulo: 'Fecha', celda: (v) => <Fecha venta={v} /> },
  { titulo: 'Tipo de venta', celda: (v) => <Tipo venta={v} tipos={tipos} /> },
  { titulo: 'Cobró', desde: 'lg', celda: (v) => <Cobro venta={v} /> },
  { titulo: 'Medio', desde: 'lg', celda: (v) => <MediosDePago medios={v.medios} /> },
  { titulo: 'Estado', celda: (v) => <Estado venta={v} /> },
  { titulo: 'Total', alinear: 'der', celda: (v) => <Total venta={v} /> },
];

function Tarjeta({ venta, tipos }: { venta: FilaDeVenta; tipos: string[] }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <Fecha venta={venta} />
        <Total venta={venta} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Tipo venta={venta} tipos={tipos} />
          <p className="text-[11px] text-muted-foreground">Cobró {venta.cargada_por ?? '—'}</p>
          <MediosDePago medios={venta.medios} />
        </div>
        <Estado venta={venta} />
      </div>
    </>
  );
}

/** tipos: los nombres de Tipos de venta activos, en su orden, para darle a cada uno su color. */
type Props = { filas: FilaDeVenta[]; total: number; tipos?: string[] };

/** Las ventas en la tabla de Plan Reminder Pro (y tarjetas en el celular). */
export function ListaDeVentas({ filas, total, tipos = [] }: Props) {
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
      colorDelIcono="text-emerald-600"
      total={total}
      filas={filas}
      clave={(v) => v.id}
      columnas={columnas(tipos)}
      tarjeta={(v) => <Tarjeta venta={v} tipos={tipos} />}
    />
  );
}
