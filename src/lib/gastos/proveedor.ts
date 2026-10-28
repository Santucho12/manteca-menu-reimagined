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
