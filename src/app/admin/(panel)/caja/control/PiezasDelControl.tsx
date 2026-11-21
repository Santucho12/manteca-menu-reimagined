import { AlertTriangle, ArrowRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { BarraAutomatica } from '@/components/panel/BarraAutomatica';
import { FiltroDeFecha, FiltroDeSeleccion } from '@/components/panel/Filtros';
import { diaDeLaSemana } from '@/lib/caja/diaDeLaSemana';
import { opcionesDeEstado, type FiltrosDeControl } from '@/lib/caja/pantalla';
import { nombreDelTurno, type Turno } from '@/lib/caja/turnos';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { BotonDeDiaSinAbrir } from '../BotonDeDiaSinAbrir';

type Persona = { id: string; nombre: string };

/** Desde, hasta, quién y en qué estado: cada cambio vuelve a pedir la lista. */
export function FiltrosDelControl({
  filtros,
  personas,
}: {
  filtros: FiltrosDeControl;
  personas: Persona[];
}) {
  return (
    <BarraAutomatica accion="/admin/caja/control">
      <FiltroDeFecha id="desde" name="desde" etiqueta="Desde" valor={filtros.desde} />
      <FiltroDeFecha id="hasta" name="hasta" etiqueta="Hasta" valor={filtros.hasta} />
      <FiltroDeSeleccion
        id="persona"
        name="persona"
        etiqueta="Persona"
        opciones={[
          { valor: '', texto: 'Todos los empleados' },
          ...personas.map((p) => ({ valor: p.id, texto: p.nombre })),
        ]}
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

type Pendiente = { fecha: string; turno: Turno };

function TurnoPendiente({ fecha, turno }: Pendiente) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="w-9 text-[10px] font-black uppercase tracking-widest text-rose-400">
        {diaDeLaSemana(fecha)}
      </span>
      <span className="font-display text-sm font-bold">{fechaParaMostrar(fecha)}</span>
      <span className="text-xs font-semibold text-muted-foreground">{nombreDelTurno(turno)}</span>
      <span className="ml-auto flex items-center gap-2">
        <BotonDeDiaSinAbrir fecha={fecha} marcar />
        <Link
          href={`/admin/caja?fecha=${fecha}&turno=${turno}`}
          className="inline-flex h-8 items-center gap-1 rounded-full bg-rose-600 px-3 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95"
        >
          Cargar cierre <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </span>
    </li>
  );
}

/** Los turnos que vendieron y no tienen cierre: una alerta roja que se despliega. */
export function TurnosPendientes({ turnos, abierto }: { turnos: Pendiente[]; abierto: boolean }) {
  if (turnos.length === 0) return null;
  const texto = `${turnos.length} ${turnos.length === 1 ? 'turno pendiente' : 'turnos pendientes'}`;
  return (
    <details
      open={abierto}
      className="group rounded-2xl border border-rose-200 bg-rose-50 shadow-card"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 text-rose-800 [&::-webkit-details-marker]:hidden">
        <span className="grid size-9 place-items-center rounded-xl bg-rose-600 text-white">
          <AlertTriangle size={16} aria-hidden="true" />
        </span>
        <span className="font-display text-base font-extrabold">{texto}</span>
        <span className="hidden text-xs text-rose-700/80 sm:inline">
          Vendieron y no tienen cierre
        </span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="ml-auto transition-transform group-open:rotate-180"
        />
      </summary>
      <ul
        aria-label="Turnos sin cierre"
        className="mx-4 mb-4 divide-y divide-rose-100 rounded-xl border border-rose-100 bg-white"
      >
        {turnos.map((t) => (
          <TurnoPendiente key={`${t.fecha}-${t.turno}`} {...t} />
        ))}
      </ul>
    </details>
  );
}
