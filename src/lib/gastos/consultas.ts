import type { Cliente } from '../supabase/cliente';
import { POR_PAGINA, cantidadDePaginas } from '../usuarios/presentacion';
import type { MedioDePago } from './esquemas';
import type { FiltrosDeGastos } from './pantalla';
import type { Frecuencia } from './vencimientos';

export type FilaDeGasto = {
  id: string;
  fecha: string;
  monto_centavos: number;
  descripcion: string | null;
  medio_de_pago: MedioDePago;
  anulado: boolean;
  recurrente_id: string | null;
  categoria: string;
  proveedor: string | null;
};
export type ListaDeGastos = {
  filas: FilaDeGasto[];
  total: number;
  pagina: number;
  totalCentavos: number;
};
export type Opcion = { id: string; nombre: string; activo: boolean };
export type OpcionDeCategoria = Opcion & { pide_proveedor: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLUMNAS_DE_FILA =
  'id, fecha, monto_centavos, descripcion, medio_de_pago, anulado, recurrente_id, ' +
  'categoria:categorias_de_gasto(nombre), proveedor:proveedores(nombre)';

type FilaLeida = Omit<FilaDeGasto, 'categoria' | 'proveedor'> & {
  categoria: { nombre: string } | null;
  proveedor: { nombre: string } | null;
};

type ConNombres = Pick<FilaLeida, 'categoria' | 'proveedor'>;

// PostgREST trae la categoria y el proveedor como objetos: la pantalla usa solo el nombre.
function aplanar<T extends ConNombres>(fila: T) {
  return {
    ...fila,
    categoria: fila.categoria?.nombre ?? '',
    proveedor: fila.proveedor?.nombre ?? null,
  };
}

function comprobar<T>(
  respuesta: { data: T | null; error: { message: string } | null },
  que: string,
) {
  if (respuesta.error) throw new Error(`No pudimos leer ${que}: ${respuesta.error.message}`);
  return respuesta.data as T;
}

function consultaDeGastos(
  cliente: Cliente,
  filtros: FiltrosDeGastos,
  columnas: string,
  contar = false,
) {
  let consulta = cliente
    .from('gastos')
    .select(columnas, contar ? { count: 'exact', head: true } : undefined)
    .gte('fecha', filtros.desde)
    .lte('fecha', filtros.hasta);
  if (filtros.categoriaId) consulta = consulta.eq('categoria_id', filtros.categoriaId);
  if (filtros.proveedorId) consulta = consulta.eq('proveedor_id', filtros.proveedorId);
  return consulta;
}

async function totalDe(cliente: Cliente, filtros: FiltrosDeGastos): Promise<number> {
  const respuesta = await cliente.rpc('gastos_total', {
    desde: filtros.desde,
    hasta: filtros.hasta,
    ...(filtros.categoriaId ? { la_categoria: filtros.categoriaId } : {}),
    ...(filtros.proveedorId ? { el_proveedor: filtros.proveedorId } : {}),
  });
  return comprobar(respuesta, 'el total');
}

async function contarGastos(cliente: Cliente, filtros: FiltrosDeGastos): Promise<number> {
  const { count, error } = await consultaDeGastos(cliente, filtros, 'id', true);
  if (error) throw new Error(`No pudimos contar los gastos: ${error.message}`);
  return count ?? 0;
}

/** Una pagina de gastos del local, los ultimos primero, con el total sin anulados. */
export async function listarGastos(
  cliente: Cliente,
  filtros: FiltrosDeGastos,
): Promise<ListaDeGastos> {
  const total = await contarGastos(cliente, filtros);
  const pagina = Math.min(filtros.pagina, cantidadDePaginas(total));
  const desde = (pagina - 1) * POR_PAGINA;
  const respuesta = await consultaDeGastos(cliente, filtros, COLUMNAS_DE_FILA)
    .order('fecha', { ascending: false })
    .order('fecha_creacion', { ascending: false })
    .order('id')
    .range(desde, desde + POR_PAGINA - 1);
  const filas = comprobar(respuesta, 'los gastos') as unknown as FilaLeida[];
  return {
    filas: filas.map(aplanar),
    total,
    pagina,
    totalCentavos: await totalDe(cliente, filtros),
  };
}

export type Gasto = {
  id: string;
  fecha: string;
  categoria_id: string;
  monto_centavos: number;
  descripcion: string | null;
  proveedor_id: string | null;
  medio_de_pago: MedioDePago;
  comprobante: string | null;
  anulado: boolean;
  motivo_anulacion: string | null;
  recurrente_id: string | null;
  cierre_id: string | null;
};

/** Un id mal escrito en la URL no es un error: no hay gasto, y la pantalla da 404. */
export async function gastoPorId(cliente: Cliente, id: string): Promise<Gasto | null> {
  if (!UUID.test(id)) return null;
  const respuesta = await cliente
    .from('gastos')
    .select(
      'id, fecha, categoria_id, monto_centavos, descripcion, proveedor_id, medio_de_pago, ' +
        'comprobante, anulado, motivo_anulacion, recurrente_id, cierre_id',
    )
    .eq('id', id)
    .maybeSingle();
  return comprobar(respuesta, 'el gasto') as unknown as Gasto | null;
}

/** Categorias (sin las del sistema) y proveedores, activos o no: el formulario elige. */
export async function opcionesDeGasto(
  cliente: Cliente,
): Promise<{ categorias: OpcionDeCategoria[]; proveedores: Opcion[] }> {
  const [categorias, proveedores] = await Promise.all([
    cliente
      .from('categorias_de_gasto')
      .select('id, nombre, activo, pide_proveedor')
      .eq('de_sistema', false)
      .order('nombre'),
    cliente.from('proveedores').select('id, nombre, activo').order('nombre').limit(1000),
  ]);
  return {
    categorias: comprobar(categorias, 'las categorias'),
    proveedores: comprobar(proveedores, 'los proveedores'),
  };
}

export type FilaDeRecurrente = {
  id: string;
  descripcion: string | null;
  monto_centavos: number;
  frecuencia: Frecuencia;
  primer_vencimiento: string;
  activo: boolean;
  categoria: string;
  proveedor: string | null;
};

export async function listarRecurrentes(cliente: Cliente): Promise<FilaDeRecurrente[]> {
  const respuesta = await cliente
    .from('gastos_recurrentes')
    .select(
      'id, descripcion, monto_centavos, frecuencia, primer_vencimiento, activo, ' +
        'categoria:categorias_de_gasto(nombre), proveedor:proveedores(nombre)',
    )
    .order('activo', { ascending: false })
    .order('primer_vencimiento')
    .order('id');
  const filas = comprobar(respuesta, 'los recurrentes') as unknown as (Omit<
    FilaDeRecurrente,
    'categoria' | 'proveedor'
  > &
    ConNombres)[];
  return filas.map(aplanar);
}

export type Recurrente = {
  id: string;
  categoria_id: string;
  monto_centavos: number;
  descripcion: string | null;
  proveedor_id: string | null;
  medio_de_pago: MedioDePago;
  frecuencia: Frecuencia;
  primer_vencimiento: string;
  activo: boolean;
};

export async function recurrentePorId(cliente: Cliente, id: string): Promise<Recurrente | null> {
  if (!UUID.test(id)) return null;
  const respuesta = await cliente
    .from('gastos_recurrentes')
    .select(
      'id, categoria_id, monto_centavos, descripcion, proveedor_id, medio_de_pago, frecuencia, ' +
        'primer_vencimiento, activo',
    )
    .eq('id', id)
    .maybeSingle();
  return comprobar(respuesta, 'el recurrente') as unknown as Recurrente | null;
}

export type FilaDeCategoria = OpcionDeCategoria & { de_sistema: boolean };

export async function listarCategorias(cliente: Cliente): Promise<FilaDeCategoria[]> {
  const respuesta = await cliente
    .from('categorias_de_gasto')
    .select('id, nombre, activo, pide_proveedor, de_sistema')
    .order('activo', { ascending: false })
    .order('nombre');
  return comprobar(respuesta, 'las categorias');
}
