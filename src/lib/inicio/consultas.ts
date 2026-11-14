import { diasConCierre, listarCierres, primerDiaConCierre } from '../caja/consultas';
import type { FiltrosDeControl } from '../caja/pantalla';
import { diasSinAbrir } from '../caja/sinAbrir';
import { listarRecurrentes } from '../gastos/consultas';
import { proximosPagos } from '../gastos/fijos';
import { pagosPendientes, vencimientosTomados } from '../gastos/pagos';
import { itemsPorPagar } from '../gastos/porPagar';
import {
  datosDelResultado,
  ventasPorDia,
  ventasPorProducto,
  ventasSinDetalle,
} from '../reportes/consultas';
import { periodoAnterior, sumarDias } from '../reportes/periodos';
import { resultadoPorMes } from '../reportes/resultado';
import { productosDelReporte } from '../reportes/ventas';
import type { Cliente } from '../supabase/cliente';
import { contarPendientes } from '../usuarios/consultas';
import { avisosDeInicio, type ConFecha, type DatosDeAvisos } from './avisos';
import { masVendidos, mesEnCurso, ultimosDoceMeses } from './meses';
import { pagosParaAvisar, type PagosParaAvisar } from './pagos';
import { semanaContraSemana, rangoDeSemanas } from './semana';

type Respuesta = {
  data: { fecha: string }[] | null;
  count: number | null;
  error: { message: string } | null;
};

function conFecha(r: Respuesta): ConFecha {
  if (r.error) throw new Error(`No pudimos leer los avisos: ${r.error.message}`);
  return { cantidad: r.count ?? 0, desde: r.data?.[0]?.fecha ?? null };
}

const DIAS_DE_AVISO = 7;

const filtrosDeAyer = (desde: string, hasta: string): FiltrosDeControl => ({
  desde,
  hasta,
  personaId: null,
  estado: null,
  anulados: false,
  pagina: 1,
});

// Sin "revisado" un cierre con diferencia no se apaga solo: el aviso mira la ultima semana.
export async function cierresConDiferencia(cliente: Cliente, hoy: string): Promise<ConFecha> {
  const filtros = {
    ...filtrosDeAyer(sumarDias(hoy, -DIAS_DE_AVISO), hoy),
    estado: 'con_diferencia' as const,
  };
  const lista = await listarCierres(cliente, { ...filtros, pagina: 1 });
  const fechas = lista.filas.map((fila) => fila.fecha).sort();
  return { cantidad: lista.total, desde: fechas[0] ?? null };
}

// Un solo viaje: la categoria de sistema se filtra en el mismo pedido de los gastos.
export async function gastosSinClasificar(
  cliente: Cliente,
): Promise<DatosDeAvisos['sinClasificar']> {
  const gastos = await cliente
    .from('gastos')
    .select('fecha, categoria_id, categoria:categorias_de_gasto!inner(de_sistema)', {
      count: 'exact',
    })
    .eq('categoria.de_sistema', true)
    .eq('anulado', false)
    .order('fecha')
    .limit(1);
  return { ...conFecha(gastos), categoriaId: gastos.data?.[0]?.categoria_id ?? null };
}

/** Ayer, si no tiene cierre ni esta marcado como dia sin abrir; nada si no habia ningun cierre. */
async function ayerSinCierre(cliente: Cliente, hoy: string): Promise<string | null> {
  const ayer = sumarDias(hoy, -1);
  const [primero, cargados, sinAbrir] = await Promise.all([
    primerDiaConCierre(cliente),
    diasConCierre(cliente, ayer, ayer),
    diasSinAbrir(cliente, ayer, ayer),
  ]);
  const resuelto = cargados.length > 0 || sinAbrir.length > 0;
  return !primero || primero > ayer || resuelto ? null : ayer;
}

export async function datosDeAvisos(cliente: Cliente, hoy: string): Promise<DatosDeAvisos> {
  const [conDiferencia, ayer, pendientes, sinClasificar] = await Promise.all([
    cierresConDiferencia(cliente, hoy),
    ayerSinCierre(cliente, hoy),
    contarPendientes(cliente),
    gastosSinClasificar(cliente),
  ]);
  return { conDiferencia, ayerSinCierre: ayer, pendientes, sinClasificar };
}

/** Lo vencido y lo que vence esta semana, de la misma lista que muestra Próximos pagos de Gastos. */
export async function pagosDelInicio(cliente: Cliente, hoy: string): Promise<PagosParaAvisar> {
  const [recurrentes, pendientes, tomados] = await Promise.all([
    listarRecurrentes(cliente),
    pagosPendientes(cliente),
    vencimientosTomados(cliente, hoy),
  ]);
  return pagosParaAvisar(itemsPorPagar(pendientes, proximosPagos(recurrentes, hoy, tomados)), hoy);
}

// Todo sale a la vez: cada viaje a la base cuesta unos 300 ms y en serie se suman.
function leerElInicio(cliente: Cliente, hoy: string) {
  const mes = mesEnCurso(hoy);
  return Promise.all([
    datosDeAvisos(cliente, hoy),
    datosDelResultado(cliente, mes),
    datosDelResultado(cliente, periodoAnterior(mes)),
    datosDelResultado(cliente, ultimosDoceMeses(hoy)),
    ventasPorProducto(cliente, mes),
    ventasPorDia(cliente, rangoDeSemanas(hoy)),
    pagosDelInicio(cliente, hoy),
    ventasSinDetalle(cliente, mes),
  ]);
}

/** Todo lo de Inicio, con el mismo calculo que Reportes. */
export async function datosDelInicio(cliente: Cliente, hoy: string) {
  const [avisos, actual, anterior, anio, productos, dias, pagos, sinDetalle] = await leerElInicio(
    cliente,
    hoy,
  );
  return {
    avisos: avisosDeInicio({ ...avisos, pagos }),
    actual,
    anterior,
    meses: resultadoPorMes(anio.ventas, anio.gastos),
    masVendidos: masVendidos(productosDelReporte(productos)),
    sinDetalle: sinDetalle.ventas,
    semana: semanaContraSemana(dias, hoy),
  };
}
