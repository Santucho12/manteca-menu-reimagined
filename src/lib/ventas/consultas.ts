import type { Medio } from '../caja/resultado';
import { leerPanel } from '../menu/consultas';
import type { Cliente } from '../supabase/cliente';
import { POR_PAGINA, cantidadDePaginas } from '../usuarios/presentacion';
import { opcionesDeVenta, type OpcionDeVenta } from './opciones';
import type { FiltrosDeVentas, Origen } from './pantalla';

export type FilaDeVenta = {
  id: string;
  fecha: string;
  /** Cuando se cerro, o null si no se sabe: las del Excel de Fudo solo traen el dia. */
  cerrada_en: string | null;
  origen: Origen;
  estado: string;
  anulado: boolean;
  total_centavos: number;
  canal: string | null;
  /** El nombre de quien la cargo; null si nadie (las de Fudo entran solas). */
  cargada_por: string | null;
  medios: Medio[];
};
export type Totales = {
  cobradoCentavos: number;
  cobradas: number;
  canceladoCentavos: number;
  canceladas: number;
  anuladoCentavos: number;
  anuladas: number;
};
export type ListaDeVentas = {
  filas: FilaDeVenta[];
  total: number;
  pagina: number;
  totales: Totales;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function comprobar<T>(
  respuesta: { data: T | null; error: { message: string } | null },
  que: string,
) {
  if (respuesta.error) throw new Error(`No pudimos leer ${que}: ${respuesta.error.message}`);
  return respuesta.data as T;
}

// Con un medio elegido, solo las ventas que tienen un pago con ese medio (inner join).
function columnasDe(filtros: FiltrosDeVentas, contar: boolean): string {
  const pagos = `pagos:pagos_de_venta${filtros.medio ? '!inner' : ''}(medio)`;
  if (contar) return `id, ${pagos}`;
  return `id, fecha, cerrada_en, origen, estado, anulado, total_centavos, canal:canales_de_venta(nombre), autor:perfiles!ventas_creado_por_fkey(nombre), ${pagos}`;
}

function consultaDe(cliente: Cliente, filtros: FiltrosDeVentas, contar = false) {
  let consulta = cliente
    .from('ventas')
    .select(columnasDe(filtros, contar), contar ? { count: 'exact', head: true } : undefined)
    .gte('fecha', filtros.desde)
    .lte('fecha', filtros.hasta);
  if (filtros.origen) consulta = consulta.eq('origen', filtros.origen);
  if (filtros.medio) consulta = consulta.eq('pagos.medio', filtros.medio);
  if (filtros.estado === 'anulada') consulta = consulta.eq('anulado', true);
  else if (filtros.estado) consulta = consulta.eq('estado', filtros.estado).eq('anulado', false);
  return consulta;
}

async function totalesDe(cliente: Cliente, filtros: FiltrosDeVentas): Promise<Totales> {
  const respuesta = await cliente.rpc('ventas_totales', {
    desde: filtros.desde,
    hasta: filtros.hasta,
    ...(filtros.origen ? { el_origen: filtros.origen } : {}),
    ...(filtros.medio ? { el_medio: filtros.medio } : {}),
  });
  const [fila] = comprobar(respuesta, 'los totales');
  return {
    cobradoCentavos: fila?.cobrado_centavos ?? 0,
    cobradas: fila?.cobradas ?? 0,
    canceladoCentavos: fila?.cancelado_centavos ?? 0,
    canceladas: fila?.canceladas ?? 0,
    anuladoCentavos: fila?.anulado_centavos ?? 0,
    anuladas: fila?.anuladas ?? 0,
  };
}

type Leida = Omit<FilaDeVenta, 'canal' | 'cargada_por' | 'medios'> & {
  canal: { nombre: string } | null;
  autor: { nombre: string } | null;
  pagos: { medio: Medio }[];
};

const aFila = ({ canal, autor, pagos, ...venta }: Leida): FilaDeVenta => ({
  ...venta,
  canal: canal?.nombre ?? null,
  cargada_por: autor?.nombre ?? null,
  medios: [...new Set(pagos.map((pago) => pago.medio))],
});

async function contar(cliente: Cliente, filtros: FiltrosDeVentas): Promise<number> {
  const { count, error } = await consultaDe(cliente, filtros, true);
  if (error) throw new Error(`No pudimos contar las ventas: ${error.message}`);
  return count ?? 0;
}

/** Una pagina de ventas, las ultimas primero, con los totales de todo lo filtrado. */
export async function listarVentas(
  cliente: Cliente,
  filtros: FiltrosDeVentas,
): Promise<ListaDeVentas> {
  const total = await contar(cliente, filtros);
  const pagina = Math.min(filtros.pagina, cantidadDePaginas(total));
  const desde = (pagina - 1) * POR_PAGINA;
  const respuesta = await consultaDe(cliente, filtros)
    .order('fecha', { ascending: false })
    .order('fecha_creacion', { ascending: false })
    .range(desde, desde + POR_PAGINA - 1);
  const filas = (comprobar(respuesta, 'las ventas') as unknown as Leida[]).map(aFila);
  return { filas, total, pagina, totales: await totalesDe(cliente, filtros) };
}

export type Venta = Omit<FilaDeVenta, 'medios'> & {
  comentario: string | null;
  motivo_anulacion: string | null;
  renglones: {
    id: string;
    descripcion: string;
    cantidad: number;
    precio_unitario_centavos: number;
    subtotal_centavos: number;
  }[];
  pagos: { medio: Medio; monto_centavos: number }[];
};

const COLUMNAS_DE_VENTA =
  'id, fecha, cerrada_en, origen, estado, anulado, total_centavos, comentario, motivo_anulacion, ' +
  'canal:canales_de_venta(nombre), ' +
  'renglones:renglones_de_venta(id, descripcion, cantidad, precio_unitario_centavos, subtotal_centavos), ' +
  'pagos:pagos_de_venta(medio, monto_centavos)';

/** Una venta con sus renglones y sus pagos, o null si el id no sirve o no es del local. */
export async function ventaPorId(cliente: Cliente, id: string): Promise<Venta | null> {
  if (!UUID.test(id)) return null;
  const respuesta = await cliente
    .from('ventas')
    .select(COLUMNAS_DE_VENTA)
    .eq('id', id)
    .maybeSingle();
  const leida = comprobar(respuesta, 'la venta') as unknown as
    (Omit<Venta, 'canal'> & { canal: { nombre: string } | null }) | null;
  return leida ? { ...leida, canal: leida.canal?.nombre ?? null } : null;
}

/** Los productos del menu con cada presentacion y su precio, para cargar una venta a mano. */
export async function opcionesParaVender(cliente: Cliente): Promise<OpcionDeVenta[]> {
  return opcionesDeVenta(await leerPanel(cliente));
}

export async function canalesDeVenta(
  cliente: Cliente,
): Promise<{ id: string; nombre: string; activo: boolean }[]> {
  const respuesta = await cliente
    .from('canales_de_venta')
    .select('id, nombre, activo')
    .order('activo', { ascending: false })
    .order('nombre');
  return comprobar(respuesta, 'los tipos de venta');
}
