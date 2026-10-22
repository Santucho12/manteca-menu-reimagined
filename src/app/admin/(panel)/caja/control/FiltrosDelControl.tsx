import Link from 'next/link';
import {
  BarraDeFiltros,
  BotonDeFiltrar,
  FiltroDeFecha,
  FiltroDeSeleccion,
} from '@/components/panel/Filtros';
import { ENLACE_EN_TEXTO, FranjaDeAviso } from '@/components/panel/Avisos';
import { opcionesDeEstado, type FiltrosDeControl } from '@/lib/caja/pantalla';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';

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
    <BarraDeFiltros accion="/admin/caja/control">
      <FiltroDeFecha id="desde" name="desde" etiqueta="Desde" valor={filtros.desde} />
      <FiltroDeFecha id="hasta" name="hasta" etiqueta="Hasta" valor={filtros.hasta} />
      <FiltroDeSeleccion
        id="persona"
        name="persona"
        etiqueta="Persona"
        opciones={[{ valor: '', texto: 'Todas' }, ...quienes]}
        valor={filtros.personaId ?? ''}
      />
      <FiltroDeSeleccion
        id="estado"
        name="estado"
        etiqueta="Estado"
        opciones={[{ valor: '', texto: 'Todos' }, ...opcionesDeEstado()]}
        valor={filtros.estado ?? ''}
      />
      <BotonDeFiltrar />
    </BarraDeFiltros>
  );
}

// Un dia sin cierre lleva a cargarlo: se puede cargar el de un dia anterior.
export function DiasSinCierre({ dias }: { dias: string[] }) {
  if (dias.length === 0) return null;
  return (
    <FranjaDeAviso>
      <ul aria-label="Días sin cierre" className="space-y-1">
        {dias.map((dia) => (
          <li key={dia} className="flex flex-wrap items-center gap-3">
            <span className="font-semibold">Sin cierre: {fechaParaMostrar(dia)}</span>
            <Link href={`/admin/caja?fecha=${dia}`} className={ENLACE_EN_TEXTO}>
              Cargarlo
            </Link>
          </li>
        ))}
      </ul>
    </FranjaDeAviso>
  );
}
