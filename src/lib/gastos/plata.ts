import { formatearPesos } from '../plata';

// Pesos con puntos de miles bien agrupados (o sin puntos) y hasta dos decimales con coma. Un
// punto suelto como decimal se rechaza: 1234.50 se lee distinto segun quien lo escribe.
const FORMA = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/;
const MAXIMO_DE_DIGITOS = 9;

/** Lee un monto escrito a mano y lo pasa a centavos; undefined si no se entiende o es cero. */
export function centavosDeMonto(texto: string): number | undefined {
  const partes = FORMA.exec(texto.trim().replace(/^\$\s*/, ''));
  if (!partes) return undefined;
  const pesos = partes[1]!.replaceAll('.', '');
  if (pesos.length > MAXIMO_DE_DIGITOS) return undefined;
  const total = Number(pesos) * 100 + Number((partes[2] ?? '').padEnd(2, '0'));
  return total > 0 ? total : undefined;
}

/** Un monto como se escribe en el formulario: 12.345,50, o 80 si no tiene centavos. */
export function montoParaEditar(centavos: number): string {
  return formatearPesos(centavos).slice(1).replace(/,00$/, '');
}
