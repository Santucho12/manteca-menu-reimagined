type Categoria = { id: string; pide_proveedor: boolean };
type Inicial = { categoriaId: string; proveedorId: string };

/**
 * El proveedor se pide solo en las categorías que lo piden. Un gasto que ya tenía uno lo sigue
 * mostrando mientras no le cambien la categoría, para no perderlo al editar.
 */
export function muestraProveedor(
  categorias: Categoria[],
  categoriaId: string,
  inicial: Inicial,
): boolean {
  if (categorias.some((c) => c.id === categoriaId && c.pide_proveedor)) return true;
  return categoriaId !== '' && categoriaId === inicial.categoriaId && inicial.proveedorId !== '';
}

// Una compra con detalle se carga en Compras: el gasto a mano no sabe que insumo trajo.
const AVISO_DE_MERCADERIA =
  'Cargada acá cuenta en el resultado, pero no cambia el precio de ningún insumo. Si querés que lo actualice, cargala en Compras.';

/** El aviso de la carga a mano de Mercaderia; en otra categoria, nada. */
export function avisoDeMercaderia(
  categorias: { id: string; nombre: string }[],
  categoriaId: string,
): string | null {
  const elegida = categorias.find((c) => c.id === categoriaId);
  return elegida?.nombre === 'Mercadería' ? AVISO_DE_MERCADERIA : null;
}
