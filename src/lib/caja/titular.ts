import { textoDeDiferencia, type EstadoDeCierre } from './pantalla';
import type { MedioDeVenta, ResultadoDeMedio } from './resultado';

const EN_FRASE: Record<MedioDeVenta, string> = {
  efectivo: 'efectivo',
  credito: 'tarjeta de crédito',
  debito: 'tarjeta de débito',
  qr: 'QR',
  transferencia: 'transferencia',
  fuera_de_caja: 'fuera de la caja',
};

/** El medio dicho dentro de una frase: "Faltan $500 en tarjeta de débito". */
export const medioEnFrase = (medio: MedioDeVenta) => EN_FRASE[medio];

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
  if (cierre.estado === 'cierra') return 'La caja cierra';
  return deUnCierreConDiferencia(medios);
}
