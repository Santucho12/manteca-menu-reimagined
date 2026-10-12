import { fechaParaMostrar, mesDe } from '../gastos/pantalla';
import { esFechaValida } from '../gastos/vencimientos';
import { numeroDePagina, unValor } from '../usuarios/presentacion';

export type Periodo = { desde: string; hasta: string };
export type PeriodosDelReporte = {
  actual: Periodo;
  comparacion: Periodo;
  comparacionElegida: boolean;
  pagina: number;
};
export type ParametrosDeReporte = Record<string, string | string[] | undefined>;

const UN_DIA = 86_400_000;
const aTiempo = (dia: string) => Date.parse(`${dia}T00:00:00Z`);
const aDia = (tiempo: number) => new Date(tiempo).toISOString().slice(0, 10);

export const sumarDias = (dia: string, dias: number) => aDia(aTiempo(dia) + dias * UN_DIA);
export const diasDe = (periodo: Periodo) =>
  Math.round((aTiempo(periodo.hasta) - aTiempo(periodo.desde)) / UN_DIA) + 1;

const empiezaElDiaUno = (p: Periodo) =>
  p.desde.slice(8) === '01' && p.desde.slice(0, 7) === p.hasta.slice(0, 7);

/**
 * Del 1 a un dia del mes contra los mismos dias del mes anterior, como Inicio: el 11 compara
 * del 1 al 11 de cada mes. Un mes entero, o un dia que el mes anterior no tiene, contra el mes
 * anterior entero.
 */
function mismosDiasDelMesAnterior(periodo: Periodo): Periodo {
  const anterior = mesDe(sumarDias(periodo.desde, -1));
  if (periodo.hasta === mesDe(periodo.hasta).hasta) return anterior;
  const hasta = `${anterior.desde.slice(0, 8)}${periodo.hasta.slice(8)}`;
  return { desde: anterior.desde, hasta: hasta < anterior.hasta ? hasta : anterior.hasta };
}

/** Con que se compara un periodo si no se elige otro. */
export function periodoAnterior(periodo: Periodo): Periodo {
  if (empiezaElDiaUno(periodo)) return mismosDiasDelMesAnterior(periodo);
  return {
    desde: sumarDias(periodo.desde, -diasDe(periodo)),
    hasta: sumarDias(periodo.desde, -1),
  };
}

const fechaDe = (texto: string | undefined) => (texto && esFechaValida(texto) ? texto : null);
const ordenado = (a: string, b: string): Periodo =>
  a <= b ? { desde: a, hasta: b } : { desde: b, hasta: a };

function elegida(parametros: ParametrosDeReporte): Periodo | null {
  const desde = fechaDe(unValor(parametros.cdesde));
  const hasta = fechaDe(unValor(parametros.chasta));
  return desde && hasta ? ordenado(desde, hasta) : null;
}

/** El periodo y la comparacion, leidos de la URL; sin fechas, del 1 a hoy en Argentina. */
export function periodosDelReporte(
  parametros: ParametrosDeReporte,
  hoy: string,
): PeriodosDelReporte {
  const actual = ordenado(
    fechaDe(unValor(parametros.desde)) ?? mesDe(hoy).desde,
    fechaDe(unValor(parametros.hasta)) ?? hoy,
  );
  const comparacion = elegida(parametros);
  return {
    actual,
    comparacion: comparacion ?? periodoAnterior(actual),
    comparacionElegida: comparacion !== null,
    pagina: numeroDePagina(unValor(parametros.pagina)),
  };
}

export function atajos(hoy: string): { texto: string; periodo: Periodo }[] {
  const mes = mesDe(hoy);
  return [
    { texto: 'Este mes', periodo: { desde: mes.desde, hasta: hoy } },
    { texto: 'Mes pasado', periodo: mesDe(sumarDias(mes.desde, -1)) },
    { texto: 'Últimos 7 días', periodo: { desde: sumarDias(hoy, -6), hasta: hoy } },
  ];
}

export function enlaceDeReporte(
  ruta: string,
  periodos: { actual: Periodo; comparacion?: Periodo | null; pagina?: number },
): string {
  const parametros = new URLSearchParams(periodos.actual);
  if (periodos.comparacion) {
    parametros.set('cdesde', periodos.comparacion.desde);
    parametros.set('chasta', periodos.comparacion.hasta);
  }
  if (periodos.pagina && periodos.pagina > 1) parametros.set('pagina', String(periodos.pagina));
  return `${ruta}?${parametros.toString()}`;
}

export const textoDePeriodo = (periodo: Periodo) =>
  `del ${fechaParaMostrar(periodo.desde)} al ${fechaParaMostrar(periodo.hasta)}`;
