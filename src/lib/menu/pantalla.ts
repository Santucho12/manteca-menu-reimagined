import { formatearPesosEnteros } from '../plata';
import type { PrecioVigente } from './precios';

function textoDe(precio: PrecioVigente, categoria: string): string {
  if (precio.montoCentavos === null) return `${precio.presentacion} sin precio`;
  const origen = precio.origen === 'propio' ? 'propio' : `de ${categoria}`;
  return `${precio.presentacion} ${formatearPesosEnteros(precio.montoCentavos)} (${origen})`;
}

/** Los precios de un producto en el panel, con el origen de cada uno. */
export function textoDePrecios(precios: PrecioVigente[], categoria: string): string {
  return precios.map((precio) => textoDe(precio, categoria)).join(' · ');
}

/** Cuantos productos tiene una categoria. Sin productos no se dice: la tarjeta ya lo avisa. */
export function cantidadDeProductos(cantidad: number): string | null {
  if (cantidad === 0) return null;
  return cantidad === 1 ? '1 producto' : `${cantidad} productos`;
}

export const PREGUNTA_DE_DESACTIVAR = (nombre: string) =>
  `¿Desactivar ${nombre}? Deja de usarse; lo podés reactivar desde Ver desactivados.`;

/** Que pasa si el admin deja vacio el precio de una presentacion. */
export function ayudaDelPrecio(compartidoCentavos: number | null, categoria: string): string {
  if (compartidoCentavos === null) return 'Vacío queda sin precio.';
  return `Vacío usa el de ${categoria}: ${formatearPesosEnteros(compartidoCentavos)}.`;
}
