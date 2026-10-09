import type { Cliente } from '../supabase/cliente';
import { POR_PAGINA, cantidadDePaginas } from '../usuarios/presentacion';
import { DE_PERSONA } from './diccionario';
import { tablasDe, type FiltrosDeAuditoria } from './pantalla';
import { fechaYHora, type Nombres, type RegistroDeAuditoria } from './textos';

export type ListaDeRegistros = { filas: RegistroDeAuditoria[]; total: number; pagina: number };

const COLUMNAS = 'id, fecha, tabla, registro_id, accion, usuario_id, antes, despues, motivo';
// Argentina no cambia la hora en el ano: el dia empieza a las 00:00 -03:00.
const inicioDe = (dia: string) => `${dia}T00:00:00-03:00`;
const finDe = (dia: string) => `${dia}T23:59:59.999-03:00`;

function comprobar<T>(
  respuesta: { data: T | null; error: { message: string } | null },
  que: string,
) {
  if (respuesta.error) throw new Error(`No pudimos leer ${que}: ${respuesta.error.message}`);
  return respuesta.data as T;
}

function consultaDe(cliente: Cliente, filtros: FiltrosDeAuditoria, contar = false) {
  let consulta = cliente
    .from('auditoria')
    .select(contar ? 'id' : COLUMNAS, contar ? { count: 'exact', head: true } : undefined)
    .gte('fecha', inicioDe(filtros.desde))
    .lte('fecha', finDe(filtros.hasta));
  if (filtros.persona === 'sistema') consulta = consulta.is('usuario_id', null);
  else if (filtros.persona) consulta = consulta.eq('usuario_id', filtros.persona);
  if (filtros.modulo) consulta = consulta.in('tabla', tablasDe(filtros.modulo));
  if (filtros.accion) consulta = consulta.eq('accion', filtros.accion);
  return consulta;
}

async function contar(cliente: Cliente, filtros: FiltrosDeAuditoria): Promise<number> {
  const { count, error } = await consultaDe(cliente, filtros, true);
  if (error) throw new Error(`No pudimos contar la auditoria: ${error.message}`);
  return count ?? 0;
}

/** Una pagina de lo que paso, lo mas nuevo primero. RLS deja leer solo al admin de su local. */
export async function listarRegistros(
  cliente: Cliente,
  filtros: FiltrosDeAuditoria,
): Promise<ListaDeRegistros> {
  const total = await contar(cliente, filtros);
  const pagina = Math.min(filtros.pagina, cantidadDePaginas(total));
  const desde = (pagina - 1) * POR_PAGINA;
  const respuesta = await consultaDe(cliente, filtros)
    .order('fecha', { ascending: false })
    .order('id', { ascending: false })
    .range(desde, desde + POR_PAGINA - 1);
  const filas = comprobar(respuesta, 'la auditoria') as unknown as RegistroDeAuditoria[];
  return { filas, total, pagina };
}

/** Un id que no es un numero no es un error: no hay registro, y la pantalla da 404. */
export async function registroPorId(
  cliente: Cliente,
  id: string,
): Promise<RegistroDeAuditoria | null> {
  // Hasta 15 cifras: entra entero en un number de JavaScript.
  if (!/^\d{1,15}$/.test(id)) return null;
  const respuesta = await cliente
    .from('auditoria')
    .select(COLUMNAS)
    .eq('id', Number(id))
    .maybeSingle();
  return comprobar(respuesta, 'el registro') as unknown as RegistroDeAuditoria | null;
}

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Los codigos que hay que mostrar con su nombre: la persona y cada columna que guarda un id.
function codigosDe(registros: RegistroDeAuditoria[]): string[] {
  const codigos = new Set<string>();
  for (const registro of registros) {
    if (registro.usuario_id) codigos.add(registro.usuario_id);
    for (const fila of [registro.antes, registro.despues]) {
      for (const [columna, valor] of Object.entries(fila ?? {})) {
        const guardaId = columna.endsWith('_id') || DE_PERSONA.has(columna);
        if (guardaId && typeof valor === 'string' && ES_UUID.test(valor)) codigos.add(valor);
      }
    }
  }
  return [...codigos];
}

type Busqueda = (cliente: Cliente, ids: string[]) => PromiseLike<{ id: string; texto: string }[]>;

const conNombre =
  (
    tabla:
      | 'perfiles'
      | 'proveedores'
      | 'categorias_de_gasto'
      | 'categorias'
      | 'productos'
      | 'presentaciones',
  ): Busqueda =>
  async (cliente, ids) => {
    const { data } = await cliente.from(tabla).select('id, nombre').in('id', ids);
    return (data ?? []).map((fila) => ({ id: fila.id, texto: fila.nombre }));
  };

const BUSQUEDAS: Busqueda[] = [
  conNombre('perfiles'),
  conNombre('proveedores'),
  conNombre('categorias_de_gasto'),
  conNombre('categorias'),
  conNombre('productos'),
  conNombre('presentaciones'),
  async (cliente, ids) => {
    const { data } = await cliente.from('cierres_de_caja').select('id, fecha').in('id', ids);
    return (data ?? []).map((fila) => ({
      id: fila.id,
      texto: `Cierre del ${fila.fecha.split('-').reverse().join('/')}`,
    }));
  },
  async (cliente, ids) => {
    const { data } = await cliente
      .from('gastos_recurrentes')
      .select('id, descripcion')
      .in('id', ids);
    return (data ?? []).map((fila) => ({
      id: fila.id,
      texto: fila.descripcion ?? 'Gasto recurrente',
    }));
  },
];

/** El nombre de cada persona, categoria, proveedor, producto o cierre que nombran los registros. */
export async function nombresDe(
  cliente: Cliente,
  registros: RegistroDeAuditoria[],
): Promise<Nombres> {
  const ids = codigosDe(registros);
  if (ids.length === 0) return new Map();
  const encontrados = await Promise.all(BUSQUEDAS.map((buscar) => buscar(cliente, ids)));
  return new Map(encontrados.flat().map(({ id, texto }) => [id, texto]));
}

/** Las personas del local, tambien las desactivadas: sus registros siguen a su nombre. */
export async function personasDeAuditoria(
  cliente: Cliente,
): Promise<{ id: string; nombre: string }[]> {
  const respuesta = await cliente.from('perfiles').select('id, nombre').order('nombre');
  return comprobar(respuesta, 'las personas');
}

/** Quien cargo un dato y cuando, leido de su registro de alta. */
export async function altaDe(
  cliente: Cliente,
  tabla: string,
  id: string,
): Promise<{ persona: string; fecha: string } | null> {
  const respuesta = await cliente
    .from('auditoria')
    .select('fecha, persona:perfiles!auditoria_usuario_id_fkey(nombre)')
    .eq('tabla', tabla)
    .eq('registro_id', id)
    .eq('accion', 'alta')
    .limit(1)
    .maybeSingle();
  const alta = comprobar(respuesta, 'el alta') as unknown as {
    fecha: string;
    persona: { nombre: string } | null;
  } | null;
  if (!alta) return null;
  return { persona: alta.persona?.nombre ?? 'El sistema', fecha: fechaYHora(alta.fecha) };
}
