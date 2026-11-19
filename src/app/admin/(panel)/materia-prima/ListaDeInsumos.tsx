import { Pencil, Wheat } from 'lucide-react';
import Link from 'next/link';
import { FALTA_EL_DATO, ICONO_EDITAR } from '@/components/panel/estilos';
import { Avatar } from '@/components/panel/Insignias';
import { ListaDelPanel, type Columna } from '@/components/panel/ListaDelPanel';
import { SinResultados } from '@/components/panel/SinResultados';
import type { FilaDeInsumo, FiltrosDeInsumos } from '@/lib/materia-prima/consultas';
import { costoParaMostrar, textoDelOrigen } from '@/lib/materia-prima/costo';
import { textoDeUnidad, vacioDeInsumos } from '@/lib/materia-prima/pantalla';

const ENLACE =
  'text-xs font-semibold text-foreground line-clamp-2 max-w-[200px] break-words whitespace-normal text-left hover:text-primary rounded focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors';

function Costo({ fila }: { fila: FilaDeInsumo }) {
  const costo = costoParaMostrar(fila.costo_por_unidad, fila.unidad_de_uso);
  return costo ? (
    <span className="text-sm font-bold whitespace-nowrap">{costo}</span>
  ) : (
    <span className={FALTA_EL_DATO}>Sin precio</span>
  );
}

const Origen = ({ fila }: { fila: FilaDeInsumo }) => (
  <span className="text-xs text-muted-foreground">
    {textoDelOrigen(fila.origen, fila.fecha_origen)}
  </span>
);

const Editar = ({ fila }: { fila: FilaDeInsumo }) => (
  <Link
    href={`/admin/materia-prima/${fila.id}/editar`}
    title="Editar"
    aria-label="Editar"
    className={ICONO_EDITAR}
  >
    <Pencil size={16} aria-hidden="true" />
  </Link>
);

const COLUMNAS: Columna<FilaDeInsumo>[] = [
  {
    titulo: 'Insumo',
    celda: (f) => (
      <div className="flex items-center gap-3">
        <Avatar nombre={f.nombre} />
        <Link href={`/admin/materia-prima/${f.id}`} title="Ver ficha" className={ENLACE}>
          {f.nombre}
        </Link>
      </div>
    ),
  },
  {
    titulo: 'En qué se mide',
    desde: 'lg',
    celda: (f) => <span className="text-xs font-medium">{textoDeUnidad(f.unidad_de_uso)}</span>,
  },
  { titulo: 'Costo hoy', alinear: 'der', celda: (f) => <Costo fila={f} /> },
  { titulo: 'De dónde sale', celda: (f) => <Origen fila={f} /> },
  {
    titulo: 'Acciones',
    alinear: 'der',
    celda: (f) => (
      <div className="flex items-center justify-end gap-1">
        <Editar fila={f} />
      </div>
    ),
  },
];

function Tarjeta({ fila }: { fila: FilaDeInsumo }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar nombre={fila.nombre} grande />
        <div className="min-w-0">
          <Link
            href={`/admin/materia-prima/${fila.id}`}
            className="block max-w-full text-sm font-bold wrap-break-word"
          >
            {fila.nombre}
          </Link>
          <p className="text-xs text-muted-foreground">
            <span className="sr-only">De dónde sale: </span>
            <Origen fila={fila} />
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className="sr-only">Costo hoy: </span>
        <Costo fila={fila} />
      </div>
    </div>
  );
}

type Props = { filas: FilaDeInsumo[]; total: number; filtros: FiltrosDeInsumos };

/** La tabla de los insumos, con su costo de hoy (y sus tarjetas en el celular). */
export function ListaDeInsumos({ filas, total, filtros }: Props) {
  if (filas.length === 0) return <SinResultados {...vacioDeInsumos(filtros)} />;
  return (
    <ListaDelPanel
      etiqueta="Insumos"
      icono={Wheat}
      total={total}
      filas={filas}
      clave={(f) => f.id}
      columnas={COLUMNAS}
      tarjeta={(f) => <Tarjeta fila={f} />}
    />
  );
}
