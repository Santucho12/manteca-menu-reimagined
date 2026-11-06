import { textoDeDiferencia, type EstadoDeCierre } from './pantalla';

/** La frase grande de la ficha de un cierre: lo primero que se quiere saber es si cierra. */
export function titularDelCierre(
  cierre: { estado: EstadoDeCierre; anulado: boolean },
  diferenciaTotalCentavos: number,
): string {
  if (cierre.anulado) return 'Cierre anulado';
  if (cierre.estado === 'esperando_ventas') return 'Esperando las ventas del día';
  if (cierre.estado === 'cierra') return 'La caja cierra';
  return `${textoDeDiferencia(diferenciaTotalCentavos)} en total`;
}
