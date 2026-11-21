import type { CategoriaParaVender, ProductoParaVender } from './catalogo';

/** Cuántas facturas faltan elegir para completar lo cobrado. */
export const faltanParaArmar = (total: number, elegidas: Record<string, number>) =>
  total - Object.values(elegidas).reduce((suma, n) => suma + n, 0);

export const armadoCompleto = (total: number, elegidas: Record<string, number>) =>
  faltanParaArmar(total, elegidas) === 0;

/**
 * Surtidas: las formas con unidades y precio para todos de la categoría (Docena, Media, Unidad),
 * para cobrar la cantidad sin elegir cuáles; se arman después de cobrar (pedido 102).
 */
export function surtidasDe(categoria: CategoriaParaVender): ProductoParaVender | null {
  const id = `surtidas:${categoria.id}`;
  const formas = new Map<string, ProductoParaVender['formas'][number]>();
  for (const f of categoria.productos.flatMap((p) => p.formas)) {
    if (!f.compartido || !f.unidades || f.gramosDeLaForma || formas.has(f.presentacionId)) continue;
    formas.set(f.presentacionId, {
      ...f,
      productoId: id,
      nombre: `${categoria.nombre} surtidas`,
      surtida: true,
    });
  }
  return formas.size ? { id, nombre: 'Surtidas', formas: [...formas.values()] } : null;
}

/** Lo que se manda al armar: cada factura elegida con sus unidades. */
export const detalleDelArmado = (elegidas: Record<string, number>) =>
  Object.entries(elegidas)
    .filter(([, unidades]) => unidades > 0)
    .map(([productoId, unidades]) => ({ producto_id: productoId, unidades }));

/** Las facturas de la categoría para elegir al armar, sin la tarjeta de Surtidas. */
export const productosParaArmar = (catalogo: CategoriaParaVender[], categoriaId: string) =>
  (catalogo.find((c) => c.id === categoriaId)?.productos ?? [])
    .filter((p) => !p.id.startsWith('surtidas:'))
    .map((p) => ({ id: p.id, nombre: p.nombre }));
