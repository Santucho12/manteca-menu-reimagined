import { sumarDias } from '../reportes/periodos';
import type { FilaDeRecurrente } from './consultas';
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

export function cuandoVence(fecha: string, hoy: string): string | null {
  const dias = Math.round((Date.parse(fecha) - Date.parse(hoy)) / UN_DIA);
  if (dias === 1) return 'Mañana';
  return dias <= 30 ? `En ${dias} días` : null;
}

/** Cada fijo activo con su próximo pago, del más cercano al más lejano. */
export function proximosPagos(recurrentes: FilaDeRecurrente[], hoy: string): ProximoPago[] {
  return recurrentes
    .filter((r) => r.activo)
    .map((r) => ({
      id: r.id,
      nombre: nombreDelGasto(r),
      frecuencia: r.frecuencia,
      fecha: proximoPago(r, hoy),
      montoCentavos: r.monto_centavos,
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.nombre.localeCompare(b.nombre, 'es'));
}

/** Lo que vence de mañana al último día del mes de hoy. */
export function faltaPagarEsteMes(proximos: ProximoPago[], hoy: string): number {
  const { hasta } = rangoDelMes(hoy.slice(0, 7));
  return proximos.filter((p) => p.fecha <= hasta).reduce((suma, p) => suma + p.montoCentavos, 0);
}

const diaYMes = (fecha: string) => fechaParaMostrar(fecha).slice(0, 5);

function comoEmpieza(fecha: string, hoy: string): string {
  if (fecha === hoy) return 'Se carga hoy y después';
  if (fecha < hoy) return `Se cargan los pagos del ${diaYMes(fecha)} a hoy, y después`;
  return `Se carga el ${diaYMes(fecha)} y después`;
}

const queDia = (fecha: string, frecuencia: Frecuencia) =>
  frecuencia === 'anual' ? `el ${diaYMes(fecha)}` : `el día ${Number(fecha.slice(8))}`;

// Un día que no existe en todos los meses (o el 29 de febrero, en los años) pasa al último.
const caeEnMesesCortos = (fecha: string, frecuencia: Frecuencia) =>
  frecuencia === 'anual' ? fecha.slice(5) === '02-29' : Number(fecha.slice(8)) >= 29;

/** Lo que va a pasar con un fijo que arranca en esa fecha, dicho en una frase. */
export function resumenDeRepeticion(fecha: string, frecuencia: Frecuencia, hoy: string): string {
  const frase = `${comoEmpieza(fecha, hoy)} ${CADA[frecuencia]}, ${queDia(fecha, frecuencia)}.`;
  return caeEnMesesCortos(fecha, frecuencia)
    ? `${frase} En los meses más cortos, el último día.`
    : frase;
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
