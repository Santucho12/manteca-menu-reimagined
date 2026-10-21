import { diasConCierre, primerDiaConCierre } from '../caja/consultas';
import { datosDelResultado, ventasPorProducto } from '../reportes/consultas';
import { periodoAnterior, sumarDias } from '../reportes/periodos';
import { resultadoPorMes } from '../reportes/resultado';
import { productosDelReporte } from '../reportes/ventas';
import type { Cliente } from '../supabase/cliente';
import { contarPendientes } from '../usuarios/consultas';
import { avisosDeInicio, type ConFecha, type DatosDeAvisos } from './avisos';
import { masVendidos, mesEnCurso, ultimosDoceMeses } from './meses';

type Respuesta = {
  data: { fecha: string }[] | null;
  count: number | null;
  error: { message: string } | null;
};

function conFecha(r: Respuesta): ConFecha {
  if (r.error) throw new Error(`No pudimos leer los avisos: ${r.error.message}`);
  return { cantidad: r.count ?? 0, desde: r.data?.[0]?.fecha ?? null };
}

// Un cierre anulado o revisado ya no esta en con_diferencia: el estado alcanza.
export async function cierresConDiferencia(cliente: Cliente): Promise<ConFecha> {
  return conFecha(
    await cliente
      .from('cierres_de_caja')
      .select('fecha', { count: 'exact' })
      .eq('estado', 'con_diferencia')
      .order('fecha')
      .limit(1),
  );
}

async function idDeSinClasificar(cliente: Cliente): Promise<string | null> {
  const respuesta = await cliente
    .from('categorias_de_gasto')
    .select('id')
    .eq('de_sistema', true)
    .maybeSingle();
  if (respuesta.error) throw new Error(`No pudimos leer los avisos: ${respuesta.error.message}`);
  return respuesta.data?.id ?? null;
}

export async function gastosSinClasificar(cliente: Cliente): Promise<DatosDeAvisos['sinClasificar']> {
  const categoriaId = await idDeSinClasificar(cliente);
  if (!categoriaId) return { cantidad: 0, desde: null, categoriaId };
  const gastos = await cliente
    .from('gastos')
    .select('fecha', { count: 'exact' })
    .eq('categoria_id', categoriaId)
    .eq('anulado', false)
    .order('fecha')
    .limit(1);
  return { ...conFecha(gastos), categoriaId };
}

/** Ayer, si no tiene cierre; nada si el local todavia no habia cargado ninguno. */
async function ayerSinCierre(cliente: Cliente, hoy: string): Promise<string | null> {
  const ayer = sumarDias(hoy, -1);
  const [primero, cargados] = await Promise.all([
    primerDiaConCierre(cliente),
    diasConCierre(cliente, ayer, ayer),
  ]);
  return !primero || primero > ayer || cargados.length > 0 ? null : ayer;
}

export async function datosDeAvisos(cliente: Cliente, hoy: string): Promise<DatosDeAvisos> {
  const [conDiferencia, ayer, pendientes, sinClasificar] = await Promise.all([
    cierresConDiferencia(cliente),
    ayerSinCierre(cliente, hoy),
    contarPendientes(cliente),
    gastosSinClasificar(cliente),
  ]);
  return { conDiferencia, ayerSinCierre: ayer, pendientes, sinClasificar };
}

/** Todo lo de Inicio, con el mismo calculo que Reportes. */
export async function datosDelInicio(cliente: Cliente, hoy: string) {
  const mes = mesEnCurso(hoy);
  const [avisos, actual, anterior, anio, productos] = await Promise.all([
    datosDeAvisos(cliente, hoy),
    datosDelResultado(cliente, mes),
    datosDelResultado(cliente, periodoAnterior(mes)),
    datosDelResultado(cliente, ultimosDoceMeses(hoy)),
    ventasPorProducto(cliente, mes),
  ]);
  return {
    avisos: avisosDeInicio(avisos),
    actual,
    anterior,
    meses: resultadoPorMes(anio.ventas, anio.gastos),
    masVendidos: masVendidos(productosDelReporte(productos)),
  };
}
