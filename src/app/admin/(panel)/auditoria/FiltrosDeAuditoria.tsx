import {
  BarraDeFiltros,
  BotonDeFiltrar,
  FiltroDeFecha,
  FiltroDeSeleccion,
} from '@/components/panel/Filtros';
import {
  opcionesDeAccion,
  opcionesDeModulo,
  type FiltrosDeAuditoria as Filtros,
} from '@/lib/auditoria/pantalla';

type Persona = { id: string; nombre: string };

export function FiltrosDeAuditoria({
  filtros,
  personas,
}: {
  filtros: Filtros;
  personas: Persona[];
}) {
  const quienes = personas.map((persona) => ({ valor: persona.id, texto: persona.nombre }));
  return (
    <BarraDeFiltros accion="/admin/auditoria">
      <FiltroDeFecha id="desde" name="desde" etiqueta="Desde" valor={filtros.desde} />
      <FiltroDeFecha id="hasta" name="hasta" etiqueta="Hasta" valor={filtros.hasta} />
      <FiltroDeSeleccion
        id="persona"
        name="persona"
        etiqueta="Persona"
        opciones={[
          { valor: '', texto: 'Todas' },
          { valor: 'sistema', texto: 'El sistema' },
          ...quienes,
        ]}
        valor={filtros.persona ?? ''}
      />
      <FiltroDeSeleccion
        id="modulo"
        name="modulo"
        etiqueta="Módulo"
        opciones={[{ valor: '', texto: 'Todos' }, ...opcionesDeModulo()]}
        valor={filtros.modulo ?? ''}
      />
      <FiltroDeSeleccion
        id="accion"
        name="accion"
        etiqueta="Acción"
        opciones={[{ valor: '', texto: 'Todas' }, ...opcionesDeAccion()]}
        valor={filtros.accion ?? ''}
      />
      <BotonDeFiltrar />
    </BarraDeFiltros>
  );
}
