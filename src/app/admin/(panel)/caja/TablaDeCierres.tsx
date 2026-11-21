import { Banknote, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { EtiquetaDeColor } from '@/components/panel/Etiquetas';
import { ListaDelPanel, type Columna } from '@/components/panel/ListaDelPanel';
import { SinResultados } from '@/components/panel/SinResultados';
import type { FilaDeCierre } from '@/lib/caja/consultas';
import { diaDeLaSemana } from '@/lib/caja/diaDeLaSemana';
import { textoDeDiferenciaDeMedio, tonoDeDiferencia } from '@/lib/caja/diferencias';
import { filasConNoAbrio, type DiaQueNoAbrio } from '@/lib/caja/noAbrioEnLaLista';
import { nombreDelTurno } from '@/lib/caja/turnos';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { colorDeTurno } from '@/lib/panel/coloresDelSistema';
import { cn } from '@/lib/utils';
import { BotonDeDiaSinAbrir } from './BotonDeDiaSinAbrir';
import { EstadoDelCierre } from './Piezas';

type Fila = FilaDeCierre | DiaQueNoAbrio;
const noAbrio = (fila: Fila): fila is DiaQueNoAbrio => 'noAbrio' in fila;

// El enlace de la fecha se estira sobre la fila: un toque en cualquier parte abre el cierre.
const ENLACE = 'font-display text-sm font-bold hover:text-violet-700 after:absolute after:inset-0';

function Fecha({ fila }: { fila: Fila }) {
  const fecha = fechaParaMostrar(fila.fecha);
  return (
    <span className="flex items-center gap-3">
      <span className="w-9 text-[10px] font-black uppercase tracking-widest text-slate-400">
        {diaDeLaSemana(fila.fecha)}
      </span>
      {noAbrio(fila) ? (
        <span className="font-display text-sm font-bold text-slate-400">{fecha}</span>
      ) : (
        <Link href={`/admin/caja/cierres/${fila.id}`} className={ENLACE}>
          {fecha}
        </Link>
      )}
      {noAbrio(fila) ? null : (
        <EtiquetaDeColor color={colorDeTurno(fila.turno)}>
          {nombreDelTurno(fila.turno)}
        </EtiquetaDeColor>
      )}
    </span>
  );
}

const COLOR = { gris: 'text-slate-500', rojo: 'text-rose-600' };

function Diferencia({ fila }: { fila: Fila }) {
  if (noAbrio(fila)) return <span className="text-sm text-slate-400">El local no abrió</span>;
  if (fila.diferencias.length === 0) {
    return <span className="text-sm font-bold text-emerald-600">Sin diferencia</span>;
  }
  return (
    <span className="block space-y-0.5">
      {fila.diferencias.map((d) => (
        <span
          key={d.medio}
          className={cn('block text-sm font-bold', COLOR[tonoDeDiferencia(fila.estado)])}
        >
          {textoDeDiferenciaDeMedio(d)}
        </span>
      ))}
    </span>
  );
}

function Estado({ fila, admin }: { fila: Fila; admin: boolean }) {
  if (noAbrio(fila)) {
    return (
      <span className="inline-flex items-center gap-2">
        <EstadoDelCierre estado="no_abrio" />
        {admin ? <BotonDeDiaSinAbrir fecha={fila.fecha} marcar={false} /> : null}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <EstadoDelCierre estado={fila.estado} anulado={fila.anulado} />
      <ChevronRight size={16} aria-hidden="true" className="text-slate-300" />
    </span>
  );
}

const persona = (fila: Fila) => (noAbrio(fila) ? '—' : fila.persona);

const columnas = (admin: boolean): Columna<Fila>[] => [
  { titulo: 'Fecha', celda: (f) => <Fecha fila={f} /> },
  {
    titulo: 'Quién cerró',
    celda: (f) => <span className="text-sm font-semibold">{persona(f)}</span>,
  },
  { titulo: 'Diferencia', celda: (f) => <Diferencia fila={f} /> },
  { titulo: 'Estado', alinear: 'der', celda: (f) => <Estado fila={f} admin={admin} /> },
];

type Props = {
  filas: FilaDeCierre[];
  total?: number;
  noAbrio?: string[];
  primera?: boolean;
  ultima?: boolean;
  /** El admin ve el botón para deshacer un día sin abrir. */
  admin?: boolean;
};

/** Los cierres, con los días que el local no abrió en su fecha; en el celular, tarjetas. */
export function TablaDeCierres({ admin = false, ...props }: Props) {
  const filas = filasConNoAbrio(
    props.filas,
    props.noAbrio ?? [],
    props.primera ?? true,
    props.ultima ?? true,
  );
  if (filas.length === 0)
    return <SinResultados titulo="Sin cierres" texto="No hay cierres para mostrar." />;
  return (
    <ListaDelPanel
      etiqueta="Cierres"
      icono={Banknote}
      total={props.total ?? props.filas.length}
      filas={filas}
      clave={(f) => (noAbrio(f) ? `no-abrio-${f.fecha}` : f.id)}
      columnas={columnas(admin)}
      tarjeta={(f) => (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Fecha fila={f} />
            <Estado fila={f} admin={admin} />
          </div>
          <p className="text-xs text-muted-foreground">{persona(f)}</p>
          <Diferencia fila={f} />
        </div>
      )}
    />
  );
}
