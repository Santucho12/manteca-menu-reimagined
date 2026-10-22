'use client';

import type { FieldErrors } from 'react-hook-form';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import type { Opcion, OpcionDeCategoria } from '@/lib/gastos/consultas';
import type { DatosDeGasto } from '@/lib/gastos/esquemas';
import { opcionesDeMedio, opcionesParaElegir } from '@/lib/gastos/pantalla';
import type { Registro } from '@/lib/formularios/valorInicial';

// Los campos que comparten un gasto y un recurrente: categoria, monto, descripcion,
// proveedor y medio de pago.
type Campos = Pick<
  DatosDeGasto,
  'categoriaId' | 'monto' | 'descripcion' | 'proveedorId' | 'medioDePago'
>;

export type PropsDeCampos = {
  registro: Registro<Campos>;
  errors: FieldErrors<Campos>;
  inicial: Campos;
  categorias: OpcionDeCategoria[];
  proveedores: Opcion[];
  /** El gasto salio de un cierre: su monto se corrige anulando el cierre. */
  deCaja?: boolean;
};

export function CamposDelGasto({
  registro,
  errors,
  inicial,
  categorias,
  proveedores,
  deCaja = false,
}: PropsDeCampos) {
  return (
    <>
      <CampoDeSeleccion
        id="categoria"
        etiqueta="Categoría"
        opciones={opcionesParaElegir(categorias, inicial.categoriaId, 'Elegí una categoría')}
        error={errors.categoriaId?.message}
        {...registro('categoriaId')}
      />
      <Campo
        id="monto"
        etiqueta="Monto"
        inputMode="decimal"
        readOnly={deCaja}
        error={errors.monto?.message}
        {...registro('monto')}
      />
      <Campo
        id="descripcion"
        etiqueta="Descripción"
        error={errors.descripcion?.message}
        {...registro('descripcion')}
      />
      <CampoDeSeleccion
        id="proveedor"
        etiqueta="Proveedor"
        opciones={opcionesParaElegir(proveedores, inicial.proveedorId, 'Sin proveedor')}
        error={errors.proveedorId?.message}
        {...registro('proveedorId')}
      />
      <CampoDeSeleccion
        id="medio-de-pago"
        etiqueta="Medio de pago"
        opciones={[
          { valor: '', texto: 'Elegí cómo se pagó' },
          ...opcionesDeMedio(inicial.medioDePago),
        ]}
        error={errors.medioDePago?.message}
        {...registro('medioDePago')}
      />
    </>
  );
}
