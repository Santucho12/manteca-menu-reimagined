import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { DatosDeProducto } from './esquemas';
import type { PresentacionDelMenu } from './precios';

export type OpcionDeCategoria = {
  id: string;
  nombre: string;
  presentaciones: PresentacionDelMenu[];
  compartidos: (number | null)[];
};

/**
 * Los precios del formulario siguen a la categoria elegida: si cambia, se piden los de sus
 * presentaciones, vacios. Al editar, la categoria de arranque conserva los cargados.
 */
export function usePreciosSegunCategoria(opciones: OpcionDeCategoria[]) {
  const { control, getValues, setValue } = useFormContext<DatosDeProducto>();
  const categoriaId = useWatch({ control, name: 'categoriaId' });
  const categoria = opciones.find((o) => o.id === categoriaId);
  useEffect(() => {
    const ids = (categoria?.presentaciones ?? []).map((p) => p.id);
    const actuales = getValues('precios').map((p) => p.presentacionId);
    if (ids.join() === actuales.join()) return;
    setValue(
      'precios',
      ids.map((presentacionId) => ({ presentacionId, monto: '', original: '' })),
    );
  }, [categoria, getValues, setValue]);
  return categoria;
}
