import { formatearPesos } from '../plata';

export type UnidadDeUso = 'g' | 'ml' | 'unidad';
export type OrigenDelCosto = 'compra' | 'referencia' | null;

// El gramo y el mililitro cuestan fracciones de centavo: por kilo y por litro se leen mejor.
const POR_UNIDAD: Record<UnidadDeUso, { factor: number; texto: string }> = {
  g: { factor: 1000, texto: 'el kg' },
  ml: { factor: 1000, texto: 'el litro' },
  unidad: { factor: 1, texto: 'la unidad' },
};

/** El costo de hoy de un insumo, como se lee en la lista: $1.280,00 el kg. */
export function costoParaMostrar(
  centavosPorUnidad: number | null,
  unidad: UnidadDeUso,
): string | null {
  if (centavosPorUnidad === null) return null;
  const { factor, texto } = POR_UNIDAD[unidad];
  // Solo para mostrar: el costo que se usa en las recetas se calcula en la base.
  return `${formatearPesos(Math.round(centavosPorUnidad * factor))} ${texto}`;
}

/** De donde sale el costo: "Compra del 12/11", "Precio de referencia" o "Sin precio". */
export function textoDelOrigen(origen: OrigenDelCosto, fecha: string | null): string {
  if (origen === 'compra' && fecha) {
    const [, mes, dia] = fecha.split('-');
    return `Compra del ${dia}/${mes}`;
  }
  return origen === 'referencia' ? 'Precio de referencia' : 'Sin precio';
}
