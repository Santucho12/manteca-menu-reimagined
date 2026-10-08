'use client';

import { useFormContext } from 'react-hook-form';
import { Campo } from '@/components/formularios/Campo';
import type { DatosDeProducto } from '@/lib/menu/esquemas';
import { ayudaDelPrecio } from '@/lib/menu/pantalla';
import type { OpcionDeCategoria } from '@/lib/menu/usePreciosSegunCategoria';

export function PreciosDelFormulario({ categoria }: { categoria: OpcionDeCategoria | undefined }) {
  const { register, formState } = useFormContext<DatosDeProducto>();
  if (!categoria)
    return (
      <p className="text-muted-foreground text-sm">Elegí una categoría para cargar los precios.</p>
    );
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Precios, en pesos</legend>
      {categoria.presentaciones.map((presentacion, i) => (
        <div key={presentacion.id} className="space-y-1">
          <Campo
            id={`precio-${presentacion.id}`}
            etiqueta={`Precio de ${presentacion.nombre}`}
            inputMode="numeric"
            error={formState.errors.precios?.[i]?.monto?.message}
            {...register(`precios.${i}.monto`)}
          />
          <p className="text-muted-foreground text-xs">
            {ayudaDelPrecio(categoria.compartidos[i] ?? null, categoria.nombre)}
          </p>
        </div>
      ))}
    </fieldset>
  );
}
