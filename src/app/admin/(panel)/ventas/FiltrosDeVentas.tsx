import {
  BarraDeFiltros,
  BotonDeFiltrar,
  FiltroDeFecha,
  FiltroDeSeleccion,
} from '@/components/panel/Filtros';
import { nombreDeMedio } from '@/lib/caja/pantalla';
import { MEDIOS } from '@/lib/caja/resultado';
import {
  ESTADOS_DE_LISTA,
  ORIGENES,
  nombreDeOrigen,
  type FiltrosDeVentas as Filtros,
} from '@/lib/ventas/pantalla';

const NOMBRES_DE_ESTADO = { cerrada: 'Cerradas', cancelada: 'Canceladas', anulada: 'Anuladas' };
const todos = (texto: string) => ({ valor: '', texto });

export function FiltrosDeVentas({ filtros }: { filtros: Filtros }) {
  return (
    <BarraDeFiltros accion="/admin/ventas">
      <FiltroDeFecha id="desde" name="desde" etiqueta="Desde" valor={filtros.desde} />
      <FiltroDeFecha id="hasta" name="hasta" etiqueta="Hasta" valor={filtros.hasta} />
      <FiltroDeSeleccion
        id="origen"
        name="origen"
        etiqueta="Origen"
        opciones={[
          todos('Todos'),
          ...ORIGENES.map((o) => ({ valor: o, texto: nombreDeOrigen(o) })),
        ]}
        valor={filtros.origen ?? ''}
      />
      <FiltroDeSeleccion
        id="medio"
        name="medio"
        etiqueta="Medio de pago"
        opciones={[todos('Todos'), ...MEDIOS.map((m) => ({ valor: m, texto: nombreDeMedio(m) }))]}
        valor={filtros.medio ?? ''}
      />
      <FiltroDeSeleccion
        id="estado"
        name="estado"
        etiqueta="Estado"
        opciones={[
          todos('Todos'),
          ...ESTADOS_DE_LISTA.map((e) => ({ valor: e, texto: NOMBRES_DE_ESTADO[e] })),
        ]}
        valor={filtros.estado ?? ''}
      />
      <BotonDeFiltrar />
    </BarraDeFiltros>
  );
}
