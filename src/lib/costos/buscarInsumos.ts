import type { InsumoParaReceta } from './receta';

const sinTildes = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Los insumos que tienen todas las palabras escritas, sin importar tildes ni mayusculas. Los
 * que ya estan en la receta quedan siempre: si no, su renglon perderia lo elegido.
 */
export function buscarInsumos(
  insumos: InsumoParaReceta[],
  escrito: string,
  elegidos: string[],
): InsumoParaReceta[] {
  const palabras = sinTildes(escrito).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return insumos;
  return insumos.filter((insumo) => {
    if (elegidos.includes(insumo.id)) return true;
    const nombre = sinTildes(insumo.nombre);
    return palabras.every((palabra) => nombre.includes(palabra));
  });
}
