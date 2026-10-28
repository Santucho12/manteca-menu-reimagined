import { AlertTriangle, ArrowRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { BarraAutomatica } from '@/components/panel/BarraAutomatica';
import { FiltroDeFecha, FiltroDeSeleccion, FiltroEnlace } from '@/components/panel/Filtros';
import { diaDeLaSemana } from '@/lib/caja/diaDeLaSemana';
import { enlaceDeControl, opcionesDeEstado, type FiltrosDeControl } from '@/lib/caja/pantalla';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';

const FILA_DEL_DIA =
  'group/fila flex items-center gap-4 px-4 py-3 hover:bg-amber-50 transition-colors';

type Persona = { id: string; nombre: string };

export function FiltrosDelControl({
  filtros,
  personas,
  hoy,
}: {
  filtros: FiltrosDeControl;
  personas: Persona[];
  hoy: string;
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
      <FiltroEnlace
        href={enlaceDeControl({ ...filtros, anulados: !filtros.anulados, pagina: 1 }, hoy)}
        prendido={filtros.anulados}
      >
        Ver anulados
      </FiltroEnlace>
    </BarraAutomatica>
  );
}

function DiaSinCierre({ dia }: { dia: string }) {
  return (
    <li>
      <Link href={`/admin/caja?fecha=${dia}`} className={FILA_DEL_DIA}>
        <span className="w-12 rounded-lg bg-amber-100 py-1 text-center text-[10px] font-black uppercase tracking-widest text-amber-800">
          {diaDeLaSemana(dia)}
        </span>
        <span className="font-display text-base font-bold tracking-tight text-foreground">
          {fechaParaMostrar(dia)}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-primary opacity-70 group-hover/fila:opacity-100">
          Cargar cierre
          <ArrowRight
            size={14}
            aria-hidden="true"
            className="transition-transform group-hover/fila:translate-x-0.5"
          />
        </span>
      </Link>
    </li>
  );
}

// Una sola franja con la cantidad; el desplegable lista los dias, cada uno lleva a cargar ese dia.
export function DiasSinCierre({ dias, abierto = false }: { dias: string[]; abierto?: boolean }) {
  if (dias.length === 0) return null;
  const texto = `${dias.length} ${dias.length === 1 ? 'día pendiente' : 'días pendientes'}`;
  return (
    <details
      open={abierto}
      className="group rounded-2xl border border-amber-300 bg-amber-50 text-amber-900"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <AlertTriangle size={18} className="shrink-0" aria-hidden="true" />
        <span className="text-sm font-semibold">{texto}</span>
        <span className="hidden text-xs text-amber-800/70 sm:inline">
          Tocá un día para cargar su cierre
        </span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="ml-auto shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>
      <ul
        aria-label="Días sin cierre"
        className="mx-4 mb-4 divide-y divide-amber-100 overflow-hidden rounded-xl border border-amber-200 bg-white/80"
      >
        {dias.map((dia) => (
          <DiaSinCierre key={dia} dia={dia} />
        ))}
      </ul>
    </details>
  );
}
