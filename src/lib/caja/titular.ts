import { textoDeDiferencia, type EstadoDeCierre } from './pantalla';
import type { Medio, ResultadoDeMedio } from './resultado';

const EN_FRASE: Record<Medio, string> = {
  efectivo: 'efectivo',
  credito: 'tarjeta de crédito',
  debito: 'tarjeta de débito',
  qr: 'QR',
  transferencia: 'transferencia',
};

// Un faltante en un medio y un sobrante en otro no se suman: se dice en cuantos no cierra.
function deUnCierreConDiferencia(medios: ResultadoDeMedio[]): string {
  const fuera = medios.filter((medio) => medio.fuera);
  const [uno] = fuera;
  if (fuera.length === 1 && uno) {
    return `${textoDeDiferencia(uno.diferenciaCentavos)} en ${EN_FRASE[uno.medio]}`;
  }
  return `No cierra en ${fuera.length} medios de pago`;
}

/** La frase grande de la ficha de un cierre: lo primero que se quiere saber es si cierra. */
export function titularDelCierre(
  cierre: { estado: EstadoDeCierre; anulado: boolean },
  medios: ResultadoDeMedio[],
): string {
  if (cierre.anulado) return 'Cierre anulado';
  if (cierre.estado === 'esperando_ventas') return 'Esperando las ventas del día';
  if (cierre.estado === 'cierra') return 'La caja cierra';
  return deUnCierreConDiferencia(medios);
}

/** Lo que se le explica a quien mira un cierre que todavia no tiene contra que compararse. */
export const explicacionDelCierre = (cierre: {
  estado: EstadoDeCierre;
  anulado: boolean;
}): string | null =>
  !cierre.anulado && cierre.estado === 'esperando_ventas'
    ? 'Guardado. El resultado va a estar cuando se carguen las ventas del día.'
    : null;
