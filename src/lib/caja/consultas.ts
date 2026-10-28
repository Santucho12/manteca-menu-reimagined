import type { Cliente } from '../supabase/cliente';
import { POR_PAGINA, cantidadDePaginas } from '../usuarios/presentacion';
import type { FiltrosDeControl } from './pantalla';
import type { Medio, ResultadoDeMedio } from './resultado';
import { resultadoDeFila, type FilaConVentas } from './resultadoDeFila';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIN_LIMITE = { desde: '2000-01-01', hasta: '2100-12-31' };

type Leida = FilaConVentas & {
  id: string;
  fecha: string;
  anulado: boolean;
  persona_nombre: string;
  motivo_anulacion: string | null;
  comentario: string | null;
  queda_en_caja_centavos: number;
};

export type FilaDeCierre = {
  id: string;
  fecha: string;
  /** Un cierre anulado conserva su cuenta, pero no cuenta para nada: se ve aparte. */
  estado: 'cierra' | 'con_diferencia';
  anulado: boolean;
  persona: string;
  diferenciaTotalCentavos: number;
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

function aFila(leida: Leida): FilaDeCierre {
  const resultado = resultadoDeFila(leida);
  return {
    id: leida.id,
    fecha: leida.fecha,
    estado: resultado.estado,
    anulado: leida.anulado,
    persona: leida.persona_nombre,
    diferenciaTotalCentavos: resultado.diferenciaTotalCentavos,
    fondoInicialCentavos: leida.fondo_inicial_centavos,
    retirosCentavos: leida.retiros_centavos,
  };
}

async function leerCierres(cliente: Cliente, desde: string, hasta: string, persona?: string) {
  const respuesta = await cliente.rpc('cierres_con_resultado', { desde, hasta, persona });
  return comprobar(respuesta, 'los cierres') as unknown as Leida[];
}

const coincide = (fila: FilaDeCierre, filtros: FiltrosDeControl) =>
  (filtros.anulados || !fila.anulado) && (!filtros.estado || fila.estado === filtros.estado);

/** Una pagina del control de cierres, los ultimos primero. La base deja ver todos solo al admin. */
export async function listarCierres(
  cliente: Cliente,
  filtros: FiltrosDeControl,
): Promise<ListaDeCierres> {
  const todos = await leerCierres(
    cliente,
    filtros.desde,
    filtros.hasta,
    filtros.personaId ?? undefined,
  );
  const visibles = todos.map(aFila).filter((fila) => coincide(fila, filtros));
  const pagina = Math.min(filtros.pagina, cantidadDePaginas(visibles.length));
  const desde = (pagina - 1) * POR_PAGINA;
  return { filas: visibles.slice(desde, desde + POR_PAGINA), total: visibles.length, pagina };
}

/** Los ultimos cierres que cargo una persona. */
export async function misCierres(cliente: Cliente, personaId: string): Promise<FilaDeCierre[]> {
  const todos = await leerCierres(cliente, SIN_LIMITE.desde, SIN_LIMITE.hasta, personaId);
  return todos
    .map(aFila)
    .filter((fila) => !fila.anulado)
    .slice(0, 60);
}

export type Cierre = FilaDeCierre & {
  declarados: Record<Medio, number>;
  medios: ResultadoDeMedio[];
  quedaEnCajaCentavos: number;
  comentario: string | null;
  motivoDeAnulacion: string | null;
  retiros: { monto_centavos: number; quien: string }[];
  gastos: { id: string; monto_centavos: number; descripcion: string | null; anulado: boolean }[];
};

const COLUMNAS_DE_CIERRE =
  'id, fecha, retiros:retiros_de_caja(monto_centavos, quien), ' +
  'gastos(id, monto_centavos, descripcion, anulado)';

/** Un cierre con su cuenta, sus retiros y sus gastos, o null si no existe o no le corresponde verlo. */
export async function cierrePorId(cliente: Cliente, id: string): Promise<Cierre | null> {
  if (!UUID.test(id)) return null;
  const base = await cliente
    .from('cierres_de_caja')
    .select(COLUMNAS_DE_CIERRE)
    .eq('id', id)
    .maybeSingle();
  const salidas = comprobar(base, 'el cierre') as unknown as
    | (Pick<Cierre, 'retiros' | 'gastos'> & {
        fecha: string;
      })
    | null;
  if (!salidas) return null;
  const leida = (await leerCierres(cliente, salidas.fecha, salidas.fecha)).find((c) => c.id === id);
  if (!leida) return null;
  return { ...aFila(leida), ...detalleDe(leida), retiros: salidas.retiros, gastos: salidas.gastos };
}

function detalleDe(leida: Leida) {
  return {
    declarados: {
      efectivo: leida.efectivo_centavos,
      credito: leida.credito_centavos,
      debito: leida.debito_centavos,
      qr: leida.qr_centavos,
      transferencia: leida.transferencia_centavos,
    },
    medios: resultadoDeFila(leida).medios,
    quedaEnCajaCentavos: leida.queda_en_caja_centavos,
    comentario: leida.comentario,
    motivoDeAnulacion: leida.motivo_anulacion,
  };
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
