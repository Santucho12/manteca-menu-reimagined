import {
  diasConCierre,
  listarCierres,
  primerDiaConCierre,
  type FilaDeCierre,
} from '../caja/consultas';
import type { FiltrosDeControl } from '../caja/pantalla';
import { listarRecurrentes, type FilaDeRecurrente } from '../gastos/consultas';
import type { VentaDelDia } from '../reportes/ventas';
import { resumenDeAyer, sinAvisoSiAyerNoHuboVentas } from './ayer';
import { vencimientosDeLaSemana } from './vencimientos';
import { datosDelResultado, ventasPorDia, ventasPorProducto } from '../reportes/consultas';
import { periodoAnterior, sumarDias } from '../reportes/periodos';
import { resultadoPorMes } from '../reportes/resultado';
import { productosDelReporte } from '../reportes/ventas';
import type { Cliente } from '../supabase/cliente';
import { contarPendientes } from '../usuarios/consultas';
import { avisosDeInicio, type ConFecha, type DatosDeAvisos } from './avisos';
import { masVendidos, mesEnCurso, ultimosDoceMeses } from './meses';
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
    cierresConDiferencia(cliente, hoy),
    ayerSinCierre(cliente, hoy),
    contarPendientes(cliente),
    gastosSinClasificar(cliente),
  ]);
  return { conDiferencia, ayerSinCierre: ayer, pendientes, sinClasificar };
}

const filtrosDeAyer = (desde: string, hasta: string): FiltrosDeControl => ({
  desde,
  hasta,
  personaId: null,
  estado: null,
  anulados: false,
  pagina: 1,
});

async function cierresDeAyer(cliente: Cliente, hoy: string) {
  const ayer = sumarDias(hoy, -1);
  return (await listarCierres(cliente, filtrosDeAyer(ayer, ayer))).filas;
}

type Leido = {
  dias: VentaDelDia[];
  avisos: DatosDeAvisos;
  cierres: FilaDeCierre[];
  recurrentes: FilaDeRecurrente[];
};

/** Ayer, lo que vence en la semana y los avisos, que dependen de si ayer hubo ventas. */
function ayerYVencimientos({ dias, avisos, cierres, recurrentes }: Leido, hoy: string) {
  const ayer = resumenDeAyer(dias, cierres, hoy);
  const vencimientos = vencimientosDeLaSemana(recurrentes, hoy);
  const [unico] = vencimientos.items;
  const datos = {
    ...avisos,
    vencenEstaSemana: vencimientos.items.length,
    ...(vencimientos.items.length === 1 && unico
      ? { unVencimiento: { id: unico.id, fecha: unico.fecha } }
      : {}),
  };
  return {
    ayer,
    vencimientos,
    avisos: avisosDeInicio(sinAvisoSiAyerNoHuboVentas(datos, ayer.ventas)),
  };
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
    cierresDeAyer(cliente, hoy),
    listarRecurrentes(cliente),
  ]);
}

/** Todo lo de Inicio, con el mismo calculo que Reportes. */
export async function datosDelInicio(cliente: Cliente, hoy: string) {
  const [avisos, actual, anterior, anio, productos, dias, cierres, recurrentes] =
    await leerElInicio(cliente, hoy);
  return {
    ...ayerYVencimientos({ dias, avisos, cierres, recurrentes }, hoy),
    actual,
    anterior,
    meses: resultadoPorMes(anio.ventas, anio.gastos),
    masVendidos: masVendidos(productosDelReporte(productos)),
    semana: semanaContraSemana(dias, hoy),
  };
}
