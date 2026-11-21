import { centavosDeCaja } from './esquemas';

const MEDIOS = ['efectivo', 'credito', 'debito', 'qr', 'transferencia'] as const;
const enCentavos = (texto: string) => centavosDeCaja(texto) ?? 0;

type LoEscrito = Record<(typeof MEDIOS)[number], string> & {
  retiros: { monto: string }[];
  gastos: { monto: string }[];
};

/**
 * Lo que va contando quien carga, solo con lo que escribió: el cierre es a ciegas y no muestra lo
 * del sistema hasta guardar.
 */
export function contadoAlCargar(datos: LoEscrito) {
  const salidas = [...datos.retiros, ...datos.gastos];
  return {
    mediosCentavos: MEDIOS.reduce((suma, medio) => suma + enCentavos(datos[medio]), 0),
    salidasCentavos: salidas.reduce((suma, s) => suma + enCentavos(s.monto), 0),
  };
}
