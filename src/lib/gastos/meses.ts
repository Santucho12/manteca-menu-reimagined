import { sumarMeses } from './vencimientos';

const NOMBRES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
const FORMATO = /^\d{4}-(0[1-9]|1[0-2])$/;

/** El mes de la URL (AAAA-MM). Si no vale o todavía no llegó, el de hoy: no se mira el futuro. */
export function mesDeLaUrl(texto: string | undefined, hoy: string): string {
  const actual = hoy.slice(0, 7);
  return texto && FORMATO.test(texto) && texto <= actual ? texto : actual;
}

export const mesAnterior = (mes: string) => sumarMeses(`${mes}-01`, -1).slice(0, 7);
export const mesSiguiente = (mes: string) => sumarMeses(`${mes}-01`, 1).slice(0, 7);

/** Del primero al último día: el 31 que no existe se recorta al último del mes. */
export const rangoDelMes = (mes: string) => ({
  desde: `${mes}-01`,
  hasta: sumarMeses(`${mes}-31`, 0),
});

export function nombreDelMes(mes: string): string {
  const [anio, numero] = mes.split('-');
  return `${NOMBRES[Number(numero) - 1]} ${anio}`;
}

export const esElMesDeHoy = (mes: string, hoy: string) => mes === hoy.slice(0, 7);
