import type { Cliente } from '../supabase/cliente';
import { filaDeCosto, type EstadoDelCosto, type FilaDeCosto, type Margenes } from './calculo';
import { porPorcentaje, type FiltrosDeCostos } from './lista';

export { presentacionesParaAjustar, type CategoriaParaAjustar } from './ajustes';
export { recetaDelProducto, type Receta, type RecetaDelProducto } from './receta';

export type PresentacionConCosto = FilaDeCosto & {
  presentacionId: string;
  nombre: string;
  estado: EstadoDelCosto;
};
export type ProductoConCosto = {
  productoId: string;
  producto: string;
  categoria: string;
  presentaciones: PresentacionConCosto[];
};
type Costo = {
  producto_id: string;
  presentacion_id: string;
  costo_centavos: number | null;
  estado: string;
};
type Producto = {
  id: string;
  nombre: string;
  categoria_id: string;
  categorias: { nombre: string } | null;
};
type Presentacion = { id: string; nombre: string; categoria_id: string; orden: number };
type Precio = { presentacion_id: string; producto_id: string | null; monto_centavos: number };
type Menu = { productos: Producto[]; presentaciones: Presentacion[]; precios: Precio[] };

const POR_DEFECTO: Margenes = { objetivo: 65, minimo: 50 };

export function comprobar<T>(
  respuesta: { data: T | null; error: { message: string } | null },
  que: string,
): T {
  if (respuesta.error) throw new Error(`No pudimos leer ${que}: ${respuesta.error.message}`);
  return respuesta.data as T;
}

/** Los margenes del local; si el admin nunca los cambio, 65 % y 50 %. */
export async function margenesDelLocal(cliente: Cliente): Promise<Margenes> {
  const { data, error } = await cliente
    .from('configuracion_de_costos')
    .select('margen_objetivo_porcentaje, margen_minimo_porcentaje')
    .maybeSingle();
  if (error) throw new Error(`No pudimos leer los márgenes: ${error.message}`);
  if (!data) return POR_DEFECTO;
  return { objetivo: data.margen_objetivo_porcentaje, minimo: data.margen_minimo_porcentaje };
}

async function leerMenu(cliente: Cliente): Promise<Menu> {
  const [productos, presentaciones, precios] = await Promise.all([
    cliente
      .from('productos')
      .select('id, nombre, categoria_id, categorias(nombre)')
      .eq('activo', true),
    cliente.from('presentaciones').select('id, nombre, categoria_id, orden').eq('activo', true),
    cliente
      .from('precios')
      .select('presentacion_id, producto_id, monto_centavos')
      .eq('activo', true),
  ]);
  return {
    productos: comprobar(productos, 'los productos') as Producto[],
    presentaciones: comprobar(presentaciones, 'las presentaciones'),
    precios: comprobar(precios, 'los precios'),
  };
}

/** El precio del menu: el propio del producto o, si no tiene, el de la categoria. */
function precioDe(precios: Precio[], productoId: string, presentacionId: string): number | null {
  const deLaPresentacion = precios.filter((p) => p.presentacion_id === presentacionId);
  const propio = deLaPresentacion.find((p) => p.producto_id === productoId);
  return (propio ?? deLaPresentacion.find((p) => p.producto_id === null))?.monto_centavos ?? null;
}

function presentacionConCosto(
  menu: Menu,
  costos: Costo[],
  productoId: string,
  presentacion: Presentacion,
  margenes: Margenes,
): PresentacionConCosto {
  const costo = costos.find(
    (c) => c.producto_id === productoId && c.presentacion_id === presentacion.id,
  );
  const estado = (costo?.estado ?? 'sin_receta') as EstadoDelCosto;
  const precio = precioDe(menu.precios, productoId, presentacion.id);
  const fila = filaDeCosto({ costo: costo?.costo_centavos ?? null, precio, estado }, margenes);
  return { presentacionId: presentacion.id, nombre: presentacion.nombre, estado, ...fila };
}

function armarProducto(menu: Menu, costos: Costo[], producto: Producto, margenes: Margenes) {
  const suyas = menu.presentaciones
    .filter((p) => p.categoria_id === producto.categoria_id)
    .sort((a, b) => a.orden - b.orden);
  return {
    productoId: producto.id,
    producto: producto.nombre,
    categoria: producto.categorias?.nombre ?? '',
    presentaciones: suyas.map((p) => presentacionConCosto(menu, costos, producto.id, p, margenes)),
  };
}

function cumple(fila: ProductoConCosto, filtro: FiltrosDeCostos['filtro']): boolean {
  if (filtro === 'debajo') return fila.presentaciones.some((p) => p.debajo);
  if (filtro === 'sin_receta') return fila.presentaciones.some((p) => p.estado === 'sin_receta');
  return true;
}

/** Cada producto activo con el costo de cada presentacion. Solo el admin activo recibe algo. */
export async function listarCostos(
  cliente: Cliente,
  filtros: FiltrosDeCostos,
): Promise<ProductoConCosto[]> {
  const costos = comprobar(await cliente.rpc('costos_de_productos'), 'los costos') as Costo[];
  if (costos.length === 0) return [];
  const [menu, margenes] = await Promise.all([leerMenu(cliente), margenesDelLocal(cliente)]);
  const filas = menu.productos
    .map((producto) => armarProducto(menu, costos, producto, margenes))
    .filter((fila) => cumple(fila, filtros.filtro));
  return filtros.orden === 'nombre'
    ? filas.sort((a, b) => a.producto.localeCompare(b.producto, 'es'))
    : filas.sort(porPorcentaje);
}

/** Cuantos productos tienen alguna presentacion debajo del margen minimo: el aviso de Inicio. */
export async function cuantosDebajoDelMinimo(cliente: Cliente): Promise<number> {
  return (await listarCostos(cliente, { filtro: 'debajo', orden: 'nombre' })).length;
}
