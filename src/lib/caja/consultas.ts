import type { Cliente } from '../supabase/cliente';
import { POR_PAGINA, cantidadDePaginas } from '../usuarios/presentacion';
import { totalDeRetiros } from './fondo';
import type { EstadoDeCierre, FiltrosDeControl } from './pantalla';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PERSONA = 'persona:perfiles!cierres_de_caja_cargado_por_fkey(nombre)';
const ESPERADOS =
  'esperado_efectivo_centavos, esperado_credito_centavos, esperado_debito_centavos, ' +
  'esperado_qr_centavos, esperado_transferencia_centavos';
const DECLARADOS =
  'fondo_inicial_centavos, efectivo_centavos, credito_centavos, debito_centavos, qr_centavos, ' +
  'transferencia_centavos, queda_en_caja_centavos';
// Las salidas se leen con otro nombre: el detalle del cierre ya trae "retiros" con quien.
const SALIDAS = 'salidas:retiros_de_caja(monto_centavos)';
const COLUMNAS_DE_FILA = `id, fecha, estado, ${DECLARADOS}, ${ESPERADOS}, ${PERSONA}, ${SALIDAS}`;

type Montos = {
  fondo_inicial_centavos: number;
  efectivo_centavos: number;
  credito_centavos: number;
  debito_centavos: number;
  qr_centavos: number;
  transferencia_centavos: number;
  queda_en_caja_centavos: number;
  esperado_efectivo_centavos: number | null;
  esperado_credito_centavos: number | null;
  esperado_debito_centavos: number | null;
  esperado_qr_centavos: number | null;
  esperado_transferencia_centavos: number | null;
};
type Leida = Montos & {
  id: string;
  fecha: string;
  estado: EstadoDeCierre;
  persona: { nombre: string } | null;
  salidas: { monto_centavos: number }[];
};

export type FilaDeCierre = {
  id: string;
  fecha: string;
  estado: EstadoDeCierre;
  persona: string;
  diferenciaTotalCentavos: number | null;
  fondoInicialCentavos: number;
  retirosCentavos: number;
};
export type ListaDeCierres = { filas: FilaDeCierre[]; total: number; pagina: number };

function comprobar<T>(
  respuesta: { data: T | null; error: { message: string } | null },
  que: string,
) {
  if (respuesta.error) throw new Error(`No pudimos leer ${que}: ${respuesta.error.message}`);
  return respuesta.data as T;
}

/** Declarado menos esperado, sumando los cinco medios; nulo mientras no entraron las ventas. */
export function diferenciaTotalDe(cierre: Montos): number | null {
  if (cierre.esperado_efectivo_centavos === null) return null;
  const declarado =
    cierre.efectivo_centavos +
    cierre.credito_centavos +
    cierre.debito_centavos +
    cierre.qr_centavos +
    cierre.transferencia_centavos;
  const esperado =
    cierre.esperado_efectivo_centavos +
    (cierre.esperado_credito_centavos ?? 0) +
    (cierre.esperado_debito_centavos ?? 0) +
    (cierre.esperado_qr_centavos ?? 0) +
    (cierre.esperado_transferencia_centavos ?? 0);
  return declarado - esperado;
}

function aFila(leida: Leida): FilaDeCierre {
  return {
    id: leida.id,
    fecha: leida.fecha,
    estado: leida.estado,
    persona: leida.persona?.nombre ?? '',
    diferenciaTotalCentavos: diferenciaTotalDe(leida),
    fondoInicialCentavos: leida.fondo_inicial_centavos,
    retirosCentavos: totalDeRetiros(leida.salidas ?? []),
  };
}

function consultaDeControl(
  cliente: Cliente,
  filtros: FiltrosDeControl,
  columnas: string,
  contar = false,
) {
  let consulta = cliente
    .from('cierres_de_caja')
    .select(columnas, contar ? { count: 'exact', head: true } : undefined)
    .gte('fecha', filtros.desde)
    .lte('fecha', filtros.hasta);
  if (filtros.personaId) consulta = consulta.eq('cargado_por', filtros.personaId);
  if (filtros.estado) consulta = consulta.eq('estado', filtros.estado);
  return consulta;
}

/** Una pagina del control de cierres, los ultimos primero. RLS deja ver todos solo al admin. */
export async function listarCierres(
  cliente: Cliente,
  filtros: FiltrosDeControl,
): Promise<ListaDeCierres> {
  const { count, error } = await consultaDeControl(cliente, filtros, 'id', true);
  if (error) throw new Error(`No pudimos contar los cierres: ${error.message}`);
  const total = count ?? 0;
  const pagina = Math.min(filtros.pagina, cantidadDePaginas(total));
  const desde = (pagina - 1) * POR_PAGINA;
  const respuesta = await consultaDeControl(cliente, filtros, COLUMNAS_DE_FILA)
    .order('fecha', { ascending: false })
    .order('fecha_creacion', { ascending: false })
    .range(desde, desde + POR_PAGINA - 1);
  const filas = comprobar(respuesta, 'los cierres') as unknown as Leida[];
  return { filas: filas.map(aFila), total, pagina };
}

/** Los ultimos cierres que cargo una persona. */
export async function misCierres(cliente: Cliente, personaId: string): Promise<FilaDeCierre[]> {
  const respuesta = await cliente
    .from('cierres_de_caja')
    .select(COLUMNAS_DE_FILA)
    .eq('cargado_por', personaId)
    .order('fecha', { ascending: false })
    .order('fecha_creacion', { ascending: false })
    .limit(60);
  return (comprobar(respuesta, 'tus cierres') as unknown as Leida[]).map(aFila);
}

export type Cierre = Montos & {
  id: string;
  fecha: string;
  estado: EstadoDeCierre;
  persona: string;
  comentario: string | null;
  comentario_revision: string | null;
  motivo_anulacion: string | null;
  retiros: { monto_centavos: number; quien: string }[];
  gastos: { id: string; monto_centavos: number; descripcion: string | null; anulado: boolean }[];
};

const COLUMNAS_DE_CIERRE =
  `${COLUMNAS_DE_FILA}, comentario, comentario_revision, motivo_anulacion, ` +
  'retiros:retiros_de_caja(monto_centavos, quien), ' +
  'gastos(id, monto_centavos, descripcion, anulado)';

/** Un cierre con sus retiros y sus gastos, o null si no existe o no le corresponde verlo. */
export async function cierrePorId(cliente: Cliente, id: string): Promise<Cierre | null> {
  if (!UUID.test(id)) return null;
  const respuesta = await cliente
    .from('cierres_de_caja')
    .select(COLUMNAS_DE_CIERRE)
    .eq('id', id)
    .maybeSingle();
  const leido = comprobar(respuesta, 'el cierre') as unknown as
    (Omit<Cierre, 'persona'> & Pick<Leida, 'persona'>) | null;
  return leido ? { ...leido, persona: leido.persona?.nombre ?? '' } : null;
}

/** Lo que quedo en la caja en el ultimo cierre anterior a esa fecha, para precargar el fondo. */
export async function fondoSugerido(cliente: Cliente, fecha: string): Promise<number | null> {
  const respuesta = await cliente.rpc('cierres_fondo_sugerido', { la_fecha: fecha });
  return comprobar(respuesta, 'el fondo de la caja');
}

export async function toleranciaDeCaja(cliente: Cliente): Promise<number> {
  const respuesta = await cliente
    .from('configuracion_de_caja')
    .select('tolerancia_centavos')
    .single();
  return comprobar(respuesta, 'la tolerancia').tolerancia_centavos;
}

/** Los dias del rango que tienen un cierre sin anular. */
export async function diasConCierre(
  cliente: Cliente,
  desde: string,
  hasta: string,
): Promise<string[]> {
  const respuesta = await cliente
    .from('cierres_de_caja')
    .select('fecha')
    .eq('anulado', false)
    .gte('fecha', desde)
    .lte('fecha', hasta);
  return comprobar(respuesta, 'los dias con cierre').map((fila) => fila.fecha);
}

/** El dia del primer cierre del local: desde ahi se marcan los dias sin cierre. */
export async function primerDiaConCierre(cliente: Cliente): Promise<string | null> {
  const respuesta = await cliente
    .from('cierres_de_caja')
    .select('fecha')
    .eq('anulado', false)
    .order('fecha')
    .limit(1);
  return comprobar(respuesta, 'el primer cierre')[0]?.fecha ?? null;
}

/** Quienes pueden cargar cierres, para filtrar el control por persona. */
export async function personasDeCaja(cliente: Cliente): Promise<{ id: string; nombre: string }[]> {
  const respuesta = await cliente
    .from('perfiles')
    .select('id, nombre')
    .in('rol', ['caja', 'admin'])
    .order('nombre');
  return comprobar(respuesta, 'las personas');
}

/** Lo que quedo en la caja en el cierre anterior a cada uno; solo el admin lo puede leer. */
export async function fondosAnteriores(
  cliente: Cliente,
  ids: string[],
): Promise<Map<string, number | null>> {
  if (ids.length === 0) return new Map();
  const respuesta = await cliente.rpc('cierres_fondos_anteriores', { ids });
  const filas = comprobar(respuesta, 'los fondos anteriores');
  return new Map(filas.map((f) => [f.id, f.fondo_anterior_centavos]));
}
