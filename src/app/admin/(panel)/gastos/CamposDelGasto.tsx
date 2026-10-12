'use client';

import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import type { Opcion, OpcionDeCategoria } from '@/lib/gastos/consultas';
import type { DatosDeGasto } from '@/lib/gastos/esquemas';
import { opcionesDeMedio, opcionesParaElegir } from '@/lib/gastos/pantalla';

// Los campos que comparten un gasto y un recurrente: categoria, monto, descripcion,
// proveedor y medio de pago.
type Campos = Pick<
  DatosDeGasto,
  'categoriaId' | 'monto' | 'descripcion' | 'proveedorId' | 'medioDePago'
>;

export type PropsDeCampos = {
  register: UseFormRegister<Campos>;
  errors: FieldErrors<Campos>;
  inicial: Campos;
  categorias: OpcionDeCategoria[];
  proveedores: Opcion[];
  /** El gasto salio de un cierre: su monto se corrige anulando el cierre. */
  deCaja?: boolean;
};

export function CamposDelGasto({
  register,
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
        {...register('categoriaId')}
      />
      <Campo
        id="monto"
        etiqueta="Monto"
        inputMode="decimal"
        readOnly={deCaja}
        error={errors.monto?.message}
        {...register('monto')}
      />
      <Campo
        id="descripcion"
        etiqueta="Descripción"
        error={errors.descripcion?.message}
        {...register('descripcion')}
      />
      <CampoDeSeleccion
        id="proveedor"
        etiqueta="Proveedor"
        opciones={opcionesParaElegir(proveedores, inicial.proveedorId, 'Sin proveedor')}
        error={errors.proveedorId?.message}
        {...register('proveedorId')}
      />
      <CampoDeSeleccion
        id="medio-de-pago"
        etiqueta="Medio de pago"
        opciones={[
          { valor: '', texto: 'Elegí cómo se pagó' },
          ...opcionesDeMedio(inicial.medioDePago),
        ]}
        error={errors.medioDePago?.message}
        {...register('medioDePago')}
      />
    </>
  );
}
