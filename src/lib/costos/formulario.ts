import { contenidoParaEditar } from '../materia-prima/esquemas';
import type { InsumoParaReceta, Receta, RecetaDelProducto } from './consultas';
import type { DatosDeReceta } from './esquemas';

function comoSeEscribe(receta: Receta | null, conRinde: boolean) {
  return {
    rinde: receta && conRinde ? contenidoParaEditar(receta.rinde) : '1',
    desperdicio: receta && conRinde ? contenidoParaEditar(receta.desperdicio) : '0',
    renglones: (receta?.renglones ?? []).map((r) => ({
      insumoId: r.insumoId,
      cantidad: contenidoParaEditar(r.cantidad),
    })),
  };
}

/**
 * El formulario de la receta que se edita: la del producto o la propia de una presentacion.
 * Una presentacion sin receta propia arranca con los insumos de la del producto.
 */
export function datosDeLaReceta(receta: RecetaDelProducto, presentacion: string): DatosDeReceta {
  const elegida = receta.presentaciones.find((p) => p.id === presentacion);
  const productoId = receta.producto.productoId;
  if (!elegida) return { productoId, presentacionId: '', ...comoSeEscribe(receta.base, true) };
  const desde = elegida.propia ?? receta.base;
  return {
    productoId,
    presentacionId: elegida.id,
    ...comoSeEscribe(desde, Boolean(elegida.propia)),
  };
}

/**
 * Los insumos para elegir en la receta: los activos y, marcados, los desactivados que ya
 * estaban en ella, que la receta sigue usando (regla 2 de Materia prima).
 */
export function insumosDeLaReceta(insumos: InsumoParaReceta[], receta: RecetaDelProducto) {
  const recetas = [receta.base, ...receta.presentaciones.map((p) => p.propia)];
  const apagados = recetas
    .flatMap((r) => r?.renglones ?? [])
    .filter((r) => !r.activoElInsumo && !insumos.some((i) => i.id === r.insumoId));
  const unicos = [...new Map(apagados.map((r) => [r.insumoId, r])).values()];
  return {
    insumos: [
      ...insumos,
      ...unicos.map((r) => ({
        id: r.insumoId,
        nombre: `${r.nombre} (desactivado)`,
        unidad: r.unidad,
      })),
    ],
    desactivados: unicos.map((r) => r.insumoId),
  };
}
