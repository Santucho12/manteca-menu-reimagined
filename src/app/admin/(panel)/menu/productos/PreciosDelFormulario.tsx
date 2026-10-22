'use client';

import { useFormContext } from 'react-hook-form';
import { Campo } from '@/components/formularios/Campo';
import { ETIQUETA } from '@/components/panel/estilos';
import type { DatosDeProducto } from '@/lib/menu/esquemas';
import { ayudaDelPrecio } from '@/lib/menu/pantalla';
import type { OpcionDeCategoria } from '@/lib/menu/usePreciosSegunCategoria';

export function PreciosDelFormulario({ categoria }: { categoria: OpcionDeCategoria | undefined }) {
  const { register, formState } = useFormContext<DatosDeProducto>();
  if (!categoria) {
    return (
      <p className="text-xs text-muted-foreground">Elegí una categoría para cargar los precios.</p>
    );
  }
  return (
    <fieldset className="space-y-4">
      <legend className={`${ETIQUETA} mb-3`}>Precios, en pesos</legend>
      {categoria.presentaciones.map((presentacion, i) => (
        <div key={presentacion.id} className="space-y-1">
          <Campo
            id={`precio-${presentacion.id}`}
            etiqueta={`Precio de ${presentacion.nombre}`}
            inputMode="numeric"
            error={formState.errors.precios?.[i]?.monto?.message}
            {...register(`precios.${i}.monto`)}
          />
          <p className="text-xs text-muted-foreground">
            {ayudaDelPrecio(categoria.compartidos[i] ?? null, categoria.nombre)}
          </p>
        </div>
      ))}
    </fieldset>
  );
}
