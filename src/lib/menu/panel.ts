import type { PrecioDelAlcance } from './aumento';
import type { DatosDeCategoria, DatosDeProducto } from './esquemas';
import type { Icono } from './iconos';
import {
  preciosVigentes,
  tienePrecio,
  type PrecioGuardado,
  type PrecioVigente,
  type PresentacionDelMenu,
} from './precios';

export type Etiqueta = 'mas_vendido' | 'artesanal' | 'nuevo';
export type FilaCategoria = {
  id: string;
  nombre: string;
  subtitulo: string | null;
  foto: string | null;
  icono: string;
  orden: number;
  visible: boolean;
  activo: boolean;
};
export type FilaPresentacion = {
  id: string;
  categoria_id: string;
  nombre: string;
  orden: number;
  activo: boolean;
  /** Cuánto es: unidades (Docena = 12) o gramos (Por cuarto = 250), o ninguna. */
  unidades?: number | null;
  gramos?: number | null;
};
export type FilaProducto = {
  id: string;
  categoria_id: string;
  nombre: string;
  descripcion: string | null;
  etiqueta: Etiqueta | null;
  orden: number;
  visible: boolean;
  activo: boolean;
};
export type FilaPrecio = {
  id: string;
  presentacion_id: string;
  producto_id: string | null;
  monto_centavos: number;
  activo: boolean;
};
export type FilasDelMenu = {
  categorias: FilaCategoria[];
  presentaciones: FilaPresentacion[];
  productos: FilaProducto[];
  precios: FilaPrecio[];
};
export type ProductoDelPanel = {
  id: string;
  nombre: string;
  descripcion: string | null;
  etiqueta: Etiqueta | null;
  visible: boolean;
  precios: PrecioVigente[];
  conPrecio: boolean;
};
export type CategoriaDelPanel = {
  id: string;
  nombre: string;
  subtitulo: string | null;
  foto: string | null;
  icono: Icono;
  visible: boolean;
  presentaciones: PresentacionDelMenu[];
  compartidos: (number | null)[];
  productos: ProductoDelPanel[];
};
export type Desactivados = {
  categorias: { id: string; nombre: string }[];
  productos: { id: string; nombre: string; categoria: string; categoriaActiva: boolean }[];
};

const porOrden = <T extends { orden: number; id: string }>(a: T, b: T) =>
  a.orden - b.orden || a.id.localeCompare(b.id);

function presentacionesDe(filas: FilasDelMenu, categoriaId: string): PresentacionDelMenu[] {
  return filas.presentaciones
    .filter((p) => p.categoria_id === categoriaId && p.activo)
    .sort(porOrden)
    .map(({ id, nombre, unidades, gramos }) => ({
      id,
      nombre,
      unidades: unidades ?? null,
      gramos: gramos ?? null,
    }));
}

function preciosGuardados(filas: FilasDelMenu): PrecioGuardado[] {
  return filas.precios
    .filter((p) => p.activo)
    .map((p) => ({
      presentacionId: p.presentacion_id,
      productoId: p.producto_id,
      montoCentavos: p.monto_centavos,
    }));
}

function productoDelPanel(
  fila: FilaProducto,
  presentaciones: PresentacionDelMenu[],
  precios: PrecioGuardado[],
) {
  const vigentes = preciosVigentes(fila.id, presentaciones, precios);
  const { id, nombre, descripcion, etiqueta, visible } = fila;
  return {
    id,
    nombre,
    descripcion,
    etiqueta,
    visible,
    precios: vigentes,
    conPrecio: tienePrecio(vigentes),
  };
}

function compartidosDe(presentaciones: PresentacionDelMenu[], precios: PrecioGuardado[]) {
  return presentaciones.map(
    (p) =>
      precios.find((x) => x.presentacionId === p.id && x.productoId === null)?.montoCentavos ??
      null,
  );
}

function categoriaDelPanel(
  fila: FilaCategoria,
  filas: FilasDelMenu,
  precios: PrecioGuardado[],
): CategoriaDelPanel {
  const presentaciones = presentacionesDe(filas, fila.id);
  const { id, nombre, subtitulo, foto, visible } = fila;
  return {
    id,
    nombre,
    subtitulo,
    foto,
    icono: fila.icono as Icono,
    visible,
    presentaciones,
    compartidos: compartidosDe(presentaciones, precios),
    productos: productosDe(filas, fila.id, presentaciones, precios),
  };
}

function productosDe(
  filas: FilasDelMenu,
  categoriaId: string,
  presentaciones: PresentacionDelMenu[],
  precios: PrecioGuardado[],
): ProductoDelPanel[] {
  return filas.productos
    .filter((p) => p.categoria_id === categoriaId && p.activo)
    .sort(porOrden)
    .map((p) => productoDelPanel(p, presentaciones, precios));
}

/** Las categorias y productos activos, en el orden del menu, con el precio vigente de cada uno. */
export function armarPanel(filas: FilasDelMenu): CategoriaDelPanel[] {
  const precios = preciosGuardados(filas);
  return filas.categorias
    .filter((c) => c.activo)
    .sort(porOrden)
    .map((c) => categoriaDelPanel(c, filas, precios));
}

function alcanceDeCategoria(categoria: CategoriaDelPanel, filas: FilasDelMenu): PrecioDelAlcance[] {
  const ids = new Set(categoria.presentaciones.map((p) => p.id));
  const productos = new Map(categoria.productos.map((p) => [p.id, p]));
  const presentacion = (id: string) => categoria.presentaciones.find((p) => p.id === id)!.nombre;
  return filas.precios
    .filter(
      (p) =>
        p.activo &&
        ids.has(p.presentacion_id) &&
        (p.producto_id === null || productos.has(p.producto_id)),
    )
    .map((p) => ({
      id: p.id,
      categoria: categoria.nombre,
      presentacion: presentacion(p.presentacion_id),
      producto: p.producto_id ? productos.get(p.producto_id)!.nombre : null,
      oculto: p.producto_id ? !productos.get(p.producto_id)!.visible : false,
      montoCentavos: p.monto_centavos,
    }));
}

/** Los precios que toca un aumento: los mismos que comprueba la base al aplicarlo. */
export function alcanceDelAumento(
  filas: FilasDelMenu,
  categoriaId: string | null,
): PrecioDelAlcance[] {
  return armarPanel(filas)
    .filter((c) => categoriaId === null || c.id === categoriaId)
    .flatMap((c) => alcanceDeCategoria(c, filas));
}

export function desactivados(filas: FilasDelMenu): Desactivados {
  const categorias = new Map(filas.categorias.map((c) => [c.id, c]));
  return {
    categorias: filas.categorias
      .filter((c) => !c.activo)
      .sort(porOrden)
      .map(({ id, nombre }) => ({ id, nombre })),
    productos: filas.productos
      .filter((p) => !p.activo)
      .sort(porOrden)
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        categoria: categorias.get(p.categoria_id)?.nombre ?? '',
        categoriaActiva: categorias.get(p.categoria_id)?.activo ?? false,
      })),
  };
}

const enPesos = (centavos: number | null) => (centavos === null ? '' : String(centavos / 100));

function medidaDe(p: PresentacionDelMenu) {
  if (p.unidades) return { medida: 'unidades' as const, cantidad: String(p.unidades) };
  if (p.gramos) return { medida: 'gramos' as const, cantidad: String(p.gramos) };
  return { medida: '' as const, cantidad: '' };
}

function formaParaEditar(p: PresentacionDelMenu, compartidoCentavos: number | null) {
  const compartido = enPesos(compartidoCentavos);
  return { id: p.id, nombre: p.nombre, compartido, compartidoOriginal: compartido, ...medidaDe(p) };
}

export function categoriaParaEditar(
  panel: CategoriaDelPanel[],
  id: string,
): DatosDeCategoria | null {
  const categoria = panel.find((c) => c.id === id);
  if (!categoria) return null;
  return {
    id: categoria.id,
    nombre: categoria.nombre,
    subtitulo: categoria.subtitulo ?? '',
    icono: categoria.icono,
    foto: categoria.foto ?? '',
    precioCompartido: categoria.compartidos.some((c) => c !== null),
    presentaciones: categoria.presentaciones.map((p, i) =>
      formaParaEditar(p, categoria.compartidos[i] ?? null),
    ),
  };
}

function precioParaEditar(precio: PrecioVigente) {
  const monto = precio.origen === 'propio' ? enPesos(precio.montoCentavos) : '';
  return { presentacionId: precio.presentacionId, monto, original: monto };
}

export function productoParaEditar(panel: CategoriaDelPanel[], id: string): DatosDeProducto | null {
  for (const categoria of panel) {
    const producto = categoria.productos.find((p) => p.id === id);
    if (!producto) continue;
    return {
      id: producto.id,
      categoriaId: categoria.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? '',
      etiqueta: producto.etiqueta ?? '',
      visible: producto.visible,
      precios: producto.precios.map(precioParaEditar),
    };
  }
  return null;
}
