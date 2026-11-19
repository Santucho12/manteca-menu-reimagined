import {
  BarraDeFiltros,
  BotonDeFiltrar,
  FiltroDeFecha,
  FiltroDeSeleccion,
  FiltroEnlace,
} from '@/components/panel/Filtros';
import {
  enlaceDeCompras,
  type EstadoDeLista,
  type FiltrosDeCompras as Filtros,
} from '@/lib/compras/pantalla';

const ESTADOS: [EstadoDeLista, string][] = [
  ['todas', 'Todas'],
  ['pedida', 'Pedidas'],
  ['recibida', 'Recibidas'],
  ['anulada', 'Anuladas'],
];

type Props = { filtros: Filtros; proveedores: { id: string; nombre: string }[] };

/** El periodo y el proveedor se eligen en la barra; el estado, con los botones de abajo. */
export function FiltrosDeCompras({ filtros, proveedores }: Props) {
  const opciones = [
    { valor: '', texto: 'Todos los proveedores' },
    ...proveedores.map((p) => ({ valor: p.id, texto: p.nombre })),
  ];
  const ocultos: Record<string, string> =
    filtros.estado === 'todas' ? {} : { estado: filtros.estado };
  return (
    <>
      <BarraDeFiltros accion="/admin/compras" ocultos={ocultos}>
        <FiltroDeSeleccion
          id="filtro-proveedor"
          name="proveedor"
          etiqueta="Proveedor"
          opciones={opciones}
          valor={filtros.proveedor ?? ''}
        />
        <FiltroDeFecha id="filtro-desde" name="desde" etiqueta="Desde" valor={filtros.desde} />
        <FiltroDeFecha id="filtro-hasta" name="hasta" etiqueta="Hasta" valor={filtros.hasta} />
        <BotonDeFiltrar />
      </BarraDeFiltros>
      <div className="flex flex-wrap gap-2 md:gap-3">
        {ESTADOS.map(([estado, texto]) => (
          <FiltroEnlace
            key={estado}
            href={enlaceDeCompras({ ...filtros, estado })}
            prendido={filtros.estado === estado}
          >
            {texto}
          </FiltroEnlace>
        ))}
      </div>
    </>
  );
}
