import { Pencil, Send, Truck } from 'lucide-react';
import Link from 'next/link';
import { BOTON_DE_FILA, FALTA_EL_DATO, ICONO_EDITAR } from '@/components/panel/estilos';
import { Avatar } from '@/components/panel/Insignias';
import { ListaDelPanel, type Columna } from '@/components/panel/ListaDelPanel';
import { SinResultados } from '@/components/panel/SinResultados';
import { formatearPesos } from '@/lib/plata';
import type { FiltrosDeProveedores } from '@/lib/proveedores/consultas';
import { vacioDeProveedores, type FilaConPagado } from '@/lib/proveedores/pantalla';
import { telefonoParaMostrar, urlDeWhatsApp } from '@/lib/proveedores/telefono';

const ENLACE =
  'text-xs font-semibold text-foreground line-clamp-2 max-w-[160px] break-words whitespace-normal text-left hover:text-primary rounded focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors';

/**
 * El enlace de WhatsApp no lleva el nombre del proveedor: las pruebas buscan el enlace del nombre
 * con getByRole('link', { name }) y encontrarian dos.
 */
function WhatsApp({ telefono }: { telefono: string }) {
  return (
    <a
      href={urlDeWhatsApp(telefono)}
      target="_blank"
      rel="noopener noreferrer"
      title="Enviar WhatsApp"
      aria-label="WhatsApp"
      className={BOTON_DE_FILA}
    >
      <Send size={13} aria-hidden="true" />
      <span className="hidden 2xl:inline">WhatsApp</span>
    </a>
  );
}

const Telefono = ({ fila }: { fila: FilaConPagado }) =>
  fila.telefono ? (
    <span className="text-xs font-mono font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md whitespace-nowrap">
      {telefonoParaMostrar(fila.telefono)}
    </span>
  ) : (
    <span className={FALTA_EL_DATO}>Sin teléfono</span>
  );

const COLUMNAS: Columna<FilaConPagado>[] = [
  {
    titulo: 'Proveedor',
    celda: (f) => (
      <div className="flex items-center gap-3">
        <Avatar nombre={f.nombre} />
        <Link href={`/admin/proveedores/${f.id}`} title="Ver ficha" className={ENLACE}>
          {f.nombre}
        </Link>
      </div>
    ),
  },
  {
    titulo: 'Qué le comprás',
    desde: 'lg',
    celda: (f) =>
      f.que_compra ? (
        <span className="text-xs font-medium text-foreground/80 line-clamp-2 break-words max-w-[200px] inline-block">
          {f.que_compra}
        </span>
      ) : (
        <span className={FALTA_EL_DATO}>Sin cargar</span>
      ),
  },
  { titulo: 'Teléfono', celda: (f) => <Telefono fila={f} /> },
  {
    titulo: 'Pagado este mes',
    alinear: 'der',
    celda: (f) => (
      <span className="text-sm font-bold whitespace-nowrap">
        {formatearPesos(f.pagadoCentavos)}
      </span>
    ),
  },
  {
    titulo: 'Acciones',
    alinear: 'der',
    celda: (f) => (
      <div className="flex items-center justify-end gap-1">
        {f.telefono ? <WhatsApp telefono={f.telefono} /> : null}
        <Link
          href={`/admin/proveedores/${f.id}/editar`}
          title="Editar"
          aria-label="Editar"
          className={ICONO_EDITAR}
        >
          <Pencil size={16} aria-hidden="true" />
        </Link>
      </div>
    ),
  },
];

function Tarjeta({ fila }: { fila: FilaConPagado }) {
  return (
    <>
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar nombre={fila.nombre} grande />
          <div className="min-w-0">
            <Link
              href={`/admin/proveedores/${fila.id}`}
              className="block max-w-full text-sm font-bold truncate"
            >
              {fila.nombre}
            </Link>
            <p className="text-xs text-muted-foreground truncate">
              <span className="sr-only">Qué le comprás: </span>
              {fila.que_compra ?? 'Sin cargar'}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold">
            <span className="sr-only">Pagado este mes: </span>
            {formatearPesos(fila.pagadoCentavos)}
          </p>
          <p
            aria-hidden="true"
            className="mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest"
          >
            Este mes
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="sr-only">Teléfono: </span>
        {fila.telefono ? telefonoParaMostrar(fila.telefono) : 'Sin teléfono'}
      </p>
      <div className="flex items-center gap-2">
        {fila.telefono ? (
          <a
            href={urlDeWhatsApp(fila.telefono)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 px-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl hover:shadow-primary/30 active:translate-y-0 active:scale-95 transition-all duration-200"
          >
            <Send size={15} aria-hidden="true" /> WhatsApp
          </a>
        ) : null}
        <Link
          href={`/admin/proveedores/${fila.id}/editar`}
          title="Editar"
          aria-label="Editar"
          className="ml-auto h-11 w-11 shrink-0 rounded-xl bg-secondary text-slate-500 flex items-center justify-center"
        >
          <Pencil size={16} aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}

type Props = { filas: FilaConPagado[]; total: number; filtros: FiltrosDeProveedores };

/** La tabla de Plan Reminder Pro (y sus tarjetas en el celular), con lo pagado en el mes. */
export function ListaDeProveedores({ filas, total, filtros }: Props) {
  if (filas.length === 0) return <SinResultados {...vacioDeProveedores(filtros)} />;
  return (
    <ListaDelPanel
      etiqueta="Proveedores"
      icono={Truck}
      total={total}
      filas={filas}
      clave={(f) => f.id}
      columnas={COLUMNAS}
      tarjeta={(f) => <Tarjeta fila={f} />}
    />
  );
}
