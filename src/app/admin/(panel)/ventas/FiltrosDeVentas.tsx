import { BarraAutomatica } from '@/components/panel/BarraAutomatica';
import { FiltroDeFecha, FiltroDeSeleccion } from '@/components/panel/Filtros';
import { nombreDeMedio } from '@/lib/caja/pantalla';
import { MEDIOS } from '@/lib/caja/resultado';
import { ESTADOS_DE_LISTA, type FiltrosDeVentas as Filtros } from '@/lib/ventas/pantalla';

const NOMBRES_DE_ESTADO = { cerrada: 'Cerradas', anulada: 'Anuladas' };
const todos = (texto: string) => ({ valor: '', texto });

type Props = { filtros: Filtros; tipos: { id: string; nombre: string }[] };

/** Los filtros de la lista: cada cambio actualiza las ventas solo, sin botón. */
export function FiltrosDeVentas({ filtros, tipos }: Props) {
  return (
    <BarraAutomatica accion="/admin/ventas">
      <FiltroDeFecha id="desde" name="desde" etiqueta="Desde" valor={filtros.desde} />
      <FiltroDeFecha id="hasta" name="hasta" etiqueta="Hasta" valor={filtros.hasta} />
      <FiltroDeSeleccion
        id="medio"
        name="medio"
        etiqueta="Medio de pago"
        opciones={[
          todos('Medio de pago'),
          ...MEDIOS.map((m) => ({ valor: m, texto: nombreDeMedio(m) })),
        ]}
        valor={filtros.medio ?? ''}
      />
      <FiltroDeSeleccion
        id="tipo"
        name="tipo"
        etiqueta="Tipo de venta"
        opciones={[todos('Tipo de venta'), ...tipos.map((t) => ({ valor: t.id, texto: t.nombre }))]}
        valor={filtros.tipo ?? ''}
      />
      <FiltroDeSeleccion
        id="estado"
        name="estado"
        etiqueta="Estado"
        opciones={[
          todos('Estado'),
          ...ESTADOS_DE_LISTA.map((e) => ({ valor: e, texto: NOMBRES_DE_ESTADO[e] })),
        ]}
        valor={filtros.estado ?? ''}
      />
    </BarraAutomatica>
  );
}
