import type { CategoriaDelPanel } from '../menu/panel';

export type OpcionDeVenta = { valor: string; texto: string; precioCentavos: number };

/**
 * Lo que se puede vender a mano: cada producto activo del menu con cada presentacion que
 * tiene precio, y ese precio para precargar el renglon.
 */
export function opcionesDeVenta(panel: CategoriaDelPanel[]): OpcionDeVenta[] {
  return panel.flatMap((categoria) =>
    categoria.productos.flatMap((producto) =>
      producto.precios
        .filter((precio) => precio.montoCentavos !== null)
        .map((precio) => ({
          valor: `${producto.id}|${precio.presentacionId}`,
          texto: `${producto.nombre} · ${precio.presentacion}`,
          precioCentavos: precio.montoCentavos!,
        })),
    ),
  );
}
