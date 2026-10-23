import { Receipt } from 'lucide-react';
import Link from 'next/link';
import { Chip } from '@/components/panel/Insignias';
import { ListaDelPanel, type Columna } from '@/components/panel/ListaDelPanel';
import { SinResultados } from '@/components/panel/SinResultados';
import type { FilaDeGasto } from '@/lib/gastos/consultas';
import { fechaParaMostrar, nombreDeMedio } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';

const ENLACE =
  'text-xs font-semibold text-foreground hover:text-primary rounded focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors';

const nombreDelGasto = (g: FilaDeGasto) =>
  `${g.categoria}${g.descripcion ? ` — ${g.descripcion}` : ''}`;

function Marcas({ gasto }: { gasto: FilaDeGasto }) {
  return (
    <span className="flex flex-wrap gap-1">
      {gasto.recurrente_id ? <Chip>Automático</Chip> : null}
      {gasto.cierre_id ? <Chip>De caja</Chip> : null}
      {gasto.anulado ? <Chip>Anulado</Chip> : null}
    </span>
  );
}

const Monto = ({ gasto }: { gasto: FilaDeGasto }) => (
  <span
    className={`text-sm font-bold whitespace-nowrap ${gasto.anulado ? 'text-muted-foreground line-through' : 'text-foreground'}`}
  >
    {formatearPesos(gasto.monto_centavos)}
  </span>
);

const COLUMNAS: Columna<FilaDeGasto>[] = [
  {
    titulo: 'Fecha',
    celda: (g) => (
      <span className="text-xs font-medium whitespace-nowrap">{fechaParaMostrar(g.fecha)}</span>
    ),
  },
  {
    titulo: 'Gasto',
    celda: (g) => (
      <div className="space-y-1 max-w-[260px]">
        <Link href={`/admin/gastos/${g.id}`} className={`${ENLACE} line-clamp-2 break-words`}>
          {nombreDelGasto(g)}
        </Link>
        <Marcas gasto={g} />
      </div>
    ),
  },
  {
    titulo: 'Proveedor',
    desde: 'lg',
    celda: (g) => <span className="text-xs text-foreground/80">{g.proveedor ?? '—'}</span>,
  },
  {
    titulo: 'Medio',
    desde: 'lg',
    celda: (g) => (
      <span className="text-xs text-foreground/80">{nombreDeMedio(g.medio_de_pago)}</span>
    ),
  },
  { titulo: 'Monto', alinear: 'der', celda: (g) => <Monto gasto={g} /> },
];

function Tarjeta({ gasto }: { gasto: FilaDeGasto }) {
  const detalle = [gasto.proveedor, nombreDeMedio(gasto.medio_de_pago)].filter(Boolean).join(' · ');
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <Link href={`/admin/gastos/${gasto.id}`} className="min-w-0 text-sm font-bold break-words">
          {nombreDelGasto(gasto)}
        </Link>
        <Monto gasto={gasto} />
      </div>
      <p className="text-xs text-muted-foreground">
        {fechaParaMostrar(gasto.fecha)} · {detalle}
      </p>
      <Marcas gasto={gasto} />
    </>
  );
}

type Props = { filas: FilaDeGasto[]; total?: number };

/** Los gastos en la tabla de Plan Reminder Pro (y tarjetas en el celular). */
export function ListaDeGastos({ filas, total }: Props) {
  if (filas.length === 0) {
    return (
      <SinResultados
        titulo="No hay gastos para mostrar"
        texto="No hay registros que coincidan con tus filtros."
      />
    );
  }
  return (
    <ListaDelPanel
      etiqueta="Gastos"
      icono={Receipt}
      total={total ?? filas.length}
      filas={filas}
      clave={(g) => g.id}
      columnas={COLUMNAS}
      tarjeta={(g) => <Tarjeta gasto={g} />}
    />
  );
}
