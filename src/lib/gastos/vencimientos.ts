export type Frecuencia = 'mensual' | 'bimestral' | 'anual';

const MESES: Record<Frecuencia, number> = { mensual: 1, bimestral: 2, anual: 12 };
const dosCifras = (numero: number) => String(numero).padStart(2, '0');

/** Suma meses a un dia AAAA-MM-DD; si el dia no existe en ese mes, va el ultimo. */
export function sumarMeses(fecha: string, meses: number): string {
  const [anio, mes, dia] = fecha.split('-').map(Number) as [number, number, number];
  const indice = anio * 12 + (mes - 1) + meses;
  const nuevoAnio = Math.floor(indice / 12);
  const nuevoMes = (indice % 12) + 1;
  const ultimo = new Date(Date.UTC(nuevoAnio, nuevoMes, 0)).getUTCDate();
  return `${nuevoAnio}-${dosCifras(nuevoMes)}-${dosCifras(Math.min(dia, ultimo))}`;
}

/** Un dia AAAA-MM-DD que existe en el calendario. */
export function esFechaValida(texto: string): boolean {
  // Sumar cero meses recorta el dia y corre el mes: si no cambia nada, la fecha existia.
  return /^\d{4}-\d{2}-\d{2}$/.test(texto) && sumarMeses(texto, 0) === texto;
}

/** El primer vencimiento desde hoy, contado desde el primero como lo hace la base. */
export function proximoVencimiento(primero: string, frecuencia: Frecuencia, hoy: string): string {
  for (let k = 0; ; k += 1) {
    const vencimiento = sumarMeses(primero, k * MESES[frecuencia]);
    if (vencimiento >= hoy) return vencimiento;
  }
}
