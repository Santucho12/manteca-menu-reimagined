import type { Punto } from './agrupar';

export type VentaDelDia = { dia: string; ventas: number; monto_centavos: number };
export type RenglonDeProducto = {
  producto_id: string | null;
  producto: string;
  categoria_id: string | null;
  categoria: string | null;
  presentacion: string;
  cantidad: number;
  monto_centavos: number;
};
export type VentaDeCategoria = {
  categoria_id: string | null;
  categoria: string;
  ventas: number;
  monto_centavos: number;
};
export type TotalesDeVentas = {
  montoCentavos: number;
  ventas: number;
  ticketCentavos: number | null;
};
type Detalle = { nombre: string; cantidad: number; montoCentavos: number };
export type ProductoDelReporte = {
  clave: string;
  nombre: string;
  montoCentavos: number;
  presentaciones: Detalle[];
};
export type CategoriaDelReporte = {
  clave: string;
  nombre: string;
  ventas: number;
  montoCentavos: number;
};

export const SIN_VINCULAR = 'sin-vincular';

export const ticketPromedio = (montoCentavos: number, ventas: number) =>
  ventas === 0 ? null : Math.round(montoCentavos / ventas);

export function totalesDeVentas(dias: VentaDelDia[]): TotalesDeVentas {
  const montoCentavos = dias.reduce((suma, d) => suma + d.monto_centavos, 0);
  const ventas = dias.reduce((suma, d) => suma + d.ventas, 0);
  return { montoCentavos, ventas, ticketCentavos: ticketPromedio(montoCentavos, ventas) };
}

export const puntosDeVentas = (dias: VentaDelDia[]): Punto[] =>
  dias.map((d) => ({ clave: d.dia, montoCentavos: d.monto_centavos, cantidad: d.ventas }));

const porMonto = <T extends { montoCentavos: number }>(a: T, b: T) =>
  b.montoCentavos - a.montoCentavos;
const alFinal = (p: ProductoDelReporte) => Number(p.clave === SIN_VINCULAR);

function detalleDe(r: RenglonDeProducto): Detalle {
  // Lo no vinculado no tiene presentacion: el detalle es el nombre que trajo Fudo.
  const nombre = r.producto_id ? r.presentacion : r.producto;
  return { nombre, cantidad: r.cantidad, montoCentavos: r.monto_centavos };
}

function sumarRenglon(productos: Map<string, ProductoDelReporte>, r: RenglonDeProducto) {
  const clave = r.producto_id ?? SIN_VINCULAR;
  const nombre = r.producto_id ? r.producto : 'Sin vincular';
  const previo = productos.get(clave) ?? { clave, nombre, montoCentavos: 0, presentaciones: [] };
  productos.set(clave, {
    ...previo,
    montoCentavos: previo.montoCentavos + r.monto_centavos,
    presentaciones: [...previo.presentaciones, detalleDe(r)],
  });
}

/**
 * Una fila por producto con su monto. Lo no vinculado va junto en "Sin vincular" y siempre al
 * final, aunque sume mas: es lo que falta vincular, no un producto.
 */
export function productosDelReporte(renglones: RenglonDeProducto[]): ProductoDelReporte[] {
  const productos = new Map<string, ProductoDelReporte>();
  for (const r of renglones) sumarRenglon(productos, r);
  return [...productos.values()]
    .map((p) =>
      p.clave === SIN_VINCULAR ? p : { ...p, presentaciones: p.presentaciones.sort(porMonto) },
    )
    .sort((a, b) => alFinal(a) - alFinal(b) || porMonto(a, b));
}

export const categoriasDelReporte = (filas: VentaDeCategoria[]): CategoriaDelReporte[] =>
  filas.map((f) => ({
    clave: f.categoria_id ?? SIN_VINCULAR,
    nombre: f.categoria,
    ventas: f.ventas,
    montoCentavos: f.monto_centavos,
  }));
