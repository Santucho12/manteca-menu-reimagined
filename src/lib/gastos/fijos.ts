import { sumarDias } from '../reportes/periodos';
import type { FilaDeRecurrente } from './consultas';
import type { MedioDePago } from './esquemas';
import { nombreDelGasto } from './filas';
import { rangoDelMes } from './meses';
import { fechaParaMostrar } from './pantalla';
import { proximoVencimiento, type Frecuencia } from './vencimientos';

type Serie = { primer_vencimiento: string; frecuencia: Frecuencia; generar_desde: string | null };

export type ProximoPago = {
  id: string;
  nombre: string;
  frecuencia: Frecuencia;
  fecha: string;
  montoCentavos: number;
  medio: MedioDePago;
};

const UN_DIA = 86_400_000;
const CADA: Record<Frecuencia, string> = {
  mensual: 'todos los meses',
  bimestral: 'cada dos meses',
  anual: 'todos los años',
};

/** El primer pago después de hoy (el de hoy ya se cargó) y no antes de desde cuándo se carga. */
export function proximoPago(serie: Serie, hoy: string): string {
  const manana = sumarDias(hoy, 1);
  const desde = serie.generar_desde && serie.generar_desde > manana ? serie.generar_desde : manana;
  return proximoVencimiento(serie.primer_vencimiento, serie.frecuencia, desde);
}

/** Cuándo vence, en palabras; pasado un mes, la fecha entera: la baldosa no dice el año. */
export function cuandoVence(fecha: string, hoy: string): string {
  const dias = Math.round((Date.parse(fecha) - Date.parse(hoy)) / UN_DIA);
  if (dias < 0) return 'Vencido';
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Mañana';
  return dias <= 30 ? `En ${dias} días` : `El ${fechaParaMostrar(fecha)}`;
}

/** El próximo pago que todavía no se cargó: uno adelantado o anulado ya está tomado. */
function proximoLibre(r: FilaDeRecurrente, hoy: string, tomados: Set<string>): string {
  let fecha = proximoPago(r, hoy);
  while (tomados.has(`${r.id}|${fecha}`)) {
    fecha = proximoVencimiento(r.primer_vencimiento, r.frecuencia, sumarDias(fecha, 1));
  }
  return fecha;
}

/**
 * Cada fijo activo con su próximo pago, del más cercano al más lejano. `tomados` son los
 * vencimientos que ya tienen su por pagar, con la clave `fijo|fecha`.
 */
export function proximosPagos(
  recurrentes: FilaDeRecurrente[],
  hoy: string,
  tomados = new Set<string>(),
): ProximoPago[] {
  return recurrentes
    .filter((r) => r.activo)
    .map((r) => ({
      id: r.id,
      nombre: nombreDelGasto(r),
      frecuencia: r.frecuencia,
      fecha: proximoLibre(r, hoy, tomados),
      montoCentavos: r.monto_centavos,
      medio: r.medio_de_pago,
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.nombre.localeCompare(b.nombre, 'es'));
}

/** Lo que vence hasta el último día del mes de hoy, con lo ya vencido. */
export function faltaPagarEsteMes(
  proximos: { fecha: string; montoCentavos: number }[],
  hoy: string,
): number {
  const { hasta } = rangoDelMes(hoy.slice(0, 7));
  return proximos.filter((p) => p.fecha <= hasta).reduce((suma, p) => suma + p.montoCentavos, 0);
}

const diaYMes = (fecha: string) => fechaParaMostrar(fecha).slice(0, 5);

function comoEmpieza(fecha: string, hoy: string): string {
  if (fecha === hoy) return 'Vence hoy y después';
  if (fecha < hoy) return `Quedan por pagar los pagos del ${diaYMes(fecha)} a hoy, y después`;
  return `Vence el ${diaYMes(fecha)} y después`;
}

const MARCAR = 'Cada pago queda en Próximos pagos hasta que lo marques Pagado.';

const queDia = (fecha: string, frecuencia: Frecuencia) =>
  frecuencia === 'anual' ? `el ${diaYMes(fecha)}` : `el día ${Number(fecha.slice(8))}`;

// Un día que no existe en todos los meses (o el 29 de febrero, en los años) pasa al último.
const caeEnMesesCortos = (fecha: string, frecuencia: Frecuencia) =>
  frecuencia === 'anual' ? fecha.slice(5) === '02-29' : Number(fecha.slice(8)) >= 29;

/** Lo que va a pasar con un fijo que arranca en esa fecha, dicho en pocas frases. */
export function resumenDeRepeticion(fecha: string, frecuencia: Frecuencia, hoy: string): string {
  const frase = `${comoEmpieza(fecha, hoy)} ${CADA[frecuencia]}, ${queDia(fecha, frecuencia)}.`;
  const cortos = caeEnMesesCortos(fecha, frecuencia)
    ? ' En los meses más cortos, el último día.'
    : '';
  return `${frase}${cortos} ${MARCAR}`;
}

/** Si al editar cambia la fecha o la frecuencia: entonces el fijo cuenta desde el próximo pago. */
export function cambiaLaSerie(
  actual: Serie,
  enviado: { proximoPago: string; frecuencia: Frecuencia },
  hoy: string,
): boolean {
  return (
    enviado.frecuencia !== actual.frecuencia || enviado.proximoPago !== proximoPago(actual, hoy)
  );
}
