import { nombreDeMedio, textoDeDiferencia } from './pantalla';
import type { Medio, ResultadoDeMedio } from './resultado';

export type DiferenciaDeMedio = { medio: Medio; centavos: number };

/** Los medios que no dan exacto: un faltante y un sobrante iguales no se compensan. */
export const diferenciasPorMedio = (medios: ResultadoDeMedio[]): DiferenciaDeMedio[] =>
  medios
    .filter((m) => m.diferenciaCentavos !== 0)
    .map((m) => ({ medio: m.medio, centavos: m.diferenciaCentavos }));

/** "Efectivo: faltan $5.000,00" o "Tarjeta de crédito: sobran $5.000,00". */
export const textoDeDiferenciaDeMedio = ({ medio, centavos }: DiferenciaDeMedio): string =>
  `${nombreDeMedio(medio)}: ${textoDeDiferencia(centavos).toLowerCase()}`;

/**
 * Una diferencia dentro de la tolerancia no cuenta: va en gris. Fuera, falte o sobre, es una alerta
 * y va en rojo (Santiago, 2026-11-21: sin ámbar).
 */
export const tonoDeDiferencia = (estado: string): 'gris' | 'rojo' =>
  estado === 'cierra' ? 'gris' : 'rojo';
