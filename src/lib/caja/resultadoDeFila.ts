import { resultadoDelCierre, type ResultadoDelCierre } from './resultado';

/** Lo que devuelve cierres_con_resultado: lo declarado y lo vendido ese dia por medio. */
export type FilaConVentas = {
  fondo_inicial_centavos: number;
  efectivo_centavos: number;
  credito_centavos: number;
  debito_centavos: number;
  qr_centavos: number;
  transferencia_centavos: number;
  retiros_centavos: number;
  gastos_centavos: number;
  ventas_efectivo_centavos: number;
  ventas_credito_centavos: number;
  ventas_debito_centavos: number;
  ventas_qr_centavos: number;
  ventas_transferencia_centavos: number;
  tolerancia_centavos: number;
};

const declaradoDe = (f: FilaConVentas) => ({
  fondoInicialCentavos: f.fondo_inicial_centavos,
  retirosCentavos: f.retiros_centavos,
  gastosCentavos: f.gastos_centavos,
  medios: {
    efectivo: f.efectivo_centavos,
    credito: f.credito_centavos,
    debito: f.debito_centavos,
    qr: f.qr_centavos,
    transferencia: f.transferencia_centavos,
  },
});

const vendidoDe = (f: FilaConVentas) => ({
  efectivo: f.ventas_efectivo_centavos,
  credito: f.ventas_credito_centavos,
  debito: f.ventas_debito_centavos,
  qr: f.ventas_qr_centavos,
  transferencia: f.ventas_transferencia_centavos,
});

/**
 * El estado y la diferencia de cada medio de un cierre, contra las ventas de su dia. Las ventas
 * se cargan al cobrar (pedido 89): todo cierre se compara desde que se guarda.
 */
export function resultadoDeFila(fila: FilaConVentas): ResultadoDelCierre {
  return resultadoDelCierre(declaradoDe(fila), vendidoDe(fila), fila.tolerancia_centavos);
}
