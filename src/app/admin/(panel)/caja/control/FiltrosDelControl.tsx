import { AlertTriangle, ArrowRight, ChevronDown } from 'lucide-react';
import { nombreDelTurno, type Turno } from '@/lib/caja/turnos';
import Link from 'next/link';
import { BarraAutomatica } from '@/components/panel/BarraAutomatica';
import { FiltroDeFecha, FiltroDeSeleccion } from '@/components/panel/Filtros';
import { diaDeLaSemana } from '@/lib/caja/diaDeLaSemana';
import { opcionesDeEstado, type FiltrosDeControl } from '@/lib/caja/pantalla';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { BotonDeSinAbrir } from './BotonDeSinAbrir';

const FILA_DEL_DIA =
  'group/fila flex flex-1 items-center gap-4 px-4 py-3 hover:bg-amber-50 transition-colors';

type Persona = { id: string; nombre: string };

export function FiltrosDelControl({
  filtros,
  personas,
}: {
  filtros: FiltrosDeControl;
  personas: Persona[];
}) {
  const quienes = personas.map((persona) => ({ valor: persona.id, texto: persona.nombre }));
  return (
    <BarraAutomatica accion="/admin/caja/control">
      <FiltroDeFecha id="desde" name="desde" etiqueta="Desde" valor={filtros.desde} />
      <FiltroDeFecha id="hasta" name="hasta" etiqueta="Hasta" valor={filtros.hasta} />
      <FiltroDeSeleccion
        id="persona"
        name="persona"
        etiqueta="Persona"
        opciones={[{ valor: '', texto: 'Todos los empleados' }, ...quienes]}
        valor={filtros.personaId ?? ''}
      />
      <FiltroDeSeleccion
        id="estado"
        name="estado"
        etiqueta="Estado"
        opciones={[{ valor: '', texto: 'Todos los estados' }, ...opcionesDeEstado()]}
        valor={filtros.estado ?? ''}
      />
    </BarraAutomatica>
  );
}

type TurnoPendiente = { dia: string; turno: Turno };

function DiaSinCierre({ dia, turno }: TurnoPendiente) {
  return (
    <li className="flex items-center">
      <Link href={`/admin/caja?fecha=${dia}&turno=${turno}`} className={FILA_DEL_DIA}>
        <span className="w-12 rounded-lg bg-amber-100 py-1 text-center text-[10px] font-black uppercase tracking-widest text-amber-800">
          {diaDeLaSemana(dia)}
        </span>
        <span className="font-display text-base font-bold tracking-tight text-foreground">
          {fechaParaMostrar(dia)}
        </span>
        <span className="text-sm font-semibold text-muted-foreground">{nombreDelTurno(turno)}</span>
        <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-primary opacity-70 group-hover/fila:opacity-100">
          Cargar cierre
          <ArrowRight
            size={14}
            aria-hidden="true"
            className="transition-transform group-hover/fila:translate-x-0.5"
          />
        </span>
      </Link>
      <BotonDeSinAbrir fecha={dia} marcar />
    </li>
  );
}

// Una sola franja con la cantidad; el desplegable lista los dias, cada uno lleva a cargar ese dia.
type PropsDePendientes = { turnos: { fecha: string; turno: Turno }[]; abierto?: boolean };

export function DiasSinCierre({ turnos, abierto = false }: PropsDePendientes) {
  if (turnos.length === 0) return null;
  const texto = `${turnos.length} ${turnos.length === 1 ? 'turno pendiente' : 'turnos pendientes'}`;
  return (
    <details
      open={abierto}
      className="group rounded-2xl border border-amber-300 bg-amber-50 text-amber-900"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <AlertTriangle size={18} className="shrink-0" aria-hidden="true" />
        <span className="text-sm font-semibold">{texto}</span>
        <span className="hidden text-xs text-amber-800/70 sm:inline">
          Tocá un turno para cargar su cierre
        </span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="ml-auto shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>
      <ul
        aria-label="Turnos sin cierre"
        className="mx-4 mb-4 divide-y divide-amber-100 overflow-hidden rounded-xl border border-amber-200 bg-white/80"
      >
        {turnos.map(({ fecha, turno }) => (
          <DiaSinCierre key={`${fecha}-${turno}`} dia={fecha} turno={turno} />
        ))}
      </ul>
    </details>
  );
}
